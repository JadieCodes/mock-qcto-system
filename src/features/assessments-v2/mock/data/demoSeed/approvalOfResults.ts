// Demo seed — Approval of Results, item 1.2. Written in the same shape as
// approval-of-results/api.ts (submitResultsBatch, saveComplianceReviewNotes,
// saveEvidenceEvaluationNotes, saveComplianceChecklist, uploadEvidenceDocument,
// performResultsAction), with the audit entries and notifications each step implies. Every
// batch is for a past sitting with a Confirmed EISA Confirmation (eisaConfirmation.ts), has a
// result per learner on that confirmation, and was submitted about 20 days after the EISA date
// (inside the 21-working-day deadline). Days are "days ago".
//
// QCTO feedback 29.31 (Batch L1, L1.1): each batch snapshots the components and Addendum pass %
// of the approved QASA for its QP and qualification (qasa.ts: Electrical Trades, Welding,
// Plumbing — two components each) and every learner has a whole-number mark per component, or is
// Absent. The pattern is per learner, in confirmation order: C = Competent (every mark at least
// the component's lowest mark and the final EISA % at least the pass %), N = Not yet competent
// (one component below its lowest mark; learners at an even position still pass overall, the
// others usually fall below the pass % too), A = Absent. Rate = competent / wrote.
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
//  A11  Plumbing           today - 50   Johan van der Merwe  CNC      66.7%  More evidence requested by the Deputy Director — QP can resubmit
//  A12  Electrical Trades  today - 190  Nomvula Dlamini      NA       0%     Declined (final) by the Chief Director, after the DD and the Director
//                                                                          recommended a decline: two irregularities, two corrective actions;
//                                                                          no Post-EISA visit (Batch N1)
//
// Batch N2: every batch has a section 2 review in QCTO's form (pre-filled lines j, l, d and e, then the
// ASD's answers; the batches with the ASD hold only part of it), and every batch that went past the
// Deputy Director has the Deputy Director's letter checklist. The declined batch (A12) answers g and h
// "No" and records a negative impact; the "More evidence requested" batch (A11) answers c "No".
//
// Officials: ASD Lindiwe Khumalo (Electrical Trades, Welding) / Riaan Pretorius
// (Plumbing); Deputy Director Grace Mokoena (Nomvula's and Johan's) / Peter Botha (Precious's);
// Director Zanele Mthembu (Nomvula's) / Sarah Naidoo (Precious's and Johan's); Chief Director
// Busisiwe Radebe / Francois Le Roux.
import { onFileDocumentsFor } from '../onFileDocuments';
import type { Role } from '../../../types';
import { onFileAuditText } from '../../../modules/approval-of-results/api';
import { assertEisaReviewComplete, blankEisaReview, isPrefilledComment, prefillEisaReview } from '../../../modules/approval-of-results/eisaReview';
import { DD_REQUIRED_LINE_IDS } from '../../../modules/approval-of-results/letterChecklist';
import { sourceInfoOf } from '../../../modules/approval-of-results/sourceInfo';
import { reviewersFromAudit } from '../../../modules/approval-of-results/downloads';
import { lastEisaDateOf } from '../../../modules/approval-of-results/outcomeLetters';
import { allocateMissingCodes, buildVerificationCode } from '../../../modules/approval-of-results/verificationCode';
import { calculateLearnerResult, type EisaLearnerOutcome } from '../../../modules/approval-of-results/calculation';
import { qualificationDetailsOf, snapshotResultsRules } from '../../../modules/approval-of-results/componentSnapshot';
import { RESULTS_AD_ROLE } from '../../../modules/approval-of-results/config';
import { markEntryIssues } from '../../../modules/approval-of-results/markEntry';
import { isRecommendDeclineAction, isRequestEvidenceAction, RESULTS_WORKFLOW, submissionDeadlineFor } from '../../../modules/approval-of-results/workflow';
import type { EisaLearnerResult, EisaReview, EvidenceDocument, OnFileDocumentRecord, ResultsBatch, ResultsComponent, ResultsDraft, ResultsFinalDecision } from '../../../modules/approval-of-results/types';
import type { EisaSitting } from '../../../modules/eisa-calendar/types';
import type { EisaConfirmationRecord } from '../../../modules/eisa-confirmation/types';
import { isConfirmationAccepted } from '../../../modules/eisa-confirmation/workflow';
import type { EisaRegistrationRecord } from '../../../modules/eisa-registration/types';
import type { QsaAddendumApplication } from '../../../modules/qsa-addendum/types';
import { ENROLLED_LEARNERS } from '../enrolledLearners';
import { createClock, dateOf, notify, seedId, seedPerson, step, workingDateFromToday, type SeedLog } from './helpers';

