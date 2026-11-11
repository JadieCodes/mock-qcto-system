import { addWorkingDays } from '../../shared/dates/workingDays';
import type { SittingComponentDate } from '../eisa-calendar/types';

// QCTO feedback 29.32: every EISA component has its own EISA date.
// Batch Q2 (29.12): when the sitting has componentDates (one per component day on the EISA
// Calendar), a component's EISA date is the first of its days.
// ASSUMPTION, kept ONLY as the fallback for a sitting without componentDates (an older sitting,
// or a QASA with no component details when it was scheduled): component 1 is on the sitting date
// and each next component is on the next working day (the domain's shared working-day helper).
// Recorded in progress.md.
export function componentEisaDates(sitting: { date: string; componentDates?: SittingComponentDate[] }, componentIds: string[]): string[] {
  const chain: string[] = [];
  for (let i = 0; i < componentIds.length; i++) {
    chain.push(i === 0 ? sitting.date : addWorkingDays(chain[i - 1], 1));
  }
  if (!sitting.componentDates?.length) return chain;
  return componentIds.map((id, i) => {
    const own = (sitting.componentDates ?? []).filter((c) => c.componentId === id).map((c) => c.date).sort();
    return own[0] ?? chain[i];
  });
}
