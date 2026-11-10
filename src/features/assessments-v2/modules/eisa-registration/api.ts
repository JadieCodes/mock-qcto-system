import { appendAuditEntry } from '../../shared/audit/auditLog';
import { addNotification } from '../../shared/notifications/store';
import { performAction } from '../../shared/workflow/engine';
import { verifyLearnerIdentity } from '../../mock/integrations/homeAffairs';
import { validateSorAgainstModules } from '../../mock/integrations/qualificationsModules';
import { getSdpComplianceStatus, getSdpLastMonitoringDate, listEnrolledLearners } from '../../mock/api/qaDomain';
import { createMonitoringItem } from '../../mock/api/siteVisitsStore';
import { readStore, writeStore } from '../../mock/api/storage';
import type { Role } from '../../types';
import { toIsoDate } from '../../shared/dates/workingDays';
import { listBatches as listResultsBatches } from '../approval-of-results/api';
import { listPublishedSittings, listSittings } from '../eisa-calendar/api';
import { calcRegistrationClosingDate, isRegistrationClosed } from '../eisa-calendar/registrationClosing';
import type { EisaSitting } from '../eisa-calendar/types';
import { REGISTRATION_NUMBER_PREFIX, REGISTRATION_PROCESSOR_ROLE } from './config';
import { monitoringBlockReason, sdpMonitoringStatusOf, type SdpMonitoringStatus } from './monitoring';
import { learnerCountText } from './summary';
import { REGISTRATION_WORKFLOW } from './workflow';
import type { EisaRegistrationRecord, NewRegistrationInput, SorFile, SorStatus, SupportingDocument } from './types';

export const KEY = 'eisaRegistration:records';

// Batch R1: a record stored before declined learners and returns existed reads as having none
// (idempotent, nothing is written back).
function loadAll(): EisaRegistrationRecord[] {
  return readStore<EisaRegistrationRecord[]>(KEY, []).map((r) => ({ ...r, declinedLearners: r.declinedLearners ?? [], returns: r.returns ?? [] }));
}

function saveAll(records: EisaRegistrationRecord[]): void {
  writeStore(KEY, records);
}

function getOrThrow(records: EisaRegistrationRecord[], id: string): EisaRegistrationRecord {
  const record = records.find((r) => r.id === id);
  if (!record) throw new Error(`EISA registration "${id}" not found.`);
  return record;
}

function replace(records: EisaRegistrationRecord[], updated: EisaRegistrationRecord): EisaRegistrationRecord[] {
  return records.map((r) => (r.id === updated.id ? updated : r));
}

// CR-024: the SDP starts registration from a PUBLISHED EISA Calendar sitting — never as a
// hand-off from instrument validation finishing.
export async function listRegistrableSittings(): Promise<EisaSitting[]> {
  return listPublishedSittings();
}

export async function listRecords(): Promise<EisaRegistrationRecord[]> {
  return loadAll();
}

export async function getRecord(id: string): Promise<EisaRegistrationRecord | undefined> {
  return loadAll().find((r) => r.id === id);
}

// CR-036: the learner list the SDP picks from — simulated QA-domain enrolment, not a
// spreadsheet upload.
export async function listEnrollableLearners(sdpName: string) {
  return listEnrolledLearners(sdpName);
}

// Batch R1 (CR-040, corrected per QCTO 6 Aug 2:06:39): why a learner cannot join another
// registration.
export interface LearnerBlock {
  registration: EisaRegistrationRecord;
  reason: 'open' | 'results-pending';
}

// A learner is blocked while they are in another registration that is still open (not yet
// registered), or registered for a sitting whose EISA results batch containing them is not yet
// approved (competent or not). Once that batch is approved the block lifts. Not blocking: a
// registration the learner was declined from (they are not in `learners`) and a cancelled sitting.
// A batch that was declined (final) is not approved, so it keeps blocking (open question).
export async function findConcurrentRegistration(learnerId: string, excludeRegistrationId?: string): Promise<LearnerBlock | null> {
  const sittings = await listSittings();
  const cancelledSittingIds = new Set(sittings.filter((s) => s.status === 'cancelled').map((s) => s.id));
  const others = loadAll().filter(
    (r) => r.id !== excludeRegistrationId && !cancelledSittingIds.has(r.sittingId) && r.learners.some((l) => l.learnerId === learnerId),
  );
  const open = others.find((r) => r.workflow.stageId !== 'registered');
  if (open) return { registration: open, reason: 'open' };

  const batches = await listResultsBatches();
  const pending = others.find(
    (r) =>
      !batches.some(
        (b) => b.sittingId === r.sittingId && b.finalDecision?.outcome === 'approved' && b.learnerResults.some((res) => res.learnerId === learnerId),
      ),
  );
  return pending ? { registration: pending, reason: 'results-pending' } : null;
}

