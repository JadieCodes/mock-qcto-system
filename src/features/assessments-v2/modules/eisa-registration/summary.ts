// Batch R1 (29.16): the "<n> learners: <f> formal, <r> RPL/ARPL" line shown wherever a
// registration is summarised. Declined learners are not in `learners`, so they are not counted.
import type { EisaRegistrationRecord } from './types';

export function learnerCounts(record: Pick<EisaRegistrationRecord, 'learners'>): { total: number; formal: number; rpl: number } {
  const rpl = record.learners.filter((l) => l.rplArpl).length;
  return { total: record.learners.length, formal: record.learners.length - rpl, rpl };
}

export function learnerCountText(record: Pick<EisaRegistrationRecord, 'learners'>): string {
  const { total, formal, rpl } = learnerCounts(record);
  return `${total} ${total === 1 ? 'learner' : 'learners'}: ${formal} formal, ${rpl} RPL/ARPL`;
}
