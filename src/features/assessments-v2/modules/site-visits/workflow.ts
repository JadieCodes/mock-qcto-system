import type { WorkflowDefinition } from '../../shared/workflow/types';
import {
  APPROVED_FINAL_LABEL,
  APPROVED_WITH_REMEDIATION_LABEL,
  BOOKING_ROLE,
  COMPLETE_VISIT_LABEL,
  FURTHER_REMEDIATION_LABEL,
  PLAN_APPROVER_ROLE,
  PLAN_RECOMMENDER_ROLE,
  PLANNER_ROLE,
  REMEDIATION_AWAITING_LABEL,
  REMEDIATION_SUBMITTED_LABEL,
  REPORT_APPROVER_ROLE,
  REPORT_SUBMITTER_ROLE,
  SUBMIT_REMEDIATION_LABEL,
} from './config';
import { REMEDIATION_AWAITING_STAGE, REMEDIATION_REVIEW_STAGE, remediationStakeholderLabel } from './remediation';
import type { SiteVisit } from './types';

// Audit-entry action label the Planning tab looks up to show the latest send-back note.
export const PLAN_SEND_BACK_TO_PLANNER_LABEL = 'Send back to ASD';
export const PLAN_MOVE_VISIT_LABEL = 'Move the visit';

// Planning chain: ASD plans -> Deputy Director recommends -> Domain Director approves -> Sub
// Domain Admin books. Row 33 (test findings): every REVIEW stage (the three stages downstream
// of the ASD's own, which is where the plan originates and
// has no prior owner to reject or send back to) gets a Reject and a Send back action, same
// shape as CR-056's "every approval stage" rule elsewhere in this domain. Reject is terminal
// (`planning-rejected`); Send back returns to the immediately preceding stage.
export const PLANNING_WORKFLOW: WorkflowDefinition = {
  id: 'site-visits-planning',
  stages: [
    { id: 'ad-planning', label: 'ASD planning', allowedRoles: [PLANNER_ROLE] },
    { id: 'dd-recommend', label: 'Deputy Director recommendation', allowedRoles: [PLAN_RECOMMENDER_ROLE] },
    { id: 'domain-director-approval', label: 'Domain Director approval', allowedRoles: [PLAN_APPROVER_ROLE] },
    { id: 'sda-booking', label: 'Sub Domain Admin booking', allowedRoles: [BOOKING_ROLE] },
    // Batch V2: the ASD can move a booked visit (the only action from here), which sends it back
    // through approval. Booked is a resting stage, so this does not make it an overdue wait.
    { id: 'booked', label: 'Booked', allowedRoles: [PLANNER_ROLE] },
    { id: 'planning-rejected', label: 'Planning rejected', allowedRoles: [] },
  ],
  actions: [
    // Batch V2 (QCTO 29.36): a new date goes through the same approval as a new plan.
    { id: 'plan-move', label: PLAN_MOVE_VISIT_LABEL, fromStage: 'booked', toStage: 'dd-recommend', kind: 'send-back', requiresNote: true },
    { id: 'plan-submit', label: 'Submit plan', fromStage: 'ad-planning', toStage: 'dd-recommend', kind: 'advance' },
    { id: 'plan-recommend', label: 'Recommend to Domain Director', fromStage: 'dd-recommend', toStage: 'domain-director-approval', kind: 'advance' },
    {
      id: 'plan-dd-send-back',
      label: PLAN_SEND_BACK_TO_PLANNER_LABEL,
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
// a second, explicit line of defence. QCTO feedback 3.11: the ASD who planned the visit may
// also conduct it; planning is approved separately by the DD and the Domain Director. CR-056: send-back and reject are both available, each
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
    // Batch V1 (05.14): 'approved' now means "Approved (final)" only. Complete Visit starts here.
    { id: 'approved', label: APPROVED_FINAL_LABEL, allowedRoles: [REPORT_APPROVER_ROLE] },
    // Batch V1 (05.14): the stakeholder answers the DD's items: the QP for a visit with a QP, the SDP for a
    // visit held at an SDP (Batch V2), the ASD for an assessment centre (api.ts checks which).
    { id: REMEDIATION_AWAITING_STAGE, label: REMEDIATION_AWAITING_LABEL, allowedRoles: ['QP', 'SDP', REPORT_SUBMITTER_ROLE] },
    { id: REMEDIATION_REVIEW_STAGE, label: REMEDIATION_SUBMITTED_LABEL, allowedRoles: [REPORT_APPROVER_ROLE] },
    { id: 'rejected', label: 'Rejected', allowedRoles: [] },
    { id: 'outcome-shared', label: 'Outcome shared', allowedRoles: ['QP'] },
    { id: 'closed', label: 'Closed', allowedRoles: [] },
  ],
  actions: [
    { id: 'report-submit', label: 'Submit report', fromStage: 'awaiting-execution', toStage: 'dd-report-review', kind: 'advance' },
    {
      id: 'report-approve',
      label: APPROVED_FINAL_LABEL,
      fromStage: 'dd-report-review',
      toStage: 'approved',
      kind: 'complete',
      requiresDifferentActor: true,
    },
    // Batch V1 (05.14): approved, but the stakeholder still has items to fix. The note is the
    // remediation items (required).
    {
      id: 'report-approve-remediation',
      label: APPROVED_WITH_REMEDIATION_LABEL,
      fromStage: 'dd-report-review',
      toStage: REMEDIATION_AWAITING_STAGE,
      kind: 'advance',
      requiresDifferentActor: true,
      requiresNote: true,
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
    { id: 'remediation-submit', label: SUBMIT_REMEDIATION_LABEL, fromStage: REMEDIATION_AWAITING_STAGE, toStage: REMEDIATION_REVIEW_STAGE, kind: 'advance' },
    // The DD reviews a submitted remediation. Not requiresDifferentActor: the last actor is the
    // stakeholder (or the ASD recording for them), never the DD's own submission.
    { id: 'remediation-approve-final', label: APPROVED_FINAL_LABEL, fromStage: REMEDIATION_REVIEW_STAGE, toStage: 'approved', kind: 'complete' },
    {
      id: 'remediation-further',
      label: FURTHER_REMEDIATION_LABEL,
      fromStage: REMEDIATION_REVIEW_STAGE,
      toStage: REMEDIATION_AWAITING_STAGE,
      kind: 'send-back',
      requiresNote: true,
    },
    // Every visit type. The id is kept so stored audit entries still match; since Batch G the
    // action only completes the visit (api.ts moves it on to 'closed'), and sharing with the QP
    // is the separate per-visit choice in stakeholderShare.ts.
    { id: 'share-visit-outcome', label: COMPLETE_VISIT_LABEL, fromStage: 'approved', toStage: 'outcome-shared', kind: 'advance' },
    { id: 'qp-acknowledge-outcome', label: 'Acknowledge outcome', fromStage: 'outcome-shared', toStage: 'closed', kind: 'complete' },
  ],
};

export type SiteVisitStatusTone = 'amber' | 'blue' | 'emerald' | 'red';

export function planningStatusLabel(visit: SiteVisit): string {
  switch (visit.planningWorkflow.stageId) {
    case 'ad-planning':
      // QCTO feedback 2.8: an auto-created Post-EISA Monitoring visit waits here for its date.
      return visit.visitDate ? 'Planning' : 'To be scheduled';
    case 'dd-recommend':
      return visit.dateMoves?.length ? 'New date awaiting DD recommendation' : 'Awaiting DD recommendation';
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
      return APPROVED_FINAL_LABEL;
    case REMEDIATION_AWAITING_STAGE:
      // QCTO still has to confirm the status names. A visit without a QP says who it awaits instead.
      return `Approved with remediation — awaiting ${remediationStakeholderLabel(visit)}`;
    case REMEDIATION_REVIEW_STAGE:
      return REMEDIATION_SUBMITTED_LABEL;
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
    case REMEDIATION_REVIEW_STAGE:
      return 'blue';
    default:
      return 'amber';
  }
}
