import { addWorkingDays } from '../../shared/dates/workingDays';
import { RESULTS_SUBMISSION_DEADLINE_WORKING_DAYS } from '../approval-of-results/config';

// Batch T (QCTO 29.20, 29.21): the confirmation comes from the QP. The ASD reviews it. One
// constant to change if QCTO names a different reviewer (same pattern as the EISA Calendar's
// CALENDAR_REVIEWER_ROLE).
export const CONFIRMATION_REVIEWER_ROLE = 'ASD' as const;

// QCTO process map "EISA Registration": the consolidated learner file goes to the QP at the latest
// this many months before the EISA.
export const CONFIRMATION_SHARE_MONTHS_BEFORE = 2;

export const CONFIRMATION_DECLARATION_TEXT =
  'I confirm that the assessment centres, learner allocation and dates in this confirmation are accurate and complete.';

// The same 21-working-days-after-EISA rule Approval of Results uses for its submission deadline.
export function defaultResultsSubmissionDate(sittingDate: string): string {
  return addWorkingDays(sittingDate, RESULTS_SUBMISSION_DEADLINE_WORKING_DAYS);
}
