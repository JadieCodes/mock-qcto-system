import type { ChecklistSection } from '../../shared/checklist/types';
import type { WorkflowRecordState } from '../../shared/workflow/types';

export type SchedulingParty = 'QP' | 'ASD';

export interface SlotProposal {
  id: string;
  date: string; // ISO yyyy-mm-dd
  time: string; // HH:mm
  venue: string;
  proposedBy: SchedulingParty;
  proposedByName: string;
  proposedAt: string;
}

export interface AgreedSlot {
  date: string;
  time: string;
  venue: string;
}

// CR-017: the QP cannot schedule alone — this is a propose -> accept / counter-propose
// negotiation between the ASD and the QP, not a one-sided booking.
export interface SchedulingState {
  workflow: WorkflowRecordState;
  proposals: SlotProposal[];
  agreedSlot: AgreedSlot | null;
}

export type PrefilledFieldKey =
  | 'qpName'
  | 'qpAddress'
  | 'qpContact'
  | 'qualificationTitle'
  | 'saqaId'
  | 'credits'
  | 'nqfLevel'
  | 'upcomingEisaDate';

export type PrefilledFieldAction = 'confirmed' | 'recaptured';

// CR-021: every pre-filled field needs an explicit confirm-or-recapture action before an
// outcome can be recorded.
export interface PrefilledField {
  key: PrefilledFieldKey;
  label: string;
  value: string;
  action: PrefilledFieldAction | null;
}

export type ValidationOutcomeDecision = 'approved' | 'approved-with-conditions' | 'not-approved';

export interface ValidationOutcome {
  cycle: number;
  decision: ValidationOutcomeDecision;
  notes: string;
  decidedBy: string;
  decidedAt: string;
}

export interface InstrumentFile {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export interface InstrumentValidationRecord {
  id: string;
  // Links back to the approved QSA Addendum this instrument is checked against.
  qsaAddendumId: string;
  qpId: string;
  qpName: string;
  qualificationTitle: string;
  createdAt: string;
  createdBy: string;

  scheduling: SchedulingState;

  // CR: instrument upload is UI-only — picking a file, storing its name/size.
  instrument: InstrumentFile | null;
  // Which validation attempt this is. Starts at 1; increments every time the ASD records
  // "Not approved" and the QP must fix and resubmit (the CR-023 loop).
  cycleCount: number;

  prefilledFields: PrefilledField[];
  checklist: ChecklistSection[];

  validationWorkflow: WorkflowRecordState;
  outcomeHistory: ValidationOutcome[];

  // CR-024: completing validation only flips this. Nothing here ever creates or opens an
  // EISA Registration record.
  instrumentStatus: 'not-validated' | 'validated';
}

export interface NewValidationInput {
  qsaAddendumId: string;
  qpId: string;
  qpName: string;
  qualificationTitle: string;
  createdBy: string;
}
