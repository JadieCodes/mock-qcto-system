import type { WorkflowDefinition } from '../../shared/workflow/types';
import { BOOKING_ROLE, PLAN_APPROVER_ROLE, PLAN_RECOMMENDER_ROLE, PLANNER_ROLE, REPORT_APPROVER_ROLE, REPORT_SUBMITTER_ROLE, SHARE_VISIT_OUTCOME_LABEL } from './config';
import type { SiteVisit } from './types';

// Planning chain: Assistant Director plans -> Deputy Director recommends -> Domain Director
// approves -> Sub Domain Admin books. Row 33 (test findings): every REVIEW stage (the three
// stages downstream of the Assistant Director's own, which is where the plan originates and
// has no prior owner to reject or send back to) gets a Reject and a Send back action, same
// shape as CR-056's "every approval stage" rule elsewhere in this domain. Reject is terminal
// (`planning-rejected`); Send back returns to the immediately preceding stage.
export const PLANNING_WORKFLOW: WorkflowDefinition = {
  id: 'site-visits-planning',
  stages: [
    { id: 'ad-planning', label: 'Assistant Director planning', allowedRoles: [PLANNER_ROLE] },
    { id: 'dd-recommend', label: 'Deputy Director recommendation', allowedRoles: [PLAN_RECOMMENDER_ROLE] },
    { id: 'domain-director-approval', label: 'Domain Director approval', allowedRoles: [PLAN_APPROVER_ROLE] },
    { id: 'sda-booking', label: 'Sub Domain Admin booking', allowedRoles: [BOOKING_ROLE] },
    { id: 'booked', label: 'Booked', allowedRoles: [] },
    { id: 'planning-rejected', label: 'Planning rejected', allowedRoles: [] },
  ],
  actions: [
    { id: 'plan-submit', label: 'Submit plan', fromStage: 'ad-planning', toStage: 'dd-recommend', kind: 'advance' },
    { id: 'plan-recommend', label: 'Recommend to Domain Director', fromStage: 'dd-recommend', toStage: 'domain-director-approval', kind: 'advance' },
    {
      id: 'plan-dd-send-back',
      label: 'Send back to Assistant Director',
      fromStage: 'dd-recommend',
      toStage: 'ad-planning',
      kind: 'send-back',
      requiresNote: true,
    },
    {
      id: 'plan-dd-reject',
      label: 'Reject (Deputy Director)',
      fromStage: 'dd-recommend',
      toStage: 'planning-rejected',
      kind: 'reject',
      requiresNote: true,
    },
    { id: 'plan-approve', label: 'Approve plan', fromStage: 'domain-director-approval', toStage: 'sda-booking', kind: 'advance' },
    {
      id: 'plan-domain-director-send-back',
      label: 'Send back to Deputy Director',
      fromStage: 'domain-director-approval',
      toStage: 'dd-recommend',
      kind: 'send-back',
      requiresNote: true,
    },
    {
      id: 'plan-domain-director-reject',
      label: 'Reject (Domain Director)',
      fromStage: 'domain-director-approval',
      toStage: 'planning-rejected',
      kind: 'reject',
      requiresNote: true,
    },
    { id: 'plan-book', label: 'Book visit', fromStage: 'sda-booking', toStage: 'booked', kind: 'complete' },
    {
      id: 'plan-sda-send-back',
      label: 'Send back to Domain Director',
      fromStage: 'sda-booking',
      toStage: 'domain-director-approval',
      kind: 'send-back',
      requiresNote: true,
    },
    {
      id: 'plan-sda-reject',
      label: 'Reject (Sub Domain Admin)',
      fromStage: 'sda-booking',
      toStage: 'planning-rejected',
      kind: 'reject',
      requiresNote: true,
    },
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
    // Row 37 (G-23): this stage needs an allowed role too — "Share Visit Outcome" is an action
    // FROM 'approved', and the shared workflow engine's canActInStage check blocked it when
    // this list was empty, so the Deputy Director's click silently failed and the QP never
    // received anything.
    { id: 'approved', label: 'Approved', allowedRoles: [REPORT_APPROVER_ROLE] },
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
    // CR-058: every visit type — QCTO shares the outcome, the QP then responds. (Fix 4 Part 2
    // correction: this used to be gated to post-eisa-monitoring only in api.ts/the UI; the
    // workflow action itself was never visit-type-specific.)
    { id: 'share-visit-outcome', label: SHARE_VISIT_OUTCOME_LABEL, fromStage: 'approved', toStage: 'outcome-shared', kind: 'advance' },
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

// Row 37 (Fix 4 Part 2 correction): a QP must see nothing about a report — not even that it was
// approved — until the Deputy Director explicitly shares it (CR-058). Every visit type now has
// a "Share Visit Outcome" step (see REPORT_WORKFLOW above), so `forQp` masks these two stages
// for every visit type, not only Post-EISA Monitoring.
const QP_MASKED_PRE_SHARE_STAGES = new Set(['dd-report-review', 'approved']);

export function overallStatusLabel(visit: SiteVisit, opts?: { forQp?: boolean }): string {
  if (visit.planningWorkflow.stageId !== 'booked') return planningStatusLabel(visit);
  if (opts?.forQp && QP_MASKED_PRE_SHARE_STAGES.has(visit.reportWorkflow.stageId)) {
    return 'Visit completed — outcome pending';
  }
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
      return opts?.forQp ? 'Outcome shared' : 'Outcome shared — awaiting QP';
    case 'closed':
      return 'Closed';
    default:
      return visit.reportWorkflow.stageId;
  }
}

// Row 38 (CR-052/G-26): lets Approval of Results show the report itself, not only its status —
// an approved report is one that has actually been reviewed and signed off, so that's the line
// used to decide "is there a report worth showing yet."
export function reportIsApproved(visit: SiteVisit): boolean {
  return visit.reportWorkflow.stageId === 'approved' || visit.reportWorkflow.stageId === 'outcome-shared' || visit.reportWorkflow.stageId === 'closed';
}

export function checklistCompletionSummary(visit: SiteVisit): { answered: number; total: number } {
  let answered = 0;
  let total = 0;
  for (const section of visit.checklist) {
    for (const item of section.items) {
      total += 1;
      if (item.answer !== null) answered += 1;
    }
  }
  return { answered, total };
}

export function overallStatusTone(visit: SiteVisit, opts?: { forQp?: boolean }): SiteVisitStatusTone {
  if (visit.planningWorkflow.stageId !== 'booked') {
    return visit.planningWorkflow.stageId === 'planning-rejected' ? 'red' : 'amber';
  }
  if (opts?.forQp && QP_MASKED_PRE_SHARE_STAGES.has(visit.reportWorkflow.stageId)) {
    return 'amber';
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
