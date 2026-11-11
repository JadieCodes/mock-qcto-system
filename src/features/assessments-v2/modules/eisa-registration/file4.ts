// Batch R2 (QCTO 29.15): QCTO's File 4, "Learner Enrolment and Readiness for EISA", as CSV (no
// spreadsheet package may be installed). The SDP downloads it pre-filled, keeps the rows of the
// learners to register, fills the readiness columns and uploads it. Same pattern as the FISA
// learner spreadsheet (approval-of-results/fisaLearnerSpreadsheet.ts): the preview lists every
// row, and nothing is saved unless the whole file is clean.
import { csvField, normaliseHeading, parseCsvTable, withExcelPrefix } from '../../shared/csv/csv';
import { saIdNumberIssue, withRestoredLeadingZero } from '../../shared/validation/saIdNumber';
import { checkReadiness, compactDate, readinessDataOf, type ReadinessContext, type ReadinessData } from './readiness';

export const FILE4_HEADINGS = [
  'SDPCode',
  'QualificationId',
  'NationalId',
  'LearnerAlternateID',
  'AlternativeIdType',
  'EquityCode',
  'NationalityCode',
  'HomeLanguageCode',
  'GenderCode',
  'CitizenResidentStatusCode',
  'SocioeconomicStatusCode',
  'DisabilityStatusCode',
  'DisabilityRating',
  'ImmigrantStatus',
  'LearnerLastName',
  'LearnerFirstName',
  'LearnerMiddleName',
  'LearnerTitle',
  'LearnerBirthDate',
  'LearnerHomeAddress1',
  'LearnerHomeAddress2',
  'LearnerHomeAddress3',
  'LearnerPostalAddress1',
  'LearnerPostalAddress2',
  'LearnerPostalAddress3',
  'LearnerHomeAddressPostalCode',
  'LearnerPostalAddressPostCode',
  'LearnerPhoneNumber',
  'LearnerCellPhoneNumber',
  'LearnerFaxNumber',
  'LearnerEmailAddress',
  'ProvinceCode',
  'STATSSAAreaCode',
  'POPIActAgree',
  'POPIActDate',
  'ExpectedTrainingCompletionDate',
  'StatementofResultsStatus',
  'StatementofResultsIssueDate',
  'AssessmentCentreCode',
  'LearnerReadinessforEISATypeId',
  'FLC',
  'FLCStatementofresultnumber',
  'DateStamp',
] as const;

// The first 36 columns are the enrolment part (already sent to QCTO at enrolment); the rest is
// the "readiness for EISA" part the SDP completes for registration.
export const FILE4_ENROLMENT_COLUMN_COUNT = 36;

const COL_SDP = 'SDPCode';
const COL_QUALIFICATION = 'QualificationId';
const COL_NATIONAL_ID = 'NationalId';
const COL_ALTERNATE_ID = 'LearnerAlternateID';
const COL_LAST_NAME = 'LearnerLastName';
const COL_FIRST_NAME = 'LearnerFirstName';

export const FILE4_NOT_ENROLLED_MESSAGE = 'This learner is not enrolled with your SDP for this qualification';

export interface File4Registration {
  sdpName: string;
  // The SDP's accreditation number is the SDPCode.
  sdpCode: string;
  qualificationId: string;
  // YYYY-MM-DD
  eisaDate: string;
}

export interface File4Learner {
  learnerId: string;
  fullName: string;
  idNumber: string;
}

export interface File4Centre {
  code: string;
  name: string;
}

