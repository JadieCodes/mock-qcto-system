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

// Batch Z3 (look only): one colour per sub-unit for the Visit schedule screen. Full class names so Tailwind
// can see them. The colour is never the only signal: the sub-unit name or a short label always sits beside it.
export interface SubUnitColour {
  dot: string;
  tint: string;
  // Solid left edge, and the colour of the other three edges (dashed on a visit not yet approved).
  leftBorder: string;
  edge: string;
  text: string;
  bar: string;
  ring: string;
}

export const SUB_UNIT_COLOURS: Record<SubUnit, SubUnitColour> = {
  'assessment-standards': {
    dot: 'bg-violet-500 dark:bg-violet-400',
    tint: 'bg-violet-50 dark:bg-violet-950/50',
    leftBorder: 'border-l-violet-500 dark:border-l-violet-400',
    edge: 'border-violet-200 dark:border-violet-800',
    text: 'text-violet-900 dark:text-violet-100',
    bar: 'bg-violet-100 text-violet-900 dark:bg-violet-950/70 dark:text-violet-100',
    ring: 'ring-2 ring-violet-500 dark:ring-violet-400',
  },
  'eisa-registrations': {
    dot: 'bg-sky-500 dark:bg-sky-400',
    tint: 'bg-sky-50 dark:bg-sky-950/50',
    leftBorder: 'border-l-sky-500 dark:border-l-sky-400',
    edge: 'border-sky-200 dark:border-sky-800',
    text: 'text-sky-900 dark:text-sky-100',
    bar: 'bg-sky-100 text-sky-900 dark:bg-sky-950/70 dark:text-sky-100',
    ring: 'ring-2 ring-sky-500 dark:ring-sky-400',
  },
  'approval-of-results': {
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    tint: 'bg-emerald-50 dark:bg-emerald-950/50',
    leftBorder: 'border-l-emerald-500 dark:border-l-emerald-400',
    edge: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-900 dark:text-emerald-100',
    bar: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-100',
    ring: 'ring-2 ring-emerald-500 dark:ring-emerald-400',
  },
  other: {
    dot: 'bg-slate-500 dark:bg-slate-400',
    tint: 'bg-slate-100 dark:bg-slate-800/60',
    leftBorder: 'border-l-slate-500 dark:border-l-slate-400',
    edge: 'border-slate-300 dark:border-slate-600',
    text: 'text-slate-900 dark:text-slate-100',
    bar: 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
    ring: 'ring-2 ring-slate-500 dark:ring-slate-400',
  },
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