// Batch R1 (29.18): the SDP's QA monitoring status, from the simulated QA domain.
export async function getSdpMonitoringStatus(sdpName: string): Promise<SdpMonitoringStatus> {
  return sdpMonitoringStatusOf(await getSdpLastMonitoringDate(sdpName), toIsoDate(new Date()));
}

// CR-041: the SDP compliance gate check blocks starting a registration at all.
// Row 24 (E-07): an SDP cannot have two open (not yet `registered`) registrations against the
// same sitting — this is the actual root cause of the "stuck duplicate" bug, not something to
// patch after the fact.
export async function startRegistration(input: NewRegistrationInput): Promise<EisaRegistrationRecord> {
  const sittings = await listPublishedSittings();
  const sitting = sittings.find((s) => s.id === input.sittingId);
  if (!sitting) throw new Error('That EISA sitting is not published.');

  // QCTO feedback 3.5: no new registrations once the sitting's closing date has passed.
  if (isRegistrationClosed(sitting.date, undefined, sitting.onDemand)) {
    throw new Error(`Registration for this sitting closed on ${calcRegistrationClosingDate(sitting.date, sitting.onDemand)}.`);
  }

  const compliant = await getSdpComplianceStatus(input.sdpName);
  if (!compliant) {
    throw new Error(`"${input.sdpName}" is not compliant and is blocked from submitting an EISA registration.`);
  }

  const existingOpen = loadAll().find(
    (r) => r.sdpId === input.sdpId && r.sittingId === input.sittingId && r.workflow.stageId !== 'registered',
  );
  if (existingOpen) {
    throw new Error(
      `"${input.sdpName}" already has an open registration for this sitting (${existingOpen.workflow.stageId === 'sdp-submission' ? 'still building' : 'with the ASD'}). Open it to continue, or withdraw it first.`,
    );
  }

  const record: EisaRegistrationRecord = {
    id: crypto.randomUUID(),
    sittingId: sitting.id,
    sittingDate: sitting.date,
    qualificationTitle: sitting.qualificationTitle,
    qpId: sitting.qpId,
    qpName: sitting.qpName,
    sdpId: input.sdpId,
    sdpName: input.sdpName,
    category: input.category,
    workflow: { stageId: 'sdp-submission', submittedBy: input.createdBy, submittedById: input.createdById },
    learners: [],
    declinedLearners: [],
    returns: [],
    supportingDocuments: [],
    registrationNumber: null,
    nonTradesHandoff: null,
    rplMonitoringItemId: null,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  saveAll([record, ...loadAll()]);
  return record;
}

// Row 24 (E-07): the SDP can delete/withdraw a draft registration outright — the other half of
// closing off the "stuck duplicate" bug (the SDP now has a way out of a draft they no longer
// want, instead of it sitting there unusable).
export async function withdrawRegistration(registrationId: string, actorId: string, actorName: string): Promise<void> {
  const all = loadAll();
  const record = getOrThrow(all, registrationId);
  if (record.workflow.stageId !== 'sdp-submission') {
    throw new Error('Only a registration that is still being built can be withdrawn.');
  }
  saveAll(all.filter((r) => r.id !== registrationId));
  appendAuditEntry({
    recordType: 'eisa-registration',
    recordId: registrationId,
    actorRole: 'SDP',
    actorId,
    actorName,
    action: `Withdrew the draft registration for "${record.qualificationTitle}" (sitting ${record.sittingDate})`,
  });
}

// CR-036/CR-039: adds one enrolled learner to the draft registration, with the CR-040 duplicate
// block and a call into the (backend-dependent, no-screen) Home Affairs ID check stub.
export async function addLearner(registrationId: string, learnerId: string): Promise<EisaRegistrationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, registrationId);
  if (record.workflow.stageId !== 'sdp-submission') {
    throw new Error('Learners can only be added while the registration is still being built.');
  }
  if (record.learners.some((l) => l.learnerId === learnerId)) {
    throw new Error('This learner is already on this registration.');
  }

  const enrolled = await listEnrolledLearners(record.sdpName);
  const learner = enrolled.find((l) => l.id === learnerId);
  if (!learner) throw new Error('That learner is not enrolled with this SDP.');

  if (record.declinedLearners.some((l) => l.learnerId === learnerId)) {
    throw new Error(`${learner.fullName} was declined from this registration by the ASD and cannot be added to it again.`);
  }

  const concurrent = await findConcurrentRegistration(learnerId, record.id);
  if (concurrent) {
    const until =
      concurrent.reason === 'open'
        ? 'until that registration is complete and the results for that sitting are approved'
        : 'until the results for that sitting are approved';
    throw new Error(
      `${learner.fullName} already has an active EISA registration (${concurrent.registration.qualificationTitle}, sitting ${concurrent.registration.sittingDate}) — cannot register for another at the same time ${until}.`,
    );
  }

  // CR-039: backend-dependent, no screen — call the stub and move on regardless of the result.
  await verifyLearnerIdentity(learner.idNumber);

  const updated: EisaRegistrationRecord = {
    ...record,
    learners: [
      ...record.learners,
      {
        learnerId: learner.id,
        fullName: learner.fullName,
        idNumber: learner.idNumber,
        sor: null,
        sorStatus: null,
        sorFlagReason: null,
        rplArpl: false,
        addedAt: new Date().toISOString(),
      },
    ],
  };
  saveAll(replace(all, updated));
  return updated;
}