const RESULTS_ID_GROUP = 7;

// QCTO feedback 2.8: one approved batch below the Post-EISA Monitoring threshold (siteVisits.ts
// seeds its automatic visit) and one above it (no visit).
export const RESULTS_SEED_IDS = {
  belowThresholdWelding: seedId(RESULTS_ID_GROUP, 9),
  aboveThresholdElectrical: seedId(RESULTS_ID_GROUP, 10),
  // Batch N1: the final decline and the "More evidence requested" batch.
  declinedElectrical: seedId(RESULTS_ID_GROUP, 12),
  moreEvidencePlumbing: seedId(RESULTS_ID_GROUP, 11),
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
const EVIDENCE_NOTES = 'The marking report and the moderation report were checked against each learner result. The outcomes are supported by the evidence.';
const REVIEW_COMMENT = 'Checked against the submitted evidence — in order.';

interface ReviewProgress {
  evidenceNotes: boolean;
  // How many Yes/No lines are answered (the pre-filled ones count); everything when omitted. The free
  // text of sections 2 and 5 is filled only when every line is answered.
  answered?: number;
  evidenceFile?: string;
  overrides?: Record<string, { answer: 'yes' | 'no'; comment: string }>;
  free?: Partial<EisaReview>;
}

// Batch N2: the ASD's section 2 — the pre-filled lines first (as submitResultsBatch() leaves them),
// then the ASD's own answers, the same shape the screen saves (saveEisaReview).
function seedEisaReview(batch: ResultsBatch, progress: ReviewProgress): EisaReview {
  const base = prefillEisaReview(batch);
  const all = progress.answered === undefined;
  let count = 0;
  const checklist = base.checklist.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (isPrefilledComment(item.comment)) {
        count++;
        return item;
      }
      if (!all && count >= (progress.answered ?? 0)) return item;
      count++;
      const override = progress.overrides?.[item.id];
      return { ...item, answer: override?.answer ?? ('yes' as const), comment: override?.comment ?? REVIEW_COMMENT };
    }),
  }));
  if (!all) return { ...base, checklist };
  return {
    ...base,
    checklist,
    irregularitySummary: 'None.',
    analysisSummary: "The QP's analysis shows the results are in line with the previous sitting; no unusual spread of marks.",
    sampleVerificationComment: 'A sample of the scripts was re-marked against the marking guideline; the standard is acceptable.',
    recommendationFurtherAction: 'None.',
    goodPractices: 'Marking and moderation reports were complete and signed on the day.',
    badPractices: 'None noted.',
    ...progress.free,
  };
}

// performResultsAction(): who is told next.
const NEXT_APPROVER: Partial<Record<string, Role>> = {
  'ad-advance': 'Deputy Director',
  'dd-advance': 'Director',
  'director-advance': 'Chief Director',
  'dd-recommend-decline': 'Director',
  'director-recommend-decline': 'Chief Director',
};

interface ResultsSeedBuilder {
  adReview: (adId: string, atDaysAgo: number, progress: ReviewProgress) => ResultsSeedBuilder;
  act: (actionId: string, actorId: string, atDaysAgo: number, note?: string, lists?: { irregularities: string[]; correctiveActions: string[] }) => ResultsSeedBuilder;
  done: () => void;
}

type OutcomeCode = 'C' | 'N' | 'A';

const OUTCOME_OF_CODE: Record<OutcomeCode, EisaLearnerOutcome> = { C: 'competent', N: 'not-yet-competent', A: 'absent' };

function isOutcomeCode(value: string): value is OutcomeCode {
  return value === 'C' || value === 'N' || value === 'A';
}

