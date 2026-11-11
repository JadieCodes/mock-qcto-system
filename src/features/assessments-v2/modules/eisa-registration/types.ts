import type { WorkflowRecordState } from '../../shared/workflow/types';
import type { FlcCode, ReadinessTypeId, StatementStatus } from './readiness';

// CR-035, CR-019: registration is its own section, separate from EISA Instrument Validation.
export type RegistrationCategory = 'trades' | 'non-trades';

export interface SorFile {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface SupportingDocument {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

// Row 25 (E-10): a per-learner SOR status, independent of the registration's own workflow
// stage. `null` means no SOR has been uploaded yet. CR-038's flag still lives here too — the
// SDP corrects and re-uploads just that learner's SOR without the record leaving ASD review.
export type SorStatus = 'uploaded' | 'under-review' | 'accepted' | 'flagged' | 'replaced';

export interface RegistrationLearner {
  learnerId: string;
  fullName: string;
  idNumber: string;
  sor: SorFile | null;
  sorStatus: SorStatus | null;
  sorFlagReason: string | null;
  // Batch R2 (29.15): RPL/ARPL or formal comes from the readiness type (see readiness.ts
  // isRplArplType); it drives the counts and the CR-042 automatic Site Visits monitoring-item trigger.
  readinessType: ReadinessTypeId;
  // File 4 "readiness for EISA" columns. Dates are YYYY-MM-DD.
  statementStatus: StatementStatus;
  statementIssueDate: string | null;
  // The accredited assessment centre's name (File 4 holds its code).
  assessmentCentre: string | null;
  flc: FlcCode | null;
  flcStatementNumber: string | null;
  dateStamp: string | null;
  addedAt: string;
}

// Batch R1 (QCTO 6 Aug 2:03:42): a learner the ASD will not register. The learner leaves the
// registration's active list (`learners`) and is kept here with the reason.
export interface DeclinedLearner extends RegistrationLearner {
  declinedReason: string;
  declinedAt: string;
  declinedBy: string;
  declinedById: string;
}

// Batch R1: one "Return to SDP" by the ASD. `cycle` counts the returns (1 = the first).
export interface ReturnToSdpEntry {
  cycle: number;
  reason: string;
  returnedAt: string;
  returnedBy: string;
  returnedById: string;
}

// PM-08: the Non-Trades path additionally prepares files for the QP and shares the SDP list
// with Quality Assurance once the registration number is created.
export interface NonTradesHandoff {
  filesPreparedAt: string;
  sdpListSharedAt: string;
}

// Batch R2: the File 4 the registration was built from (the last clean upload).
export interface File4Upload {
  fileName: string;
  uploadedAt: string;
}

export interface EisaRegistrationRecord {
  id: string;
  sittingId: string;
  sittingDate: string;
  qualificationTitle: string;
  // Carried over from the EISA Calendar sitting (EisaSitting.qpName) at startRegistration() —
  // needed so the CR-042/CR-044 automatic monitoring item can carry a real QP name instead of
  // a placeholder (Phase 6 fix).
  qpId: string;
  qpName: string;
  sdpId: string;
  sdpName: string;
  category: RegistrationCategory;

  // stageId: 'sdp-submission' | 'ad-review' | 'registered'
  workflow: WorkflowRecordState;

  learners: RegistrationLearner[];
  // Batch R1: learners the ASD declined; never counted and never blocking.
  declinedLearners: DeclinedLearner[];
  // Batch R1: every "Return to SDP", oldest first. The last one is shown to the SDP while the
  // registration is back in their building stage.
  returns: ReturnToSdpEntry[];
  supportingDocuments: SupportingDocument[];
  // Batch R2: null when no File 4 was uploaded.
  file4: File4Upload | null;
  registrationNumber: string | null;
  nonTradesHandoff: NonTradesHandoff | null;
  // CR-042/CR-044: set once the automatic monitoring item has been created, so it only ever
  // fires once per registration.
  rplMonitoringItemId: string | null;

  createdBy: string;
  createdAt: string;
}

export interface NewRegistrationInput {
  sittingId: string;
  sdpId: string;
  sdpName: string;
  category: RegistrationCategory;
  createdBy: string;
  createdById: string;
}
