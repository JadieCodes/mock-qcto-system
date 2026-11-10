import type { ChecklistSection } from '../../shared/checklist/types';
import type { WorkflowRecordState } from '../../shared/workflow/types';
import type { AssessmentComponentType } from '../qsa-addendum/types';

// QCTO feedback 29.23: what an EISA evidence upload is. The list is our reading of the 29 Oct
// meeting until QCTO confirms it (progress.md, Batch M). FISA keeps its own list (FisaEvidenceTag).
export type EisaEvidenceTag = 'marking-report' | 'moderation-report' | 'confirmation-letter' | 'attendance-register' | 'other';

// UI-only upload: the file's details and the QP's tag, never the file itself.
export interface EvidenceDocument {
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  tag: EisaEvidenceTag;
}

// QCTO feedback 29.25: the documents QCTO already holds for the qualification's validated EISA
// instrument. The QP confirms each one or replaces it with a new file.
export type OnFileDocumentId =
  | 'confidentiality-agreement-developer'
  | 'confidentiality-agreement-moderator'
  | 'cv-developer'
  | 'cv-moderator'
  | 'instrument-development-report'
  | 'instrument-validation-report';

export interface OnFileDocument {
  id: OnFileDocumentId;
  label: string;
  fileName: string;
  fileSize: number;
}

export type OnFileChoice = 'confirmed' | 'replaced';

export interface ReplacementFile {
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

// What the QP chose for one "Already on file" document, kept on the batch.
export interface OnFileDocumentRecord extends OnFileDocument {
  choice: OnFileChoice;
  replacement: ReplacementFile | null;
  decidedBy: string;
  decidedAt: string;
}

// The QP's choice while the submit screen is open (no name or date yet).
export interface OnFileDocumentChoice {
  documentId: OnFileDocumentId;
  choice: OnFileChoice;
  replacement: ReplacementFile | null;
}

// Row 40 (H-05/H-11/H-12/G-24): one result per learner, not a single hand-typed count.
// FISA results keep one outcome per learner (QCTO feedback 3.14); EISA results are per
// component since 29.31 (EisaLearnerResult below).
// Batch N1: a FISA learner can also be absent (the outcome letter counts them).
export type LearnerResultOutcome = 'competent' | 'not-yet-competent' | 'absent';

export interface LearnerResult {
  learnerId: string;
  fullName: string;
  // Batch L2.1: stored on the batch so the lists and downloads can show it next to the name.
  idNumber: string;
  outcome: LearnerResultOutcome;
}

// QCTO feedback 29.31: a component of the EISA, snapshotted from the approved QASA when the
// results batch is created, so later QASA changes do not move a batch's results.
export interface ResultsComponent {
  id: string;
  name: string;
  type: AssessmentComponentType;
  weightingPercent: number;
  // Batch L1.1: QCTO's "Highest Mark" (the component total) and "Lowest Mark" (the competence
  // mark for this component), copied from the QASA.
  highestMark: number;
  lowestMark: number;
  // QCTO feedback 29.32: each component has its own EISA date (componentDates.ts).
  eisaDate: string;
  // Batch N2: the QASA's "days" for the component (the verification report's Duration column).
  days?: number;
}

// QCTO feedback 29.31: a mark per component, or Absent. The result, the weighted score and the
// batch figures are always calculated (calculation.ts), never stored.
export interface EisaLearnerResult {
  learnerId: string;
  fullName: string;
  // Batch L2.1: copied from the learner record when the batch is submitted.
  idNumber: string;
  absent: boolean;
  // Component id -> mark. Empty when the learner was absent.
  marks: Record<string, number>;
}

// QCTO feedback 29.26: the one-click declaration on EISA results. Same shape as the FISA one.
export type ResultsDeclaration = FisaResultsDeclaration;

export interface ResultsDeclineEntry {
  stageId: string;
  decidedBy: string;
  reason: string;
  decidedAt: string;
}

// CR-059 hand-off: simulated — the Certification domain itself is out of scope. Batch N1: set
// when the recommendation letter is sent to Certification (final approval only).
export interface CertificationRecommendation {
  recommendedAt: string;
  recommendedBy: string;
}

// Batch N1: the Deputy Director or Director sends the batch on but recommends a decline. It shows
// to the next role; only the Chief Director can decline.
export interface DeclineRecommendation {
  stageId: string;
  recommendedBy: string;
  reason: string;
  recommendedAt: string;
  cycle: number;
}

// Batch N1: the final decision on a batch (approved or declined), with the verification code
// that goes on every letter, report and register line. Set once, never changed.
export interface ResultsFinalDecision {
  outcome: 'approved' | 'declined';
  decidedAt: string;
  decidedBy: string;
  decidedById: string;
  verificationCode: string;
  // Declined only: the Chief Director's two lists (one or more lines each).
  irregularities: string[];
  correctiveActions: string[];
  // Who acted in the deciding cycle, for the recommendation letter's signature lines.
  asdName: string;
  ddName: string;
  directorName: string;
}

// Batch N2: where each learner on the batch came from, copied from the sitting's registrations and
// EISA Confirmation when the batch is created (QCTO's verification report and tracking register
// count candidates per SDP and per RPL). rpl is the registration's RPL/ARPL flag.
export interface ResultsSourceLearner {
  learnerId: string;
  sdpName: string;
  rpl: boolean;
}

export interface ResultsSourceInfo {
  // The date the EISA Confirmation (formerly the EISA Notification) was generated.
  notifiedAt: string;
  learners: ResultsSourceLearner[];
}

export type EisaImpactOnApproval = 'negative' | 'sorted';

// Batch N2: section 2 of QCTO's "EISA Quality Assurance Verification Report" plus the free text
// of sections 2 and 5. checklist holds the Yes/No lines (a comment on every line, CR-011); lines
// k and m are free text only.
export interface EisaReview {
  checklist: ChecklistSection[];
  // Line f.
  irregularitySummary: string;
  impactOnApproval: EisaImpactOnApproval | null;
  // Line k.
  analysisSummary: string;
  // Line m.
  sampleVerificationComment: string;
  sampleRemedialAction: string;
  // Section 5.
  recommendationFurtherAction: string;
  badPractices: string;
  goodPractices: string;
}

// Batch N2: QCTO's "Approval of Results letter checklist", ticked by the Deputy Director against the
// draft Outcome Letter. "Correct verification number" is never stored: it shows as ticked once the
// batch has its final decision (letterChecklist.ts).
export interface DdLetterChecklist {
  checkedIds: string[];
  completedBy: string | null;
  completedById: string | null;
  completedAt: string | null;
}

// stageId: 'ad-review' | 'dd-review' | 'director-review' | 'chief-director-review' |
// 'more-evidence' | 'approved' | 'declined' (final). See workflow.ts RESULTS_WORKFLOW.
export interface ResultsBatch {
  id: string;
  sittingId: string;
  // QCTO feedback 29.32: shown as the "EISA date" (the date of the first component).
  sittingDate: string;
  qualificationTitle: string;
  // Batch N1: copied from the approved QASA when the batch is created (outcome letter table).
  saqaId: string;
  nqfLevel: string;
  credits: string;
  // Batch N1: the assessment centres on the sitting's EISA Confirmation.
  centres: string[];
  qpId: string;
  qpName: string;

