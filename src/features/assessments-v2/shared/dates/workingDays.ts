import { SA_PUBLIC_HOLIDAYS } from '../../config/holidays';

const HOLIDAY_SET = new Set(SA_PUBLIC_HOLIDAYS.map((h) => h.date));

export function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

// Parsed as UTC (the "Z" suffix) and read back with the UTC getters/setters throughout this
// file — mixing a local-time parse with UTC getters would shift the weekday by a day for any
// browser timezone ahead of UTC crossing midnight.
export function isWeekend(dateIso: string): boolean {
  const day = new Date(`${dateIso}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

export function isPublicHoliday(dateIso: string): boolean {
  return HOLIDAY_SET.has(dateIso);
}

export function isWorkingDay(dateIso: string): boolean {
  return !isWeekend(dateIso) && !isPublicHoliday(dateIso);
}

// Shared by the EISA Calendar lead-time check (CR-032) and, from Phase 6, the 21-working-day
// results-submission SLA (CR-059) — one definition of "working day" for the whole domain.
export function addWorkingDays(startIso: string, days: number): string {
  const d = new Date(`${startIso}T00:00:00Z`);
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (isWorkingDay(toIsoDate(d))) added++;
  }
  return toIsoDate(d);
}

// Counts working days strictly after `startIso` up to and including `endIso`.
export function workingDaysBetween(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  let count = 0;
  const cursor = new Date(start);
  while (cursor < end) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (isWorkingDay(toIsoDate(cursor))) count++;
  }
  return count;
}
