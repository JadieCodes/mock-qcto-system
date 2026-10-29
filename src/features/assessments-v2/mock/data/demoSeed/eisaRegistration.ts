// Demo seed — Learner EISA Registration, item 1.1. Written in the same shape as
// eisa-registration/api.ts (startRegistration, addLearner, uploadLearnerSor,
// uploadSupportingDocument, markLearnerSorUnderReview, acceptLearnerSor, flagLearnerSor,
// performRegistrationAction), with the audit entries and notifications each step implies.
// Every registration is against a published sitting from eisaCalendar.ts and is started (and,
// if registered, completed) on or before that sitting's registration closing date. Learners
// come from mock/data/enrolledLearners.ts; no learner is on two registrations (CR-040). Two
// registrations have one RPL/ARPL-flagged learner each (phase C3): G6 (Thabo, Electrical Trades
// today + 35) and P5 (Lerato, Plumbing today - 75). Creating their registration numbers creates
// the Site Visits monitoring item (CR-042/CR-044), returned as `monitoringItems` for
// siteVisits.ts. Days are "days ago".
//
// Open registrations (the screens' live demo):
//  #   SDP                        Sitting                     Category    Stage
//  G1  Khanya Skills Academy      Electrical Trades, B1 2nd   Trades      Being built — 2 learners, 1 SOR still to upload
//  G2  Khanya Skills Academy      Electrical Trades, B1 1st   Trades      With the Assistant Director — 1 SOR accepted, 1 under review, 1 not yet looked at
//  G3  Khanya Skills Academy      Welding, today + 125        Trades      With the Assistant Director — 1 SOR flagged, waiting for the SDP to correct it
//  G4  Khanya Skills Academy      Welding, today + 55         Trades      Registered (registration closed since) — sitting ready for an EISA Confirmation
//  G5  Khanya Skills Academy      Electrical Trades, today+35 Non-Trades  Registered — files prepared for the QP, SDP list shared with QA
//  G6  Thabo Technical College    Electrical Trades, today+35 Trades      Registered (same sitting as G5)
//  G7  Lerato Training Institute  Plumbing, today + 150       Trades      Just submitted to the Assistant Director, no SOR reviewed yet
//  —   Vuma Trade Centre          —                           —           None: Vuma is non-compliant (CR-041), so "Start Registration" is
//                                                                         blocked for it; nothing is seeded around that rule.
//
// Completed registrations behind the past sittings (all Trades, all Registered, each started
// about 160 days before its sitting). They feed eisaConfirmation.ts and approvalOfResults.ts:
//  P1  Electrical Trades  today - 15   Khanya (2) + Thabo (2)
//  P2  Plumbing           today - 30   Lerato (4)
//  P3  Welding            today - 45   Khanya (4)
//  P4  Electrical Trades  today - 60   Thabo (3)
//  P5  Plumbing           today - 75   Lerato (3)
//  P6  Welding            today - 90   Khanya (3)
//  P7  Electrical Trades  today - 105  Khanya (2) + Thabo (2)
//  P8  Plumbing           today - 130  Lerato (5)
//  P9  Welding            today - 150  Khanya (5)
//  P10 Electrical Trades  today - 170  Thabo (4)
//  P11 Plumbing           today - 50   Lerato (3)
//
// Assistant Directors (09-visibility-matrix.md Section 3): Lindiwe Khumalo handles Khanya Skills
// Academy; Riaan Pretorius handles Thabo Technical College and Lerato Training Institute.
// Registration numbers are given in the order the numbers were created, as the api does.
import type { RplArplMonitoringItem } from '../../api/siteVisitsStore';
import { ENROLLED_LEARNERS } from '../enrolledLearners';
import { SDP_DIRECTORY } from '../sdpDirectory';
import { calcRegistrationClosingDate, isRegistrationClosed } from '../../../modules/eisa-calendar/registrationClosing';
import type { EisaSitting } from '../../../modules/eisa-calendar/types';
import { REGISTRATION_NUMBER_PREFIX, REGISTRATION_PROCESSOR_ROLE } from '../../../modules/eisa-registration/config';
import { REGISTRATION_WORKFLOW } from '../../../modules/eisa-registration/workflow';
import type { EisaRegistrationRecord, RegistrationCategory, SorStatus } from '../../../modules/eisa-registration/types';
import { audit, createClock, dateOf, notify, seedId, seedPerson, step, workingDateFromToday, type SeedLog } from './helpers';

