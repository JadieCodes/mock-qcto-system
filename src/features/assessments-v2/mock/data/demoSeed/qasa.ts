// Demo seed — QAS Addendum (QASA), items 1.3 and 1.4. Twelve submissions, written in the same
// shape as qsa-addendum/api.ts (createApplication + the perform*Action functions), with the
// audit entries and QP notifications each stage implies. Letters are generated from the record
// state on screen, so they need no stored data. Days are "days ago".
//
//  #   Qualification                        QP                  Stage
//  01  Electrical Trades                    Nomvula Dlamini     Approved — approval letter sent to QP (eligible for EISA Instrument Validation)
//  02  Welding                              Precious Mahlangu   Approved — approval letter sent to QP (eligible)
//  03  Plumbing                             Johan van der Merwe Approved — approval letter sent to QP (eligible)
//  04  Gas Practitioner                     Johan van der Merwe Approved — approval letter drafted by ASD, awaiting DD signature
//  05  Millwright                           Nomvula Dlamini     IAC approved — outcome (feedback) letter awaiting CEO signature
//  06  Boilermaker                          Precious Mahlangu   Declined by IAC — outcome letter signed by the CEO
//  07  Rigger                               Precious Mahlangu   IAC decision pending (IAC still to upload the summary presentation)
//  08  Lift Mechanic                        Nomvula Dlamini     DD review (just sent by the ASD)
//  09  Drainlayer                           Johan van der Merwe Returned to the ASD by the DD, with the DD's comment
//  10  Electrical Line Mechanic             Nomvula Dlamini     Negative evaluation — corrections requested from the QP
//  11  Water and Wastewater Process Controller  Johan van der Merwe  Acknowledgement letter with the DD; ASD evaluation in progress
//  12  Metal Fabricator                     Precious Mahlangu   Just submitted, NOT registered with SAQA (QP uploaded the documents);
//                                                               acknowledgement letter with the ASD
//
// Pairings (09-visibility-matrix.md Section 3): Sipho Ndlovu (ASD) / Grace Mokoena (DD) for
// Nomvula's and Johan's qualifications; Thandeka Zulu (ASD) / Peter Botha (DD) for Precious's.
// Only 01–03 use the qualification names in mock/data/accreditedQualifications.ts, so they feed
// the EISA Calendar's sittings-per-year and EISA Instrument Validation. 05 (Millwright) is also
// in that list. The other titles are QASAs for qualifications that have no accredited SDPs yet.
import { buildDdReviewChecklist } from '../ddReviewChecklistItems';
import { buildQsaAddendumChecklist } from '../qsaChecklistItems';
import { ACK_WORKFLOW, APPROVAL_LETTER_WORKFLOW, EVAL_WORKFLOW, OUTCOME_WORKFLOW } from '../../../modules/qsa-addendum/workflow';
import type { QsaAddendumApplication, RequiredDocument } from '../../../modules/qsa-addendum/types';
import type { ChecklistSection } from '../../../shared/checklist/types';
import type { WorkflowDefinition } from '../../../shared/workflow/types';
import { answerChecklist, createClock, dateOf, notify, seedId, seedPerson, step, workingDateAgo, type SeedLog } from './helpers';

const QASA_ID_GROUP = 1;
export const QASA_SEED_IDS = {
  electricalTrades: seedId(QASA_ID_GROUP, 1),
  welding: seedId(QASA_ID_GROUP, 2),
  plumbing: seedId(QASA_ID_GROUP, 3),
} as const;

const EVAL_OK_COMMENT = 'Checked against the SAQA qualification document and curriculum — meets the requirement.';
const DD_OK_COMMENT = 'Agree with the ASD evaluation.';

