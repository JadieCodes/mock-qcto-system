import { ASSESSMENT_CENTRES } from '../../mock/data/assessmentCentres';
import { isWorkingDay, toIsoDate } from '../../shared/dates/workingDays';
import { SUB_UNIT_LABELS, SUB_UNIT_ORDER, subUnitOf, type SubUnit } from './subUnits';
import type { SiteVisit } from './types';
import { visitQualificationsOf } from './visitQualifications';
import { VISIT_TYPE_LABELS, visitIsMeeting, visitSiteName } from './visitTypeLabels';
import { overallStatusLabel } from './workflow';

// Batch Z2 (QCTO 11 Nov, item 11.9): the monthly visit schedule per sub-unit, compiled from the visits
// captured and approved on the system, in the column order of QCTO's own schedules.

export const NOT_YET_APPROVED_LABEL = 'Not yet approved';
export const END_DATE_BEFORE_START_MESSAGE = 'The last day must be on or after the visit date.';
export const END_DATE_NOT_WORKING_DAY_MESSAGE = 'The last day must be a working day (not a weekend or public holiday).';
export const END_DATE_NEEDS_START_MESSAGE = 'Enter the visit date before the last day.';

const PENDING_PLANNING_STAGES = new Set(['ad-planning', 'dd-recommend', 'domain-director-approval', 'sda-booking']);

// A multi-day visit's last day: on or after the first day, and on a working day. '' and null mean "one day".
export function visitEndDateIssue(visitDate: string, visitEndDate: string | null | undefined): string | null {
  if (!visitEndDate) return null;
  if (!visitDate) return END_DATE_NEEDS_START_MESSAGE;
  if (visitEndDate < visitDate) return END_DATE_BEFORE_START_MESSAGE;
  if (!isWorkingDay(visitEndDate)) return END_DATE_NOT_WORKING_DAY_MESSAGE;
  return null;
}

// The last day of a visit: its own date when it runs for one day.
export function visitLastDayOf(visit: SiteVisit): string {
  return visit.visitEndDate && visit.visitEndDate > visit.visitDate ? visit.visitEndDate : visit.visitDate;
}

export interface ScheduleRow {
  visitId: string;
  qpSdp: string;
  visitTypeLabel: string;
  institution: string;
  address: string;
  province: string;
  qualifications: string[];
  // yyyy-mm-dd; endDate equals startDate for a one-day visit.
  startDate: string;
  endDate: string;
  dateLabel: string;
  officials: string[];
  notice: 'Notified' | 'Unannounced';
  // The report stage of a booked visit; NOT_YET_APPROVED_LABEL for a visit still in the planning chain.
  reportStage: string;
  pending: boolean;
  // Working days the visit spans inside the month shown.
  daysInMonth: number;
}

