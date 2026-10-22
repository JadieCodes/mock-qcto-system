import { addNotification } from '../../shared/notifications/store';
import { performAction } from '../../shared/workflow/engine';
import { readStore, writeStore } from '../../mock/api/storage';
import { listSittings } from '../eisa-calendar/api';
import type { EisaSitting } from '../eisa-calendar/types';
import { listRegisteredRegistrationsForSitting } from '../eisa-registration/api';
import { CONFIRMATION_WORKFLOW } from './workflow';
import type { ConfirmDetailsInput, ConsolidatedLearnerRow, EisaConfirmationRecord, GenerateConfirmationInput } from './types';

const KEY = 'eisaConfirmation:records';

function loadAll(): EisaConfirmationRecord[] {
  return readStore<EisaConfirmationRecord[]>(KEY, []);
}

function saveAll(records: EisaConfirmationRecord[]): void {
  writeStore(KEY, records);
}

function getOrThrow(records: EisaConfirmationRecord[], id: string): EisaConfirmationRecord {
  const record = records.find((r) => r.id === id);
  if (!record) throw new Error(`EISA Confirmation "${id}" not found.`);
  return record;
}

function replace(records: EisaConfirmationRecord[], updated: EisaConfirmationRecord): EisaConfirmationRecord[] {
  return records.map((r) => (r.id === updated.id ? updated : r));
}

// CR-043: triggered once registration for a sitting is complete — i.e. at least one
// Registered registration exists for it — and only once per sitting.
export async function listSittingsReadyToConfirm(): Promise<EisaSitting[]> {
  const sittings = await listSittings();
  const existing = loadAll();
  const alreadyConfirmed = new Set(existing.map((r) => r.sittingId));

  const ready: EisaSitting[] = [];
  for (const sitting of sittings) {
    if (alreadyConfirmed.has(sitting.id)) continue;
    const registered = await listRegisteredRegistrationsForSitting(sitting.id);
    if (registered.length > 0) ready.push(sitting);
  }
  return ready;
}

export async function listRecords(): Promise<EisaConfirmationRecord[]> {
  return loadAll();
}

export async function getRecord(id: string): Promise<EisaConfirmationRecord | undefined> {
  return loadAll().find((r) => r.id === id);
}

export async function generateConfirmation(input: GenerateConfirmationInput): Promise<EisaConfirmationRecord> {
  const all = loadAll();
  if (all.some((r) => r.sittingId === input.sittingId)) {
    throw new Error('An EISA Confirmation has already been generated for this sitting.');
  }

  const sittings = await listSittings();
  const sitting = sittings.find((s) => s.id === input.sittingId);
  if (!sitting) throw new Error('Sitting not found.');

  const registrations = await listRegisteredRegistrationsForSitting(input.sittingId);
  if (registrations.length === 0) {
    throw new Error('Registration is not yet complete for this sitting.');
  }

  // CR-043: QCTO generates a consolidated learner list per assessment centre. Assumption:
  // the assessment centre defaults to the registering SDP (no separate centre field exists
  // on a registration yet) — see progress.md.
  const learners: ConsolidatedLearnerRow[] = registrations.flatMap((r) =>
    r.learners.map((l) => ({ learnerId: l.learnerId, fullName: l.fullName, sdpName: r.sdpName, assessmentCentre: r.sdpName })),
  );
  const centres = [...new Set(learners.map((l) => l.assessmentCentre))];

  const record: EisaConfirmationRecord = {
    id: crypto.randomUUID(),
    sittingId: sitting.id,
    sittingDate: sitting.date,
    qualificationTitle: sitting.qualificationTitle,
    qpId: sitting.qpId,
    qpName: sitting.qpName,
    registrationIds: registrations.map((r) => r.id),
    learners,
    centres,
    confirmedCentres: null,
    markingDate: null,
    moderationDate: null,
    workflow: { stageId: 'awaiting-qp-ack' },
    generatedBy: input.generatedBy,
    generatedAt: new Date().toISOString(),
  };
  saveAll([record, ...all]);

  addNotification({
    recipientRole: 'QP',
    title: 'EISA Confirmation ready',
    body: `A consolidated learner list for "${sitting.qualificationTitle}" (${sitting.date}) is ready to review.`,
  });

  return record;
}

export async function acknowledgeConfirmation(recordId: string, actorId: string, actorName: string): Promise<EisaConfirmationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, recordId);
  const nextWorkflow = performAction({
    definition: CONFIRMATION_WORKFLOW,
    record: record.workflow,
    actionId: 'conf-acknowledge',
    actorRole: 'QP',
    actorId,
    actorName,
    recordType: 'eisa-confirmation',
    recordId: record.id,
  });
  const updated = { ...record, workflow: nextWorkflow };
  saveAll(replace(all, updated));
  return updated;
}

// CR-043: confirms assessment centres, learner counts and marking/moderation dates. Does NOT
// create a site visit — that is explicitly out of scope for this step (CR-044).
export async function confirmDetails(input: ConfirmDetailsInput): Promise<EisaConfirmationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, input.recordId);

  const providedCentres = new Set(input.centres.map((c) => c.centre));
  if (record.centres.some((c) => !providedCentres.has(c))) {
    throw new Error('Confirm a learner count for every assessment centre.');
  }
  if (input.centres.some((c) => c.learnerCount < 1)) {
    throw new Error('Every assessment centre needs at least one confirmed learner.');
  }

  // Assumption (not specified by the register): "dates within the sitting" is read as on/after
  // the sitting date — marking cannot happen before the exam is written, and moderation cannot
  // happen before marking. See progress.md.
  if (input.markingDate < record.sittingDate) {
    throw new Error('The marking date cannot be before the sitting date.');
  }
  if (input.moderationDate < input.markingDate) {
    throw new Error('The moderation date cannot be before the marking date.');
  }

  const nextWorkflow = performAction({
    definition: CONFIRMATION_WORKFLOW,
    record: record.workflow,
    actionId: 'conf-confirm',
    actorRole: input.actorRole,
    actorId: input.actorId,
    actorName: input.actorName,
    recordType: 'eisa-confirmation',
    recordId: record.id,
  });

  const updated: EisaConfirmationRecord = {
    ...record,
    workflow: nextWorkflow,
    confirmedCentres: input.centres,
    markingDate: input.markingDate,
    moderationDate: input.moderationDate,
  };
  saveAll(replace(all, updated));

  addNotification({
    recipientRole: 'Assistant Director',
    title: 'EISA Confirmation complete',
    body: `"${record.qualificationTitle}" (${record.sittingDate}) is confirmed — marking ${input.markingDate}, moderation ${input.moderationDate}.`,
  });

  return updated;
}

// Exposed for Phase 5 (CR-050: link marking/moderation visits to the confirmed dates).
export async function getConfirmationForSitting(sittingId: string): Promise<EisaConfirmationRecord | undefined> {
  return loadAll().find((r) => r.sittingId === sittingId);
}
