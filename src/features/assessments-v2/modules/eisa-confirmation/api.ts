import { appendAuditEntry } from '../../shared/audit/auditLog';
import { toIsoDate } from '../../shared/dates/workingDays';
import { addNotification } from '../../shared/notifications/store';
import { performAction } from '../../shared/workflow/engine';
import type { WorkflowRecordState } from '../../shared/workflow/types';
import { listAccreditedAssessmentCentres } from '../../mock/api/accreditation';
import { readStore, writeStore } from '../../mock/api/storage';
import { listSittings } from '../eisa-calendar/api';
import { listRegisteredRegistrationsForSitting } from '../eisa-registration/api';
import { CONFIRMATION_REVIEWER_ROLE } from './config';
import { isListShareable, shareDateFor, sharedAtFor } from './sharing';
import { CONFIRMATION_WORKFLOW } from './workflow';
import type {
  CentreConfirmation,
  ConfirmationDraftInput,
  ConsolidatedLearnerRow,
  EisaConfirmationRecord,
  ReviewConfirmationInput,
  SubmitConfirmationInput,
  UpcomingShare,
} from './types';

export const KEY = 'eisaConfirmation:records';
const RECORD_TYPE = 'eisa-confirmation';

// What may be in storage: the Batch T shape, or a record saved before it (the QP acknowledged and
// then confirmed; the ASD generated it).
interface LegacyLearnerRow {
  learnerId: string;
  fullName: string;
  sdpName: string;
  assessmentCentre?: string | null;
  idNumber?: string;
  pathway?: ConsolidatedLearnerRow['pathway'];
  registrationNumber?: string;
}

type BatchTFields =
  | 'returns'
  | 'sharedAt'
  | 'centres'
  | 'confirmedCentres'
  | 'markingDates'
  | 'moderationDates'
  | 'resultsSubmissionDate'
  | 'draftSavedAt'
  | 'submittedAt'
  | 'acceptedAt'
  | 'acceptedBy';

type StoredConfirmation = Omit<EisaConfirmationRecord, 'learners' | BatchTFields> &
  Partial<Pick<EisaConfirmationRecord, BatchTFields>> & {
    learners: LegacyLearnerRow[];
    generatedAt?: string;
  };

const LEGACY_AWAITING_STAGES = ['awaiting-qp-ack', 'awaiting-qp-confirmation'];

// Batch T: an old confirmed record becomes accepted; an old record awaiting acknowledgement or
// confirmation becomes a QP draft with its learners, none allocated yet. Safe to run on a record
// that is already in the new shape (nothing is written back, so it is the same every load).
function migrateRecord(stored: StoredConfirmation): EisaConfirmationRecord {
  const legacyStage = stored.workflow.stageId;
  const stageId = legacyStage === 'confirmed' ? 'accepted' : LEGACY_AWAITING_STAGES.includes(legacyStage) ? 'qp-draft' : legacyStage;
  const draftFromLegacy = LEGACY_AWAITING_STAGES.includes(legacyStage);
  const sharedAt = stored.sharedAt ?? stored.generatedAt ?? new Date().toISOString();
  const learners: ConsolidatedLearnerRow[] = stored.learners.map((l) => ({
    learnerId: l.learnerId,
    fullName: l.fullName,
    idNumber: l.idNumber ?? '',
    sdpName: l.sdpName,
    pathway: l.pathway ?? 'Formal',
    registrationNumber: l.registrationNumber ?? '',
    assessmentCentre: draftFromLegacy ? null : (l.assessmentCentre ?? null),
  }));
  const workflow: WorkflowRecordState = { ...stored.workflow, stageId };
  const markingDates = stored.markingDates ?? (stored.markingDate ? [stored.markingDate] : []);
  const moderationDates = stored.moderationDates ?? (stored.moderationDate ? [stored.moderationDate] : []);
  return {
    ...stored,
    learners,
    workflow,
    centres: draftFromLegacy ? [] : (stored.centres ?? []),
    confirmedCentres: draftFromLegacy ? null : (stored.confirmedCentres ?? null),
    markingDates,
    moderationDates,
    resultsSubmissionDate: stored.resultsSubmissionDate ?? null,
    returns: stored.returns ?? [],
    sharedAt,
    draftSavedAt: stored.draftSavedAt ?? null,
    submittedAt: stored.submittedAt ?? null,
    acceptedAt: stored.acceptedAt ?? null,
    acceptedBy: stored.acceptedBy ?? null,
  };
}

