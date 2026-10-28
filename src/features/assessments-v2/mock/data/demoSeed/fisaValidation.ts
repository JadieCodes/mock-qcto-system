// Demo seed — FISA Instrument Validation, item 1.11. Written in the same shape as fisa/api.ts
// (startFisaValidation, uploadFisaInstrument, saveFisaValidationChecklist,
// performFisaValidationAction), with the audit entries and notifications each step implies.
// Every record is against the approved "Electrical Installation Skills Programme" FISA Standard
// (mock/data/fisaStandardsSeed.ts). There are no FISA registrations (QCTO feedback 2.10).
// Days are "days ago".
//
//  #   SDP                        Allocated by / ASD               Stage
//  F1  Thabo Technical College    —                                Developing — instrument uploaded, SDP still to notify QCTO
//  F2  Khanya Skills Academy      —                                SDP notified QCTO — awaiting Assistant Director allocation
//  F3  Thabo Technical College    Riaan Pretorius → Thandeka Zulu  ASD validating (first two checklist sections done)
//  F4  Lerato Training Institute  Riaan Pretorius → Sipho Ndlovu   Outcome returned: Not approved — changes needed (cycle 2, SDP to fix and resubmit)
//  F5  Khanya Skills Academy      Lindiwe Khumalo → Sipho Ndlovu   Validated — Approved (FISA Validation Report ready)
//
// QCTO feedback 2.11 follow-up (Batch B): one standard can have several validations — every
// record here is for the same standard, and Khanya (F2, F5) and Thabo (F1, F3) have two each.
import { buildInstrumentValidationChecklist } from '../instrumentValidationChecklistItems';
import { seedFisaStandards } from '../fisaStandardsSeed';
import { isChecklistComplete } from '../../../shared/checklist/types';
import type { FisaValidationDecision, FisaValidationRecord } from '../../../modules/fisa/types';
import { FISA_VALIDATION_WORKFLOW } from '../../../modules/fisa/workflow';
import { answerChecklist, createClock, notify, seedId, seedPerson, step, type SeedLog } from './helpers';

const FISA_VALIDATION_ID_GROUP = 10;
const APPROVED_STANDARD_ID = 'seed-fisa-standard-approved';

const LINDIWE = 'lindiwe-khumalo';
const RIAAN = 'riaan-pretorius';
const SIPHO = 'sipho-ndlovu';
const THANDEKA = 'thandeka-zulu';
const KHANYA = 'sdp-khanya-skills-academy';
const THABO = 'sdp-thabo-technical-college';
const LERATO = 'sdp-lerato-training-institute';

const ASD_CHECKLIST_COMMENT = 'Checked against the approved FISA Standard — in order.';

const OUTCOME_ACTION_IDS = ['fval-approve', 'fval-approve-with-conditions', 'fval-not-approved'];

interface FisaValidationSeedBuilder {
  upload: (fileName: string, fileSize: number, atDaysAgo: number) => FisaValidationSeedBuilder;
  checklist: (asdId: string, sectionCount: number | 'all') => FisaValidationSeedBuilder;
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
    let record: FisaValidationRecord = {
      id: seedId(FISA_VALIDATION_ID_GROUP, ++n),
      fisaStandardId: standard!.id,
      skillsProgrammeTitle: standard!.skillsProgrammeTitle,
      sdpId: sdp.sdpId ?? sdp.id,
      sdpName: sdp.name,
      createdAt,
      createdBy: sdp.name,
      instrument: null,
      cycleCount: 1,
      checklist: buildInstrumentValidationChecklist(),
      allocatedAsdId: null,
      allocatedAsdName: null,
      workflow: { stageId: 'sdp-instrument' },
      outcomeHistory: [],
      instrumentStatus: 'not-validated',
    };

