import type { ChecklistSection } from '../../shared/checklist/types';
import type { WorkflowRecordState } from '../../shared/workflow/types';

// CR-026: FISA is a fully independent process for Skills Programmes. It never joins the
// EISA/QSA Addendum flow, is never triggered by the SAQA gate check, and shares nothing with
// it except shared components (Checklist, workflow engine, audit trail, notifications).

// ---------------------------------------------------------------------------
// Stage 1 — FISA Standards (internal-only: Qualifications Development, ASD,
// Deputy Director, IAC, Qualifications Development Director & Team).
// ---------------------------------------------------------------------------

export interface SourceDocument {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export type StandardRecommendation = 'recommended' | 'not-recommended' | '';

export interface StandardEvaluationReport {
  findings: string;
  recommendation: StandardRecommendation;
}

export interface FisaStandardRecord {
  id: string;
  skillsProgrammeTitle: string;
  // PM-10: Qualifications Development supplies the source documents — no SAQA gate check.
  sourceDocuments: SourceDocument[];
  notes: string;

  // stageId: 'qd-submission' | 'asd-evaluation' | 'dd-review' | 'iac-review' | 'qd-signoff'
  //          | 'approved' | 'declined'
  workflow: WorkflowRecordState;

  checklist: ChecklistSection[];
  evaluationReport: StandardEvaluationReport;

  createdBy: string;
  createdAt: string;
}

export interface NewFisaStandardInput {
  skillsProgrammeTitle: string;
  sourceDocuments: SourceDocument[];
  notes: string;
  createdBy: string;
}

// ---------------------------------------------------------------------------
// Stage 2 & 3 — Instrument development + FISA Instrument Validation.
// Mirrors EISA Instrument Validation's shape (CR-023/CR-024), but the SDP (not
// a QP) submits, and there is no Deputy Director step anywhere (PM-01).
// ---------------------------------------------------------------------------

export interface FisaInstrumentFile {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export type FisaValidationDecision = 'approved' | 'approved-with-conditions' | 'not-approved';

export interface FisaValidationOutcome {
  cycle: number;
  decision: FisaValidationDecision;
  notes: string;
  decidedBy: string;
  decidedAt: string;
}

export interface FisaValidationRecord {
  id: string;
  // Links back to the approved FISA Standard the instrument is developed against.
  fisaStandardId: string;
  skillsProgrammeTitle: string;
  sdpId: string;
  sdpName: string;
  createdAt: string;
  createdBy: string;

  // CR: instrument development/upload is UI-only — picking a file, storing its name/size.
  instrument: FisaInstrumentFile | null;
  // Starts at 1; increments every time the ASD records "Not approved" and the SDP must fix
  // and resubmit.
  cycleCount: number;

  checklist: ChecklistSection[];
  // PM-11: allocated to a named ASD person, not a free-text name.
  allocatedAsdId: string | null;
  allocatedAsdName: string | null;

  // stageId: 'sdp-instrument' | 'awaiting-allocation' | 'asd-validation' | 'validated'
  workflow: WorkflowRecordState;
  outcomeHistory: FisaValidationOutcome[];

  instrumentStatus: 'not-validated' | 'validated';
}

export interface NewFisaValidationInput {
  fisaStandardId: string;
  sdpId: string;
  sdpName: string;
  createdBy: string;
}

// ---------------------------------------------------------------------------
// Stage 4 — FISA Registration. A simplified version of EISA Registration:
// no EISA Calendar to publish against (the SDP records the sitting date
// directly), no Trades/Non-Trades split, no RPL/ARPL indicator — those are
// EISA-specific. Reuses the same QA-domain learner/compliance data.
// ---------------------------------------------------------------------------

export interface FisaSorFile {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface FisaRegistrationLearner {
  learnerId: string;
  fullName: string;
  idNumber: string;
  sor: FisaSorFile | null;
  addedAt: string;
}

export interface FisaRegistrationRecord {
  id: string;
  // Links back to the validated FISA instrument this sitting is being registered against.
  fisaValidationId: string;
  skillsProgrammeTitle: string;
  sdpId: string;
  sdpName: string;
  sittingDate: string;

  // stageId: 'sdp-submission' | 'ad-review' | 'registered'
  workflow: WorkflowRecordState;

  learners: FisaRegistrationLearner[];
  registrationNumber: string | null;

  createdBy: string;
  createdAt: string;
}

export interface NewFisaRegistrationInput {
  fisaValidationId: string;
  sdpId: string;
  sdpName: string;
  sittingDate: string;
  createdBy: string;
}
