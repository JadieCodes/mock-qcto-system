import type { Role } from '../../types';
import type { EisaEvidenceTag, FisaEvidenceTag, OnFileDocumentRecord } from './types';

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

// QCTO feedback 29.23: the tag the QP puts on each EISA evidence file. Our reading of the 29 Oct
// meeting until QCTO confirms (progress.md, Batch M).
export const EISA_EVIDENCE_TAG_OPTIONS: { value: EisaEvidenceTag; label: string }[] = [
  { value: 'marking-report', label: 'Marking report' },
  { value: 'moderation-report', label: 'Moderation report' },
  { value: 'confirmation-letter', label: 'Confirmation letter' },
  { value: 'attendance-register', label: 'Attendance register' },
  { value: 'other', label: 'Other evidence' },
];

// Submit stays blocked until a file with each of these tags is uploaded.
export const EISA_REQUIRED_EVIDENCE_TAGS: EisaEvidenceTag[] = ['marking-report', 'moderation-report'];

// Batch M.1: these two tags can be used once only; the other three can tag several files.
export const EISA_SINGLE_USE_EVIDENCE_TAGS: EisaEvidenceTag[] = ['marking-report', 'moderation-report'];

export const EISA_EVIDENCE_INSTRUCTION =
  'Upload the marking report, the moderation report, the confirmation letters and the attendance register for this EISA. Tag each file.';

export function eisaEvidenceTagLabel(tag: EisaEvidenceTag): string {
  return EISA_EVIDENCE_TAG_OPTIONS.find((o) => o.value === tag)?.label ?? tag;
}

export const EISA_DECLARATION_TEXT = 'I confirm that the results and evidence submitted are accurate and complete.';

// QCTO feedback 29.25: how an "Already on file" choice reads on screen and in the report.
export function onFileChoiceText(d: Pick<OnFileDocumentRecord, 'choice' | 'replacement'>): string {
  return d.choice === 'replaced' && d.replacement ? `Replaced with ${d.replacement.fileName}` : 'Confirmed';
}

// ---------------------------------------------------------------------------
// Batch N1: outcome letters, verification codes and the Certification recommendation letter.
// ---------------------------------------------------------------------------

export const CHIEF_DIRECTOR_LETTER_TITLE = 'Chief Director: Occupational Qualifications Management';

// Assumption (progress.md, Batch N1): the "Director: Assessment" who signs the recommendation
// letters is one mock person, not a role in this build.
export const DIRECTOR_ASSESSMENT_NAME = 'Dr Ntombi Sithebe';

export const CERTIFICATION_ADDRESSEE = ['Director: Certification', 'Quality Council for Trades and Occupations', '256 Glyn Street', 'Hatfield', '0083'];

export const EISA_APPEALS_EMAIL = 'EISAResults@qcto.org.za';

// The EISA "FILE NAME" on the recommendation letter. Assumption: QCTO's real pattern is unknown.
export function eisaCertificationFileName(qpCode: string, saqaId: string, lastEisaDate: string): string {
  return `QCTO03-${qpCode}-${saqaId}-${lastEisaDate.replace(/-/g, '')}`;
}
