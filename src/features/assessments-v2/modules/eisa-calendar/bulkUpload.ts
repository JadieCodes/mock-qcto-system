import { csvField, normaliseHeading, parseCsvTable, withExcelPrefix, EXCEL_FORMAT_MESSAGE } from '../../shared/csv/csv';
import { toIsoDate } from '../../shared/dates/workingDays';
import { minimumDateCount } from './api';
import {
  buildComponentDates,
  checkSittingComponentDates,
  earliestDate,
  isSingleDateFallback,
  sittingDatesOf,
  type ComponentDaySlot,
} from './componentDays';
import { calcRegistrationClosingDate, isRegistrationClosed } from './registrationClosing';
import type { EisaSitting, EligibleQualification, ProposeSittingBatchInput } from './types';

// QCTO feedback 3.4: bulk upload of EISA dates on the QP side. The template is CSV (it opens in
// Excel); the upload takes a .csv or an .xlsx (shared/files/readXlsx.ts, 29.11). The QP name comes
// from the logged-in person and the registration closing date is calculated — neither is in the file.
// Batch Q2 (29.12): the headings are always the same, so there is one row per sitting and per
// component day, not one column per component.
export const BULK_COLUMNS = {
  title: 'Qualification title',
  qualificationId: 'Qualification ID (SAQA)',
  nqfLevel: 'NQF level',
  credits: 'Credit value',
  sittingNumber: 'Sitting number',
  component: 'Component',
  componentDay: 'Component day',
  date: 'EISA date',
} as const;

type BulkColumnKey = keyof typeof BULK_COLUMNS;
const COLUMN_KEYS: BulkColumnKey[] = ['title', 'qualificationId', 'nqfLevel', 'credits', 'sittingNumber', 'component', 'componentDay', 'date'];
const OLD_COLUMN_KEYS: BulkColumnKey[] = ['title', 'qualificationId', 'nqfLevel', 'credits', 'date'];

export const BULK_TEMPLATE_FILE_NAME = 'eisa-dates-template.csv';
export const OLD_TEMPLATE_MESSAGE = 'This is the old template. Download the new template.';

export interface BulkRow {
  rowNumber: number; // the spreadsheet row, counting the header as row 1
  qualificationTitle: string;
  qualificationId: string;
  nqfLevel: string;
  credits: string;
  sittingText: string;
  componentText: string;
  dayText: string;
  dateText: string;
  sittingNumber: number | null;
  // Index into the qualification's component day slots; null when the component or day is wrong.
  slotIndex: number | null;
  date: string | null;
  registrationCloses: string | null;
  qualification: EligibleQualification | null;
  errors: string[];
}

export type BulkParseResult = { ok: true; rows: BulkRow[] } | { ok: false; error: string };

// One row per sitting and component day for each of this QP's qualifications, with the date left
// blank. The sittings per year come from the QASA (one sitting for on demand).
export function buildTemplateCsv(qualifications: EligibleQualification[]): string {
  const lines = [COLUMN_KEYS.map((k) => csvField(BULK_COLUMNS[k])).join(',')];
  for (const q of qualifications) {
    const sittings = minimumDateCount(q.sittingsPerYear, q.onDemand);
    for (let sitting = 1; sitting <= sittings; sitting++) {
      for (const slot of q.componentSlots) {
        lines.push(
          [q.qualificationTitle, q.qualificationId, q.nqfLevel ?? '', q.credits ?? '', String(sitting), slot.componentName, String(slot.day), ''].map(csvField).join(','),
        );
      }
    }
  }
  return withExcelPrefix(`${lines.join('\r\n')}\r\n`);
}

// Accepts 2027-03-15, 2027/03/15 and 15/03/2027 (how Excel saves dates on South African
// settings) and checks that the day really exists.
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

function wholeNumber(text: string): number | null {
  return /^\d+$/.test(text.trim()) ? Number(text.trim()) : null;
}

