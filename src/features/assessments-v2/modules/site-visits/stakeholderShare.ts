import { remediationRoundsOf } from './remediation';
import type { SiteVisit, VisitStakeholder } from './types';
import { visitHasQp } from './visitTypeLabels';

// A report can be shared once it has been submitted ('dd-report-review') or approved.
// 'outcome-shared' only exists on visits stored before Batch A3.
const SHAREABLE_REPORT_STAGES = new Set(['dd-report-review', 'approved', 'remediation-awaiting', 'remediation-review', 'outcome-shared', 'closed']);

export const SHARE_WITH_STAKEHOLDER_LABEL = 'Share report with stakeholder';

// Who the report is shared with: the QP named on the visit, otherwise (Batch V2) the SDP the visit is
// held at. An assessment centre has no portal, and a special meeting has no one, so neither can be shared with.
export function visitShareRecipientOf(visit: SiteVisit): VisitStakeholder | null {
  if (visitHasQp(visit.visitType) && visit.qpId) return { kind: 'QP', id: visit.qpId, name: visit.qpName };
  if (visit.sdpId && visit.sdpName) return { kind: 'SDP', id: visit.sdpId, name: visit.sdpName };
  return null;
}

export function visitCanBeShared(visit: SiteVisit): boolean {
  return visitShareRecipientOf(visit) !== null && visit.planningWorkflow.stageId === 'booked' && SHAREABLE_REPORT_STAGES.has(visit.reportWorkflow.stageId);
}

export function isSharedWithStakeholder(visit: SiteVisit): boolean {
  return visit.stakeholderShare?.shared === true;
}

// Batch V1 (05.14): "Approved with remediation" shares the report and the items with the stakeholder
// automatically, overriding the Yes/No default. Once remediation was requested the share stays on:
// the stakeholder has already seen the items.
export function shareIsLockedByRemediation(visit: SiteVisit): boolean {
  return visitCanBeShared(visit) && remediationRoundsOf(visit).length > 0;
}