function loadAll(): EisaConfirmationRecord[] {
  return readStore<StoredConfirmation[]>(KEY, []).map(migrateRecord);
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

// Batch T (29.20): the system builds the consolidated list for every sitting whose registration has
// closed and shares it with the QP. There is no server to run this on a timer, so it runs whenever
// the list is read; a sitting is only ever shared once. One run at a time, so two screens reading
// together cannot share the same sitting twice.
let shareRun: Promise<void> | null = null;

async function shareDueLists(): Promise<void> {
  const today = toIsoDate(new Date());
  for (const sitting of await listSittings()) {
    if (sitting.status !== 'published') continue;
    if (loadAll().some((r) => r.sittingId === sitting.id)) continue;
    if (!isListShareable(sitting.date, today, sitting.onDemand)) continue;

    const registrations = await listRegisteredRegistrationsForSitting(sitting.id);
    if (registrations.length === 0) continue;
    const all = loadAll();
    if (all.some((r) => r.sittingId === sitting.id)) continue;

    const learners: ConsolidatedLearnerRow[] = registrations.flatMap((r) =>
      r.learners.map((l) => ({
        learnerId: l.learnerId,
        fullName: l.fullName,
        idNumber: l.idNumber,
        sdpName: r.sdpName,
        pathway: l.rplArpl ? ('RPL/ARPL' as const) : ('Formal' as const),
        registrationNumber: r.registrationNumber ?? '',
        assessmentCentre: null,
      })),
    );
    const record: EisaConfirmationRecord = {
      id: crypto.randomUUID(),
      sittingId: sitting.id,
      sittingDate: sitting.date,
      qualificationTitle: sitting.qualificationTitle,
      qpId: sitting.qpId,
      qpName: sitting.qpName,
      registrationIds: registrations.map((r) => r.id),
      learners,
      centres: [],
      confirmedCentres: null,
      markingDates: [],
      moderationDates: [],
      markingDate: null,
      moderationDate: null,
      resultsSubmissionDate: null,
      workflow: { stageId: 'qp-draft' },
      returns: [],
      sharedAt: sharedAtFor(shareDateFor(sitting.date, sitting.onDemand)),
      draftSavedAt: null,
      submittedAt: null,
      acceptedAt: null,
      acceptedBy: null,
    };
    saveAll([record, ...all]);
    addNotification({
      recipientRole: 'QP',
      title: 'EISA learner list shared',
      body: `The consolidated learner list for "${sitting.qualificationTitle}" (${sitting.date}) is ready. Choose the assessment centres, allocate the learners and confirm the dates.`,
    });
  }
}

function shareDueListsOnce(): Promise<void> {
  if (!shareRun) {
    shareRun = shareDueLists().finally(() => {
      shareRun = null;
    });
  }
  return shareRun;
}

// Sittings with registered learners whose list is not shared yet (registration still open).
export async function listUpcomingShares(): Promise<UpcomingShare[]> {
  await shareDueListsOnce();
  const today = toIsoDate(new Date());
  const shared = new Set(loadAll().map((r) => r.sittingId));
  const upcoming: UpcomingShare[] = [];
  for (const sitting of await listSittings()) {
    if (sitting.status !== 'published' || shared.has(sitting.id)) continue;
    if (isListShareable(sitting.date, today, sitting.onDemand)) continue;
    const registrations = await listRegisteredRegistrationsForSitting(sitting.id);
    if (registrations.length === 0) continue;
    upcoming.push({
      sittingId: sitting.id,
      sittingDate: sitting.date,
      qualificationTitle: sitting.qualificationTitle,
      qpId: sitting.qpId,
      qpName: sitting.qpName,
      learnerCount: registrations.reduce((total, r) => total + r.learners.length, 0),
      shareDate: shareDateFor(sitting.date, sitting.onDemand),
    });
  }
  return upcoming.sort((a, b) => a.shareDate.localeCompare(b.shareDate));
}

export async function listRecords(): Promise<EisaConfirmationRecord[]> {
  await shareDueListsOnce();
  return loadAll();
}

export async function getRecord(id: string): Promise<EisaConfirmationRecord | undefined> {
  return loadAll().find((r) => r.id === id);
}

function requireQpStage(record: EisaConfirmationRecord): void {
  if (record.workflow.stageId !== 'qp-draft') throw new Error('This confirmation is no longer with the QP.');
}

function uniqueSortedDates(dates: string[]): string[] {
  return [...new Set(dates.filter((d) => d !== ''))].sort();
}

// 29.21: only centres accredited for the qualification, and a learner only goes to a chosen centre.
async function applyDraft(record: EisaConfirmationRecord, input: ConfirmationDraftInput): Promise<EisaConfirmationRecord> {
  const accredited = new Set((await listAccreditedAssessmentCentres(record.qualificationTitle)).map((c) => c.name));
  if (input.centres.some((c) => !accredited.has(c))) {
    throw new Error('Only assessment centres accredited for this qualification can be chosen.');
  }
  const chosen = new Set(input.centres);
  const learners = record.learners.map((l) => {
    const centre = input.allocation[l.learnerId] ?? null;
    if (centre !== null && !chosen.has(centre)) throw new Error(`${centre} is not one of the chosen assessment centres.`);
    return { ...l, assessmentCentre: centre };
  });
  const markingDates = uniqueSortedDates(input.markingDates);
  const moderationDates = uniqueSortedDates(input.moderationDates);
  return {
    ...record,
    centres: input.centres,
    learners,
    markingDates,
    moderationDates,
    markingDate: markingDates[0] ?? null,
    moderationDate: moderationDates[moderationDates.length - 1] ?? null,
    resultsSubmissionDate: input.resultsSubmissionDate || null,
  };
}

// The QP can save a draft before submitting; nothing is checked for completeness yet.
export async function saveConfirmationDraft(input: ConfirmationDraftInput): Promise<EisaConfirmationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, input.recordId);
  requireQpStage(record);
  const updated = { ...(await applyDraft(record, input)), draftSavedAt: new Date().toISOString() };
  saveAll(replace(all, updated));
  appendAuditEntry({ recordType: RECORD_TYPE, recordId: record.id, actorRole: 'QP', actorId: input.actorId, actorName: input.actorName, action: 'Saved a draft EISA Confirmation' });
  return updated;
}

