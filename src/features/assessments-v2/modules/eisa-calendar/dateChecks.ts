import { MIN_LEAD_TIME_WORKING_DAYS, publicHolidayOn } from '../../config/holidays';
import { addCalendarMonths, addWorkingDays, isWeekend, toIsoDate } from '../../shared/dates/workingDays';
import { ON_DEMAND_MIN_NOTICE_MONTHS } from './config';
import type { DateCheckResult } from './types';

// CR-032: automatic checks — reject dates on SA public holidays, weekends, and dates inside
// the minimum lead time. Runs for every date in a QP's proposed batch before it reaches QCTO.
// QCTO feedback 29.13: an on-demand sitting uses ON_DEMAND_MIN_NOTICE_MONTHS instead of the
// normal lead time; weekends and holidays are still refused.
export function checkSittingDate(dateIso: string, todayIso: string = toIsoDate(new Date()), onDemand = false): DateCheckResult {
  const reasons: string[] = [];

  if (isWeekend(dateIso)) {
    reasons.push('Falls on a weekend.');
  }

  const holiday = publicHolidayOn(dateIso);
  if (holiday) {
    reasons.push(`Falls on a public holiday — ${holiday.name}.`);
  }

  const earliestAllowed = onDemand ? addCalendarMonths(todayIso, ON_DEMAND_MIN_NOTICE_MONTHS) : addWorkingDays(todayIso, MIN_LEAD_TIME_WORKING_DAYS);
  if (dateIso < earliestAllowed) {
    reasons.push(`Inside the minimum ${onDemand ? 'notice' : 'lead time'} — the earliest allowed date is ${earliestAllowed}.`);
  }

  return { date: dateIso, ok: reasons.length === 0, reasons };
}
