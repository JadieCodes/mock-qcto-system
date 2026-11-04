import type { ChecklistSection } from '../../shared/checklist/types';
import type { IacMinutesFile } from '../../shared/iac/types';
import type { WorkflowRecordState } from '../../shared/workflow/types';

// CR-026: FISA is a fully independent process for Skills Programmes. It never joins the
// EISA/QSA Addendum flow, is never triggered by the SAQA gate check, and shares nothing with
// it except shared components (Checklist, workflow engine, audit trail, notifications).

// ---------------------------------------------------------------------------
// Stage 1 — FISA Standards (internal-only: Qualifications Development, ASD,
// Deputy Director, Director Office, CEO; the IAC views).
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

  // stageId: 'qd-submission' | 'asd-evaluation' | 'dd-review' | 'director-office-review'
  //          | 'iac-review' | 'ceo-signature' | 'ceo-signature-declined' | 'approved' | 'declined'
  workflow: WorkflowRecordState;

  checklist: ChecklistSection[];
  evaluationReport: StandardEvaluationReport;
  // QCTO feedback 2.9: optional IAC committee minutes, uploaded by the DD with the outcome.
  // Optional so Standards stored before this change still load.
  iacMinutesFile?: IacMinutesFile | null;

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
