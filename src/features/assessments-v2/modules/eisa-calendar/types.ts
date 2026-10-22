import type { WorkflowRecordState } from '../../shared/workflow/types';

// CR-031: status covers the full lifecycle of one sitting date.
export type EisaSittingStatus = 'proposed' | 'approved' | 'rejected' | 'published' | 'postponed' | 'cancelled';

export interface EisaSitting {
  id: string;
  // CR-027: null when a QCTO official added this date directly; set when it came from a QP's
  // proposed batch (CR-028/CR-029).
  batchId: string | null;
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  year: number;
  date: string; // ISO yyyy-mm-dd
  status: EisaSittingStatus;
  rejectionReason: string | null;
  postponementReason: string | null;
  // Row 22/23 (D-11): optional, ASD-entered when postponing — shown in the SDP notification
  // and the audit trail. No negotiation; the QP/SDP cannot counter it.
  proposedNewDate: string | null;
  cancellationReason: string | null;
  createdBy: string;
  createdAt: string;
}

export interface BatchRejectionHistoryEntry {
  reason: string;
  rejectedAt: string;
}

// CR-030: a QP submits several dates at once for one qualification/year; the whole batch is
// reviewed together, since the required count only makes sense as a set.
export interface EisaSittingBatch {
  id: string;
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  year: number;
  requiredCount: number;
  dates: string[];
  state: WorkflowRecordState; // stageId: 'qcto-review' | 'approved' | 'rejected' | 'published'
  rejectionReason: string | null;
  // Row 21 (D-08): every past rejection stays visible even after the QP corrects and
  // resubmits — `rejectionReason` only ever holds the latest one.
  rejectionHistory: BatchRejectionHistoryEntry[];
  submittedBy: string;
  submittedAt: string;
}

export interface EligibleQualification {
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  // CR-030: the approved EISA frequency, carried over from the QSA Addendum's evaluation
  // report. Null if, somehow, an approved addendum never had this recorded.
  approvedEisaSittingsPerYear: number | null;
}

export interface ProposeSittingBatchInput {
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  year: number;
  dates: string[];
  submittedBy: string;
  submittedById: string;
}

export interface AddSittingInput {
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  year: number;
  date: string;
  createdBy: string;
  createdById: string;
}

export interface EditSittingInput {
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  year: number;
  date: string;
}

export interface DateCheckResult {
  date: string;
  ok: boolean;
  reasons: string[];
}
