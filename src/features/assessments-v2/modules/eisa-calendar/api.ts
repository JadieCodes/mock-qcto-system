import { readStore, writeStore } from '../../mock/api/storage';
import { addNotification } from '../../shared/notifications/store';
import { appendAuditEntry } from '../../shared/audit/auditLog';
import { performAction } from '../../shared/workflow/engine';
import { listApprovedQsaAddenda } from '../qsa-addendum/api';
import type { Role } from '../../types';
import { CALENDAR_REVIEWER_ROLE } from './config';
import { checkSittingDate } from './dateChecks';
import { BATCH_WORKFLOW, SITTING_LIFECYCLE_WORKFLOW } from './workflow';
import type {
  AddSittingInput,
  EditSittingInput,
  EisaSitting,
  EisaSittingBatch,
  EligibleQualification,
  ProposeSittingBatchInput,
} from './types';

const BATCHES_KEY = 'eisaCalendar:batches';
const SITTINGS_KEY = 'eisaCalendar:sittings';

function loadBatches(): EisaSittingBatch[] {
  return readStore<EisaSittingBatch[]>(BATCHES_KEY, []);
}
function saveBatches(batches: EisaSittingBatch[]): void {
  writeStore(BATCHES_KEY, batches);
}
function loadSittings(): EisaSitting[] {
  return readStore<EisaSitting[]>(SITTINGS_KEY, []);
}
function saveSittings(sittings: EisaSitting[]): void {
  writeStore(SITTINGS_KEY, sittings);
}

// CR-030: reads the approved EISA frequency straight from the approved QSA Addendum, per the
// assumption recorded on that module (evaluationReport.approvedEisaSittingsPerYear).
export async function listEligibleQualifications(): Promise<EligibleQualification[]> {
  const approved = await listApprovedQsaAddenda();
  return approved.map((a) => ({
    qualificationTitle: a.qualificationTitle,
    qpId: a.qpId,
    qpName: a.qpName,
    approvedEisaSittingsPerYear: a.evaluationReport.approvedEisaSittingsPerYear,
  }));
}

export async function listBatches(): Promise<EisaSittingBatch[]> {
  return loadBatches();
}

export async function listSittings(): Promise<EisaSitting[]> {
  return loadSittings();
}

// CR: the typed function other modules (registration, confirmation, site visits) read instead
// of the full sittings list, once they are built.
export async function listPublishedSittings(): Promise<EisaSitting[]> {
  return loadSittings().filter((s) => s.status === 'published');
}

export async function proposeSittingBatch(input: ProposeSittingBatchInput): Promise<EisaSittingBatch> {
  const eligible = await listEligibleQualifications();
  const match = eligible.find((q) => q.qualificationTitle === input.qualificationTitle && q.qpId === input.qpId);
  if (!match) {
    throw new Error('This qualification does not have an approved QSA Addendum yet.');
  }
  if (match.approvedEisaSittingsPerYear == null) {
    throw new Error('The approved EISA sitting frequency for this qualification has not been recorded yet.');
  }

  // CR-030: block if the submitted count does not match the approved frequency exactly.
  if (input.dates.length !== match.approvedEisaSittingsPerYear) {
    throw new Error(
      `"${input.qualificationTitle}" is approved for ${match.approvedEisaSittingsPerYear} sitting(s) per year — you submitted ${input.dates.length}.`,
    );
  }

  if (new Set(input.dates).size !== input.dates.length) {
    throw new Error('Duplicate dates are not allowed in the same submission.');
  }

  // CR-032: automatic rejection of weekends, public holidays and dates inside the lead time.
  for (const date of input.dates) {
    if (Number(date.slice(0, 4)) !== input.year) {
      throw new Error(`${date} is not in ${input.year}.`);
    }
    const check = checkSittingDate(date);
    if (!check.ok) {
      throw new Error(`${date}: ${check.reasons.join(' ')}`);
    }
  }

  const batch: EisaSittingBatch = {
    id: crypto.randomUUID(),
    qualificationTitle: input.qualificationTitle,
    qpId: input.qpId,
    qpName: input.qpName,
    year: input.year,
    requiredCount: match.approvedEisaSittingsPerYear,
    dates: [...input.dates].sort(),
    state: { stageId: 'qcto-review', submittedBy: input.submittedBy, submittedById: input.submittedById },
    rejectionReason: null,
    submittedBy: input.submittedBy,
    submittedAt: new Date().toISOString(),
  };

  const sittings: EisaSitting[] = batch.dates.map((date) => ({
    id: crypto.randomUUID(),
    batchId: batch.id,
    qualificationTitle: input.qualificationTitle,
    qpId: input.qpId,
    qpName: input.qpName,
    year: input.year,
    date,
    status: 'proposed',
    rejectionReason: null,
    postponementReason: null,
    cancellationReason: null,
    createdBy: input.submittedBy,
    createdAt: new Date().toISOString(),
  }));

  saveBatches([batch, ...loadBatches()]);
  saveSittings([...sittings, ...loadSittings()]);
  return batch;
}

interface BatchActionParams {
  batchId: string;
  actionId: 'batch-approve' | 'batch-reject' | 'batch-publish';
  actorRole: Role;
  actorId: string;
  actorName: string;
  note?: string;
}

