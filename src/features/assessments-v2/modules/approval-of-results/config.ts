import type { Role } from '../../types';
import type { FisaEvidenceTag } from './types';

// CR-059 names each role explicitly — no open question here, unlike several other modules'
// "no specific role named" assumptions.
// QCTO feedback 3.11: the first review is the ASD's (formerly "Assistant Director").
export const RESULTS_AD_ROLE: Role = 'ASD';
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

// QCTO feedback 3.14: FISA results are submitted by the SDP, not a QP.
export const FISA_RESULTS_SUBMITTER_ROLE: Role = 'SDP';

// Audit record types — one per track, so each tab's Recent Activity and each batch's audit
// trail only read their own entries.
export const EISA_RESULTS_RECORD_TYPE = 'results-batch';
export const FISA_RESULTS_RECORD_TYPE = 'fisa-results-batch';

// The tag the SDP puts on each FISA evidence file.
export const FISA_EVIDENCE_TAG_OPTIONS: { value: FisaEvidenceTag; label: string }[] = [
  { value: 'assessment-instrument', label: 'Assessment instrument' },
  { value: 'marksheet', label: 'Marksheet' },
  { value: 'moderation-report', label: 'Moderation report' },
  { value: 'attendance-register', label: 'Attendance register' },
  { value: 'other', label: 'Other evidence' },
];

export function fisaEvidenceTagLabel(tag: FisaEvidenceTag): string {
  return FISA_EVIDENCE_TAG_OPTIONS.find((o) => o.value === tag)?.label ?? tag;
}
