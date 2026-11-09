// Demo seed — Approval of Results, item 1.2. Written in the same shape as
// approval-of-results/api.ts (submitResultsBatch, saveComplianceReviewNotes,
// saveEvidenceEvaluationNotes, saveComplianceChecklist, uploadEvidenceDocument,
// performResultsAction), with the audit entries and notifications each step implies. Every
// batch is for a past sitting with a Confirmed EISA Confirmation (eisaConfirmation.ts), has a
// result per learner on that confirmation, and was submitted about 20 days after the EISA date
// (inside the 21-working-day deadline). Days are "days ago".
//
// QCTO feedback 29.31 (Batch L1): each batch snapshots the components of the approved QASA for
// its QP and qualification (qasa.ts: Electrical Trades, Welding, Plumbing — two components each)
// and every learner has a mark per component, or is Absent. The pattern is per learner, in
// confirmation order: C = Competent (every mark at least the pass mark), N = Not yet competent
// (one component below its pass mark), A = Absent. Rate = competent / wrote.
//
//  #    Qualification      EISA date    QP                   Pattern  Rate   Stage
//  —    Electrical Trades  today - 15   Nomvula Dlamini      —        —      Awaiting submission (QP side) — no batch yet, nothing captured
//  —    Welding            today - 20   Precious Mahlangu    —        —      Awaiting submission (QP side) — no batch yet, with a saved draft
//                                                                          (seedResultsDrafts(): Batch L2, 05.24)
//  A2   Plumbing           today - 30   Johan van der Merwe  CCCN     75%    Submitted — with the ASD, review not started
//  A3   Welding            today - 45   Precious Mahlangu    CCCN     75%    ASD: compliance review (notes + first folder done)
//  A4   Electrical Trades  today - 60   Nomvula Dlamini      CCA      100%   ASD: evidence evaluation (both notes, 3 of 4 folders, evidence uploaded)
//  A5   Plumbing           today - 75   Johan van der Merwe  CCN      66.7%  With the Deputy Director
//  A6   Welding            today - 90   Precious Mahlangu    CAC      100%   With the Director
//  A7   Electrical Trades  today - 105  Nomvula Dlamini      CCCN     75%    With the Chief Director (final approval pending)
//  A8   Plumbing           today - 130  Johan van der Merwe  CCNCA    75%    Approved — recommended to Certification (was 80%; one learner now absent)
//  A9   Welding            today - 150  Precious Mahlangu    CNCNN    40%    Approved, below the 45% threshold — its Post-EISA Monitoring
//                                                                          visit was created automatically at final approval (siteVisits.ts SV3)
//  A10  Electrical Trades  today - 170  Nomvula Dlamini      CNCN     50%    Approved, above the 45% threshold — no Post-EISA Monitoring visit
//  A11  Plumbing           today - 50   Johan van der Merwe  CNC      66.7%  Declined by the Deputy Director with a reason — QP can resubmit
//
// Officials: ASD Lindiwe Khumalo (Electrical Trades, Welding) / Riaan Pretorius
// (Plumbing); Deputy Director Grace Mokoena (Nomvula's and Johan's) / Peter Botha (Precious's);
// Director Zanele Mthembu (Nomvula's) / Sarah Naidoo (Precious's and Johan's); Chief Director
// Busisiwe Radebe / Francois Le Roux.
import { buildResultsComplianceChecklist } from '../resultsComplianceFolders';
import { isChecklistComplete } from '../../../shared/checklist/types';
import type { Role } from '../../../types';
import { calculateLearnerResult, type EisaLearnerOutcome } from '../../../modules/approval-of-results/calculation';
import { snapshotResultsComponents } from '../../../modules/approval-of-results/componentSnapshot';
import { RESULTS_AD_ROLE } from '../../../modules/approval-of-results/config';
import { markEntryIssues } from '../../../modules/approval-of-results/markEntry';
import { RESULTS_WORKFLOW, submissionDeadlineFor } from '../../../modules/approval-of-results/workflow';
import type { EisaLearnerResult, ResultsBatch, ResultsComponent, ResultsDraft } from '../../../modules/approval-of-results/types';
import type { EisaConfirmationRecord } from '../../../modules/eisa-confirmation/types';
import type { QsaAddendumApplication } from '../../../modules/qsa-addendum/types';
import { ENROLLED_LEARNERS } from '../enrolledLearners';
import { answerChecklist, createClock, dateOf, notify, seedId, seedPerson, step, workingDateFromToday, type SeedLog } from './helpers';

