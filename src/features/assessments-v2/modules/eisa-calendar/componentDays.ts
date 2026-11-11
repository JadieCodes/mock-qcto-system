import { findQualification } from '../../mock/api/accreditation';
import { listApprovedQsaAddenda } from '../qsa-addendum/api';
import { approvedComponentsOf } from '../qsa-addendum/assessmentDetails';
import type { AssessmentComponent, QsaAddendumApplication } from '../qsa-addendum/types';
import { checkSittingDate } from './dateChecks';
import type { SittingComponentDate } from './types';

// QCTO 29 Oct (Rafir-Munsaur 1:42:55 and 1:49:13-1:52:45, Maake 1:53:29-1:55:38), QCTO feedback
// 29.12: an EISA has one or more components (written and/or practical), each taking the number
// of days the approved QASA states. A sitting needs a date for every day of every component. The
// one shared helper for the propose form, the add/edit dialog, the postponement dialog and the
// bulk upload.

export const SINGLE_DATE_SLOT_ID = 'eisa-date';
export const NO_COMPONENT_DETAILS_NOTE = 'The QASA has no component details yet, so one date is asked per sitting.';

export interface ComponentDaySlot {
  componentId: string;
  componentName: string;
  componentType: SittingComponentDate['componentType'] | null; // null: the single "EISA date" slot
  day: number; // 1-based
  daysInComponent: number;
  label: string;
}

export function isSingleDateFallback(slots: ComponentDaySlot[]): boolean {
  return slots.length === 1 && slots[0].componentId === SINGLE_DATE_SLOT_ID;
}

const TYPE_LABELS = { written: 'written', practical: 'practical' } as const;

// "Theory (written) – day 1", "Practical – day 1": the type is added unless the name already says it.
function slotLabel(name: string, type: keyof typeof TYPE_LABELS, day: number): string {
  const typeText = TYPE_LABELS[type];
  const shown = name.toLowerCase().includes(typeText) ? name : `${name} (${typeText})`;
  return `${shown} – day ${day}`;
}

export function singleDateSlots(): ComponentDaySlot[] {
  return [{ componentId: SINGLE_DATE_SLOT_ID, componentName: 'EISA date', componentType: null, day: 1, daysInComponent: 1, label: 'EISA date' }];
}

export function slotsFromComponents(components: Pick<AssessmentComponent, 'id' | 'name' | 'type' | 'days'>[]): ComponentDaySlot[] {
  if (components.length === 0) return singleDateSlots();
  return components.flatMap((c) => {
    const days = Number.isInteger(c.days) && c.days >= 1 ? c.days : 1;
    return Array.from({ length: days }, (_, i) => ({
      componentId: c.id,
      componentName: c.name,
      componentType: c.type,
      day: i + 1,
      daysInComponent: days,
      label: slotLabel(c.name, c.type, i + 1),
    }));
  });
}

// The slots of one approved QASA, from the components Certification was notified of.
export function slotsFromQasa(qasa: QsaAddendumApplication | undefined): ComponentDaySlot[] {
  return slotsFromComponents(qasa ? approvedComponentsOf(qasa) : []);
}

// The slots a sitting already has (postponement asks for a new date per slot).
export function slotsFromSitting(componentDates: SittingComponentDate[]): ComponentDaySlot[] {
  if (componentDates.length === 0) return singleDateSlots();
  return componentDates.map((c) => ({
    componentId: c.componentId,
    componentName: c.componentName,
    componentType: c.componentType,
    day: c.day,
    daysInComponent: componentDates.filter((d) => d.componentId === c.componentId).length,
    label: slotLabel(c.componentName, c.componentType, c.day),
  }));
}

// The ordered slots for a qualification, from its approved QASA's components. Without an
// approved QASA that has components: one slot, "EISA date".
export async function componentDaySlots(qualificationId: string): Promise<ComponentDaySlot[]> {
  const q = findQualification(qualificationId);
  if (!q) return singleDateSlots();
  const approved = await listApprovedQsaAddenda();
  const qasa = approved.find((a) => a.qpId === q.qpId && a.qualificationTitle.trim().toLowerCase() === q.qualificationName.toLowerCase());
  return slotsFromQasa(qasa);
}

