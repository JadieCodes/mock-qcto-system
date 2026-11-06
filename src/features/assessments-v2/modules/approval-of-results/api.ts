import { appendAuditEntry } from '../../shared/audit/auditLog';
import { isChecklistComplete, type ChecklistSection } from '../../shared/checklist/types';
import { addNotification } from '../../shared/notifications/store';
import { performAction } from '../../shared/workflow/engine';
import { readStore, writeStore } from '../../mock/api/storage';
import { buildResultsComplianceChecklist } from '../../mock/data/resultsComplianceFolders';
import type { Role } from '../../types';
import { listRecords as listConfirmationRecords } from '../eisa-confirmation/api';
import type { EisaConfirmationRecord } from '../eisa-confirmation/types';
import { createVisit, listVisits, setResultsApprovedForSitting } from '../site-visits/api';
import { DEFAULT_NOTICE_LEAD_TIME_DAYS, PLANNER_ROLE, POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT } from '../site-visits/config';
import type { SiteVisit } from '../site-visits/types';
import { RESULTS_AD_ROLE } from './config';
import { competencyRatePercent, isBelowPostEisaThreshold, RESULTS_WORKFLOW, submissionDeadlineFor } from './workflow';
import type { EvidenceDocument, LearnerResult, NewResultsBatchInput, ResultsBatch } from './types';

export const KEY = 'approvalOfResults:batches';

function loadAll(): ResultsBatch[] {
  return readStore<ResultsBatch[]>(KEY, []);
}

function saveAll(batches: ResultsBatch[]): void {
  writeStore(KEY, batches);
}

function getOrThrow(batches: ResultsBatch[], id: string): ResultsBatch {
  const batch = batches.find((b) => b.id === id);
  if (!batch) throw new Error(`Results batch "${id}" not found.`);
  return batch;
}

function replace(batches: ResultsBatch[], updated: ResultsBatch): ResultsBatch[] {
  return batches.map((b) => (b.id === updated.id ? updated : b));
}

// Row 40: older seed/demo data (and anything saved before this fix) only ever carried a single
// hand-typed `competentCount`/`learnerCount`, with no per-learner breakdown. Migrated the same
// way Fix 1B-i/Fix 2C migrate old localStorage shapes — on read, not destructively — so old
// data keeps working instead of crashing the per-learner UI. The roster comes from the
// sitting's EISA Confirmation record where it still exists; the first `competentCount` learners
// (in that roster's order) are read as Competent so the competency rate is unchanged by the
// migration itself.
function needsLegacyMigration(batch: ResultsBatch): boolean {
  return !Array.isArray(batch.learnerResults);
}

async function migrateLegacyBatches(batches: ResultsBatch[]): Promise<ResultsBatch[]> {
  if (!batches.some(needsLegacyMigration)) return batches;
  const confirmations = await listConfirmationRecords();
  const migrated = batches.map((batch) => {
    if (!needsLegacyMigration(batch)) return batch;
    const legacyCompetentCount = (batch as unknown as { competentCount?: number }).competentCount ?? 0;
    const outcomeFor = (index: number): LearnerResult['outcome'] => (index < legacyCompetentCount ? 'competent' : 'not-yet-competent');
    const roster = confirmations.find((c) => c.sittingId === batch.sittingId)?.learners ?? [];
    const learnerResults: LearnerResult[] =
      roster.length > 0
        ? roster.map((learner, index) => ({ learnerId: learner.learnerId, fullName: learner.fullName, outcome: outcomeFor(index) }))
        : Array.from({ length: batch.learnerCount }, (_, index) => ({
            learnerId: `legacy-${batch.id}-${index}`,
            fullName: `Learner ${index + 1}`,
            outcome: outcomeFor(index),
          }));
    return { ...batch, learnerResults, learnerCount: learnerResults.length };
  });
  saveAll(migrated);
  return migrated;
}

export async function listBatches(): Promise<ResultsBatch[]> {
  return migrateLegacyBatches(loadAll());
}

export async function getBatch(id: string): Promise<ResultsBatch | undefined> {
  const all = await migrateLegacyBatches(loadAll());
  return all.find((b) => b.id === id);
}

