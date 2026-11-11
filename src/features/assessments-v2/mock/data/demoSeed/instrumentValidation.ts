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
//  V4  Electrical Trades  Nomvula Dlamini      Sipho Ndlovu    Approved with conditions (conditions written; earlier written-paper instrument) — its
//                                                              exemplar was replaced by V5's (Batch U)
//  V5  Electrical Trades  Nomvula Dlamini      Sipho Ndlovu    Approved (Batch U): 3 instruments, two linked to seeded sittings, one confirmed exemplar
//
// Batch U (29.6): a record holds several instruments. V2 is waiting for the ASD with 2 instruments and the QP's proposed
// exemplar. V4 is the record as it was before Batch U (one instrument, mapped the way instrument-validation/exemplars.ts
// maps it on load), with its exemplar replaced by V5's.
//
// QCTO feedback 2.11: one QASA can have several validations, so Electrical Trades has two.
import { buildInstrumentValidationChecklist } from '../instrumentValidationChecklistItems';
import { PREFILL_NOT_CAPTURED_PLACEHOLDER, PREFILL_NO_UPCOMING_EISA } from '../../../modules/instrument-validation/config';
import { SCHEDULING_WORKFLOW, VALIDATION_WORKFLOW } from '../../../modules/instrument-validation/workflow';
import type {
  InstrumentValidationRecord,
  PrefilledField,
  SchedulingParty,
  SubmittedInstrument,
  ValidationOutcomeDecision,
} from '../../../modules/instrument-validation/types';
import type { EisaSitting } from '../../../modules/eisa-calendar/types';
import type { QsaAddendumApplication } from '../../../modules/qsa-addendum/types';
import type { Role } from '../../../types';
import { answerChecklist, audit, createClock, dateOf, notify, seedId, seedPerson, step, workingDateAgo, workingDateFromToday, type SeedLog } from './helpers';
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
      instruments: [],
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

    // addInstruments() / setInstrumentSitting() / setProposedExemplar(), then val-submit.
    function submitInstruments(files: { fileName: string; fileSize: number; sitting?: EisaSitting; proposed?: boolean }[], daysAgo: number) {
      const at = clock.at(daysAgo, 12);
      const instruments: SubmittedInstrument[] = files.map((f, i) => ({
        id: `${record.id}-instrument-${i + 1}`,
        fileName: f.fileName,
        fileSize: f.fileSize,
        uploadedAt: at,
        sittingId: f.sitting?.id ?? null,
        sittingDate: f.sitting?.date ?? null,
        proposedExemplar: f.proposed ?? false,
        confirmedExemplar: false,
      }));
      record = { ...record, instruments };
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
    // `exemplar` is the ASD's choice (Batch U). Without it the record is the pre-Batch-U shape: its
    // proposed instrument is the confirmed exemplar, with no audit entry and the old notification text.
    function recordOutcome(
      actionId: 'val-approve' | 'val-approve-with-conditions' | 'val-not-approved',
      asdId: string,
      daysAgo: number,
      note: string,
      checklistNo?: Record<string, { answer: 'no'; comment: string }>,
      exemplar?: { instrumentId: string; differenceNote?: string },
    ) {
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
      const decision: ValidationOutcomeDecision =
        actionId === 'val-not-approved' ? 'not-approved' : actionId === 'val-approve' ? 'approved' : 'approved-with-conditions';
      record = {
        ...record,
        validationWorkflow: next,
        outcomeHistory: [
          ...record.outcomeHistory,
          { cycle: record.cycleCount, decision, notes: note, decidedBy: asd.name, decidedAt: at, ...(exemplar ? { exemplarInstrumentId: exemplar.instrumentId, exemplarNote: exemplar.differenceNote } : {}) },
        ],
      };
      if (decision === 'not-approved') {
        // CR-023 loop: a fresh cycle — blank checklist, instrument cleared, fields to re-confirm.
        record = {
          ...record,
          instruments: [],
          cycleCount: record.cycleCount + 1,
          checklist: buildInstrumentValidationChecklist(),
          prefilledFields: prefilledFields(source, sittings, dateOf(at)),
        };
        notify(log, at, { recipientRole: 'QP', title: 'Changes required on your instrument', body: `"${title}": ${note}` });
      } else {
        record = { ...record, instrumentStatus: 'validated' };
        const outcomeText = decision === 'approved' ? 'Approved' : 'Approved with conditions';
        if (exemplar) {
          const chosen = record.instruments.find((i) => i.id === exemplar.instrumentId);
          if (!chosen) throw new Error(`Demo seed: exemplar ${exemplar.instrumentId} is not in this submission.`);
          record = { ...record, instruments: record.instruments.map((i) => (i.id === chosen.id ? { ...i, confirmedExemplar: true, replacedAt: null } : i)) };
          audit(log, {
            actor: asd,
            recordType: 'instrument-validation-validation',
            recordId: record.id,
            action: 'Exemplar confirmed',
            note: exemplar.differenceNote ? `${chosen.fileName} — Different from the QP's proposal: ${exemplar.differenceNote}` : chosen.fileName,
            timestamp: at,
          });
          notify(log, at, { recipientRole: 'QP', title: 'Instrument validation outcome recorded', body: `"${title}" is now ${outcomeText}. The exemplar is "${chosen.fileName}".` });
        } else {
          record = { ...record, instruments: record.instruments.map((i) => (i.proposedExemplar ? { ...i, confirmedExemplar: true } : i)) };
          notify(log, at, { recipientRole: 'QP', title: 'Instrument validation outcome recorded', body: `"${title}" is now ${outcomeText}.` });
        }
      }
    }

    // A later validation confirmed another exemplar for the qualification (same time as that outcome).
    function replaceExemplar(at: string) {
      record = { ...record, instruments: record.instruments.map((i) => (i.confirmedExemplar && !i.replacedAt ? { ...i, replacedAt: at } : i)) };
    }

    return { get: () => record, schedule, submitInstruments, recordOutcome, replaceExemplar };
  }

  const electricalSittings = sittings
    .filter((x) => x.qualificationTitle === 'Electrical Trades' && x.status === 'published')
    .sort((x, y) => x.date.localeCompare(y.date));
  if (electricalSittings.length < 2) throw new Error('Demo seed: Batch U needs two published Electrical Trades sittings.');
  const [sitting1, sitting2] = electricalSittings;

  const qcto = 'QCTO Head Office, 256 Glenwood Road, Lynnwood, Pretoria — Boardroom 2';
  const virtual = 'Virtual (Microsoft Teams)';

  // V4 — approved with conditions.
  const v4 = start(4, QASA_SEED_IDS.electricalTrades, 70);
  v4.schedule('sched-qp-propose', 'qp-nomvula-dlamini', 69, { date: workingDateAgo(55), time: '10:00', venue: qcto });
  v4.schedule('sched-asd-accept', SIPHO, 68);
  v4.submitInstruments([{ fileName: 'Electrical_Trades_EISA_Written_Paper_v1.pdf', fileSize: 2_457_600, proposed: true }], 57);
  v4.recordOutcome(
    'val-approve-with-conditions',
    SIPHO,
    52,
    'Conditions: (1) Replace question 4.2 — it repeats question 2.3 — and send the updated paper to the ASD before the sitting. (2) Send the signed confidentiality agreement for the second examiner within 10 working days.',
  );

  // V5 — approved, with 3 instruments: its exemplar replaced V4's.
  const v5 = start(5, QASA_SEED_IDS.electricalTrades, 45);
  v5.schedule('sched-qp-propose', 'qp-nomvula-dlamini', 44, { date: workingDateAgo(32), time: '10:00', venue: virtual });
  v5.schedule('sched-asd-accept', SIPHO, 43);
  v5.submitInstruments(
    [
      { fileName: 'Electrical_Trades_EISA_Written_Paper_v2.pdf', fileSize: 2_560_000, sitting: sitting1, proposed: true },
      { fileName: 'Electrical_Trades_EISA_Written_Paper_v2_Bank_B.pdf', fileSize: 2_498_560, sitting: sitting2 },
      { fileName: 'Electrical_Trades_EISA_Practical_Rubric_v2.pdf', fileSize: 1_843_200 },
    ],
    34,
  );
  v5.recordOutcome('val-approve', SIPHO, 29, '', undefined, { instrumentId: `${v5.get().id}-instrument-1` });
  v4.replaceExemplar(v5.get().outcomeHistory[0].decidedAt);

  // V3 — not approved: changes needed, back with the QP for cycle 2.
  const v3 = start(3, QASA_SEED_IDS.welding, 40);
  v3.schedule('sched-qp-propose', 'qp-precious-mahlangu', 39, { date: workingDateAgo(9), time: '09:00', venue: qcto });
  v3.schedule('sched-asd-accept', THANDEKA, 38);
  v3.submitInstruments([{ fileName: 'Welding_EISA_Practical_Instrument_and_Rubric_v1.pdf', fileSize: 3_145_728, proposed: true }], 12);
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
  v2.submitInstruments(
    [
      { fileName: 'Electrical_Trades_EISA_Practical_Instrument_and_Rubric_v1.pdf', fileSize: 2_883_584, sitting: sitting1, proposed: true },
      { fileName: 'Electrical_Trades_EISA_Practical_Instrument_and_Rubric_v2.pdf', fileSize: 2_912_256, sitting: sitting2 },
    ],
    8,
  );

  // V1 — scheduled: slot agreed, QP to upload the instrument.
  const v1 = start(1, QASA_SEED_IDS.plumbing, 10);
  v1.schedule('sched-qp-propose', 'qp-johan-van-der-merwe', 9, { date: workingDateFromToday(8), time: '10:00', venue: qcto });
  v1.schedule('sched-asd-accept', SIPHO, 8);

  // Newest first, the same order startValidation() leaves the list in.
  return [v1.get(), v2.get(), v3.get(), v5.get(), v4.get()];
}