const REGISTRATION_ID_GROUP = 5;
const RPL_MONITORING_ITEM_ID_GROUP = 9;
const B1_BATCH_ID = seedId(3, 1);

const LINDIWE = 'lindiwe-khumalo';
const RIAAN = 'riaan-pretorius';
const KHANYA = 'sdp-khanya-skills-academy';
const THABO = 'sdp-thabo-technical-college';
const LERATO = 'sdp-lerato-training-institute';

// A published sitting from eisaCalendar.ts, found by qualification and date offset from today
// (the same offset eisaCalendar.ts passed to workingDateFromToday).
export function sittingAt(sittings: EisaSitting[], qualificationTitle: string, offsetDays: number): EisaSitting {
  const date = workingDateFromToday(offsetDays);
  const found = sittings.find((s) => s.qualificationTitle === qualificationTitle && s.date === date && s.status === 'published');
  if (!found) throw new Error(`Demo seed: no published ${qualificationTitle} sitting on ${date} (today ${offsetDays >= 0 ? '+' : ''}${offsetDays}).`);
  return found;
}

function b1Sitting(sittings: EisaSitting[], index: number): EisaSitting {
  const dates = sittings.filter((s) => s.batchId === B1_BATCH_ID && s.status === 'published').sort((a, b) => a.date.localeCompare(b.date));
  const found = dates[index];
  if (!found) throw new Error(`Demo seed: the published Electrical Trades batch has no date #${index + 1}.`);
  return found;
}

// One method per api function, chained in the order the steps happened.
interface RegistrationSeedBuilder {
  addLearners: (learnerIds: string[], atDaysAgo: number) => RegistrationSeedBuilder;
  rplArpl: (learnerIds: string[]) => RegistrationSeedBuilder;
  uploadSors: (learnerIds: string[] | 'all', atDaysAgo: number) => RegistrationSeedBuilder;
  supportingDocument: (fileName: string, fileSize: number, atDaysAgo: number) => RegistrationSeedBuilder;
  submit: (atDaysAgo: number) => RegistrationSeedBuilder;
  underReview: (learnerId: string, adId: string, atDaysAgo: number) => RegistrationSeedBuilder;
  accept: (learnerIds: string[] | 'all', adId: string, atDaysAgo: number) => RegistrationSeedBuilder;
  flag: (learnerId: string, adId: string, atDaysAgo: number, reason: string) => RegistrationSeedBuilder;
  createNumber: (adId: string, atDaysAgo: number) => RegistrationSeedBuilder;
}

function sorFileName(fullName: string): string {
  return `SOR_${fullName.replace(/\s+/g, '_')}.pdf`;
}

export interface RegistrationSeed {
  registrations: EisaRegistrationRecord[];
  monitoringItems: RplArplMonitoringItem[];
}