const RESULTS_ID_GROUP = 7;

// QCTO feedback 2.8: one approved batch below the Post-EISA Monitoring threshold (siteVisits.ts
// seeds its automatic visit) and one above it (no visit).
export const RESULTS_SEED_IDS = {
  belowThresholdWelding: seedId(RESULTS_ID_GROUP, 9),
  aboveThresholdElectrical: seedId(RESULTS_ID_GROUP, 10),
} as const;

const LINDIWE = 'lindiwe-khumalo';
const RIAAN = 'riaan-pretorius';
const GRACE = 'grace-mokoena';
const PETER = 'peter-botha';
const ZANELE = 'zanele-mthembu';
const SARAH = 'sarah-naidoo';
const BUSISIWE = 'busisiwe-radebe';
const FRANCOIS = 'francois-le-roux';

const COMPLIANCE_NOTES =
  'The learner list matches the EISA Confirmation, every SOR was accepted at registration and the SDP was in good standing for this sitting.';
const EVIDENCE_NOTES = 'Marksheets and the moderation report were checked against each learner result. The outcomes are supported by the evidence.';
const CHECKLIST_COMMENT = 'Checked against the submitted folder — in order.';

// performResultsAction(): who is told next.
const NEXT_APPROVER: Partial<Record<string, Role>> = {
  'ad-advance': 'Deputy Director',
  'dd-advance': 'Director',
  'director-advance': 'Chief Director',
};

interface ResultsSeedBuilder {
  adReview: (adId: string, atDaysAgo: number, progress: { evidenceNotes: boolean; sectionIds?: string[]; evidenceFile?: string }) => ResultsSeedBuilder;
  act: (actionId: string, actorId: string, atDaysAgo: number, note?: string) => ResultsSeedBuilder;
  done: () => void;
}

type OutcomeCode = 'C' | 'N' | 'A';

const OUTCOME_OF_CODE: Record<OutcomeCode, EisaLearnerOutcome> = { C: 'competent', N: 'not-yet-competent', A: 'absent' };

function isOutcomeCode(value: string): value is OutcomeCode {
  return value === 'C' || value === 'N' || value === 'A';
}

// Deterministic, realistic marks for one learner. Competent: every mark between the pass mark
// and the total. Not yet competent: one component (it alternates per learner) below its pass
// mark, the other passed. Absent: no marks.
function seedMarks(components: ResultsComponent[], code: OutcomeCode, learnerIndex: number): Record<string, number> {
  if (code === 'A') return {};
  const failing = learnerIndex % components.length;
  return Object.fromEntries(
    components.map((c, j) => {
      const spread = ((learnerIndex * 37 + j * 53) % 80) / 100 + 0.1;
      const mark =
        code === 'N' && j === failing
          ? Math.floor(c.passMark * (0.55 + ((learnerIndex * 13 + j * 7) % 35) / 100))
          : Math.min(c.totalMarks, c.passMark + Math.round((c.totalMarks - c.passMark) * spread));
      return [c.id, mark];
    }),
  );
}

// Batch L2.1: the ID number the QA domain holds for a learner on a confirmation.
function idNumberOf(learnerId: string): string {
  const learner = ENROLLED_LEARNERS.find((l) => l.id === learnerId);
  if (!learner) throw new Error(`Demo seed: no enrolled learner "${learnerId}".`);
  return learner.idNumber;
}