    const api: FisaValidationSeedBuilder = {
      // uploadFisaInstrument(): only while the record is with the SDP; no audit entry.
      upload(fileName, fileSize, atDaysAgo) {
        if (record.workflow.stageId !== 'sdp-instrument') throw new Error('Demo seed: the instrument can only be uploaded while the record is with the SDP.');
        record = { ...record, instrument: { fileName, fileSize, uploadedAt: clock.at(atDaysAgo, 11) } };
        return api;
      },
      // saveFisaValidationChecklist(): the allocated ASD's work on the checklist; no audit entry.
      checklist(asdId, sectionCount) {
        if (record.workflow.stageId !== 'asd-validation' || record.allocatedAsdId !== asdId) {
          throw new Error('Demo seed: only the allocated ASD fills in the checklist, during validation.');
        }
        const sections = buildInstrumentValidationChecklist();
        const onlySectionIds = sectionCount === 'all' ? undefined : sections.slice(0, sectionCount).map((s) => s.id);
        record = { ...record, checklist: answerChecklist(sections, ASD_CHECKLIST_COMMENT, { onlySectionIds }) };
        return api;
      },
      // performFisaValidationAction().
      act(actionId, actorId, atDaysAgo, options = {}) {
        if (actionId === 'fval-submit' && !record.instrument) throw new Error('Demo seed: upload the instrument before notifying QCTO.');
        if (actionId === 'fval-allocate' && !options.allocatedAsdId) throw new Error('Demo seed: pick the ASD this validation is allocated to.');
        if (OUTCOME_ACTION_IDS.includes(actionId) && !isChecklistComplete(record.checklist, true)) {
          throw new Error('Demo seed: every checklist line needs an answer and a comment before recording an outcome.');
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
          };
          if (decision === 'not-approved') {
            record = { ...record, instrument: null, cycleCount: record.cycleCount + 1, checklist: buildInstrumentValidationChecklist() };
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

  // F5 — Khanya: validated (Approved).
  start(KHANYA, 40)
    .upload('Khanya_Electrical_Installation_FISA_Instrument_v1.pdf', 2_097_152, 38)
    .act('fval-submit', KHANYA, 37)
    .act('fval-allocate', LINDIWE, 35, { allocatedAsdId: SIPHO })
    .checklist(SIPHO, 'all')
    .act('fval-approve', SIPHO, 28, { note: 'The instrument covers every exit-level outcome of the standard. Marking guidelines are clear.' })
    .done();

  // F4 — Lerato: not approved, returned to the SDP with the changes needed (cycle 2).
  start(LERATO, 34)
    .upload('Lerato_Electrical_Installation_FISA_Instrument.pdf', 1_835_008, 32)
    .act('fval-submit', LERATO, 31)
    .act('fval-allocate', RIAAN, 29, { allocatedAsdId: SIPHO })
    .checklist(SIPHO, 'all')
    .act('fval-not-approved', SIPHO, 21, {
      note: 'The practical task does not assess fault-finding on a three-phase supply, and the rubric has no pass mark. Add both and resubmit.',
    })
    .done();

  // F3 — Thabo: allocated to Thandeka Zulu, validation under way.
  start(THABO, 22)
    .upload('Thabo_Electrical_Installation_FISA_Instrument.pdf', 2_359_296, 20)
    .act('fval-submit', THABO, 19)
    .act('fval-allocate', RIAAN, 15, { allocatedAsdId: THANDEKA })
    .checklist(THANDEKA, 2)
    .done();

  // F2 — Khanya: second instrument for the same standard, QCTO notified, awaiting allocation.
  start(KHANYA, 9)
    .upload('Khanya_Electrical_Installation_FISA_Instrument_v2_Practical.pdf', 1_572_864, 6)
    .act('fval-submit', KHANYA, 3)
    .done();

  // F1 — Thabo: second instrument, uploaded but QCTO not yet notified.
  start(THABO, 4).upload('Thabo_Electrical_Installation_FISA_Instrument_Written.pdf', 983_040, 2).done();

  // Newest first, the order startFisaValidation() leaves the list in.
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
