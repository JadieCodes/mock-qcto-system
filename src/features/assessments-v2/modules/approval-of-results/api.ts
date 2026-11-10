import { appendAuditEntry, getAuditTrail } from '../../shared/audit/auditLog';
import { isChecklistComplete, type ChecklistSection } from '../../shared/checklist/types';
import { assertFileNotEmpty } from '../../shared/files/fileCheck';
import { addNotification } from '../../shared/notifications/store';
import { performAction } from '../../shared/workflow/engine';
import { listEnrolledLearnersByIds } from '../../mock/api/qaDomain';
import { readStore, writeStore } from '../../mock/api/storage';
import { onFileDocumentsFor } from '../../mock/data/onFileDocuments';
import { buildResultsComplianceChecklist } from '../../mock/data/resultsComplianceFolders';
import type { Role } from '../../types';
import { listRecords as listConfirmationRecords } from '../eisa-confirmation/api';
import type { EisaConfirmationRecord } from '../eisa-confirmation/types';
import { createVisit, listVisits, setResultsApprovedForSitting } from '../site-visits/api';
import { DEFAULT_NOTICE_LEAD_TIME_DAYS, PLANNER_ROLE, POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT } from '../site-visits/config';
import type { SiteVisit } from '../site-visits/types';
import { visitSittingIdsOf } from '../site-visits/visitQualifications';
import { listApplications } from '../qsa-addendum/api';
import { qualificationDetailsOf, resultsRulesIssue, snapshotResultsRules, type ResultsRules } from './componentSnapshot';
import { EISA_RESULTS_RECORD_TYPE, RESULTS_AD_ROLE } from './config';
import { reviewersFromAudit } from './downloads';
import { markEntryIssues } from './markEntry';
import { lastEisaDateOf } from './outcomeLetters';
import { buildVerificationCode } from './verificationCode';
import {
  competencyRatePercent,
  eisaSubmissionIssues,
  isBelowPostEisaThreshold,
  isRecommendDeclineAction,
  isRequestEvidenceAction,
  RESULTS_WORKFLOW,
  submissionDeadlineFor,
} from './workflow';
import type {
  CaptureLearner,
  EisaLearnerResult,
  EvidenceDocument,
  NewResultsBatchInput,
  OnFileDocument,
  OnFileDocumentRecord,
  ResultsBatch,
  ResultsDraft,
  ResultsFinalDecision,
} from './types';

export const KEY = 'approvalOfResults:batches';
// QCTO feedback 05.24: the QP's saved drafts, one per sitting that has no batch yet.
export const DRAFTS_KEY = 'approvalOfResults:drafts';

