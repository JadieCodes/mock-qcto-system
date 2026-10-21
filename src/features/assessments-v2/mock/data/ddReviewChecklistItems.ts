import { checklistItem, checklistSection, type ChecklistSection } from '../../shared/checklist/types';

// Wording copied from the old build's Deputy Director review checklist
// (src/pages/assessment/Internal/QasaEvaluation.tsx:308, "ddItems"), which was tick-only with
// a single notes box. CR-011 adds a mandatory comment per line here, enforced by
// shared/checklist/Checklist.tsx, not by this data.
export function buildDdReviewChecklist(): ChecklistSection[] {
  return [
    checklistSection('dd', 'Deputy Director Review', [
      checklistItem('dd.1', 'ASD evaluation report is thorough'),
      checklistItem('dd.2', 'All checklist items were properly assessed'),
      checklistItem('dd.3', 'Recommendations are appropriate'),
      checklistItem('dd.4', 'Supporting evidence is sufficient'),
      checklistItem('dd.5', 'Risk assessment is accurate'),
    ]),
  ];
}
