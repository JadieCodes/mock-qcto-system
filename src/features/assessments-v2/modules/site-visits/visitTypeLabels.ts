import type { VisitType } from './types';

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
