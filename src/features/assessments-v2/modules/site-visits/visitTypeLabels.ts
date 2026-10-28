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

export function qualificationDisplay(visit: SiteVisit): string {
  return visit.qualificationTitle || '—';
}

// Used in titles and notification text: a readiness visit has no qualification, so it is
// named after its QP instead.
export function visitSubject(visit: SiteVisit): string {
  return visit.qualificationTitle || visit.qpName;
}
