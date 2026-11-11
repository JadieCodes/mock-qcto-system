import type { WorkflowRecordState } from '../../shared/workflow/types';
import type { Role } from '../../types';
import type { AssessmentComponentType } from '../qsa-addendum/types';
import type { ComponentDaySlot } from './componentDays';

// CR-031: status covers the full lifecycle of one sitting date.
export type EisaSittingStatus = 'proposed' | 'approved' | 'rejected' | 'published' | 'postponed' | 'cancelled';

// Batch Q2 (29.12): one EISA date for one day of one QASA component.
export interface SittingComponentDate {
  componentId: string;
  componentName: string;
  componentType: AssessmentComponentType;
  day: number; // 1-based
  date: string; // ISO yyyy-mm-dd
}

export interface BatchSittingInput {
  componentDates: SittingComponentDate[];
}

export interface EisaSitting {
  id: string;
  // CR-027: null when a QCTO official added this date directly; set when it came from a QP's
  // proposed batch (CR-028/CR-029).
  batchId: string | null;
  // QCTO feedback 2.3: optional so sittings stored before it was added still load — screens
  // fall back to a directory lookup by name (sittingDetails.ts).
  qualificationId?: string | null;
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  year: number;
  // Batch Q2: with componentDates this is always the EARLIEST component date, so registration
  // closing, lists and every other reader work unchanged.
  date: string; // ISO yyyy-mm-dd
  // Batch Q2 (29.12): a date for every day of every component of the approved QASA. Optional so
  // older sittings, and qualifications whose QASA has no components, still load and show as before.
  componentDates?: SittingComponentDate[];
  status: EisaSittingStatus;
  rejectionReason: string | null;
  postponementReason: string | null;
  // Row 22/23 (D-11): optional, ASD-entered when postponing — shown in the SDP notification
  // and the audit trail. No negotiation; the QP/SDP cannot counter it.
  proposedNewDate: string | null;
  cancellationReason: string | null;
  // QCTO feedback 29.13: the approved QASA says EISA sittings are on demand, so the shorter notice
  // and the five-working-day registration closing apply. Optional so older sittings still load.
  onDemand?: boolean;
  // Batch S (05.11): the super admin moved this sitting's registration closing date. When set it
  // replaces the calculated date everywhere (registrationClosing.ts closingDateOf).
  registrationClosingOverride?: RegistrationClosingOverride | null;
  createdBy: string;
  createdAt: string;
}

export interface RegistrationClosingOverride {
  date: string; // ISO yyyy-mm-dd
  reason: string;
  calculatedDate: string;
  changedByName: string;
  changedAt: string;
}

export interface BatchRejectionHistoryEntry {
  reason: string;
  rejectedAt: string;
}

// CR-030: a QP submits several dates at once for one qualification/year; the whole batch is
// reviewed together, since the required count only makes sense as a set.
export interface EisaSittingBatch {
  id: string;
  qualificationId?: string | null;
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  year: number;
  requiredCount: number;
  // QCTO feedback 2.4: an "On demand" qualification has no minimum number of dates. Optional so
  // batches stored before it was added still load.
  onDemand?: boolean;
  // Each sitting's earliest date (Batch Q2: `sittings` holds the component dates behind them, in the same order).
  dates: string[];
  sittings?: BatchSittingInput[];
  state: WorkflowRecordState; // stageId: 'qcto-review' | 'approved' | 'rejected' | 'published'
  rejectionReason: string | null;
  // Row 21 (D-08): every past rejection stays visible even after the QP corrects and
  // resubmits — `rejectionReason` only ever holds the latest one.
  rejectionHistory: BatchRejectionHistoryEntry[];
  submittedBy: string;
  submittedAt: string;
}

// QCTO feedback 1.8: every qualification with accredited SDPs, approved QASA or not.
export interface EligibleQualification {
  qualificationId: string;
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  // CR-030: the approved QASA's approvedEisaSittingsPerYear when there is one, otherwise
  // config.ts DEFAULT_SITTINGS_PER_YEAR.
  sittingsPerYear: number;
  sittingsPerYearIsDefault: boolean;
  // QCTO feedback 2.4: the approved QASA says "On demand" — no minimum number of dates.
  onDemand: boolean;
  // QCTO feedback 3.4: pre-filled in the bulk upload template from the QASA, when there is one.
  nqfLevel: string | null;
  credits: string | null;
  // Batch Q2 (29.12): the date slots asked per sitting, from the approved QASA's components
  // (componentDays.ts); a single "EISA date" slot when the QASA has none.
  componentSlots: ComponentDaySlot[];
}

export interface ProposeSittingBatchInput {
  qualificationId: string;
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  year: number;
  dates: string[];
  // Batch Q2: when set, one entry per sitting and `dates` holds each one's earliest date.
  sittings?: BatchSittingInput[];
  submittedBy: string;
  submittedById: string;
}

export interface AddSittingInput {
  qualificationId: string | null;
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  year: number;
  date: string;
  componentDates?: SittingComponentDate[];
  createdBy: string;
  createdById: string;
}

export interface EditSittingInput {
  qualificationId: string | null;
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  year: number;
  date: string;
  componentDates?: SittingComponentDate[];
}

// QCTO feedback 2.4: a postponement or cancellation of a published sitting is a request that
// goes up a recommend/decide chain, never a direct action.
export type ChangeRequestKind = 'postponement' | 'cancellation';

// UI-only upload, as every upload in v2: the file's details are kept, never its contents.
export interface FormalLetterFile {
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

export interface ChangeRequestRecommendation {
  role: Role;
  personId: string;
  personName: string;
  // QCTO 05.10: "Recommend" or "Do not recommend". Optional so older records read as "Recommend".
  recommends?: boolean;
  comment: string | null;
  at: string;
}

export interface EisaSittingChangeRequest {
  id: string;
  kind: ChangeRequestKind;
  sittingId: string;
  sittingDate: string;
  qualificationId: string | null;
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  // Postponement only.
  proposedNewDate: string | null;
  // Batch Q2: a new date per component day when the sitting has component dates; proposedNewDate
  // is the earliest of them.
  proposedComponentDates?: SittingComponentDate[];
  reason: string;
  letter: FormalLetterFile;
  raisedByRole: Role;
  raisedBy: string;
  raisedById: string;
  raisedAt: string;
  // stageId: see workflow.ts POSTPONEMENT_REQUEST_WORKFLOW / CANCELLATION_REQUEST_WORKFLOW.
  state: WorkflowRecordState;
  recommendations: ChangeRequestRecommendation[];
  decision: 'approved' | 'declined' | null;
  decisionComment: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  // QCTO 05.10: the roles whose "Do not recommend" the decider approved against.
  decidedAgainst?: Role[];
}

export interface RaiseChangeRequestInput {
  kind: ChangeRequestKind;
  sittingId: string;
  proposedNewDate: string | null;
  proposedComponentDates?: SittingComponentDate[];
  reason: string;
  letter: FormalLetterFile;
  actorRole: Role;
  actorId: string;
  actorName: string;
  // Set for a QP, who may only raise a request on their own sitting.
  actorQpId?: string;
}

export interface DateCheckResult {
  date: string;
  ok: boolean;
  reasons: string[];
}
