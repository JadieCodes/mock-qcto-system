import type { ChecklistSection } from '../../shared/checklist/types';
import type { WorkflowRecordState } from '../../shared/workflow/types';

export interface EvidenceDocument {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
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
  competentCount: number;
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
  competentCount: number;
  evidenceDocuments: EvidenceDocument[];
  submittedBy: string;
  submittedById: string;
}
