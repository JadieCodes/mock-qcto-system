import { buildInstrumentValidationChecklist } from '../../mock/data/instrumentValidationChecklistItems';
import { buildFisaStandardChecklist } from '../../mock/data/fisaStandardChecklistItems';
import { seedFisaStandards } from '../../mock/data/fisaStandardsSeed';
import { getSdpComplianceStatus, listEnrolledLearners } from '../../mock/api/qaDomain';
import { getPerson } from '../../shared/people/directory';
import { verifyLearnerIdentity } from '../../mock/integrations/homeAffairs';
import { validateSorAgainstModules } from '../../mock/integrations/qualificationsModules';
import { readStore, writeStore } from '../../mock/api/storage';
import { addNotification } from '../../shared/notifications/store';
import { isChecklistComplete, type ChecklistSection } from '../../shared/checklist/types';
import { performAction } from '../../shared/workflow/engine';
import type { Role } from '../../types';
import { FISA_REGISTRATION_NUMBER_PREFIX } from './config';
import { FISA_REGISTRATION_WORKFLOW, FISA_STANDARD_WORKFLOW, FISA_VALIDATION_WORKFLOW } from './workflow';
import type {
  FisaRegistrationRecord,
  FisaStandardRecord,
  FisaValidationOutcome,
  FisaValidationDecision,
  FisaValidationRecord,
  NewFisaRegistrationInput,
  NewFisaStandardInput,
  NewFisaValidationInput,
} from './types';

// ---------------------------------------------------------------------------
// Stage 1 — FISA Standards
// ---------------------------------------------------------------------------

const STANDARDS_KEY = 'fisa:standards';

function loadStandards(): FisaStandardRecord[] {
  return readStore<FisaStandardRecord[]>(STANDARDS_KEY, seedFisaStandards());
}

function saveStandards(records: FisaStandardRecord[]): void {
  writeStore(STANDARDS_KEY, records);
}

function getStandardOrThrow(records: FisaStandardRecord[], id: string): FisaStandardRecord {
  const record = records.find((r) => r.id === id);
  if (!record) throw new Error(`FISA Standard "${id}" not found.`);
  return record;
}

function replaceStandard(records: FisaStandardRecord[], updated: FisaStandardRecord): FisaStandardRecord[] {
  return records.map((r) => (r.id === updated.id ? updated : r));
}

export async function listFisaStandards(): Promise<FisaStandardRecord[]> {
  return loadStandards();
}

export async function getFisaStandard(id: string): Promise<FisaStandardRecord | undefined> {
  return loadStandards().find((r) => r.id === id);
}

