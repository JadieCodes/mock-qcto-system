import type { SiteVisit, VisitDomain, VisitType } from './types';
import { visitDomainOf } from './visitDomains';

// Batch Z2 (QCTO 11 Nov, item 11.9): the Director wants one monthly schedule per sub-unit of the
// Assessment directorate. A visit belongs to exactly one sub-unit.
export type SubUnit = 'assessment-standards' | 'eisa-registrations' | 'approval-of-results' | 'other';

// The order the blocks, sheets and counts appear in.
export const SUB_UNIT_ORDER: SubUnit[] = ['assessment-standards', 'eisa-registrations', 'approval-of-results', 'other'];

export const SUB_UNIT_LABELS: Record<SubUnit, string> = {
  'assessment-standards': 'Assessment Standards',
  'eisa-registrations': 'EISA Registrations, Conduct and Management',
  'approval-of-results': 'Approval of Results',
  other: 'Other',
};

// An Excel sheet name holds 31 characters at most, so the longest label gets a short form.
export const SUB_UNIT_SHEET_NAMES: Record<SubUnit, string> = {
  'assessment-standards': 'Assessment Standards',
  'eisa-registrations': 'EISA Reg, Conduct & Mgmt',
  'approval-of-results': 'Approval of Results',
  other: 'Other',
};

export const SUB_UNIT_OPTIONS: { value: SubUnit; label: string }[] = SUB_UNIT_ORDER.map((value) => ({ value, label: SUB_UNIT_LABELS[value] }));

// ASSUMPTION until QCTO confirms: which sub-unit normally does each kind of visit, read from QCTO's
// November schedules. An "Other / special meeting" has no default: capacitation sessions appear on all
// three schedules, so the planner chooses.
export const DEFAULT_SUB_UNIT_BY_VISIT_TYPE: Record<VisitType, SubUnit | null> = {
  'qasa-development-visit': 'assessment-standards',
  'instrument-validation-visit': 'assessment-standards',
  'eisa-readiness': 'eisa-registrations',
  'rpl-arpl-monitoring': 'eisa-registrations',
  'marking-moderation': 'eisa-registrations',
  'marking-guideline-discussion': 'eisa-registrations',
  'post-eisa-monitoring': 'approval-of-results',
  'other-meeting': null,
};

// The sub-unit the plan form pre-sets: null when the planner has to choose. A visit for another QCTO
// domain than Assessment is not one of the Assessment sub-units' work, so it is "Other".
export function defaultSubUnitFor(visitType: VisitType, domain: VisitDomain): SubUnit | null {
  if (domain !== 'assessment') return 'other';
  return DEFAULT_SUB_UNIT_BY_VISIT_TYPE[visitType];
}

// The stored sub-unit when set, otherwise the default. Visits stored before Batch Z2 have none stored.
export function subUnitOf(visit: SiteVisit): SubUnit {
  return visit.subUnit ?? defaultSubUnitFor(visit.visitType, visitDomainOf(visit)) ?? 'other';
}

export const MISSING_SUB_UNIT_MESSAGE = 'Choose the sub-unit for this meeting.';
