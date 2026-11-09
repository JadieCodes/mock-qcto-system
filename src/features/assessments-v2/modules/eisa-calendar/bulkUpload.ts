import { csvField, parseCsv } from '../../shared/csv/csv';
import { toIsoDate } from '../../shared/dates/workingDays';
import { minimumDateCount } from './api';
import { checkSittingDate } from './dateChecks';
import { calcRegistrationClosingDate, isRegistrationClosed } from './registrationClosing';
import type { EisaSitting, EligibleQualification, ProposeSittingBatchInput } from './types';

// QCTO feedback 3.4: bulk upload of EISA dates on the QP side. No spreadsheet library is
// installed, so the file is CSV (the template is generated as CSV too). The QP name comes from
// the logged-in person and the registration closing date is calculated — neither is in the file.
export const BULK_COLUMNS = {
  title: 'Qualification title',
  qualificationId: 'Qualification ID (SAQA)',
  nqfLevel: 'NQF level',
  credits: 'Credit value',
  date: 'EISA date',
} as const;

type BulkColumnKey = keyof typeof BULK_COLUMNS;
const COLUMN_KEYS: BulkColumnKey[] = ['title', 'qualificationId', 'nqfLevel', 'credits', 'date'];

export const BULK_TEMPLATE_FILE_NAME = 'eisa-dates-template.csv';

export interface BulkRow {
  rowNumber: number; // the spreadsheet row, counting the header as row 1
  qualificationTitle: string;
  qualificationId: string;
  nqfLevel: string;
  credits: string;
  dateText: string;
  date: string | null;
  registrationCloses: string | null;
  qualification: EligibleQualification | null;
  errors: string[];
}

export type BulkParseResult = { ok: true; rows: BulkRow[] } | { ok: false; error: string };

// One row per required sitting for each of this QP's qualifications, with the date left blank.
export function buildTemplateCsv(qualifications: EligibleQualification[]): string {
  const lines = [COLUMN_KEYS.map((k) => csvField(BULK_COLUMNS[k])).join(',')];
  for (const q of qualifications) {
    const rows = minimumDateCount(q.sittingsPerYear, q.onDemand);
    for (let i = 0; i < rows; i++) {
      lines.push([q.qualificationTitle, q.qualificationId, q.nqfLevel ?? '', q.credits ?? '', ''].map(csvField).join(','));
    }
  }
  return `${lines.join('\r\n')}\r\n`;
}

// Accepts 2027-03-15, 2027/03/15 and 15/03/2027 (how spreadsheets often save dates) and checks
// that the day really exists.
export function normaliseDate(text: string): string | null {
  const value = text.trim();
  let y: number, m: number, d: number;
  let match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(value);
  if (match) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    match = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(value);
    if (!match) return null;
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return toIsoDate(date);
}

const BLOCKING_SITTING_STATUSES: EisaSitting['status'][] = ['proposed', 'approved', 'published', 'postponed'];