// Batch N1: a batch stored in the old 'declined' stage (before the decline became final) is a
// "More evidence requested" batch. Idempotent: a final decline always carries a finalDecision.
function loadAll(): ResultsBatch[] {
  return readStore<ResultsBatch[]>(KEY, []).map((b) =>
    b.workflow.stageId === 'declined' && !b.finalDecision ? { ...b, workflow: { ...b.workflow, stageId: 'more-evidence' } } : b,
  );
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

// QCTO feedback 29.31: batches stored before results were per component are cleared by the
// SEED_VERSION bump to 'A12' (drafts are new in 'A13'; learner ID numbers on results in 'A13.1') (mock/api/storage.ts), so no shape migration is needed here.
export async function listBatches(): Promise<ResultsBatch[]> {
  return loadAll();
}

export async function getBatch(id: string): Promise<ResultsBatch | undefined> {
  return loadAll().find((b) => b.id === id);
}

// QCTO feedback 29.31: the components a new batch for this sitting would get, so the QP's
// submit dialog can ask for a mark per component (blocked when resultsRulesIssue() gives a message).
export async function getResultsRulesForSitting(sittingId: string): Promise<ResultsRules> {
  const confirmation = (await listConfirmationRecords()).find((c) => c.sittingId === sittingId);
  if (!confirmation) return { components: [], addendumPassPercent: null };
  return snapshotResultsRules(await listApplications(), confirmation);
}

// QCTO feedback 29.25: the documents QCTO already holds for this sitting's qualification (mock
// entries today — mock/data/onFileDocuments.ts).
export async function listOnFileDocumentsForSitting(sittingId: string): Promise<OnFileDocument[]> {
  const confirmation = (await listConfirmationRecords()).find((c) => c.sittingId === sittingId);
  return confirmation ? onFileDocumentsFor(confirmation.qualificationTitle) : [];
}

function loadDrafts(): ResultsDraft[] {
  return readStore<ResultsDraft[]>(DRAFTS_KEY, []);
}

export async function listResultsDrafts(): Promise<ResultsDraft[]> {
  return loadDrafts();
}

export async function getResultsDraft(sittingId: string): Promise<ResultsDraft | null> {
  return loadDrafts().find((d) => d.sittingId === sittingId) ?? null;
}

// QCTO feedback 05.24: the learners on the sitting with the ID number the QA domain holds for each.
export async function listCaptureLearners(sittingId: string): Promise<CaptureLearner[]> {
  const confirmation = (await listConfirmationRecords()).find((c) => c.sittingId === sittingId);
  if (!confirmation) return [];
  const enrolled = await listEnrolledLearnersByIds(confirmation.learners.map((l) => l.learnerId));
  return confirmation.learners.map((l) => ({
    learnerId: l.learnerId,
    fullName: l.fullName,
    idNumber: enrolled.find((e) => e.id === l.learnerId)?.idNumber ?? '',
  }));
}

// "Save draft": unfinished marks are kept as typed — only Submit applies the checks.
export async function saveResultsDraft(input: { sittingId: string; learnerResults: EisaLearnerResult[]; savedBy: string }): Promise<ResultsDraft> {
  if (loadAll().some((b) => b.sittingId === input.sittingId)) throw new Error('A results batch has already been submitted for this sitting.');
  const confirmation = (await listConfirmationRecords()).find((c) => c.sittingId === input.sittingId);
  if (!confirmation || confirmation.workflow.stageId !== 'confirmed') throw new Error('Results can only be saved for a confirmed sitting.');
  const draft: ResultsDraft = { sittingId: input.sittingId, learnerResults: input.learnerResults, savedAt: new Date().toISOString(), savedBy: input.savedBy };
  writeStore(DRAFTS_KEY, [draft, ...loadDrafts().filter((d) => d.sittingId !== input.sittingId)]);
  return draft;
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
  // QCTO feedback 29.31: the components are snapshotted from the approved QASA now; without
  // them there is nothing to mark against, so the batch is blocked.
  const rules = snapshotResultsRules(await listApplications(), confirmation);
  const rulesIssue = resultsRulesIssue(rules);
  if (rulesIssue) throw new Error(rulesIssue);
  const { components, addendumPassPercent } = rules;
  // Row 40: a result per learner, not a hand-typed count — every learner on the sitting's
  // confirmed registration needs a mark per component (or Absent) before the batch is submitted.
  const rosterIds = new Set(confirmation.learners.map((l) => l.learnerId));
  if (input.learnerResults.length !== confirmation.learners.length || input.learnerResults.some((r) => !rosterIds.has(r.learnerId))) {
    throw new Error('Every registered learner needs marks (or Absent) before the batch can be submitted.');
  }
  const markIssues = markEntryIssues(components, input.learnerResults);
  if (markIssues.length > 0) throw new Error(markIssues[0].message);
  // QCTO feedback 29.23, 29.24, 29.25, 29.26: tagged evidence (no empty files), every "Already on
  // file" document confirmed or replaced, and the declaration.
  input.evidenceDocuments.forEach(assertFileNotEmpty);
  input.onFileChoices.forEach((c) => c.replacement && assertFileNotEmpty(c.replacement));
  const onFile = onFileDocumentsFor(confirmation.qualificationTitle);
  const documentIssues = eisaSubmissionIssues(input.evidenceDocuments, onFile, input.onFileChoices, input.declarationAccepted);
  if (documentIssues.length > 0) throw new Error(documentIssues[0].message);
  const decidedAt = new Date().toISOString();
  const onFileDocuments: OnFileDocumentRecord[] = onFile.map((doc) => {
    const picked = input.onFileChoices.find((c) => c.documentId === doc.id);
    const replacement = picked?.choice === 'replaced' ? picked.replacement : null;
    return { ...doc, choice: replacement ? 'replaced' : 'confirmed', replacement, decidedBy: input.submittedBy, decidedAt };
  });
  // Batch L2.1: the ID number is stored on each learner's result (from the QA learner record,
  // whether the marks were captured on screen or came from File 3).
  const enrolled = await listEnrolledLearnersByIds(confirmation.learners.map((l) => l.learnerId));
  const idNumberOf = (r: EisaLearnerResult) => enrolled.find((e) => e.id === r.learnerId)?.idNumber ?? r.idNumber;

  const batch: ResultsBatch = {
    id: crypto.randomUUID(),
    sittingId: confirmation.sittingId,
    sittingDate: confirmation.sittingDate,
    qualificationTitle: confirmation.qualificationTitle,
    ...qualificationDetailsOf(await listApplications(), confirmation),
    centres: confirmation.confirmedCentres?.map((c) => c.centre) ?? confirmation.centres,
    qpId: confirmation.qpId,
    qpName: confirmation.qpName,
    learnerCount: confirmation.learners.length,
    components,
    // resultsRulesIssue() above guarantees it is set.
    addendumPassPercent: addendumPassPercent ?? 0,
    learnerResults: input.learnerResults.map((r) => ({ ...r, idNumber: idNumberOf(r), marks: r.absent ? {} : r.marks })),
    evidenceDocuments: input.evidenceDocuments,
    onFileDocuments,
    declaration: { acceptedBy: input.submittedBy, acceptedById: input.submittedById, acceptedAt: decidedAt },
    complianceReviewNotes: '',
    evidenceEvaluationNotes: '',
    complianceChecklist: buildResultsComplianceChecklist(),
    workflow: { stageId: 'ad-review', submittedBy: input.submittedBy, submittedById: input.submittedById },
    cycleCount: 1,
    declineHistory: [],
    declineRecommendations: [],
    evidenceRequestedAt: null,
    finalEvidenceReceivedAt: null,
    finalDecision: null,
    submissionDeadline: submissionDeadlineFor(confirmation.sittingDate),
    submittedAt: new Date().toISOString(),
    recommendation: null,
    pemVisitId: null,
    createdBy: input.submittedBy,
  };
  saveAll([batch, ...all]);
  writeStore(DRAFTS_KEY, loadDrafts().filter((d) => d.sittingId !== input.sittingId));

  const actor = { actorRole: 'QP' as const, actorId: input.submittedById, actorName: input.submittedBy };
  onFileDocuments.forEach((d) =>
    appendAuditEntry({
      recordType: EISA_RESULTS_RECORD_TYPE,
      recordId: batch.id,
      ...actor,
      action: onFileAuditText(d),
    }),
  );
  appendAuditEntry({ recordType: EISA_RESULTS_RECORD_TYPE, recordId: batch.id, ...actor, action: 'Declaration made: results and evidence are accurate and complete' });

  addNotification({
    recipientRole: RESULTS_AD_ROLE,
    title: 'Results batch submitted',
    body: `${confirmation.qpName} submitted results for "${confirmation.qualificationTitle}" (EISA date ${confirmation.sittingDate}).`,
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

// The audit line for one "Already on file" choice (also used by the demo seed).
export function onFileAuditText(d: Pick<OnFileDocumentRecord, 'choice' | 'label' | 'replacement'>): string {
  return d.choice === 'replaced' && d.replacement
    ? `Already on file: replaced "${d.label}" with ${d.replacement.fileName}`
    : `Already on file: confirmed "${d.label}"`;
}

// The ASD can add a file during the review. It is tagged "Other evidence".
export async function uploadEvidenceDocument(id: string, file: { fileName: string; fileSize: number; fileType: string }): Promise<ResultsBatch> {
  assertFileNotEmpty(file);
  const all = loadAll();
  const batch = getOrThrow(all, id);
  const doc: EvidenceDocument = { ...file, tag: 'other', uploadedAt: new Date().toISOString() };
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
  // Batch N1: the Chief Director's final decline needs both lists (one or more lines each).
  irregularities?: string[];
  correctiveActions?: string[];
}

export const NEXT_APPROVER: Partial<Record<string, Role>> = {
  'ad-advance': 'Deputy Director',
  'dd-advance': 'Director',
  'director-advance': 'Chief Director',
  'dd-recommend-decline': 'Director',
  'director-recommend-decline': 'Chief Director',
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function nonEmptyLines(lines: string[] | undefined): string[] {
  return (lines ?? []).map((l) => l.trim()).filter(Boolean);
}

// Batch N1: the final decision on a batch. The code is numbered per financial year among the
// EISA batches already decided.
function finalDecisionFor(
  batch: ResultsBatch,
  all: ResultsBatch[],
  outcome: 'approved' | 'declined',
  actor: { id: string; name: string },
  lists: { irregularities: string[]; correctiveActions: string[] },
): ResultsFinalDecision {
  const decidedAt = new Date().toISOString();
  const existing = all.flatMap((b) => (b.finalDecision ? [b.finalDecision.verificationCode] : []));
  return {
    outcome,
    decidedAt,
    decidedBy: actor.name,
    decidedById: actor.id,
    verificationCode: buildVerificationCode('eisa', lastEisaDateOf(batch), today(), existing),
    ...lists,
    ...reviewersFromAudit(getAuditTrail(EISA_RESULTS_RECORD_TYPE, batch.id)),
  };
}

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
    // past cycle's reason so nothing is lost. Batch N1: "Date final outstanding evidence received".
    const updated: ResultsBatch = {
      ...batch,
      workflow: nextWorkflow,
      cycleCount: batch.cycleCount + 1,
      finalEvidenceReceivedAt: today(),
      complianceChecklist: buildResultsComplianceChecklist(),
      complianceReviewNotes: '',
      evidenceEvaluationNotes: '',
    };
    saveAll(replace(all, updated));
    addNotification({
      recipientRole: RESULTS_AD_ROLE,
      title: 'Results batch resubmitted',
      body: `"${batch.qualificationTitle}" was resubmitted with more evidence (cycle ${updated.cycleCount}).`,
    });
    return updated;
  }

  // Batch N1: the final decline needs both lists. The audit note carries them so the trail shows why.
  const isFinalDecline = params.actionId === 'chief-director-decline';
  const irregularities = nonEmptyLines(params.irregularities);
  const correctiveActions = nonEmptyLines(params.correctiveActions);
  if (isFinalDecline) {
    if (irregularities.length === 0) throw new Error('List at least one irregularity before declining the results.');
    if (correctiveActions.length === 0) throw new Error('List at least one corrective action before declining the results.');
  }
  const note = isFinalDecline ? `Irregularities: ${irregularities.join('; ')}. Corrective actions: ${correctiveActions.join('; ')}.` : params.note;

  const nextWorkflow = performAction({
    definition: RESULTS_WORKFLOW,
    record: batch.workflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note,
    recordType: 'results-batch',
    recordId: batch.id,
  });

  let updated: ResultsBatch = { ...batch, workflow: nextWorkflow };
  const actor = { actorRole: params.actorRole, actorId: params.actorId, actorName: params.actorName };

  if (isRequestEvidenceAction(params.actionId)) {
    updated = {
      ...updated,
      evidenceRequestedAt: today(),
      declineHistory: [
        ...updated.declineHistory,
        { stageId: batch.workflow.stageId, decidedBy: params.actorName, reason: params.note ?? '', decidedAt: new Date().toISOString() },
      ],
    };
    addNotification({
      recipientRole: 'QP',
      title: 'More evidence requested',
      body: `"${batch.qualificationTitle}": ${params.note ?? ''} Add the evidence and resubmit.`,
    });
  }

  if (isRecommendDeclineAction(params.actionId)) {
    updated = {
      ...updated,
      declineRecommendations: [
        ...updated.declineRecommendations,
        { stageId: batch.workflow.stageId, recommendedBy: params.actorName, reason: params.note ?? '', recommendedAt: new Date().toISOString(), cycle: batch.cycleCount },
      ],
    };
  }

  const nextApprover = NEXT_APPROVER[params.actionId];
  if (nextApprover) {
    addNotification({
      recipientRole: nextApprover,
      title: 'Results batch awaiting your review',
      body: `"${batch.qualificationTitle}" (EISA date ${batch.sittingDate}) is awaiting your review.`,
    });
  }

  if (isFinalDecline) {
    updated = { ...updated, finalDecision: finalDecisionFor(batch, all, 'declined', { id: params.actorId, name: params.actorName }, { irregularities, correctiveActions }) };
    appendAuditEntry({
      recordType: EISA_RESULTS_RECORD_TYPE,
      recordId: batch.id,
      ...actor,
      action: `Outcome letter (decline) generated. Verification code ${updated.finalDecision?.verificationCode ?? ''}`,
    });
    addNotification({
      recipientRole: 'QP',
      title: 'Results declined',
      body: `The results for "${batch.qualificationTitle}" were declined. Your Outcome Letter is ready to download. Please notify the SDPs.`,
    });
  }

  if (params.actionId === 'chief-director-approve') {
    updated = {
      ...updated,
      recommendation: { recommendedAt: new Date().toISOString(), recommendedBy: params.actorName },
      finalDecision: finalDecisionFor(batch, all, 'approved', { id: params.actorId, name: params.actorName }, { irregularities: [], correctiveActions: [] }),
    };
    // CR-059 hand-off: the Certification domain has no role in this build's Role union to
    // notify directly — simulated as an audit entry and the internal "Sent to Certification" list.
    appendAuditEntry({
      recordType: EISA_RESULTS_RECORD_TYPE,
      recordId: batch.id,
      ...actor,
      action: 'Recommendation letter sent to Certification',
    });
    addNotification({
      recipientRole: 'QP',
      title: 'Results batch approved',
      body: `"${batch.qualificationTitle}" results are approved. Your Outcome Letter is ready to download.`,
    });
  }

  saveAll(replace(all, updated));

  // QCTO feedback 2.8: final approval below the threshold creates the Post-EISA Monitoring visit.
  // A declined batch never does.
  if (params.actionId === 'chief-director-approve') {
    return ensurePemVisitForBatch(updated.id, { role: params.actorRole, id: params.actorId, name: params.actorName }, 'automatic');
  }
  return updated;
}

// CR-052: the linked Marking & Moderation monitoring status for the sitting, shown on the
// review screen.
export async function listMarkingModerationVisitsForSitting(sittingId: string): Promise<SiteVisit[]> {
  const visits = await listVisits();
  // Batch V1 (05.13): a Marking & Moderation visit can cover several sittings.
  return visits.filter((v) => v.visitType === 'marking-moderation' && visitSittingIdsOf(v).includes(sittingId));
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
      body: `"${batch.qualificationTitle}" (EISA date ${batch.sittingDate}) had a ${rate}% competency rate. Pick a date for the Post-EISA Monitoring visit in Site Visits & Monitoring.`,
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