const AUTO_DOCUMENTS: RequiredDocument[] = [
  { key: 'saqaQualificationDocument', label: 'SAQA Qualification Document', fileName: 'SAQA_Qualification_Document_AUTO.pdf', source: 'saqa-auto' },
  { key: 'curriculumDocument', label: 'Curriculum Document', fileName: 'Curriculum_Document_AUTO.pdf', source: 'saqa-auto' },
  { key: 'qsaAddendumDocument', label: 'QASA', fileName: 'QASA_AUTO.pdf', source: 'saqa-auto' },
];

type Sub = 'ack' | 'eval' | 'outcome' | 'approval';

const SUB_FLOWS: Record<Sub, { definition: WorkflowDefinition; recordType: string }> = {
  ack: { definition: ACK_WORKFLOW, recordType: 'qsa-addendum-acknowledgement' },
  eval: { definition: EVAL_WORKFLOW, recordType: 'qsa-addendum-evaluation' },
  outcome: { definition: OUTCOME_WORKFLOW, recordType: 'qsa-addendum-outcome-letter' },
  approval: { definition: APPROVAL_LETTER_WORKFLOW, recordType: 'qsa-addendum-approval-letter' },
};

interface SubmissionSpec {
  n: number;
  qpId: string;
  qualificationTitle: string;
  saqaId: string;
  registeredYearsAgo: number;
  nqfLevel: string;
  credits: string;
  submittedDaysAgo: number;
  notes?: string;
  notRegisteredWithSaqa?: boolean;
}

type ChecklistOverrides = Record<string, { answer: 'yes' | 'no'; comment: string }>;

interface QasaBuilder {
  app: () => QsaAddendumApplication;
  act: (sub: Sub, actionId: string, actorId: string, daysAgo: number, note?: string) => QasaBuilder;
  patch: (fields: Partial<QsaAddendumApplication>) => QasaBuilder;
  acknowledge: (asdId: string, ddId: string, daysAgo: number) => QasaBuilder;
  completeEvaluation: (findings: string, sittingsPerYear: number, overrides?: ChecklistOverrides) => QasaBuilder;
  toIacDecision: (asdId: string, ddId: string, evalDaysAgo: number, ddDaysAgo: number, findings: string, sittingsPerYear: number) => QasaBuilder;
  iacPresentation: () => QasaBuilder;
  approvalLetterSent: (ceoId: string, asdId: string, ddId: string, ceoDaysAgo: number, letterNotes: string) => QasaBuilder;
}

