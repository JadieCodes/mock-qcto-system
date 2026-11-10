// QCTO feedback 3.14: FISA results in Approval of Results. FISA is decentralised: there is no
// QP, the SDP conducts the assessment and submits the results batch for an Approved FISA
// Standard. Internally the batch goes through the same chain and checks as an EISA batch
// (api.ts): ASD compliance and evidence review, Deputy Director, Director, Chief Director.
// There is no Post-EISA Monitoring visit for FISA.
import { appendAuditEntry, getAuditTrail } from '../../shared/audit/auditLog';
import type { ChecklistSection } from '../../shared/checklist/types';
import { assertFileNotEmpty } from '../../shared/files/fileCheck';
import { addNotification } from '../../shared/notifications/store';
import { performAction } from '../../shared/workflow/engine';
import { listEnrolledLearners } from '../../mock/api/qaDomain';
import { readStore, writeStore } from '../../mock/api/storage';
import { buildResultsComplianceChecklist } from '../../mock/data/resultsComplianceFolders';
import { getSkillsProgrammeDetails } from '../../mock/data/skillsProgrammeDetails';
import type { EnrolledLearner } from '../../mock/data/enrolledLearners';
import type { Role } from '../../types';
import { listApprovedFisaStandards } from '../fisa/api';
import type { FisaStandardRecord } from '../fisa/types';
import { assertAsdReviewComplete, NEXT_APPROVER } from './api';
import { FISA_RESULTS_RECORD_TYPE, FISA_RESULTS_SUBMITTER_ROLE, RESULTS_AD_ROLE, RESULTS_DD_ROLE } from './config';
import { reviewersFromAudit } from './downloads';
import { assertFisaSectionEComplete, blankSectionE, SECTION_E_ASD_FIELDS, SECTION_E_DD_FIELDS } from './fisaSectionE';
import { lastFisaDateOf } from './outcomeLetters';
import { buildVerificationCode } from './verificationCode';
import { FISA_RESULTS_WORKFLOW, fisaSubmissionIssues, isRecommendDeclineAction, isRequestEvidenceAction } from './workflow';
import type {
  FisaResultsBatch,
  FisaResultsDraftPatch,
  FisaSectionE,
  LearnerResult,
  NewFisaResultsBatchInput,
  ResultsFinalDecision,
  TaggedEvidenceDocument,
} from './types';

export const FISA_RESULTS_KEY = 'approvalOfResults:fisaBatches';

// Batch N1: a batch stored in the old 'declined' stage (before the decline became final) is a
// "More evidence requested" batch. Idempotent: a final decline always carries a finalDecision.
// Batch N2: a batch stored before N2 has no Section E and no first-submission date; it gets a blank
// Section E and its submission date (each only when missing, so this can run any number of times).
type StoredFisaBatch = Omit<FisaResultsBatch, 'sectionE' | 'firstSubmittedAt'> & Partial<Pick<FisaResultsBatch, 'sectionE' | 'firstSubmittedAt'>>;

