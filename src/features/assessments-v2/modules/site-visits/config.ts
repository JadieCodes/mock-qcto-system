import type { Role } from '../../types';

// Planning chain roles — named explicitly in the register/build prompt, so no open question
// here (unlike the EISA Calendar's CALENDAR_REVIEWER_ROLE).
export const PLANNER_ROLE: Role = 'Assistant Director';
export const PLAN_RECOMMENDER_ROLE: Role = 'Deputy Director';
export const PLAN_APPROVER_ROLE: Role = 'Domain Director';
export const BOOKING_ROLE: Role = 'Sub Domain Admin';

// Report chain — the ASD conducts and submits, the Deputy Director (their direct manager)
// approves. Kept as separate constants from the planning roles above even though the
// recommender/approver are the same two literal roles, so a future rename of either chain is
// a one-constant change.
export const REPORT_SUBMITTER_ROLE: Role = 'ASD';
export const REPORT_APPROVER_ROLE: Role = 'Deputy Director';

// CR-051: default notice lead time for a "Notified" visit. Not specified by the register —
// one constant to change, same pattern as the EISA Calendar's lead-time open question.
export const DEFAULT_NOTICE_LEAD_TIME_DAYS = 5;

// PM-06 open item: the "low competency rate" trigger and its threshold are not in the change
// request register. Post-EISA Monitoring is created manually by an official for now (there is
// no Phase 6 results-batch data yet to check this against) — kept here so the real automatic
// trigger is a one-constant change once Phase 6 exists and QCTO confirms the number.
export const POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT = 60;

// CR-058 open item: "Submit Approved Results" is being renamed/redesigned, but the real name
// is still to be agreed with QCTO. Placeholder label, per the developer's instruction.
export const SHARE_VISIT_OUTCOME_LABEL = 'Share Visit Outcome';

// CR-042/CR-044: the registration that auto-triggers an RPL/ARPL monitoring item carries an
// SDP and qualification, but no QP name — there is nowhere upstream to pull one from. The
// conducting official corrects this (CR-049's QP selector) before/while executing the visit.
export const AUTO_VISIT_QP_PLACEHOLDER = 'Not captured — set before executing this visit';

// CR-057 placeholder: there is no Phase 6 "Approval of Results" module yet to check a real
// results-batch status against, so this flag lives directly on the visit and is toggled by an
// official for demo purposes. Replace with a real read from Phase 6 once it exists.
export const RESULTS_APPROVAL_IS_SIMULATED = true;

// CR-054 (Open item): cross-unit report visibility, built as a configurable rule table rather
// than hard-coded logic, so QCTO's eventual answer is a data change here, not a code change.
// Default reading: everyone already on the site-visits process-stage team sees every report
// ("own unit + approvers"); a QP only ever sees visits tagged with their own QP name.
export type VisibilityScope = 'all' | 'own-qp-visits';

export interface VisibilityRule {
  role: Role;
  scope: VisibilityScope;
}

export const REPORT_VISIBILITY_RULES: VisibilityRule[] = [
  { role: 'ASD', scope: 'all' },
  { role: PLANNER_ROLE, scope: 'all' },
  { role: PLAN_RECOMMENDER_ROLE, scope: 'all' },
  { role: PLAN_APPROVER_ROLE, scope: 'all' },
  { role: BOOKING_ROLE, scope: 'all' },
  { role: 'QP', scope: 'own-qp-visits' },
];

export function visibilityScopeForRole(role: Role): VisibilityScope | null {
  return REPORT_VISIBILITY_RULES.find((r) => r.role === role)?.scope ?? null;
}
