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

export function checklistItem(id: string, text: string): ChecklistItem {
  return { id, text, answer: null, comment: '' };
}

export function checklistSection(id: string, title: string, items: ChecklistItem[]): ChecklistSection {
  return { id, title, items };
}