export async function setLearnerRplArpl(registrationId: string, learnerId: string, rplArpl: boolean): Promise<EisaRegistrationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, registrationId);
  if (record.workflow.stageId !== 'sdp-submission') {
    throw new Error('The RPL/ARPL indicator can only be set while the registration is still being built.');
  }
  const updated: EisaRegistrationRecord = {
    ...record,
    learners: record.learners.map((l) => (l.learnerId === learnerId ? { ...l, rplArpl } : l)),
  };
  saveAll(replace(all, updated));
  return updated;
}

// CR-036 (SOR upload, UI-only) and CR-038 (re-upload clears a flag without the registration
// leaving ASD review) and CR-037 (backend-dependent, no screen — called and ignored).
export async function uploadLearnerSor(
  registrationId: string,
  learnerId: string,
  file: { fileName: string; fileSize: number },
  actorId: string,
  actorName: string,
): Promise<EisaRegistrationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, registrationId);
  const learner = record.learners.find((l) => l.learnerId === learnerId);
  if (!learner) throw new Error('Learner not found on this registration.');

  const canUpload = record.workflow.stageId === 'sdp-submission' || (record.workflow.stageId === 'ad-review' && learner.sorStatus === 'flagged');
  if (!canUpload) {
    throw new Error('This SOR cannot be changed right now.');
  }

  await validateSorAgainstModules(file.fileName, record.qualificationTitle);

  const sor: SorFile = { ...file, uploadedAt: new Date().toISOString() };
  const wasFlagged = learner.sorStatus === 'flagged';
  // Row 25 (E-10): the first SOR for a learner is "Uploaded"; any file replacing an existing
  // one (including a flagged one being corrected) is "Replaced".
  const nextStatus: SorStatus = learner.sor ? 'replaced' : 'uploaded';
  const updated: EisaRegistrationRecord = {
    ...record,
    learners: record.learners.map((l) => (l.learnerId === learnerId ? { ...l, sor, sorStatus: nextStatus, sorFlagReason: null } : l)),
  };
  saveAll(replace(all, updated));

  if (wasFlagged) {
    appendAuditEntry({
      recordType: 'eisa-registration',
      recordId: record.id,
      actorRole: 'SDP',
      actorId,
      actorName,
      action: `Corrected and resubmitted the SOR for ${learner.fullName}`,
    });
    addNotification({
      recipientRole: REGISTRATION_PROCESSOR_ROLE,
      title: 'SOR corrected and resubmitted',
      body: `${record.sdpName} resubmitted ${learner.fullName}'s SOR for "${record.qualificationTitle}".`,
    });
  }

  return updated;
}

