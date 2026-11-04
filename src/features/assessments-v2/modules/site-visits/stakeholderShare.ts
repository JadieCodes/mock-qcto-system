import type { SiteVisit } from './types';
import { visitHasQp } from './visitTypeLabels';

// A report can be shared once it has been submitted ('dd-report-review') or approved.
// 'outcome-shared' only exists on visits stored before Batch A3.
const SHAREABLE_REPORT_STAGES = new Set(['dd-report-review', 'approved', 'outcome-shared', 'closed']);

export const SHARE_WITH_STAKEHOLDER_LABEL = 'Share report with stakeholder';

// The stakeholder is the QP named on the visit, so visits without a QP (RPL/ARPL, special
// meetings) have no one to share with.
export function visitCanBeShared(visit: SiteVisit): boolean {
  return visitHasQp(visit.visitType) && !!visit.qpId && visit.planningWorkflow.stageId === 'booked' && SHAREABLE_REPORT_STAGES.has(visit.reportWorkflow.stageId);
}

export function isSharedWithStakeholder(visit: SiteVisit): boolean {
  return visit.stakeholderShare?.shared === true;
}
