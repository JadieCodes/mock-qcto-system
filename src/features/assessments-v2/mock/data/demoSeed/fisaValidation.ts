// Demo seed — FISA Instrument Validation, item 1.11. Written in the same shape as fisa/api.ts
// (startFisaValidation, uploadFisaInstrument, saveFisaValidationForm,
// performFisaValidationAction), with the audit entries and notifications each step implies.
// Every record is against the approved "Electrical Installation Skills Programme" FISA Standard
// (mock/data/fisaStandardsSeed.ts). There are no FISA registrations (QCTO feedback 2.10).
// Days are "days ago".
//
//  #   SDP                        Allocated by / ASD               Stage
//  F1  Thabo Technical College    —                                Developing — instrument uploaded, SDP still to notify QCTO
//  F2  Khanya Skills Academy      —                                SDP notified QCTO — awaiting Deputy Director allocation
//  F3  Thabo Technical College    Peter Botha → Thandeka Zulu      ASD validating (header partly done, sections 1 and 3 answered)
//  F4  Lerato Training Institute  Grace Mokoena → Sipho Ndlovu     Outcome returned: Not approved — changes needed (cycle 2, SDP to fix and resubmit)
//  F5  Khanya Skills Academy      Grace Mokoena → Sipho Ndlovu     Validated — Approved (all Yes)
//  F6  Lerato Training Institute  Grace Mokoena → Thandeka Zulu    Validated — Approved with conditions (some No answers, findings)
//
// QCTO feedback 2.11 follow-up (Batch B): one standard can have several validations — every
// record here is for the same standard; Khanya, Thabo and Lerato have two each.
// QCTO feedback 3.10: every record is on QCTO's "FISA Validation of Instrument Report" form.
import { seedFisaStandards } from '../fisaStandardsSeed';
import { buildFisaInstrumentValidationChecklist } from '../fisaInstrumentValidationChecklistItems';
import type {
  FisaValidationDecision,
  FisaValidationFormPatch,
  FisaValidationRecord,
} from '../../../modules/fisa/types';
import {
  fisaValidationFormOf,
  isFisaValidationFormComplete,
  withBlankFisaValidationForm,
  withNextCycleFisaValidationForm,
} from '../../../modules/fisa/validationForm';
import { FISA_VALIDATION_WORKFLOW } from '../../../modules/fisa/workflow';
import { answerChecklist, createClock, notify, seedId, seedPerson, step, type SeedLog } from './helpers';

const FISA_VALIDATION_ID_GROUP = 10;
const APPROVED_STANDARD_ID = 'seed-fisa-standard-approved';

const GRACE = 'grace-mokoena';
const PETER = 'peter-botha';
const SIPHO = 'sipho-ndlovu';
const THANDEKA = 'thandeka-zulu';
const KHANYA = 'sdp-khanya-skills-academy';
const THABO = 'sdp-thabo-technical-college';
const LERATO = 'sdp-lerato-training-institute';

const OUTCOME_ACTION_IDS = ['fval-approve', 'fval-approve-with-conditions', 'fval-not-approved'];

type ChecklistOverrides = Record<string, { answer: 'yes' | 'no'; comment: string }>;

// The header details the evaluator types (QCTO's form; none of them is held on the instrument).
const ELECTRICAL_HEADER = {
  spId: 'SP-230512',
  nqfLevel: '3',
  credits: '24',
  duration: '3 hours',
  totalMarks: '100',
  passMark: '60%',
};

interface FisaValidationSeedBuilder {
  upload: (fileName: string, fileSize: number, atDaysAgo: number) => FisaValidationSeedBuilder;
  checklist: (asdId: string, sectionCount: number | 'all', overrides?: ChecklistOverrides) => FisaValidationSeedBuilder;
  form: (asdId: string, patch: Omit<FisaValidationFormPatch, 'checklist'>, signedDaysAgo?: number) => FisaValidationSeedBuilder;
  act: (actionId: string, actorId: string, atDaysAgo: number, options?: { note?: string; allocatedAsdId?: string }) => FisaValidationSeedBuilder;
  done: () => void;
}

