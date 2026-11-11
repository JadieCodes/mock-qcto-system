import { isWorkingDay, toIsoDate } from '../../shared/dates/workingDays';
import type { ScheduleRow, SubUnitSchedule } from './schedule';
import type { VisitType } from './types';
import { VISIT_TYPE_LABELS } from './visitTypeLabels';

// Batch Z3 (look only): helpers for the Visit schedule screen. Nothing here changes what the schedule contains.

const SHORT_TYPE_LABELS: Record<VisitType, string> = {
  'eisa-readiness': 'EISA readiness',
  'marking-moderation': 'Marking & moderation',
  'rpl-arpl-monitoring': 'RPL/ARPL monitoring',
  'post-eisa-monitoring': 'Post-EISA monitoring',
  'marking-guideline-discussion': 'Marking guideline',
  'instrument-validation-visit': 'Instrument validation',
  'qasa-development-visit': 'QASA development',
  'other-meeting': 'Meeting',
};

// The row only carries the long label ("Other / special meeting: <title>" for a meeting), so the short form is found from it.
export function shortVisitType(row: ScheduleRow): string {
  for (const type of Object.keys(VISIT_TYPE_LABELS) as VisitType[]) {
    const label = VISIT_TYPE_LABELS[type];
    if (row.visitTypeLabel === label) return SHORT_TYPE_LABELS[type];
    if (row.visitTypeLabel.startsWith(`${label}: `)) return row.visitTypeLabel.slice(label.length + 2);
  }
  return row.visitTypeLabel;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function utcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function dayNumber(iso: string): number {
  return utcDate(iso).getUTCDate();
}

export function weekdayShort(iso: string): string {
  return WEEKDAY_SHORT[utcDate(iso).getUTCDay()];
}

export function monthShort(iso: string): string {
  return MONTH_SHORT[utcDate(iso).getUTCMonth()];
}

// "11–13 Dec" in one month, "30 Nov – 2 Dec" across two.
export function shortRangeLabel(startIso: string, endIso: string): string {
  if (startIso === endIso) return `${dayNumber(startIso)} ${monthShort(startIso)}`;
  if (monthShort(startIso) === monthShort(endIso)) return `${dayNumber(startIso)}–${dayNumber(endIso)} ${monthShort(endIso)}`;
  return `${dayNumber(startIso)} ${monthShort(startIso)} – ${dayNumber(endIso)} ${monthShort(endIso)}`;
}

// The date block of a list card: "13" over "Fri Dec"; a range in one month "11–13" over "Dec"; across months the start day over the full range.
export function dateBlockOf(startIso: string, endIso: string): { big: string; small: string } {
  if (startIso === endIso) return { big: String(dayNumber(startIso)), small: `${weekdayShort(startIso)} ${monthShort(startIso)}` };
  if (monthShort(startIso) === monthShort(endIso)) return { big: `${dayNumber(startIso)}–${dayNumber(endIso)}`, small: monthShort(endIso) };
  return { big: String(dayNumber(startIso)), small: shortRangeLabel(startIso, endIso) };
}

// Up to two letters: the first letters of the first and last name.
export function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const letters = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0];
  return letters.toUpperCase();
}

export interface SummaryFigures {
  provinces: number;
  officials: number;
}

export function summaryFiguresOf(group: SubUnitSchedule): SummaryFigures {
  const provinces = new Set(group.rows.map((r) => r.province).filter(Boolean));
  const officials = new Set(group.rows.flatMap((r) => r.officials));
  return { provinces: provinces.size, officials: officials.size };
}

// The days a visit is shown on: every working day of its span, and always its first day.
export function visitDays(row: ScheduleRow): string[] {
  const days: string[] = [];
  for (let d = utcDate(row.startDate); toIsoDate(d) <= row.endDate; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = toIsoDate(d);
    if (iso === row.startDate || isWorkingDay(iso)) days.push(iso);
  }
  return days;
}

export interface DayChip {
  row: ScheduleRow;
  subUnit: SubUnitSchedule['subUnit'];
  // 1-based position of this day in the visit, and how many days it has.
  dayIndex: number;
  dayCount: number;
}

export interface CalendarDay {
  iso: string;
  inMonth: boolean;
  weekend: boolean;
  chips: DayChip[];
}

// Monday-first weeks covering the month. Chips only land on days of the month shown.
export function calendarWeeks(year: number, month: number, groups: SubUnitSchedule[]): CalendarDay[][] {
  const chipsByDay = new Map<string, DayChip[]>();
  for (const group of groups) {
    for (const row of group.rows) {
      const days = visitDays(row);
      days.forEach((iso, i) => {
        const list = chipsByDay.get(iso) ?? [];
        list.push({ row, subUnit: group.subUnit, dayIndex: i + 1, dayCount: days.length });
        chipsByDay.set(iso, list);
      });
    }
  }
  const first = new Date(Date.UTC(year, month - 1, 1));
  const last = new Date(Date.UTC(year, month, 0));
  const start = new Date(first);
  start.setUTCDate(start.getUTCDate() - ((first.getUTCDay() + 6) % 7));
  const weeks: CalendarDay[][] = [];
  for (const d = start; d <= last; ) {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i++, d.setUTCDate(d.getUTCDate() + 1)) {
      const iso = toIsoDate(d);
      const inMonth = d.getUTCMonth() === month - 1;
      week.push({ iso, inMonth, weekend: i >= 5, chips: inMonth ? (chipsByDay.get(iso) ?? []) : [] });
    }
    weeks.push(week);
  }
  return weeks;
}
