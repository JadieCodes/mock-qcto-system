// Batch L1.1: QCTO's "QAS Addendum Control Sheet" — what QCTO sends to Certification, one row per
// component. The headings are QCTO's, in QCTO's order and spelling ("Componenet no" included) so
// the file pastes straight into their register.
import { csvField, downloadCsvFile, withExcelPrefix } from '../../shared/csv/csv';
import { approvedAddendumOf, approvedComponentsOf, totalMarksOf } from './assessmentDetails';
import type { QsaAddendumApplication } from './types';

export const CONTROL_SHEET_HEADINGS = [
  'AQP',
  'Qualification Title',
  'Qualification ID',
  'NQF Level',
  'Number of components',
  'Total Marks',
  'Addendum Pass %',
  'Addendum Start Date',
  'Addendum End Date',
  'Componenet no',
  'Lowest Mark',
  'Highest Mark',
  'Weighting',
  'FLC',
] as const;

// "Level 4" on the QASA -> "4" on the control sheet.
function nqfLevelNumber(nqfLevel: string): string {
  return nqfLevel.replace(/\D+/g, '') || nqfLevel;
}

function flcCell(flcRequired: boolean | null): string {
  if (flcRequired === null) return '';
  return flcRequired ? 'Y' : 'N';
}

// The approved values (what Certification was notified of), so a review in progress does not leak
// into the sheet. Dates are YYYY-MM-DD; a value that is not recorded is left blank.
export function controlSheetRows(app: QsaAddendumApplication): string[][] {
  const components = approvedComponentsOf(app);
  const addendum = approvedAddendumOf(app);
  return components.map((c, i) => [
    app.qpName,
    app.qualificationTitle,
    app.saqaId,
    nqfLevelNumber(app.nqfLevel),
    String(components.length),
    String(totalMarksOf(components)),
    addendum.passPercent === null ? '' : String(addendum.passPercent),
    addendum.startDate ?? '',
    addendum.endDate ?? '',
    String(i + 1),
    String(c.lowestMark),
    String(c.highestMark),
    String(c.weightingPercent),
    flcCell(addendum.flcRequired),
  ]);
}

export function buildControlSheetCsv(app: QsaAddendumApplication): string {
  const lines = [CONTROL_SHEET_HEADINGS as readonly string[], ...controlSheetRows(app)].map((cells) => cells.map(csvField).join(','));
  return withExcelPrefix(`${lines.join('\r\n')}\r\n`);
}

export function controlSheetFileName(app: QsaAddendumApplication): string {
  return `QAS-Addendum-control-sheet-${app.saqaId.replace(/[^A-Za-z0-9]+/g, '_')}.csv`;
}

export function downloadControlSheet(app: QsaAddendumApplication): void {
  downloadCsvFile(controlSheetFileName(app), buildControlSheetCsv(app));
}
