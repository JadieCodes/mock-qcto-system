import type { ChecklistSection } from '../../shared/checklist/types';
import type { WorkflowRecordState } from '../../shared/workflow/types';

// CR-044: one standalone hub, every visit type lives on the same record shape. QCTO feedback
// 2.5 adds the last four types.
export type VisitType =
  | 'eisa-readiness'
  | 'marking-moderation'
  | 'rpl-arpl-monitoring'
  | 'post-eisa-monitoring'
  | 'marking-guideline-discussion'
  | 'instrument-validation-visit'
  | 'qasa-development-visit'
  | 'other-meeting';

// QCTO feedback 2.5: the QCTO domain a visit belongs to. Read through visitDomains.ts visitDomainOf().
export type VisitDomain = 'assessment' | 'accreditation-qa' | 'qualifications-development' | 'certification';

// CR-051: notified visits carry a configurable lead time; unannounced visits don't.
export type NotificationFlag = 'notified' | 'unannounced';

// QCTO feedback 3.7: verification of marked and moderated scripts on a Marking & Moderation visit.
export type ScriptModerationFinding = 'agree' | 'disagree';
export type ScriptVerificationResult = 'verified' | 'verified-with-findings' | 'not-verified';

export interface ScriptVerificationRow {
  id: string;
  // Batch V1 (05.13): which of the visit's qualifications the script belongs to (VisitQualification.id).
  // Optional so rows stored before Batch V1 still load — scriptVerification.ts scriptQualificationIdOf().
  qualificationId?: string;
  scriptReference: string;
  component: string;
  markedOutcome: string;
  moderatedFinding: ScriptModerationFinding | null;
  comment: string;
}

export interface ScriptVerification {
  rows: ScriptVerificationRow[];
  overallResult: ScriptVerificationResult | null;
}

// Batch V1 (05.13): one qualification a visit covers. A Marking & Moderation entry also carries
// its own published EISA sitting (the EISA date differs per qualification); an RPL/ARPL entry never
// does (QCTO feedback 2.7).
export interface VisitQualification {
  id: string;
  qualificationTitle: string;
  saqaId: string;
  sittingId: string | null;
  // The sitting's EISA date (yyyy-mm-dd); '' when the entry has no sitting.
  eisaDate: string;
}

// Batch V1 (05.14): the DD's two outcomes on a report besides the existing send back / reject.
// QCTO still has to confirm the status names (progress.md, Batch V1).
export interface RemediationEvidenceFile {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface RemediationReview {
  decision: 'approved-final' | 'further-remediation';
  reviewedBy: string;
  reviewedById: string;
  reviewedAt: string;
}

// One round: the DD's items, the stakeholder's response and evidence, and the DD's review.
export interface RemediationRound {
  id: string;
  round: number;
  items: string;
  requestedBy: string;
  requestedById: string;
  requestedAt: string;
  // Who the report and items were shared with (the QP, or the SDP / assessment centre).
  sharedWith: string;
  evidence: RemediationEvidenceFile[];
  response: string;
  // Set once submitted. submittedByRole is 'ASD' when the ASD recorded it for a stakeholder
  // without a QP.
  submittedBy: string | null;
  submittedById: string | null;
  submittedByRole: 'QP' | 'SDP' | 'ASD' | null;
  submittedAt: string | null;
  review: RemediationReview | null;
}

// Batch V2 (QCTO 29.36, item 2.12): the party told about a booked visit through the system. An
// assessment centre has no portal in this build, so the ASD answers for it.
export type StakeholderKind = 'QP' | 'SDP' | 'assessment-centre';

export interface VisitStakeholder {
  kind: StakeholderKind;
  // The QP's or SDP's person id; null for an assessment centre.
  id: string | null;
  name: string;
}

// The notice for the current date. Reset when the visit is moved and booked again.
export interface VisitNotice {
  sentAt: string;
  sentTo: StakeholderKind;
  sentToName: string;
}

export type StakeholderAnswer = 'accepted' | 'not-available';

export interface VisitStakeholderResponse {
  answer: StakeholderAnswer;
  // Required for 'not-available', '' when accepted.
  reason: string;
  // Optional, only with 'not-available' (yyyy-mm-dd, '' when none).
  suggestedDate: string;
  respondedBy: string;
  respondedById: string;
  respondedByRole: 'QP' | 'SDP' | 'ASD';
  respondedAt: string;
}

export interface VisitReminder {
  number: number;
  sentAt: string;
}

// Every time QCTO moved a visit to a new date, oldest first. Keeps what the stakeholder answered
// about the old date and how many reminders it had.
export interface VisitDateMove {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  reasonSource: 'stakeholder-not-available' | 'qcto';
  movedBy: string;
  movedById: string;
  movedAt: string;
  previousNotice: VisitNotice | null;
  previousResponse: VisitStakeholderResponse | null;
  previousReminders: number;
}

export interface StakeholderShare {
  shared: boolean;
  outcomeSummary: string;
  changedAt: string;
  changedBy: string;
  changedById: string;
}

export interface SiteVisit {
  id: string;
  visitType: VisitType;
  // QCTO feedback 2.5: optional so visits stored before Batch G still load (they are Assessment).
  domain?: VisitDomain;
  // QCTO feedback 2.5: "Other / special meeting" only — what the meeting is called.
  meetingTitle?: string;
  // QCTO feedback 2.5: the purpose captured with the plan for the four new visit types.
  purpose?: string;

