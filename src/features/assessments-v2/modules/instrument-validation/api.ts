import { buildInstrumentValidationChecklist } from '../../mock/data/instrumentValidationChecklistItems';
import { readStore, writeStore } from '../../mock/api/storage';
import { addNotification } from '../../shared/notifications/store';
import { isChecklistComplete, type ChecklistSection } from '../../shared/checklist/types';
import { performAction } from '../../shared/workflow/engine';
import type { Role } from '../../types';
import { listPublishedSittings } from '../eisa-calendar/api';
import { listApprovedQsaAddenda } from '../qsa-addendum/api';
import type { QsaAddendumApplication } from '../qsa-addendum/types';
import { PREFILL_NOT_CAPTURED_PLACEHOLDER, PREFILL_NO_UPCOMING_EISA } from './config';
import { SCHEDULING_WORKFLOW, VALIDATION_WORKFLOW } from './workflow';
import type {
  AgreedSlot,
  InstrumentFile,
  InstrumentValidationRecord,
  NewValidationInput,
  PrefilledField,
  SchedulingParty,
  ValidationOutcome,
  ValidationOutcomeDecision,
} from './types';

const KEY = 'instrumentValidation:records';

function loadAll(): InstrumentValidationRecord[] {
  return readStore<InstrumentValidationRecord[]>(KEY, []);
}

function saveAll(records: InstrumentValidationRecord[]): void {
  writeStore(KEY, records);
}

function getOrThrow(records: InstrumentValidationRecord[], id: string): InstrumentValidationRecord {
  const record = records.find((r) => r.id === id);
  if (!record) throw new Error(`Instrument validation record "${id}" not found.`);
  return record;
}

function replace(records: InstrumentValidationRecord[], updated: InstrumentValidationRecord): InstrumentValidationRecord[] {
  return records.map((r) => (r.id === updated.id ? updated : r));
}

async function buildPrefilledFields(addendum: QsaAddendumApplication): Promise<PrefilledField[]> {
  const sittings = await listPublishedSittings();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sittings
    .filter((s) => s.qualificationTitle === addendum.qualificationTitle)
    .map((s) => s.date)
    .filter((date) => date >= today)
    .sort()[0];

  return [
    { key: 'qpName', label: 'Name of QP', value: addendum.qpName, action: null },
    { key: 'qpAddress', label: 'Address of QP', value: PREFILL_NOT_CAPTURED_PLACEHOLDER, action: null },
    { key: 'qpContact', label: 'Contact Person / Number', value: PREFILL_NOT_CAPTURED_PLACEHOLDER, action: null },
    { key: 'qualificationTitle', label: 'Qualification Title', value: addendum.qualificationTitle, action: null },
    { key: 'saqaId', label: 'SAQA ID', value: addendum.saqaId, action: null },
    { key: 'credits', label: 'Credits', value: addendum.credits, action: null },
    { key: 'nqfLevel', label: 'NQF Level', value: addendum.nqfLevel, action: null },
    { key: 'upcomingEisaDate', label: 'Date of Upcoming EISA (if known)', value: upcoming ?? PREFILL_NO_UPCOMING_EISA, action: null },
  ];
}

// CR: entry point. A QP can only start a validation for a qualification whose QSA Addendum
// is Approved (`listApprovedQsaAddenda`), and only one validation record exists per addendum.
export async function listEligibleQsaAddenda(): Promise<QsaAddendumApplication[]> {
  const approved = await listApprovedQsaAddenda();
  const existingIds = new Set(loadAll().map((r) => r.qsaAddendumId));
  return approved.filter((a) => !existingIds.has(a.id));
}

export async function listRecords(): Promise<InstrumentValidationRecord[]> {
  return loadAll();
}

export async function getRecord(id: string): Promise<InstrumentValidationRecord | undefined> {
  return loadAll().find((r) => r.id === id);
}

