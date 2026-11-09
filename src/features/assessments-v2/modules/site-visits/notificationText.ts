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