export function seedEisaRegistrations(log: SeedLog, sittings: EisaSitting[]): RegistrationSeed {
  const records: EisaRegistrationRecord[] = [];
  const monitoringItems: RplArplMonitoringItem[] = [];
  const usedLearnerIds = new Set<string>();
  // performRegistrationAction('reg-create-number') numbers registrations in the order they were
  // registered, so numbering and the notifications that quote the number happen at the end.
  const pendingNumbers: { record: () => EisaRegistrationRecord; set: (r: EisaRegistrationRecord) => void; at: string }[] = [];
  let n = 0;

  function start(sdpId: string, sitting: EisaSitting, category: RegistrationCategory, daysAgo: number): RegistrationSeedBuilder {
    const clock = createClock();
    const sdp = seedPerson(sdpId);
    const createdAt = clock.at(daysAgo, 9);
    const closing = calcRegistrationClosingDate(sitting.date);

    // startRegistration(): published sitting (checked by the caller's lookup), registration still
    // open on the day, compliant SDP, no other open registration for the same SDP and sitting.
    if (isRegistrationClosed(sitting.date, dateOf(createdAt))) {
      throw new Error(`Demo seed: registration for ${sitting.qualificationTitle} ${sitting.date} closed on ${closing}.`);
    }
    if (createdAt < sitting.createdAt) throw new Error(`Demo seed: registration started before the ${sitting.date} sitting existed.`);
    if (!(SDP_DIRECTORY.find((s) => s.sdpId === sdpId)?.compliant ?? true)) {
      throw new Error(`Demo seed: "${sdp.name}" is not compliant and is blocked from submitting an EISA registration.`);
    }
    if (records.some((r) => r.sdpId === sdpId && r.sittingId === sitting.id && r.workflow.stageId !== 'registered')) {
      throw new Error(`Demo seed: "${sdp.name}" already has an open registration for ${sitting.date}.`);
    }

    let record: EisaRegistrationRecord = {
      id: seedId(REGISTRATION_ID_GROUP, ++n),
      sittingId: sitting.id,
      sittingDate: sitting.date,
      qualificationTitle: sitting.qualificationTitle,
      qpId: sitting.qpId,
      qpName: sitting.qpName,
      sdpId,
      sdpName: sdp.name,
      category,
      workflow: { stageId: 'sdp-submission', submittedBy: sdp.name, submittedById: sdp.id },
      learners: [],
      supportingDocuments: [],
      registrationNumber: null,
      nonTradesHandoff: null,
      rplMonitoringItemId: null,
      createdBy: sdp.name,
      createdAt,
    };
    records.push(record);
    const index = records.length - 1;
    const set = (updated: EisaRegistrationRecord) => {
      record = updated;
      records[index] = updated;
    };

    function learnerOf(learnerId: string) {
      const learner = record.learners.find((l) => l.learnerId === learnerId);
      if (!learner) throw new Error(`Demo seed: ${learnerId} is not on registration ${record.id}.`);
      return learner;
    }

    function setSorStatus(learnerId: string, sorStatus: SorStatus, sorFlagReason: string | null = null) {
      set({ ...record, learners: record.learners.map((l) => (l.learnerId === learnerId ? { ...l, sorStatus, sorFlagReason } : l)) });
    }

    function requireAdReview(what: string) {
      if (record.workflow.stageId !== 'ad-review') throw new Error(`Demo seed: SORs can only be ${what} while the registration is with the Assistant Director.`);
    }

    const api: RegistrationSeedBuilder = {
      // addLearner(): enrolled with this SDP, not already on any registration (CR-040).
      addLearners(learnerIds: string[], atDaysAgo: number) {
        if (record.workflow.stageId !== 'sdp-submission') throw new Error('Demo seed: learners can only be added while the registration is being built.');
        for (const learnerId of learnerIds) {
          const learner = ENROLLED_LEARNERS.find((l) => l.id === learnerId);
          if (!learner || learner.sdpName !== sdp.name) throw new Error(`Demo seed: ${learnerId} is not enrolled with ${sdp.name}.`);
          if (usedLearnerIds.has(learnerId)) throw new Error(`Demo seed: ${learner.fullName} is already on another EISA registration.`);
          usedLearnerIds.add(learnerId);
          const addedAt = clock.at(atDaysAgo, 10);
          set({
            ...record,
            learners: [
              ...record.learners,
              { learnerId: learner.id, fullName: learner.fullName, idNumber: learner.idNumber, sor: null, sorStatus: null, sorFlagReason: null, rplArpl: false, addedAt },
            ],
          });
        }
        return api;
      },
      // setLearnerRplArpl(): only while the registration is still being built (no audit entry).
      rplArpl(learnerIds: string[]) {
        if (record.workflow.stageId !== 'sdp-submission') throw new Error('Demo seed: the RPL/ARPL indicator can only be set while the registration is being built.');
        for (const learnerId of learnerIds) learnerOf(learnerId);
        set({ ...record, learners: record.learners.map((l) => (learnerIds.includes(l.learnerId) ? { ...l, rplArpl: true } : l)) });
        return api;
      },
      uploadSors(learnerIds: string[] | 'all', atDaysAgo: number) {
        const ids = learnerIds === 'all' ? record.learners.map((l) => l.learnerId) : learnerIds;
        for (const learnerId of ids) {
          const learner = learnerOf(learnerId);
          if (record.workflow.stageId !== 'sdp-submission') throw new Error('Demo seed: this SOR cannot be changed right now.');
          const uploadedAt = clock.at(atDaysAgo, 11);
          const fileSize = 180_000 + (learner.idNumber.charCodeAt(6) % 10) * 21_000;
          set({
            ...record,
            learners: record.learners.map((l) =>
              l.learnerId === learnerId ? { ...l, sor: { fileName: sorFileName(l.fullName), fileSize, uploadedAt }, sorStatus: l.sor ? 'replaced' : 'uploaded', sorFlagReason: null } : l,
            ),
          });
        }
        return api;
      },
      supportingDocument(fileName: string, fileSize: number, atDaysAgo: number) {
        set({ ...record, supportingDocuments: [...record.supportingDocuments, { fileName, fileSize, uploadedAt: clock.at(atDaysAgo, 11) }] });
        return api;
      },
      submit(atDaysAgo: number) {
        if (record.learners.length === 0) throw new Error('Demo seed: add at least one learner before submitting.');
        if (record.learners.some((l) => !l.sor)) throw new Error('Demo seed: every learner needs an uploaded SOR before submitting.');
        const at = clock.at(atDaysAgo, 12);
        const workflow = step(log, { definition: REGISTRATION_WORKFLOW, state: record.workflow, actionId: 'reg-submit', actor: sdp, at, recordType: 'eisa-registration', recordId: record.id });
        set({ ...record, workflow });
        notify(log, at, {
          recipientRole: 'Assistant Director',
          title: 'New EISA registration submitted',
          body: `${record.sdpName} submitted a registration for "${record.qualificationTitle}" (${record.learners.length} learner(s)).`,
        });
        return api;
      },
      underReview(learnerId: string, adId: string, atDaysAgo: number) {
        requireAdReview('reviewed');
        const ad = seedPerson(adId);
        setSorStatus(learnerId, 'under-review');
        audit(log, { recordType: 'eisa-registration', recordId: record.id, actor: ad, action: `Started reviewing ${learnerOf(learnerId).fullName}'s SOR`, timestamp: clock.at(atDaysAgo, 10) });
        return api;
      },
      accept(learnerIds: string[] | 'all', adId: string, atDaysAgo: number) {
        requireAdReview('accepted');
        const ad = seedPerson(adId);
        const ids = learnerIds === 'all' ? record.learners.map((l) => l.learnerId) : learnerIds;
        for (const learnerId of ids) {
          setSorStatus(learnerId, 'accepted');
          audit(log, { recordType: 'eisa-registration', recordId: record.id, actor: ad, action: `Accepted ${learnerOf(learnerId).fullName}'s SOR`, timestamp: clock.at(atDaysAgo, 10) });
        }
        return api;
      },
      // flagLearnerSor(): CR-038 — only that learner's SOR changes, not the registration's stage.
      flag(learnerId: string, adId: string, atDaysAgo: number, reason: string) {
        requireAdReview('flagged');
        const ad = seedPerson(adId);
        const at = clock.at(atDaysAgo, 14);
        const learner = learnerOf(learnerId);
        setSorStatus(learnerId, 'flagged', reason);
        audit(log, { recordType: 'eisa-registration', recordId: record.id, actor: ad, action: `Flagged ${learner.fullName}'s SOR as non-compliant`, note: reason, timestamp: at });
        notify(log, at, { recipientRole: 'SDP', title: 'SOR needs correction', body: `${learner.fullName}'s SOR for "${record.qualificationTitle}" was flagged: ${reason}` });
        return api;
      },
      createNumber(adId: string, atDaysAgo: number) {
        if (record.learners.some((l) => l.sorStatus === 'flagged')) throw new Error('Demo seed: resolve every flagged SOR before creating the registration number.');
        const ad = seedPerson(adId);
        if (ad.role !== REGISTRATION_PROCESSOR_ROLE) throw new Error(`Demo seed: ${ad.name} is not the registration processor role.`);
        const at = clock.at(atDaysAgo, 15);
        if (dateOf(at) > closing) throw new Error(`Demo seed: ${record.sdpName}'s registration for ${sitting.date} would finish after the ${closing} closing date.`);
        const workflow = step(log, { definition: REGISTRATION_WORKFLOW, state: record.workflow, actionId: 'reg-create-number', actor: ad, at, recordType: 'eisa-registration', recordId: record.id });
        set({ ...record, workflow });
        // PM-08: the Non-Trades path also prepares files for the QP and shares the SDP list with QA.
        if (record.category === 'non-trades') {
          set({ ...record, nonTradesHandoff: { filesPreparedAt: at, sdpListSharedAt: at } });
          audit(log, {
            recordType: 'eisa-registration',
            recordId: record.id,
            actor: ad,
            action: 'Prepared files for the QP and shared the SDP list with Quality Assurance (Non-Trades path)',
            timestamp: at,
          });
        }
        // CR-042/CR-044: the only automatic trigger into Site Visits & Monitoring — one
        // monitoring item per registration, covering every RPL/ARPL-flagged learner on it.
        const rplLearners = record.learners.filter((l) => l.rplArpl);
        if (rplLearners.length > 0 && !record.rplMonitoringItemId) {
          const item: RplArplMonitoringItem = {
            id: seedId(RPL_MONITORING_ITEM_ID_GROUP, monitoringItems.length + 1),
            visitType: 'rpl-arpl-monitoring',
            sourceRegistrationId: record.id,
            qualificationTitle: record.qualificationTitle,
            qpId: record.qpId,
            qpName: record.qpName,
            sdpId: record.sdpId,
            sdpName: record.sdpName,
            sittingDate: record.sittingDate,
            learnerNames: rplLearners.map((l) => l.fullName),
            createdBy: ad.name,
            createdAt: at,
          };
          monitoringItems.push(item);
          set({ ...record, rplMonitoringItemId: item.id });
          const body = `A monitoring item was created for "${record.qualificationTitle}" (${record.sdpName}) — ${rplLearners.length} RPL/ARPL learner(s).`;
          notify(log, at, { recipientRole: 'Assistant Director', title: 'RPL/ARPL monitoring item created', body });
          notify(log, at, { recipientRole: 'ASD', title: 'RPL/ARPL monitoring item created', body });
        }
        pendingNumbers.push({ record: () => record, set, at });
        return api;
      },
    };
    return api;
  }

  // Past sittings: started ~160 days before the sitting, registered ~12 days later (all well
  // before the ~3-month closing date). Learners are listed per SDP.
  function pastRegistration(sitting: EisaSitting, sdpId: string, learnerIds: string[], adId: string, sittingDaysAgo: number, rplLearnerIds: string[] = []) {
    const s = sittingDaysAgo + 160;
    start(sdpId, sitting, 'trades', s)
      .addLearners(learnerIds, s)
      .rplArpl(rplLearnerIds)
      .uploadSors('all', s - 1)
      .supportingDocument('Assessment_Centre_Readiness_Declaration.pdf', 412_160, s - 1)
      .submit(s - 5)
      .accept('all', adId, s - 10)
      .createNumber(adId, s - 12);
  }

  const past: { title: string; offset: number; parts: { sdpId: string; learnerIds: string[]; adId: string; rpl?: string[] }[] }[] = [
    { title: 'Electrical Trades', offset: -170, parts: [{ sdpId: THABO, learnerIds: ['learner-051', 'learner-052', 'learner-053', 'learner-005'], adId: RIAAN }] },
    { title: 'Welding', offset: -150, parts: [{ sdpId: KHANYA, learnerIds: ['learner-037', 'learner-038', 'learner-039', 'learner-040', 'learner-001'], adId: LINDIWE }] },
    { title: 'Plumbing', offset: -130, parts: [{ sdpId: LERATO, learnerIds: ['learner-064', 'learner-065', 'learner-066', 'learner-067', 'learner-068'], adId: RIAAN }] },
    {
      title: 'Electrical Trades',
      offset: -105,
      parts: [
        { sdpId: KHANYA, learnerIds: ['learner-035', 'learner-036'], adId: LINDIWE },
        { sdpId: THABO, learnerIds: ['learner-049', 'learner-050'], adId: RIAAN },
      ],
    },
    { title: 'Welding', offset: -90, parts: [{ sdpId: KHANYA, learnerIds: ['learner-032', 'learner-033', 'learner-034'], adId: LINDIWE }] },
    { title: 'Plumbing', offset: -75, parts: [{ sdpId: LERATO, learnerIds: ['learner-061', 'learner-062', 'learner-063'], adId: RIAAN, rpl: ['learner-063'] }] },
    { title: 'Electrical Trades', offset: -60, parts: [{ sdpId: THABO, learnerIds: ['learner-046', 'learner-047', 'learner-048'], adId: RIAAN }] },
    { title: 'Plumbing', offset: -50, parts: [{ sdpId: LERATO, learnerIds: ['learner-069', 'learner-070', 'learner-010'], adId: RIAAN }] },
    { title: 'Welding', offset: -45, parts: [{ sdpId: KHANYA, learnerIds: ['learner-028', 'learner-029', 'learner-030', 'learner-031'], adId: LINDIWE }] },
    { title: 'Plumbing', offset: -30, parts: [{ sdpId: LERATO, learnerIds: ['learner-057', 'learner-058', 'learner-059', 'learner-060'], adId: RIAAN }] },
    {
      title: 'Electrical Trades',
      offset: -15,
      parts: [
        { sdpId: KHANYA, learnerIds: ['learner-026', 'learner-027'], adId: LINDIWE },
        { sdpId: THABO, learnerIds: ['learner-044', 'learner-045'], adId: RIAAN },
      ],
    },
  ];
  for (const p of past) {
    const sitting = sittingAt(sittings, p.title, p.offset);
    for (const part of p.parts) pastRegistration(sitting, part.sdpId, part.learnerIds, part.adId, -p.offset, part.rpl);
  }

  // G6 — Thabo, registered for the Electrical Trades sitting at today + 35. One learner is
  // RPL/ARPL, so registering it created a Site Visits monitoring item.
  const electrical35 = sittingAt(sittings, 'Electrical Trades', 35);
  start(THABO, electrical35, 'trades', 118)
    .addLearners(['learner-041', 'learner-042', 'learner-043'], 118)
    .rplArpl(['learner-043'])
    .uploadSors('all', 117)
    .submit(110)
    .accept('all', RIAAN, 101)
    .createNumber(RIAAN, 99);

  // G5 — Khanya, Non-Trades, same sitting: registered, files prepared for the QP (PM-08).
  start(KHANYA, electrical35, 'non-trades', 120)
    .addLearners(['learner-024', 'learner-025'], 120)
    .uploadSors('all', 119)
    .supportingDocument('Non-Trades_Workplace_Logbook_Summary.pdf', 655_360, 119)
    .submit(112)
    .accept('all', LINDIWE, 106)
    .createNumber(LINDIWE, 104);

  // G4 — Khanya, Welding at today + 55: registered before registration closed.
  start(KHANYA, sittingAt(sittings, 'Welding', 55), 'trades', 95)
    .addLearners(['learner-021', 'learner-022', 'learner-023'], 95)
    .uploadSors('all', 94)
    .submit(88)
    .underReview('learner-021', LINDIWE, 83)
    .accept('all', LINDIWE, 82)
    .createNumber(LINDIWE, 80);

  // G2 — Khanya, Electrical Trades (B1 1st date): with the Assistant Director, review under way.
  start(KHANYA, b1Sitting(sittings, 0), 'trades', 25)
    .addLearners(['learner-015', 'learner-016', 'learner-017'], 25)
    .uploadSors('all', 24)
    .submit(20)
    .accept(['learner-016'], LINDIWE, 3)
    .underReview('learner-015', LINDIWE, 2);

  // G3 — Khanya, Welding at today + 125: one SOR flagged, waiting for the SDP (CR-038).
  start(KHANYA, sittingAt(sittings, 'Welding', 125), 'trades', 18)
    .addLearners(['learner-018', 'learner-019', 'learner-020'], 18)
    .uploadSors('all', 17)
    .submit(15)
    .accept(['learner-018', 'learner-020'], LINDIWE, 10)
    .flag(
      'learner-019',
      LINDIWE,
      9,
      'The SOR lists module KM-04 (Welding symbols and drawings) as outstanding. Upload the final SOR signed by your assessment manager.',
    );

  // G7 — Lerato, Plumbing at today + 150: just submitted, nothing reviewed yet.
  start(LERATO, sittingAt(sittings, 'Plumbing', 150), 'trades', 14)
    .addLearners(['learner-054', 'learner-055', 'learner-056'], 14)
    .uploadSors('all', 13)
    .supportingDocument('Assessment_Centre_Readiness_Declaration.pdf', 398_336, 13)
    .submit(8);

  // G1 — Khanya, Electrical Trades (B1 2nd date): still being built.
  start(KHANYA, b1Sitting(sittings, 1), 'trades', 4)
    .addLearners(['learner-013', 'learner-014'], 4)
    .uploadSors(['learner-013'], 2);

  // reg-create-number, in the order the numbers were created: EISA-REG-{year}-{nnnn}, then
  // the Non-Trades QP notification and the SDP notification that quote the number.
  pendingNumbers.sort((a, b) => a.at.localeCompare(b.at));
  pendingNumbers.forEach((pending, i) => {
    const record = pending.record();
    const registrationNumber = `${REGISTRATION_NUMBER_PREFIX}-${pending.at.slice(0, 4)}-${String(i + 1).padStart(4, '0')}`;
    pending.set({ ...record, registrationNumber });
    if (record.category === 'non-trades') {
      notify(log, pending.at, {
        recipientRole: 'QP',
        title: 'EISA registration files ready',
        body: `Registration files for "${record.qualificationTitle}" (${record.sdpName}) are ready — registration ${registrationNumber}.`,
      });
    }
    notify(log, pending.at, {
      recipientRole: 'SDP',
      title: 'EISA registration complete',
      body: `Your registration for "${record.qualificationTitle}" is complete — registration number ${registrationNumber}.`,
    });
  });

  // Newest first, the order startRegistration() and createMonitoringItem() leave the lists in.
  return {
    registrations: [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    monitoringItems: [...monitoringItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
