// Demo seed — QAS Addendum (QASA), items 1.3, 1.4, 2.1 and Batch K. Thirteen submissions, written in the
// same shape as qsa-addendum/api.ts (createApplication + the perform*Action functions), with the
// audit entries and QP notifications each stage implies. Letters are generated from the record
// state on screen, so they need no stored data. Days are "days ago".
//
//  #   Qualification                        QP                  Stage
//  01  Electrical Trades                    Nomvula Dlamini     Approved — feedback letter signed by the CEO (eligible for EISA Instrument Validation)
//  02  Welding                              Precious Mahlangu   Approved (eligible)
//  03  Plumbing                             Johan van der Merwe Approved — under review: the DD started a review, back at ASD evaluation (still eligible)
//  04  Gas Practitioner                     Johan van der Merwe Approved (on demand)
//  05  Millwright                           Nomvula Dlamini     IAC approved — feedback letter awaiting CEO signature
//  06  Boilermaker                          Precious Mahlangu   IAC requested remediation — back with the QP
//  07  Rigger                               Precious Mahlangu   Approved for tabling by the Director Office — DD still to record the IAC outcome
//  08  Lift Mechanic                        Nomvula Dlamini     DD review (just sent by the ASD)
//  09  Drainlayer                           Johan van der Merwe Returned to the ASD by the DD, with the DD's comment
//  10  Electrical Line Mechanic             Nomvula Dlamini     Negative evaluation — corrections requested from the QP
//  11  Water and Wastewater Process Controller  Johan van der Merwe  ASD evaluation in progress
//  12  Metal Fabricator                     Precious Mahlangu   Just submitted, NOT registered with SAQA (QP uploaded the documents)
//  13  Refrigeration and Air Conditioning Mechanic  Johan van der Merwe  With the Director Office for quality assurance
//
// QCTO feedback 2.1: every QASA that reached the IAC went ASD → DD → Director Office (approve for
// tabling) → the DD records the IAC outcome. The Director Office is Elsabe Steyn or Johannes Pretorius.
//
// QCTO feedback 3.3: the five IAC-approved QASAs (01–05) carry assessment components; Gas
// Practitioner (04) sits on demand. When the CEO signs the feedback letter on an approved QASA
// (01–04), "Certification notified of the assessment details" is recorded.
//
// Batch K (QCTO 5 Nov review): every acknowledgement letter is issued on submission (05.5); no
// QASA is declined (05.7) and there is no approval letter (05.6) — the CEO's signature on the
// feedback letter is the approval.
//
// Pairings (09-visibility-matrix.md Section 3): Sipho Ndlovu (ASD) / Grace Mokoena (DD) for
// Nomvula's and Johan's qualifications; Thandeka Zulu (ASD) / Peter Botha (DD) for Precious's.
// Only 01–03 use the qualification names in mock/data/accreditedQualifications.ts, so they feed
// the EISA Calendar's sittings-per-year and EISA Instrument Validation. 05 (Millwright) is also
// in that list. The other titles are QASAs for qualifications that have no accredited SDPs yet.
import { buildDdReviewChecklist } from '../ddReviewChecklistItems';
import { buildQsaAddendumChecklist } from '../qsaChecklistItems';
import { ACK_ISSUED_LABEL } from '../../../modules/qsa-addendum/api';
import { buildCertificationHandoff, CERTIFICATION_NOTIFIED_LABEL } from '../../../modules/qsa-addendum/assessmentDetails';
import { REVIEW_COMPLETED_LABEL, withReviewStarted } from '../../../modules/qsa-addendum/review';
import { EVAL_WORKFLOW, isQasaUnderReview, OUTCOME_WORKFLOW } from '../../../modules/qsa-addendum/workflow';
import type { AssessmentComponentType, QsaAddendumApplication, RequiredDocument } from '../../../modules/qsa-addendum/types';
import type { ChecklistSection } from '../../../shared/checklist/types';
import type { WorkflowDefinition } from '../../../shared/workflow/types';
import { answerChecklist, audit, createClock, dateOf, notify, seedId, seedPerson, step, workingDateAgo, type SeedLog } from './helpers';

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

type Sub = 'eval' | 'outcome';

