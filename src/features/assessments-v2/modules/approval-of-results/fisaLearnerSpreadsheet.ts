// Batch P (05.21): the FISA "Learner spreadsheet" is QCTO's sheet 3, "Learner Data & Achievement",
// of the "QCTO Skills Programme Enrolment Form" (see the QCTO Data Load Specifications for Skills
// Programmes), as CSV. The SDP downloads it pre-filled, fills in DATE OF FISA and FINAL FISA
// RESULT and uploads it; a clean file fills the outcomes and is attached as the "Learner
// spreadsheet" evidence. Nothing is calculated: the result is a code the SDP types.
import { csvField, normaliseHeading, parseCsvTable, withExcelPrefix } from '../../shared/csv/csv';
import { saIdNumberIssue, withRestoredLeadingZero } from '../../shared/validation/saIdNumber';
import { FISA_RESULT_CODE_LIST, fisaOutcomeOfCode, NOT_ENROLLED_MESSAGE } from './config';
import type { FisaResultsBatch, LearnerResult } from './types';

export const FISA_SHEET_HEADINGS = [
  'SDP Accreditation Number',
  'National ID',
  'LearnerAlternateID',
  'AlternateIDType',
  'LearnerLastName',
  'LearnerFirstName',
  'LearnerMiddleName',
  'LearnerTitle',
  'LearnerBirthDate',
  'EquityCode',
  'NationalityCode',
  'HomeLanguageCode',
  'GenderCode',
  'CitizenStatusCode',
  'SocioeconomicCode',
  'DisabilityCode',
  'DisabilityRating',
  'ImmigrantStatus',
  'HomeAddress1',
  'HomeAddress2',
  'HomeAddress3',
  'PostalAddress1',
  'PostalAddress2',
  'PostalAddress3',
  'LearnerHomeAddressPostalCode',
  'LearnerHomeAddressPhysicalCode',
  'LearnerPhoneNumber',
  'LearnerCellPhoneNumber',
  'LearnerFaxNumber',
  'LearnerEmailAddress',
  'ProvinceCode',
  'STATSSAAreaCode',
  'POPIActAgree',
  'POPIActDate',
  'SkillsProgramme ID',
  'EmploymentStatus',
  'LearnerEnrolledDate',
  'DATE OF FISA',
  'FINAL FISA RESULT',
  'Date Submitted to QCTO',
] as const;

const COL_ACCREDITATION = 'SDP Accreditation Number';
const COL_NATIONAL_ID = 'National ID';
const COL_ALTERNATE_ID = 'LearnerAlternateID';
const COL_SKILLS_PROGRAMME = 'SkillsProgramme ID';
const COL_FISA_DATE = 'DATE OF FISA';
const COL_RESULT = 'FINAL FISA RESULT';

// What the system holds about a learner enrolled for the batch's skills programme.
export interface FisaSheetLearner {
  learnerId: string;
  fullName: string;
  idNumber: string;
  // YYYY-MM-DD
  enrolledDate: string;
}

export interface FisaSheetBatch {
  sdpName: string;
  sdpAccreditationNumber: string;
  skillsProgrammeTitle: string;
  skillsProgrammeId: string;
  fisaDates: string[];
}

export function fisaSheetBatchOf(batch: FisaResultsBatch, sdpAccreditationNumber: string): FisaSheetBatch {
  return {
    sdpName: batch.sdpName,
    sdpAccreditationNumber,
    skillsProgrammeTitle: batch.skillsProgrammeTitle,
    skillsProgrammeId: batch.skillsProgrammeId,
    fisaDates: batch.fisaDates,
  };
}

