import type { WorkflowDefinition } from '../../shared/workflow/types';
import { BOOKING_ROLE, PLAN_APPROVER_ROLE, PLAN_RECOMMENDER_ROLE, PLANNER_ROLE, REPORT_APPROVER_ROLE, REPORT_SUBMITTER_ROLE } from './config';
import type { SiteVisit } from './types';

// Planning chain: Assistant Director plans -> Deputy Director recommends -> Domain Director
// approves -> Sub Domain Admin books. Forward-only — the register's send-back/reject/reroute
// requirements (CR-055/056) are scoped to the REPORT workflow below, not this one.
export const PLANNING_WORKFLOW: WorkflowDefinition = {
  id: 'site-visits-planning',
  stages: [
    { id: 'ad-planning', label: 'Assistant Director planning', allowedRoles: [PLANNER_ROLE] },
    { id: 'dd-recommend', label: 'Deputy Director recommendation', allowedRoles: [PLAN_RECOMMENDER_ROLE] },
    { id: 'domain-director-approval', label: 'Domain Director approval', allowedRoles: [PLAN_APPROVER_ROLE] },
    { id: 'sda-booking', label: 'Sub Domain Admin booking', allowedRoles: [BOOKING_ROLE] },
    { id: 'booked', label: 'Booked', allowedRoles: [] },
  ],
  actions: [
    { id: 'plan-submit', label: 'Submit plan', fromStage: 'ad-planning', toStage: 'dd-recommend', kind: 'advance' },
    { id: 'plan-recommend', label: 'Recommend to Domain Director', fromStage: 'dd-recommend', toStage: 'domain-director-approval', kind: 'advance' },
    { id: 'plan-approve', label: 'Approve plan', fromStage: 'domain-director-approval', toStage: 'sda-booking', kind: 'advance' },
    { id: 'plan-book', label: 'Book visit', fromStage: 'sda-booking', toStage: 'booked', kind: 'complete' },
  ],
};

// Report chain: the submitter (ASD) and the approver (Deputy Director) must always be
// different roles — CR-053 fixes the old "Deputy & Assistant Director" self-approval bug by
// construction (role-gating alone already blocks it), and `requiresDifferentActor` is kept as
// a second, explicit line of defence. CR-056: send-back and reject are both available, each
// with a mandatory reason. CR-055: a manual re-route back into the same stage, also with a
// mandatory audit note, for workload-sharing when a DD is unavailable.
export const REPORT_WORKFLOW: WorkflowDefinition = {
  id: 'site-visits-report',
  stages: [
    { id: 'awaiting-execution', label: 'Awaiting execution', allowedRoles: [REPORT_SUBMITTER_ROLE] },
    { id: 'dd-report-review', label: 'Deputy Director review', allowedRoles: [REPORT_APPROVER_ROLE] },
    { id: 'approved', label: 'Approved', allowedRoles: [] },
    { id: 'rejected', label: 'Rejected', allowedRoles: [] },
    { id: 'outcome-shared', label: 'Outcome shared', allowedRoles: ['QP'] },
    { id: 'closed', label: 'Closed', allowedRoles: [] },
  ],
  actions: [
    { id: 'report-submit', label: 'Submit report', fromStage: 'awaiting-execution', toStage: 'dd-report-review', kind: 'advance' },
    {
      id: 'report-approve',
      label: 'Approve report',
      fromStage: 'dd-report-review',
      toStage: 'approved',
      kind: 'complete',
      requiresDifferentActor: true,
    },
    {
      id: 'report-send-back',
      label: 'Send back for clarification',
      fromStage: 'dd-report-review',
      toStage: 'awaiting-execution',
      kind: 'send-back',
      requiresNote: true,
    },
    {
      id: 'report-reject',
      label: 'Reject',
      fromStage: 'dd-report-review',
      toStage: 'rejected',
      kind: 'reject',
      requiresNote: true,
    },
    {
      id: 'report-reroute',
      label: 'Re-route to another Deputy Director',
      fromStage: 'dd-report-review',
      toStage: 'dd-report-review',
      kind: 'reroute',
      requiresNote: true,
    },
    // CR-058: post-eisa-monitoring only — QCTO shares the outcome, the QP then responds.
    { id: 'share-visit-outcome', label: 'Share Visit Outcome', fromStage: 'approved', toStage: 'outcome-shared', kind: 'advance' },
    { id: 'qp-acknowledge-outcome', label: 'Acknowledge outcome', fromStage: 'outcome-shared', toStage: 'closed', kind: 'complete' },
  ],
};

export type SiteVisitStatusTone = 'amber' | 'blue' | 'emerald' | 'red';

export function planningStatusLabel(visit: SiteVisit): string {
  switch (visit.planningWorkflow.stageId) {
    case 'ad-planning':
      return 'Planning';
    case 'dd-recommend':
      return 'Awaiting DD recommendation';
    case 'domain-director-approval':
      return 'Awaiting Domain Director approval';
    case 'sda-booking':
      return 'Awaiting booking';
    case 'booked':
      return 'Booked';
    case 'planning-rejected':
      return 'Planning rejected';
    default:
      return visit.planningWorkflow.stageId;
  }
}

export function overallStatusLabel(visit: SiteVisit): string {
  if (visit.planningWorkflow.stageId !== 'booked') return planningStatusLabel(visit);
  switch (visit.reportWorkflow.stageId) {
    case 'awaiting-execution':
      return 'Booked — awaiting execution';
    case 'dd-report-review':
      return 'Report with Deputy Director';
    case 'approved':
      return 'Report approved';
    case 'rejected':
      return 'Report rejected';
    case 'outcome-shared':
      return 'Outcome shared — awaiting QP';
    case 'closed':
      return 'Closed';
    default:
      return visit.reportWorkflow.stageId;
  }
}

export function overallStatusTone(visit: SiteVisit): SiteVisitStatusTone {
  if (visit.planningWorkflow.stageId !== 'booked') {
    return visit.planningWorkflow.stageId === 'planning-rejected' ? 'red' : 'amber';
  }
  switch (visit.reportWorkflow.stageId) {
    case 'approved':
    case 'outcome-shared':
    case 'closed':
      return 'emerald';
    case 'rejected':
      return 'red';
    case 'dd-report-review':
      return 'blue';
    default:
      return 'amber';
  }
}
