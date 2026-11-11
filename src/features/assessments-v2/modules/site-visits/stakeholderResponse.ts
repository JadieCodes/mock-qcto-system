import { addWorkingDays } from '../../shared/dates/workingDays';
import type { Person } from '../../shared/people/types';
import { REMINDER_WORKING_DAYS } from './config';
import { isSharedWithStakeholder } from './stakeholderShare';
import type { SiteVisit, VisitStakeholder } from './types';
import { visitHasQp, visitIsMeeting } from './visitTypeLabels';

// Batch V2 (QCTO 29 Oct 3:05:39 to 3:16:43, item 2.12): a notified visit is put to the QP, SDP or
// assessment centre through the system. They accept the date or say they are not available.

// An SDP when the visit is held at one (RPL/ARPL at an SDP, Post-EISA with an SDP), otherwise the QP
// named on the visit, otherwise the assessment centre the planner typed in. EISA Readiness has no SDP
// in this build, so its stakeholder is the QP. A special meeting has none.
export function visitStakeholderOf(visit: SiteVisit): VisitStakeholder | null {
  if (visitIsMeeting(visit.visitType)) return null;
  if (visit.sdpId && visit.sdpName) return { kind: 'SDP', id: visit.sdpId, name: visit.sdpName };
  if (visitHasQp(visit.visitType) && visit.qpId) return { kind: 'QP', id: visit.qpId, name: visit.qpName };
  if (visit.assessmentCentreName) return { kind: 'assessment-centre', id: null, name: visit.assessmentCentreName };
  return null;
}

// CR-051: an unannounced visit gets no notice and no response step.
export function visitIsUnannounced(visit: SiteVisit): boolean {
  return visit.notificationFlag === 'unannounced';
}

// Booked, notified, dated, with someone to tell.
export function visitNeedsNotice(visit: SiteVisit): boolean {
  return !visitIsUnannounced(visit) && visit.planningWorkflow.stageId === 'booked' && !!visit.visitDate && visitStakeholderOf(visit) !== null;
}

export type StakeholderResponseStatus =
  // No notice was sent (unannounced, no stakeholder, not booked yet, or stored before Batch V2).
  | 'none'
  | 'awaiting'
  | 'accepted'
  | 'not-available'
  // The visit date passed without an answer.
  | 'lapsed';

export function responseStatusOf(visit: SiteVisit, today: string): StakeholderResponseStatus {
  if (visit.stakeholderResponse) return visit.stakeholderResponse.answer;
  if (!visit.stakeholderNotice || !visitNeedsNotice(visit)) return 'none';
  return visit.visitDate >= today ? 'awaiting' : 'lapsed';
}

export function reminderCountOf(visit: SiteVisit): number {
  return visit.reminders?.length ?? 0;
}

// The days reminders are due: REMINDER_WORKING_DAYS working days after the notice, and every
// REMINDER_WORKING_DAYS after that, up to and including the visit date. Worked out from the notice
// date with SA public holidays skipped (the same pattern as the Batch S escalation).
export function reminderDatesOf(noticeSentAt: string, visitDate: string): string[] {
  const dates: string[] = [];
  const start = noticeSentAt.slice(0, 10);
  for (let k = 1; k <= 200; k++) {
    const date = addWorkingDays(start, k * REMINDER_WORKING_DAYS);
    if (date > visitDate) break;
    dates.push(date);
  }
  return dates;
}

// Reminders that should have been sent by `today`. Zero once the stakeholder answered or the visit
// is no longer waiting on them.
export function remindersDueBy(visit: SiteVisit, today: string): string[] {
  if (!visit.stakeholderNotice || !visitNeedsNotice(visit) || visit.stakeholderResponse) return [];
  return reminderDatesOf(visit.stakeholderNotice.sentAt, visit.visitDate).filter((d) => d <= today);
}

function pluralTimes(n: number): string {
  return n === 1 ? '1 time' : `${n} times`;
}

// What the ASD sees on the visit.
export function responseSummaryOf(visit: SiteVisit, today: string): string {
  const status = responseStatusOf(visit, today);
  const response = visit.stakeholderResponse;
  switch (status) {
    case 'none':
      return '';
    case 'awaiting':
      return `No response yet (reminded ${pluralTimes(reminderCountOf(visit))})`;
    case 'lapsed':
      return `No response before the visit date (reminded ${pluralTimes(reminderCountOf(visit))})`;
    case 'accepted':
      return 'Accepted the date';
    case 'not-available':
      return response?.suggestedDate ? `Not available — suggested ${response.suggestedDate}` : 'Not available';
  }
}

// The text the stakeholder sees against the date.
export function stakeholderResponseLabel(visit: SiteVisit, today: string): string {
  switch (responseStatusOf(visit, today)) {
    case 'none':
      return '—';
    case 'awaiting':
      return 'Please respond';
    case 'lapsed':
      return 'No response';
    case 'accepted':
      return 'You accepted the date';
    case 'not-available':
      return 'You said you are not available';
  }
}

export const NOT_AVAILABLE_REASON_MESSAGE = 'Give the reason you are not available.';
export const MOVE_VISIT_REASON_MESSAGE = 'Give the reason for moving the visit.';
export const MOVE_VISIT_DATE_MESSAGE = 'Pick the new visit date.';

// The Site Visits list of a QP or an SDP (CR-047): only their own visits, and only those they know
// about: notified visits that are booked (or being moved to a new date), and any visit whose report
// QCTO shared with them. A plan still in the planning chain, or an unannounced visit, is never listed.
export function visitsForStakeholder(visits: SiteVisit[], person: Pick<Person, 'role' | 'qpId' | 'sdpId'>): SiteVisit[] {
  const mine = visits.filter((v) => (person.role === 'QP' ? !!person.qpId && v.qpId === person.qpId : person.role === 'SDP' ? !!person.sdpId && v.sdpId === person.sdpId : false));
  return mine
    .filter((v) => isSharedWithStakeholder(v) || (!visitIsUnannounced(v) && (v.planningWorkflow.stageId === 'booked' || (v.dateMoves?.length ?? 0) > 0)))
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
}
