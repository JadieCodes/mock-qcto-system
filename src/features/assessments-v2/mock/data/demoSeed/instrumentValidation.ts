// Demo seed — EISA Instrument Validation (needs an approved QASA: qasa.ts 01–03). Written in the
// same shape as instrument-validation/api.ts (startValidation, performSchedulingAction,
// uploadInstrument, performValidationAction), with the audit entries and notifications each
// step implies. Days are "days ago"; slot dates are relative to today.
//
//  #   Qualification      QP                   ASD             Stage
//  V1  Plumbing           Johan van der Merwe  Sipho Ndlovu    Scheduled — slot agreed for today + 8; QP still to upload the instrument
//  V2  Electrical Trades  Nomvula Dlamini      Sipho Ndlovu    In validation — slot negotiated (QP proposed, ASD counter-proposed,
//                                                              QP accepted), instrument submitted; ASD to complete the checklist
//  V3  Welding            Precious Mahlangu    Thandeka Zulu   Outcome returned: Not approved — changes needed (cycle 2, QP to fix and resubmit)
//  V4  Electrical Trades  Nomvula Dlamini      Sipho Ndlovu    Approved with conditions (conditions written; earlier written-paper instrument)
//
// QCTO feedback 2.11: one QASA can have several validations, so Electrical Trades has two.
import { buildInstrumentValidationChecklist } from '../instrumentValidationChecklistItems';
import { PREFILL_NOT_CAPTURED_PLACEHOLDER, PREFILL_NO_UPCOMING_EISA } from '../../../modules/instrument-validation/config';
import { SCHEDULING_WORKFLOW, VALIDATION_WORKFLOW } from '../../../modules/instrument-validation/workflow';
import type {
  InstrumentValidationRecord,
  PrefilledField,
  SchedulingParty,
  ValidationOutcomeDecision,
} from '../../../modules/instrument-validation/types';
import type { EisaSitting } from '../../../modules/eisa-calendar/types';
import type { QsaAddendumApplication } from '../../../modules/qsa-addendum/types';
import type { Role } from '../../../types';
import { answerChecklist, createClock, dateOf, notify, seedId, seedPerson, step, workingDateAgo, workingDateFromToday, type SeedLog } from './helpers';
import { QASA_SEED_IDS } from './qasa';

const VALIDATION_ID_GROUP = 2;
const SIPHO = 'sipho-ndlovu';
const THANDEKA = 'thandeka-zulu';