// A CSV file: the headings are checked first, an old 5-column file gets the heading message and
// the "old template" line.
export function parseBulkFile(
  text: string,
  ownQualifications: EligibleQualification[],
  existingSittings: EisaSitting[],
  todayIso: string = toIsoDate(new Date()),
): BulkParseResult {
  // Extra columns are ignored; a missing required column (or a file Excel re-formatted) rejects
  // the whole file.
  const parsed = parseCsvTable(text, COLUMN_KEYS.map((k) => BULK_COLUMNS[k]));
  if (!parsed.ok) {
    const old = parseCsvTable(text, OLD_COLUMN_KEYS.map((k) => BULK_COLUMNS[k]));
    return old.ok ? { ok: false, error: `${parsed.error} ${OLD_TEMPLATE_MESSAGE}` } : parsed;
  }
  return parseBulkTable(parsed.rows, ownQualifications, existingSittings, todayIso);
}

// The same checks for rows already read from a file (an .xlsx comes through here).
export function parseBulkTable(
  rows: string[][],
  ownQualifications: EligibleQualification[],
  existingSittings: EisaSitting[],
  todayIso: string = toIsoDate(new Date()),
): BulkParseResult {
  const table = rows.filter((cells) => cells.some((c) => c.trim() !== ''));
  if (table.length === 0) return { ok: false, error: 'The file is empty. Download the template and fill it in.' };
  const header = table[0].map(normaliseHeading);
  const hasAll = (keys: BulkColumnKey[]) => keys.every((k) => header.includes(normaliseHeading(BULK_COLUMNS[k])));
  if (!hasAll(COLUMN_KEYS)) {
    return { ok: false, error: hasAll(OLD_COLUMN_KEYS) ? `${EXCEL_FORMAT_MESSAGE} ${OLD_TEMPLATE_MESSAGE}` : EXCEL_FORMAT_MESSAGE };
  }
  const index = new Map<BulkColumnKey, number>(COLUMN_KEYS.map((key) => [key, header.indexOf(normaliseHeading(BULK_COLUMNS[key]))]));
  if (table.length === 1) return { ok: false, error: 'The file has headings but no rows. Add one row per sitting and component day.' };

  const cell = (cells: string[], key: BulkColumnKey) => (cells[index.get(key) ?? -1] ?? '').trim();

  const result: BulkRow[] = table.slice(1).map((cells, i) => {
    const qualificationId = cell(cells, 'qualificationId');
    const qualificationTitle = cell(cells, 'title');
    const dateText = cell(cells, 'date');
    const sittingText = cell(cells, 'sittingNumber');
    const componentText = cell(cells, 'component');
    const dayText = cell(cells, 'componentDay');
    const errors: string[] = [];

    const qualification = ownQualifications.find((q) => q.qualificationId === qualificationId) ?? null;
    if (!qualificationId) {
      errors.push('The qualification ID is missing.');
    } else if (!qualification) {
      errors.push(`Qualification ID ${qualificationId} is not one of your qualifications with accredited SDPs.`);
    } else if (qualificationTitle && qualificationTitle.toLowerCase() !== qualification.qualificationTitle.toLowerCase()) {
      errors.push(`The title does not match qualification ID ${qualificationId} ("${qualification.qualificationTitle}").`);
    }

    const sittingNumber = wholeNumber(sittingText);
    if (sittingNumber === null || sittingNumber < 1) errors.push('The sitting number must be a whole number from 1.');

    const slotIndex = qualification ? findSlot(qualification.componentSlots, componentText, dayText, errors) : null;

    const date = dateText ? normaliseDate(dateText) : null;
    if (!dateText) errors.push('The EISA date is missing.');
    else if (!date) errors.push(`"${dateText}" is not a valid date. Use the format YYYY-MM-DD.`);

    return {
      rowNumber: i + 2,
      qualificationTitle,
      qualificationId,
      nqfLevel: cell(cells, 'nqfLevel'),
      credits: cell(cells, 'credits'),
      sittingText,
      componentText,
      dayText,
      dateText,
      sittingNumber: sittingNumber !== null && sittingNumber >= 1 ? sittingNumber : null,
      slotIndex,
      date,
      registrationCloses: null,
      qualification,
      errors,
    };
  });

  // The same sitting, component and day twice.
  const byKey = new Map<string, BulkRow[]>();
  for (const row of result) {
    if (!row.qualification || row.sittingNumber === null || row.slotIndex === null) continue;
    const key = `${row.qualification.qualificationId}|${row.sittingNumber}|${row.slotIndex}`;
    byKey.set(key, [...(byKey.get(key) ?? []), row]);
  }
  for (const same of byKey.values()) {
    if (same.length < 2) continue;
    same.forEach((r) =>
      r.errors.push(`Duplicate: sitting ${r.sittingNumber}, ${r.componentText || 'EISA date'} day ${r.dayText || 1} appears more than once (rows ${same.map((x) => x.rowNumber).join(', ')}).`),
    );
  }

  // Per sitting: every component day present, and every date rule from the form.
  for (const group of sittingGroups(result)) {
    const slots = group.qualification.componentSlots;
    const onDemand = group.qualification.onDemand;
    const missing = slots.filter((_, i) => !group.slotRows[i]);
    if (missing.length > 0) {
      const message = `Sitting ${group.sittingNumber} is missing: ${missing.map((s) => s.label).join(', ')}.`;
      group.rows.forEach((r) => r.errors.push(message));
    }
    const dates = slots.map((_, i) => group.slotRows[i]?.date ?? '');
    const errors = checkSittingComponentDates(slots, dates, todayIso, onDemand);
    slots.forEach((_, i) => {
      const row = group.slotRows[i];
      // A blank or unreadable date already has its own message on the row.
      if (row) row.errors.push(...errors[i].filter((e) => e !== 'Enter a date.'));
    });
    const start = earliestDate(dates);
    if (start) {
      const closing = calcRegistrationClosingDate(start, onDemand);
      group.rows.forEach((r) => (r.registrationCloses = closing));
      const earliestRow = group.slotRows.find((r) => r?.date === start);
      if (earliestRow && isRegistrationClosed(start, todayIso, onDemand)) {
        earliestRow.errors.push(`The registration closing date (${closing}) has already passed.`);
      }
    }
    // No date of this sitting may already be on the calendar for this qualification.
    for (const row of group.slotRows) {
      if (!row?.date) continue;
      const clash = existingSittings.some(
        (s) =>
          s.qpId === group.qualification.qpId &&
          s.qualificationId === group.qualification.qualificationId &&
          BLOCKING_SITTING_STATUSES.includes(s.status) &&
          sittingDatesOf(s).includes(row.date ?? ''),
      );
      if (clash) row.errors.push(`${row.date} is already on the EISA Calendar for this qualification.`);
    }
  }

  // The number of sittings per qualification and year must match its sittings per year exactly
  // (at least one for "On demand").
  const sittingsByYear = new Map<string, SittingGroup[]>();
  for (const group of sittingGroups(result)) {
    const start = earliestDate(group.slotRows.map((r) => r?.date ?? ''));
    if (!start) continue;
    const key = `${group.qualification.qualificationId}|${start.slice(0, 4)}`;
    sittingsByYear.set(key, [...(sittingsByYear.get(key) ?? []), group]);
  }
  for (const [key, groups] of sittingsByYear) {
    const q = groups[0].qualification;
    if (q.onDemand || groups.length === q.sittingsPerYear) continue;
    const year = key.split('|')[1];
    const message =
      groups.length > q.sittingsPerYear
        ? `"${q.qualificationTitle}" allows ${q.sittingsPerYear} sitting(s) for ${year} — the file has ${groups.length}.`
        : `"${q.qualificationTitle}" needs ${q.sittingsPerYear} sitting(s) for ${year} — the file has ${groups.length}.`;
    groups.forEach((g) => g.rows.forEach((r) => r.errors.push(message)));
  }

  return { ok: true, rows: result };
}

