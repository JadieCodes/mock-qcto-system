import type { ValidationIssue } from '../../shared/validation/types';
import type { EisaLearnerResult, ResultsComponent } from './types';

// QCTO feedback 29.31 / 05.24: the checks on one mark, shared by the capture screen, the File 3
// upload and api.ts submitResultsBatch() so all three apply the same rules. Null when the mark
// is fine; otherwise a short message that does not name the learner. Batch L1.1: marks are whole
// numbers, as in QCTO's EISA Calculator.
export const WHOLE_NUMBER_MESSAGE = 'Marks must be whole numbers';

export function markIssue(component: ResultsComponent, mark: number | undefined): string | null {
  if (mark === undefined || !Number.isFinite(mark)) return `Enter a mark for ${component.name}, or mark the learner Absent.`;
  if (!Number.isInteger(mark)) return `${WHOLE_NUMBER_MESSAGE} (${component.name}).`;
  if (mark < 0 || mark > component.highestMark) return `The ${component.name} mark must be from 0 to ${component.highestMark}.`;
  return null;
}

// Every learner is Absent or has a whole-number mark from 0 to the component's highest mark for every component.
// Shown on the capture screen and enforced again in api.ts submitResultsBatch().
export function markEntryIssues(components: ResultsComponent[], learners: EisaLearnerResult[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const learner of learners) {
    if (learner.absent) continue;
    for (const c of components) {
      const message = markIssue(c, learner.marks[c.id]);
      if (message) issues.push({ field: `${learner.learnerId}.${c.id}`, message: `${learner.fullName} — ${message.charAt(0).toLowerCase()}${message.slice(1)}` });
    }
  }
  return issues;
}