// CR-026: a new Skills Programme needing its own final-assessment standard — never triggered
// by a failed QASA gate check.
export async function createFisaStandard(input: NewFisaStandardInput): Promise<FisaStandardRecord> {
  const record: FisaStandardRecord = {
    id: crypto.randomUUID(),
    skillsProgrammeTitle: input.skillsProgrammeTitle,
    sourceDocuments: input.sourceDocuments,
    notes: input.notes,
    workflow: { stageId: 'qd-submission', submittedBy: input.createdBy },
    checklist: buildFisaStandardChecklist(),
    evaluationReport: { findings: '', recommendation: '' },
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  saveStandards([record, ...loadStandards()]);
  return record;
}

export async function saveFisaStandardChecklist(standardId: string, sections: ChecklistSection[]): Promise<FisaStandardRecord> {
  const all = loadStandards();
  const record = getStandardOrThrow(all, standardId);
  const updated = { ...record, checklist: sections };
  saveStandards(replaceStandard(all, updated));
  return updated;
}

export async function saveFisaStandardEvaluationReport(
  standardId: string,
  report: FisaStandardRecord['evaluationReport'],
): Promise<FisaStandardRecord> {
  const all = loadStandards();
  const record = getStandardOrThrow(all, standardId);
  const updated = { ...record, evaluationReport: report };
  saveStandards(replaceStandard(all, updated));
  return updated;
}

interface StandardActionParams {
  standardId: string;
  actionId: string;
  actorRole: Role;
  actorId: string;
  actorName: string;
  note?: string;
}

export async function performStandardAction(params: StandardActionParams): Promise<FisaStandardRecord> {
  const all = loadStandards();
  const record = getStandardOrThrow(all, params.standardId);

  if (params.actionId === 'standard-asd-send-to-dd') {
    if (!isChecklistComplete(record.checklist, true)) {
      throw new Error('Every checklist line needs an answer and a comment before sending to the Deputy Director.');
    }
    if (!record.evaluationReport.findings.trim() || !record.evaluationReport.recommendation) {
      throw new Error('Complete the evaluation report (findings and recommendation) before sending to the Deputy Director.');
    }
  }

  const nextWorkflow = performAction({
    definition: FISA_STANDARD_WORKFLOW,
    record: record.workflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: params.note,
    recordType: 'fisa-standard',
    recordId: record.id,
  });

  const updated: FisaStandardRecord = { ...record, workflow: nextWorkflow };
  saveStandards(replaceStandard(all, updated));

  // Every handoff notifies whoever needs to act next — a terminal stage (approved/declined)
  // notifies Qualifications Development instead, since they started the whole chain.
  const nextStage = FISA_STANDARD_WORKFLOW.stages.find((s) => s.id === nextWorkflow.stageId);
  const action = FISA_STANDARD_WORKFLOW.actions.find((a) => a.id === params.actionId);
  const title =
    nextWorkflow.stageId === 'declined'
      ? 'FISA Standard declined'
      : nextWorkflow.stageId === 'approved'
        ? 'FISA Standard approved'
        : action?.kind === 'send-back'
          ? 'FISA Standard sent back for clarification'
          : `FISA Standard ready: ${nextStage?.label ?? nextWorkflow.stageId}`;
  const body = params.note
    ? `"${record.skillsProgrammeTitle}": ${params.note}`
    : `"${record.skillsProgrammeTitle}" is now at ${nextStage?.label ?? nextWorkflow.stageId}.`;

  if (nextWorkflow.stageId === 'approved' || nextWorkflow.stageId === 'declined') {
    addNotification({ recipientRole: 'Qualifications Development', title, body });
  } else if (nextStage?.allowedRoles[0]) {
    addNotification({ recipientRole: nextStage.allowedRoles[0], title, body });
  }
  return updated;
}

// Read by Instrument Validation (stage 2/3): a FISA instrument can only be developed against
// an approved FISA Standard.
export async function listApprovedFisaStandards(): Promise<FisaStandardRecord[]> {
  return loadStandards().filter((r) => r.workflow.stageId === 'approved');
}

// ---------------------------------------------------------------------------
// Stage 2 & 3 — Instrument development + FISA Instrument Validation
// ---------------------------------------------------------------------------

const VALIDATION_KEY = 'fisa:validations';

function loadValidations(): FisaValidationRecord[] {
  return readStore<FisaValidationRecord[]>(VALIDATION_KEY, []);
}

function saveValidations(records: FisaValidationRecord[]): void {
  writeStore(VALIDATION_KEY, records);
}

function getValidationOrThrow(records: FisaValidationRecord[], id: string): FisaValidationRecord {
  const record = records.find((r) => r.id === id);
  if (!record) throw new Error(`FISA Instrument Validation record "${id}" not found.`);
  return record;
}

function replaceValidation(records: FisaValidationRecord[], updated: FisaValidationRecord): FisaValidationRecord[] {
  return records.map((r) => (r.id === updated.id ? updated : r));
}

// CR-026 entry rule: an SDP can only start instrument development/validation for a Skills
// Programme whose FISA Standard is Approved — mirrors Instrument Validation's CR entry rule.
export async function listEligibleFisaStandards(): Promise<FisaStandardRecord[]> {
  const approved = await listApprovedFisaStandards();
  const existingIds = new Set(loadValidations().map((r) => r.fisaStandardId));
  return approved.filter((s) => !existingIds.has(s.id));
}

export async function listFisaValidations(): Promise<FisaValidationRecord[]> {
  return loadValidations();
}

export async function getFisaValidation(id: string): Promise<FisaValidationRecord | undefined> {
  return loadValidations().find((r) => r.id === id);
}

export async function startFisaValidation(input: NewFisaValidationInput): Promise<FisaValidationRecord> {
  const approved = await listApprovedFisaStandards();
  const standard = approved.find((s) => s.id === input.fisaStandardId);
  if (!standard) {
    throw new Error('Instrument development can only start for a Skills Programme whose FISA Standard is Approved.');
  }

  const all = loadValidations();
  if (all.some((r) => r.fisaStandardId === input.fisaStandardId)) {
    throw new Error('A FISA Instrument Validation already exists for this FISA Standard.');
  }

  const record: FisaValidationRecord = {
    id: crypto.randomUUID(),
    fisaStandardId: standard.id,
    skillsProgrammeTitle: standard.skillsProgrammeTitle,
    sdpId: input.sdpId,
    sdpName: input.sdpName,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
    instrument: null,
    cycleCount: 1,
    checklist: buildInstrumentValidationChecklist(),
    allocatedAsdId: null,
    allocatedAsdName: null,
    workflow: { stageId: 'sdp-instrument' },
    outcomeHistory: [],
    instrumentStatus: 'not-validated',
  };
  saveValidations([record, ...all]);
  return record;
}

export async function uploadFisaInstrument(recordId: string, file: { fileName: string; fileSize: number }): Promise<FisaValidationRecord> {
  const all = loadValidations();
  const record = getValidationOrThrow(all, recordId);
  if (record.workflow.stageId !== 'sdp-instrument') {
    throw new Error('The instrument can only be uploaded while the record is with the SDP.');
  }
  const updated: FisaValidationRecord = { ...record, instrument: { ...file, uploadedAt: new Date().toISOString() } };
  saveValidations(replaceValidation(all, updated));
  return updated;
}

export async function saveFisaValidationChecklist(recordId: string, sections: ChecklistSection[]): Promise<FisaValidationRecord> {
  const all = loadValidations();
  const record = getValidationOrThrow(all, recordId);
  const updated = { ...record, checklist: sections };
  saveValidations(replaceValidation(all, updated));
  return updated;
}

interface FisaValidationActionParams {
  recordId: string;
  actionId: string;
  actorRole: Role;
  actorId: string;
  actorName: string;
  note?: string;
  allocatedAsdId?: string;
}

const FISA_VALIDATION_OUTCOME_ACTION_IDS = ['fval-approve', 'fval-approve-with-conditions', 'fval-not-approved'];

// PM-11 (notify) / PM-01 (allocate -> validate -> straight back to SDP, no DD step).
export async function performFisaValidationAction(params: FisaValidationActionParams): Promise<FisaValidationRecord> {
  const all = loadValidations();
  const record = getValidationOrThrow(all, params.recordId);

  if (params.actionId === 'fval-submit' && !record.instrument) {
    throw new Error('Upload the instrument before notifying QCTO.');
  }
  if (params.actionId === 'fval-allocate' && !params.allocatedAsdId) {
    throw new Error('Pick the ASD this validation is allocated to.');
  }
  if (FISA_VALIDATION_OUTCOME_ACTION_IDS.includes(params.actionId) && !isChecklistComplete(record.checklist, true)) {
    throw new Error('Every checklist line needs an answer and a comment before recording an outcome.');
  }

  const nextWorkflow = performAction({
    definition: FISA_VALIDATION_WORKFLOW,
    record: record.workflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: params.note,
    recordType: 'fisa-instrument-validation',
    recordId: record.id,
  });

  let updated: FisaValidationRecord = { ...record, workflow: nextWorkflow };

  if (params.actionId === 'fval-allocate' && params.allocatedAsdId) {
    const asd = getPerson(params.allocatedAsdId);
    if (!asd || asd.role !== 'ASD') throw new Error('The allocation target must be a named ASD.');
    updated = { ...updated, allocatedAsdId: asd.id, allocatedAsdName: asd.name };
    addNotification({
      recipientRole: 'ASD',
      title: 'FISA Instrument Validation allocated',
      body: `"${record.skillsProgrammeTitle}" (${record.sdpName}) has been allocated to ${asd.name} for validation.`,
    });
  }

  if (FISA_VALIDATION_OUTCOME_ACTION_IDS.includes(params.actionId)) {
    const decision: FisaValidationDecision =
      params.actionId === 'fval-approve'
        ? 'approved'
        : params.actionId === 'fval-approve-with-conditions'
          ? 'approved-with-conditions'
          : 'not-approved';
    const outcome: FisaValidationOutcome = {
      cycle: updated.cycleCount,
      decision,
      notes: params.note ?? '',
      decidedBy: params.actorName,
      decidedAt: new Date().toISOString(),
    };
    updated = { ...updated, outcomeHistory: [...updated.outcomeHistory, outcome] };

    if (decision === 'not-approved') {
      // PM-01 loop: straight back to the SDP, a fresh cycle, no Deputy Director stop.
      updated = {
        ...updated,
        instrument: null,
        cycleCount: updated.cycleCount + 1,
        checklist: buildInstrumentValidationChecklist(),
      };
      addNotification({
        recipientRole: 'SDP',
        title: 'Changes required on your FISA instrument',
        body: `"${updated.skillsProgrammeTitle}": ${params.note ?? ''}`,
      });
    } else {
      updated = { ...updated, instrumentStatus: 'validated' };
      addNotification({
        recipientRole: 'SDP',
        title: 'FISA Validation Report ready',
        body: `"${updated.skillsProgrammeTitle}" is now ${decision === 'approved' ? 'Approved' : 'Approved with conditions'}.`,
      });
    }
  }

  saveValidations(replaceValidation(all, updated));
  return updated;
}

// Read by FISA Registration (stage 4): registration only starts against a validated instrument.
export async function listValidatedFisaValidations(): Promise<FisaValidationRecord[]> {
  return loadValidations().filter((r) => r.instrumentStatus === 'validated');
}

// ---------------------------------------------------------------------------
// Stage 4 — FISA Registration (simplified EISA Registration)
// ---------------------------------------------------------------------------

const REGISTRATION_KEY = 'fisa:registrations';

function loadRegistrations(): FisaRegistrationRecord[] {
  return readStore<FisaRegistrationRecord[]>(REGISTRATION_KEY, []);
}

function saveRegistrations(records: FisaRegistrationRecord[]): void {
  writeStore(REGISTRATION_KEY, records);
}

function getRegistrationOrThrow(records: FisaRegistrationRecord[], id: string): FisaRegistrationRecord {
  const record = records.find((r) => r.id === id);
  if (!record) throw new Error(`FISA registration "${id}" not found.`);
  return record;
}

function replaceRegistration(records: FisaRegistrationRecord[], updated: FisaRegistrationRecord): FisaRegistrationRecord[] {
  return records.map((r) => (r.id === updated.id ? updated : r));
}

export async function listFisaRegistrations(): Promise<FisaRegistrationRecord[]> {
  return loadRegistrations();
}

export async function getFisaRegistration(id: string): Promise<FisaRegistrationRecord | undefined> {
  return loadRegistrations().find((r) => r.id === id);
}

export async function startFisaRegistration(input: NewFisaRegistrationInput): Promise<FisaRegistrationRecord> {
  const validated = await listValidatedFisaValidations();
  const validation = validated.find((v) => v.id === input.fisaValidationId);
  if (!validation) {
    throw new Error('A FISA registration can only be started for a validated FISA instrument.');
  }

  const compliant = await getSdpComplianceStatus(input.sdpName);
  if (!compliant) {
    throw new Error(`"${input.sdpName}" is not compliant and is blocked from submitting a FISA registration.`);
  }

  const record: FisaRegistrationRecord = {
    id: crypto.randomUUID(),
    fisaValidationId: validation.id,
    skillsProgrammeTitle: validation.skillsProgrammeTitle,
    sdpId: input.sdpId,
    sdpName: input.sdpName,
    sittingDate: input.sittingDate,
    workflow: { stageId: 'sdp-submission', submittedBy: input.createdBy },
    learners: [],
    registrationNumber: null,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  saveRegistrations([record, ...loadRegistrations()]);
  return record;
}

export async function listFisaEnrollableLearners(sdpName: string) {
  return listEnrolledLearners(sdpName);
}

export async function addFisaRegistrationLearner(registrationId: string, learnerId: string): Promise<FisaRegistrationRecord> {
  const all = loadRegistrations();
  const record = getRegistrationOrThrow(all, registrationId);
  if (record.workflow.stageId !== 'sdp-submission') {
    throw new Error('Learners can only be added while the registration is still being built.');
  }
  if (record.learners.some((l) => l.learnerId === learnerId)) {
    throw new Error('This learner is already on this registration.');
  }

  const enrolled = await listEnrolledLearners(record.sdpName);
  const learner = enrolled.find((l) => l.id === learnerId);
  if (!learner) throw new Error('That learner is not enrolled with this SDP.');

  // CR-039-equivalent: backend-dependent, no screen — call the stub and move on regardless.
  await verifyLearnerIdentity(learner.idNumber);

  const updated: FisaRegistrationRecord = {
    ...record,
    learners: [
      ...record.learners,
      { learnerId: learner.id, fullName: learner.fullName, idNumber: learner.idNumber, sor: null, addedAt: new Date().toISOString() },
    ],
  };
  saveRegistrations(replaceRegistration(all, updated));
  return updated;
}

// Row 44 (test findings): the SDP can remove a learner they added, same as adding, only while
// the registration is still being built.
export async function removeFisaRegistrationLearner(registrationId: string, learnerId: string): Promise<FisaRegistrationRecord> {
  const all = loadRegistrations();
  const record = getRegistrationOrThrow(all, registrationId);
  if (record.workflow.stageId !== 'sdp-submission') {
    throw new Error('Learners can only be removed while the registration is still being built.');
  }
  const updated: FisaRegistrationRecord = {
    ...record,
    learners: record.learners.filter((l) => l.learnerId !== learnerId),
  };
  saveRegistrations(replaceRegistration(all, updated));
  return updated;
}

export async function uploadFisaLearnerSor(
  registrationId: string,
  learnerId: string,
  file: { fileName: string; fileSize: number },
): Promise<FisaRegistrationRecord> {
  const all = loadRegistrations();
  const record = getRegistrationOrThrow(all, registrationId);
  if (record.workflow.stageId !== 'sdp-submission') {
    throw new Error('SORs can only be uploaded while the registration is still being built.');
  }
  const learner = record.learners.find((l) => l.learnerId === learnerId);
  if (!learner) throw new Error('Learner not found on this registration.');

  // CR-037-equivalent: backend-dependent, no screen.
  await validateSorAgainstModules(file.fileName, record.skillsProgrammeTitle);

  const updated: FisaRegistrationRecord = {
    ...record,
    learners: record.learners.map((l) =>
      l.learnerId === learnerId ? { ...l, sor: { ...file, uploadedAt: new Date().toISOString() } } : l,
    ),
  };
  saveRegistrations(replaceRegistration(all, updated));
  return updated;
}

interface FisaRegistrationActionParams {
  registrationId: string;
  actionId: 'freg-submit' | 'freg-create-number';
  actorRole: Role;
  actorId: string;
  actorName: string;
}

export async function performFisaRegistrationAction(params: FisaRegistrationActionParams): Promise<FisaRegistrationRecord> {
  const all = loadRegistrations();
  const record = getRegistrationOrThrow(all, params.registrationId);

  if (params.actionId === 'freg-submit') {
    if (record.learners.length === 0) throw new Error('Add at least one learner before submitting.');
    if (record.learners.some((l) => !l.sor)) throw new Error('Every learner needs an uploaded SOR before submitting.');
  }

  const nextWorkflow = performAction({
    definition: FISA_REGISTRATION_WORKFLOW,
    record: record.workflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    recordType: 'fisa-registration',
    recordId: record.id,
  });

  let updated: FisaRegistrationRecord = { ...record, workflow: nextWorkflow };

  if (params.actionId === 'freg-submit') {
    addNotification({
      recipientRole: 'Assistant Director',
      title: 'New FISA registration submitted',
      body: `${record.sdpName} submitted a FISA registration for "${record.skillsProgrammeTitle}" (${record.learners.length} learner(s)).`,
    });
  }

  if (params.actionId === 'freg-create-number') {
    const registeredCount = all.filter((r) => r.workflow.stageId === 'registered').length + 1;
    const registrationNumber = `${FISA_REGISTRATION_NUMBER_PREFIX}-${new Date().getFullYear()}-${String(registeredCount).padStart(4, '0')}`;
    updated = { ...updated, registrationNumber };
    addNotification({
      recipientRole: 'SDP',
      title: 'FISA registration complete',
      body: `Your FISA registration for "${record.skillsProgrammeTitle}" is complete — registration number ${registrationNumber}.`,
    });
  }

  saveRegistrations(replaceRegistration(all, updated));
  return updated;
}