  learnerCount: number;
  // QCTO feedback 29.31: the approved QASA's components at the time the batch was created.
  components: ResultsComponent[];
  // Batch L1.1: the QASA's Addendum pass % at the time the batch was created.
  addendumPassPercent: number;
  // Row 40 / 29.31: a result per learner on the sitting's EISA Confirmation, with a mark per
  // component or Absent. The batch figures (calculation.ts batchFiguresOf) are derived from
  // these, not stored separately.
  learnerResults: EisaLearnerResult[];
  evidenceDocuments: EvidenceDocument[];
  // Batch W: allocated when the batch first reaches the ASD (verificationCode.ts); finalDecision carries the same code.
  // Optional so a batch stored before Batch W still loads — read it through verificationCodeOf().
  verificationCode?: string;
  // QCTO feedback 29.25: each "Already on file" document and what the QP chose for it.
  onFileDocuments: OnFileDocumentRecord[];
  // QCTO feedback 29.26.
  declaration: ResultsDeclaration;

  // CR-059: the ASD's three-part review before the batch can advance.
  complianceReviewNotes: string;
  evidenceEvaluationNotes: string;
  // Batch N2: the old four-folder checklist. New batches hold none; a batch stored before N2 keeps
  // its answers, shown read-only as "Previous checklist".
  complianceChecklist: ChecklistSection[];
  eisaReview: EisaReview;
  ddChecklist: DdLetterChecklist | null;
  sourceInfo: ResultsSourceInfo;

  workflow: WorkflowRecordState;
  cycleCount: number;
  // Batch N1: every "Request more evidence" (the name is kept; a final decline is finalDecision).
  declineHistory: ResultsDeclineEntry[];
  declineRecommendations: DeclineRecommendation[];
  // "Date additional evidence requested" / "Date final outstanding evidence received".
  evidenceRequestedAt: string | null;
  finalEvidenceReceivedAt: string | null;
  finalDecision: ResultsFinalDecision | null;

  // CR-059: 21 working days from the sitting date.
  submissionDeadline: string;
  submittedAt: string;

  recommendation: CertificationRecommendation | null;
  // PM-06: set once a Post-EISA Monitoring visit has been created from this batch.
  pemVisitId: string | null;

