// Demo seed — Approval of Results, FISA tab (QCTO feedback 3.14). Written in the same shape as
// approval-of-results/fisaApi.ts (createFisaResultsBatch, saveFisaResultsDraft,
// submitFisaResultsBatch, the ASD review saves, performFisaResultsAction), with the audit
// entries and notifications each step implies. Every batch is for the Approved FISA Standard
// "Electrical Installation Skills Programme" (mock/data/fisaStandardsSeed.ts) and lists only
// learners enrolled at that SDP. Days are "days ago".
//
//  #   SDP                      Learners (competent)  Stage
//  R1  Khanya Skills Academy    3 (2)                 Awaiting submission — draft, no learner spreadsheet yet (Batch P), not submitted
//  R2  Thabo Technical College  3 (3)                 Submitted — with the ASD, review not started
//  R3  Khanya Skills Academy    4 (3)                 With the Deputy Director (ASD Lindiwe Khumalo reviewed it)
//  R4  Khanya Skills Academy    6 (5)                 Approved — Outcome Letter sent to the SDP, recommendation letter sent to Certification (Batch N1)
//
// Batch P: R2, R3 and R4 carry the three required tags (Learner spreadsheet, Verification report, Assessment instrument).
// Batch N2: R2, R3 and R4 carry the SDP's tagged verification report (Sections A-D); R3 and R4 have
// Section E1 filled by the ASD, R4 also the Deputy Director's compliance statement in E2.
//
// Officials on R4: ASD Sipho Ndlovu, Deputy Director Grace Mokoena, Director Zanele Mthembu,
// Chief Director Busisiwe Radebe — a different person at every stage.
import { ENROLLED_LEARNERS } from '../enrolledLearners';
import { seedFisaStandards } from '../fisaStandardsSeed';
import { buildResultsComplianceChecklist } from '../resultsComplianceFolders';
import { getSkillsProgrammeDetails } from '../skillsProgrammeDetails';
import { SDP_DIRECTORY } from '../sdpDirectory';
import type { Role } from '../../../types';
import { assertAsdReviewComplete } from '../../../modules/approval-of-results/api';
import { assertFisaSectionEComplete, blankSectionE } from '../../../modules/approval-of-results/fisaSectionE';
import { reviewersFromAudit } from '../../../modules/approval-of-results/downloads';
import { lastFisaDateOf } from '../../../modules/approval-of-results/outcomeLetters';
import { allocateMissingCodes, buildVerificationCode } from '../../../modules/approval-of-results/verificationCode';
import { FISA_RESULTS_RECORD_TYPE, FISA_RESULTS_SUBMITTER_ROLE, RESULTS_AD_ROLE } from '../../../modules/approval-of-results/config';
import { FISA_RESULTS_WORKFLOW, fisaSubmissionIssues, isRecommendDeclineAction, isRequestEvidenceAction } from '../../../modules/approval-of-results/workflow';
import type { FisaEvidenceTag, FisaResultsBatch, LearnerResultOutcome } from '../../../modules/approval-of-results/types';
import type { FisaStandardRecord } from '../../../modules/fisa/types';
import { answerChecklist, audit, createClock, dateOf, notify, seedId, seedPerson, step, workingDateFromToday, type SeedLog } from './helpers';

const FISA_RESULTS_ID_GROUP = 13;
const APPROVED_STANDARD_ID = 'seed-fisa-standard-approved';

const KHANYA = 'sdp-khanya-skills-academy';
const THABO = 'sdp-thabo-technical-college';
const SIPHO = 'sipho-ndlovu';
const LINDIWE = 'lindiwe-khumalo';
const GRACE = 'grace-mokoena';
const ZANELE = 'zanele-mthembu';
const BUSISIWE = 'busisiwe-radebe';

const COMPLIANCE_NOTES =
  'The learner list matches the SDP’s enrolled learners for this skills programme, and the SDP is accredited and in good standing.';
const EVIDENCE_NOTES = 'The learner spreadsheet and the verification report were checked against each learner result. The outcomes are supported by the evidence.';
const CHECKLIST_COMMENT = 'Checked against the submitted folder — in order.';
const RECOMMENDATIONS = 'Keep a signed attendance register for every FISA session and attach it to the learner spreadsheet.';

// performFisaResultsAction(): who is told next.
const NEXT_APPROVER: Partial<Record<string, Role>> = {
  'ad-advance': 'Deputy Director',
  'dd-advance': 'Director',
  'director-advance': 'Chief Director',
  'dd-recommend-decline': 'Director',
  'director-recommend-decline': 'Chief Director',
};

