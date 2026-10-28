import type { SiteVisit, VisitType } from './types';

// PM-04/CR-048: labels for the four visit types this hub schedules. "EISA Readiness" and
// "Marking & Moderation" still need their official notification names agreed with QCTO
// (PM-04) — these are the visit-type labels, not the notification labels, so they're fine as
// plain, obvious names.
export const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  'eisa-readiness': 'EISA Readiness',
  'marking-moderation': 'Marking & Moderation',
  'rpl-arpl-monitoring': 'RPL/ARPL Monitoring',
  'post-eisa-monitoring': 'Post-EISA Monitoring',
};

export const VISIT_TYPE_OPTIONS: { value: VisitType; label: string }[] = (
  Object.keys(VISIT_TYPE_LABELS) as VisitType[]
).map((value) => ({ value, label: VISIT_TYPE_LABELS[value] }));

// QCTO feedback 2.6: EISA Readiness is not done per qualification and is not linked to a sitting.
export function isPerQualificationVisit(visitType: VisitType): boolean {
  return visitType !== 'eisa-readiness';
}

// QCTO feedback 3.6: EISA Readiness and Marking & Moderation are facilitated for QPs only.
export function visitHasSdp(visitType: VisitType): boolean {
  return visitType !== 'eisa-readiness' && visitType !== 'marking-moderation';
}

// QCTO feedback 2.7: RPL/ARPL monitoring is done at an SDP or assessment centre, not with a QP,
// and is not linked to an EISA sitting or date.
export function visitHasQp(visitType: VisitType): boolean {
  return visitType !== 'rpl-arpl-monitoring';
}

export function visitHasSittingLink(visitType: VisitType): boolean {
  return visitType === 'marking-moderation' || visitType === 'post-eisa-monitoring';
}

// QCTO feedback 2.7: the planner chooses where an RPL/ARPL visit is held.
export function visitHasSiteSelection(visitType: VisitType): boolean {
  return visitType === 'rpl-arpl-monitoring';
}

export function visitSiteName(visit: SiteVisit): string {
  return visit.sdpName ?? visit.assessmentCentreName ?? '';
}

export function visitSiteKindLabel(visit: SiteVisit): string {
  return visit.sdpName ? 'SDP' : 'Assessment centre';
}

// The QP for most visit types; the SDP or assessment centre for RPL/ARPL (QCTO feedback 2.7).
export function visitPartyName(visit: SiteVisit): string {
  return (visitHasQp(visit.visitType) ? visit.qpName : visitSiteName(visit)) || '—';
}

export function qualificationDisplay(visit: SiteVisit): string {
  return visit.qualificationTitle || '—';
}

// Used in titles and notification text: a readiness visit has no qualification, so it is
// named after its QP instead. An RPL/ARPL visit also names its SDP or assessment centre.
export function visitSubject(visit: SiteVisit): string {
  if (!visitHasQp(visit.visitType)) {
    const site = visitSiteName(visit);
    return site ? `${visit.qualificationTitle} at ${site}` : visit.qualificationTitle;
  }
  return visit.qualificationTitle || visit.qpName;
}