function submissionIssues(record: EisaConfirmationRecord, declarationAccepted: boolean): string[] {
  const issues: string[] = [];
  if (record.centres.length === 0) issues.push('Choose at least one assessment centre.');
  const unallocated = record.learners.filter((l) => !l.assessmentCentre).length;
  if (unallocated > 0) issues.push(`Allocate every learner to an assessment centre (${unallocated} still unallocated).`);
  for (const centre of record.centres) {
    if (!record.learners.some((l) => l.assessmentCentre === centre)) issues.push(`${centre} has no learners. Allocate a learner to it or remove it.`);
  }
  if (record.markingDates.length === 0) issues.push('Enter at least one marking date.');
  if (record.moderationDates.length === 0) issues.push('Enter at least one moderation date.');
  if (record.markingDates.some((d) => d < record.sittingDate)) issues.push('A marking date cannot be before the EISA date.');
  if (record.markingDates.length > 0 && record.moderationDates.some((d) => d < record.markingDates[0])) {
    issues.push('A moderation date cannot be before the first marking date.');
  }
  if (!record.resultsSubmissionDate) issues.push('Enter the results submission date.');
  else if (record.resultsSubmissionDate < record.sittingDate) issues.push('The results submission date cannot be before the EISA date.');
  if (!declarationAccepted) issues.push('Tick the declaration.');
  return issues;
}

