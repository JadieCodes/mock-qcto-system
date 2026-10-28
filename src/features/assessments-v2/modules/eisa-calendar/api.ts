import { readStore, writeStore } from '../../mock/api/storage';
import { addNotification } from '../../shared/notifications/store';
import { appendAuditEntry } from '../../shared/audit/auditLog';
import { performAction } from '../../shared/workflow/engine';
import { listQualificationsWithAccreditedSdps } from '../../mock/api/accreditation';
import { listApprovedQsaAddenda } from '../qsa-addendum/api';
import { listRegistrationsForSitting, listSittingIdsWithRegistrations as listRegisteredSittingIds } from '../eisa-registration/api';
import type { Role } from '../../types';
import { CALENDAR_REVIEWER_ROLE, DEFAULT_SITTINGS_PER_YEAR } from './config';
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

// QCTO feedback 1.8: every qualification with accredited SDPs must have an EISA date, so no
// approved QASA is needed. CR-030: the sittings-per-year count still comes from the approved
// QASA (evaluationReport.approvedEisaSittingsPerYear) when one exists for that QP and
// qualification; otherwise DEFAULT_SITTINGS_PER_YEAR.
export async function listEligibleQualifications(): Promise<EligibleQualification[]> {
  const [qualifications, approved] = await Promise.all([listQualificationsWithAccreditedSdps(), listApprovedQsaAddenda()]);
  return qualifications.map((q) => {
    const qasa = approved.find(
      (a) =>
        a.qpId === q.qpId &&
        a.qualificationTitle.trim().toLowerCase() === q.qualificationName.toLowerCase() &&
        a.evaluationReport.approvedEisaSittingsPerYear != null,
    );
    const fromQasa = qasa?.evaluationReport.approvedEisaSittingsPerYear ?? null;
    return {
      qualificationId: q.qualificationId,
      qualificationTitle: q.qualificationName,
      qpId: q.qpId,
      qpName: q.qpName,
      sittingsPerYear: fromQasa ?? DEFAULT_SITTINGS_PER_YEAR,
      sittingsPerYearIsDefault: fromQasa == null,
    };
  });
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
  const match = eligible.find((q) => q.qualificationId === input.qualificationId && q.qpId === input.qpId);
  if (!match) {
    throw new Error('This qualification has no accredited SDPs under this QP.');
  }

  // CR-030: block if the submitted count does not match the required frequency exactly.
  if (input.dates.length !== match.sittingsPerYear) {
    throw new Error(
      `"${input.qualificationTitle}" requires ${match.sittingsPerYear} sitting(s) per year — you submitted ${input.dates.length}.`,
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
    qualificationId: match.qualificationId,
    qualificationTitle: input.qualificationTitle,
    qpId: input.qpId,
    qpName: input.qpName,
    year: input.year,
    requiredCount: match.sittingsPerYear,
    dates: [...input.dates].sort(),
    state: { stageId: 'qcto-review', submittedBy: input.submittedBy, submittedById: input.submittedById },
    rejectionReason: null,
    rejectionHistory: [],
    submittedBy: input.submittedBy,
    submittedAt: new Date().toISOString(),
  };

  const sittings: EisaSitting[] = batch.dates.map((date) => ({
    id: crypto.randomUUID(),
    batchId: batch.id,
    qualificationId: match.qualificationId,
    qualificationTitle: input.qualificationTitle,
    qpId: input.qpId,
    qpName: input.qpName,
    year: input.year,
    date,
    status: 'proposed',
    rejectionReason: null,
    postponementReason: null,
    proposedNewDate: null,
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
    rejectionHistory:
      params.actionId === 'batch-reject'
        ? [...batch.rejectionHistory, { reason: params.note ?? '', rejectedAt: new Date().toISOString() }]
        : batch.rejectionHistory,
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

interface ResubmitBatchParams {
  batchId: string;
  dates: string[];
  actorRole: Role;
  actorId: string;
  actorName: string;
}

// Row 21 (D-08): a rejected batch does not have to be abandoned — the QP corrects the dates
// and resubmits the same batch for review. The earlier rejection reason stays on
// `rejectionHistory` (never cleared), so it's still visible after this.
export async function resubmitBatch(params: ResubmitBatchParams): Promise<EisaSittingBatch> {
  const batches = loadBatches();
  const batch = batches.find((b) => b.id === params.batchId);
  if (!batch) throw new Error('EISA sitting batch not found.');

  if (params.dates.length !== batch.requiredCount) {
    throw new Error(`"${batch.qualificationTitle}" requires ${batch.requiredCount} sitting(s) per year — you submitted ${params.dates.length}.`);
  }
  if (new Set(params.dates).size !== params.dates.length) {
    throw new Error('Duplicate dates are not allowed in the same submission.');
  }
  for (const date of params.dates) {
    if (Number(date.slice(0, 4)) !== batch.year) {
      throw new Error(`${date} is not in ${batch.year}.`);
    }
    const check = checkSittingDate(date);
    if (!check.ok) {
      throw new Error(`${date}: ${check.reasons.join(' ')}`);
    }
  }

  const nextState = performAction({
    definition: BATCH_WORKFLOW,
    record: batch.state,
    actionId: 'batch-resubmit',
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    recordType: 'eisa-calendar-batch',
    recordId: batch.id,
  });

  const updatedBatch: EisaSittingBatch = { ...batch, dates: [...params.dates].sort(), state: nextState };
  saveBatches(batches.map((b) => (b.id === batch.id ? updatedBatch : b)));

  // Fresh sitting rows for the corrected dates — same shape as a brand-new proposal. The
  // batch's own rejectionHistory (not touched here) is what keeps the earlier reason visible.
  const otherSittings = loadSittings().filter((s) => s.batchId !== batch.id);
  const newSittings: EisaSitting[] = updatedBatch.dates.map((date) => ({
    id: crypto.randomUUID(),
    batchId: batch.id,
    qualificationId: batch.qualificationId ?? null,
    qualificationTitle: batch.qualificationTitle,
    qpId: batch.qpId,
    qpName: batch.qpName,
    year: batch.year,
    date,
    status: 'proposed',
    rejectionReason: null,
    postponementReason: null,
    proposedNewDate: null,
    cancellationReason: null,
    createdBy: params.actorName,
    createdAt: new Date().toISOString(),
  }));
  saveSittings([...newSittings, ...otherSittings]);

  addNotification({
    recipientRole: CALENDAR_REVIEWER_ROLE,
    title: 'EISA sitting dates resubmitted',
    body: `"${batch.qualificationTitle}" (${batch.year}) dates were corrected and resubmitted for review.`,
  });

  return updatedBatch;
}

// Row 22/23 (D-17): lets the internal calendar view disable/explain the Delete action before
// the QP even tries it, instead of only surfacing the block as an error after the click.
export async function listSittingIdsWithRegistrations(): Promise<string[]> {
  return listRegisteredSittingIds();
}

// CR-027: QCTO can add a sitting directly — it goes straight to "published", no QP proposal
// or review needed, since the person adding it is the approving authority.
export async function addSitting(input: AddSittingInput): Promise<EisaSitting> {
  const sitting: EisaSitting = {
    id: crypto.randomUUID(),
    batchId: null,
    qualificationId: input.qualificationId,
    qualificationTitle: input.qualificationTitle,
    qpId: input.qpId,
    qpName: input.qpName,
    year: input.year,
    date: input.date,
    status: 'published',
    rejectionReason: null,
    postponementReason: null,
    proposedNewDate: null,
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
        ? `Updated sitting — date changed from ${existing.date} to ${patch.date}`
        : 'Updated sitting',
  });
  // QCTO feedback 1.9: the QP is told about an update, the same as a postpone or cancel.
  const dateNote = patch.date !== existing.date ? ` The date changed from ${existing.date} to ${patch.date}.` : '';
  addNotification({
    recipientRole: 'QP',
    title: 'EISA sitting updated',
    body: `Your EISA sitting for "${updated.qualificationTitle}" on ${updated.date} has been updated by QCTO.${dateNote}`,
  });
  return updated;
}

// Row 22/23 (D-17): deleting a sitting that already has registrations against it would orphan
// them, so it's blocked outright — postpone or cancel is the correct action once registrations
// exist. Edit is unaffected by this rule.
export async function deleteSitting(id: string, actorId: string, actorName: string): Promise<void> {
  const sittings = loadSittings();
  const existing = sittings.find((s) => s.id === id);
  if (!existing) throw new Error('Sitting not found.');

  const registrations = await listRegistrationsForSitting(id);
  if (registrations.length > 0) {
    throw new Error(
      `This sitting already has ${registrations.length} registration(s) against it and cannot be deleted. Postpone or cancel it instead.`,
    );
  }

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
  // Row 22/23 (D-11): optional, postpone-only — no negotiation, just a proposed replacement
  // date carried in the SDP/QP notification and the audit trail note.
  proposedNewDate?: string | null;
}

// CR-034: cancellation/postponement — QCTO-initiated only, reason required, notifies the
// affected SDPs (and the QP), full audit trail via the shared workflow engine.
export async function performSittingLifecycleAction(params: SittingLifecycleParams): Promise<EisaSitting> {
  const sittings = loadSittings();
  const sitting = sittings.find((s) => s.id === params.sittingId);
  if (!sitting) throw new Error('Sitting not found.');

  const proposedNewDate = params.actionId === 'sitting-postpone' ? (params.proposedNewDate ?? null) : null;
  const auditNote = proposedNewDate ? `${params.reason} (Proposed new date: ${proposedNewDate})` : params.reason;

  const nextState = performAction({
    definition: SITTING_LIFECYCLE_WORKFLOW,
    record: { stageId: sitting.status },
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: auditNote,
    recordType: 'eisa-calendar-sitting',
    recordId: sitting.id,
  });

  const updated: EisaSitting = {
    ...sitting,
    status: nextState.stageId as EisaSitting['status'],
    postponementReason: params.actionId === 'sitting-postpone' ? params.reason : sitting.postponementReason,
    proposedNewDate: params.actionId === 'sitting-postpone' ? proposedNewDate : sitting.proposedNewDate,
    cancellationReason: params.actionId === 'sitting-cancel' ? params.reason : sitting.cancellationReason,
  };
  saveSittings(sittings.map((s) => (s.id === sitting.id ? updated : s)));

  const verb = params.actionId === 'sitting-postpone' ? 'postponed' : 'cancelled';
  const dateNote = proposedNewDate ? ` A new date of ${proposedNewDate} has been proposed.` : '';
  addNotification({
    recipientRole: 'SDP',
    title: `EISA sitting ${verb}`,
    body: `The EISA sitting for "${sitting.qualificationTitle}" on ${sitting.date} has been ${verb}: ${params.reason}${dateNote}`,
  });
  addNotification({
    recipientRole: 'QP',
    title: `EISA sitting ${verb}`,
    body: `Your EISA sitting for "${sitting.qualificationTitle}" on ${sitting.date} has been ${verb}: ${params.reason}${dateNote}`,
  });

  return updated;
}