// One QASA moved through its four sub-flows, the way qsa-addendum/api.ts would:
// createApplication(), then perform{Ack,Evaluation,Outcome,ApprovalLetter}Action().
function qasaBuilder(log: SeedLog, spec: SubmissionSpec): QasaBuilder {
  const clock = createClock();
  const qp = seedPerson(spec.qpId);
  const submittedAt = clock.at(spec.submittedDaysAgo, 8);
  const slug = spec.qualificationTitle.replace(/\s+/g, '_');

  let app: QsaAddendumApplication = {
    id: seedId(QASA_ID_GROUP, spec.n),
    qpId: qp.qpId ?? qp.id,
    qpName: qp.name,
    qualificationTitle: spec.qualificationTitle,
    saqaId: spec.saqaId,
    dateRegisteredWithSaqa: spec.notRegisteredWithSaqa ? dateOf(submittedAt) : workingDateAgo(spec.registeredYearsAgo * 365),
    nqfLevel: spec.nqfLevel,
    credits: spec.credits,
    submissionDate: dateOf(submittedAt),
    notes: spec.notes ?? '',
    saqaGateOutcome: spec.notRegisteredWithSaqa ? 'not-registered' : 'registered',
    // CR-004: not registered → the QP uploads the three documents; registered → auto-pulled.
    documents: spec.notRegisteredWithSaqa
      ? [
          { key: 'saqaQualificationDocument', label: 'SAQA Qualification Document', fileName: `${slug}_Qualification_Document.pdf`, source: 'qp-upload' },
          { key: 'curriculumDocument', label: 'Curriculum Document', fileName: `${slug}_Curriculum.pdf`, source: 'qp-upload' },
          { key: 'qsaAddendumDocument', label: 'QASA', fileName: `${slug}_QASA_v1.docx`, source: 'qp-upload' },
        ]
      : AUTO_DOCUMENTS,
    ackState: { stageId: 'asd-preview' },
    evalState: { stageId: 'asd-evaluation' },
    outcomeState: { stageId: 'ceo-signature' },
    approvalState: null,
    approvalLetterDraft: null,
    approvalLetterSignedBy: null,
    qsaChecklist: buildQsaAddendumChecklist(),
    ddReviewChecklist: buildDdReviewChecklist(),
    evaluationReport: { findings: '', recommendation: '', approvedEisaSittingsPerYear: null },
    iacPresentationFileName: null,
  };

  function stateOf(sub: Sub) {
    if (sub === 'ack') return app.ackState;
    if (sub === 'eval') return app.evalState;
    if (sub === 'outcome') return app.outcomeState;
    if (!app.approvalState) throw new Error('Demo seed: approval letter not started.');
    return app.approvalState;
  }

  const builder: QasaBuilder = {
    app: () => app,

    // Same state changes and notifications as qsa-addendum/api.ts for each sub-flow.
    act(sub, actionId, actorId, daysAgo, note) {
      const at = clock.at(daysAgo);
      const { definition, recordType } = SUB_FLOWS[sub];
      const next = step(log, { definition, state: stateOf(sub), actionId, actor: seedPerson(actorId), at, recordType, recordId: app.id, note });
      const title = app.qualificationTitle;

      if (sub === 'ack') {
        app = { ...app, ackState: next };
        if (next.stageId === 'acknowledged') {
          notify(log, at, { recipientRole: 'QP', title: 'Acknowledgement letter ready', body: `Your acknowledgement letter for "${title}" is ready to view.` });
        }
      } else if (sub === 'eval') {
        app = { ...app, evalState: next };
        if (next.stageId === 'qp-corrections') {
          notify(log, at, {
            recipientRole: 'QP',
            title: 'Negative evaluation outcome — corrections needed',
            body: note
              ? `The evaluation of "${title}" was negative. ASD notes: ${note}`
              : `The evaluation of "${title}" was negative. See the evaluation report for details and correct and resubmit.`,
          });
        }
        if (next.stageId === 'approved' || next.stageId === 'declined') {
          notify(log, at, {
            recipientRole: 'QP',
            title: 'QASA decision reached',
            body: `The IAC has reached a decision on "${title}". The feedback letter is being prepared.`,
          });
        }
      } else if (sub === 'outcome') {
        app = { ...app, outcomeState: next };
        if (next.stageId === 'signed' && app.evalState.stageId === 'approved' && !app.approvalState) {
          app = { ...app, approvalState: { stageId: 'asd-draft' }, approvalLetterDraft: { notes: '' } };
        }
        if (next.stageId === 'signed') {
          notify(log, at, { recipientRole: 'QP', title: 'Feedback letter signed', body: `The feedback letter for "${title}" has been signed and is ready to view.` });
        }
      } else {
        app = { ...app, approvalState: next };
        if (actionId === 'approval-sign') app = { ...app, approvalLetterSignedBy: next.submittedBy ?? null };
        if (next.stageId === 'sent-to-qp') {
          notify(log, at, {
            recipientRole: 'QP',
            title: 'Approval letter sent',
            body: `The signed approval letter for "${title}" has been sent to you. It is now approved and available to EISA Instrument Validation and the EISA Calendar.`,
          });
        }
      }
      return builder;
    },

    patch(fields) {
      app = { ...app, ...fields };
      return builder;
    },

    acknowledge(asdId, ddId, daysAgo) {
      return builder.act('ack', 'ack-send-to-dd', asdId, daysAgo).act('ack', 'ack-acknowledge', ddId, daysAgo - 1);
    },

    // Every line answered with a comment, the report written and the approved EISA sittings
    // per year recorded — the guards in qsa-addendum/api.ts performEvaluationAction().
    completeEvaluation(findings, sittingsPerYear, overrides) {
      const negative = overrides ? Object.values(overrides).some((o) => o.answer === 'no') : false;
      return builder.patch({
        qsaChecklist: answerChecklist(buildQsaAddendumChecklist(), EVAL_OK_COMMENT, { overrides }),
        evaluationReport: { findings, recommendation: negative ? 'not-recommended' : 'recommended', approvedEisaSittingsPerYear: sittingsPerYear },
      });
    },

    // ASD → DD → IAC, with the DD checklist complete.
    toIacDecision(asdId, ddId, evalDaysAgo, ddDaysAgo, findings, sittingsPerYear) {
      return builder
        .completeEvaluation(findings, sittingsPerYear)
        .act('eval', 'eval-send-to-dd', asdId, evalDaysAgo)
        .patch({ ddReviewChecklist: answerChecklist(buildDdReviewChecklist(), DD_OK_COMMENT) })
        .act('eval', 'eval-dd-send-to-iac', ddId, ddDaysAgo);
    },

    iacPresentation() {
      return builder.patch({ iacPresentationFileName: `${slug}_QASA_IAC_Summary.pptx` });
    },

    // Outcome letter signed by the CEO, then the approval letter: ASD drafts → DD signs → ASD sends.
    approvalLetterSent(ceoId, asdId, ddId, ceoDaysAgo, letterNotes) {
      return builder
        .act('outcome', 'outcome-sign', ceoId, ceoDaysAgo)
        .patch({ approvalLetterDraft: { notes: letterNotes } })
        .act('approval', 'approval-submit-to-dd', asdId, ceoDaysAgo - 2)
        .act('approval', 'approval-sign', ddId, ceoDaysAgo - 3)
        .act('approval', 'approval-send-to-qp', asdId, ceoDaysAgo - 4);
    },
  };
  return builder;
}