// CR-059: only sittings with a fully CONFIRMED EISA Confirmation, and without an existing
// batch yet, can have results submitted against them — Confirmation is the last step before
// Approval of Results on the main highway and already carries the QP-confirmed learner list
// this module needs (assumption — see progress.md).
export async function listSittingsAwaitingSubmission(): Promise<EisaConfirmationRecord[]> {
  const confirmed = (await listConfirmationRecords()).filter((r) => r.workflow.stageId === 'confirmed');
  const existing = loadAll();
  const submitted = new Set(existing.map((b) => b.sittingId));
  return confirmed.filter((r) => !submitted.has(r.sittingId));
}

export async function submitResultsBatch(input: NewResultsBatchInput): Promise<ResultsBatch> {
  const all = loadAll();
  if (all.some((b) => b.sittingId === input.sittingId)) {
    throw new Error('A results batch has already been submitted for this sitting.');
  }

  const confirmation = (await listConfirmationRecords()).find((c) => c.sittingId === input.sittingId);
  if (!confirmation) throw new Error('EISA Confirmation not found for this sitting.');
  if (confirmation.workflow.stageId !== 'confirmed') {
    throw new Error('The sitting must be fully confirmed before results can be submitted.');
  }
  // Row 40: a result per learner, not a hand-typed count — every learner on the sitting's
  // confirmed registration needs a result before the batch can be submitted at all.
  const rosterIds = new Set(confirmation.learners.map((l) => l.learnerId));
  if (input.learnerResults.length !== confirmation.learners.length || input.learnerResults.some((r) => !rosterIds.has(r.learnerId))) {
    throw new Error('Every registered learner needs a result (Competent or Not yet competent) before the batch can be submitted.');
  }

  const batch: ResultsBatch = {
    id: crypto.randomUUID(),
    sittingId: confirmation.sittingId,
    sittingDate: confirmation.sittingDate,
    qualificationTitle: confirmation.qualificationTitle,
    qpId: confirmation.qpId,
    qpName: confirmation.qpName,
    learnerCount: confirmation.learners.length,
    learnerResults: input.learnerResults,
    evidenceDocuments: input.evidenceDocuments,
    complianceReviewNotes: '',
    evidenceEvaluationNotes: '',
    complianceChecklist: buildResultsComplianceChecklist(),
    workflow: { stageId: 'ad-review', submittedBy: input.submittedBy, submittedById: input.submittedById },
    cycleCount: 1,
    declineHistory: [],
    submissionDeadline: submissionDeadlineFor(confirmation.sittingDate),
    submittedAt: new Date().toISOString(),
    recommendation: null,
    pemVisitId: null,
    createdBy: input.submittedBy,
  };
  saveAll([batch, ...all]);

  addNotification({
    recipientRole: RESULTS_AD_ROLE,
    title: 'Results batch submitted',
    body: `${confirmation.qpName} submitted results for "${confirmation.qualificationTitle}" (${confirmation.sittingDate}).`,
  });

  return batch;
}

export async function saveComplianceChecklist(id: string, sections: ChecklistSection[]): Promise<ResultsBatch> {
  const all = loadAll();
  const updated = { ...getOrThrow(all, id), complianceChecklist: sections };
  saveAll(replace(all, updated));
  return updated;
}

export async function saveComplianceReviewNotes(id: string, notes: string): Promise<ResultsBatch> {
  const all = loadAll();
  const updated = { ...getOrThrow(all, id), complianceReviewNotes: notes };
  saveAll(replace(all, updated));
  return updated;
}

export async function saveEvidenceEvaluationNotes(id: string, notes: string): Promise<ResultsBatch> {
  const all = loadAll();
  const updated = { ...getOrThrow(all, id), evidenceEvaluationNotes: notes };
  saveAll(replace(all, updated));
  return updated;
}

export async function uploadEvidenceDocument(id: string, file: { fileName: string; fileSize: number }): Promise<ResultsBatch> {
  const all = loadAll();
  const batch = getOrThrow(all, id);
  const doc: EvidenceDocument = { ...file, uploadedAt: new Date().toISOString() };
  const updated = { ...batch, evidenceDocuments: [...batch.evidenceDocuments, doc] };
  saveAll(replace(all, updated));
  return updated;
}

interface ResultsActionParams {
  batchId: string;
  actionId: string;
  actorRole: Role;
  actorId: string;
  actorName: string;
  note?: string;
}

export const NEXT_APPROVER: Partial<Record<string, Role>> = {
  'ad-advance': 'Deputy Director',
  'dd-advance': 'Director',
  'director-advance': 'Chief Director',
};

