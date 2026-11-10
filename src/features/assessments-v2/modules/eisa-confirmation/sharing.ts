import { addCalendarMonths } from '../../shared/dates/workingDays';
import { calcRegistrationClosingDate, isRegistrationClosed } from '../eisa-calendar/registrationClosing';
import { CONFIRMATION_SHARE_MONTHS_BEFORE } from './config';

// Batch T (29.20): the consolidated list is shared with the QP once the sitting's registration
// closing date has passed. ASSUMPTION: the closing date is the share date shown on screen; QCTO's
// process map also says "no later than 2 months before the EISA", which the usual 3-month closing
// already meets. An on-demand sitting closes later than that, so its list is shared as soon as it closes.
export function shareDateFor(sittingDate: string, onDemand?: boolean): string {
  return calcRegistrationClosingDate(sittingDate, onDemand);
}

export function isListShareable(sittingDate: string, todayIso: string, onDemand?: boolean): boolean {
  return isRegistrationClosed(sittingDate, todayIso, onDemand);
}

// The latest date QCTO's process map allows the list to be shared.
export function latestShareDateFor(sittingDate: string): string {
  return addCalendarMonths(sittingDate, -CONFIRMATION_SHARE_MONTHS_BEFORE);
}

// The timestamp a shared list carries: the end of the share date, South African time.
export function sharedAtFor(shareDate: string): string {
  return `${shareDate}T21:00:00.000Z`;
}