const NOMVULA = 'qp-nomvula-dlamini';
const JOHAN = 'qp-johan-van-der-merwe';
const PRECIOUS = 'qp-precious-mahlangu';
const SIPHO = 'sipho-ndlovu';
const THANDEKA = 'thandeka-zulu';
const GRACE = 'grace-mokoena';
const PETER = 'peter-botha';
const THABISO = 'thabiso-molefe';
const PALESA = 'palesa-nkosi';
const ANGELA = 'angela-fourie';
const DAVID = 'david-molewa';

function letterNotes(sittingsPerYear: number): string {
  return `Approved EISA frequency: ${sittingsPerYear} sitting(s) per year. Please propose the EISA dates on the EISA Calendar and book the instrument validation with the ASD.`;
}

export function seedQasaSubmissions(log: SeedLog): QsaAddendumApplication[] {
  const b = (spec: SubmissionSpec) => qasaBuilder(log, spec);

  const electrical = b({ n: 1, qpId: NOMVULA, qualificationTitle: 'Electrical Trades', saqaId: '91761', registeredYearsAgo: 6, nqfLevel: 'Level 4', credits: '360', submittedDaysAgo: 160 })
    .acknowledge(SIPHO, GRACE, 158)
    .toIacDecision(SIPHO, GRACE, 140, 133, 'All 44 lines met. The assessment model (written and practical) matches the external assessment specifications and the component weightings add up to 100%.', 3)
    .iacPresentation()
    .act('eval', 'eval-iac-approve', THABISO, 120)
    .approvalLetterSent(ANGELA, SIPHO, GRACE, 115, letterNotes(3));

  const welding = b({ n: 2, qpId: PRECIOUS, qualificationTitle: 'Welding', saqaId: '91845', registeredYearsAgo: 5, nqfLevel: 'Level 4', credits: '360', submittedDaysAgo: 150 })
    .acknowledge(THANDEKA, PETER, 148)
    .toIacDecision(THANDEKA, PETER, 128, 121, 'Meets every requirement. Practical tasks are clearly mapped to the exit level outcomes and the marking guidelines are complete.', 2)
    .iacPresentation()
    .act('eval', 'eval-iac-approve', PALESA, 108)
    .approvalLetterSent(DAVID, THANDEKA, PETER, 104, letterNotes(2));

  const plumbing = b({ n: 3, qpId: JOHAN, qualificationTitle: 'Plumbing', saqaId: '91802', registeredYearsAgo: 6, nqfLevel: 'Level 4', credits: '360', submittedDaysAgo: 130 })
    .acknowledge(SIPHO, GRACE, 128)
    .toIacDecision(SIPHO, GRACE, 105, 97, 'Meets every requirement. Security and distribution arrangements for the EISA are clearly described.', 2)
    .iacPresentation()
    .act('eval', 'eval-iac-approve', THABISO, 85)
    .approvalLetterSent(ANGELA, SIPHO, GRACE, 80, letterNotes(2));

  const gas = b({ n: 4, qpId: JOHAN, qualificationTitle: 'Gas Practitioner', saqaId: '101941', registeredYearsAgo: 3, nqfLevel: 'Level 4', credits: '240', submittedDaysAgo: 110 })
    .acknowledge(SIPHO, GRACE, 108)
    .toIacDecision(SIPHO, GRACE, 62, 50, 'Meets every requirement. The safety-critical practical tasks carry the required minimum weighting.', 2)
    .iacPresentation()
    .act('eval', 'eval-iac-approve', THABISO, 30)
    .act('outcome', 'outcome-sign', DAVID, 24)
    .patch({ approvalLetterDraft: { notes: letterNotes(2) } })
    .act('approval', 'approval-submit-to-dd', SIPHO, 4);

  // Item 1.4: IAC has approved — the outcome (feedback) letter now waits for the CEO.
  const millwright = b({ n: 5, qpId: NOMVULA, qualificationTitle: 'Millwright', saqaId: '91890', registeredYearsAgo: 4, nqfLevel: 'Level 4', credits: '360', submittedDaysAgo: 75 })
    .acknowledge(SIPHO, GRACE, 73)
    .toIacDecision(SIPHO, GRACE, 40, 30, 'Meets every requirement. Mechanical and electrical components are both covered in the practical EISA.', 2)
    .iacPresentation()
    .act('eval', 'eval-iac-approve', PALESA, 6);

  const boilermaker = b({ n: 6, qpId: PRECIOUS, qualificationTitle: 'Boilermaker', saqaId: '91786', registeredYearsAgo: 5, nqfLevel: 'Level 4', credits: '360', submittedDaysAgo: 120 })
    .acknowledge(THANDEKA, PETER, 118)
    .toIacDecision(THANDEKA, PETER, 70, 60, 'All lines met on paper; the ASD flagged the practical weighting for the IAC to consider.', 2)
    .iacPresentation()
    .act(
      'eval',
      'eval-iac-decline',
      THABISO,
      45,
      'The practical component carries 30% of the final mark, but the curriculum requires the practical to carry at least 60%. The QP may develop a revised QASA and submit it again.',
    )
    .act('outcome', 'outcome-sign', ANGELA, 41);

  // IAC decision pending: the IAC member still has to upload the summary presentation, then decide.
  const rigger = b({ n: 7, qpId: PRECIOUS, qualificationTitle: 'Rigger', saqaId: '98987', registeredYearsAgo: 3, nqfLevel: 'Level 3', credits: '180', submittedDaysAgo: 70 })
    .acknowledge(THANDEKA, PETER, 68)
    .toIacDecision(THANDEKA, PETER, 25, 14, 'Meets every requirement. Load-calculation tasks are well moderated.', 2);

  const liftMechanic = b({ n: 8, qpId: NOMVULA, qualificationTitle: 'Lift Mechanic', saqaId: '91821', registeredYearsAgo: 4, nqfLevel: 'Level 4', credits: '360', submittedDaysAgo: 45 })
    .acknowledge(SIPHO, GRACE, 43)
    .completeEvaluation('All 44 lines met. The EISA covers both installation and maintenance tasks as the curriculum requires.', 2)
    .act('eval', 'eval-send-to-dd', SIPHO, 3);

  // DD returned it to the ASD with a comment; the DD's part-done checklist stays visible to the ASD.
  const ddChecklist: ChecklistSection[] = buildDdReviewChecklist().map((section) => ({
    ...section,
    items: section.items.map((item) =>
      item.id === 'dd.1'
        ? { ...item, answer: 'yes' as const, comment: 'Report is clear.' }
        : item.id === 'dd.2'
          ? { ...item, answer: 'no' as const, comment: 'Lines 1.3.2 and 1.3.4 have one-word comments — not enough to show how they were checked.' }
          : item,
    ),
  }));
  const drainlayer = b({ n: 9, qpId: JOHAN, qualificationTitle: 'Drainlayer', saqaId: '93626', registeredYearsAgo: 4, nqfLevel: 'Level 3', credits: '240', submittedDaysAgo: 60 })
    .acknowledge(SIPHO, GRACE, 58)
    .completeEvaluation('All lines met.', 2)
    .act('eval', 'eval-send-to-dd', SIPHO, 20)
    .patch({ ddReviewChecklist: ddChecklist })
    .act(
      'eval',
      'eval-dd-return-to-asd',
      GRACE,
      10,
      'Please expand the comments on lines 1.3.2 and 1.3.4: say how the component weightings were checked against the curriculum, and confirm the weighting of the practical component.',
    );

  // Negative automatic outcome (one mandatory line answered "No") — back to the QP to correct.
  const lineMechanic = b({ n: 10, qpId: NOMVULA, qualificationTitle: 'Electrical Line Mechanic', saqaId: '99653', registeredYearsAgo: 3, nqfLevel: 'Level 4', credits: '360', submittedDaysAgo: 35 })
    .acknowledge(SIPHO, GRACE, 33)
    .completeEvaluation('One mandatory line not met: the exit level outcomes in the QASA do not match the SAQA qualification document.', 2, {
      '1.2.1': { answer: 'no', comment: 'ELO 3 (live-line work) is missing from the QASA table.' },
    })
    .act('eval', 'eval-return-to-qp', SIPHO, 9, 'Add ELO 3 (live-line work) to the qualification outcomes table and show which EISA component assesses it.');

  // Acknowledgement letter with the DD while the ASD works through the checklist.
  const waterProcess = b({ n: 11, qpId: JOHAN, qualificationTitle: 'Water and Wastewater Process Controller', saqaId: '99509', registeredYearsAgo: 2, nqfLevel: 'Level 4', credits: '240', submittedDaysAgo: 12 })
    .act('ack', 'ack-send-to-dd', SIPHO, 9)
    .patch({ qsaChecklist: answerChecklist(buildQsaAddendumChecklist(), EVAL_OK_COMMENT, { onlySectionIds: ['1.1', '1.2'] }) });

  const metalFabricator = b({
    n: 12,
    qpId: PRECIOUS,
    qualificationTitle: 'Metal Fabricator',
    saqaId: 'Pending',
    registeredYearsAgo: 0,
    nqfLevel: 'Level 3',
    credits: '240',
    submittedDaysAgo: 2,
    notes: 'This qualification is not yet registered with SAQA, so the three documents are attached.',
    notRegisteredWithSaqa: true,
  });

  // Newest first, the same order createApplication() leaves the list in.
  return [
    electrical, welding, plumbing, gas, millwright, boilermaker, rigger, liftMechanic, drainlayer, lineMechanic, waterProcess, metalFabricator,
  ]
    .map((builder) => builder.app())
    .sort((x, y) => y.submissionDate.localeCompare(x.submissionDate));
}
