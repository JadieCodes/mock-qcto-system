import type { ChecklistSection } from '../../shared/checklist/types';
import type { WorkflowRecordState } from '../../shared/workflow/types';

// PM-09: not in the change request register yet — built behind a feature flag (see
// config/featureFlags.ts RPL_TOOLKIT_ENABLED), flagged in progress.md as pending a raised CR.
// Follows the same Application -> Evaluation -> Approval shape as the QSA Addendum, using the
// shared checklist component (CR-011's mandatory per-line comment applies here too).

export type RplToolkitType = 'new' | 'updated';

export type RplRecommendation = 'recommended' | 'not-recommended' | '';

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
  checklist: ChecklistSection[];
  evaluationReport: RplEvaluationReport;

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
}
