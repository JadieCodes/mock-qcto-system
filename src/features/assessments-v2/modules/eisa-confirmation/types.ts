import type { WorkflowRecordState } from '../../shared/workflow/types';
import type { Role } from '../../types';

// CR-043: formerly "EISA Notification" — use "EISA Confirmation" everywhere.
export type LearnerPathway = 'Formal' | 'RPL/ARPL';

// Batch T (29.20): one row of the consolidated learner list QCTO shares with the QP.
export interface ConsolidatedLearnerRow {
  learnerId: string;
  fullName: string;
  idNumber: string;
  sdpName: string;
  pathway: LearnerPathway;
  registrationNumber: string;
  // Set by the QP (29.21). Null until the learner is allocated to a centre.
  assessmentCentre: string | null;
}

export interface CentreConfirmation {
  centre: string;
  learnerCount: number;
}

// Batch T (29.20): one "Return to QP" by the ASD. `cycle` counts the returns (1 = the first).
export interface ConfirmationReturnEntry {
  cycle: number;
  reason: string;
  returnedAt: string;
  returnedBy: string;
  returnedById: string;
}

export interface EisaConfirmationRecord {
  id: string;
  sittingId: string;
  sittingDate: string;
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  registrationIds: string[];
  learners: ConsolidatedLearnerRow[];
  // The assessment centres the QP picked (all accredited for the qualification, 29.21).
  centres: string[];
  // Learner counts per centre, set when the QP submits.
  confirmedCentres: CentreConfirmation[] | null;
  // Every marking and moderation date the QP entered, oldest first. markingDate and moderationDate
  // are the first marking date and the last moderation date, read by Approval of Results.
  markingDates: string[];
  moderationDates: string[];
  markingDate: string | null;
  moderationDate: string | null;
  resultsSubmissionDate: string | null;

  // stageId: 'qp-draft' | 'with-asd' | 'accepted'
  workflow: WorkflowRecordState;
  returns: ConfirmationReturnEntry[];

  // When the list was shared with the QP (a timestamp on the day registration closed).
  sharedAt: string;
  draftSavedAt: string | null;
  submittedAt: string | null;
  acceptedAt: string | null;
  acceptedBy: string | null;
}

// What the QP builds. Used both to save a draft and to submit.
export interface ConfirmationDraftInput {
  recordId: string;
  centres: string[];
  allocation: Record<string, string | null>;
  markingDates: string[];
  moderationDates: string[];
  resultsSubmissionDate: string;
  actorId: string;
  actorName: string;
}

export interface SubmitConfirmationInput extends ConfirmationDraftInput {
  declarationAccepted: boolean;
}

export interface ReviewConfirmationInput {
  recordId: string;
  actorRole: Role;
  actorId: string;
  actorName: string;
  reason?: string;
}

// A sitting whose list is not shared yet.
export interface UpcomingShare {
  sittingId: string;
  sittingDate: string;
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  learnerCount: number;
  shareDate: string;
}
