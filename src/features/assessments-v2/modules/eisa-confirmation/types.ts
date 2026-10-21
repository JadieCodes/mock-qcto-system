import type { WorkflowRecordState } from '../../shared/workflow/types';
import type { Role } from '../../types';

// CR-043: formerly "EISA Notification" — use "EISA Confirmation" everywhere.
export interface ConsolidatedLearnerRow {
  learnerId: string;
  fullName: string;
  sdpName: string;
  // Assumption: the assessment centre defaults to the registering SDP — see progress.md.
  assessmentCentre: string;
}

export interface CentreConfirmation {
  centre: string;
  learnerCount: number;
}

export interface EisaConfirmationRecord {
  id: string;
  sittingId: string;
  sittingDate: string;
  qualificationTitle: string;
  qpName: string;
  registrationIds: string[];
  learners: ConsolidatedLearnerRow[];
  centres: string[];

  // Filled in once the QP confirms (CR-043).
  confirmedCentres: CentreConfirmation[] | null;
  markingDate: string | null;
  moderationDate: string | null;

  // stageId: 'awaiting-qp-ack' | 'awaiting-qp-confirmation' | 'confirmed'
  workflow: WorkflowRecordState;

  generatedBy: string;
  generatedAt: string;
}

export interface GenerateConfirmationInput {
  sittingId: string;
  generatedBy: string;
}

export interface ConfirmDetailsInput {
  recordId: string;
  centres: CentreConfirmation[];
  markingDate: string;
  moderationDate: string;
  actorRole: Role;
  actorName: string;
}