export async function uploadSupportingDocument(registrationId: string, file: { fileName: string; fileSize: number }): Promise<EisaRegistrationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, registrationId);
  const doc: SupportingDocument = { ...file, uploadedAt: new Date().toISOString() };
  const updated: EisaRegistrationRecord = { ...record, supportingDocuments: [...record.supportingDocuments, doc] };
  saveAll(replace(all, updated));
  return updated;
}

// CR-038: the ASD flags one learner's SOR with a mandatory reason. This does
// NOT move the registration's stage — only that learner's SOR status changes.
export async function flagLearnerSor(
  registrationId: string,
  learnerId: string,
  reason: string,
  actorId: string,
  actorName: string,
): Promise<EisaRegistrationRecord> {
  if (!reason.trim()) throw new Error('A reason is required to flag an SOR.');
  const all = loadAll();
  const record = getOrThrow(all, registrationId);
  if (record.workflow.stageId !== 'ad-review') {
    throw new Error('SORs can only be flagged while the registration is with the ASD.');
  }
  const learner = record.learners.find((l) => l.learnerId === learnerId);
  if (!learner) throw new Error('Learner not found on this registration.');

  const updated: EisaRegistrationRecord = {
    ...record,
    learners: record.learners.map((l) => (l.learnerId === learnerId ? { ...l, sorStatus: 'flagged', sorFlagReason: reason } : l)),
  };
  saveAll(replace(all, updated));

  appendAuditEntry({
    recordType: 'eisa-registration',
    recordId: record.id,
    actorRole: REGISTRATION_PROCESSOR_ROLE,
    actorId,
    actorName,
    action: `Flagged ${learner.fullName}'s SOR as non-compliant`,
    note: reason,
  });
  addNotification({
    recipientRole: 'SDP',
    title: 'SOR needs correction',
    body: `${learner.fullName}'s SOR for "${record.qualificationTitle}" was flagged: ${reason}`,
  });

  return updated;
}

export function declinedLearnerNotificationBody(learnerName: string, qualificationTitle: string, sittingDate: string, reason: string): string {
  return `${learnerName} will not be registered for ${qualificationTitle} (EISA ${sittingDate}): ${reason}`;
}

// Batch R1 (QCTO 6 Aug 2:03:42 to 2:05:06): the ASD declines one learner (most often a
// non-compliant SOR). The learner leaves the active list, stays visible as declined with the
// reason, and the SDP is told. Does not move the registration's stage.
export async function declineLearner(
  registrationId: string,
  learnerId: string,
  reason: string,
  actorId: string,
  actorName: string,
): Promise<EisaRegistrationRecord> {
  const trimmed = reason.trim();
  if (!trimmed) throw new Error('A reason is required to decline a learner.');
  const all = loadAll();
  const record = getOrThrow(all, registrationId);
  if (record.workflow.stageId !== 'ad-review') {
    throw new Error('Learners can only be declined while the registration is with the ASD.');
  }
  const learner = record.learners.find((l) => l.learnerId === learnerId);
  if (!learner) throw new Error('Learner not found on this registration.');

  const updated: EisaRegistrationRecord = {
    ...record,
    learners: record.learners.filter((l) => l.learnerId !== learnerId),
    declinedLearners: [
      ...record.declinedLearners,
      { ...learner, declinedReason: trimmed, declinedAt: new Date().toISOString(), declinedBy: actorName, declinedById: actorId },
    ],
  };
  saveAll(replace(all, updated));

  appendAuditEntry({
    recordType: 'eisa-registration',
    recordId: record.id,
    actorRole: REGISTRATION_PROCESSOR_ROLE,
    actorId,
    actorName,
    action: `Declined ${learner.fullName} — will not be registered`,
    note: trimmed,
  });
  addNotification({
    recipientRole: 'SDP',
    title: 'Learner will not be registered',
    body: declinedLearnerNotificationBody(learner.fullName, record.qualificationTitle, record.sittingDate, trimmed),
  });

  return updated;
}