  createdBy: string;
}

export interface NewResultsBatchInput {
  sittingId: string;
  learnerResults: EisaLearnerResult[];
  evidenceDocuments: EvidenceDocument[];
  onFileChoices: OnFileDocumentChoice[];
  declarationAccepted: boolean;
  submittedBy: string;
  submittedById: string;
}

// ---------------------------------------------------------------------------
// QCTO feedback 3.14: FISA results. FISA is decentralised — there is no QP; the SDP conducts
// the assessment and submits the batch against an Approved FISA Standard (skills programme).
// ---------------------------------------------------------------------------

export type ResultsTrack = 'eisa' | 'fisa';

// Batch N2: 'verification-report' is the SDP's Sections A-D of QCTO's FISA verification report.
// Batch P (05.18): QCTO's list of 5 Nov. 'learner-spreadsheet' is QCTO's Learner Data & Achievement
// sheet. The old 'marksheet' and 'moderation-report' tags are mapped on load (fisaApi.ts).
export type FisaEvidenceTag =
  | 'assessment-instrument'
  | 'learner-spreadsheet'
  | 'verification-report'
  | 'attendance-register'
  | 'completed-practical-rubric'
  | 'other';

// UI-only upload: the file's details and the SDP's tag, never the file itself.
export interface TaggedEvidenceDocument {
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  tag: FisaEvidenceTag;
}

export interface FisaResultsDeclaration {
  acceptedBy: string;
  acceptedById: string;
  acceptedAt: string;
}

// Generated at the final decision (approval or decline) and sent to the SDP (in-app notification).
export interface FisaApprovalLetterRecord {
  generatedAt: string;
  signedBy: string;
  sentToSdpAt: string;
}

export type FisaRecommendation = 'approval' | 'non-approval';
export type FisaCompliance = 'complied' | 'not-complied';

// Batch N2: what QCTO's FISA report Section E needs besides what the system already knows. The ASD
// fills E1, the Deputy Director the compliance statement in E2.
export interface FisaSectionE {
  qctoMonitoringDate: string;
  periodOfSkillsProgramme: string;
  learnersViaTraining: number | null;
  learnersViaRpl: number | null;
  recommendation: FisaRecommendation | null;
  nonCompliance: string;
  ddCompliance: FisaCompliance | null;
  ddComment: string;
}

// stageId: 'sdp-draft' | 'ad-review' | 'dd-review' | 'director-review' |
// 'chief-director-review' | 'more-evidence' | 'approved' | 'declined' (final). See workflow.ts FISA_RESULTS_WORKFLOW.
export interface FisaResultsBatch {
  id: string;
  fisaStandardId: string;
  skillsProgrammeTitle: string;
  // Batch N1: the skills programme details for the outcome letter, copied when the batch is created.
  skillsProgrammeId: string;
  nqfLevel: string;
  credits: string;
  // Batch N1: the date(s) the FISA was held, chosen by the SDP.
  fisaDates: string[];
  // Batch W: allocated when the batch first reaches the ASD; finalDecision carries the same code.
  verificationCode?: string;
  sdpId: string;
  sdpName: string;

  learnerResults: LearnerResult[];
  evidenceDocuments: TaggedEvidenceDocument[];
  declaration: FisaResultsDeclaration | null;

  complianceReviewNotes: string;
  evidenceEvaluationNotes: string;
  complianceChecklist: ChecklistSection[];

  // Batch N1: entered by the ASD in the review; printed on the outcome letter.
  recommendationsForImprovement: string;
  sectionE: FisaSectionE;

  workflow: WorkflowRecordState;
  cycleCount: number;
  declineHistory: ResultsDeclineEntry[];
  declineRecommendations: DeclineRecommendation[];
  evidenceRequestedAt: string | null;
  finalEvidenceReceivedAt: string | null;
  finalDecision: ResultsFinalDecision | null;

  createdAt: string;
  createdBy: string;
  createdById: string;
  // Empty until the SDP submits. submittedAt moves on a resubmission; firstSubmittedAt does not
  // (Batch N2: "Date Results Received" in the tracking register).
  submittedAt: string | null;
  firstSubmittedAt: string | null;

  recommendation: CertificationRecommendation | null;
  approvalLetter: FisaApprovalLetterRecord | null;
}

export interface NewFisaResultsBatchInput {
  fisaStandardId: string;
  fisaDate: string;
  sdpId: string;
  sdpName: string;
  createdBy: string;
  createdById: string;
}

// What the SDP's draft saves as it is edited.
export interface FisaResultsDraftPatch {
  learnerResults?: LearnerResult[];
  evidenceDocuments?: TaggedEvidenceDocument[];
}

// ---------------------------------------------------------------------------
// QCTO feedback 05.24: the QP's results capture screen.
// ---------------------------------------------------------------------------

// A learner on the sitting's EISA Confirmation, with the ID number the QA domain holds for them
// (05.23: the capture screen flags an invalid stored ID, and File 3 rows are matched on it).
export interface CaptureLearner {
  learnerId: string;
  fullName: string;
  idNumber: string;
}

// "Save draft": unfinished marks kept for a sitting that has no batch yet. Marks may be blank or
// out of range here — the checks only gate Submit. Removed when the batch is submitted.
export interface ResultsDraft {
  sittingId: string;
  learnerResults: EisaLearnerResult[];
  savedAt: string;
  savedBy: string;
}
