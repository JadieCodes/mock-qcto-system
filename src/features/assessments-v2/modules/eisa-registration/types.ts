import type { WorkflowRecordState } from '../../shared/workflow/types';

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

// CR-038: a flag lives on the individual learner's SOR, not on the whole registration — the
// SDP corrects and re-uploads just that learner's SOR without the record leaving AD review.
export type SorStatus = 'pending' | 'flagged';

export interface RegistrationLearner {
  learnerId: string;
  fullName: string;
  idNumber: string;
  sor: SorFile | null;
  sorStatus: SorStatus;
  sorFlagReason: string | null;
  // CR-042: drives the automatic Site Visits monitoring-item trigger.
  rplArpl: boolean;
  addedAt: string;
}

// PM-08: the Non-Trades path additionally prepares files for the QP and shares the SDP list
// with Quality Assurance once the registration number is created.
export interface NonTradesHandoff {
  filesPreparedAt: string;
  sdpListSharedAt: string;
}

export interface EisaRegistrationRecord {
  id: string;
  sittingId: string;
  sittingDate: string;
  qualificationTitle: string;
  // Carried over from the EISA Calendar sitting (EisaSitting.qpName) at startRegistration() —
  // needed so the CR-042/CR-044 automatic monitoring item can carry a real QP name instead of
  // a placeholder (Phase 6 fix).
  qpName: string;
  sdpName: string;
  category: RegistrationCategory;

  // stageId: 'sdp-submission' | 'ad-review' | 'registered'
  workflow: WorkflowRecordState;

  learners: RegistrationLearner[];
  supportingDocuments: SupportingDocument[];
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
  sdpName: string;
  category: RegistrationCategory;
  createdBy: string;
}
