import { remediationRoundsOf } from './remediation';
import type { SiteVisit } from './types';
import { visitHasQp } from './visitTypeLabels';

// A report can be shared once it has been submitted ('dd-report-review') or approved.
// 'outcome-shared' only exists on visits stored before Batch A3.
const SHAREABLE_REPORT_STAGES = new Set(['dd-report-review', 'approved', 'remediation-awaiting', 'remediation-review', 'outcome-shared', 'closed']);

export const SHARE_WITH_STAKEHOLDER_LABEL = 'Share report with stakeholder';

// The stakeholder is the QP named on the visit, so visits without a QP (RPL/ARPL, special
// meetings) have no one to share with.
export function visitCanBeShared(visit: SiteVisit): boolean {
  return visitHasQp(visit.visitType) && !!visit.qpId && visit.planningWorkflow.stageId === 'booked' && SHAREABLE_REPORT_STAGES.has(visit.reportWorkflow.stageId);
}

export function isSharedWithStakeholder(visit: SiteVisit): boolean {
  return visit.stakeholderShare?.shared === true;
}

// Batch V1 (05.14): "Approved with remediation" shares the report and the items with the QP
// automatically, overriding the Yes/No default. Once remediation was requested the share stays on:
// the QP has already seen the items.
export function shareIsLockedByRemediation(visit: SiteVisit): boolean {
  return visitCanBeShared(visit) && remediationRoundsOf(visit).length > 0;
}
