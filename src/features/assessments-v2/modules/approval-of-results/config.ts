import type { Role } from '../../types';
import type { EisaEvidenceTag, FisaEvidenceTag, LearnerResultOutcome, OnFileDocumentRecord } from './types';

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

// The tag the SDP puts on each FISA evidence file. Batch P (05.18): QCTO's list of 5 Nov.
export const FISA_EVIDENCE_TAG_OPTIONS: { value: FisaEvidenceTag; label: string; hint: string }[] = [
  { value: 'learner-spreadsheet', label: 'Learner spreadsheet', hint: 'QCTO Learner Data & Achievement sheet with the final FISA results' },
  {
    value: 'verification-report',
    label: 'Verification report',
    hint: 'QCTO FISA Assessment Assurance Verification Report, Sections A–D completed by the SDP, facilitator/assessor, moderator and head of institution',
  },
  { value: 'assessment-instrument', label: 'Assessment instrument', hint: 'Question paper with the memorandum, or the blank rubric' },
  { value: 'attendance-register', label: 'Attendance register', hint: 'The register of learners who attended the FISA' },
  { value: 'completed-practical-rubric', label: 'Completed practical rubric', hint: 'The observation sheet completed by the assessor during the practical' },
  { value: 'other', label: 'Other evidence', hint: 'For example learner scripts (written) or photo/video evidence (practical)' },
];

export function fisaEvidenceTagLabel(tag: FisaEvidenceTag): string {
  return FISA_EVIDENCE_TAG_OPTIONS.find((o) => o.value === tag)?.label ?? tag;
}

// QCTO's report, Section D: Submit stays blocked until a file with each of these tags is added.
export const FISA_REQUIRED_EVIDENCE_TAGS: FisaEvidenceTag[] = ['learner-spreadsheet', 'verification-report', 'assessment-instrument'];

// These two tags can be used once only; the others can tag several files. A tag is fixed once the file is added.
export const FISA_SINGLE_USE_EVIDENCE_TAGS: FisaEvidenceTag[] = ['learner-spreadsheet', 'verification-report'];

// Stored tags from before Batch P. Idempotent: a new tag maps to itself.
export const LEGACY_FISA_EVIDENCE_TAGS: Record<string, FisaEvidenceTag> = {
  marksheet: 'learner-spreadsheet',
  'moderation-report': 'verification-report',
};

export function isFisaEvidenceTag(value: string): value is FisaEvidenceTag {
  return FISA_EVIDENCE_TAG_OPTIONS.some((o) => o.value === value);
}

// 05.21: QCTO's result codes for the FINAL FISA RESULT column. The SDP records the outcome; nothing is calculated.
export const FISA_RESULT_CODES: Record<LearnerResultOutcome, string> = {
  competent: '555',
  'not-yet-competent': '999',
  absent: '777',
};

const FISA_OUTCOME_NAMES: Record<LearnerResultOutcome, string> = {
  competent: 'Competent',
  'not-yet-competent': 'Not yet competent',
  absent: 'Absent',
};

export const FISA_RESULT_CODE_LIST = '555 (Competent), 999 (Not yet competent), 777 (Absent)';

export function fisaOutcomeLabel(outcome: LearnerResultOutcome): string {
  return `${FISA_OUTCOME_NAMES[outcome]} (${FISA_RESULT_CODES[outcome]})`;
}

export function fisaOutcomeOfCode(code: string): LearnerResultOutcome | null {
  return (Object.keys(FISA_RESULT_CODES) as LearnerResultOutcome[]).find((o) => FISA_RESULT_CODES[o] === code.trim()) ?? null;
}

export const NOT_ENROLLED_MESSAGE = 'This learner is not enrolled with your SDP for this skills programme.';

// QCTO feedback 29.23: the tag the QP puts on each EISA evidence file. Our reading of the 29 Oct
// meeting until QCTO confirms (progress.md, Batch M).
export const EISA_EVIDENCE_TAG_OPTIONS: { value: EisaEvidenceTag; label: string }[] = [
  { value: 'marking-report', label: 'Marking report' },
  { value: 'moderation-report', label: 'Moderation report' },
  { value: 'confirmation-letter', label: 'Confirmation letter' },
  { value: 'attendance-register', label: 'Attendance register' },
  { value: 'invigilator-report', label: 'Invigilator report' },
  { value: 'irregularities-report', label: 'Irregularities report' },
  { value: 'other', label: 'Other evidence' },
];

// Batch Z1 (11.4): submit stays blocked until a file with each of these tags is uploaded. The attendance
// register is required because it confirms the learners attended. The irregularities report is required
// only when the QP answers Yes to the irregularities question (EISA_IRREGULARITIES_TAG).
export const EISA_REQUIRED_EVIDENCE_TAGS: EisaEvidenceTag[] = ['marking-report', 'moderation-report', 'attendance-register', 'invigilator-report'];

export const EISA_IRREGULARITIES_TAG: EisaEvidenceTag = 'irregularities-report';
export const EISA_IRREGULARITIES_QUESTION = 'Were any irregularities observed during the EISA?';
export const EISA_IRREGULARITIES_NOT_ASKED = 'Not asked (submitted before 11 Nov 2026)';
export const EISA_IRREGULARITIES_REPORTED = 'The QP reported irregularities – see the Irregularities report';

// Batch M.1: these two tags can be used once only; the other three can tag several files.
export const EISA_SINGLE_USE_EVIDENCE_TAGS: EisaEvidenceTag[] = ['marking-report', 'moderation-report'];

export const EISA_EVIDENCE_INSTRUCTION =
  'Upload the marking report, the moderation report, the attendance register and the invigilator report for this EISA, and the confirmation letters if you have them. If irregularities were observed, upload the irregularities report too. Tag each file.';

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

// Batch Z1 (11.6): the recommendation letter reaches the Certification domain by itself when the batch is approved.
export const RECOMMENDATION_COPY_BUTTON = 'Download a copy';
export const CERTIFICATION_LETTERS_ARRIVE_NOTE = 'Letters arrive here automatically when results are approved.';

export function certificationSentNote(issuedOn: string): string {
  return `Sent to the Certification domain automatically on ${issuedOn}. No download or email is needed.`;
}

export const EISA_APPEALS_EMAIL = 'EISAResults@qcto.org.za';

// The EISA "FILE NAME" on the recommendation letter. Assumption: QCTO's real pattern is unknown.
export function eisaCertificationFileName(qpCode: string, saqaId: string, lastEisaDate: string): string {
  return `QCTO03-${qpCode}-${saqaId}-${lastEisaDate.replace(/-/g, '')}`;
}
