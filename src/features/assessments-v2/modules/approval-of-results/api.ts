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
import { DEFAULT_NOTICE_LEAD_TIME_DAYS, POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT } from '../site-visits/config';
import type { SiteVisit } from '../site-visits/types';
import { competencyRatePercent, RESULTS_WORKFLOW, submissionDeadlineFor } from './workflow';
import type { EvidenceDocument, NewResultsBatchInput, ResultsBatch } from './types';

const KEY = 'approvalOfResults:batches';

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

export async function listBatches(): Promise<ResultsBatch[]> {
  return loadAll();
}

export async function getBatch(id: string): Promise<ResultsBatch | undefined> {
  return loadAll().find((b) => b.id === id);
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
  if (input.competentCount < 0 || input.competentCount > confirmation.learners.length) {
    throw new Error('Competent learner count must be between 0 and the total number of registered learners.');
  }

  const batch: ResultsBatch = {
    id: crypto.randomUUID(),
    sittingId: confirmation.sittingId,
    sittingDate: confirmation.sittingDate,
    qualificationTitle: confirmation.qualificationTitle,
    qpId: confirmation.qpId,
    qpName: confirmation.qpName,
    learnerCount: confirmation.learners.length,
    competentCount: input.competentCount,
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
    recipientRole: 'Assistant Director',
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

const NEXT_APPROVER: Partial<Record<string, Role>> = {
  'ad-advance': 'Deputy Director',
  'dd-advance': 'Director',
  'director-advance': 'Chief Director',
};

export async function performResultsAction(params: ResultsActionParams): Promise<ResultsBatch> {
  const all = loadAll();
  const batch = getOrThrow(all, params.batchId);

  if (params.actionId === 'ad-advance') {
    if (!batch.complianceReviewNotes.trim()) throw new Error('Complete the compliance review notes before advancing.');
    if (!batch.evidenceEvaluationNotes.trim()) throw new Error('Complete the evidence evaluation notes before advancing.');
    if (!isChecklistComplete(batch.complianceChecklist, true)) {
      throw new Error('Every folder compliance line needs an answer and a comment before advancing.');
    }
  }

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
      recipientRole: 'Assistant Director',
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
      action: 'Recommended to the Certification domain for certificate printing (simulated — no screen in that domain yet, CR-059 hand-off)',
    });
    addNotification({
      recipientRole: 'QP',
      title: 'Results batch approved',
      body: `"${batch.qualificationTitle}" results are approved and recommended to Certification.`,
    });
  }

  saveAll(replace(all, updated));
  return updated;
}

// CR-052: the linked Marking & Moderation monitoring status for the sitting, shown on the
// review screen.
export async function listMarkingModerationVisitsForSitting(sittingId: string): Promise<SiteVisit[]> {
  const visits = await listVisits();
  return visits.filter((v) => v.visitType === 'marking-moderation' && v.sittingId === sittingId);
}

// PM-06: offered once the batch is approved and its competency rate is below the threshold
// shared with Post-EISA Monitoring's own placeholder (site-visits/config.ts — still
// unconfirmed with QCTO). Also closes the CR-057 loop: the created visit's "results approved"
// flag is set immediately, since it genuinely is coming from an approved batch rather than a
// manual toggle.
export async function createPemVisitForBatch(batchId: string, actorId: string, actorName: string): Promise<ResultsBatch> {
  const all = loadAll();
  const batch = getOrThrow(all, batchId);
  if (batch.workflow.stageId !== 'approved') {
    throw new Error('Only an approved results batch can trigger a Post-EISA Monitoring visit.');
  }
  if (batch.pemVisitId) {
    throw new Error('A Post-EISA Monitoring visit has already been created for this batch.');
  }
  if (competencyRatePercent(batch) >= POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT) {
    throw new Error('A Post-EISA Monitoring visit can only be offered when the batch competency rate is below the threshold.');
  }

  const visit = await createVisit({
    visitType: 'post-eisa-monitoring',
    qpId: batch.qpId,
    qpName: batch.qpName,
    qualificationTitle: batch.qualificationTitle,
    sdpId: null,
    sdpName: null,
    sittingId: batch.sittingId,
    visitDate: batch.sittingDate,
    venue: '',
    notificationFlag: 'notified',
    noticeLeadTimeDays: DEFAULT_NOTICE_LEAD_TIME_DAYS,
    createdBy: actorName,
    createdById: actorId,
  });
  await setResultsApprovedForSitting(visit.id, true);

  const updated: ResultsBatch = { ...batch, pemVisitId: visit.id };
  saveAll(replace(all, updated));
  return updated;
}