interface FisaResultsSeedBuilder {
  submit: (atDaysAgo: number) => FisaResultsSeedBuilder;
  adReview: (asdId: string, atDaysAgo: number, entered: { rplLearners: number; monitored: boolean }) => FisaResultsSeedBuilder;
  act: (actionId: string, actorId: string, atDaysAgo: number, note?: string) => FisaResultsSeedBuilder;
  done: () => void;
}

export function seedFisaResultsBatches(log: SeedLog): FisaResultsBatch[] {
  const found = seedFisaStandards().find((s) => s.id === APPROVED_STANDARD_ID);
  if (!found || found.workflow.stageId !== 'approved') throw new Error('Demo seed: FISA results need an Approved FISA Standard.');
  const standard: FisaStandardRecord = found;
  const batches: FisaResultsBatch[] = [];

  // createFisaResultsBatch() + saveFisaResultsDraft(): a draft with learners from the SDP's
  // enrolled list (the first `competent` are Competent) and tagged evidence files.
  function create(
    n: number,
    sdpId: string,
    learnerIds: string[],
    competent: number,
    daysAgo: number,
    evidence: { fileName: string; tag: FisaEvidenceTag }[],
  ): FisaResultsSeedBuilder {
    const sdp = SDP_DIRECTORY.find((s) => s.sdpId === sdpId);
    if (!sdp) throw new Error(`Demo seed: no SDP "${sdpId}".`);
    const sdpPerson = seedPerson(sdpId);
    const clock = createClock();
    const createdAt = clock.at(daysAgo, 9);
    if (createdAt <= standard.createdAt) throw new Error('Demo seed: a FISA results batch cannot predate its FISA Standard.');

    const learnerResults = learnerIds.map((id, i) => {
      const learner = ENROLLED_LEARNERS.find((l) => l.id === id);
      if (!learner || learner.sdpName !== sdp.name) throw new Error(`Demo seed: ${id} is not enrolled at ${sdp.name}.`);
      const outcome: LearnerResultOutcome = i < competent ? 'competent' : 'not-yet-competent';
      return { learnerId: learner.id, fullName: learner.fullName, idNumber: learner.idNumber, outcome };
    });
    if (new Set(learnerIds).size !== learnerIds.length) throw new Error('Demo seed: a learner can only appear once on a batch.');

    let batch: FisaResultsBatch = {
      id: seedId(FISA_RESULTS_ID_GROUP, n),
      fisaStandardId: standard.id,
      skillsProgrammeTitle: standard.skillsProgrammeTitle,
      ...getSkillsProgrammeDetails(standard.skillsProgrammeTitle),
      // Batch N1: the FISA was held two working days before the batch was created.
      fisaDates: [workingDateFromToday(-(daysAgo + 2))],
      recommendationsForImprovement: '',
      sectionE: blankSectionE(),
      sdpId: sdp.sdpId,
      sdpName: sdp.name,
      learnerResults,
      evidenceDocuments: evidence.map((e, i) => ({
        fileName: e.fileName,
        fileSize: 98_304 + i * 412_000,
        fileType: e.fileName.endsWith('.csv') ? 'text/csv' : 'application/pdf',
        uploadedAt: createdAt,
        tag: e.tag,
      })),
      declaration: null,
      complianceReviewNotes: '',
      evidenceEvaluationNotes: '',
      complianceChecklist: buildResultsComplianceChecklist(),
      workflow: { stageId: 'sdp-draft' },
      cycleCount: 1,
      declineHistory: [],
      declineRecommendations: [],
      evidenceRequestedAt: null,
      finalEvidenceReceivedAt: null,
      finalDecision: null,
      createdAt,
      createdBy: sdpPerson.name,
      createdById: sdpPerson.id,
      submittedAt: null,
      firstSubmittedAt: null,
      recommendation: null,
      approvalLetter: null,
    };

    const api: FisaResultsSeedBuilder = {
      // submitFisaResultsBatch(): the same submission rule as the api, the declaration ticked.
      submit(atDaysAgo) {
        const issues = fisaSubmissionIssues(batch, true);
        if (issues.length > 0) throw new Error(`Demo seed: ${issues[0].message}`);
        const at = clock.at(atDaysAgo, 10);
        const workflow = step(log, {
          definition: FISA_RESULTS_WORKFLOW,
          state: batch.workflow,
          actionId: 'fisa-submit',
          actor: sdpPerson,
          at,
          recordType: FISA_RESULTS_RECORD_TYPE,
          recordId: batch.id,
        });
        batch = { ...batch, workflow, submittedAt: at, firstSubmittedAt: at, declaration: { acceptedBy: sdpPerson.name, acceptedById: sdpPerson.id, acceptedAt: at } };
        notify(log, at, {
          recipientRole: RESULTS_AD_ROLE,
          title: 'FISA results batch submitted',
          body: `${batch.sdpName} submitted FISA results for "${batch.skillsProgrammeTitle}".`,
        });
        return api;
      },
      // The ASD's three-part review, complete (the save functions write no audit entry).
      adReview(asdId, atDaysAgo, entered) {
        if (batch.workflow.stageId !== 'ad-review') throw new Error('Demo seed: the compliance review is only edited in ad-review.');
        const asd = seedPerson(asdId);
        if (asd.role !== RESULTS_AD_ROLE) throw new Error(`Demo seed: ${asd.name} cannot do the first results review.`);
        clock.at(atDaysAgo, 11);
        batch = {
          ...batch,
          complianceReviewNotes: COMPLIANCE_NOTES,
          evidenceEvaluationNotes: EVIDENCE_NOTES,
          complianceChecklist: answerChecklist(buildResultsComplianceChecklist(), CHECKLIST_COMMENT),
          recommendationsForImprovement: RECOMMENDATIONS,
          // Batch N2: Section E1, the part the system cannot fill (saveFisaSectionE).
          sectionE: {
            ...batch.sectionE,
            qctoMonitoringDate: entered.monitored ? batch.fisaDates[0] : '',
            periodOfSkillsProgramme: '3 months',
            learnersViaTraining: batch.learnerResults.length - entered.rplLearners,
            learnersViaRpl: entered.rplLearners,
            recommendation: 'approval',
          },
        };
        return api;
      },
      act(actionId, actorId, atDaysAgo, note) {
        if (actionId === 'ad-advance') {
          assertAsdReviewComplete(batch);
          assertFisaSectionEComplete(batch);
        }
        const actor = seedPerson(actorId);
        const at = clock.at(atDaysAgo, 14);
        const fromStage = batch.workflow.stageId;
        const workflow = step(log, { definition: FISA_RESULTS_WORKFLOW, state: batch.workflow, actionId, actor, at, recordType: FISA_RESULTS_RECORD_TYPE, recordId: batch.id, note });
        batch = { ...batch, workflow };
        // Section E2: the Deputy Director's compliance statement, saved before the batch is sent on.
        if (actionId === 'dd-advance') batch = { ...batch, sectionE: { ...batch.sectionE, ddCompliance: 'complied', ddComment: 'All requirements were met.' } };
        if (isRequestEvidenceAction(actionId)) {
          batch = {
            ...batch,
            evidenceRequestedAt: dateOf(at),
            declineHistory: [...batch.declineHistory, { stageId: fromStage, decidedBy: actor.name, reason: note ?? '', decidedAt: at }],
          };
          notify(log, at, {
            recipientRole: FISA_RESULTS_SUBMITTER_ROLE,
            title: 'More evidence requested',
            body: `"${batch.skillsProgrammeTitle}" (${batch.sdpName}): ${note ?? ''} Add the evidence and resubmit.`,
          });
        }
        if (isRecommendDeclineAction(actionId)) {
          batch = {
            ...batch,
            declineRecommendations: [...batch.declineRecommendations, { stageId: fromStage, recommendedBy: actor.name, reason: note ?? '', recommendedAt: at, cycle: batch.cycleCount }],
          };
        }
        const nextApprover = NEXT_APPROVER[actionId];
        if (nextApprover) {
          notify(log, at, {
            recipientRole: nextApprover,
            title: 'FISA results batch awaiting your review',
            body: `"${batch.skillsProgrammeTitle}" (${batch.sdpName}) is awaiting your review.`,
          });
        }
        if (actionId === 'chief-director-approve') {
          batch = {
            ...batch,
            recommendation: { recommendedAt: at, recommendedBy: actor.name },
            approvalLetter: { generatedAt: at, signedBy: actor.name, sentToSdpAt: at },
            finalDecision: {
              outcome: 'approved',
              decidedAt: at,
              decidedBy: actor.name,
              decidedById: actor.id,
              verificationCode: '',
              irregularities: [],
              correctiveActions: [],
              ...reviewersFromAudit(log.audit.filter((e) => e.recordId === batch.id)),
            },
          };
          audit(log, { recordType: FISA_RESULTS_RECORD_TYPE, recordId: batch.id, actor, action: 'Outcome letter generated and sent to the SDP', timestamp: at });
          audit(log, {
            recordType: FISA_RESULTS_RECORD_TYPE,
            recordId: batch.id,
            actor,
            action: 'Recommendation letter sent to Certification',
            timestamp: at,
          });
          notify(log, at, {
            recipientRole: FISA_RESULTS_SUBMITTER_ROLE,
            title: 'FISA results batch approved',
            body: `"${batch.skillsProgrammeTitle}" results are approved. Your Outcome Letter is ready to download.`,
          });
        }
        return api;
      },
      done() {
        batches.push(batch);
      },
    };
    return api;
  }

  const title = 'Electrical_Installation_SP';

  // Batch P: the draft has no learner spreadsheet yet, so the upload can be tried on it.
  create(1, KHANYA, ['learner-019', 'learner-020', 'learner-021'], 2, 3, [
    { fileName: `${title}_Assessment_Instrument_Khanya.pdf`, tag: 'assessment-instrument' },
    { fileName: `${title}_Attendance_Register_Khanya.pdf`, tag: 'attendance-register' },
  ]).done();

  create(2, THABO, ['learner-005', 'learner-006', 'learner-007'], 3, 9, [
    { fileName: `${title}_Verification_Report_Thabo.pdf`, tag: 'verification-report' },
    { fileName: `${title}_Learner_Spreadsheet_Thabo.csv`, tag: 'learner-spreadsheet' },
    { fileName: `${title}_Assessment_Instrument_Thabo.pdf`, tag: 'assessment-instrument' },
    { fileName: `${title}_Attendance_Register_Thabo.pdf`, tag: 'attendance-register' },
  ])
    .submit(7)
    .done();

  create(3, KHANYA, ['learner-001', 'learner-002', 'learner-003', 'learner-004'], 3, 22, [
    { fileName: `${title}_Verification_Report_Khanya_Group_A.pdf`, tag: 'verification-report' },
    { fileName: `${title}_Assessment_Instrument.pdf`, tag: 'assessment-instrument' },
    { fileName: `${title}_Learner_Spreadsheet_Khanya_Group_A.csv`, tag: 'learner-spreadsheet' },
    { fileName: `${title}_Completed_Practical_Rubric_Khanya_Group_A.pdf`, tag: 'completed-practical-rubric' },
  ])
    .submit(20)
    .adReview(LINDIWE, 16, { rplLearners: 0, monitored: false })
    .act('ad-advance', LINDIWE, 15)
    .done();

  create(4, KHANYA, ['learner-013', 'learner-014', 'learner-015', 'learner-016', 'learner-017', 'learner-018'], 5, 40, [
    { fileName: `${title}_Verification_Report_Khanya_Group_B.pdf`, tag: 'verification-report' },
    { fileName: `${title}_Assessment_Instrument.pdf`, tag: 'assessment-instrument' },
    { fileName: `${title}_Learner_Spreadsheet_Khanya_Group_B.csv`, tag: 'learner-spreadsheet' },
    { fileName: `${title}_Completed_Practical_Rubric_Khanya_Group_B.pdf`, tag: 'completed-practical-rubric' },
    { fileName: `${title}_Attendance_Register_Khanya_Group_B.pdf`, tag: 'attendance-register' },
  ])
    .submit(38)
    .adReview(SIPHO, 34, { rplLearners: 1, monitored: true })
    .act('ad-advance', SIPHO, 33)
    .act('dd-advance', GRACE, 28)
    .act('director-advance', ZANELE, 24)
    .act('chief-director-approve', BUSISIWE, 20)
    .done();

  // Batch N1: codes are numbered per financial year in the order of the decisions.
  const existingCodes: string[] = [];
  for (const batch of batches.filter((b) => b.finalDecision).sort((a, b) => (a.finalDecision?.decidedAt ?? '').localeCompare(b.finalDecision?.decidedAt ?? ''))) {
    if (!batch.finalDecision) continue;
    const code = buildVerificationCode('fisa', lastFisaDateOf(batch), dateOf(batch.finalDecision.decidedAt), existingCodes);
    existingCodes.push(code);
    batch.finalDecision = { ...batch.finalDecision, verificationCode: code };
    batch.verificationCode = code;
  }
  // Batch W: every other submitted batch gets its code as it reached the ASD.
  const withCodes = allocateMissingCodes(batches, 'fisa', {
    reachedAsd: (b) => b.workflow.stageId !== 'sdp-draft',
    allocatedOn: (b) => dateOf(b.firstSubmittedAt ?? b.createdAt),
    lastDate: lastFisaDateOf,
  });

  // Newest first, the order createFisaResultsBatch() leaves the list in.
  return withCodes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
