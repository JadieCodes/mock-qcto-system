// Demo seed — EISA Confirmation (Batch T, QCTO 29.20, 29.21). Written in the same shape as
// eisa-confirmation/api.ts (shareDueLists, saveConfirmationDraft, submitConfirmation,
// acceptConfirmation, returnConfirmationToQp), with the audit entries and notifications each step
// implies. The system shares a sitting's list once its registration has closed (every registration
// for the sitting is Registered); the learners, SDPs, pathways and registration numbers come from
// those registrations. Days are "days ago".
//
//  #    Sitting                       QP                   Stage
//  F1   Electrical Trades, today+35   Nomvula Dlamini     Submitted — with the ASD (Khanya and Thabo as centres, 5 learners)
//  F13  Welding, today - 20           Precious Mahlangu    Accepted, Khanya (3 learners) — awaiting results with a saved draft (Batch L2)
//  F2–F12  the 11 past sittings behind eisaRegistration.ts P1–P11: Accepted, about 5 weeks before
//       each sitting, with marking 2 and moderation 7 working days after it. F2 (Electrical
//       Trades, today - 15) is the accepted one still awaiting its results batch.
//  F14  Electrical Trades, today - 190  Accepted; its results batch was declined (Batch N1)
//  F15  Welding, today + 55           Precious Mahlangu    List shared, QP draft: Khanya and Vuma chosen, 2 of 3 learners allocated, one date entered
//  F16  Plumbing, today + 62          Johan van der Merwe  Returned to the QP with a reason (Lerato, 2 learners)
// Not seeded on purpose: Electrical Trades (the third B1 date) has registered learners but its
// registration is still open, so its list shows as "Will be shared on <closing date>".
import { addWorkingDays } from '../../../shared/dates/workingDays';
import type { EisaSitting } from '../../../modules/eisa-calendar/types';
import { CONFIRMATION_REVIEWER_ROLE, defaultResultsSubmissionDate } from '../../../modules/eisa-confirmation/config';
import { isListShareable, shareDateFor, sharedAtFor } from '../../../modules/eisa-confirmation/sharing';
import { CONFIRMATION_WORKFLOW } from '../../../modules/eisa-confirmation/workflow';
import type { ConsolidatedLearnerRow, EisaConfirmationRecord } from '../../../modules/eisa-confirmation/types';
import { isRplArplType } from '../../../modules/eisa-registration/readiness';
import type { EisaRegistrationRecord } from '../../../modules/eisa-registration/types';
import { audit, createClock, dateOf, notify, seedId, seedPerson, step, todayIso, type SeedLog } from './helpers';
import { sittingAt } from './eisaRegistration';

const CONFIRMATION_ID_GROUP = 6;
const LINDIWE = 'lindiwe-khumalo';
const RIAAN = 'riaan-pretorius';
const RECORD_TYPE = 'eisa-confirmation';

// ASDs as in eisaRegistration.ts: Riaan Pretorius for Plumbing (Lerato), Lindiwe
// Khumalo for Electrical Trades and Welding.
const PAST_SITTINGS: { title: string; offset: number; adId: string }[] = [
  { title: 'Electrical Trades', offset: -15, adId: LINDIWE },
  { title: 'Plumbing', offset: -30, adId: RIAAN },
  { title: 'Welding', offset: -45, adId: LINDIWE },
  { title: 'Plumbing', offset: -50, adId: RIAAN },
  { title: 'Electrical Trades', offset: -60, adId: LINDIWE },
  { title: 'Plumbing', offset: -75, adId: RIAAN },
  { title: 'Welding', offset: -90, adId: LINDIWE },
  { title: 'Electrical Trades', offset: -105, adId: LINDIWE },
  { title: 'Plumbing', offset: -130, adId: RIAAN },
  { title: 'Welding', offset: -150, adId: LINDIWE },
  { title: 'Electrical Trades', offset: -170, adId: LINDIWE },
];