// Finds the slot a row names, or adds the error and returns null.
function findSlot(slots: ComponentDaySlot[], componentText: string, dayText: string, errors: string[]): number | null {
  const day = dayText ? wholeNumber(dayText) : 1;
  if (day === null || day < 1) {
    errors.push('The component day must be a whole number from 1.');
    return null;
  }
  if (isSingleDateFallback(slots)) {
    // No component details on the QASA: one date per sitting, so only day 1 of "EISA date" fits.
    if (componentText && componentText.toLowerCase() !== slots[0].componentName.toLowerCase()) {
      errors.push(`Component "${componentText}" is not on the QASA for this qualification (it has no component details — use "${slots[0].componentName}").`);
      return null;
    }
    if (day > 1) {
      errors.push('The QASA has no component details, so only day 1 is allowed.');
      return null;
    }
    return 0;
  }
  const ofComponent = slots.filter((s) => s.componentName.toLowerCase() === componentText.toLowerCase());
  if (ofComponent.length === 0) {
    errors.push(`Component "${componentText}" is not on the QASA for this qualification (${[...new Set(slots.map((s) => s.componentName))].join(', ')}).`);
    return null;
  }
  const slot = ofComponent.find((s) => s.day === day);
  if (!slot) {
    errors.push(`"${componentText}" has ${ofComponent.length} day(s) on the QASA — day ${day} is beyond that.`);
    return null;
  }
  return slots.indexOf(slot);
}

