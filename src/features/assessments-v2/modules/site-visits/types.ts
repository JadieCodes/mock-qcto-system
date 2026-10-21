import type { ChecklistSection } from '../../shared/checklist/types';
import type { WorkflowRecordState } from '../../shared/workflow/types';

// CR-044: one standalone hub, every visit type lives on the same record shape.
export type VisitType = 'eisa-readiness' | 'marking-moderation' | 'rpl-arpl-monitoring' | 'post-eisa-monitoring';

// CR-051: notified visits carry a configurable lead time; unannounced visits don't.
export type NotificationFlag = 'notified' | 'unannounced';

export interface SiteVisit {
  id: string;
  visitType: VisitType;

  // CR-049: QP + qualification selectors at the top of every execution form.
  qpName: string;
  qualificationTitle: string;
  sdpName: string | null;

  // CR-050: optional link to a published EISA Calendar sitting — when linked, the date is
  // auto-populated from the sitting instead of typed in by hand.
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

  // CR-048: the checklist shape changes per visitType (built once, at creation time).
  checklist: ChecklistSection[];
  freeTextNotes: Record<string, string>;

  // CR-057: only ever populated for 'post-eisa-monitoring', and only shown once
  // resultsApprovedForSitting is true (a Phase 6 placeholder — see config.ts).
  facilitatorAnswers: Record<string, string>;
  learnerAnswers: Record<string, string>;
  resultsApprovedForSitting: boolean;

  completedBy: string;
  completedDate: string;

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
  qpName: string;
  qualificationTitle: string;
  sdpName: string | null;
  sittingId: string | null;
  visitDate: string;
  venue: string;
  notificationFlag: NotificationFlag;
  noticeLeadTimeDays: number | null;
  createdBy: string;
}