const SUB_FLOWS: Record<Sub, { definition: WorkflowDefinition; recordType: string }> = {
  eval: { definition: EVAL_WORKFLOW, recordType: 'qsa-addendum-evaluation' },
  outcome: { definition: OUTCOME_WORKFLOW, recordType: 'qsa-addendum-outcome-letter' },
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

// [name, type, weighting %, days]
type ComponentSpec = [string, AssessmentComponentType, number, number];

type ChecklistOverrides = Record<string, { answer: 'yes' | 'no'; comment: string }>;

interface QasaBuilder {
  app: () => QsaAddendumApplication;
  act: (sub: Sub, actionId: string, actorId: string, daysAgo: number, note?: string) => QasaBuilder;
  patch: (fields: Partial<QsaAddendumApplication>) => QasaBuilder;
  completeEvaluation: (findings: string, sittingsPerYear: number, overrides?: ChecklistOverrides) => QasaBuilder;
  toDirectorOffice: (asdId: string, ddId: string, evalDaysAgo: number, ddDaysAgo: number, findings: string, sittingsPerYear: number) => QasaBuilder;
  toIacDecision: (asdId: string, ddId: string, doId: string, evalDaysAgo: number, ddDaysAgo: number, findings: string, sittingsPerYear: number) => QasaBuilder;
  iacPresentation: () => QasaBuilder;
  recordIacOutcome: (actionId: 'eval-iac-approve' | 'eval-iac-remediation', ddId: string, daysAgo: number, note?: string) => QasaBuilder;
  assessmentDetails: (components: ComponentSpec[], options?: { onDemand?: boolean }) => QasaBuilder;
  signFeedbackLetter: (ceoId: string, daysAgo: number) => QasaBuilder;
  startReview: (ddId: string, daysAgo: number, reason: string) => QasaBuilder;
}

// One QASA moved through its two sub-flows, the way qsa-addendum/api.ts would:
// createApplication() (which issues the acknowledgement letter), then
// perform{Evaluation,Outcome}Action().
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
    acknowledgementIssuedAt: submittedAt,
    evalState: { stageId: 'asd-evaluation' },
    outcomeState: { stageId: 'ceo-signature' },
    review: null,
    qsaChecklist: buildQsaAddendumChecklist(),
    ddReviewChecklist: buildDdReviewChecklist(),
    evaluationReport: { findings: '', recommendation: '', approvedEisaSittingsPerYear: null },
    iacPresentationFileName: null,
    iacMinutesFile: null,
  };

  // QCTO feedback 05.5: createApplication() issues the acknowledgement letter on submission.
  audit(log, { recordType: 'qsa-addendum-acknowledgement', recordId: app.id, actor: qp, actorRole: 'QP', action: ACK_ISSUED_LABEL, timestamp: submittedAt });
  notify(log, submittedAt, {
    recipientRole: 'QP',
    title: 'Acknowledgement letter issued',
    body: `We received your QASA for "${spec.qualificationTitle}". Your acknowledgement letter is ready to view.`,
  });

  function stateOf(sub: Sub) {
    return sub === 'eval' ? app.evalState : app.outcomeState;
  }

  const builder: QasaBuilder = {
    app: () => app,

    // Same state changes and notifications as qsa-addendum/api.ts for each sub-flow.
    act(sub, actionId, actorId, daysAgo, note) {
      const at = clock.at(daysAgo);
      const { definition, recordType } = SUB_FLOWS[sub];
      const next = step(log, { definition, state: stateOf(sub), actionId, actor: seedPerson(actorId), at, recordType, recordId: app.id, note });
      const title = app.qualificationTitle;

      if (sub === 'eval') {
        app =
          actionId === 'eval-start-review'
            ? withReviewStarted(app, next, { startedAt: at, startedBy: seedPerson(actorId).name, startedById: actorId, reason: note ?? '' })
            : { ...app, evalState: next };
        if (actionId === 'eval-start-review') {
          notify(log, at, {
            recipientRole: 'QP',
            title: 'Approved QASA under review',
            body: `Your approved QASA for "${title}" is being reviewed. It stays approved while the review runs. Follow it on the Progress tab.`,
          });
          notify(log, at, {
            recipientRole: 'ASD',
            title: 'Approved QASA sent for review',
            body: `The Deputy Director started a review of the approved QASA for "${title}". It is back at ASD evaluation.`,
          });
        }
        if (next.stageId === 'qp-corrections') {
          notify(
            log,
            at,
            actionId === 'eval-iac-remediation'
              ? {
                  recipientRole: 'QP',
                  title: 'IAC requested remediation — corrections needed',
                  body: `The IAC requested remediation on "${title}". IAC comment: ${note ?? ''} Correct the QASA and resubmit it.`,
                }
              : {
                  recipientRole: 'QP',
                  title: 'Negative evaluation outcome — corrections needed',
                  body: note
                    ? `The evaluation of "${title}" was negative. ASD notes: ${note}`
                    : `The evaluation of "${title}" was negative. See the evaluation report for details and correct and resubmit.`,
                },
          );
        }
        if (actionId === 'eval-iac-approve') {
          notify(log, at, {
            recipientRole: 'QP',
            title: 'QASA decision reached',
            body: `The IAC has approved "${title}". The feedback letter is with the CEO for signature.`,
          });
        }
      } else {
        const wasUnderReview = isQasaUnderReview(app);
        app = { ...app, outcomeState: next };
        if (next.stageId === 'signed') {
          const ceo = seedPerson(actorId);
          app = { ...app, certificationHandoff: buildCertificationHandoff(app, at, ceo.name) };
          audit(log, { recordType, recordId: app.id, actor: ceo, action: CERTIFICATION_NOTIFIED_LABEL, timestamp: at });
          if (wasUnderReview) {
            app = { ...app, review: null };
            audit(log, { recordType, recordId: app.id, actor: ceo, action: REVIEW_COMPLETED_LABEL, timestamp: at });
          }
          notify(log, at, {
            recipientRole: 'QP',
            title: 'QASA approved — feedback letter signed',
            body: `The CEO has signed the feedback letter for "${title}". Your QASA is approved: the signed feedback letter is your approval. It is now available to EISA Instrument Validation and the EISA Calendar.`,
          });
        }
      }
      return builder;
    },

    patch(fields) {
      app = { ...app, ...fields };
      return builder;
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

    // ASD → DD → Director Office, with the DD checklist complete.
    toDirectorOffice(asdId, ddId, evalDaysAgo, ddDaysAgo, findings, sittingsPerYear) {
      return builder
        .completeEvaluation(findings, sittingsPerYear)
        .act('eval', 'eval-send-to-dd', asdId, evalDaysAgo)
        .patch({ ddReviewChecklist: answerChecklist(buildDdReviewChecklist(), DD_OK_COMMENT) })
        .act('eval', 'eval-dd-send-to-director-office', ddId, ddDaysAgo);
    },

    // ... then the Director Office approves it for tabling at the IAC, three days later.
    toIacDecision(asdId, ddId, doId, evalDaysAgo, ddDaysAgo, findings, sittingsPerYear) {
      return builder
        .toDirectorOffice(asdId, ddId, evalDaysAgo, ddDaysAgo, findings, sittingsPerYear)
        .act('eval', 'eval-do-approve-for-tabling', doId, ddDaysAgo - 3);
    },

    iacPresentation() {
      return builder.patch({ iacPresentationFileName: `${slug}_QASA_IAC_Summary.pptx` });
    },

    // The DD records the IAC outcome after the meeting, with the committee minutes attached.
    recordIacOutcome(actionId, ddId, daysAgo, note) {
      builder.patch({
        iacMinutesFile: {
          fileName: `IAC_Minutes_${slug}.pdf`,
          fileSize: 184_320,
          fileType: 'application/pdf',
          uploadedAt: clock.at(daysAgo, 8),
          uploadedBy: seedPerson(ddId).name,
        },
      });
      return builder.act('eval', actionId, ddId, daysAgo, note);
    },

    // QCTO feedback 3.3: the ASD's optional assessment details (weightings add up to 100%).
    assessmentDetails(components, options) {
      const total = components.reduce((sum, [, , weighting]) => sum + weighting, 0);
      if (total !== 100) throw new Error(`Demo seed: "${app.qualificationTitle}" component weightings add up to ${total}%.`);
      builder.patch({
        assessmentComponents: components.map(([name, type, weightingPercent, days], i) => ({
          id: seedId(QASA_ID_GROUP + 100, spec.n * 10 + i),
          name,
          type,
          weightingPercent,
          days,
        })),
      });
      if (options?.onDemand) {
        builder.patch({ evaluationReport: { ...app.evaluationReport, approvedEisaSittingsPerYear: null, eisaSittingsOnDemand: true } });
      }
      return builder;
    },

    // QCTO feedback 05.6: the CEO's signature on the feedback letter is the approval.
    signFeedbackLetter(ceoId, daysAgo) {
      return builder.act('outcome', 'outcome-sign', ceoId, daysAgo);
    },

    // QCTO feedback 05.2: the DD starts a review of an approved QASA, with a reason.
    startReview(ddId, daysAgo, reason) {
      return builder.act('eval', 'eval-start-review', ddId, daysAgo, reason);
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
const ANGELA = 'angela-fourie';
const DAVID = 'david-molewa';
const ELSABE = 'elsabe-steyn';
const JOHANNES = 'johannes-pretorius';

export function seedQasaSubmissions(log: SeedLog): QsaAddendumApplication[] {
  const b = (spec: SubmissionSpec) => qasaBuilder(log, spec);

  const electrical = b({ n: 1, qpId: NOMVULA, qualificationTitle: 'Electrical Trades', saqaId: '91761', registeredYearsAgo: 6, nqfLevel: 'Level 4', credits: '360', submittedDaysAgo: 160 })
    .toIacDecision(SIPHO, GRACE, ELSABE, 140, 133, 'All 44 lines met. The assessment model (written and practical) matches the external assessment specifications and the component weightings add up to 100%.', 3)
    .assessmentDetails([['Knowledge assessment', 'written', 60, 1], ['Practical assessment', 'practical', 40, 1]])
    .iacPresentation()
    .recordIacOutcome('eval-iac-approve', GRACE, 120)
    .signFeedbackLetter(ANGELA, 115);

  const welding = b({ n: 2, qpId: PRECIOUS, qualificationTitle: 'Welding', saqaId: '91845', registeredYearsAgo: 5, nqfLevel: 'Level 4', credits: '360', submittedDaysAgo: 150 })
    .toIacDecision(THANDEKA, PETER, JOHANNES, 128, 121, 'Meets every requirement. Practical tasks are clearly mapped to the exit level outcomes and the marking guidelines are complete.', 2)
    .assessmentDetails([['Knowledge assessment', 'written', 30, 1], ['Welding practical tasks', 'practical', 70, 2]])
    .iacPresentation()
    .recordIacOutcome('eval-iac-approve', PETER, 108)
    .signFeedbackLetter(DAVID, 104);

  // QCTO feedback 05.2: approved, then the DD started a review. It stays approved for EISA
  // Instrument Validation and the EISA Calendar while it goes through the route again.
  const plumbing = b({ n: 3, qpId: JOHAN, qualificationTitle: 'Plumbing', saqaId: '91802', registeredYearsAgo: 6, nqfLevel: 'Level 4', credits: '360', submittedDaysAgo: 130 })
    .toIacDecision(SIPHO, GRACE, JOHANNES, 105, 97, 'Meets every requirement. Security and distribution arrangements for the EISA are clearly described.', 2)
    .assessmentDetails([['Knowledge assessment', 'written', 40, 1], ['Installation and repair practical', 'practical', 60, 2]])
    .iacPresentation()
    .recordIacOutcome('eval-iac-approve', GRACE, 85)
    .signFeedbackLetter(ANGELA, 80)
    .startReview(
      GRACE,
      6,
      'The QP has told us the gas installation tasks in the practical will move to a separate part qualification. Review whether the practical component and its weighting still match the curriculum.',
    );

  const gas = b({ n: 4, qpId: JOHAN, qualificationTitle: 'Gas Practitioner', saqaId: '101941', registeredYearsAgo: 3, nqfLevel: 'Level 4', credits: '240', submittedDaysAgo: 110 })
    .toIacDecision(SIPHO, GRACE, ELSABE, 62, 50, 'Meets every requirement. The safety-critical practical tasks carry the required minimum weighting.', 2)
    .assessmentDetails([['Knowledge assessment', 'written', 40, 1], ['Safety-critical practical tasks', 'practical', 60, 1]], { onDemand: true })
    .iacPresentation()
    .recordIacOutcome('eval-iac-approve', GRACE, 30)
    .signFeedbackLetter(DAVID, 24);

  // Item 1.4: IAC has approved — the outcome (feedback) letter now waits for the CEO.
  const millwright = b({ n: 5, qpId: NOMVULA, qualificationTitle: 'Millwright', saqaId: '91890', registeredYearsAgo: 4, nqfLevel: 'Level 4', credits: '360', submittedDaysAgo: 75 })
    .toIacDecision(SIPHO, GRACE, ELSABE, 40, 30, 'Meets every requirement. Mechanical and electrical components are both covered in the practical EISA.', 2)
    .assessmentDetails([['Knowledge assessment', 'written', 50, 1], ['Mechanical and electrical practical', 'practical', 50, 2]])
    .iacPresentation()
    .recordIacOutcome('eval-iac-approve', GRACE, 6);

  // QCTO feedback 05.7: a QASA is never declined — the IAC sent this one back for remediation.
  const boilermaker = b({ n: 6, qpId: PRECIOUS, qualificationTitle: 'Boilermaker', saqaId: '91786', registeredYearsAgo: 5, nqfLevel: 'Level 4', credits: '360', submittedDaysAgo: 120 })
    .toIacDecision(THANDEKA, PETER, JOHANNES, 70, 60, 'All lines met on paper; the ASD flagged the practical weighting for the IAC to consider.', 2)
    .iacPresentation()
    .recordIacOutcome(
      'eval-iac-remediation',
      PETER,
      45,
      'The practical component carries 30% of the final mark, but the curriculum requires the practical to carry at least 60%. Revise the weighting of the practical component and resubmit the QASA.',
    );

  // Approved for tabling: the DD presents at the IAC, then records the outcome (QCTO feedback 2.1).
  const rigger = b({ n: 7, qpId: PRECIOUS, qualificationTitle: 'Rigger', saqaId: '98987', registeredYearsAgo: 3, nqfLevel: 'Level 3', credits: '180', submittedDaysAgo: 70 })
    .toIacDecision(THANDEKA, PETER, ELSABE, 25, 14, 'Meets every requirement. Load-calculation tasks are well moderated.', 2)
    .iacPresentation();

  const liftMechanic = b({ n: 8, qpId: NOMVULA, qualificationTitle: 'Lift Mechanic', saqaId: '91821', registeredYearsAgo: 4, nqfLevel: 'Level 4', credits: '360', submittedDaysAgo: 45 })
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
    .completeEvaluation('One mandatory line not met: the exit level outcomes in the QASA do not match the SAQA qualification document.', 2, {
      '1.2.1': { answer: 'no', comment: 'ELO 3 (live-line work) is missing from the QASA table.' },
    })
    .act('eval', 'eval-return-to-qp', SIPHO, 9, 'Add ELO 3 (live-line work) to the qualification outcomes table and show which EISA component assesses it.');

  // The ASD is part-way through the checklist.
  const waterProcess = b({ n: 11, qpId: JOHAN, qualificationTitle: 'Water and Wastewater Process Controller', saqaId: '99509', registeredYearsAgo: 2, nqfLevel: 'Level 4', credits: '240', submittedDaysAgo: 12 })
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

  // QCTO feedback 2.1: moderated by the DD, now with the Director Office to approve for tabling.
  const refrigeration = b({ n: 13, qpId: JOHAN, qualificationTitle: 'Refrigeration and Air Conditioning Mechanic', saqaId: '91794', registeredYearsAgo: 4, nqfLevel: 'Level 4', credits: '360', submittedDaysAgo: 40 })
    .toDirectorOffice(SIPHO, GRACE, 12, 5, 'All 44 lines met. Refrigerant handling and system commissioning are both assessed in the practical EISA.', 2);

  // Newest first, the same order createApplication() leaves the list in.
  return [
    electrical, welding, plumbing, gas, millwright, boilermaker, rigger, liftMechanic, drainlayer, lineMechanic, waterProcess, metalFabricator, refrigeration,
  ]
    .map((builder) => builder.app())
    .sort((x, y) => y.submissionDate.localeCompare(x.submissionDate));
}