// CR-059: the ASD's three-part review must be complete before the batch goes to the Deputy
// Director. One check for EISA and FISA batches (QCTO feedback 3.14).
export function assertAsdReviewComplete(review: Pick<ResultsBatch, 'complianceReviewNotes' | 'evidenceEvaluationNotes' | 'complianceChecklist'>): void {
  if (!review.complianceReviewNotes.trim()) throw new Error('Complete the compliance review notes before advancing.');
  if (!review.evidenceEvaluationNotes.trim()) throw new Error('Complete the evidence evaluation notes before advancing.');
  if (!isChecklistComplete(review.complianceChecklist, true)) {
    throw new Error('Every folder compliance line needs an answer and a comment before advancing.');
  }
}

export async function performResultsAction(params: ResultsActionParams): Promise<ResultsBatch> {
  const all = loadAll();
  const batch = getOrThrow(all, params.batchId);

  if (params.actionId === 'ad-advance') assertAsdReviewComplete(batch);

  if (params.actionId === 'batch-resubmit') {
    const nextWorkflow = performAction({
      definition: RESULTS_WORKFLOW,
      record: batch.workflow,
      actionId: 'batch-resubmit',
      actorRole: params.actorRole,
      actorId: params.actorId,
      actorName: params.actorName,
      recordType: 'results-batch',
      recordId: batch.id,
    });
    // CR-023-style resubmission cycle (same pattern as Instrument Validation): a fresh
    // checklist and review notes for a genuine re-check, while declineHistory keeps every
    // past cycle's reason so nothing is lost.
    const updated: ResultsBatch = {
      ...batch,
      workflow: nextWorkflow,
      cycleCount: batch.cycleCount + 1,
      complianceChecklist: buildResultsComplianceChecklist(),
      complianceReviewNotes: '',
      evidenceEvaluationNotes: '',
    };
    saveAll(replace(all, updated));
    addNotification({
      recipientRole: RESULTS_AD_ROLE,
      title: 'Results batch resubmitted',
      body: `"${batch.qualificationTitle}" was resubmitted after being declined (cycle ${updated.cycleCount}).`,
    });
    return updated;
  }

  const nextWorkflow = performAction({
    definition: RESULTS_WORKFLOW,
    record: batch.workflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: params.note,
    recordType: 'results-batch',
    recordId: batch.id,
  });

  let updated: ResultsBatch = { ...batch, workflow: nextWorkflow };

  if (params.actionId.endsWith('-decline')) {
    updated = {
      ...updated,
      declineHistory: [
        ...updated.declineHistory,
        { stageId: batch.workflow.stageId, decidedBy: params.actorName, reason: params.note ?? '', decidedAt: new Date().toISOString() },
      ],
    };
    addNotification({
      recipientRole: 'QP',
      title: 'Results batch declined',
      body: `"${batch.qualificationTitle}" was declined: ${params.note ?? ''}`,
    });
  }

  const nextApprover = NEXT_APPROVER[params.actionId];
  if (nextApprover) {
    addNotification({
      recipientRole: nextApprover,
      title: 'Results batch awaiting your review',
      body: `"${batch.qualificationTitle}" (${batch.sittingDate}) is awaiting your review.`,
    });
  }

  if (params.actionId === 'chief-director-approve') {
    updated = { ...updated, recommendation: { recommendedAt: new Date().toISOString(), recommendedBy: params.actorName } };
    // CR-059 hand-off: the Certification domain has no role in this build's Role union to
    // notify directly — simulated as an audit entry, same pattern as PM-07/PM-08's QA and
    // Accreditation hand-offs elsewhere in this domain.
    appendAuditEntry({
      recordType: 'results-batch',
      recordId: batch.id,
      actorRole: params.actorRole,
      actorId: params.actorId,
      actorName: params.actorName,
      action: 'Recommended to the Certification domain for certificate printing (simulated)',
    });
    addNotification({
      recipientRole: 'QP',
      title: 'Results batch approved',
      body: `"${batch.qualificationTitle}" results are approved and recommended to Certification.`,
    });
  }

  saveAll(replace(all, updated));

  // QCTO feedback 2.8: final approval below the threshold creates the Post-EISA Monitoring visit.
  if (params.actionId === 'chief-director-approve') {
    return ensurePemVisitForBatch(updated.id, { role: params.actorRole, id: params.actorId, name: params.actorName }, 'automatic');
  }
  return updated;
}

