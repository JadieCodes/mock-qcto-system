// Batch R1 (29.16): the "<n> learners: <f> formal, <r> RPL/ARPL" line shown wherever a
// registration is summarised. RPL/ARPL comes from the readiness type (Batch R2, 29.15). Declined learners are not in `learners`, so they are not counted.
import { isRplArplType } from './readiness';
import type { EisaRegistrationRecord } from './types';

export function learnerCounts(record: Pick<EisaRegistrationRecord, 'learners'>): { total: number; formal: number; rpl: number } {
  const rpl = record.learners.filter((l) => isRplArplType(l.readinessType)).length;
  return { total: record.learners.length, formal: record.learners.length - rpl, rpl };
}

export function learnerCountText(record: Pick<EisaRegistrationRecord, 'learners'>): string {
  const { total, formal, rpl } = learnerCounts(record);
  return `${total} ${total === 1 ? 'learner' : 'learners'}: ${formal} formal, ${rpl} RPL/ARPL`;
}