// Row 25 (E-10): the ASD's own two non-flag review outcomes — starting a
// review, and accepting the SOR outright. Neither moves the registration's own stage, same
// as the existing flag action.
export async function markLearnerSorUnderReview(
  registrationId: string,
  learnerId: string,
  actorId: string,
  actorName: string,
): Promise<EisaRegistrationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, registrationId);
  if (record.workflow.stageId !== 'ad-review') {
    throw new Error('SORs can only be reviewed while the registration is with the ASD.');
  }
  const learner = record.learners.find((l) => l.learnerId === learnerId);
  if (!learner) throw new Error('Learner not found on this registration.');

  const updated: EisaRegistrationRecord = {
    ...record,
    learners: record.learners.map((l) => (l.learnerId === learnerId ? { ...l, sorStatus: 'under-review' } : l)),
  };
  saveAll(replace(all, updated));
  appendAuditEntry({
    recordType: 'eisa-registration',
    recordId: record.id,
    actorRole: REGISTRATION_PROCESSOR_ROLE,
    actorId,
    actorName,
    action: `Started reviewing ${learner.fullName}'s SOR`,
  });
  return updated;
}

export async function acceptLearnerSor(
  registrationId: string,
  learnerId: string,
  actorId: string,
  actorName: string,
): Promise<EisaRegistrationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, registrationId);
  if (record.workflow.stageId !== 'ad-review') {
    throw new Error('SORs can only be accepted while the registration is with the ASD.');
  }
  const learner = record.learners.find((l) => l.learnerId === learnerId);
  if (!learner) throw new Error('Learner not found on this registration.');

  const updated: EisaRegistrationRecord = {
    ...record,
    learners: record.learners.map((l) => (l.learnerId === learnerId ? { ...l, sorStatus: 'accepted' } : l)),
  };
  saveAll(replace(all, updated));
  appendAuditEntry({
    recordType: 'eisa-registration',
    recordId: record.id,
    actorRole: REGISTRATION_PROCESSOR_ROLE,
    actorId,
    actorName,
    action: `Accepted ${learner.fullName}'s SOR`,
  });
  return updated;
}

interface RegistrationActionParams {
  registrationId: string;
  actionId: 'reg-submit' | 'reg-create-number' | 'reg-return-to-sdp';
  actorRole: Role;
  actorId: string;
  actorName: string;
  // Batch R1: the mandatory reason for 'reg-return-to-sdp'.
  note?: string;
}