  // CR-049: QP + qualification selectors at the top of every execution form. Empty ('') for
  // RPL/ARPL monitoring, which has no QP (QCTO feedback 2.7).
  qpId: string;
  qpName: string;
  // Batch V1 (05.13): always the first qualification's title (or '' when there is none), so lists
  // and other modules that read one title keep working. Read the full list through
  // visitQualifications.ts visitQualificationsOf().
  qualificationTitle: string;
  // Batch V1 (05.13): Marking & Moderation and RPL/ARPL monitoring cover several qualifications.
  // Optional so visits stored before Batch V1 still load (they become a one-item list).
  qualifications?: VisitQualification[];
  sdpId: string | null;
  sdpName: string | null;
  // QCTO feedback 2.7: an RPL/ARPL visit is held at an SDP (sdpId/sdpName) or at an assessment
  // centre typed in by the planner (this field, with sdpId/sdpName null), never with a QP.
  // Optional so visits stored before Batch A3 still load — read it through visitTypeLabels.ts
  // visitSiteName().
  assessmentCentreName?: string | null;

  // CR-050: optional link to a published EISA Calendar sitting — when linked, the date is
  // auto-populated from the sitting instead of typed in by hand. Always null for EISA Readiness
  // and RPL/ARPL monitoring (QCTO feedback 2.6, 2.7).
  // Batch V1: for Marking & Moderation this is the first qualification's sitting; every sitting
  // is in `qualifications`.
  sittingId: string | null;
  visitDate: string;
  venue: string;

  notificationFlag: NotificationFlag;
  noticeLeadTimeDays: number | null;

  planNote: string;

  // stageId: 'ad-planning' | 'dd-recommend' | 'domain-director-approval' | 'sda-booking' |
  // 'booked' | 'planning-rejected'. CR-044's one automatic exception (RPL/ARPL) starts
  // straight at 'booked' — see api.ts buildAutoCreatedVisit().
  planningWorkflow: WorkflowRecordState;

  // stageId: 'awaiting-execution' | 'dd-report-review' | 'approved' | 'rejected' |
  // 'outcome-shared' | 'closed'. CR-053: the ASD who submits can never be the DD who approves.
  reportWorkflow: WorkflowRecordState;
  // CR-055: set when a Deputy Director re-routes the report to a named colleague with the
  // same role. Does not change reportWorkflow.stageId — see api.ts's performReportAction.
  reroutedToId: string | null;
  reroutedToName: string | null;

  // CR-048: the checklist shape changes per visitType (built once, at creation time).
  checklist: ChecklistSection[];
  freeTextNotes: Record<string, string>;

  // CR-057: only ever populated for 'post-eisa-monitoring', and only open once the sitting's EISA
  // results batch is approved in Approval of Results (resultsStatus.ts reads the real batch).
  facilitatorAnswers: Record<string, string>;
  learnerAnswers: Record<string, string>;

  completedBy: string;
  completedDate: string;

  // QCTO feedback 1.12: supporting evidence uploaded on the Execution & Report tab (UI-only:
  // name and size, as elsewhere in v2). Optional so visits stored before Batch D still load —
  // read it through evidence.ts evidenceOf(), which treats a missing value as an empty list.
  evidence?: { fileName: string; fileSize: number; uploadedAt: string; uploadedBy: string; category: 'report' | 'attendance' | 'other' }[];

  // QCTO feedback 3.7: Marking & Moderation only. Optional so visits stored before Batch G still
  // load — read it through scriptVerification.ts scriptVerificationOf().
  scriptVerification?: ScriptVerification;

  // Shared visit outcomes (replaces the QP acknowledgement step): QCTO decides per visit whether
  // the report is shared with the QP. Missing means "not shared" — read it through
  // stakeholderShare.ts isSharedWithStakeholder().
  stakeholderShare?: StakeholderShare;

  // Batch V2: the notice, the stakeholder's answer and the reminders for the CURRENT visit date, and
  // every earlier date (dateMoves). All optional so visits stored before Batch V2 still load: they
  // have no notice, so no response step. Read them through stakeholderResponse.ts.
  stakeholderNotice?: VisitNotice;
  stakeholderResponse?: VisitStakeholderResponse;
  reminders?: VisitReminder[];
  dateMoves?: VisitDateMove[];

  // Batch V1 (05.14): every round of "Approved with remediation", oldest first. Missing means none —
  // read it through remediation.ts remediationRoundsOf().
  remediationRounds?: RemediationRound[];

  // Set only for the RPL/ARPL visit auto-created from a Phase 4 registration (CR-042/CR-044 —
  // the only automatic trigger into this hub). Null for every officially-created visit.
  sourceRegistrationId: string | null;
  sourceMonitoringItemId: string | null;
  learnerNames: string[];

  createdBy: string;
  createdAt: string;
}

export interface NewVisitInput {
  visitType: VisitType;
  domain?: VisitDomain;
  meetingTitle?: string;
  purpose?: string;
  qpId: string;
  qpName: string;
  qualificationTitle: string;
  // Batch V1 (05.13): Marking & Moderation and RPL/ARPL monitoring. When given it replaces
  // qualificationTitle and sittingId.
  qualifications?: VisitQualification[];
  sdpId: string | null;
  sdpName: string | null;
  sittingId: string | null;
  visitDate: string;
  venue: string;
  notificationFlag: NotificationFlag;
  noticeLeadTimeDays: number | null;
  createdBy: string;
  createdById: string;
}
