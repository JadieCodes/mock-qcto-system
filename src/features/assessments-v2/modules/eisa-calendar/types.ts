import type { WorkflowRecordState } from '../../shared/workflow/types';

// CR-031: status covers the full lifecycle of one sitting date.
export type EisaSittingStatus = 'proposed' | 'approved' | 'rejected' | 'published' | 'postponed' | 'cancelled';

export interface EisaSitting {
  id: string;
  // CR-027: null when a QCTO official added this date directly; set when it came from a QP's
  // proposed batch (CR-028/CR-029).
  batchId: string | null;
  qualificationTitle: string;
  qpName: string;
  year: number;
  date: string; // ISO yyyy-mm-dd
  status: EisaSittingStatus;
  rejectionReason: string | null;
  postponementReason: string | null;
  cancellationReason: string | null;
  createdBy: string;
  createdAt: string;
}

// CR-030: a QP submits several dates at once for one qualification/year; the whole batch is
// reviewed together, since the required count only makes sense as a set.
export interface EisaSittingBatch {
  id: string;
  qualificationTitle: string;
  qpName: string;
  year: number;
  requiredCount: number;
  dates: string[];
  state: WorkflowRecordState; // stageId: 'qcto-review' | 'approved' | 'rejected' | 'published'
  rejectionReason: string | null;
  submittedBy: string;
  submittedAt: string;
}

export interface EligibleQualification {
  qualificationTitle: string;
  qpName: string;
  // CR-030: the approved EISA frequency, carried over from the QSA Addendum's evaluation
  // report. Null if, somehow, an approved addendum never had this recorded.
  approvedEisaSittingsPerYear: number | null;
}

export interface ProposeSittingBatchInput {
  qualificationTitle: string;
  qpName: string;
  year: number;
  dates: string[];
  submittedBy: string;
}

export interface AddSittingInput {
  qualificationTitle: string;
  qpName: string;
  year: number;
  date: string;
  createdBy: string;
}

export interface EditSittingInput {
  qualificationTitle: string;
  qpName: string;
  year: number;
  date: string;
}

export interface DateCheckResult {
  date: string;
  ok: boolean;
  reasons: string[];
}