export interface SubUnitSchedule {
  subUnit: SubUnit;
  label: string;
  rows: ScheduleRow[];
  visitCount: number;
  // ASSUMPTION: the working days each visit spans in the month, added up, so two visits on one day count twice.
  daysOut: number;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

// Title of one block and one sheet, in QCTO's style: "<sub-unit> – <Month yyyy>".
export function scheduleTitle(subUnit: SubUnit, year: number, month: number): string {
  return `${SUB_UNIT_LABELS[subUnit]} – ${monthLabel(year, month)}`;
}

function parts(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

// "11 Dec 2026" or "11–13 Dec 2026"; across months "30 Nov – 2 Dec 2026"; across years both years show.
export function scheduleDateLabel(startIso: string, endIso: string): string {
  const a = parts(startIso);
  const b = parts(endIso);
  const first = `${a.d} ${MONTH_SHORT[a.m - 1]}`;
  if (startIso === endIso) return `${first} ${a.y}`;
  if (a.y !== b.y) return `${first} ${a.y} – ${b.d} ${MONTH_SHORT[b.m - 1]} ${b.y}`;
  if (a.m !== b.m) return `${first} – ${b.d} ${MONTH_SHORT[b.m - 1]} ${b.y}`;
  return `${a.d}–${b.d} ${MONTH_SHORT[b.m - 1]} ${b.y}`;
}

// The province of the SDP or assessment centre when it is known, otherwise blank.
export function visitProvinceOf(visit: SiteVisit): string {
  const bySdp = visit.sdpId ? ASSESSMENT_CENTRES.find((c) => c.centreId === visit.sdpId) : undefined;
  if (bySdp) return bySdp.province;
  const name = (visit.assessmentCentreName ?? visit.sdpName ?? '').trim().toLowerCase();
  return name ? (ASSESSMENT_CENTRES.find((c) => c.name.toLowerCase() === name)?.province ?? '') : '';
}

function monthBounds(year: number, month: number): { first: string; last: string } {
  const first = toIsoDate(new Date(Date.UTC(year, month - 1, 1)));
  const last = toIsoDate(new Date(Date.UTC(year, month, 0)));
  return { first, last };
}

function workingDaysIn(startIso: string, endIso: string): number {
  let count = 0;
  for (let d = new Date(`${startIso}T00:00:00Z`); toIsoDate(d) <= endIso; d.setUTCDate(d.getUTCDate() + 1)) {
    if (isWorkingDay(toIsoDate(d))) count++;
  }
  return count;
}

function qualificationText(visit: SiteVisit): string[] {
  return visitQualificationsOf(visit).map((q) => (q.saqaId && q.saqaId !== '—' ? `${q.qualificationTitle} (SAQA ID ${q.saqaId})` : q.qualificationTitle));
}

function rowOf(visit: SiteVisit, first: string, last: string, pending: boolean): ScheduleRow {
  const end = visitLastDayOf(visit);
  const typeLabel = VISIT_TYPE_LABELS[visit.visitType];
  return {
    visitId: visit.id,
    qpSdp: [visit.qpName, visit.sdpName].filter((n): n is string => !!n).join(' / '),
    visitTypeLabel: visitIsMeeting(visit.visitType) && visit.meetingTitle?.trim() ? `${typeLabel}: ${visit.meetingTitle.trim()}` : typeLabel,
    institution: visitSiteName(visit),
    address: visit.venue,
    province: visitProvinceOf(visit),
    qualifications: qualificationText(visit),
    startDate: visit.visitDate,
    endDate: end,
    dateLabel: scheduleDateLabel(visit.visitDate, end),
    officials: (visit.officials ?? []).map((o) => o.name),
    notice: visit.notificationFlag === 'unannounced' ? 'Unannounced' : 'Notified',
    reportStage: pending ? NOT_YET_APPROVED_LABEL : overallStatusLabel(visit),
    pending,
    daysInMonth: workingDaysIn(visit.visitDate > first ? visit.visitDate : first, end < last ? end : last),
  };
}

// Pure. `month` is 1 to 12. Visits that touch the month (the first day to the last day overlaps it) and
// are booked; includePending adds visits still in the planning chain. Every sub-unit is returned, in order.
export function visitScheduleFor(visits: SiteVisit[], year: number, month: number, options: { includePending: boolean }): SubUnitSchedule[] {
  const { first, last } = monthBounds(year, month);
  const rowsBySubUnit = new Map<SubUnit, ScheduleRow[]>(SUB_UNIT_ORDER.map((s) => [s, []]));
  for (const visit of visits) {
    if (!visit.visitDate) continue;
    const stage = visit.planningWorkflow.stageId;
    const pending = PENDING_PLANNING_STAGES.has(stage);
    if (stage !== 'booked' && !(options.includePending && pending)) continue;
    if (visit.visitDate > last || visitLastDayOf(visit) < first) continue;
    rowsBySubUnit.get(subUnitOf(visit))?.push(rowOf(visit, first, last, pending));
  }
  return SUB_UNIT_ORDER.map((subUnit) => {
    const rows = (rowsBySubUnit.get(subUnit) ?? []).sort((a, b) => a.startDate.localeCompare(b.startDate) || a.endDate.localeCompare(b.endDate) || a.visitId.localeCompare(b.visitId));
    return { subUnit, label: SUB_UNIT_LABELS[subUnit], rows, visitCount: rows.length, daysOut: rows.reduce((sum, r) => sum + r.daysInMonth, 0) };
  });
}