function loadAll(): FisaResultsBatch[] {
  return readStore<StoredFisaBatch[]>(FISA_RESULTS_KEY, []).map((b) => ({
    ...b,
    workflow: b.workflow.stageId === 'declined' && !b.finalDecision ? { ...b.workflow, stageId: 'more-evidence' } : b.workflow,
    sectionE: b.sectionE ?? blankSectionE(),
    firstSubmittedAt: b.firstSubmittedAt ?? b.submittedAt,
  }));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function nonEmptyLines(lines: string[] | undefined): string[] {
  return (lines ?? []).map((l) => l.trim()).filter(Boolean);
}

function fisaFinalDecisionFor(
  batch: FisaResultsBatch,
  all: FisaResultsBatch[],
  outcome: 'approved' | 'declined',
  actor: { id: string; name: string },
  lists: { irregularities: string[]; correctiveActions: string[] },
): ResultsFinalDecision {
  const existing = all.flatMap((b) => (b.finalDecision ? [b.finalDecision.verificationCode] : []));
  return {
    outcome,
    decidedAt: new Date().toISOString(),
    decidedBy: actor.name,
    decidedById: actor.id,
    verificationCode: buildVerificationCode('fisa', lastFisaDateOf(batch), today(), existing),
    ...lists,
    ...reviewersFromAudit(getAuditTrail(FISA_RESULTS_RECORD_TYPE, batch.id)),
  };
}

function saveAll(batches: FisaResultsBatch[]): void {
  writeStore(FISA_RESULTS_KEY, batches);
}

function getOrThrow(batches: FisaResultsBatch[], id: string): FisaResultsBatch {
  const batch = batches.find((b) => b.id === id);
  if (!batch) throw new Error(`FISA results batch "${id}" not found.`);
  return batch;
}

function replace(batches: FisaResultsBatch[], updated: FisaResultsBatch): FisaResultsBatch[] {
  return batches.map((b) => (b.id === updated.id ? updated : b));
}

export async function listFisaResultsBatches(): Promise<FisaResultsBatch[]> {
  return loadAll();
}

export async function getFisaResultsBatch(id: string): Promise<FisaResultsBatch | undefined> {
  return loadAll().find((b) => b.id === id);
}

// Results can only be submitted for a skills programme whose FISA Standard is Approved.
export async function listFisaStandardsForResults(): Promise<FisaStandardRecord[]> {
  return listApprovedFisaStandards();
}

// The learner list comes from the SDP's enrolled learners (Quality Assurance domain, CR-036).
export async function listLearnersForSdp(sdpName: string): Promise<EnrolledLearner[]> {
  return listEnrolledLearners(sdpName);
}

export async function createFisaResultsBatch(input: NewFisaResultsBatchInput): Promise<FisaResultsBatch> {
  const standard = (await listApprovedFisaStandards()).find((s) => s.id === input.fisaStandardId);
  if (!standard) throw new Error('Results can only be submitted for a skills programme whose FISA Standard is Approved.');
  if (!input.fisaDate) throw new Error('Enter the date of the FISA.');

  const batch: FisaResultsBatch = {
    id: crypto.randomUUID(),
    fisaStandardId: standard.id,
    skillsProgrammeTitle: standard.skillsProgrammeTitle,
    ...getSkillsProgrammeDetails(standard.skillsProgrammeTitle),
    fisaDates: [input.fisaDate],
    recommendationsForImprovement: '',
    sectionE: blankSectionE(),
    sdpId: input.sdpId,
    sdpName: input.sdpName,
    learnerResults: [],
    evidenceDocuments: [],
    declaration: null,
    complianceReviewNotes: '',
    evidenceEvaluationNotes: '',
    complianceChecklist: buildResultsComplianceChecklist(),
    workflow: { stageId: 'sdp-draft' },
    cycleCount: 1,
    declineHistory: [],
    declineRecommendations: [],
    evidenceRequestedAt: null,
    finalEvidenceReceivedAt: null,
    finalDecision: null,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
    createdById: input.createdById,
    submittedAt: null,
    firstSubmittedAt: null,
    recommendation: null,
    approvalLetter: null,
  };
  // No audit entry yet: a draft is the SDP's own work until it is submitted.
  saveAll([batch, ...loadAll()]);
  return batch;
}

function assertOwnDraft(batch: FisaResultsBatch, sdpId: string): void {
  if (batch.workflow.stageId !== 'sdp-draft') throw new Error('The batch can only be changed before it is submitted.');
  if (batch.sdpId !== sdpId) throw new Error('Only the SDP that created this batch can change it.');
}

async function assertLearnersBelongToSdp(batch: FisaResultsBatch, learnerResults: LearnerResult[]): Promise<void> {
  const enrolled = new Set((await listEnrolledLearners(batch.sdpName)).map((l) => l.id));
  if (learnerResults.some((r) => !enrolled.has(r.learnerId))) throw new Error('Every learner on the batch must be enrolled at this SDP.');
  if (new Set(learnerResults.map((r) => r.learnerId)).size !== learnerResults.length) throw new Error('A learner can only appear once on a batch.');
}

// The SDP's draft saves as it is edited.
export async function saveFisaResultsDraft(id: string, sdpId: string, patch: FisaResultsDraftPatch): Promise<FisaResultsBatch> {
  const all = loadAll();
  const batch = getOrThrow(all, id);
  assertOwnDraft(batch, sdpId);
  if (patch.learnerResults) await assertLearnersBelongToSdp(batch, patch.learnerResults);
  patch.evidenceDocuments?.forEach(assertFileNotEmpty);
  const updated: FisaResultsBatch = { ...batch, ...patch };
  saveAll(replace(all, updated));
  return updated;
}

interface FisaActor {
  role: Role;
  id: string;
  name: string;
}

export async function submitFisaResultsBatch(id: string, actor: FisaActor, declarationAccepted: boolean): Promise<FisaResultsBatch> {
  const all = loadAll();
  const batch = getOrThrow(all, id);
  assertOwnDraft(batch, actor.id);
  const issues = fisaSubmissionIssues(batch, declarationAccepted);
  if (issues.length > 0) throw new Error(issues[0].message);
  await assertLearnersBelongToSdp(batch, batch.learnerResults);

  const workflow = performAction({
    definition: FISA_RESULTS_WORKFLOW,
    record: batch.workflow,
    actionId: 'fisa-submit',
    actorRole: actor.role,
    actorId: actor.id,
    actorName: actor.name,
    recordType: FISA_RESULTS_RECORD_TYPE,
    recordId: batch.id,
  });
  const now = new Date().toISOString();
  const updated: FisaResultsBatch = {
    ...batch,
    workflow,
    declaration: { acceptedBy: actor.name, acceptedById: actor.id, acceptedAt: now },
    submittedAt: now,
    firstSubmittedAt: now,
  };
  saveAll(replace(all, updated));
  addNotification({
    recipientRole: RESULTS_AD_ROLE,
    title: 'FISA results batch submitted',
    body: `${batch.sdpName} submitted FISA results for "${batch.skillsProgrammeTitle}".`,
  });
  return updated;
}

function assertAsdReviewStage(batch: FisaResultsBatch): void {
  if (batch.workflow.stageId !== 'ad-review') throw new Error('The compliance review can only be changed while the batch is with the ASD.');
}

export async function saveFisaComplianceChecklist(id: string, sections: ChecklistSection[]): Promise<FisaResultsBatch> {
  const all = loadAll();
  const batch = getOrThrow(all, id);
  assertAsdReviewStage(batch);
  const updated = { ...batch, complianceChecklist: sections };
  saveAll(replace(all, updated));
  return updated;
}

export async function saveFisaComplianceReviewNotes(id: string, notes: string): Promise<FisaResultsBatch> {
  const all = loadAll();
  const batch = getOrThrow(all, id);
  assertAsdReviewStage(batch);
  const updated = { ...batch, complianceReviewNotes: notes };
  saveAll(replace(all, updated));
  return updated;
}

export async function saveFisaEvidenceEvaluationNotes(id: string, notes: string): Promise<FisaResultsBatch> {
  const all = loadAll();
  const batch = getOrThrow(all, id);
  assertAsdReviewStage(batch);
  const updated = { ...batch, evidenceEvaluationNotes: notes };
  saveAll(replace(all, updated));
  return updated;
}

// Batch N1: the ASD's "Recommendations for improvements to be in place before the next FISA",
// printed on the outcome letter.
export async function saveFisaRecommendations(id: string, text: string): Promise<FisaResultsBatch> {
  const all = loadAll();
  const batch = getOrThrow(all, id);
  assertAsdReviewStage(batch);
  const updated = { ...batch, recommendationsForImprovement: text };
  saveAll(replace(all, updated));
  return updated;
}

// Batch N2: Section E of QCTO's FISA report. The ASD fills E1 while the batch is with the ASD; the
// Deputy Director fills the compliance statement in E2 while it is with the Deputy Director.
export async function saveFisaSectionE(id: string, patch: Partial<FisaSectionE>, actorRole: Role): Promise<FisaResultsBatch> {
  const all = loadAll();
  const batch = getOrThrow(all, id);
  const keys = Object.keys(patch);
  const asdKeys: string[] = [...SECTION_E_ASD_FIELDS];
  const ddKeys: string[] = [...SECTION_E_DD_FIELDS];
  if (keys.some((k) => asdKeys.includes(k))) {
    assertAsdReviewStage(batch);
    if (actorRole !== RESULTS_AD_ROLE) throw new Error('Only the ASD can change Section E1.');
  }
  if (keys.some((k) => ddKeys.includes(k))) {
    if (batch.workflow.stageId !== 'dd-review') throw new Error('Section E2 can only be changed while the batch is with the Deputy Director.');
    if (actorRole !== RESULTS_DD_ROLE) throw new Error('Only the Deputy Director can change Section E2.');
  }
  const updated = { ...batch, sectionE: { ...batch.sectionE, ...patch } };
  saveAll(replace(all, updated));
  return updated;
}

// The ASD can add a file during the review, the same as on an EISA batch. It is tagged "Other".
export async function uploadFisaReviewEvidence(id: string, file: Omit<TaggedEvidenceDocument, 'uploadedAt' | 'tag'>): Promise<FisaResultsBatch> {
  assertFileNotEmpty(file);
  const all = loadAll();
  const batch = getOrThrow(all, id);
  assertAsdReviewStage(batch);
  const doc: TaggedEvidenceDocument = { ...file, tag: 'other', uploadedAt: new Date().toISOString() };
  const updated = { ...batch, evidenceDocuments: [...batch.evidenceDocuments, doc] };
  saveAll(replace(all, updated));
  return updated;
}

interface FisaResultsActionParams {
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

export async function performFisaResultsAction(params: FisaResultsActionParams): Promise<FisaResultsBatch> {
  const all = loadAll();
  const batch = getOrThrow(all, params.batchId);

  if (params.actionId === 'fisa-submit') throw new Error('Submit the batch from the SDP draft.');
  if (params.actionId === 'ad-advance') {
    assertAsdReviewComplete(batch);
    assertFisaSectionEComplete(batch);
  }

  if (params.actionId === 'batch-resubmit') {
    if (batch.sdpId !== params.actorId) throw new Error('Only the SDP that submitted this batch can resubmit it.');
    const workflow = performAction({
      definition: FISA_RESULTS_WORKFLOW,
      record: batch.workflow,
      actionId: 'batch-resubmit',
      actorRole: params.actorRole,
      actorId: params.actorId,
      actorName: params.actorName,
      recordType: FISA_RESULTS_RECORD_TYPE,
      recordId: batch.id,
    });
    // Same resubmission cycle as an EISA batch: a fresh checklist and review notes, while
    // declineHistory keeps every past cycle's reason.
    const updated: FisaResultsBatch = {
      ...batch,
      workflow,
      cycleCount: batch.cycleCount + 1,
      finalEvidenceReceivedAt: today(),
      sectionE: blankSectionE(),
      complianceChecklist: buildResultsComplianceChecklist(),
      complianceReviewNotes: '',
      evidenceEvaluationNotes: '',
      submittedAt: new Date().toISOString(),
    };
    saveAll(replace(all, updated));
    addNotification({
      recipientRole: RESULTS_AD_ROLE,
      title: 'FISA results batch resubmitted',
      body: `"${batch.skillsProgrammeTitle}" (${batch.sdpName}) was resubmitted with more evidence (cycle ${updated.cycleCount}).`,
    });
    return updated;
  }

  const isFinalDecline = params.actionId === 'chief-director-decline';
  const irregularities = nonEmptyLines(params.irregularities);
  const correctiveActions = nonEmptyLines(params.correctiveActions);
  if (isFinalDecline) {
    if (irregularities.length === 0) throw new Error('List at least one irregularity before declining the results.');
    if (correctiveActions.length === 0) throw new Error('List at least one corrective action before declining the results.');
  }
  const note = isFinalDecline ? `Irregularities: ${irregularities.join('; ')}. Corrective actions: ${correctiveActions.join('; ')}.` : params.note;

  const workflow = performAction({
    definition: FISA_RESULTS_WORKFLOW,
    record: batch.workflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note,
    recordType: FISA_RESULTS_RECORD_TYPE,
    recordId: batch.id,
  });

  let updated: FisaResultsBatch = { ...batch, workflow };
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
      recipientRole: FISA_RESULTS_SUBMITTER_ROLE,
      title: 'More evidence requested',
      body: `"${batch.skillsProgrammeTitle}" (${batch.sdpName}): ${params.note ?? ''} Add the evidence and resubmit.`,
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
      title: 'FISA results batch awaiting your review',
      body: `"${batch.skillsProgrammeTitle}" (${batch.sdpName}) is awaiting your review.`,
    });
  }

  if (isFinalDecline) {
    const now = new Date().toISOString();
    updated = {
      ...updated,
      finalDecision: fisaFinalDecisionFor(batch, all, 'declined', { id: params.actorId, name: params.actorName }, { irregularities, correctiveActions }),
      approvalLetter: { generatedAt: now, signedBy: params.actorName, sentToSdpAt: now },
    };
    appendAuditEntry({
      recordType: FISA_RESULTS_RECORD_TYPE,
      recordId: batch.id,
      ...actor,
      action: `Outcome letter (decline) generated and sent to the SDP. Verification code ${updated.finalDecision?.verificationCode ?? ''}`,
    });
    addNotification({
      recipientRole: FISA_RESULTS_SUBMITTER_ROLE,
      title: 'FISA results declined',
      body: `The results for "${batch.skillsProgrammeTitle}" were declined. Your Outcome Letter is ready to download.`,
    });
  }

  if (params.actionId === 'chief-director-approve') {
    const now = new Date().toISOString();
    updated = {
      ...updated,
      recommendation: { recommendedAt: now, recommendedBy: params.actorName },
      approvalLetter: { generatedAt: now, signedBy: params.actorName, sentToSdpAt: now },
      finalDecision: fisaFinalDecisionFor(batch, all, 'approved', { id: params.actorId, name: params.actorName }, { irregularities: [], correctiveActions: [] }),
    };
    appendAuditEntry({
      recordType: FISA_RESULTS_RECORD_TYPE,
      recordId: batch.id,
      ...actor,
      action: 'Outcome letter generated and sent to the SDP',
    });
    // Simulated hand-off, the same as for EISA batches: the Certification domain is out of scope.
    appendAuditEntry({
      recordType: FISA_RESULTS_RECORD_TYPE,
      recordId: batch.id,
      ...actor,
      action: 'Recommendation letter sent to Certification',
    });
    addNotification({
      recipientRole: FISA_RESULTS_SUBMITTER_ROLE,
      title: 'FISA results batch approved',
      body: `"${batch.skillsProgrammeTitle}" results are approved. Your Outcome Letter is ready to download.`,
    });
  }

  saveAll(replace(all, updated));
  return updated;
}
