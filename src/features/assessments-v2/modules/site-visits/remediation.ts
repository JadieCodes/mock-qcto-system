import { APPROVED_FINAL_LABEL } from './config';
import type { RemediationRound, SiteVisit } from './types';
import { visitHasQp, visitIsMeeting, visitSiteKindLabel, visitSiteName } from './visitTypeLabels';

export const MISSING_REMEDIATION_ITEMS_MESSAGE = 'Type the remediation items the QP must address.';
export const MISSING_REMEDIATION_RESPONSE_MESSAGE = 'Add a response before submitting the remediation.';
export const COMPLETE_VISIT_BLOCKED_MESSAGE = `Complete Visit is only possible after "${APPROVED_FINAL_LABEL}".`;

export const REMEDIATION_AWAITING_STAGE = 'remediation-awaiting';
export const REMEDIATION_REVIEW_STAGE = 'remediation-review';

export function isRemediationStage(stageId: string): boolean {
  return stageId === REMEDIATION_AWAITING_STAGE || stageId === REMEDIATION_REVIEW_STAGE;
}

export function remediationRoundsOf(visit: SiteVisit): RemediationRound[] {
  return visit.remediationRounds ?? [];
}

// The round still open (items requested, not yet reviewed), if any.
export function openRemediationRound(visit: SiteVisit): RemediationRound | undefined {
  const rounds = remediationRoundsOf(visit);
  const last = rounds[rounds.length - 1];
  return last && !last.review ? last : undefined;
}

// The stakeholder who receives the report and items: the QP when the visit has one, otherwise the
// SDP or assessment centre. A special meeting has neither, so it can only be "Approved (final)".
export function remediationStakeholderName(visit: SiteVisit): string {
  if (visitIsMeeting(visit.visitType)) return '';
  if (visitHasQp(visit.visitType)) return visit.qpId ? visit.qpName : '';
  return visitSiteName(visit);
}

export function visitCanHaveRemediation(visit: SiteVisit): boolean {
  return !!remediationStakeholderName(visit);
}

// "Awaiting QP" for a visit with a QP; "awaiting SDP" / "awaiting assessment centre" otherwise.
export function remediationStakeholderLabel(visit: SiteVisit): string {
  return visitHasQp(visit.visitType) ? 'QP' : visitSiteKindLabel(visit);
}

// Who records the response: the QP on their Visit Outcomes page, or — until a later batch gives
// SDPs their own view — the ASD on the visit, for a stakeholder without a QP.
export function remediationRecordedByAsd(visit: SiteVisit): boolean {
  return !visitHasQp(visit.visitType);
}
