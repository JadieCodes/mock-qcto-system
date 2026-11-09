import { findQualification } from '../../mock/api/accreditation';
import type { SiteVisit, VisitQualification, VisitType } from './types';

const NO_SAQA_ID = '—';

// Batch V1 (05.13): Marking & Moderation and RPL/ARPL visits often cover more than one
// qualification, and the notification has to say everything that will be checked.
export function isMultiQualificationVisit(visitType: VisitType): boolean {
  return visitType === 'marking-moderation' || visitType === 'rpl-arpl-monitoring';
}

// Batch V1: only Marking & Moderation entries have their own EISA sitting (RPL/ARPL has none, 2.7).
export function qualificationEntriesHaveSitting(visitType: VisitType): boolean {
  return visitType === 'marking-moderation';
}

export function saqaIdForQualification(qualificationTitle: string): string {
  return findQualification(qualificationTitle)?.qualificationId ?? NO_SAQA_ID;
}

// Records stored before Batch V1 have one qualification and one sitting: they read as a one-item
// list. The EISA date of such a Marking & Moderation visit is its visit date, which Batch V1 and
// earlier took from the linked sitting. Nothing is rewritten in storage.
export function visitQualificationsOf(visit: SiteVisit): VisitQualification[] {
  if (visit.qualifications) return visit.qualifications;
  if (!visit.qualificationTitle) return [];
  const hasSitting = qualificationEntriesHaveSitting(visit.visitType) && !!visit.sittingId;
  return [
    {
      id: `${visit.id}-q1`,
      qualificationTitle: visit.qualificationTitle,
      saqaId: saqaIdForQualification(visit.qualificationTitle),
      sittingId: visit.sittingId,
      eisaDate: hasSitting ? visit.visitDate : '',
    },
  ];
}

// Every sitting a visit is linked to (Approval of Results finds the visits of a results batch by it).
export function visitSittingIdsOf(visit: SiteVisit): string[] {
  const ids = visitQualificationsOf(visit)
    .map((q) => q.sittingId)
    .filter((id): id is string => !!id);
  return visit.sittingId && !ids.includes(visit.sittingId) ? [...ids, visit.sittingId] : ids;
}

// All Visits list and titles: the first qualification, then "and N more".
export function qualificationsSummary(visit: SiteVisit): string {
  const list = visitQualificationsOf(visit);
  if (list.length === 0) return visit.qualificationTitle || '—';
  return list.length === 1 ? list[0].qualificationTitle : `${list[0].qualificationTitle} and ${list.length - 1} more`;
}

export function qualificationLine(q: VisitQualification, showEisaDate: boolean): string {
  const base = `${q.qualificationTitle} (SAQA ID ${q.saqaId})`;
  return showEisaDate && q.eisaDate ? `${base} — EISA date ${q.eisaDate}` : base;
}

// The booking notification lists every qualification with its EISA date (05.13).
export function qualificationListText(visit: SiteVisit): string {
  const showEisaDate = qualificationEntriesHaveSitting(visit.visitType);
  return visitQualificationsOf(visit)
    .map((q) => qualificationLine(q, showEisaDate))
    .join('; ');
}

export const MISSING_QUALIFICATION_MESSAGE = 'Add at least one qualification.';

// createVisit() and the Plan a New Visit dialog share these checks: at least one qualification, a
// Marking & Moderation entry needs its published sitting, and no qualification twice.
export function qualificationListIssues(visitType: VisitType, list: VisitQualification[]): string[] {
  const issues: string[] = [];
  if (list.length === 0) issues.push(MISSING_QUALIFICATION_MESSAGE);
  if (list.some((q) => !q.qualificationTitle.trim())) issues.push('Choose a qualification on every row.');
  if (qualificationEntriesHaveSitting(visitType) && list.some((q) => !q.sittingId)) {
    issues.push('Choose the published EISA sitting on every row.');
  }
  const seen = new Set<string>();
  for (const q of list) {
    const key = q.qualificationTitle.trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) {
      issues.push(`"${q.qualificationTitle}" is listed twice. Each qualification can be added once.`);
      break;
    }
    seen.add(key);
  }
  return issues;
}
