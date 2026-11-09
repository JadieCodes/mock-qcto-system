import { addWorkingDays } from '../../shared/dates/workingDays';

// QCTO feedback 29.32: every EISA component has its own EISA date.
// ASSUMPTION until the EISA Calendar holds a date per component (a later batch, waiting for
// QCTO's QASA control sheet): component 1 is on the sitting date and each next component is on
// the next working day (the domain's shared working-day helper). Recorded in progress.md.
export function componentEisaDates(sittingDate: string, componentCount: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < componentCount; i++) {
    dates.push(i === 0 ? sittingDate : addWorkingDays(dates[i - 1], 1));
  }
  return dates;
}
