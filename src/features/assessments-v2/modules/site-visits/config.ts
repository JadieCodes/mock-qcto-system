import type { Role } from '../../types';

// Planning chain roles — named explicitly in the register/build prompt, so no open question
// here (unlike the EISA Calendar's CALENDAR_REVIEWER_ROLE). QCTO feedback 3.11: the planner is
// the ASD (formerly "Assistant Director"), the same role that later submits the report.
export const PLANNER_ROLE: Role = 'ASD';
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

// QCTO feedback 2.8 (confirmed 29 Oct 2026, closes PM-06): a results batch approved with a
// competency rate below this creates a Post-EISA Monitoring visit automatically. The ONE place
// the number lives — every screen, helper and seed check reads it from here.
export const POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT = 45;

// QCTO feedback 2.8: the auto-created visit has no date; QCTO picks it before the plan moves on.
export const MISSING_VISIT_DATE_MESSAGE = 'Pick a visit date before submitting the plan.';

// The DD's last step on an approved report (workflow action 'share-visit-outcome'). It only
// completes the visit; whether the QP sees the report is the separate per-visit
// "Share report with stakeholder" choice (stakeholderShare.ts).
export const COMPLETE_VISIT_LABEL = 'Complete Visit';

// Batch V1 (05.14): the DD's two approval outcomes. QCTO still has to confirm these names (Ms
// Rafir-Munsaur suggested a meeting to define them) — progress.md, Batch V1.
export const APPROVED_FINAL_LABEL = 'Approved (final)';
export const APPROVED_WITH_REMEDIATION_LABEL = 'Approved with remediation';
export const FURTHER_REMEDIATION_LABEL = 'Further remediation needed';
export const SUBMIT_REMEDIATION_LABEL = 'Submit remediation';
export const REMEDIATION_AWAITING_LABEL = 'Approved with remediation — awaiting QP';
export const REMEDIATION_SUBMITTED_LABEL = 'Remediation submitted — DD review';

// Shared visit outcomes: the Deputy Director, who reviews and approves the report, decides
// whether it is shared with the QP.
export const STAKEHOLDER_SHARE_ROLE: Role = REPORT_APPROVER_ROLE;

// Batch V2 (QCTO 29 Oct 3:05:39 to 3:16:43, ASSUMPTION): a notified visit with no response from the
// stakeholder after this many working days gets a reminder, and again every this many working days
// until they answer or the visit date passes. QCTO to confirm the number.
export const REMINDER_WORKING_DAYS = 2;

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
  // Rows 36/38: Approval of Results now surfaces the linked Marking & Moderation report
  // summary (CR-052) to its own approval chain, so Director and Chief Director — neither of
  // them on the site-visits process-stage team — need an explicit entry here too, rather than
  // falling through to visibilityScopeForRole's "not listed" default. Built as the stated
  // default (every approval-of-results reviewer sees the full report, same as every
  // site-visits-team role); still an open question for QCTO's real per-unit subdivision
  // (CR-054 — see progress.md).
  { role: 'Director', scope: 'all' },
  { role: 'Chief Director', scope: 'all' },
  { role: 'QP', scope: 'own-qp-visits' },
];

export function visibilityScopeForRole(role: Role): VisibilityScope | null {
  return REPORT_VISIBILITY_RULES.find((r) => r.role === role)?.scope ?? null;
}