function fileSafe(text: string): string {
  return text.replace(/[\\/:*?"<>|]+/g, '').trim();
}

// LEISA<yyyymmdd>-<SDP name>.csv, the date being the day of the download.
export function file4FileName(sdpName: string, todayIso: string): string {
  return `LEISA${compactDate(todayIso)}-${fileSafe(sdpName)}.csv`;
}

// First word is the first name, the rest the last name (the enrolment mock holds one full name).
function splitName(fullName: string): { first: string; last: string } {
  const [first = '', ...rest] = fullName.trim().split(/\s+/);
  return { first, last: rest.join(' ') };
}

// One row per learner. SDPCode, QualificationId, NationalId and the names are pre-filled where
// the enrolment record holds them; every other column (all of the readiness part) is blank. All
// values are text, so a leading 0 is kept.
export function buildFile4Csv(registration: File4Registration, learners: File4Learner[]): string {
  const lines = [FILE4_HEADINGS.map(csvField).join(',')];
  for (const learner of learners) {
    const { first, last } = splitName(learner.fullName);
    const values: Record<string, string> = {
      [COL_SDP]: registration.sdpCode,
      [COL_QUALIFICATION]: registration.qualificationId,
      [COL_NATIONAL_ID]: learner.idNumber,
      [COL_LAST_NAME]: last,
      [COL_FIRST_NAME]: first,
    };
    lines.push(FILE4_HEADINGS.map((h) => csvField(values[h] ?? '')).join(','));
  }
  return withExcelPrefix(`${lines.join('\r\n')}\r\n`);
}

export interface File4ParseContext {
  registration: File4Registration;
  enrolled: File4Learner[];
  // The existing block message for a learner who cannot join this registration (CR-040).
  blocked: Map<string, string>;
  // Learners the ASD declined from this registration.
  declinedLearnerIds: Set<string>;
  centres: File4Centre[];
  // YYYY-MM-DD
  today: string;
  // The QASA says FLC is required.
  flcRequired: boolean;
}

export interface File4Row {
  rowNumber: number; // the spreadsheet row, counting the header as row 1
  idNumber: string;
  idZeroRestored: boolean;
  fullName: string;
  learnerId: string | null;
  errors: string[];
  warnings: string[];
}

export interface File4LearnerUpdate {
  learnerId: string;
  data: ReadinessData;
}

export type File4ParseResult =
  | { ok: false; error: string }
  | {
      ok: true;
      rows: File4Row[];
      // Set only when there are no errors at all.
      updates: File4LearnerUpdate[] | null;
    };

// The heading row has to be exactly the 43 headings in order; the message names what is wrong.
export function file4HeadingProblem(header: string[]): string | null {
  const expected = FILE4_HEADINGS.map(normaliseHeading);
  const found = header.map(normaliseHeading);
  if (found.length === expected.length && found.every((h, i) => h === expected[i])) return null;
  const missing = FILE4_HEADINGS.filter((h) => !found.includes(normaliseHeading(h)));
  const extra = header.filter((h) => !expected.includes(normaliseHeading(h)));
  const moved = FILE4_HEADINGS.filter((h, i) => found.includes(normaliseHeading(h)) && found[i] !== normaliseHeading(h));
  const parts: string[] = [];
  if (missing.length > 0) parts.push(`Missing: ${missing.join(', ')}.`);
  if (extra.length > 0) parts.push(`Not part of File 4: ${extra.map((h) => h.trim() || '(blank heading)').join(', ')}.`);
  if (missing.length === 0 && extra.length === 0 && moved.length > 0) parts.push(`Not in QCTO's order: ${moved.join(', ')}.`);
  if (missing.length === 0 && extra.length === 0 && moved.length === 0) parts.push('A heading is repeated.');
  return `The headings are not QCTO's File 4 headings (${FILE4_HEADINGS.length} columns, in QCTO's order). ${parts.join(' ')} Download the file again and do not add, remove or move columns.`;
}

// Tries the delimiter detection against a few headings, so a file with a wrong heading row still
// gets the clear heading message instead of the generic Excel one.
function readFile4Table(text: string) {
  const full = parseCsvTable(text, [...FILE4_HEADINGS]);
  if (full.ok) return full;
  for (const anchor of [COL_NATIONAL_ID, 'DateStamp', COL_SDP]) {
    const partial = parseCsvTable(text, [anchor]);
    if (partial.ok) return partial;
  }
  return full;
}

export function parseFile4(text: string, context: File4ParseContext): File4ParseResult {
  const parsed = readFile4Table(text);
  if (!parsed.ok) return parsed;
  const table = parsed.rows;
  const headingProblem = file4HeadingProblem(table[0]);
  if (headingProblem) return { ok: false, error: headingProblem };
  if (table.length === 1) return { ok: false, error: 'The file has headings but no rows. Keep one row per learner to register.' };

  const columnOf = (name: string) => FILE4_HEADINGS.indexOf(name as (typeof FILE4_HEADINGS)[number]);
  const cell = (cells: string[], name: string) => (cells[columnOf(name)] ?? '').trim();
  const { registration } = context;
  const readinessContext: ReadinessContext = {
    eisaDate: registration.eisaDate,
    today: context.today,
    accreditedCentreCodes: context.centres.map((c) => c.code),
    flcRequired: context.flcRequired,
  };

  const updates: File4LearnerUpdate[] = [];
  const rows: File4Row[] = table.slice(1).map((cells, i) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const sdpCode = cell(cells, COL_SDP);
    if (sdpCode !== registration.sdpCode) errors.push(`${COL_SDP} "${sdpCode}" does not match this registration (${registration.sdpCode}).`);
    const qualificationId = cell(cells, COL_QUALIFICATION);
    if (qualificationId !== registration.qualificationId) {
      errors.push(`${COL_QUALIFICATION} "${qualificationId}" does not match this registration (${registration.qualificationId}).`);
    }

    const nationalId = cell(cells, COL_NATIONAL_ID);
    const alternateId = cell(cells, COL_ALTERNATE_ID);
    const { idNumber, restored: idZeroRestored } = withRestoredLeadingZero(nationalId || alternateId);
    let learner: File4Learner | null = null;
    if (idNumber === '') {
      errors.push(`${COL_NATIONAL_ID} or ${COL_ALTERNATE_ID} is blank.`);
    } else {
      const idIssue = nationalId ? saIdNumberIssue(idNumber) : null;
      if (idIssue) {
        errors.push(idIssue);
      } else {
        learner = context.enrolled.find((l) => l.idNumber === idNumber) ?? null;
        if (!learner) errors.push(FILE4_NOT_ENROLLED_MESSAGE);
      }
    }

    if (learner) {
      if (context.declinedLearnerIds.has(learner.learnerId)) {
        errors.push(`${learner.fullName} was declined from this registration by the ASD and cannot be added to it again.`);
      }
      const block = context.blocked.get(learner.learnerId);
      if (block) errors.push(block);

      // QCTO already holds the enrolment columns, so a difference is only a warning.
      const { first, last } = splitName(learner.fullName);
      const lastName = cell(cells, COL_LAST_NAME);
      const firstName = cell(cells, COL_FIRST_NAME);
      if (lastName !== '' && lastName.toLowerCase() !== last.toLowerCase()) warnings.push(`${COL_LAST_NAME} "${lastName}" differs from the enrolment record ("${last}").`);
      if (firstName !== '' && firstName.toLowerCase() !== first.toLowerCase()) warnings.push(`${COL_FIRST_NAME} "${firstName}" differs from the enrolment record ("${first}").`);
    }

    const input = {
      statementStatus: cell(cells, 'StatementofResultsStatus'),
      statementIssueDate: cell(cells, 'StatementofResultsIssueDate'),
      assessmentCentreCode: cell(cells, 'AssessmentCentreCode'),
      readinessType: cell(cells, 'LearnerReadinessforEISATypeId'),
      flc: cell(cells, 'FLC'),
      flcStatementNumber: cell(cells, 'FLCStatementofresultnumber'),
      dateStamp: cell(cells, 'DateStamp'),
    };
    const check = checkReadiness(input, readinessContext);
    errors.push(...check.errors);
    warnings.push(...check.warnings);

    const data = readinessDataOf(input, context.centres);
    if (learner && data && errors.length === 0) updates.push({ learnerId: learner.learnerId, data });
    return { rowNumber: i + 2, idNumber, idZeroRestored, fullName: learner?.fullName ?? '', learnerId: learner?.learnerId ?? null, errors, warnings };
  });

  // The same learner twice would let the second row silently win.
  for (const row of rows) {
    if (!row.learnerId) continue;
    const same = rows.filter((r) => r.learnerId === row.learnerId);
    if (same.length > 1) row.errors.push(`This learner appears more than once in the file (rows ${same.map((r) => r.rowNumber).join(', ')}).`);
  }

  return { ok: true, rows, updates: rows.every((r) => r.errors.length === 0) ? updates : null };
}
