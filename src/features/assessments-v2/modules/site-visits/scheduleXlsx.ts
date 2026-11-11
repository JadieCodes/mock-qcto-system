import { writeXlsxWorkbook, type XlsxCell, type XlsxSheet } from '../../shared/files/writeXlsx';
import { scheduleTitle, type SubUnitSchedule } from './schedule';
import { SUB_UNIT_SHEET_NAMES } from './subUnits';

// Batch Z2 (11.9): the monthly schedule as an Excel workbook, one sheet per sub-unit, in QCTO's column order.
export const SCHEDULE_HEADINGS = [
  'QP/SDP',
  'Type of visit',
  'Institution',
  'Physical address',
  'Province',
  'Occupational qualification',
  // Real dates: the first day, and the last day when the visit runs over several days.
  'Date of visit',
  'Last day of visit',
  'QCTO official(s)',
  'Notice',
  'Report stage',
];

export const NO_VISITS_BOOKED_MESSAGE = 'No visits booked';

// QCTO's sign-off block under every schedule. Name, signature and date are filled in by hand.
export const SIGN_OFF_ROWS = ['Compiled by', 'Verified by', 'Supported by: Director: Assessment', 'Approved by: Chief Director: Assessment'];

export function scheduleFileName(year: number, month: number): string {
  return `Visit_Schedule_${year}-${String(month).padStart(2, '0')}.xlsx`;
}

function sheetOf(group: SubUnitSchedule, year: number, month: number): XlsxSheet {
  const rows: XlsxCell[][] = group.rows.map((r) => [
    r.qpSdp,
    r.visitTypeLabel,
    r.institution,
    r.address,
    r.province,
    r.qualifications.join('; '),
    { date: r.startDate },
    r.endDate !== r.startDate ? { date: r.endDate } : null,
    r.officials.join(', '),
    r.notice,
    r.reportStage,
  ]);
  return {
    sheetName: SUB_UNIT_SHEET_NAMES[group.subUnit],
    titleRows: [[scheduleTitle(group.subUnit, year, month)]],
    headings: SCHEDULE_HEADINGS,
    rows: rows.length > 0 ? rows : [[NO_VISITS_BOOKED_MESSAGE]],
    footerRows: [['Sign-off', 'Name', 'Signature', 'Date'], ...SIGN_OFF_ROWS.map((label): XlsxCell[] => [label])],
  };
}

export function scheduleWorkbook(groups: SubUnitSchedule[], year: number, month: number): Uint8Array {
  return writeXlsxWorkbook(groups.map((g) => sheetOf(g, year, month)));
}
