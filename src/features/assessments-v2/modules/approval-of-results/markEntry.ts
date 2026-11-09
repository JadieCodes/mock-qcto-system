import type { ValidationIssue } from '../../shared/validation/types';
import type { EisaLearnerResult, ResultsComponent } from './types';

// QCTO feedback 29.31: the basic checks on the QP's mark entry — every learner is Absent or has
// a mark from 0 to the component's total for every component. Shown in the submit dialog and
// enforced again in api.ts submitResultsBatch().
export function markEntryIssues(components: ResultsComponent[], learners: EisaLearnerResult[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const learner of learners) {
    if (learner.absent) continue;
    for (const c of components) {
      const mark = learner.marks[c.id];
      if (mark === undefined || !Number.isFinite(mark)) {
        issues.push({ field: `${learner.learnerId}.${c.id}`, message: `${learner.fullName} — enter a mark for ${c.name}, or mark the learner Absent.` });
      } else if (mark < 0 || mark > c.totalMarks) {
        issues.push({ field: `${learner.learnerId}.${c.id}`, message: `${learner.fullName} — the ${c.name} mark must be from 0 to ${c.totalMarks}.` });
      }
    }
  }
  return issues;
}
