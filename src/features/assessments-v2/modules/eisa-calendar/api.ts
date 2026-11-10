import { readStore, writeStore } from '../../mock/api/storage';
import { addNotification } from '../../shared/notifications/store';
import { appendAuditEntry } from '../../shared/audit/auditLog';
import { performAction } from '../../shared/workflow/engine';
import { listQualificationsWithAccreditedSdps } from '../../mock/api/accreditation';
import { listApplications, listApprovedQsaAddenda } from '../qsa-addendum/api';
import { approvedSittingsOf } from '../qsa-addendum/assessmentDetails';
import { listRegistrationsForSitting, listSittingIdsWithRegistrations as listRegisteredSittingIds } from '../eisa-registration/api';
import type { Role } from '../../types';
import { CALENDAR_REVIEWER_ROLE, DEFAULT_SITTINGS_PER_YEAR, REQUEST_RECOMMENDER_ROLE } from './config';
import { SUPER_ADMIN_ROLE } from '../../config/administration';
import { checkSittingDate } from './dateChecks';
import { calcRegistrationClosingDate, closingDateOf } from './registrationClosing';
import { BATCH_WORKFLOW, SITTING_LIFECYCLE_WORKFLOW } from './workflow';
import type {
  AddSittingInput,
  EditSittingInput,
  EisaSitting,
  EisaSittingBatch,
  EligibleQualification,
  ProposeSittingBatchInput,
} from './types';

export const BATCHES_KEY = 'eisaCalendar:batches';
export const SITTINGS_KEY = 'eisaCalendar:sittings';

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
// QASA when one exists for that QP and qualification; otherwise DEFAULT_SITTINGS_PER_YEAR.
// QCTO feedback 05.2/05.6: "approved" is isQasaApproved, and the count is the approved one
// (approvedSittingsOf), which a running review does not change.
export async function listEligibleQualifications(): Promise<EligibleQualification[]> {
  const [qualifications, approved, allQasa] = await Promise.all([
    listQualificationsWithAccreditedSdps(),
    listApprovedQsaAddenda(),
    listApplications(),
  ]);
  return qualifications.map((q) => {
    const anyQasa = allQasa.find((a) => a.qpId === q.qpId && a.qualificationTitle.trim().toLowerCase() === q.qualificationName.toLowerCase());
    const qasa = approved.find((a) => {
      const sittings = approvedSittingsOf(a);
      return (
        a.qpId === q.qpId &&
        a.qualificationTitle.trim().toLowerCase() === q.qualificationName.toLowerCase() &&
        (sittings.sittingsPerYear != null || sittings.onDemand)
      );
    });
    const sittings = qasa ? approvedSittingsOf(qasa) : null;
    const onDemand = sittings?.onDemand === true;
    const fromQasa = sittings?.sittingsPerYear ?? null;
    return {
      qualificationId: q.qualificationId,
      qualificationTitle: q.qualificationName,
      qpId: q.qpId,
      qpName: q.qpName,
      sittingsPerYear: onDemand ? 0 : (fromQasa ?? DEFAULT_SITTINGS_PER_YEAR),
      sittingsPerYearIsDefault: !onDemand && fromQasa == null,
      onDemand,
      nqfLevel: (qasa ?? anyQasa)?.nqfLevel || null,
      credits: (qasa ?? anyQasa)?.credits || null,
    };
  });
}

// QCTO feedback 2.4: the required sittings per year are a minimum on the propose form (extra
// rows are special sittings); an "On demand" qualification only needs one date.
export function minimumDateCount(requiredCount: number, onDemand: boolean | undefined): number {
  return onDemand ? 1 : Math.max(requiredCount, 1);
}

export function requiredCountText(requiredCount: number, onDemand: boolean | undefined): string {
  return onDemand ? 'On demand' : String(requiredCount);
}

// CR-030/CR-032: the checks every set of proposed dates must pass before it reaches QCTO.
function assertValidBatchDates(dates: string[], year: number, title: string, requiredCount: number, onDemand: boolean | undefined): void {
  const minimum = minimumDateCount(requiredCount, onDemand);
  if (dates.length < minimum) {
    throw new Error(
      onDemand
        ? `"${title}" needs at least one date.`
        : `"${title}" requires ${requiredCount} sitting(s) per year — you submitted ${dates.length}.`,
    );
  }
  if (new Set(dates).size !== dates.length) {
    throw new Error('Duplicate dates are not allowed in the same submission.');
  }
  for (const date of dates) {
    if (Number(date.slice(0, 4)) !== year) {
      throw new Error(`${date} is not in ${year}.`);
    }
    const check = checkSittingDate(date, undefined, onDemand === true);
    if (!check.ok) {
      throw new Error(`${date}: ${check.reasons.join(' ')}`);
    }
  }
}

