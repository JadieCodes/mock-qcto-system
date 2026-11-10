import type { ChecklistSection } from '../../shared/checklist/types';
import type { WorkflowRecordState } from '../../shared/workflow/types';

// PM-09: not in the change request register yet — built behind a feature flag (see
// config/featureFlags.ts RPL_TOOLKIT_ENABLED), flagged in progress.md as pending a raised CR.
// Follows the same Application -> Evaluation -> Approval shape as the QSA Addendum, using the
// shared checklist component (CR-011's mandatory per-line comment applies here too).

export type RplToolkitType = 'new' | 'updated';

export type RplRecommendation = 'recommended' | 'not-recommended' | '';

// Batch W: QCTO's "QP RPL Evaluation". The QP answers every question (Yes / No / In process, with
// Notes / Evidence) when submitting; the ASD writes the QCTO feedback per question.
export type RplSelfAuditAnswer = 'yes' | 'no' | 'in-process';

export interface RplSelfAuditLine {
  answer: RplSelfAuditAnswer | null;
  // "n/a" is allowed under No, with the reason in the notes.
  notes: string;
  qctoFeedback: string;
}

// "Self audit checklist completed by".
export interface RplSelfAuditCompletedBy {
  fullName: string;
  designation: string;
  organisation: string;
  date: string;
}

export interface RplSelfAudit {
  // Keyed by question id (mock/data/rplToolkitChecklistItems.ts).
  lines: Record<string, RplSelfAuditLine>;
  completedBy: RplSelfAuditCompletedBy;
}

export type RplApproved = 'yes' | 'no' | '';

// "RPL Toolkit Approved (Yes / No)", "Comments" and "Evaluated by (QCTO official)".
export interface RplQctoEvaluation {
  approved: RplApproved;
  comments: string;
  evaluatedByName: string;
  evaluatedByDesignation: string;
  evaluatedOn: string;
}

// Before Batch W: the ASD's findings and recommendation. Kept so stored records load.
export interface RplEvaluationReport {
  findings: string;
  recommendation: RplRecommendation;
}

// QCTO feedback 3.13: a toolkit file the QP uploaded with the submission. UI-only, as every
// upload in v2: the file's details are kept, never its contents.
export interface RplToolkitFile {
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

export interface RplToolkitApplication {
  id: string;
  qpId: string;
  qpName: string;
  toolkitTitle: string;
  toolkitType: RplToolkitType;
  description: string;
  submissionDate: string;
  notes: string;

  // stageId: 'ad-allocation' | 'asd-evaluation' | 'qp-corrections' | 'dd-review'
  //          | 'director-team-review' | 'iac-review' | 'approved' | 'declined'
  evalState: WorkflowRecordState;
  // stageId: 'ceo-signature' | 'signed' — CEO signs the outcome only, no checklist (mirrors
  // the QSA Addendum's CR-008 rule).
  outcomeState: WorkflowRecordState;

  // PM-09 allocation: a named ASD person, not a free-text name.
  allocatedAsdId: string | null;
  allocatedAsdName: string | null;
  // Batch W: the checklist used before QCTO's own form. New toolkits hold none; one stored with
  // answers shows them read-only as "Answered on the previous checklist".
  checklist: ChecklistSection[];
  evaluationReport: RplEvaluationReport;
  // Batch W: optional so records stored before Batch W still load — read them through rpl-toolkit/selfAudit.ts.
  selfAudit?: RplSelfAudit;
  qctoEvaluation?: RplQctoEvaluation;

  // Row 46 (test findings J-03): a team-level moderation checklist, completed by the Director
  // & Team before sending to the IAC, plus the IAC's own endorsement note before it approves,
  // declines or sends for remediation.
  moderationChecklist: ChecklistSection[];
  iacEndorsementNote: string;

  // Row 48 (test findings J-05): an "updated toolkit" submission links back to the QP's
  // existing approved toolkit it supersedes, and carries a version number.
  version: number;
  updatesToolkitId: string | null;

  // QCTO feedback 3.13: optional so records stored before Batch H still load — read it through
  // toolkitFiles.ts toolkitFilesOf(), which treats a missing value as an empty list.
  toolkitFiles?: RplToolkitFile[];

  createdBy: string;
  createdAt: string;
}

export interface NewRplToolkitInput {
  qpId: string;
  qpName: string;
  toolkitTitle: string;
  toolkitType: RplToolkitType;
  description: string;
  submissionDate: string;
  notes: string;
  // Required when toolkitType is 'updated' (Row 48) — the QP's existing approved toolkit this
  // submission is a new version of.
  updatesToolkitId?: string;
  // QCTO feedback 3.13: optional — a submission without files is still valid.
  toolkitFiles?: RplToolkitFile[];
  // Batch W: the QP's self-audit, complete when the toolkit is submitted.
  selfAudit: RplSelfAudit;
}
