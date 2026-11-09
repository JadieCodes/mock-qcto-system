import type { ChecklistSection } from '../../shared/checklist/types';
import type { WorkflowRecordState } from '../../shared/workflow/types';
import type { AssessmentComponentType } from '../qsa-addendum/types';

export interface EvidenceDocument {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

// Row 40 (H-05/H-11/H-12/G-24): one result per learner, not a single hand-typed count.
// FISA results keep one outcome per learner (QCTO feedback 3.14); EISA results are per
// component since 29.31 (EisaLearnerResult below).
export type LearnerResultOutcome = 'competent' | 'not-yet-competent';

export interface LearnerResult {
  learnerId: string;
  fullName: string;
  outcome: LearnerResultOutcome;
}

// QCTO feedback 29.31: a component of the EISA, snapshotted from the approved QASA when the
// results batch is created, so later QASA changes do not move a batch's results.
export interface ResultsComponent {
  id: string;
  name: string;
  type: AssessmentComponentType;
  weightingPercent: number;
  totalMarks: number;
  passMark: number;
  // QCTO feedback 29.32: each component has its own EISA date (componentDates.ts).
  eisaDate: string;
}

// QCTO feedback 29.31: a mark per component, or Absent. The result, the weighted score and the
// batch figures are always calculated (calculation.ts), never stored.
export interface EisaLearnerResult {
  learnerId: string;
  fullName: string;
  absent: boolean;
  // Component id -> mark. Empty when the learner was absent.
  marks: Record<string, number>;
}

export interface ResultsDeclineEntry {
  stageId: string;
  decidedBy: string;
  reason: string;
  decidedAt: string;
}

// CR-059 hand-off: simulated — the Certification domain itself is out of scope.
export interface CertificationRecommendation {
  recommendedAt: string;
  recommendedBy: string;
}

// stageId: 'ad-review' | 'dd-review' | 'director-review' | 'chief-director-review' |
// 'approved' | 'declined'. See workflow.ts RESULTS_WORKFLOW.
export interface ResultsBatch {
  id: string;
  sittingId: string;
  // QCTO feedback 29.32: shown as the "EISA date" (the date of the first component).
  sittingDate: string;
  qualificationTitle: string;
  qpId: string;
  qpName: string;

  learnerCount: number;
  // QCTO feedback 29.31: the approved QASA's components at the time the batch was created.
  components: ResultsComponent[];
  // Row 40 / 29.31: a result per learner on the sitting's EISA Confirmation, with a mark per
  // component or Absent. The batch figures (calculation.ts batchFiguresOf) are derived from
  // these, not stored separately.
  learnerResults: EisaLearnerResult[];
  evidenceDocuments: EvidenceDocument[];

  // CR-059: the ASD's three-part review before the batch can advance.
  complianceReviewNotes: string;
  evidenceEvaluationNotes: string;
  complianceChecklist: ChecklistSection[];

  workflow: WorkflowRecordState;
  cycleCount: number;
  declineHistory: ResultsDeclineEntry[];

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
  submittedBy: string;
  submittedById: string;
}

// ---------------------------------------------------------------------------
// QCTO feedback 3.14: FISA results. FISA is decentralised — there is no QP; the SDP conducts
// the assessment and submits the batch against an Approved FISA Standard (skills programme).
// ---------------------------------------------------------------------------

export type ResultsTrack = 'eisa' | 'fisa';

export type FisaEvidenceTag = 'assessment-instrument' | 'marksheet' | 'moderation-report' | 'attendance-register' | 'other';

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

// Generated automatically at final approval and sent to the SDP (in-app notification).
export interface FisaApprovalLetterRecord {
  generatedAt: string;
  signedBy: string;
  sentToSdpAt: string;
}

// stageId: 'sdp-draft' | 'ad-review' | 'dd-review' | 'director-review' |
// 'chief-director-review' | 'approved' | 'declined'. See workflow.ts FISA_RESULTS_WORKFLOW.
export interface FisaResultsBatch {
  id: string;
  fisaStandardId: string;
  skillsProgrammeTitle: string;
  sdpId: string;
  sdpName: string;

  learnerResults: LearnerResult[];
  evidenceDocuments: TaggedEvidenceDocument[];
  declaration: FisaResultsDeclaration | null;

  complianceReviewNotes: string;
  evidenceEvaluationNotes: string;
  complianceChecklist: ChecklistSection[];

  workflow: WorkflowRecordState;
  cycleCount: number;
  declineHistory: ResultsDeclineEntry[];

  createdAt: string;
  createdBy: string;
  createdById: string;
  // Empty until the SDP submits.
  submittedAt: string | null;

  recommendation: CertificationRecommendation | null;
  approvalLetter: FisaApprovalLetterRecord | null;
}

export interface NewFisaResultsBatchInput {
  fisaStandardId: string;
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