interface DraftSpec {
  centres: string[];
  // Where each learner goes; null leaves the learner unallocated.
  allocate: (learner: ConsolidatedLearnerRow) => string | null;
  markingDates: string[];
  moderationDates: string[];
  resultsSubmissionDate: string;
}

interface ConfirmationSeedBuilder {
  draft: (atDaysAgo: number, spec: DraftSpec) => ConfirmationSeedBuilder;
  submit: (atDaysAgo: number) => ConfirmationSeedBuilder;
  accept: (atDaysAgo: number) => ConfirmationSeedBuilder;
  returnToQp: (atDaysAgo: number, reason: string) => ConfirmationSeedBuilder;
  done: () => void;
}

// The usual past-sitting confirmation: every learner goes to their own SDP's centre, marking 2 and
// moderation 7 working days after the EISA, results due 21 working days after it.
function ownSdpSpec(sittingDate: string, sdpNames: string[]): DraftSpec {
  return {
    centres: [...new Set(sdpNames)],
    allocate: (l) => l.sdpName,
    markingDates: [addWorkingDays(sittingDate, 2)],
    moderationDates: [addWorkingDays(sittingDate, 7)],
    resultsSubmissionDate: defaultResultsSubmissionDate(sittingDate),
  };
}

export function seedEisaConfirmations(log: SeedLog, sittings: EisaSitting[], registrations: EisaRegistrationRecord[]): EisaConfirmationRecord[] {
  const records: EisaConfirmationRecord[] = [];
  let n = 0;

  function share(sitting: EisaSitting): ConfirmationSeedBuilder {
    const clock = createClock();

    // shareDueLists(): once per sitting, only after registration closed, and only when every
    // registration for the sitting is Registered.
    if (records.some((r) => r.sittingId === sitting.id)) throw new Error(`Demo seed: ${sitting.date} already has an EISA Confirmation.`);
    if (!isListShareable(sitting, todayIso())) throw new Error(`Demo seed: registration for ${sitting.qualificationTitle} ${sitting.date} has not closed.`);
    const forSitting = registrations.filter((r) => r.sittingId === sitting.id);
    const registered = forSitting.filter((r) => r.workflow.stageId === 'registered');
    if (registered.length === 0 || registered.length !== forSitting.length) {
      throw new Error(`Demo seed: registration is not yet complete for ${sitting.qualificationTitle} ${sitting.date}.`);
    }
    const sharedAt = sharedAtFor(shareDateFor(sitting));
    if (registered.some((r) => r.createdAt >= sharedAt)) throw new Error('Demo seed: list shared before its registrations.');

    const learners: ConsolidatedLearnerRow[] = registered.flatMap((r) =>
      r.learners.map((l) => ({
        learnerId: l.learnerId,
        fullName: l.fullName,
        idNumber: l.idNumber,
        sdpName: r.sdpName,
        pathway: isRplArplType(l.readinessType) ? ('RPL/ARPL' as const) : ('Formal' as const),
        registrationNumber: r.registrationNumber ?? '',
        assessmentCentre: null,
      })),
    );
    let record: EisaConfirmationRecord = {
      id: seedId(CONFIRMATION_ID_GROUP, ++n),
      sittingId: sitting.id,
      sittingDate: sitting.date,
      qualificationTitle: sitting.qualificationTitle,
      qpId: sitting.qpId,
      qpName: sitting.qpName,
      registrationIds: registered.map((r) => r.id),
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
      sharedAt,
      draftSavedAt: null,
      submittedAt: null,
      acceptedAt: null,
      acceptedBy: null,
    };
    notify(log, sharedAt, {
      recipientRole: 'QP',
      title: 'EISA learner list shared',
      body: `The consolidated learner list for "${sitting.qualificationTitle}" (${sitting.date}) is ready. Choose the assessment centres, allocate the learners and confirm the dates.`,
    });

    const qp = seedPerson(sitting.qpId);
    // Plumbing is Riaan's, Electrical Trades and Welding are Lindiwe's.
    const asd = seedPerson(sitting.qualificationTitle === 'Plumbing' ? RIAAN : LINDIWE);
    if (asd.role !== CONFIRMATION_REVIEWER_ROLE) throw new Error(`Demo seed: ${asd.name} cannot review an EISA Confirmation.`);

    const api: ConfirmationSeedBuilder = {
      // saveConfirmationDraft(): only while with the QP; centres chosen are accredited ones.
      draft(atDaysAgo, spec) {
        if (record.workflow.stageId !== 'qp-draft') throw new Error('Demo seed: a draft can only be saved while the confirmation is with the QP.');
        const at = clock.at(atDaysAgo, 10);
        const allocated = record.learners.map((l) => ({ ...l, assessmentCentre: spec.allocate(l) }));
        if (allocated.some((l) => l.assessmentCentre !== null && !spec.centres.includes(l.assessmentCentre))) {
          throw new Error('Demo seed: a learner is allocated to a centre that was not chosen.');
        }
        record = {
          ...record,
          centres: spec.centres,
          learners: allocated,
          markingDates: spec.markingDates,
          moderationDates: spec.moderationDates,
          markingDate: spec.markingDates[0] ?? null,
          moderationDate: spec.moderationDates[spec.moderationDates.length - 1] ?? null,
          resultsSubmissionDate: spec.resultsSubmissionDate,
          draftSavedAt: at,
        };
        audit(log, { recordType: RECORD_TYPE, recordId: record.id, actor: qp, action: 'Saved a draft EISA Confirmation', timestamp: at });
        return api;
      },
      // submitConfirmation(): every learner allocated, every chosen centre used, dates in order.
      submit(atDaysAgo) {
        if (record.learners.some((l) => !l.assessmentCentre)) throw new Error('Demo seed: allocate every learner before submitting.');
        if (record.centres.some((c) => !record.learners.some((l) => l.assessmentCentre === c))) throw new Error('Demo seed: every chosen centre needs a learner.');
        if (!record.markingDate || !record.moderationDate || !record.resultsSubmissionDate) throw new Error('Demo seed: enter the dates before submitting.');
        if (record.markingDates.some((d) => d < record.sittingDate) || record.moderationDates.some((d) => d < record.markingDate!)) {
          throw new Error('Demo seed: marking/moderation dates out of order.');
        }
        const at = clock.at(atDaysAgo, 11);
        const workflow = step(log, { definition: CONFIRMATION_WORKFLOW, state: record.workflow, actionId: 'conf-submit', actor: qp, at, recordType: RECORD_TYPE, recordId: record.id });
        const confirmedCentres = record.centres.map((centre) => ({ centre, learnerCount: record.learners.filter((l) => l.assessmentCentre === centre).length }));
        record = { ...record, workflow, confirmedCentres, submittedAt: at };
        notify(log, at, {
          recipientRole: CONFIRMATION_REVIEWER_ROLE,
          title: 'EISA Confirmation submitted',
          body: `${record.qpName} submitted the EISA Confirmation for "${record.qualificationTitle}" (${record.sittingDate}) for your review.`,
        });
        return api;
      },
      accept(atDaysAgo) {
        const at = clock.at(atDaysAgo, 11);
        const workflow = step(log, { definition: CONFIRMATION_WORKFLOW, state: record.workflow, actionId: 'conf-accept', actor: asd, at, recordType: RECORD_TYPE, recordId: record.id });
        record = { ...record, workflow, acceptedAt: at, acceptedBy: asd.name };
        notify(log, at, {
          recipientRole: 'QP',
          title: 'EISA Confirmation accepted',
          body: `"${record.qualificationTitle}" (${record.sittingDate}) is accepted: marking ${record.markingDate}, moderation ${record.moderationDate}.`,
        });
        return api;
      },
      returnToQp(atDaysAgo, reason) {
        const at = clock.at(atDaysAgo, 14);
        const workflow = step(log, { definition: CONFIRMATION_WORKFLOW, state: record.workflow, actionId: 'conf-return', actor: asd, at, recordType: RECORD_TYPE, recordId: record.id, note: reason });
        record = { ...record, workflow, returns: [...record.returns, { cycle: record.returns.length + 1, reason, returnedAt: at, returnedBy: asd.name, returnedById: asd.id }] };
        notify(log, at, {
          recipientRole: 'QP',
          title: 'EISA Confirmation returned',
          body: `The EISA Confirmation for "${record.qualificationTitle}" (${record.sittingDate}) was returned to you: ${reason}`,
        });
        return api;
      },
      done() {
        records.push(record);
      },
    };
    return api;
  }

  const sdpNamesOf = (sitting: EisaSitting) => registrations.filter((r) => r.sittingId === sitting.id).map((r) => r.sdpName);

  // Past sittings: shared at registration closing, the QP saves a draft and submits about 5 weeks
  // before the sitting, the ASD accepts two days later.
  function pastConfirmation(sitting: EisaSitting, sittingDaysAgo: number) {
    share(sitting)
      .draft(sittingDaysAgo + 39, ownSdpSpec(sitting.date, sdpNamesOf(sitting)))
      .submit(sittingDaysAgo + 37)
      .accept(sittingDaysAgo + 35)
      .done();
  }

  for (const p of PAST_SITTINGS) pastConfirmation(sittingAt(sittings, p.title, p.offset), -p.offset);

  // F13 (Batch L2, 05.24) — accepted, awaiting results with a saved draft. Shared after the loop
  // above so no earlier confirmation changes id.
  pastConfirmation(sittingAt(sittings, 'Welding', -20), 20);

  // F1 — submitted: with the ASD for review.
  {
    const sitting = sittingAt(sittings, 'Electrical Trades', 35);
    share(sitting)
      .draft(9, ownSdpSpec(sitting.date, sdpNamesOf(sitting)))
      .submit(6)
      .done();
  }

  // F14 (Batch N1) — accepted; its results batch was declined. Shared after F1 so no earlier confirmation changes id.
  pastConfirmation(sittingAt(sittings, 'Electrical Trades', -190), 190);

  // F15 — the list is shared and the QP has a draft: Khanya and Vuma chosen (both accredited for
  // Welding), two of three learners allocated to Khanya, the last one still to allocate.
  {
    const sitting = sittingAt(sittings, 'Welding', 55);
    let allocated = 0;
    share(sitting)
      .draft(4, {
        centres: ['Khanya Skills Academy', 'Vuma Trade Centre'],
        allocate: () => (allocated++ < 2 ? 'Khanya Skills Academy' : null),
        markingDates: [addWorkingDays(sitting.date, 2)],
        moderationDates: [],
        resultsSubmissionDate: defaultResultsSubmissionDate(sitting.date),
      })
      .done();
  }

  // F16 — submitted by the QP and returned by the ASD with a reason; the QP still has to fix it.
  {
    const sitting = sittingAt(sittings, 'Plumbing', 62);
    share(sitting)
      .draft(14, {
        centres: ['Lerato Training Institute'],
        allocate: () => 'Lerato Training Institute',
        markingDates: [addWorkingDays(sitting.date, 1)],
        moderationDates: [addWorkingDays(sitting.date, 2)],
        resultsSubmissionDate: defaultResultsSubmissionDate(sitting.date),
      })
      .submit(12)
      .returnToQp(8, 'Moderation takes place the working day after marking. Allow at least three working days between them, then submit again.')
      .done();
  }

  if (records.some((r) => r.submittedAt && r.markingDate && dateOf(r.submittedAt) > r.markingDate)) throw new Error('Demo seed: a confirmation was submitted after marking.');

  // Newest first, the order shareDueLists() leaves the list in.
  return records.sort((a, b) => b.sharedAt.localeCompare(a.sharedAt));
}