export async function startValidation(input: NewValidationInput): Promise<InstrumentValidationRecord> {
  const approved = await listApprovedQsaAddenda();
  const addendum = approved.find((a) => a.id === input.qsaAddendumId);
  if (!addendum) {
    throw new Error('A validation can only be started for a qualification whose QSA Addendum is Approved.');
  }

  const all = loadAll();
  if (all.some((r) => r.qsaAddendumId === input.qsaAddendumId)) {
    throw new Error('An instrument validation already exists for this QSA Addendum.');
  }

  const record: InstrumentValidationRecord = {
    id: crypto.randomUUID(),
    qsaAddendumId: addendum.id,
    qpName: addendum.qpName,
    qualificationTitle: addendum.qualificationTitle,
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
    scheduling: { workflow: { stageId: 'awaiting-qp-proposal' }, proposals: [], agreedSlot: null },
    instrument: null,
    cycleCount: 1,
    prefilledFields: await buildPrefilledFields(addendum),
    checklist: buildInstrumentValidationChecklist(),
    validationWorkflow: { stageId: 'qp-instrument' },
    outcomeHistory: [],
    instrumentStatus: 'not-validated',
  };
  saveAll([record, ...all]);

  addNotification({
    recipientRole: 'ASD',
    title: 'New instrument validation started',
    body: `"${addendum.qualificationTitle}" is ready to schedule a validation date.`,
  });

  return record;
}

interface SchedulingActionParams {
  recordId: string;
  actionId: string;
  actorRole: Role;
  actorName: string;
  slot?: { date: string; time: string; venue: string };
}

export async function performSchedulingAction(params: SchedulingActionParams): Promise<InstrumentValidationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, params.recordId);

  const isProposalAction = params.actionId === 'sched-qp-propose' || params.actionId === 'sched-asd-counter' || params.actionId === 'sched-qp-counter';
  if (isProposalAction && !params.slot) {
    throw new Error('Provide a date, time and venue before proposing a slot.');
  }

  const nextWorkflow = performAction({
    definition: SCHEDULING_WORKFLOW,
    record: record.scheduling.workflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorName: params.actorName,
    recordType: 'instrument-validation-scheduling',
    recordId: record.id,
  });

  let proposals = record.scheduling.proposals;
  let agreedSlot: AgreedSlot | null = record.scheduling.agreedSlot;

  if (isProposalAction && params.slot) {
    proposals = [
      ...proposals,
      {
        id: crypto.randomUUID(),
        date: params.slot.date,
        time: params.slot.time,
        venue: params.slot.venue,
        proposedBy: params.actorRole as SchedulingParty,
        proposedByName: params.actorName,
        proposedAt: new Date().toISOString(),
      },
    ];
  }

  if (nextWorkflow.stageId === 'agreed') {
    const latest = proposals[proposals.length - 1];
    if (latest) agreedSlot = { date: latest.date, time: latest.time, venue: latest.venue };
  }

  const updated: InstrumentValidationRecord = { ...record, scheduling: { workflow: nextWorkflow, proposals, agreedSlot } };
  saveAll(replace(all, updated));

  if (nextWorkflow.stageId === 'agreed') {
    addNotification({ recipientRole: 'QP', title: 'Validation date agreed', body: `The validation date for "${record.qualificationTitle}" is confirmed.` });
    addNotification({ recipientRole: 'ASD', title: 'Validation date agreed', body: `The validation date for "${record.qualificationTitle}" is confirmed.` });
  } else {
    const waitingRole: Role = nextWorkflow.stageId === 'awaiting-asd-response' ? 'ASD' : 'QP';
    addNotification({
      recipientRole: waitingRole,
      title: 'Validation scheduling needs your response',
      body: `"${record.qualificationTitle}" has a proposed slot waiting for your accept or counter-proposal.`,
    });
  }

  return updated;
}

export async function uploadInstrument(recordId: string, file: { fileName: string; fileSize: number }): Promise<InstrumentValidationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, recordId);
  if (record.validationWorkflow.stageId !== 'qp-instrument') {
    throw new Error('The instrument can only be uploaded while the record is awaiting the QP.');
  }
  const instrument: InstrumentFile = { ...file, uploadedAt: new Date().toISOString() };
  const updated = { ...record, instrument };
  saveAll(replace(all, updated));
  return updated;
}