export function parseBulkFile(
  text: string,
  ownQualifications: EligibleQualification[],
  existingSittings: EisaSitting[],
  todayIso: string = toIsoDate(new Date()),
): BulkParseResult {
  const table = parseCsv(text).filter((cells) => cells.some((c) => c.trim() !== ''));
  if (table.length === 0) return { ok: false, error: 'The file is empty. Download the template and add your dates to it.' };

  // Extra columns are ignored; a missing required column rejects the whole file.
  const header = table[0].map((h) => h.trim().toLowerCase());
  const index = new Map<BulkColumnKey, number>();
  const missing: string[] = [];
  for (const key of COLUMN_KEYS) {
    const at = header.indexOf(BULK_COLUMNS[key].toLowerCase());
    if (at === -1) missing.push(BULK_COLUMNS[key]);
    index.set(key, at);
  }
  if (missing.length > 0) {
    return {
      ok: false,
      error: `The file is missing the required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Use the template, keep its column headings, and save it as CSV.`,
    };
  }
  if (table.length === 1) return { ok: false, error: 'The file has headings but no rows. Add one row per EISA date.' };

  const cell = (cells: string[], key: BulkColumnKey) => (cells[index.get(key) ?? -1] ?? '').trim();

  const rows: BulkRow[] = table.slice(1).map((cells, i) => {
    const qualificationId = cell(cells, 'qualificationId');
    const qualificationTitle = cell(cells, 'title');
    const dateText = cell(cells, 'date');
    const errors: string[] = [];

    const qualification = ownQualifications.find((q) => q.qualificationId === qualificationId) ?? null;
    if (!qualificationId) {
      errors.push('The qualification ID is missing.');
    } else if (!qualification) {
      errors.push(`Qualification ID ${qualificationId} is not one of your qualifications with accredited SDPs.`);
    } else if (qualificationTitle && qualificationTitle.toLowerCase() !== qualification.qualificationTitle.toLowerCase()) {
      errors.push(`The title does not match qualification ID ${qualificationId} ("${qualification.qualificationTitle}").`);
    }

    const date = dateText ? normaliseDate(dateText) : null;
    if (!dateText) {
      errors.push('The EISA date is missing.');
    } else if (!date) {
      errors.push(`"${dateText}" is not a valid date. Use the format YYYY-MM-DD.`);
    } else {
      const check = checkSittingDate(date, todayIso);
      errors.push(...check.reasons);
      if (isRegistrationClosed(date, todayIso)) {
        errors.push(`The registration closing date (${calcRegistrationClosingDate(date)}) has already passed.`);
      }
      if (
        qualification &&
        existingSittings.some(
          (s) => s.date === date && s.qpId === qualification.qpId && s.qualificationId === qualification.qualificationId && BLOCKING_SITTING_STATUSES.includes(s.status),
        )
      ) {
        errors.push(`${date} is already on the EISA Calendar for this qualification.`);
      }
    }

    return {
      rowNumber: i + 2,
      qualificationTitle,
      qualificationId,
      nqfLevel: cell(cells, 'nqfLevel'),
      credits: cell(cells, 'credits'),
      dateText,
      date,
      registrationCloses: date ? calcRegistrationClosingDate(date) : null,
      qualification,
      errors,
    };
  });

  // No duplicate dates for the same qualification within the file.
  rows.forEach((row) => {
    if (!row.date || !row.qualification) return;
    const same = rows.filter((r) => r.date === row.date && r.qualification?.qualificationId === row.qualification?.qualificationId);
    if (same.length > 1) {
      row.errors.push(`Duplicate date: ${row.date} appears more than once for this qualification (rows ${same.map((r) => r.rowNumber).join(', ')}).`);
    }
  });

  // The number of dates per qualification and year must match its sittings per year exactly
  // (at least one for "On demand").
  for (const group of groupRows(rows)) {
    const q = group.qualification;
    if (q.onDemand || group.rows.length === q.sittingsPerYear) continue;
    const message = `"${q.qualificationTitle}" needs ${q.sittingsPerYear} date(s) for ${group.year} — the file has ${group.rows.length}.`;
    group.rows.forEach((r) => r.errors.push(message));
  }

  return { ok: true, rows };
}

interface BulkGroup {
  qualification: EligibleQualification;
  year: number;
  dates: string[];
  rows: BulkRow[];
}

// Rows with a known qualification and a valid date, grouped by qualification and year — one
// proposal batch each.
function groupRows(rows: BulkRow[]): BulkGroup[] {
  const groups = new Map<string, BulkGroup>();
  for (const row of rows) {
    if (!row.qualification || !row.date) continue;
    const year = Number(row.date.slice(0, 4));
    const key = `${row.qualification.qualificationId}|${year}`;
    const group = groups.get(key) ?? { qualification: row.qualification, year, dates: [], rows: [] };
    group.dates.push(row.date);
    group.rows.push(row);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function toBatchInputs(rows: BulkRow[], submittedBy: string, submittedById: string): ProposeSittingBatchInput[] {
  return groupRows(rows).map(({ qualification: q, year, dates }) => ({
    qualificationId: q.qualificationId,
    qualificationTitle: q.qualificationTitle,
    qpId: q.qpId,
    qpName: q.qpName,
    year,
    dates,
    submittedBy,
    submittedById,
  }));
}