export async function performBatchAction(params: BatchActionParams): Promise<EisaSittingBatch> {
  const batches = loadBatches();
  const batch = batches.find((b) => b.id === params.batchId);
  if (!batch) throw new Error('EISA sitting batch not found.');

  const nextState = performAction({
    definition: BATCH_WORKFLOW,
    record: batch.state,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: params.note,
    recordType: 'eisa-calendar-batch',
    recordId: batch.id,
  });

  const updatedBatch: EisaSittingBatch = {
    ...batch,
    state: nextState,
    rejectionReason: params.actionId === 'batch-reject' ? (params.note ?? null) : batch.rejectionReason,
  };
  saveBatches(batches.map((b) => (b.id === batch.id ? updatedBatch : b)));

  // The batch's dates move together — mirror the decision onto every sitting it created.
  const sittings = loadSittings();
  saveSittings(
    sittings.map((s) =>
      s.batchId === batch.id
        ? {
            ...s,
            status: nextState.stageId as EisaSitting['status'],
            rejectionReason: params.actionId === 'batch-reject' ? (params.note ?? null) : s.rejectionReason,
          }
        : s,
    ),
  );

  if (params.actionId === 'batch-reject') {
    addNotification({
      recipientRole: 'QP',
      title: 'EISA sitting dates rejected',
      body: `Your proposed sitting dates for "${batch.qualificationTitle}" (${batch.year}) were rejected: ${params.note ?? ''}`,
    });
  }
  if (params.actionId === 'batch-publish') {
    addNotification({
      recipientRole: 'QP',
      title: 'EISA sitting dates published',
      body: `Your approved sitting dates for "${batch.qualificationTitle}" (${batch.year}) are now published on the EISA Calendar.`,
    });
    addNotification({
      recipientRole: 'SDP',
      title: 'New EISA sitting dates published',
      body: `New EISA sitting dates for "${batch.qualificationTitle}" (${batch.year}) are now on the EISA Calendar.`,
    });
  }

  return updatedBatch;
}

// CR-027: QCTO can add a sitting directly — it goes straight to "published", no QP proposal
// or review needed, since the person adding it is the approving authority.
export async function addSitting(input: AddSittingInput): Promise<EisaSitting> {
  const sitting: EisaSitting = {
    id: crypto.randomUUID(),
    batchId: null,
    qualificationTitle: input.qualificationTitle,
    qpId: input.qpId,
    qpName: input.qpName,
    year: input.year,
    date: input.date,
    status: 'published',
    rejectionReason: null,
    postponementReason: null,
    cancellationReason: null,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  saveSittings([sitting, ...loadSittings()]);
  appendAuditEntry({
    recordType: 'eisa-calendar-sitting',
    recordId: sitting.id,
    actorRole: CALENDAR_REVIEWER_ROLE,
    actorId: input.createdById,
    actorName: input.createdBy,
    action: `Added sitting directly to the calendar (${sitting.date})`,
  });
  return sitting;
}

export async function editSitting(id: string, patch: EditSittingInput, actorId: string, actorName: string): Promise<EisaSitting> {
  const sittings = loadSittings();
  const existing = sittings.find((s) => s.id === id);
  if (!existing) throw new Error('Sitting not found.');

  const updated: EisaSitting = { ...existing, ...patch };
  saveSittings(sittings.map((s) => (s.id === id ? updated : s)));
  appendAuditEntry({
    recordType: 'eisa-calendar-sitting',
    recordId: id,
    actorRole: CALENDAR_REVIEWER_ROLE,
    actorId,
    actorName,
    action:
      patch.date !== existing.date
        ? `Edited sitting — date changed from ${existing.date} to ${patch.date}`
        : 'Edited sitting',
  });
  return updated;
}

export async function deleteSitting(id: string, actorId: string, actorName: string): Promise<void> {
  const sittings = loadSittings();
  const existing = sittings.find((s) => s.id === id);
  if (!existing) throw new Error('Sitting not found.');

  saveSittings(sittings.filter((s) => s.id !== id));
  appendAuditEntry({
    recordType: 'eisa-calendar-sitting',
    recordId: id,
    actorRole: CALENDAR_REVIEWER_ROLE,
    actorId,
    actorName,
    action: `Deleted sitting (${existing.qualificationTitle}, ${existing.date})`,
  });
}

interface SittingLifecycleParams {
  sittingId: string;
  actionId: 'sitting-postpone' | 'sitting-cancel';
  actorRole: Role;
  actorId: string;
  actorName: string;
  reason: string;
}

// CR-034: cancellation/postponement — QCTO-initiated only, reason required, notifies the
// affected SDPs (and the QP), full audit trail via the shared workflow engine.
export async function performSittingLifecycleAction(params: SittingLifecycleParams): Promise<EisaSitting> {
  const sittings = loadSittings();
  const sitting = sittings.find((s) => s.id === params.sittingId);
  if (!sitting) throw new Error('Sitting not found.');

  const nextState = performAction({
    definition: SITTING_LIFECYCLE_WORKFLOW,
    record: { stageId: sitting.status },
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: params.reason,
    recordType: 'eisa-calendar-sitting',
    recordId: sitting.id,
  });

  const updated: EisaSitting = {
    ...sitting,
    status: nextState.stageId as EisaSitting['status'],
    postponementReason: params.actionId === 'sitting-postpone' ? params.reason : sitting.postponementReason,
    cancellationReason: params.actionId === 'sitting-cancel' ? params.reason : sitting.cancellationReason,
  };
  saveSittings(sittings.map((s) => (s.id === sitting.id ? updated : s)));

  const verb = params.actionId === 'sitting-postpone' ? 'postponed' : 'cancelled';
  addNotification({
    recipientRole: 'SDP',
    title: `EISA sitting ${verb}`,
    body: `The EISA sitting for "${sitting.qualificationTitle}" on ${sitting.date} has been ${verb}: ${params.reason}`,
  });
  addNotification({
    recipientRole: 'QP',
    title: `EISA sitting ${verb}`,
    body: `Your EISA sitting for "${sitting.qualificationTitle}" on ${sitting.date} has been ${verb}: ${params.reason}`,
  });

  return updated;
}
