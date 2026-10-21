import { appendAuditEntry } from '../../shared/audit/auditLog';
import { addNotification } from '../../shared/notifications/store';
import { performAction } from '../../shared/workflow/engine';
import { verifyLearnerIdentity } from '../../mock/integrations/homeAffairs';
import { validateSorAgainstModules } from '../../mock/integrations/qualificationsModules';
import { getSdpComplianceStatus, listEnrolledLearners } from '../../mock/api/qaDomain';
import { createMonitoringItem } from '../../mock/api/siteVisitsStore';
import { readStore, writeStore } from '../../mock/api/storage';
import type { Role } from '../../types';
import { listPublishedSittings } from '../eisa-calendar/api';
import type { EisaSitting } from '../eisa-calendar/types';
import { REGISTRATION_NUMBER_PREFIX } from './config';
import { REGISTRATION_WORKFLOW } from './workflow';
import type { EisaRegistrationRecord, NewRegistrationInput, SorFile, SupportingDocument } from './types';

const KEY = 'eisaRegistration:records';

function loadAll(): EisaRegistrationRecord[] {
  return readStore<EisaRegistrationRecord[]>(KEY, []);
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

// CR-040: a learner already sitting inside any other registration (at any stage) is blocked —
// "active or concurrent" is read as "already in a registration process", not just "Registered".
export async function findConcurrentRegistration(
  learnerId: string,
  excludeRegistrationId?: string,
): Promise<EisaRegistrationRecord | null> {
  const all = loadAll();
  return (
    all.find((r) => r.id !== excludeRegistrationId && r.learners.some((l) => l.learnerId === learnerId)) ?? null
  );
}

// CR-041: the SDP compliance gate check blocks starting a registration at all.
export async function startRegistration(input: NewRegistrationInput): Promise<EisaRegistrationRecord> {
  const sittings = await listPublishedSittings();
  const sitting = sittings.find((s) => s.id === input.sittingId);
  if (!sitting) throw new Error('That EISA sitting is not published.');

  const compliant = await getSdpComplianceStatus(input.sdpName);
  if (!compliant) {
    throw new Error(`"${input.sdpName}" is not compliant and is blocked from submitting an EISA registration.`);
  }

  const record: EisaRegistrationRecord = {
    id: crypto.randomUUID(),
    sittingId: sitting.id,
    sittingDate: sitting.date,
    qualificationTitle: sitting.qualificationTitle,
    qpName: sitting.qpName,
    sdpName: input.sdpName,
    category: input.category,
    workflow: { stageId: 'sdp-submission', submittedBy: input.createdBy },
    learners: [],
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

  const concurrent = await findConcurrentRegistration(learnerId, record.id);
  if (concurrent) {
    throw new Error(
      `${learner.fullName} already has an active EISA registration (${concurrent.qualificationTitle}, sitting ${concurrent.sittingDate}) — cannot register for another at the same time.`,
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
        sorStatus: 'pending',
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
// leaving AD review) and CR-037 (backend-dependent, no screen — called and ignored).
export async function uploadLearnerSor(registrationId: string, learnerId: string, file: { fileName: string; fileSize: number }): Promise<EisaRegistrationRecord> {
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
  const updated: EisaRegistrationRecord = {
    ...record,
    learners: record.learners.map((l) => (l.learnerId === learnerId ? { ...l, sor, sorStatus: 'pending', sorFlagReason: null } : l)),
  };
  saveAll(replace(all, updated));

  if (wasFlagged) {
    appendAuditEntry({
      recordType: 'eisa-registration',
      recordId: record.id,
      actorRole: 'SDP',
      actorName: record.sdpName,
      action: `Corrected and resubmitted the SOR for ${learner.fullName}`,
    });
    addNotification({
      recipientRole: 'Assistant Director',
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

// CR-038: the Assistant Director flags one learner's SOR with a mandatory reason. This does
// NOT move the registration's stage — only that learner's SOR status changes.
export async function flagLearnerSor(registrationId: string, learnerId: string, reason: string, actorName: string): Promise<EisaRegistrationRecord> {
  if (!reason.trim()) throw new Error('A reason is required to flag an SOR.');
  const all = loadAll();
  const record = getOrThrow(all, registrationId);
  if (record.workflow.stageId !== 'ad-review') {
    throw new Error('SORs can only be flagged while the registration is with the Assistant Director.');
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
    actorRole: 'Assistant Director',
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

interface RegistrationActionParams {
  registrationId: string;
  actionId: 'reg-submit' | 'reg-create-number';
  actorRole: Role;
  actorName: string;
}

export async function performRegistrationAction(params: RegistrationActionParams): Promise<EisaRegistrationRecord> {
  const all = loadAll();
  const record = getOrThrow(all, params.registrationId);

  if (params.actionId === 'reg-submit') {
    if (record.learners.length === 0) throw new Error('Add at least one learner before submitting.');
    if (record.learners.some((l) => !l.sor)) throw new Error('Every learner needs an uploaded SOR before submitting.');
  }
  if (params.actionId === 'reg-create-number') {
    if (record.learners.some((l) => l.sorStatus === 'flagged')) {
      throw new Error('Resolve every flagged SOR before creating the registration number.');
    }
  }

  const nextWorkflow = performAction({
    definition: REGISTRATION_WORKFLOW,
    record: record.workflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorName: params.actorName,
    recordType: 'eisa-registration',
    recordId: record.id,
  });

  let updated: EisaRegistrationRecord = { ...record, workflow: nextWorkflow };

  if (params.actionId === 'reg-submit') {
    addNotification({
      recipientRole: 'Assistant Director',
      title: 'New EISA registration submitted',
      body: `${record.sdpName} submitted a registration for "${record.qualificationTitle}" (${record.learners.length} learner(s)).`,
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
        qpName: updated.qpName,
        sdpName: updated.sdpName,
        sittingDate: updated.sittingDate,
        learnerNames: rplLearners.map((l) => l.fullName),
        createdBy: params.actorName,
      });
      updated = { ...updated, rplMonitoringItemId: item.id };
      addNotification({
        recipientRole: 'Assistant Director',
        title: 'RPL/ARPL monitoring item created',
        body: `A monitoring item was created for "${updated.qualificationTitle}" (${updated.sdpName}) — ${rplLearners.length} RPL/ARPL learner(s).`,
      });
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

export async function listSittingIdsWithCompletedRegistrations(): Promise<string[]> {
  const all = loadAll();
  return [...new Set(all.filter((r) => r.workflow.stageId === 'registered').map((r) => r.sittingId))];
}