export function seedResultsBatches(log: SeedLog, confirmations: EisaConfirmationRecord[], qasas: QsaAddendumApplication[]): ResultsBatch[] {
  const batches: ResultsBatch[] = [];

  function confirmationFor(title: string, offsetDays: number): EisaConfirmationRecord {
    const date = workingDateFromToday(offsetDays);
    const found = confirmations.find((c) => c.qualificationTitle === title && c.sittingDate === date);
    if (!found) throw new Error(`Demo seed: no EISA Confirmation for ${title} ${date}.`);
    return found;
  }

  // submitResultsBatch(): one batch per sitting, confirmation Confirmed, the approved QASA's
  // components snapshotted (29.31), and marks or Absent for every learner on it, following
  // `pattern` (one letter per learner, see the table above).
  function submit(n: number, title: string, offsetDays: number, pattern: string, daysAgo: number): ResultsSeedBuilder {
    const confirmation = confirmationFor(title, offsetDays);
    const clock = createClock();
    const qp = seedPerson(confirmation.qpId);
    const submittedAt = clock.at(daysAgo, 10);
    if (batches.some((b) => b.sittingId === confirmation.sittingId)) throw new Error(`Demo seed: ${confirmation.sittingDate} already has a results batch.`);
    if (confirmation.workflow.stageId !== 'confirmed') throw new Error('Demo seed: the sitting must be fully confirmed before results can be submitted.');
    if (!confirmation.moderationDate || dateOf(submittedAt) <= confirmation.moderationDate) throw new Error('Demo seed: results submitted before moderation.');
    const codes = [...pattern].filter(isOutcomeCode);
    if (codes.length !== pattern.length || codes.length !== confirmation.learners.length) {
      throw new Error(`Demo seed: ${title} ${confirmation.sittingDate} pattern does not match its learners.`);
    }
    const components = snapshotResultsComponents(qasas, confirmation);
    if (components.length === 0) throw new Error(`Demo seed: the approved QASA for ${title} has no assessment components.`);
    const learnerResults: EisaLearnerResult[] = confirmation.learners.map((l, i) => ({
      learnerId: l.learnerId,
      fullName: l.fullName,
      idNumber: idNumberOf(l.learnerId),
      absent: codes[i] === 'A',
      marks: seedMarks(components, codes[i], i),
    }));
    // The seeded marks must give exactly the outcome the pattern asks for, and pass the QP's checks.
    learnerResults.forEach((r, i) => {
      if (calculateLearnerResult(components, r).outcome !== OUTCOME_OF_CODE[codes[i]]) {
        throw new Error(`Demo seed: ${title} learner ${i + 1} marks do not give ${OUTCOME_OF_CODE[codes[i]]}.`);
      }
    });
    if (markEntryIssues(components, learnerResults).length > 0) throw new Error(`Demo seed: ${title} ${confirmation.sittingDate} has invalid marks.`);

    const sittingDate = confirmation.sittingDate;
    const fileTitle = title.replace(/\s+/g, '_');
    let batch: ResultsBatch = {
      id: seedId(RESULTS_ID_GROUP, n),
      sittingId: confirmation.sittingId,
      sittingDate,
      qualificationTitle: confirmation.qualificationTitle,
      qpId: confirmation.qpId,
      qpName: confirmation.qpName,
      learnerCount: confirmation.learners.length,
      components,
      learnerResults,
      evidenceDocuments: [
        { fileName: `${fileTitle}_EISA_Marksheet_${sittingDate}.xlsx`, fileSize: 98_304, uploadedAt: submittedAt },
        { fileName: `${fileTitle}_Moderation_Report_${sittingDate}.pdf`, fileSize: 1_258_291, uploadedAt: submittedAt },
      ],
      complianceReviewNotes: '',
      evidenceEvaluationNotes: '',
      complianceChecklist: buildResultsComplianceChecklist(),
      workflow: { stageId: 'ad-review', submittedBy: qp.name, submittedById: qp.id },
      cycleCount: 1,
      declineHistory: [],
      submissionDeadline: submissionDeadlineFor(sittingDate),
      submittedAt,
      recommendation: null,
      pemVisitId: null,
      createdBy: qp.name,
    };
    if (dateOf(submittedAt) > batch.submissionDeadline) throw new Error(`Demo seed: ${title} ${sittingDate} submitted after its deadline.`);
    notify(log, submittedAt, {
      recipientRole: RESULTS_AD_ROLE,
      title: 'Results batch submitted',
      body: `${confirmation.qpName} submitted results for "${confirmation.qualificationTitle}" (EISA date ${sittingDate}).`,
    });

    const api: ResultsSeedBuilder = {
      // The ASD's three-part review (save* functions write no audit entry).
      adReview(adId, atDaysAgo, progress) {
        if (batch.workflow.stageId !== 'ad-review') throw new Error('Demo seed: the compliance review is only edited in ad-review.');
        const ad = seedPerson(adId);
        if (ad.role !== RESULTS_AD_ROLE) throw new Error(`Demo seed: ${ad.name} cannot do the first results review.`);
        const at = clock.at(atDaysAgo, 11);
        batch = {
          ...batch,
          complianceReviewNotes: COMPLIANCE_NOTES,
          evidenceEvaluationNotes: progress.evidenceNotes ? EVIDENCE_NOTES : '',
          complianceChecklist: answerChecklist(buildResultsComplianceChecklist(), CHECKLIST_COMMENT, { onlySectionIds: progress.sectionIds }),
          evidenceDocuments: progress.evidenceFile
            ? [...batch.evidenceDocuments, { fileName: progress.evidenceFile, fileSize: 524_288, uploadedAt: at }]
            : batch.evidenceDocuments,
        };
        return api;
      },
      act(actionId, actorId, atDaysAgo, note) {
        if (actionId === 'ad-advance' && (!batch.complianceReviewNotes.trim() || !batch.evidenceEvaluationNotes.trim() || !isChecklistComplete(batch.complianceChecklist, true))) {
          throw new Error('Demo seed: complete the compliance review, evidence evaluation and folder checklist before advancing.');
        }
        const actor = seedPerson(actorId);
        const at = clock.at(atDaysAgo, 14);
        const fromStage = batch.workflow.stageId;
        const workflow = step(log, { definition: RESULTS_WORKFLOW, state: batch.workflow, actionId, actor, at, recordType: 'results-batch', recordId: batch.id, note });
        batch = { ...batch, workflow };
        if (actionId.endsWith('-decline')) {
          batch = { ...batch, declineHistory: [...batch.declineHistory, { stageId: fromStage, decidedBy: actor.name, reason: note ?? '', decidedAt: at }] };
          notify(log, at, { recipientRole: 'QP', title: 'Results batch declined', body: `"${batch.qualificationTitle}" was declined: ${note ?? ''}` });
        }
        const nextApprover = NEXT_APPROVER[actionId];
        if (nextApprover) {
          notify(log, at, {
            recipientRole: nextApprover,
            title: 'Results batch awaiting your review',
            body: `"${batch.qualificationTitle}" (EISA date ${batch.sittingDate}) is awaiting your review.`,
          });
        }
        if (actionId === 'chief-director-approve') {
          batch = { ...batch, recommendation: { recommendedAt: at, recommendedBy: actor.name } };
          log.audit.push({
            id: crypto.randomUUID(),
            recordType: 'results-batch',
            recordId: batch.id,
            actorRole: actor.role,
            actorId: actor.id,
            actorName: actor.name,
            action: 'Recommended to the Certification domain for certificate printing (simulated)',
            timestamp: at,
          });
          notify(log, at, { recipientRole: 'QP', title: 'Results batch approved', body: `"${batch.qualificationTitle}" results are approved and recommended to Certification.` });
        }
        return api;
      },
      done() {
        batches.push(batch);
      },
    };
    return api;
  }

  const full = { evidenceNotes: true };

  submit(2, 'Plumbing', -30, 'CCCN', 10).done();
  submit(3, 'Welding', -45, 'CCCN', 25).adReview(LINDIWE, 22, { evidenceNotes: false, sectionIds: ['f1'] }).done();
  submit(4, 'Electrical Trades', -60, 'CCA', 40)
    .adReview(LINDIWE, 36, { evidenceNotes: true, sectionIds: ['f1', 'f2', 'f3'], evidenceFile: 'Marking_Venue_Attendance_Register.pdf' })
    .done();
  submit(5, 'Plumbing', -75, 'CCN', 55).adReview(RIAAN, 50, full).act('ad-advance', RIAAN, 48).done();
  submit(6, 'Welding', -90, 'CAC', 70).adReview(LINDIWE, 65, full).act('ad-advance', LINDIWE, 63).act('dd-advance', PETER, 57).done();
  submit(7, 'Electrical Trades', -105, 'CCCN', 85)
    .adReview(LINDIWE, 80, full)
    .act('ad-advance', LINDIWE, 78)
    .act('dd-advance', GRACE, 72)
    .act('director-advance', ZANELE, 66)
    .done();
  submit(8, 'Plumbing', -130, 'CCNCA', 110)
    .adReview(RIAAN, 105, full)
    .act('ad-advance', RIAAN, 103)
    .act('dd-advance', GRACE, 97)
    .act('director-advance', SARAH, 92)
    .act('chief-director-approve', BUSISIWE, 87)
    .done();
  submit(9, 'Welding', -150, 'CNCNN', 130)
    .adReview(LINDIWE, 125, full)
    .act('ad-advance', LINDIWE, 123)
    .act('dd-advance', PETER, 117)
    .act('director-advance', SARAH, 112)
    .act('chief-director-approve', FRANCOIS, 106)
    .done();
  submit(10, 'Electrical Trades', -170, 'CNCN', 150)
    .adReview(LINDIWE, 145, full)
    .act('ad-advance', LINDIWE, 143)
    .act('dd-advance', GRACE, 137)
    .act('director-advance', ZANELE, 132)
    .act('chief-director-approve', BUSISIWE, 126)
    .done();
  submit(11, 'Plumbing', -50, 'CNC', 30)
    .adReview(RIAAN, 26, full)
    .act('ad-advance', RIAAN, 24)
    .act(
      'dd-decline',
      GRACE,
      20,
      'The moderation report has no moderator sign-off for Andile Khumalo, and the marksheet total for Kgomotso Letsoalo does not match the result. Correct both and resubmit.',
    )
    .done();

  // Newest first, the order submitResultsBatch() leaves the list in.
  return batches.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

// QCTO feedback 05.24: the saved draft behind the Welding sitting at today - 20 — the first two
// learners captured (one competent, one with a mark below the pass mark in the first component),
// the third learner still blank. The draft holds marks only; the checks apply at Submit.
export function seedResultsDrafts(confirmations: EisaConfirmationRecord[], qasas: QsaAddendumApplication[]): ResultsDraft[] {
  const date = workingDateFromToday(-20);
  const confirmation = confirmations.find((c) => c.qualificationTitle === 'Welding' && c.sittingDate === date);
  if (!confirmation) throw new Error(`Demo seed: no EISA Confirmation for Welding ${date}.`);
  const components = snapshotResultsComponents(qasas, confirmation);
  if (components.length === 0) throw new Error('Demo seed: the approved QASA for Welding has no assessment components.');
  const [first] = components;
  const learnerResults: EisaLearnerResult[] = confirmation.learners.map((l, i) => {
    if (i === 0) return { learnerId: l.learnerId, fullName: l.fullName, idNumber: idNumberOf(l.learnerId), absent: false, marks: seedMarks(components, 'C', i) };
    if (i === 1) return { learnerId: l.learnerId, fullName: l.fullName, idNumber: idNumberOf(l.learnerId), absent: false, marks: { [first.id]: Math.max(0, first.passMark - 5) } };
    return { learnerId: l.learnerId, fullName: l.fullName, idNumber: idNumberOf(l.learnerId), absent: false, marks: {} };
  });
  // The draft must be genuinely unfinished: the first learner passes the checks, the others do not.
  if (markEntryIssues(components, learnerResults.slice(0, 1)).length > 0 || markEntryIssues(components, learnerResults.slice(1)).length === 0) {
    throw new Error('Demo seed: the results draft is not in the unfinished state it should show.');
  }
  const qp = seedPerson(confirmation.qpId);
  return [{ sittingId: confirmation.sittingId, learnerResults, savedAt: createClock().at(2, 15), savedBy: qp.name }];
}
