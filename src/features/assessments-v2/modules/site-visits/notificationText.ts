import type { SiteVisit } from './types';
import { isMultiQualificationVisit, qualificationListText } from './visitQualifications';
import { visitSubject } from './visitTypeLabels';

// The text of the booking notification. Batch V1 (05.13): a Marking & Moderation or RPL/ARPL visit
// lists every qualification that will be checked, with its EISA date where it has one. The demo seed
// builds the same text.
export function bookedVisitNotificationBody(visit: SiteVisit): string {
  const checked = isMultiQualificationVisit(visit.visitType) ? ` Qualifications to be checked: ${qualificationListText(visit)}.` : '';
  return `"${visitSubject(visit)}" is booked for ${visit.visitDate}.${checked} The execution form is ready.`;
}

// Batch V1 (05.14): to the QP, or to the ASD when the stakeholder has no QP and the ASD records the response.
export function remediationRequestedNotification(visit: SiteVisit, items: string, round: number): { title: string; body: string } {
  const again = round > 1 ? ' (further remediation)' : '';
  return {
    title: `Remediation requested${again}`,
    body: `"${visitSubject(visit)}" was approved with remediation. Items: ${items}`,
  };
}

export function remediationSubmittedNotification(visit: SiteVisit): { title: string; body: string } {
  return { title: 'Remediation submitted', body: `The remediation for "${visitSubject(visit)}" is waiting for your review.` };
}

// Batch V2 (QCTO 29.36): the notice that goes to the QP, SDP or assessment centre (to the ASD, for a
// centre) when a notified visit is booked, and again when a moved visit is booked on its new date.
export function visitNoticeNotification(visit: SiteVisit, recordedByAsd: boolean, centreName: string): { title: string; body: string } {
  const moved = visit.dateMoves?.length ? ` The date was moved from ${visit.dateMoves[visit.dateMoves.length - 1].fromDate}.` : '';
  const where = visit.venue ? ` at ${visit.venue}` : '';
  const checked = isMultiQualificationVisit(visit.visitType) ? ` Qualifications: ${qualificationListText(visit)}.` : '';
  const base = `"${visitSubject(visit)}" is booked for ${visit.visitDate}${where}.${moved}${checked}`;
  if (recordedByAsd) {
    return { title: 'Site visit notice — record the response', body: `${base} ${centreName} has no portal: record whether it accepts the date or is not available, on the visit.` };
  }
  return { title: 'Site visit notice — please respond', body: `${base} Open Site Visits to accept the date or say you are not available.` };
}

export function visitReminderNotification(visit: SiteVisit, recordedByAsd: boolean, centreName: string, number: number): { title: string; body: string } {
  const who = recordedByAsd ? ` Record the response of ${centreName} on the visit.` : ' Open Site Visits to accept the date or say you are not available.';
  return {
    title: `Reminder ${number}: confirm the site visit`,
    body: `No response yet for "${visitSubject(visit)}" on ${visit.visitDate}.${who}`,
  };
}

export function visitResponseNotification(visit: SiteVisit, answer: 'accepted' | 'not-available', byName: string, reason: string, suggestedDate: string): { title: string; body: string } {
  if (answer === 'accepted') return { title: 'Visit date accepted', body: `${byName} accepted ${visit.visitDate} for "${visitSubject(visit)}".` };
  const suggested = suggestedDate ? ` Suggested date: ${suggestedDate}.` : '';
  return { title: 'Not available for the visit date', body: `${byName} is not available on ${visit.visitDate} for "${visitSubject(visit)}". Reason: ${reason}.${suggested}` };
}

export function visitMovedNotification(visit: SiteVisit, fromDate: string, reason: string): { title: string; body: string } {
  return { title: 'Visit date moved — needs recommendation', body: `"${visitSubject(visit)}" moved from ${fromDate} to ${visit.visitDate}: ${reason}` };
}