interface SittingGroup {
  qualification: EligibleQualification;
  sittingNumber: number;
  rows: BulkRow[];
  // One row per slot, in slot order (the first row when a slot has more than one).
  slotRows: (BulkRow | undefined)[];
}

// Rows with a known qualification and a valid sitting number, grouped into sittings.
function sittingGroups(rows: BulkRow[]): SittingGroup[] {
  const groups = new Map<string, SittingGroup>();
  for (const row of rows) {
    if (!row.qualification || row.sittingNumber === null) continue;
    const key = `${row.qualification.qualificationId}|${row.sittingNumber}`;
    const group = groups.get(key) ?? { qualification: row.qualification, sittingNumber: row.sittingNumber, rows: [], slotRows: Array.from<BulkRow | undefined>({ length: row.qualification.componentSlots.length }) };
    group.rows.push(row);
    if (row.slotIndex !== null && !group.slotRows[row.slotIndex]) group.slotRows[row.slotIndex] = row;
    groups.set(key, group);
  }
  return [...groups.values()];
}

// One proposal batch per qualification and year (the year of each sitting's earliest date).
export function toBatchInputs(rows: BulkRow[], submittedBy: string, submittedById: string): ProposeSittingBatchInput[] {
  const batches = new Map<string, ProposeSittingBatchInput>();
  for (const group of sittingGroups(rows)) {
    const slots = group.qualification.componentSlots;
    const dates = slots.map((_, i) => group.slotRows[i]?.date ?? '');
    const start = earliestDate(dates);
    if (!start || dates.some((d) => !d)) continue;
    const q = group.qualification;
    const year = Number(start.slice(0, 4));
    const key = `${q.qualificationId}|${year}`;
    const batch = batches.get(key) ?? {
      qualificationId: q.qualificationId,
      qualificationTitle: q.qualificationTitle,
      qpId: q.qpId,
      qpName: q.qpName,
      year,
      dates: [],
      sittings: isSingleDateFallback(slots) ? undefined : [],
      submittedBy,
      submittedById,
    };
    batch.dates.push(start);
    batch.sittings?.push({ componentDates: buildComponentDates(slots, dates) });
    batches.set(key, batch);
  }
  return [...batches.values()];
}