// QCTO feedback 29.13: the calendar reviewer and the DD are told when a QP sets or changes the
// dates of an on-demand qualification.
function notifyOnDemandScheduleChange(batch: EisaSittingBatch): void {
  if (!batch.onDemand) return;
  for (const recipientRole of [CALENDAR_REVIEWER_ROLE, REQUEST_RECOMMENDER_ROLE]) {
    addNotification({
      recipientRole,
      title: 'On-demand schedule updated',
      body: `${batch.qpName} updated the on-demand schedule for ${batch.qualificationTitle} (${batch.dates.length} ${batch.dates.length === 1 ? 'date' : 'dates'})`,
    });
  }
}

// Directly added or edited sittings carry the flag too, so their closing date follows the right rule.
async function isOnDemandQualification(qualificationId: string | null, qpId: string): Promise<boolean> {
  if (!qualificationId) return false;
  const eligible = await listEligibleQualifications();
  return eligible.some((q) => q.qualificationId === qualificationId && q.qpId === qpId && q.onDemand);
}

function proposedSittingRows(batch: EisaSittingBatch, createdBy: string): EisaSitting[] {
  return batch.dates.map((date) => ({
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
    onDemand: batch.onDemand === true ? true : undefined,
    createdBy,
    createdAt: new Date().toISOString(),
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
  const match = eligible.find((q) => q.qualificationId === input.qualificationId && q.qpId === input.qpId);
  if (!match) {
    throw new Error('This qualification has no accredited SDPs under this QP.');
  }

  assertValidBatchDates(input.dates, input.year, input.qualificationTitle, match.sittingsPerYear, match.onDemand);

  const batch: EisaSittingBatch = {
    id: crypto.randomUUID(),
    qualificationId: match.qualificationId,
    qualificationTitle: input.qualificationTitle,
    qpId: input.qpId,
    qpName: input.qpName,
    year: input.year,
    requiredCount: match.sittingsPerYear,
    onDemand: match.onDemand,
    dates: [...input.dates].sort(),
    state: { stageId: 'qcto-review', submittedBy: input.submittedBy, submittedById: input.submittedById },
    rejectionReason: null,
    rejectionHistory: [],
    submittedBy: input.submittedBy,
    submittedAt: new Date().toISOString(),
  };

  saveBatches([batch, ...loadBatches()]);
  saveSittings([...proposedSittingRows(batch, input.submittedBy), ...loadSittings()]);
  notifyOnDemandScheduleChange(batch);
  return batch;
}

// QCTO feedback 3.4: a bulk upload becomes one normal proposal batch per qualification and year.
// Every batch is checked before any is written, so a bad file never leaves half its dates
// behind. Unlike the single-date form, the count must match the sittings per year exactly.
export async function proposeBulkSittingBatches(inputs: ProposeSittingBatchInput[]): Promise<EisaSittingBatch[]> {
  if (inputs.length === 0) throw new Error('The file has no dates to submit.');
  const eligible = await listEligibleQualifications();
  for (const input of inputs) {
    const match = eligible.find((q) => q.qualificationId === input.qualificationId && q.qpId === input.qpId);
    if (!match) throw new Error(`Qualification ${input.qualificationId} has no accredited SDPs under this QP.`);
    if (!match.onDemand && input.dates.length !== match.sittingsPerYear) {
      throw new Error(`"${match.qualificationTitle}" (${input.year}) requires ${match.sittingsPerYear} date(s) — the file has ${input.dates.length}.`);
    }
    assertValidBatchDates(input.dates, input.year, match.qualificationTitle, match.sittingsPerYear, match.onDemand);
  }
  const created: EisaSittingBatch[] = [];
  for (const input of inputs) created.push(await proposeSittingBatch(input));
  return created;
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

  assertValidBatchDates(params.dates, batch.year, batch.qualificationTitle, batch.requiredCount, batch.onDemand);

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
  saveSittings([...proposedSittingRows(updatedBatch, params.actorName), ...otherSittings]);

  addNotification({
    recipientRole: CALENDAR_REVIEWER_ROLE,
    title: 'EISA sitting dates resubmitted',
    body: `"${batch.qualificationTitle}" (${batch.year}) dates were corrected and resubmitted for review.`,
  });
  notifyOnDemandScheduleChange(updatedBatch);

  return updatedBatch;
}

// QCTO feedback 2.4: the QP may edit their own proposal until it is published. Editing an
// approved batch sends it back for review, since the ASD approved different dates. Not a
// BATCH_WORKFLOW action: those stages belong to the ASD, so the edit is audited here directly.
export const QP_EDITABLE_BATCH_STAGES = ['qcto-review', 'approved'];

interface EditBatchParams {
  batchId: string;
  dates: string[];
  actorRole: Role;
  actorId: string;
  actorName: string;
  actorQpId: string | undefined;
}

export async function editBatchDates(params: EditBatchParams): Promise<EisaSittingBatch> {
  const batches = loadBatches();
  const batch = batches.find((b) => b.id === params.batchId);
  if (!batch) throw new Error('EISA sitting batch not found.');
  if (params.actorRole !== 'QP' || params.actorQpId !== batch.qpId) {
    throw new Error('Only the QP who proposed these dates can edit them.');
  }
  if (!QP_EDITABLE_BATCH_STAGES.includes(batch.state.stageId)) {
    throw new Error('These dates can no longer be edited.');
  }

  assertValidBatchDates(params.dates, batch.year, batch.qualificationTitle, batch.requiredCount, batch.onDemand);

  const wasApproved = batch.state.stageId === 'approved';
  const updatedBatch: EisaSittingBatch = {
    ...batch,
    dates: [...params.dates].sort(),
    state: { stageId: 'qcto-review', submittedBy: params.actorName, submittedById: params.actorId },
  };
  saveBatches(batches.map((b) => (b.id === batch.id ? updatedBatch : b)));
  const otherSittings = loadSittings().filter((s) => s.batchId !== batch.id);
  saveSittings([...proposedSittingRows(updatedBatch, params.actorName), ...otherSittings]);

  appendAuditEntry({
    recordType: 'eisa-calendar-batch',
    recordId: batch.id,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    action: wasApproved ? 'Edited the approved dates — back for review' : 'Edited the proposed dates',
    note: `${batch.dates.join(', ')} → ${updatedBatch.dates.join(', ')}`,
  });
  addNotification({
    recipientRole: CALENDAR_REVIEWER_ROLE,
    title: 'EISA sitting dates edited',
    body: `The QP edited the proposed dates for "${batch.qualificationTitle}" (${batch.year}). Please review them again.`,
  });
  notifyOnDemandScheduleChange(updatedBatch);

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
    onDemand: (await isOnDemandQualification(input.qualificationId, input.qpId)) || undefined,
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

// QCTO feedback 2.4: the ASD edits (or deletes) only unpublished sittings. A published sitting
// changes only through an approved postponement or cancellation request (changeRequests.ts).
export const UNPUBLISHED_SITTING_STATUSES: EisaSitting['status'][] = ['proposed', 'approved', 'rejected'];

function assertUnpublished(sitting: EisaSitting, verb: string): void {
  if (!UNPUBLISHED_SITTING_STATUSES.includes(sitting.status)) {
    throw new Error(`A ${sitting.status} sitting cannot be ${verb}. Raise a postponement or cancellation request instead.`);
  }
}

export async function editSitting(id: string, patch: EditSittingInput, actorId: string, actorName: string): Promise<EisaSitting> {
  const sittings = loadSittings();
  const existing = sittings.find((s) => s.id === id);
  if (!existing) throw new Error('Sitting not found.');
  assertUnpublished(existing, 'updated');

  const updated: EisaSitting = { ...existing, ...patch, onDemand: (await isOnDemandQualification(patch.qualificationId, patch.qpId)) || undefined };
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
  assertUnpublished(existing, 'deleted');

  const registrations = await listRegistrationsForSitting(id);
  if (registrations.length > 0) {
    throw new Error(`This sitting already has ${registrations.length} registration(s) against it and cannot be deleted.`);
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
  // Row 22/23 (D-11): postpone-only — the new date carried in the SDP/QP notification and the
  // audit trail note.
  proposedNewDate?: string | null;
}

// CR-034: cancellation/postponement — reason required, notifies the affected SDPs (and the
// QP), full audit trail via the shared workflow engine. QCTO feedback 2.4: only called by
// changeRequests.ts when a request is approved; no screen calls it directly. A postponement
// notice lists the learners already registered — they stay on the original sitting.
export async function applyApprovedSittingChange(params: SittingLifecycleParams): Promise<EisaSitting> {
  const sittings = loadSittings();
  const sitting = sittings.find((s) => s.id === params.sittingId);
  if (!sitting) throw new Error('Sitting not found.');

  const proposedNewDate = params.actionId === 'sitting-postpone' ? (params.proposedNewDate ?? null) : null;
  const auditNote = proposedNewDate ? `${params.reason} (Proposed new date: ${proposedNewDate})` : params.reason;
  const learnerNote = params.actionId === 'sitting-postpone' ? registeredLearnersNote(await registeredLearnerNames(sitting.id)) : '';

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
  const dateNote = proposedNewDate ? ` The new date is ${proposedNewDate}.` : '';
  addNotification({
    recipientRole: 'SDP',
    title: `EISA sitting ${verb}`,
    body: `The EISA sitting for "${sitting.qualificationTitle}" on ${sitting.date} has been ${verb}: ${params.reason}${dateNote}${learnerNote}`,
  });
  addNotification({
    recipientRole: 'QP',
    title: `EISA sitting ${verb}`,
    body: `Your EISA sitting for "${sitting.qualificationTitle}" on ${sitting.date} has been ${verb}: ${params.reason}${dateNote}${learnerNote}`,
  });

  return updated;
}

export async function registeredLearnerNames(sittingId: string): Promise<string[]> {
  const registrations = await listRegistrationsForSitting(sittingId);
  return registrations.flatMap((r) => r.learners.map((l) => `${l.fullName} (${r.sdpName})`));
}

export function registeredLearnersNote(names: string[]): string {
  if (names.length === 0) return ' No learners are registered for this sitting yet.';
  return ` Learners already registered (they stay registered for this sitting and are not moved): ${names.join('; ')}.`;
}

// Batch S (05.11): the super admin moves one published sitting's registration closing date, earlier
// or later than the calculated one but never after the sitting itself. SDPs and the QP are told.
interface ClosingOverrideParams {
  sittingId: string;
  reason: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
}

function assertSuperAdmin(role: Role): void {
  if (role !== SUPER_ADMIN_ROLE) throw new Error('Only the super admin can change a registration closing date.');
}

function notifyClosingDateChange(sitting: EisaSitting, from: string, to: string, reason: string, reset: boolean): void {
  const what = reset ? `is back to the calculated date, ${to} (it was ${from})` : `has been changed by the super admin from ${from} to ${to}`;
  for (const recipientRole of ['SDP', 'QP']) {
    addNotification({
      recipientRole,
      title: 'Registration closing date changed',
      body: `EISA sitting for "${sitting.qualificationTitle}" on ${sitting.date}: registration closing ${what}. Reason: ${reason}`,
    });
  }
}

export async function setRegistrationClosingOverride(params: ClosingOverrideParams & { date: string }): Promise<EisaSitting> {
  assertSuperAdmin(params.actorRole);
  const sittings = loadSittings();
  const sitting = sittings.find((s) => s.id === params.sittingId);
  if (!sitting) throw new Error('Sitting not found.');
  if (sitting.status !== 'published') throw new Error('Only a published sitting can have its closing date changed.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) throw new Error('Choose a closing date.');
  if (params.date > sitting.date) throw new Error(`The closing date cannot be after the sitting date (${sitting.date}).`);
  const calculated = calcRegistrationClosingDate(sitting.date, sitting.onDemand);
  if (params.date === calculated) throw new Error('That is the calculated date. Use "Reset to calculated" instead.');
  if (!params.reason.trim()) throw new Error('A reason is required.');

  const before = closingDateOf(sitting);
  const updated: EisaSitting = {
    ...sitting,
    registrationClosingOverride: {
      date: params.date,
      reason: params.reason.trim(),
      calculatedDate: calculated,
      changedByName: params.actorName,
      changedAt: new Date().toISOString(),
    },
  };
  saveSittings(sittings.map((s) => (s.id === sitting.id ? updated : s)));
  appendAuditEntry({
    recordType: 'eisa-calendar-sitting',
    recordId: sitting.id,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    action: `Registration closing date changed from ${before} to ${params.date}`,
    note: params.reason.trim(),
  });
  notifyClosingDateChange(sitting, before, params.date, params.reason.trim(), false);
  return updated;
}

export async function resetRegistrationClosingOverride(params: ClosingOverrideParams): Promise<EisaSitting> {
  assertSuperAdmin(params.actorRole);
  const sittings = loadSittings();
  const sitting = sittings.find((s) => s.id === params.sittingId);
  if (!sitting) throw new Error('Sitting not found.');
  if (!sitting.registrationClosingOverride) throw new Error('This sitting already uses the calculated closing date.');
  if (!params.reason.trim()) throw new Error('A reason is required.');

  const before = closingDateOf(sitting);
  const updated: EisaSitting = { ...sitting, registrationClosingOverride: null };
  saveSittings(sittings.map((s) => (s.id === sitting.id ? updated : s)));
  const calculated = closingDateOf(updated);
  appendAuditEntry({
    recordType: 'eisa-calendar-sitting',
    recordId: sitting.id,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    action: `Registration closing date reset to calculated: ${before} to ${calculated}`,
    note: params.reason.trim(),
  });
  notifyClosingDateChange(sitting, before, calculated, params.reason.trim(), true);
  return updated;
}
