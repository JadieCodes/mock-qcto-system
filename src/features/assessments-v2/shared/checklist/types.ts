import type { ValidationIssue } from '../validation/types';

export interface ChecklistItem {
  id: string;
  text: string;
  answer: 'yes' | 'no' | null;
  comment: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

export function isChecklistComplete(sections: ChecklistSection[], requireComment: boolean): boolean {
  return sections.every((section) =>
    section.items.every((item) => item.answer !== null && (!requireComment || item.comment.trim().length > 0)),
  );
}

// Row 11 (test findings): the messages behind isChecklistComplete's "no", named per line so
// ValidationSummary can show exactly which line is missing, not just that something is.
export function getChecklistIssues(sections: ChecklistSection[], requireComment: boolean): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (item.answer === null) {
        issues.push({ field: item.id, message: `${item.id} — select Yes or No.` });
      } else if (requireComment && item.comment.trim().length === 0) {
        issues.push({ field: item.id, message: `${item.id} — a comment is required.` });
      }
    }
  }
  return issues;
}

export function checklistItem(id: string, text: string): ChecklistItem {
  return { id, text, answer: null, comment: '' };
}

export function checklistSection(id: string, title: string, items: ChecklistItem[]): ChecklistSection {
  return { id, title, items };
}
