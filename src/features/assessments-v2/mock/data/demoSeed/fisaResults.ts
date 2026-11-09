// Demo seed — Approval of Results, FISA tab (QCTO feedback 3.14). Written in the same shape as
// approval-of-results/fisaApi.ts (createFisaResultsBatch, saveFisaResultsDraft,
// submitFisaResultsBatch, the ASD review saves, performFisaResultsAction), with the audit
// entries and notifications each step implies. Every batch is for the Approved FISA Standard
// "Electrical Installation Skills Programme" (mock/data/fisaStandardsSeed.ts) and lists only
// learners enrolled at that SDP. Days are "days ago".
//
//  #   SDP                      Learners (competent)  Stage
//  R1  Khanya Skills Academy    3 (2)                 Awaiting submission — draft, one evidence file, not submitted
//  R2  Thabo Technical College  3 (3)                 Submitted — with the ASD, review not started
//  R3  Khanya Skills Academy    4 (3)                 With the Deputy Director (ASD Lindiwe Khumalo reviewed it)
//  R4  Khanya Skills Academy    6 (5)                 Approved — approval letter sent to the SDP, recommended to Certification
//
// Officials on R4: ASD Sipho Ndlovu, Deputy Director Grace Mokoena, Director Zanele Mthembu,
// Chief Director Busisiwe Radebe — a different person at every stage.
import { ENROLLED_LEARNERS } from '../enrolledLearners';
import { seedFisaStandards } from '../fisaStandardsSeed';
import { buildResultsComplianceChecklist } from '../resultsComplianceFolders';
import { SDP_DIRECTORY } from '../sdpDirectory';
import type { Role } from '../../../types';
import { assertAsdReviewComplete } from '../../../modules/approval-of-results/api';
import { FISA_RESULTS_RECORD_TYPE, FISA_RESULTS_SUBMITTER_ROLE, RESULTS_AD_ROLE } from '../../../modules/approval-of-results/config';
import { FISA_RESULTS_WORKFLOW, fisaSubmissionIssues } from '../../../modules/approval-of-results/workflow';
import type { FisaEvidenceTag, FisaResultsBatch, LearnerResultOutcome } from '../../../modules/approval-of-results/types';
import type { FisaStandardRecord } from '../../../modules/fisa/types';
import { answerChecklist, audit, createClock, notify, seedId, seedPerson, step, type SeedLog } from './helpers';

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
const EVIDENCE_NOTES = 'The marksheets and moderation report were checked against each learner result. The outcomes are supported by the evidence.';
const CHECKLIST_COMMENT = 'Checked against the submitted folder — in order.';

// performFisaResultsAction(): who is told next.
const NEXT_APPROVER: Partial<Record<string, Role>> = {
  'ad-advance': 'Deputy Director',
  'dd-advance': 'Director',
  'director-advance': 'Chief Director',
};