export async function performRegistrationAction(params: RegistrationActionParams): Promise<EisaRegistrationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, params.registrationId);

  if (params.actionId === 'reg-submit') {
    if (record.learners.length === 0) throw new Error('Add at least one learner before submitting.');
    if (record.learners.some((l) => !l.sor)) throw new Error('Every learner needs an uploaded SOR before submitting.');
  }
  if (params.actionId === 'reg-create-number') {
    // Batch R1: declined learners are not in `learners`, so they no longer block; a registration
    // with none left cannot get a number.
    if (record.learners.length === 0) {
      throw new Error(
        record.declinedLearners.length > 0
          ? 'Every learner on this registration has been declined, so no registration number can be created. Return it to the SDP to add learners.'
          : 'Add at least one learner before creating the registration number.',
      );
    }
    if (record.learners.some((l) => l.sorStatus === 'flagged')) {
      throw new Error('Resolve every flagged SOR before creating the registration number.');
    }
    // Batch R1 (29.18): expired or never-monitored SDP. The SDP can still build and submit.
    const monitoring = await getSdpMonitoringStatus(record.sdpName);
    if (monitoring.blocksRegistrationNumber) throw new Error(monitoringBlockReason(monitoring));
  }
  if (params.actionId === 'reg-return-to-sdp' && !params.note?.trim()) {
    throw new Error('A reason is required to return the registration to the SDP.');
  }

  const nextWorkflow = performAction({
    definition: REGISTRATION_WORKFLOW,
    record: record.workflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    recordType: 'eisa-registration',
    recordId: record.id,
    note: params.note?.trim(),
  });

  let updated: EisaRegistrationRecord = { ...record, workflow: nextWorkflow };

  if (params.actionId === 'reg-submit') {
    addNotification({
      recipientRole: REGISTRATION_PROCESSOR_ROLE,
      title: record.returns.length > 0 ? 'EISA registration resubmitted' : 'New EISA registration submitted',
      body: `${record.sdpName} submitted a registration for "${record.qualificationTitle}" — ${learnerCountText(record)}.`,
    });
  }

  if (params.actionId === 'reg-return-to-sdp') {
    const cycle = record.returns.length + 1;
    const reason = params.note?.trim() ?? '';
    updated = {
      ...updated,
      returns: [...record.returns, { cycle, reason, returnedAt: new Date().toISOString(), returnedBy: params.actorName, returnedById: params.actorId }],
    };
    addNotification({
      recipientRole: 'SDP',
      title: 'Registration returned to you',
      body: `Your registration for "${record.qualificationTitle}" (EISA ${record.sittingDate}) was returned by the ASD (cycle ${cycle}): ${reason}`,
    });
  }

  if (params.actionId === 'reg-create-number') {
    const registeredCount = all.filter((r) => r.workflow.stageId === 'registered').length + 1;
    const registrationNumber = `${REGISTRATION_NUMBER_PREFIX}-${new Date().getFullYear()}-${String(registeredCount).padStart(4, '0')}`;
    updated = { ...updated, registrationNumber };

    // PM-08: the Non-Trades path additionally prepares files for the QP and shares the SDP
    // list with Quality Assurance — simulated as an audit entry plus a QP notification (QA
    // has no role in this domain's Role union to notify directly).
    if (updated.category === 'non-trades') {
      const now = new Date().toISOString();
      updated = { ...updated, nonTradesHandoff: { filesPreparedAt: now, sdpListSharedAt: now } };
      appendAuditEntry({
        recordType: 'eisa-registration',
        recordId: record.id,
        actorRole: params.actorRole,
        actorId: params.actorId,
        actorName: params.actorName,
        action: 'Prepared files for the QP and shared the SDP list with Quality Assurance (Non-Trades path)',
      });
      addNotification({
        recipientRole: 'QP',
        title: 'EISA registration files ready',
        body: `Registration files for "${record.qualificationTitle}" (${record.sdpName}) are ready — registration ${registrationNumber}.`,
      });
    }

    // CR-042/CR-044: the ONLY automatic trigger into Site Visits & Monitoring. One monitoring
    // item per registration, covering every RPL/ARPL-flagged learner on it.
    const rplLearners = updated.learners.filter((l) => l.rplArpl);
    if (rplLearners.length > 0 && !updated.rplMonitoringItemId) {
      const item = await createMonitoringItem({
        sourceRegistrationId: updated.id,
        qualificationTitle: updated.qualificationTitle,
        qpId: updated.qpId,
        qpName: updated.qpName,
        sdpId: updated.sdpId,
        sdpName: updated.sdpName,
        sittingDate: updated.sittingDate,
        learnerNames: rplLearners.map((l) => l.fullName),
        createdBy: params.actorName,
      });
      updated = { ...updated, rplMonitoringItemId: item.id };
      // QCTO feedback 3.11: this used to go to the Assistant Director and the ASD separately;
      // they are one role now, so it is sent once.
      addNotification({
        recipientRole: 'ASD',
        title: 'RPL/ARPL monitoring item created',
        body: `A monitoring item was created for "${updated.qualificationTitle}" (${updated.sdpName}) — ${rplLearners.length} RPL/ARPL learner(s).`,
      });
    }

    addNotification({
      recipientRole: 'SDP',
      title: 'EISA registration complete',
      body: `Your registration for "${record.qualificationTitle}" is complete — registration number ${registrationNumber}.`,
    });
  }

  saveAll(replace(all, updated));
  return updated;
}

// Read by EISA Confirmation (CR-043): registration must be complete for a sitting first.
export async function listRegisteredRegistrationsForSitting(sittingId: string): Promise<EisaRegistrationRecord[]> {
  return loadAll().filter((r) => r.sittingId === sittingId && r.workflow.stageId === 'registered');
}

// Row 22/23 (D-17): read by EISA Calendar's delete guard — any registration (draft or
// complete) against a sitting blocks deleting that sitting outright.
export async function listRegistrationsForSitting(sittingId: string): Promise<EisaRegistrationRecord[]> {
  return loadAll().filter((r) => r.sittingId === sittingId);
}

export async function listSittingIdsWithCompletedRegistrations(): Promise<string[]> {
  const all = loadAll();
  return [...new Set(all.filter((r) => r.workflow.stageId === 'registered').map((r) => r.sittingId))];
}

// Row 22/23 (D-17): read by EISA Calendar's delete guard/UI — any registration (draft or
// complete) against a sitting, not only completed ones.
export async function listSittingIdsWithRegistrations(): Promise<string[]> {
  return [...new Set(loadAll().map((r) => r.sittingId))];
}
