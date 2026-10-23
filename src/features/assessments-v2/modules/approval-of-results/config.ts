import type { Role } from '../../types';

// CR-059 names each role explicitly — no open question here, unlike several other modules'
// "no specific role named" assumptions.
export const RESULTS_AD_ROLE: Role = 'Assistant Director';
export const RESULTS_DD_ROLE: Role = 'Deputy Director';
export const RESULTS_DIRECTOR_ROLE: Role = 'Director';
export const RESULTS_CHIEF_DIRECTOR_ROLE: Role = 'Chief Director';

// CR-059: 21 working days from the sitting date, using the same shared helper as the EISA
// Calendar's lead-time check (shared/dates/workingDays.ts) — one definition of "working day"
// for the whole domain.
export const RESULTS_SUBMISSION_DEADLINE_WORKING_DAYS = 21;

// Not specified by the register — a "due soon" window needs *some* number before it can be
// shown. One constant to change if QCTO gives a real figure, same pattern as every other
// unconfirmed-figure open item in this build (EISA Calendar's lead time, Site Visits' notice
// lead time).
export const RESULTS_DUE_SOON_WINDOW_WORKING_DAYS = 5;
