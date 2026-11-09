// QCTO feedback 3.14: FISA results in Approval of Results. FISA is decentralised: there is no
// QP, the SDP conducts the assessment and submits the results batch for an Approved FISA
// Standard. Internally the batch goes through the same chain and checks as an EISA batch
// (api.ts): ASD compliance and evidence review, Deputy Director, Director, Chief Director.
// There is no Post-EISA Monitoring visit for FISA.
import { appendAuditEntry } from '../../shared/audit/auditLog';
import type { ChecklistSection } from '../../shared/checklist/types';
import { assertFileNotEmpty } from '../../shared/files/fileCheck';
import { addNotification } from '../../shared/notifications/store';
import { performAction } from '../../shared/workflow/engine';
import { listEnrolledLearners } from '../../mock/api/qaDomain';
import { readStore, writeStore } from '../../mock/api/storage';
import { buildResultsComplianceChecklist } from '../../mock/data/resultsComplianceFolders';
import type { EnrolledLearner } from '../../mock/data/enrolledLearners';
import type { Role } from '../../types';
import { listApprovedFisaStandards } from '../fisa/api';
import type { FisaStandardRecord } from '../fisa/types';
import { assertAsdReviewComplete, NEXT_APPROVER } from './api';
import { FISA_RESULTS_RECORD_TYPE, FISA_RESULTS_SUBMITTER_ROLE, RESULTS_AD_ROLE } from './config';
import { FISA_RESULTS_WORKFLOW, fisaSubmissionIssues } from './workflow';
import type { FisaResultsBatch, FisaResultsDraftPatch, LearnerResult, NewFisaResultsBatchInput, TaggedEvidenceDocument } from './types';

export const FISA_RESULTS_KEY = 'approvalOfResults:fisaBatches';

function loadAll(): FisaResultsBatch[] {
  return readStore<FisaResultsBatch[]>(FISA_RESULTS_KEY, []);
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

  const batch: FisaResultsBatch = {
    id: crypto.randomUUID(),
    fisaStandardId: standard.id,
    skillsProgrammeTitle: standard.skillsProgrammeTitle,
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
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
    createdById: input.createdById,
    submittedAt: null,
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
}

export async function performFisaResultsAction(params: FisaResultsActionParams): Promise<FisaResultsBatch> {
  const all = loadAll();
  const batch = getOrThrow(all, params.batchId);

  if (params.actionId === 'fisa-submit') throw new Error('Submit the batch from the SDP draft.');
  if (params.actionId === 'ad-advance') assertAsdReviewComplete(batch);

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
      complianceChecklist: buildResultsComplianceChecklist(),
      complianceReviewNotes: '',
      evidenceEvaluationNotes: '',
      submittedAt: new Date().toISOString(),
    };
    saveAll(replace(all, updated));
    addNotification({
      recipientRole: RESULTS_AD_ROLE,
      title: 'FISA results batch resubmitted',
      body: `"${batch.skillsProgrammeTitle}" (${batch.sdpName}) was resubmitted after being declined (cycle ${updated.cycleCount}).`,
    });
    return updated;
  }

  const workflow = performAction({
    definition: FISA_RESULTS_WORKFLOW,
    record: batch.workflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: params.note,
    recordType: FISA_RESULTS_RECORD_TYPE,
    recordId: batch.id,
  });

  let updated: FisaResultsBatch = { ...batch, workflow };

  if (params.actionId.endsWith('-decline')) {
    updated = {
      ...updated,
      declineHistory: [
        ...updated.declineHistory,
        { stageId: batch.workflow.stageId, decidedBy: params.actorName, reason: params.note ?? '', decidedAt: new Date().toISOString() },
      ],
    };
    addNotification({
      recipientRole: FISA_RESULTS_SUBMITTER_ROLE,
      title: 'FISA results batch declined',
      body: `"${batch.skillsProgrammeTitle}" (${batch.sdpName}) was declined: ${params.note ?? ''}`,
    });
  }

  const nextApprover = NEXT_APPROVER[params.actionId];
  if (nextApprover) {
    addNotification({
      recipientRole: nextApprover,
      title: 'FISA results batch awaiting your review',
      body: `"${batch.skillsProgrammeTitle}" (${batch.sdpName}) is awaiting your review.`,
    });
  }

  if (params.actionId === 'chief-director-approve') {
    const now = new Date().toISOString();
    updated = {
      ...updated,
      recommendation: { recommendedAt: now, recommendedBy: params.actorName },
      approvalLetter: { generatedAt: now, signedBy: params.actorName, sentToSdpAt: now },
    };
    const actor = { actorRole: params.actorRole, actorId: params.actorId, actorName: params.actorName };
    appendAuditEntry({
      recordType: FISA_RESULTS_RECORD_TYPE,
      recordId: batch.id,
      ...actor,
      action: 'Approval letter generated and sent to the SDP',
    });
    // Simulated hand-off, the same as for EISA batches: the Certification domain is out of scope.
    appendAuditEntry({
      recordType: FISA_RESULTS_RECORD_TYPE,
      recordId: batch.id,
      ...actor,
      action: 'Recommended to the Certification domain for certificate printing (simulated)',
    });
    addNotification({
      recipientRole: FISA_RESULTS_SUBMITTER_ROLE,
      title: 'FISA results batch approved',
      body: `"${batch.skillsProgrammeTitle}" results are approved and recommended to Certification. Your approval letter is ready to download.`,
    });
  }

  saveAll(replace(all, updated));
  return updated;
}
