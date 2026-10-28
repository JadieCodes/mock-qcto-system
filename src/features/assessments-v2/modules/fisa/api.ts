import { buildInstrumentValidationChecklist } from '../../mock/data/instrumentValidationChecklistItems';
import { buildFisaStandardChecklist } from '../../mock/data/fisaStandardChecklistItems';
import { seedFisaStandards } from '../../mock/data/fisaStandardsSeed';
import { getPerson } from '../../shared/people/directory';
import { readStore, writeStore } from '../../mock/api/storage';
import { addNotification } from '../../shared/notifications/store';
import { isChecklistComplete, type ChecklistSection } from '../../shared/checklist/types';
import { performAction } from '../../shared/workflow/engine';
import type { Role } from '../../types';
import { FISA_STANDARD_WORKFLOW, FISA_VALIDATION_WORKFLOW } from './workflow';
import type {
  FisaStandardRecord,
  FisaValidationOutcome,
  FisaValidationDecision,
  FisaValidationRecord,
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
// QCTO feedback 2.11 follow-up: a standard can have more than one validation.
export async function listEligibleFisaStandards(): Promise<FisaStandardRecord[]> {
  return listApprovedFisaStandards();
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