interface FisaResultsSeedBuilder {
  submit: (atDaysAgo: number) => FisaResultsSeedBuilder;
  adReview: (asdId: string, atDaysAgo: number) => FisaResultsSeedBuilder;
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
      sdpId: sdp.sdpId,
      sdpName: sdp.name,
      learnerResults,
      evidenceDocuments: evidence.map((e, i) => ({
        fileName: e.fileName,
        fileSize: 98_304 + i * 412_000,
        fileType: e.fileName.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf',
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
      createdAt,
      createdBy: sdpPerson.name,
      createdById: sdpPerson.id,
      submittedAt: null,
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
        batch = { ...batch, workflow, submittedAt: at, declaration: { acceptedBy: sdpPerson.name, acceptedById: sdpPerson.id, acceptedAt: at } };
        notify(log, at, {
          recipientRole: RESULTS_AD_ROLE,
          title: 'FISA results batch submitted',
          body: `${batch.sdpName} submitted FISA results for "${batch.skillsProgrammeTitle}".`,
        });
        return api;
      },
      // The ASD's three-part review, complete (the save functions write no audit entry).
      adReview(asdId, atDaysAgo) {
        if (batch.workflow.stageId !== 'ad-review') throw new Error('Demo seed: the compliance review is only edited in ad-review.');
        const asd = seedPerson(asdId);
        if (asd.role !== RESULTS_AD_ROLE) throw new Error(`Demo seed: ${asd.name} cannot do the first results review.`);
        clock.at(atDaysAgo, 11);
        batch = {
          ...batch,
          complianceReviewNotes: COMPLIANCE_NOTES,
          evidenceEvaluationNotes: EVIDENCE_NOTES,
          complianceChecklist: answerChecklist(buildResultsComplianceChecklist(), CHECKLIST_COMMENT),
        };
        return api;
      },
      act(actionId, actorId, atDaysAgo, note) {
        if (actionId === 'ad-advance') assertAsdReviewComplete(batch);
        const actor = seedPerson(actorId);
        const at = clock.at(atDaysAgo, 14);
        const fromStage = batch.workflow.stageId;
        const workflow = step(log, { definition: FISA_RESULTS_WORKFLOW, state: batch.workflow, actionId, actor, at, recordType: FISA_RESULTS_RECORD_TYPE, recordId: batch.id, note });
        batch = { ...batch, workflow };
        if (actionId.endsWith('-decline')) {
          batch = { ...batch, declineHistory: [...batch.declineHistory, { stageId: fromStage, decidedBy: actor.name, reason: note ?? '', decidedAt: at }] };
          notify(log, at, {
            recipientRole: FISA_RESULTS_SUBMITTER_ROLE,
            title: 'FISA results batch declined',
            body: `"${batch.skillsProgrammeTitle}" (${batch.sdpName}) was declined: ${note ?? ''}`,
          });
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
          };
          audit(log, { recordType: FISA_RESULTS_RECORD_TYPE, recordId: batch.id, actor, action: 'Approval letter generated and sent to the SDP', timestamp: at });
          audit(log, {
            recordType: FISA_RESULTS_RECORD_TYPE,
            recordId: batch.id,
            actor,
            action: 'Recommended to the Certification domain for certificate printing (simulated)',
            timestamp: at,
          });
          notify(log, at, {
            recipientRole: FISA_RESULTS_SUBMITTER_ROLE,
            title: 'FISA results batch approved',
            body: `"${batch.skillsProgrammeTitle}" results are approved and recommended to Certification. Your approval letter is ready to download.`,
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

  create(1, KHANYA, ['learner-019', 'learner-020', 'learner-021'], 2, 3, [{ fileName: `${title}_Marksheet_Khanya.xlsx`, tag: 'marksheet' }]).done();

  create(2, THABO, ['learner-005', 'learner-006', 'learner-007'], 3, 9, [
    { fileName: `${title}_Marksheet_Thabo.xlsx`, tag: 'marksheet' },
    { fileName: `${title}_Moderation_Report_Thabo.pdf`, tag: 'moderation-report' },
    { fileName: `${title}_Attendance_Register_Thabo.pdf`, tag: 'attendance-register' },
  ])
    .submit(7)
    .done();

  create(3, KHANYA, ['learner-001', 'learner-002', 'learner-003', 'learner-004'], 3, 22, [
    { fileName: `${title}_Assessment_Instrument.pdf`, tag: 'assessment-instrument' },
    { fileName: `${title}_Marksheet_Khanya_Group_A.xlsx`, tag: 'marksheet' },
    { fileName: `${title}_Moderation_Report_Khanya_Group_A.pdf`, tag: 'moderation-report' },
  ])
    .submit(20)
    .adReview(LINDIWE, 16)
    .act('ad-advance', LINDIWE, 15)
    .done();

  create(4, KHANYA, ['learner-013', 'learner-014', 'learner-015', 'learner-016', 'learner-017', 'learner-018'], 5, 40, [
    { fileName: `${title}_Assessment_Instrument.pdf`, tag: 'assessment-instrument' },
    { fileName: `${title}_Marksheet_Khanya_Group_B.xlsx`, tag: 'marksheet' },
    { fileName: `${title}_Moderation_Report_Khanya_Group_B.pdf`, tag: 'moderation-report' },
    { fileName: `${title}_Attendance_Register_Khanya_Group_B.pdf`, tag: 'attendance-register' },
  ])
    .submit(38)
    .adReview(SIPHO, 34)
    .act('ad-advance', SIPHO, 33)
    .act('dd-advance', GRACE, 28)
    .act('director-advance', ZANELE, 24)
    .act('chief-director-approve', BUSISIWE, 20)
    .done();

  // Newest first, the order createFisaResultsBatch() leaves the list in.
  return batches.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