// 29.20: the confirmation comes from the QP. Does NOT create a site visit (CR-044).
export async function submitConfirmation(input: SubmitConfirmationInput): Promise<EisaConfirmationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, input.recordId);
  requireQpStage(record);
  const draft = await applyDraft(record, input);
  const issues = submissionIssues(draft, input.declarationAccepted);
  if (issues.length > 0) throw new Error(issues[0]);

  const workflow = performAction({
    definition: CONFIRMATION_WORKFLOW,
    record: record.workflow,
    actionId: 'conf-submit',
    actorRole: 'QP',
    actorId: input.actorId,
    actorName: input.actorName,
    recordType: RECORD_TYPE,
    recordId: record.id,
  });
  const confirmedCentres: CentreConfirmation[] = draft.centres.map((centre) => ({
    centre,
    learnerCount: draft.learners.filter((l) => l.assessmentCentre === centre).length,
  }));
  const updated: EisaConfirmationRecord = { ...draft, workflow, confirmedCentres, submittedAt: new Date().toISOString() };
  saveAll(replace(all, updated));

  addNotification({
    recipientRole: CONFIRMATION_REVIEWER_ROLE,
    title: 'EISA Confirmation submitted',
    body: `${record.qpName} submitted the EISA Confirmation for "${record.qualificationTitle}" (${record.sittingDate}) for your review.`,
  });
  return updated;
}

// 29.20 (29 Oct 2:25:00): the ASD accepts the QP's confirmation. Once accepted it feeds the results batch.
export async function acceptConfirmation(input: ReviewConfirmationInput): Promise<EisaConfirmationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, input.recordId);
  const workflow = performAction({
    definition: CONFIRMATION_WORKFLOW,
    record: record.workflow,
    actionId: 'conf-accept',
    actorRole: input.actorRole,
    actorId: input.actorId,
    actorName: input.actorName,
    recordType: RECORD_TYPE,
    recordId: record.id,
  });
  const updated: EisaConfirmationRecord = { ...record, workflow, acceptedAt: new Date().toISOString(), acceptedBy: input.actorName };
  saveAll(replace(all, updated));

  addNotification({
    recipientRole: 'QP',
    title: 'EISA Confirmation accepted',
    body: `"${record.qualificationTitle}" (${record.sittingDate}) is accepted: marking ${updated.markingDate}, moderation ${updated.moderationDate}.`,
  });
  return updated;
}

export async function returnConfirmationToQp(input: ReviewConfirmationInput): Promise<EisaConfirmationRecord> {
  const reason = input.reason?.trim() ?? '';
  if (!reason) throw new Error('Give the reason for returning the confirmation to the QP.');
  const all = loadAll();
  const record = getOrThrow(all, input.recordId);
  const workflow = performAction({
    definition: CONFIRMATION_WORKFLOW,
    record: record.workflow,
    actionId: 'conf-return',
    actorRole: input.actorRole,
    actorId: input.actorId,
    actorName: input.actorName,
    recordType: RECORD_TYPE,
    recordId: record.id,
    note: reason,
  });
  const entry = { cycle: record.returns.length + 1, reason, returnedAt: new Date().toISOString(), returnedBy: input.actorName, returnedById: input.actorId };
  const updated: EisaConfirmationRecord = { ...record, workflow, returns: [...record.returns, entry] };
  saveAll(replace(all, updated));

  addNotification({
    recipientRole: 'QP',
    title: 'EISA Confirmation returned',
    body: `The EISA Confirmation for "${record.qualificationTitle}" (${record.sittingDate}) was returned to you: ${reason}`,
  });
  return updated;
}

// Exposed for Phase 5 (CR-050: link marking/moderation visits to the confirmed dates).
export async function getConfirmationForSitting(sittingId: string): Promise<EisaConfirmationRecord | undefined> {
  return loadAll().find((r) => r.sittingId === sittingId);
}
