import { MIN_LEAD_TIME_WORKING_DAYS, publicHolidayOn } from '../../config/holidays';
import { addWorkingDays, isWeekend, toIsoDate } from '../../shared/dates/workingDays';
import type { DateCheckResult } from './types';

// CR-032: automatic checks — reject dates on SA public holidays, weekends, and dates inside
// the minimum lead time. Runs for every date in a QP's proposed batch before it reaches QCTO.
export function checkSittingDate(dateIso: string, todayIso: string = toIsoDate(new Date())): DateCheckResult {
  const reasons: string[] = [];

  if (isWeekend(dateIso)) {
    reasons.push('Falls on a weekend.');
  }

  const holiday = publicHolidayOn(dateIso);
  if (holiday) {
    reasons.push(`Falls on a public holiday — ${holiday.name}.`);
  }

  const earliestAllowed = addWorkingDays(todayIso, MIN_LEAD_TIME_WORKING_DAYS);
  if (dateIso < earliestAllowed) {
    reasons.push(`Inside the minimum lead time — the earliest allowed date is ${earliestAllowed}.`);
  }

  return { date: dateIso, ok: reasons.length === 0, reasons };
}
