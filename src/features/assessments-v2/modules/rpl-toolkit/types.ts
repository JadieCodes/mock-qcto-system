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
}