function fileSafe(text: string): string {
  return text.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function fisaSheetFileName(batch: FisaSheetBatch): string {
  return `Learner_Data_and_Achievement_${fileSafe(batch.skillsProgrammeTitle)}_${fileSafe(batch.sdpName)}.csv`;
}

function compactDate(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

// First word is the first name, the rest the last name (the enrolment mock holds one full name).
function splitName(fullName: string): { first: string; last: string } {
  const [first = '', ...rest] = fullName.trim().split(/\s+/);
  return { first, last: rest.join(' ') };
}

// One row per learner on the batch. SDP Accreditation Number, National ID, names, SkillsProgramme ID
// and LearnerEnrolledDate (YYYYMMDD) are pre-filled; DATE OF FISA, FINAL FISA RESULT and Date
// Submitted to QCTO stay blank for the SDP; every other column is left blank.
export function buildFisaSpreadsheetCsv(batch: FisaSheetBatch, onBatch: LearnerResult[], enrolled: FisaSheetLearner[]): string {
  const lines = [FISA_SHEET_HEADINGS.map(csvField).join(',')];
  for (const result of onBatch) {
    const learner = enrolled.find((l) => l.learnerId === result.learnerId);
    const { first, last } = splitName(result.fullName);
    const values: Record<string, string> = {
      [COL_ACCREDITATION]: batch.sdpAccreditationNumber,
      [COL_NATIONAL_ID]: result.idNumber,
      LearnerLastName: last,
      LearnerFirstName: first,
      [COL_SKILLS_PROGRAMME]: batch.skillsProgrammeId,
      LearnerEnrolledDate: learner ? compactDate(learner.enrolledDate) : '',
    };
    lines.push(FISA_SHEET_HEADINGS.map((h) => csvField(values[h] ?? '')).join(','));
  }
  return withExcelPrefix(`${lines.join('\r\n')}\r\n`);
}

export interface FisaSheetRow {
  rowNumber: number; // the spreadsheet row, counting the header as row 1
  idNumber: string;
  idZeroRestored: boolean;
  fullName: string;
  learnerId: string | null;
  dateText: string;
  resultText: string;
  errors: string[];
}

export type FisaSheetParseResult =
  | { ok: false; error: string }
  | {
      ok: true;
      rows: FisaSheetRow[];
      // Learners on the batch with no row in the file.
      missingLearners: LearnerResult[];
      // Set only when there are no errors at all: the batch's learners with their outcomes.
      learnerResults: LearnerResult[] | null;
    };

function isRealCompactDate(text: string): boolean {
  if (!/^\d{8}$/.test(text)) return false;
  const year = Number(text.slice(0, 4));
  const month = Number(text.slice(4, 6));
  const day = Number(text.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// Headings match case-insensitively; other columns are ignored. A learner in the file who is
// enrolled but not yet on the batch is added to it; a learner on the batch who is not in the file
// is an error. SDP Accreditation Number and SkillsProgramme ID are checked when the file has a
// value in them; a blank cell is not an error.
export function parseFisaSpreadsheet(text: string, batch: FisaSheetBatch, onBatch: LearnerResult[], enrolled: FisaSheetLearner[]): FisaSheetParseResult {
  const parsed = parseCsvTable(text, [COL_FISA_DATE, COL_RESULT]);
  if (!parsed.ok) return parsed;
  const table = parsed.rows;
  const header = table[0].map(normaliseHeading);
  const columnOf = (name: string) => header.indexOf(normaliseHeading(name));
  const nationalIdColumn = columnOf(COL_NATIONAL_ID);
  const alternateIdColumn = columnOf(COL_ALTERNATE_ID);
  if (nationalIdColumn < 0 && alternateIdColumn < 0) return { ok: false, error: `The file needs a ${COL_NATIONAL_ID} or ${COL_ALTERNATE_ID} column.` };
  if (table.length === 1) return { ok: false, error: 'The file has headings but no rows. Add one row per learner.' };

  const accreditationColumn = columnOf(COL_ACCREDITATION);
  const skillsProgrammeColumn = columnOf(COL_SKILLS_PROGRAMME);
  const dateColumn = columnOf(COL_FISA_DATE);
  const resultColumn = columnOf(COL_RESULT);
  const cell = (cells: string[], column: number) => (column >= 0 ? (cells[column] ?? '').trim() : '');
  const batchDates = batch.fisaDates.map(compactDate);

  const outcomes = new Map<string, LearnerResult['outcome']>();
  const rows: FisaSheetRow[] = table.slice(1).map((cells, i) => {
    const errors: string[] = [];
    const nationalId = cell(cells, nationalIdColumn);
    const alternateId = cell(cells, alternateIdColumn);
    const { idNumber, restored: idZeroRestored } = withRestoredLeadingZero(nationalId || alternateId);

    let learner: FisaSheetLearner | null = null;
    if (idNumber === '') {
      errors.push(`${COL_NATIONAL_ID} or ${COL_ALTERNATE_ID} is blank.`);
    } else {
      const idIssue = nationalId ? saIdNumberIssue(idNumber) : null;
      if (idIssue) {
        errors.push(idIssue);
      } else {
        learner = enrolled.find((l) => l.idNumber === idNumber) ?? null;
        if (!learner) errors.push(NOT_ENROLLED_MESSAGE);
      }
    }

    const resultText = cell(cells, resultColumn);
    const outcome = fisaOutcomeOfCode(resultText);
    if (!outcome) errors.push(`${COL_RESULT} "${resultText}" is not valid. Use one of: ${FISA_RESULT_CODE_LIST}.`);

    const dateText = cell(cells, dateColumn);
    if (!isRealCompactDate(dateText)) {
      errors.push(`${COL_FISA_DATE} "${dateText}" is not a valid date. Use YYYYMMDD, for example 20261105.`);
    } else if (!batchDates.includes(dateText)) {
      errors.push(`${COL_FISA_DATE} ${dateText} is different from the FISA date of this batch (${batchDates.join(', ')}).`);
    }

    const accreditation = cell(cells, accreditationColumn);
    if (accreditation !== '' && accreditation !== batch.sdpAccreditationNumber) {
      errors.push(`${COL_ACCREDITATION} "${accreditation}" does not match this batch (${batch.sdpAccreditationNumber}).`);
    }
    const skillsProgramme = cell(cells, skillsProgrammeColumn);
    if (skillsProgramme !== '' && skillsProgramme !== batch.skillsProgrammeId) {
      errors.push(`${COL_SKILLS_PROGRAMME} "${skillsProgramme}" does not match this batch (${batch.skillsProgrammeId}).`);
    }

    if (learner && outcome) outcomes.set(learner.learnerId, outcome);
    return { rowNumber: i + 2, idNumber, idZeroRestored, fullName: learner?.fullName ?? '', learnerId: learner?.learnerId ?? null, dateText, resultText, errors };
  });

  // The same learner twice would let the second row silently win.
  for (const row of rows) {
    if (!row.learnerId) continue;
    const same = rows.filter((r) => r.learnerId === row.learnerId);
    if (same.length > 1) row.errors.push(`This learner appears more than once in the file (rows ${same.map((r) => r.rowNumber).join(', ')}).`);
  }

  const inFile = new Set(rows.map((r) => r.learnerId));
  const missingLearners = onBatch.filter((r) => !inFile.has(r.learnerId));
  const clean = rows.every((r) => r.errors.length === 0) && missingLearners.length === 0;
  const learnerResults = clean
    ? enrolled.flatMap((l): LearnerResult[] => {
        const outcome = outcomes.get(l.learnerId);
        return outcome ? [{ learnerId: l.learnerId, fullName: l.fullName, idNumber: l.idNumber, outcome }] : [];
      })
    : null;
  return { ok: true, rows, missingLearners, learnerResults };
}