export function qasaSummary(slots: ComponentDaySlot[]): string | null {
  if (isSingleDateFallback(slots)) return null;
  const parts: string[] = [];
  const seen = new Set<string>();
  for (const s of slots) {
    if (seen.has(s.componentId)) continue;
    seen.add(s.componentId);
    parts.push(`${s.componentName} ${s.daysInComponent} ${s.daysInComponent === 1 ? 'day' : 'days'}`);
  }
  return `QASA: ${parts.length} ${parts.length === 1 ? 'component' : 'components'} – ${parts.join(', ')}`;
}

// Per slot: the errors for that date. Every slot must be filled, every date must pass
// checkSittingDate, and the days of one component must be different dates in order (day 2 after
// day 1). Two different components MAY share a date (Maake 1:54:54).
export function checkSittingComponentDates(slots: ComponentDaySlot[], dates: string[], todayIso: string | undefined, onDemand: boolean): string[][] {
  return slots.map((slot, i) => {
    const date = (dates[i] ?? '').trim();
    if (!date) return ['Enter a date.'];
    const errors = [...checkSittingDate(date, todayIso, onDemand).reasons];
    if (slot.day > 1) {
      const previousIndex = slots.findIndex((s) => s.componentId === slot.componentId && s.day === slot.day - 1);
      const previous = (dates[previousIndex] ?? '').trim();
      if (previous) {
        if (date === previous) errors.push(`Day ${slot.day} must be a different date from day ${slot.day - 1}.`);
        else if (date < previous) errors.push(`Day ${slot.day} must be after day ${slot.day - 1} (${previous}).`);
      }
    }
    return errors;
  });
}

export function hasSlotErrors(errors: string[][]): boolean {
  return errors.some((e) => e.length > 0);
}

export function buildComponentDates(slots: ComponentDaySlot[], dates: string[]): SittingComponentDate[] {
  if (isSingleDateFallback(slots)) return [];
  return slots.flatMap((slot, i) =>
    slot.componentType === null
      ? []
      : [{ componentId: slot.componentId, componentName: slot.componentName, componentType: slot.componentType, day: slot.day, date: dates[i] }],
  );
}

// A sitting's `date`: the earliest of its dates.
export function earliestDate(dates: string[]): string {
  return [...dates].filter(Boolean).sort()[0] ?? '';
}

export function earliestComponentDate(componentDates: SittingComponentDate[]): string {
  return earliestDate(componentDates.map((c) => c.date));
}

// Every distinct date a sitting is held on (its `date` alone for older sittings).
export function sittingDatesOf(sitting: { date: string; componentDates?: SittingComponentDate[] }): string[] {
  const all = sitting.componentDates?.length ? sitting.componentDates.map((c) => c.date) : [sitting.date];
  return [...new Set(all)].sort();
}

export function componentDateLabel(c: SittingComponentDate): string {
  return slotLabel(c.componentName, c.componentType, c.day);
}

// "Electrical Trades – Practical day 2" for the Month view.
export function componentDayShortLabel(qualificationTitle: string, c: SittingComponentDate): string {
  return `${qualificationTitle} – ${c.componentName} day ${c.day}`;
}

// The dates of a slot list, in slot order, from a sitting's stored component dates.
export function datesForSlots(slots: ComponentDaySlot[], componentDates: SittingComponentDate[] | undefined, fallbackDate: string): string[] {
  if (isSingleDateFallback(slots)) return [fallbackDate];
  return slots.map((s) => componentDates?.find((c) => c.componentId === s.componentId && c.day === s.day)?.date ?? '');
}

// The forms' shared "can this set of sittings be submitted" check: every sitting is complete and
// passes the checks, its earliest date is in the year, and no two sittings start on the same date.
export function sittingsReady(slots: ComponentDaySlot[], sittings: string[][], year: number, onDemand: boolean, minimum: number): boolean {
  if (sittings.length < minimum || sittings.length === 0) return false;
  const starts = sittings.map((dates) => earliestDate(dates));
  if (new Set(starts).size !== starts.length) return false;
  return sittings.every((dates, i) => !hasSlotErrors(checkSittingComponentDates(slots, dates, undefined, onDemand)) && Number(starts[i].slice(0, 4)) === year);
}

export function emptySitting(slots: ComponentDaySlot[]): string[] {
  return Array<string>(slots.length).fill('');
}