export function seedFisaValidations(log: SeedLog): FisaValidationRecord[] {
  const records: FisaValidationRecord[] = [];
  // listApprovedFisaStandards(): the standards store falls back to this seed after a reset.
  const standard = seedFisaStandards().find((s) => s.id === APPROVED_STANDARD_ID && s.workflow.stageId === 'approved');
  if (!standard) throw new Error('Demo seed: the approved Electrical Installation FISA Standard is missing.');
  let n = 0;

  // startFisaValidation(), from the SDP's "Start Instrument Development" dialog.
  function start(sdpId: string, daysAgo: number): FisaValidationSeedBuilder {
    const clock = createClock();
    const sdp = seedPerson(sdpId);
    const createdAt = clock.at(daysAgo, 9);
    if (createdAt < standard!.createdAt) throw new Error('Demo seed: instrument development started before the FISA Standard existed.');
    let record: FisaValidationRecord = withBlankFisaValidationForm({
      id: seedId(FISA_VALIDATION_ID_GROUP, ++n),
      fisaStandardId: standard!.id,
      skillsProgrammeTitle: standard!.skillsProgrammeTitle,
      sdpId: sdp.sdpId ?? sdp.id,
      sdpName: sdp.name,
      createdAt,
      createdBy: sdp.name,
      instrument: null,
      cycleCount: 1,
      checklist: [],
      allocatedAsdId: null,
      allocatedAsdName: null,
      workflow: { stageId: 'sdp-instrument' },
      outcomeHistory: [],
      instrumentStatus: 'not-validated',
    });

    const assertAllocatedAsdIsWorking = (asdId: string) => {
      if (record.workflow.stageId !== 'asd-validation' || record.allocatedAsdId !== asdId) {
        throw new Error('Demo seed: only the allocated ASD fills in the validation report, during validation.');
      }
    };

    const api: FisaValidationSeedBuilder = {
      // uploadFisaInstrument(): only while the record is with the SDP; no audit entry.
      upload(fileName, fileSize, atDaysAgo) {
        if (record.workflow.stageId !== 'sdp-instrument') throw new Error('Demo seed: the instrument can only be uploaded while the record is with the SDP.');
        record = { ...record, instrument: { fileName, fileSize, uploadedAt: clock.at(atDaysAgo, 11) } };
        return api;
      },
      // saveFisaValidationForm() with the checklist: Yes on every line of the first
      // `sectionCount` sections unless overridden. Comments are optional on FISA.
      checklist(asdId, sectionCount, overrides) {
        assertAllocatedAsdIsWorking(asdId);
        const sections = buildFisaInstrumentValidationChecklist();
        const onlySectionIds = sectionCount === 'all' ? undefined : sections.slice(0, sectionCount).map((s) => s.id);
        record = { ...record, checklist: answerChecklist(sections, '', { onlySectionIds, overrides }) };
        return api;
      },
      // saveFisaValidationForm() with the header, section 2, findings and sign-off; ticking
      // "Signed" dates the signature.
      form(asdId, patch, signedDaysAgo) {
        assertAllocatedAsdIsWorking(asdId);
        const current = fisaValidationFormOf(record);
        const signOff = { ...current.signOff, ...patch.signOff };
        if (patch.signOff?.signed !== undefined) {
          if (patch.signOff.signed && signedDaysAgo === undefined) throw new Error('Demo seed: a signature needs a date.');
          signOff.date = patch.signOff.signed && signedDaysAgo !== undefined ? clock.at(signedDaysAgo, 12) : null;
        }
        record = {
          ...record,
          reportHeader: { ...current.header, ...patch.reportHeader },
          section2Comment: patch.section2Comment ?? current.section2Comment,
          findings: patch.findings ?? current.findings,
          signOff,
        };
        return api;
      },
      // performFisaValidationAction().
      act(actionId, actorId, atDaysAgo, options = {}) {
        if (actionId === 'fval-submit' && !record.instrument) throw new Error('Demo seed: upload the instrument before notifying QCTO.');
        if (actionId === 'fval-allocate' && !options.allocatedAsdId) throw new Error('Demo seed: pick the ASD this validation is allocated to.');
        if (OUTCOME_ACTION_IDS.includes(actionId) && !isFisaValidationFormComplete(record)) {
          throw new Error('Demo seed: answer every checklist line, complete the findings and sign off before recording an outcome.');
        }
        const actor = seedPerson(actorId);
        const at = clock.at(atDaysAgo, 14);
        const workflow = step(log, {
          definition: FISA_VALIDATION_WORKFLOW,
          state: record.workflow,
          actionId,
          actor,
          at,
          recordType: 'fisa-instrument-validation',
          recordId: record.id,
          note: options.note,
        });
        record = { ...record, workflow };

        if (actionId === 'fval-allocate' && options.allocatedAsdId) {
          const asd = seedPerson(options.allocatedAsdId);
          if (asd.role !== 'ASD') throw new Error('Demo seed: the allocation target must be a named ASD.');
          record = { ...record, allocatedAsdId: asd.id, allocatedAsdName: asd.name };
          notify(log, at, {
            recipientRole: 'ASD',
            title: 'FISA Instrument Validation allocated',
            body: `"${record.skillsProgrammeTitle}" (${record.sdpName}) has been allocated to ${asd.name} for validation.`,
          });
        }

        if (OUTCOME_ACTION_IDS.includes(actionId)) {
          const decision: FisaValidationDecision =
            actionId === 'fval-approve' ? 'approved' : actionId === 'fval-approve-with-conditions' ? 'approved-with-conditions' : 'not-approved';
          record = {
            ...record,
            outcomeHistory: [...record.outcomeHistory, { cycle: record.cycleCount, decision, notes: options.note ?? '', decidedBy: actor.name, decidedAt: at }],
            reportHeader: { ...fisaValidationFormOf(record).header, evaluatorName: actor.name, dateCompleted: at },
          };
          if (decision === 'not-approved') {
            record = withNextCycleFisaValidationForm({ ...record, instrument: null, cycleCount: record.cycleCount + 1 });
            notify(log, at, { recipientRole: 'SDP', title: 'Changes required on your FISA instrument', body: `"${record.skillsProgrammeTitle}": ${options.note ?? ''}` });
          } else {
            record = { ...record, instrumentStatus: 'validated' };
            notify(log, at, {
              recipientRole: 'SDP',
              title: 'FISA Validation Report ready',
              body: `"${record.skillsProgrammeTitle}" is now ${decision === 'approved' ? 'Approved' : 'Approved with conditions'}.`,
            });
          }
        }
        return api;
      },
      done() {
        records.push(record);
      },
    };
    return api;
  }

  // F5 — Khanya: validated (Approved), every line Yes.
  start(KHANYA, 40)
    .upload('Khanya_Electrical_Installation_FISA_Instrument_v1.pdf', 2_097_152, 38)
    .act('fval-submit', KHANYA, 37)
    .act('fval-allocate', GRACE, 35, { allocatedAsdId: SIPHO })
    .checklist(SIPHO, 'all')
    .form(
      SIPHO,
      {
        reportHeader: { ...ELECTRICAL_HEADER, contactNumber: '031 555 0187', fisaDatePeriod: 'March 2027' },
        section2Comment: 'The instrument assesses every exit level outcome set in the FISA Standard.',
        findings: 'The instrument covers every exit level outcome of the standard and the marking guideline is clear. Recommended for use.',
        signOff: { fullNames: 'Sipho Ndlovu', designation: 'ASD', signed: true },
      },
      29,
    )
    .act('fval-approve', SIPHO, 28, { note: 'The instrument covers every exit-level outcome of the standard. Marking guidelines are clear.' })
    .done();

  // F4 — Lerato: not approved, returned to the SDP with the changes needed (cycle 2). The next
  // cycle starts on a blank checklist; the header details carry over.
  start(LERATO, 34)
    .upload('Lerato_Electrical_Installation_FISA_Instrument.pdf', 1_835_008, 32)
    .act('fval-submit', LERATO, 31)
    .act('fval-allocate', GRACE, 29, { allocatedAsdId: SIPHO })
    .checklist(SIPHO, 'all', {
      '1.2': { answer: 'no', comment: 'Fault-finding on a three-phase supply is not assessed.' },
      '1.7.2': { answer: 'no', comment: 'No pass mark is stated.' },
    })
    .form(
      SIPHO,
      {
        reportHeader: { ...ELECTRICAL_HEADER, contactNumber: '012 555 0119', passMark: '' },
        findings: 'The practical task does not assess fault-finding on a three-phase supply, and the rubric has no pass mark. Add both and resubmit.',
        signOff: { fullNames: 'Sipho Ndlovu', designation: 'ASD', signed: true },
      },
      22,
    )
    .act('fval-not-approved', SIPHO, 21, {
      note: 'The practical task does not assess fault-finding on a three-phase supply, and the rubric has no pass mark. Add both and resubmit.',
    })
    .done();

  // F3 — Thabo: allocated to Thandeka Zulu, validation under way (header partly done, sections 1
  // and 3 answered, no findings or sign-off yet).
  start(THABO, 22)
    .upload('Thabo_Electrical_Installation_FISA_Instrument.pdf', 2_359_296, 20)
    .act('fval-submit', THABO, 19)
    .act('fval-allocate', PETER, 15, { allocatedAsdId: THANDEKA })
    .checklist(THANDEKA, 2)
    .form(THANDEKA, { reportHeader: { contactNumber: '016 555 0163', totalMarks: '120', duration: '4 hours' } })
    .done();

  // F2 — Khanya: second instrument for the same standard, QCTO notified, awaiting allocation.
  start(KHANYA, 9)
    .upload('Khanya_Electrical_Installation_FISA_Instrument_v2_Practical.pdf', 1_572_864, 6)
    .act('fval-submit', KHANYA, 3)
    .done();

  // F1 — Thabo: second instrument, uploaded but QCTO not yet notified.
  start(THABO, 4).upload('Thabo_Electrical_Installation_FISA_Instrument_Written.pdf', 983_040, 2).done();

  // F6 — Lerato: second instrument, validated (Approved with conditions) with some "No" answers.
  start(LERATO, 30)
    .upload('Lerato_Electrical_Installation_FISA_Instrument_Written.pdf', 1_245_184, 27)
    .act('fval-submit', LERATO, 26)
    .act('fval-allocate', GRACE, 24, { allocatedAsdId: THANDEKA })
    .checklist(THANDEKA, 'all', {
      '3.2': { answer: 'no', comment: 'The wiring diagram in question 4 is too small to read.' },
      '5.4': { answer: 'no', comment: 'Pages 7 to 9 are not numbered.' },
      '5.8': { answer: 'no', comment: 'Section C needs more time than the 2 hours allocated.' },
    })
    .form(
      THANDEKA,
      {
        reportHeader: { ...ELECTRICAL_HEADER, contactNumber: '012 555 0119', fisaDatePeriod: 'February 2027', duration: '2 hours' },
        section2Comment: 'The exit level outcomes are covered; ELO 3 is covered by one question only.',
        findings:
          'The instrument is fit for use once the following are fixed: enlarge the wiring diagram in question 4, number pages 7 to 9, and either shorten Section C or allow 2.5 hours. Submit the corrected instrument with the next sitting request.',
        signOff: { fullNames: 'Thandeka Zulu', designation: 'ASD', signed: true },
      },
      18,
    )
    .act('fval-approve-with-conditions', THANDEKA, 17, {
      note: 'Enlarge the wiring diagram in question 4, number pages 7 to 9, and shorten Section C or allow 2.5 hours.',
    })
    .done();

  // Newest first, the order startFisaValidation() leaves the list in.
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
