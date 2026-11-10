import { isWorkingDay, subtractWorkingDays, toIsoDate } from '../../shared/dates/workingDays';
import type { EisaSitting } from './types';
import { ON_DEMAND_REGISTRATION_CLOSE_WORKING_DAYS, REGISTRATION_CLOSING_MONTHS_BEFORE } from './config';

// QCTO feedback 3.5: the registration closing date is always calculated from the sitting date,
// never stored or typed, so existing sittings get one without a data migration. Rule:
// REGISTRATION_CLOSING_MONTHS_BEFORE calendar months before the sitting (clamped to the last
// day of a shorter month, e.g. 31 May -> 28 Feb), then back to the previous working day if
// that lands on a weekend or a public holiday in config/holidays.ts.
// QCTO feedback 29.13 (assumption): an on-demand sitting closes ON_DEMAND_REGISTRATION_CLOSE_WORKING_DAYS
// working days before the sitting instead.
export function calcRegistrationClosingDate(sittingDate: string, onDemand = false): string {
  if (onDemand) return subtractWorkingDays(sittingDate, ON_DEMAND_REGISTRATION_CLOSE_WORKING_DAYS);
  const [year, month, day] = sittingDate.split('-').map(Number);
  const targetMonthIndex = month - 1 - REGISTRATION_CLOSING_MONTHS_BEFORE;
  const lastDayOfTargetMonth = new Date(Date.UTC(year, targetMonthIndex + 1, 0)).getUTCDate();
  const closing = new Date(Date.UTC(year, targetMonthIndex, Math.min(day, lastDayOfTargetMonth)));

  while (!isWorkingDay(toIsoDate(closing))) {
    closing.setUTCDate(closing.getUTCDate() - 1);
  }
  return toIsoDate(closing);
}

// Registration is still open on the closing date itself; it is closed from the day after.
export function isRegistrationClosed(sittingDate: string, todayIso: string = toIsoDate(new Date()), onDemand = false): boolean {
  return todayIso > calcRegistrationClosingDate(sittingDate, onDemand);
}

// Batch S (05.11): the date registration really closes for one sitting — the super admin's date
// when there is one, otherwise the calculated rule above. Every "registration closed" check on a
// sitting goes through these two, never through calcRegistrationClosingDate directly.
export type ClosingSitting = Pick<EisaSitting, 'date' | 'onDemand' | 'registrationClosingOverride'>;

export function closingDateOf(sitting: ClosingSitting): string {
  return sitting.registrationClosingOverride?.date ?? calcRegistrationClosingDate(sitting.date, sitting.onDemand);
}

export function isClosedFor(sitting: ClosingSitting, todayIso: string = toIsoDate(new Date())): boolean {
  return todayIso > closingDateOf(sitting);
}