// CR-052: the linked Marking & Moderation monitoring status for the sitting, shown on the
// review screen.
export async function listMarkingModerationVisitsForSitting(sittingId: string): Promise<SiteVisit[]> {
  const visits = await listVisits();
  return visits.filter((v) => v.visitType === 'marking-moderation' && v.sittingId === sittingId);
}

interface PemActor {
  role: Role;
  id: string;
  name: string;
}

// QCTO feedback 2.8: an approved batch below the threshold gets exactly one Post-EISA
// Monitoring visit. Safe to call any number of times: it does nothing once the batch has a
// visit, and it links (never duplicates) a Post-EISA visit that already exists for the sitting.
// The visit starts "To be scheduled" with no date — the planner picks it in Site Visits. Also
// closes the CR-057 loop: the visit's "results approved" flag is set at once.
async function ensurePemVisitForBatch(batchId: string, actor: PemActor, how: 'automatic' | 'manual'): Promise<ResultsBatch> {
  const batch = getOrThrow(loadAll(), batchId);
  if (batch.workflow.stageId !== 'approved' || !isBelowPostEisaThreshold(batch) || batch.pemVisitId) return batch;

  const rate = competencyRatePercent(batch);
  const existing = (await listVisits()).find((v) => v.visitType === 'post-eisa-monitoring' && v.sittingId === batch.sittingId);
  let visitId = existing?.id;
  if (!visitId) {
    const visit = await createVisit({
      visitType: 'post-eisa-monitoring',
      qpId: batch.qpId,
      qpName: batch.qpName,
      qualificationTitle: batch.qualificationTitle,
      sdpId: null,
      sdpName: null,
      sittingId: batch.sittingId,
      visitDate: '',
      venue: '',
      notificationFlag: 'notified',
      noticeLeadTimeDays: DEFAULT_NOTICE_LEAD_TIME_DAYS,
      createdBy: actor.name,
      createdById: actor.id,
    });
    await setResultsApprovedForSitting(visit.id, true);
    visitId = visit.id;
    appendAuditEntry({
      recordType: 'site-visit-planning',
      recordId: visit.id,
      actorRole: actor.role,
      actorId: actor.id,
      actorName: actor.name,
      action:
        how === 'automatic'
          ? `Created automatically: results batch approved with a ${rate}% competency rate (below ${POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT}%). To be scheduled.`
          : `Created from the results batch (${rate}% competency rate, below ${POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT}%). To be scheduled.`,
    });
    addNotification({
      recipientRole: PLANNER_ROLE,
      title: 'Post-EISA Monitoring visit to be scheduled',
      body: `"${batch.qualificationTitle}" (${batch.sittingDate}) had a ${rate}% competency rate. Pick a date for the Post-EISA Monitoring visit in Site Visits & Monitoring.`,
    });
  }

  const updated: ResultsBatch = { ...batch, pemVisitId: visitId };
  saveAll(replace(loadAll(), updated));
  appendAuditEntry({
    recordType: 'results-batch',
    recordId: batch.id,
    actorRole: actor.role,
    actorId: actor.id,
    actorName: actor.name,
    action: existing ? 'Linked to the existing Post-EISA Monitoring visit for this sitting' : 'Post-EISA Monitoring visit created — waiting for a date',
  });
  return updated;
}

// QCTO feedback 2.8: the manual button is only a fallback, for an approved batch below the
// threshold that has no visit yet (for example one approved before the automatic trigger).
export async function createPemVisitForBatch(batchId: string, actorRole: Role, actorId: string, actorName: string): Promise<ResultsBatch> {
  const batch = getOrThrow(loadAll(), batchId);
  if (batch.workflow.stageId !== 'approved') {
    throw new Error('Only an approved results batch can trigger a Post-EISA Monitoring visit.');
  }
  if (batch.pemVisitId) {
    throw new Error('A Post-EISA Monitoring visit has already been created for this batch.');
  }
  if (!isBelowPostEisaThreshold(batch)) {
    throw new Error(`A Post-EISA Monitoring visit is only needed when the competency rate is below ${POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT}%.`);
  }
  return ensurePemVisitForBatch(batchId, { role: actorRole, id: actorId, name: actorName }, 'manual');
}