// Deterministic, realistic whole-number marks for one learner. Competent: every mark between the
// lowest mark and the highest mark. Not yet competent: one component (it alternates per learner)
// below its lowest mark; at an even position the other components are strong, so the learner
// passes overall but is not yet competent in that component. Absent: no marks.
function seedMarks(components: ResultsComponent[], code: OutcomeCode, learnerIndex: number): Record<string, number> {
  if (code === 'A') return {};
  const failing = learnerIndex % components.length;
  const strongOthers = code === 'N' && learnerIndex % 2 === 0;
  return Object.fromEntries(
    components.map((c, j) => {
      const spread = ((learnerIndex * 37 + j * 53) % 80) / 100 + 0.1;
      const mark =
        code === 'N' && j === failing
          ? Math.floor(c.lowestMark * (0.55 + ((learnerIndex * 13 + j * 7) % 35) / 100))
          : strongOthers
            ? Math.min(c.highestMark, Math.round(c.highestMark * (0.85 + ((learnerIndex * 11 + j * 5) % 15) / 100)))
            : Math.min(c.highestMark, c.lowestMark + Math.round((c.highestMark - c.lowestMark) * spread));
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

// Batch Q2: the component dates of the calendar sitting a confirmation belongs to.
function componentDatesOf(sittings: EisaSitting[], sittingId: string) {
  return sittings.find((s) => s.id === sittingId)?.componentDates;
}

// Batch Z1 (11.4): the one seeded batch (Plumbing, with the Deputy Director) whose QP reported irregularities.
const IRREGULARITIES_BATCH_N = 5;

export function seedResultsBatches(log: SeedLog, confirmations: EisaConfirmationRecord[], qasas: QsaAddendumApplication[], registrations: EisaRegistrationRecord[], sittings: EisaSitting[]): ResultsBatch[] {
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
    if (!isConfirmationAccepted(confirmation)) throw new Error('Demo seed: the sitting must be fully confirmed before results can be submitted.');
    if (!confirmation.moderationDate || dateOf(submittedAt) <= confirmation.moderationDate) throw new Error('Demo seed: results submitted before moderation.');
    const codes = [...pattern].filter(isOutcomeCode);
    if (codes.length !== pattern.length || codes.length !== confirmation.learners.length) {
      throw new Error(`Demo seed: ${title} ${confirmation.sittingDate} pattern does not match its learners.`);
    }
    const { components, addendumPassPercent } = snapshotResultsRules(qasas, { ...confirmation, componentDates: componentDatesOf(sittings, confirmation.sittingId) });
    if (components.length === 0) throw new Error(`Demo seed: the approved QASA for ${title} has no assessment components.`);
    if (addendumPassPercent === null) throw new Error(`Demo seed: the approved QASA for ${title} has no addendum pass %.`);
    const learnerResults: EisaLearnerResult[] = confirmation.learners.map((l, i) => ({
      learnerId: l.learnerId,
      fullName: l.fullName,
      idNumber: idNumberOf(l.learnerId),
      absent: codes[i] === 'A',
      marks: seedMarks(components, codes[i], i),
    }));
    // The seeded marks must give exactly the outcome the pattern asks for, and pass the QP's checks.
    learnerResults.forEach((r, i) => {
      if (calculateLearnerResult(components, r, addendumPassPercent).outcome !== OUTCOME_OF_CODE[codes[i]]) {
        throw new Error(`Demo seed: ${title} learner ${i + 1} marks do not give ${OUTCOME_OF_CODE[codes[i]]}.`);
      }
    });
    if (markEntryIssues(components, learnerResults).length > 0) throw new Error(`Demo seed: ${title} ${confirmation.sittingDate} has invalid marks.`);

    const sittingDate = confirmation.sittingDate;
    const fileTitle = title.replace(/\s+/g, '_');
    // Batch M (29.23): every batch has a marking report and a moderation report; the others vary.
    const pdf = (name: string, tag: EvidenceDocument['tag'], fileSize: number): EvidenceDocument => ({
      fileName: `${fileTitle}_${name}_${sittingDate}.pdf`,
      fileSize,
      fileType: 'application/pdf',
      uploadedAt: submittedAt,
      tag,
    });
    const irregularitiesObserved = n === IRREGULARITIES_BATCH_N;
    const evidenceDocuments: EvidenceDocument[] = [
      pdf('Marking_Report', 'marking-report', 412_672),
      pdf('Moderation_Report', 'moderation-report', 1_258_291),
      ...(n % 2 === 0 ? [pdf('Attendance_Register', 'attendance-register', 143_360)] : []),
      ...(n % 3 === 0 ? [pdf('Confirmation_Letter', 'confirmation-letter', 96_256)] : []),
      // Batch Z1 (11.4): the invigilator report on every batch; the irregularities report only where the QP answered Yes.
      pdf('Invigilator_Report', 'invigilator-report', 187_392),
      ...(irregularitiesObserved ? [pdf('Irregularities_Report', 'irregularities-report', 221_184)] : []),
    ];
    const onFileDocuments: OnFileDocumentRecord[] = onFileDocumentsFor(title).map((doc, i) => {
      const replaced = i === n % 6;
      return {
        ...doc,
        choice: replaced ? 'replaced' : 'confirmed',
        replacement: replaced
          ? { fileName: `${fileTitle}_${doc.id}_updated.pdf`, fileSize: doc.fileSize + 20_480, fileType: 'application/pdf', uploadedAt: submittedAt }
          : null,
        decidedBy: qp.name,
        decidedAt: submittedAt,
      };
    });
    let batch: ResultsBatch = {
      id: seedId(RESULTS_ID_GROUP, n),
      sittingId: confirmation.sittingId,
      sittingDate,
      qualificationTitle: confirmation.qualificationTitle,
      ...qualificationDetailsOf(qasas, confirmation),
      centres: confirmation.confirmedCentres?.map((c) => c.centre) ?? confirmation.centres,
      qpId: confirmation.qpId,
      qpName: confirmation.qpName,
      learnerCount: confirmation.learners.length,
      components,
      addendumPassPercent,
      learnerResults,
      evidenceDocuments,
      irregularitiesObserved,
      // Batch M (29.25): every "Already on file" document confirmed by the QP, one replaced.
      onFileDocuments,
      declaration: { acceptedBy: qp.name, acceptedById: qp.id, acceptedAt: submittedAt },
      complianceReviewNotes: '',
      evidenceEvaluationNotes: '',
      complianceChecklist: [],
      eisaReview: blankEisaReview(),
      ddChecklist: null,
      sourceInfo: sourceInfoOf(confirmation, registrations.filter((r) => r.sittingId === confirmation.sittingId)),
      workflow: { stageId: 'ad-review', submittedBy: qp.name, submittedById: qp.id },
      cycleCount: 1,
      declineHistory: [],
      declineRecommendations: [],
      evidenceRequestedAt: null,
      finalEvidenceReceivedAt: null,
      finalDecision: null,
      submissionDeadline: submissionDeadlineFor(sittingDate, confirmation.resultsSubmissionDate),
      submittedAt,
      recommendation: null,
      pemVisitId: null,
      createdBy: qp.name,
    };
    if (dateOf(submittedAt) > batch.submissionDeadline) throw new Error(`Demo seed: ${title} ${sittingDate} submitted after its deadline.`);
    // submitResultsBatch() pre-fills the lines the system knows.
    batch = { ...batch, eisaReview: prefillEisaReview(batch) };
    // submitResultsBatch() writes an audit entry per "Already on file" choice and one for the declaration.
    [...onFileDocuments.map(onFileAuditText), 'Declaration made: results and evidence are accurate and complete'].forEach((action) =>
      log.audit.push({ id: crypto.randomUUID(), recordType: 'results-batch', recordId: batch.id, actorRole: qp.role, actorId: qp.id, actorName: qp.name, action, timestamp: submittedAt }),
    );
    notify(log, submittedAt, {
      recipientRole: RESULTS_AD_ROLE,
      title: 'Results batch submitted',
      body: `${confirmation.qpName} submitted results for "${confirmation.qualificationTitle}" (EISA date ${sittingDate}).`,
    });

    // The verification code is numbered per financial year once every batch is built, in the order
    // of the decisions (assignVerificationCodes below).
    function decisionOf(
      outcome: 'approved' | 'declined',
      actor: ReturnType<typeof seedPerson>,
      at: string,
      lists: { irregularities: string[]; correctiveActions: string[] },
    ): ResultsFinalDecision {
      return {
        outcome,
        decidedAt: at,
        decidedBy: actor.name,
        decidedById: actor.id,
        verificationCode: '',
        ...lists,
        ...reviewersFromAudit(log.audit.filter((e) => e.recordId === batch.id)),
      };
    }

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
          eisaReview: seedEisaReview(batch, progress),
          evidenceDocuments: progress.evidenceFile
            ? [
                ...batch.evidenceDocuments,
                { fileName: progress.evidenceFile, fileSize: 524_288, fileType: 'application/pdf', uploadedAt: at, tag: 'other' },
              ]
            : batch.evidenceDocuments,
        };
        return api;
      },
      act(actionId, actorId, atDaysAgo, note, lists) {
        if (actionId === 'ad-advance') assertEisaReviewComplete(batch);
        const actor = seedPerson(actorId);
        const at = clock.at(atDaysAgo, 14);
        const fromStage = batch.workflow.stageId;
        const isFinalDecline = actionId === 'chief-director-decline';
        if (isFinalDecline && (!lists || lists.irregularities.length === 0 || lists.correctiveActions.length === 0)) {
          throw new Error('Demo seed: a final decline needs irregularities and corrective actions.');
        }
        const auditNote = isFinalDecline && lists ? `Irregularities: ${lists.irregularities.join('; ')}. Corrective actions: ${lists.correctiveActions.join('; ')}.` : note;
        const workflow = step(log, { definition: RESULTS_WORKFLOW, state: batch.workflow, actionId, actor, at, recordType: 'results-batch', recordId: batch.id, note: auditNote });
        batch = { ...batch, workflow };
        // performResultsAction(): the Deputy Director's letter checklist is complete and stamped when the batch is sent on.
        if (actionId === 'dd-advance' || actionId === 'dd-recommend-decline') {
          batch = { ...batch, ddChecklist: { checkedIds: [...DD_REQUIRED_LINE_IDS], completedBy: actor.name, completedById: actor.id, completedAt: at } };
        }
        if (isRequestEvidenceAction(actionId)) {
          batch = {
            ...batch,
            evidenceRequestedAt: dateOf(at),
            declineHistory: [...batch.declineHistory, { stageId: fromStage, decidedBy: actor.name, reason: note ?? '', decidedAt: at }],
          };
          notify(log, at, { recipientRole: 'QP', title: 'More evidence requested', body: `"${batch.qualificationTitle}": ${note ?? ''} Add the evidence and resubmit.` });
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
            title: 'Results batch awaiting your review',
            body: `"${batch.qualificationTitle}" (EISA date ${batch.sittingDate}) is awaiting your review.`,
          });
        }
        if (isFinalDecline && lists) {
          batch = { ...batch, finalDecision: decisionOf('declined', actor, at, lists) };
          notify(log, at, {
            recipientRole: 'QP',
            title: 'Results declined',
            body: `The results for "${batch.qualificationTitle}" were declined. Your Outcome Letter is ready to download. Please notify the SDPs.`,
          });
        }
        if (actionId === 'chief-director-approve') {
          batch = { ...batch, recommendation: { recommendedAt: at, recommendedBy: actor.name }, finalDecision: decisionOf('approved', actor, at, { irregularities: [], correctiveActions: [] }) };
          log.audit.push({
            id: crypto.randomUUID(),
            recordType: 'results-batch',
            recordId: batch.id,
            actorRole: actor.role,
            actorId: actor.id,
            actorName: actor.name,
            action: 'Recommendation letter sent to Certification',
            timestamp: at,
          });
          notify(log, at, { recipientRole: 'QP', title: 'Results batch approved', body: `"${batch.qualificationTitle}" results are approved. Your Outcome Letter is ready to download.` });
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
  submit(3, 'Welding', -45, 'CCCN', 25).adReview(LINDIWE, 22, { evidenceNotes: false, answered: 6 }).done();
  submit(4, 'Electrical Trades', -60, 'CCA', 40)
    .adReview(LINDIWE, 36, { evidenceNotes: true, answered: 14, evidenceFile: 'Marking_Venue_Attendance_Register.pdf' })
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
    .adReview(RIAAN, 26, {
      ...full,
      overrides: { c: { answer: 'no', comment: 'The moderation report has no moderator sign-off for one learner.' } },
    })
    .act('ad-advance', RIAAN, 24)
    .act(
      'dd-request-evidence',
      GRACE,
      20,
      'The moderation report has no moderator sign-off for Andile Khumalo, and the marksheet total for Kgomotso Letsoalo does not match the result. Correct both and resubmit.',
    )
    .done();

  // Batch N1: a final decline. The DD and the Director recommended it while sending the batch on;
  // only the Chief Director declined it. No Post-EISA visit, no resubmit.
  submit(12, 'Electrical Trades', -190, 'NA', 170)
    .adReview(LINDIWE, 166, {
      ...full,
      overrides: {
        f: { answer: 'no', comment: 'The marking irregularities mean the session cannot be treated as fully credible.' },
        g: { answer: 'no', comment: 'The marking report totals do not match the learner marksheets for two learners.' },
        h: { answer: 'no', comment: 'The moderation report is dated before the marking was completed.' },
      },
      free: {
        irregularitySummary: 'The marking report totals do not match the marksheets, and the moderation was signed before marking finished.',
        impactOnApproval: 'negative',
        recommendationFurtherAction: 'Decline the results; the QP must re-mark and repeat the moderation.',
        badPractices: 'Moderation signed off before the marking was complete.',
        goodPractices: 'None noted.',
      },
    })
    .act('ad-advance', LINDIWE, 164)
    .act('dd-recommend-decline', GRACE, 158, 'The marking report does not match the learner marksheets for two of the three learners who wrote.')
    .act('director-recommend-decline', ZANELE, 153, 'Agreed. The moderation report was signed before the marking was finished.')
    .act('chief-director-decline', BUSISIWE, 147, undefined, {
      irregularities: [
        'The marking report totals do not match the learner marksheets for two learners.',
        'The moderation report is dated before the marking was completed.',
      ],
      correctiveActions: [
        'Re-mark the affected scripts and issue a corrected marking report.',
        'Repeat the moderation after the corrected marking and submit a signed moderation report.',
      ],
    })
    .done();

  // Batch W: decided batches keep the code numbered at their decision; every other batch gets one as
  // it reached the ASD (the same allocateMissingCodes the api runs on load).
  const withCodes = allocateMissingCodes(assignVerificationCodes(batches), 'eisa', {
    reachedAsd: () => true,
    allocatedOn: (b) => dateOf(b.submittedAt),
    lastDate: lastEisaDateOf,
  });

  // Newest first, the order submitResultsBatch() leaves the list in.
  return withCodes.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

// Batch N1: codes are numbered per financial year in the order of the decisions, the way
// api.ts numbers them as the decisions are made.
function assignVerificationCodes(batches: ResultsBatch[]): ResultsBatch[] {
  const existing: string[] = [];
  const decided = batches.filter((b) => b.finalDecision).sort((a, b) => (a.finalDecision?.decidedAt ?? '').localeCompare(b.finalDecision?.decidedAt ?? ''));
  for (const batch of decided) {
    if (!batch.finalDecision) continue;
    const code = buildVerificationCode('eisa', lastEisaDateOf(batch), dateOf(batch.finalDecision.decidedAt), existing);
    existing.push(code);
    batch.finalDecision = { ...batch.finalDecision, verificationCode: code };
    batch.verificationCode = code;
  }
  return batches;
}

// QCTO feedback 05.24: the saved draft behind the Welding sitting at today - 20 — the first two
// learners captured (one competent, one with a mark below the pass mark in the first component),
// the third learner still blank. The draft holds marks only; the checks apply at Submit.
export function seedResultsDrafts(confirmations: EisaConfirmationRecord[], qasas: QsaAddendumApplication[], sittings: EisaSitting[]): ResultsDraft[] {
  const date = workingDateFromToday(-20);
  const confirmation = confirmations.find((c) => c.qualificationTitle === 'Welding' && c.sittingDate === date);
  if (!confirmation) throw new Error(`Demo seed: no EISA Confirmation for Welding ${date}.`);
  const { components } = snapshotResultsRules(qasas, { ...confirmation, componentDates: componentDatesOf(sittings, confirmation.sittingId) });
  if (components.length === 0) throw new Error('Demo seed: the approved QASA for Welding has no assessment components.');
  const [first] = components;
  const learnerResults: EisaLearnerResult[] = confirmation.learners.map((l, i) => {
    if (i === 0) return { learnerId: l.learnerId, fullName: l.fullName, idNumber: idNumberOf(l.learnerId), absent: false, marks: seedMarks(components, 'C', i) };
    if (i === 1) return { learnerId: l.learnerId, fullName: l.fullName, idNumber: idNumberOf(l.learnerId), absent: false, marks: { [first.id]: Math.max(0, first.lowestMark - 5) } };
    return { learnerId: l.learnerId, fullName: l.fullName, idNumber: idNumberOf(l.learnerId), absent: false, marks: {} };
  });
  // The draft must be genuinely unfinished: the first learner passes the checks, the others do not.
  if (markEntryIssues(components, learnerResults.slice(0, 1)).length > 0 || markEntryIssues(components, learnerResults.slice(1)).length === 0) {
    throw new Error('Demo seed: the results draft is not in the unfinished state it should show.');
  }
  const qp = seedPerson(confirmation.qpId);
  return [{ sittingId: confirmation.sittingId, learnerResults, savedAt: createClock().at(2, 15), savedBy: qp.name }];
}
