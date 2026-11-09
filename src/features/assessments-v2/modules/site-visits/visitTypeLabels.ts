import type { SiteVisit, VisitType } from './types';
import { qualificationsSummary } from './visitQualifications';

// PM-04/CR-048: labels for the four visit types this hub schedules. "EISA Readiness" and
// "Marking & Moderation" still need their official notification names agreed with QCTO
// (PM-04) — these are the visit-type labels, not the notification labels, so they're fine as
// plain, obvious names.
export const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  'eisa-readiness': 'EISA Readiness',
  'marking-moderation': 'Marking & Moderation',
  'rpl-arpl-monitoring': 'RPL/ARPL Monitoring',
  'post-eisa-monitoring': 'Post-EISA Monitoring',
  'marking-guideline-discussion': 'Marking guideline discussion',
  'instrument-validation-visit': 'Instrument validation visit',
  'qasa-development-visit': 'QASA development visit',
  'other-meeting': 'Other / special meeting',
};

export const VISIT_TYPE_OPTIONS: { value: VisitType; label: string }[] = (
  Object.keys(VISIT_TYPE_LABELS) as VisitType[]
).map((value) => ({ value, label: VISIT_TYPE_LABELS[value] }));

// QCTO feedback 2.6: EISA Readiness is not done per qualification and is not linked to a sitting.
// QCTO feedback 2.5: the four new types are planned by date, QP or title, and purpose only.
export function isPerQualificationVisit(visitType: VisitType): boolean {
  return visitType === 'marking-moderation' || visitType === 'rpl-arpl-monitoring' || visitType === 'post-eisa-monitoring';
}

// QCTO feedback 3.6: EISA Readiness and Marking & Moderation are facilitated for QPs only.
// QCTO feedback 2.5: so are the new QP visit types; a special meeting has no SDP either.
export function visitHasSdp(visitType: VisitType): boolean {
  return visitType === 'rpl-arpl-monitoring' || visitType === 'post-eisa-monitoring';
}

// QCTO feedback 2.7: RPL/ARPL monitoring is done at an SDP or assessment centre, not with a QP,
// and is not linked to an EISA sitting or date. QCTO feedback 2.5: a special meeting has a
// title instead of a QP.
export function visitHasQp(visitType: VisitType): boolean {
  return visitType !== 'rpl-arpl-monitoring' && visitType !== 'other-meeting';
}

// QCTO feedback 2.5: "Other / special meeting" — the planner records a title and the purpose.
export function visitIsMeeting(visitType: VisitType): boolean {
  return visitType === 'other-meeting';
}

// QCTO feedback 2.5: every new visit type captures its purpose with the plan.
export function visitHasPurpose(visitType: VisitType): boolean {
  return (
    visitType === 'marking-guideline-discussion' ||
    visitType === 'instrument-validation-visit' ||
    visitType === 'qasa-development-visit' ||
    visitType === 'other-meeting'
  );
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
  if (visitIsMeeting(visit.visitType)) return '—';
  return (visitHasQp(visit.visitType) ? visit.qpName : visitSiteName(visit)) || '—';
}

// Batch V1 (05.13): the first qualification, then "and N more".
export function qualificationDisplay(visit: SiteVisit): string {
  return qualificationsSummary(visit);
}

// Used in titles and notification text: a readiness visit has no qualification, so it is
// named after its QP instead. An RPL/ARPL visit also names its SDP or assessment centre.
export function visitSubject(visit: SiteVisit): string {
  if (visitIsMeeting(visit.visitType)) return visit.meetingTitle?.trim() || VISIT_TYPE_LABELS[visit.visitType];
  if (!visitHasQp(visit.visitType)) {
    const site = visitSiteName(visit);
    const qualifications = visit.qualificationTitle ? qualificationsSummary(visit) : '';
    return site && qualifications ? `${qualifications} at ${site}` : qualifications || site;
  }
  return visit.qualificationTitle ? qualificationsSummary(visit) : visit.qpName;
}