// instrument-validation/api.ts buildPrefilledFields(), but "upcoming" is judged on the day the
// record was created, from the seeded published sittings.
function prefilledFields(addendum: QsaAddendumApplication, sittings: EisaSitting[], asOf: string): PrefilledField[] {
  const upcoming = sittings
    .filter((s) => s.status === 'published' && s.qualificationTitle === addendum.qualificationTitle && s.date >= asOf)
    .map((s) => s.date)
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

// The ASD's confirm-or-recapture pass (CR-021): the two fields the QASA never captures are recaptured.
function actionedFields(fields: PrefilledField[], address: string, contact: string): PrefilledField[] {
  return fields.map((f) => {
    if (f.key === 'qpAddress') return { ...f, value: address, action: 'recaptured' as const };
    if (f.key === 'qpContact') return { ...f, value: contact, action: 'recaptured' as const };
    return { ...f, action: 'confirmed' as const };
  });
}

const ASD_CHECKLIST_COMMENT = 'Checked against the approved QASA — in order.';

export function seedInstrumentValidations(log: SeedLog, qasa: QsaAddendumApplication[], sittings: EisaSitting[]): InstrumentValidationRecord[] {
  function addendum(id: string): QsaAddendumApplication {
    const found = qasa.find((a) => a.id === id);
    if (!found) throw new Error(`Demo seed: QASA ${id} missing — EISA Instrument Validation needs the approved QASA seed.`);
    return found;
  }

  function start(n: number, qasaId: string, createdDaysAgo: number) {
    const clock = createClock();
    const source = addendum(qasaId);
    const qp = seedPerson(source.qpId);
    const createdAt = clock.at(createdDaysAgo, 9);
    let record: InstrumentValidationRecord = {
      id: seedId(VALIDATION_ID_GROUP, n),
      qsaAddendumId: source.id,
      qpId: source.qpId,
      qpName: source.qpName,
      qualificationTitle: source.qualificationTitle,
      createdAt,
      createdBy: qp.name,
      scheduling: { workflow: { stageId: 'awaiting-qp-proposal' }, proposals: [], agreedSlot: null },
      instrument: null,
      cycleCount: 1,
      prefilledFields: prefilledFields(source, sittings, dateOf(createdAt)),
      checklist: buildInstrumentValidationChecklist(),
      validationWorkflow: { stageId: 'qp-instrument' },
      outcomeHistory: [],
      instrumentStatus: 'not-validated',
    };
    notify(log, createdAt, {
      recipientRole: 'ASD',
      title: 'New instrument validation started',
      body: `"${source.qualificationTitle}" is ready to schedule a validation date.`,
    });

    const title = source.qualificationTitle;

    // performSchedulingAction(): proposals carry the slot; the last one becomes the agreed slot.
    function schedule(actionId: string, actorId: string, daysAgo: number, slot?: { date: string; time: string; venue: string }) {
      const actor = seedPerson(actorId);
      const at = clock.at(daysAgo, 10);
      const next = step(log, {
        definition: SCHEDULING_WORKFLOW,
        state: record.scheduling.workflow,
        actionId,
        actor,
        at,
        recordType: 'instrument-validation-scheduling',
        recordId: record.id,
      });
      const proposals = slot
        ? [
            ...record.scheduling.proposals,
            { id: crypto.randomUUID(), ...slot, proposedBy: actor.role as SchedulingParty, proposedByName: actor.name, proposedAt: at },
          ]
        : record.scheduling.proposals;
      const latest = proposals[proposals.length - 1];
      const agreedSlot = next.stageId === 'agreed' && latest ? { date: latest.date, time: latest.time, venue: latest.venue } : null;
      record = { ...record, scheduling: { workflow: next, proposals, agreedSlot } };

      if (next.stageId === 'agreed') {
        notify(log, at, { recipientRole: 'QP', title: 'Validation date agreed', body: `The validation date for "${title}" is confirmed.` });
        notify(log, at, { recipientRole: 'ASD', title: 'Validation date agreed', body: `The validation date for "${title}" is confirmed.` });
      } else {
        const waitingRole: Role = next.stageId === 'awaiting-asd-response' ? 'ASD' : 'QP';
        notify(log, at, {
          recipientRole: waitingRole,
          title: 'Validation scheduling needs your response',
          body: `"${title}" has a proposed slot waiting for your accept or counter-proposal.`,
        });
      }
    }

    // uploadInstrument() then val-submit.
    function submitInstrument(fileName: string, fileSize: number, daysAgo: number) {
      const at = clock.at(daysAgo, 12);
      record = { ...record, instrument: { fileName, fileSize, uploadedAt: at } };
      const next = step(log, {
        definition: VALIDATION_WORKFLOW,
        state: record.validationWorkflow,
        actionId: 'val-submit',
        actor: qp,
        at: clock.at(daysAgo, 12),
        recordType: 'instrument-validation-validation',
        recordId: record.id,
      });
      record = { ...record, validationWorkflow: next };
    }

    // performValidationAction() for an outcome: checklist and pre-filled fields done first.
    function recordOutcome(actionId: 'val-approve-with-conditions' | 'val-not-approved', asdId: string, daysAgo: number, note: string, checklistNo?: Record<string, { answer: 'no'; comment: string }>) {
      const asd = seedPerson(asdId);
      const at = clock.at(daysAgo, 15);
      record = {
        ...record,
        checklist: answerChecklist(buildInstrumentValidationChecklist(), ASD_CHECKLIST_COMMENT, { overrides: checklistNo }),
        prefilledFields: actionedFields(record.prefilledFields, `${record.qpName}, QP office, Pretoria`, `${record.qpName} — 012 003 0800`),
      };
      const next = step(log, {
        definition: VALIDATION_WORKFLOW,
        state: record.validationWorkflow,
        actionId,
        actor: asd,
        at,
        recordType: 'instrument-validation-validation',
        recordId: record.id,
        note,
      });
      const decision: ValidationOutcomeDecision = actionId === 'val-not-approved' ? 'not-approved' : 'approved-with-conditions';
      record = {
        ...record,
        validationWorkflow: next,
        outcomeHistory: [...record.outcomeHistory, { cycle: record.cycleCount, decision, notes: note, decidedBy: asd.name, decidedAt: at }],
      };
      if (decision === 'not-approved') {
        // CR-023 loop: a fresh cycle — blank checklist, instrument cleared, fields to re-confirm.
        record = {
          ...record,
          instrument: null,
          cycleCount: record.cycleCount + 1,
          checklist: buildInstrumentValidationChecklist(),
          prefilledFields: prefilledFields(source, sittings, dateOf(at)),
        };
        notify(log, at, { recipientRole: 'QP', title: 'Changes required on your instrument', body: `"${title}": ${note}` });
      } else {
        record = { ...record, instrumentStatus: 'validated' };
        notify(log, at, { recipientRole: 'QP', title: 'Instrument validation outcome recorded', body: `"${title}" is now Approved with conditions.` });
      }
    }

    return { get: () => record, schedule, submitInstrument, recordOutcome };
  }

  const qcto = 'QCTO Head Office, 256 Glenwood Road, Lynnwood, Pretoria — Boardroom 2';
  const virtual = 'Virtual (Microsoft Teams)';

  // V4 — approved with conditions.
  const v4 = start(4, QASA_SEED_IDS.electricalTrades, 70);
  v4.schedule('sched-qp-propose', 'qp-nomvula-dlamini', 69, { date: workingDateAgo(55), time: '10:00', venue: qcto });
  v4.schedule('sched-asd-accept', SIPHO, 68);
  v4.submitInstrument('Electrical_Trades_EISA_Written_Paper_v1.pdf', 2_457_600, 57);
  v4.recordOutcome(
    'val-approve-with-conditions',
    SIPHO,
    52,
    'Conditions: (1) Replace question 4.2 — it repeats question 2.3 — and send the updated paper to the ASD before the sitting. (2) Send the signed confidentiality agreement for the second examiner within 10 working days.',
  );

  // V3 — not approved: changes needed, back with the QP for cycle 2.
  const v3 = start(3, QASA_SEED_IDS.welding, 40);
  v3.schedule('sched-qp-propose', 'qp-precious-mahlangu', 39, { date: workingDateAgo(9), time: '09:00', venue: qcto });
  v3.schedule('sched-asd-accept', THANDEKA, 38);
  v3.submitInstrument('Welding_EISA_Practical_Instrument_and_Rubric_v1.pdf', 3_145_728, 12);
  v3.recordOutcome(
    'val-not-approved',
    THANDEKA,
    7,
    'The practical rubric does not show the weighting for the root-pass and cap-pass tasks, and the moderator report is not signed. Add the weightings, attach the signed moderator report and resubmit.',
    { '1.3': { answer: 'no', comment: 'Component weightings for the practical tasks are missing from the rubric.' } },
  );

  // V2 — in validation with the ASD.
  const v2 = start(2, QASA_SEED_IDS.electricalTrades, 22);
  v2.schedule('sched-qp-propose', 'qp-nomvula-dlamini', 21, { date: workingDateAgo(6), time: '14:00', venue: qcto });
  v2.schedule('sched-asd-counter', SIPHO, 20, { date: workingDateAgo(5), time: '09:00', venue: virtual });
  v2.schedule('sched-qp-accept', 'qp-nomvula-dlamini', 19);
  v2.submitInstrument('Electrical_Trades_EISA_Practical_Instrument_and_Rubric_v1.pdf', 2_883_584, 8);

  // V1 — scheduled: slot agreed, QP to upload the instrument.
  const v1 = start(1, QASA_SEED_IDS.plumbing, 10);
  v1.schedule('sched-qp-propose', 'qp-johan-van-der-merwe', 9, { date: workingDateFromToday(8), time: '10:00', venue: qcto });
  v1.schedule('sched-asd-accept', SIPHO, 8);

  // Newest first, the same order startValidation() leaves the list in.
  return [v1.get(), v2.get(), v3.get(), v4.get()];
}
