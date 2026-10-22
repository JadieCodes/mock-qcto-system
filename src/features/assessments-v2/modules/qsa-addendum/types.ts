import type { ChecklistSection } from '../../shared/checklist/types';
import type { WorkflowRecordState } from '../../shared/workflow/types';

export type SaqaGateOutcome = 'registered' | 'not-registered';

export interface RequiredDocument {
  key: 'saqaQualificationDocument' | 'curriculumDocument' | 'qsaAddendumDocument';
  label: string;
  fileName: string;
  // CR-004: the gate check only decides where the document came from, nothing else.
  source: 'saqa-auto' | 'qp-upload';
}

export type EvaluationRecommendation = 'recommended' | 'not-recommended' | '';

export interface EvaluationReport {
  findings: string;
  recommendation: EvaluationRecommendation;
  // CR-030 assumption: captured here on the ASD's evaluation report until QCTO confirms the
  // real home for this value. Flagged as an open question in progress.md.
  approvedEisaSittingsPerYear: number | null;
}

export interface QsaAddendumApplication {
  id: string;

  // Submission fields (CR-003: no "Proposed EISA Date" on this form).
  // qpId is the stable identity the record belongs to; qpName stays for display.
  qpId: string;
  qpName: string;
  qualificationTitle: string;
  saqaId: string;
  dateRegisteredWithSaqa: string;
  nqfLevel: string;
  credits: string;
  submissionDate: string;
  notes: string;

  saqaGateOutcome: SaqaGateOutcome;
  documents: RequiredDocument[];

  // CR-005/CR-007: acknowledgement letter — stops at DD level.
  ackState: WorkflowRecordState;
  // CR-014 Flow 1: evaluation approval — ASD -> DD -> IAC.
  evalState: WorkflowRecordState;
  // CR-014 Flow 2: outcome letter — CEO signature only.
  outcomeState: WorkflowRecordState;
  // Approval letter — only exists once the outcome is approved.
  approvalState: WorkflowRecordState | null;

  qsaChecklist: ChecklistSection[];
  ddReviewChecklist: ChecklistSection[];
  evaluationReport: EvaluationReport;
  iacPresentationFileName: string | null;
}

export interface NewApplicationInput {
  qpId: string;
  qpName: string;
  qualificationTitle: string;
  saqaId: string;
  dateRegisteredWithSaqa: string;
  nqfLevel: string;
  credits: string;
  submissionDate: string;
  notes: string;
  saqaGateOutcome: SaqaGateOutcome;
  documents: RequiredDocument[];
}
