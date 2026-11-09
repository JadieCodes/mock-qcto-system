// QCTO feedback 05.24: "File 3" — the QP's results spreadsheet, uploaded as CSV and used to fill
// the capture grid. ASSUMPTION, until QCTO confirms its own File 3 format (open question in
// docs/assessments-v2/progress.md, "Batch L2"): the columns below are our own simple version —
// Learner ID number, Learner name, one column per component (header = component name) and
// Absent (Y/N). The marks are checked with the same rules as the screen (markEntry.ts) and the
// ID numbers with the shared check (05.23). Batch L1.1: marks are whole numbers — a decimal
// ("45,5" or "45.5") is still read here, then rejected by markIssue() with "Marks must be whole
// numbers".
import { csvField, normaliseHeading, parseCsvTable, withExcelPrefix } from '../../shared/csv/csv';
import { saIdNumberIssue, withRestoredLeadingZero } from '../../shared/validation/saIdNumber';
import { markIssue } from './markEntry';
import type { CaptureLearner, EisaLearnerResult, ResultsComponent } from './types';

export const FILE3_ID_COLUMN = 'Learner ID number';
export const FILE3_NAME_COLUMN = 'Learner name';
export const FILE3_ABSENT_COLUMN = 'Absent (Y/N)';

export function file3TemplateFileName(sittingDate: string): string {
  return `file-3-results-template-${sittingDate}.csv`;
}

// One row per learner on the batch, marks blank.
export function buildFile3TemplateCsv(components: ResultsComponent[], learners: CaptureLearner[]): string {
  const header = [FILE3_ID_COLUMN, FILE3_NAME_COLUMN, ...components.map((c) => c.name), FILE3_ABSENT_COLUMN];
  const lines = [header.map(csvField).join(',')];
  for (const l of learners) {
    lines.push([l.idNumber, l.fullName, ...components.map(() => ''), ''].map(csvField).join(','));
  }
  return withExcelPrefix(`${lines.join('\r\n')}\r\n`);
}

export interface File3Row {
  rowNumber: number; // the spreadsheet row, counting the header as row 1
  idNumber: string;
  // Batch L2.1: Excel dropped the leading 0 and it was put back.
  idZeroRestored: boolean;
  fullName: string;
  // The batch learner this row matched, or null (invalid or unknown ID number).
  learnerId: string | null;
  absent: boolean;
  // Component id -> the text in the file, for the preview.
  markTexts: Record<string, string>;
  errors: string[];
}

export type File3ParseResult =
  | { ok: false; error: string }
  | {
      ok: true;
      rows: File3Row[];
      // Learners on the batch with no row in the file.
      missingLearners: CaptureLearner[];
      // Set only when there are no errors at all — what fills the capture grid.
      learnerResults: EisaLearnerResult[] | null;
    };

const NUMBER_PATTERN = /^-?\d+([.,]\d+)?$/;

function parseAbsent(text: string): boolean | null {
  const value = text.trim().toLowerCase();
  if (value === '' || value === 'n' || value === 'no') return false;
  if (value === 'y' || value === 'yes') return true;
  return null;
}

export function parseFile3(text: string, components: ResultsComponent[], learners: CaptureLearner[]): File3ParseResult {
  // Extra columns are ignored; a missing required column (or a file Excel re-formatted) rejects
  // the whole file. Marks keep their text here: "45,5" is read as 45.5, which is then rejected.
  const required = [FILE3_ID_COLUMN, ...components.map((c) => c.name), FILE3_ABSENT_COLUMN];
  const parsed = parseCsvTable(text, required);
  if (!parsed.ok) return parsed;
  const table = parsed.rows;
  const header = table[0].map(normaliseHeading);
  if (table.length === 1) return { ok: false, error: 'The file has headings but no rows. Add one row per learner.' };

  const columnOf = (name: string) => header.indexOf(normaliseHeading(name));
  const idColumn = columnOf(FILE3_ID_COLUMN);
  const nameColumn = columnOf(FILE3_NAME_COLUMN);
  const absentColumn = columnOf(FILE3_ABSENT_COLUMN);
  const cell = (cells: string[], column: number) => (column >= 0 ? (cells[column] ?? '').trim() : '');

  const rows: File3Row[] = table.slice(1).map((cells, i) => {
    const { idNumber, restored: idZeroRestored } = withRestoredLeadingZero(cell(cells, idColumn));
    const errors: string[] = [];
    const idIssue = saIdNumberIssue(idNumber);
    const learner = idIssue ? null : (learners.find((l) => l.idNumber === idNumber) ?? null);
    if (idIssue) errors.push(idIssue);
    else if (!learner) errors.push('Unknown learner: this ID number is not on this batch.');

    const absentText = cell(cells, absentColumn);
    const absent = parseAbsent(absentText);
    if (absent === null) errors.push(`"${absentText}" is not valid in the Absent column. Use Y or N.`);

    const markTexts: Record<string, string> = {};
    for (const c of components) {
      const raw = cell(cells, columnOf(c.name));
      markTexts[c.id] = raw;
      if (absent === true) {
        if (raw !== '') errors.push(`Absent learners cannot have marks (${c.name} has "${raw}").`);
      } else if (absent === false) {
        if (raw !== '' && !NUMBER_PATTERN.test(raw)) {
          errors.push(`The ${c.name} mark "${raw}" is not a number.`);
        } else {
          const mark = raw === '' ? undefined : Number(raw.replace(',', '.'));
          const issue = markIssue(c, mark);
          if (issue) errors.push(issue);
        }
      }
    }
    return {
      rowNumber: i + 2,
      idNumber,
      idZeroRestored,
      fullName: cell(cells, nameColumn) || learner?.fullName || '',
      learnerId: learner?.learnerId ?? null,
      absent: absent === true,
      markTexts,
      errors,
    };
  });

  // The same learner twice would let the second row silently win.
  for (const row of rows) {
    if (!row.learnerId) continue;
    const same = rows.filter((r) => r.learnerId === row.learnerId);
    if (same.length > 1) row.errors.push(`This learner appears more than once in the file (rows ${same.map((r) => r.rowNumber).join(', ')}).`);
  }

  const seen = new Set(rows.map((r) => r.learnerId));
  const missingLearners = learners.filter((l) => !seen.has(l.learnerId));
  const clean = rows.every((r) => r.errors.length === 0) && missingLearners.length === 0;

  const learnerResults = clean
    ? learners.map((l): EisaLearnerResult => {
        const row = rows.find((r) => r.learnerId === l.learnerId);
        const marks: Record<string, number> = {};
        if (row && !row.absent) {
          for (const c of components) marks[c.id] = Number((row.markTexts[c.id] ?? '').replace(',', '.'));
        }
        return { learnerId: l.learnerId, fullName: l.fullName, idNumber: l.idNumber, absent: row?.absent ?? false, marks };
      })
    : null;

  return { ok: true, rows, missingLearners, learnerResults };
}
