import type { ChecklistSection } from '../../shared/checklist/types';
import type { WorkflowRecordState } from '../../shared/workflow/types';

export interface EvidenceDocument {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

// Row 40 (H-05/H-11/H-12/G-24): one result per learner, not a single hand-typed count — the
// batch competency rate is calculated from these, not entered directly.
export type LearnerResultOutcome = 'competent' | 'not-yet-competent';

export interface LearnerResult {
  learnerId: string;
  fullName: string;
  outcome: LearnerResultOutcome;
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
  sittingDate: string;
  qualificationTitle: string;
  qpId: string;
  qpName: string;

  learnerCount: number;
  // Row 40: a result per learner, listing the learners from the sitting's EISA Confirmation
  // registrations. The batch competency rate (workflow.ts's competencyRatePercent) is derived
  // from these, not stored separately.
  learnerResults: LearnerResult[];
  evidenceDocuments: EvidenceDocument[];

  // CR-059: the Assistant Director's three-part review before the batch can advance.
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
  learnerResults: LearnerResult[];
  evidenceDocuments: EvidenceDocument[];
  submittedBy: string;
  submittedById: string;
}