export async function saveValidationChecklist(recordId: string, sections: ChecklistSection[]): Promise<InstrumentValidationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, recordId);
  const updated = { ...record, checklist: sections };
  saveAll(replace(all, updated));
  return updated;
}

export async function savePrefilledFields(recordId: string, fields: PrefilledField[]): Promise<InstrumentValidationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, recordId);
  const updated = { ...record, prefilledFields: fields };
  saveAll(replace(all, updated));
  return updated;
}

interface ValidationActionParams {
  recordId: string;
  actionId: string;
  actorRole: Role;
  actorName: string;
  note?: string;
}

const OUTCOME_ACTION_IDS = ['val-approve', 'val-approve-with-conditions', 'val-not-approved'];

export async function performValidationAction(params: ValidationActionParams): Promise<InstrumentValidationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, params.recordId);

  if (params.actionId === 'val-submit') {
    if (record.scheduling.workflow.stageId !== 'agreed') {
      throw new Error('The validation date must be agreed with the ASD before submitting the instrument.');
    }
    if (!record.instrument) {
      throw new Error('Upload the instrument before submitting it for validation.');
    }
  }

  if (OUTCOME_ACTION_IDS.includes(params.actionId)) {
    if (!isChecklistComplete(record.checklist, true)) {
      throw new Error('Every checklist line needs an answer and a comment before recording an outcome.');
    }
    if (record.prefilledFields.some((f) => f.action === null)) {
      throw new Error('Confirm or recapture every pre-filled field before recording an outcome.');
    }
  }

  const nextWorkflow = performAction({
    definition: VALIDATION_WORKFLOW,
    record: record.validationWorkflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorName: params.actorName,
    note: params.note,
    recordType: 'instrument-validation-validation',
    recordId: record.id,
  });

  let updated: InstrumentValidationRecord = { ...record, validationWorkflow: nextWorkflow };

  if (OUTCOME_ACTION_IDS.includes(params.actionId)) {
    const decision: ValidationOutcomeDecision =
      params.actionId === 'val-approve' ? 'approved' : params.actionId === 'val-approve-with-conditions' ? 'approved-with-conditions' : 'not-approved';
    const outcome: ValidationOutcome = {
      cycle: updated.cycleCount,
      decision,
      notes: params.note ?? '',
      decidedBy: params.actorName,
      decidedAt: new Date().toISOString(),
    };
    updated = { ...updated, outcomeHistory: [...updated.outcomeHistory, outcome] };

    if (decision === 'not-approved') {
      // CR-023 loop: the QP fixes and resubmits, and the ASD re-validates — a fresh cycle
      // gets a blank checklist and fields that need re-confirming.
      const addendum = (await listApprovedQsaAddenda()).find((a) => a.id === updated.qsaAddendumId);
      updated = {
        ...updated,
        instrument: null,
        cycleCount: updated.cycleCount + 1,
        checklist: buildInstrumentValidationChecklist(),
        prefilledFields: addendum ? await buildPrefilledFields(addendum) : updated.prefilledFields.map((f) => ({ ...f, action: null })),
      };
      addNotification({
        recipientRole: 'QP',
        title: 'Changes required on your instrument',
        body: `"${updated.qualificationTitle}": ${params.note ?? ''}`,
      });
    } else {
      // CR-024: this only flips instrumentStatus. It never creates or opens an EISA Registration.
      updated = { ...updated, instrumentStatus: 'validated' };
      addNotification({
        recipientRole: 'QP',
        title: 'Instrument validation outcome recorded',
        body: `"${updated.qualificationTitle}" is now ${decision === 'approved' ? 'Approved' : 'Approved with conditions'}.`,
      });
    }
  }

  saveAll(replace(all, updated));
  return updated;
}
