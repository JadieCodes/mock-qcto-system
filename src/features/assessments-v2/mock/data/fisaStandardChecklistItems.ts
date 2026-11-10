import { checklistItem, checklistSection, type ChecklistSection } from '../../shared/checklist/types';

// Batch W: QCTO's own "Assessment Standards Evaluation Report" (QCTO 29.41: QCTO's own
// checklist). One section of six Yes / No items; CR-011's comment on every line still applies.
// The header, "Evaluation Findings", "Recommendation" and the evaluator line live on the
// Evaluation tab (modules/fisa/internal/StandardWorkspace.tsx).
export const FISA_STANDARD_CHECKLIST_SECTION_ID = 'fsa';

// Records stored before Batch W carry the previous items (ids "fs1.1" ... "fs3.2").
export const LEGACY_FISA_STANDARD_FIRST_ITEM_ID = 'fs1.1';

export function buildFisaStandardChecklist(): ChecklistSection[] {
  return [
    checklistSection(FISA_STANDARD_CHECKLIST_SECTION_ID, 'Skills Programme Assessment Standards Evaluation', [
      checklistItem('fsa.1', 'Is the correct Format used?'),
      checklistItem('fsa.2', "Does the FISA contain a standard to be proved as per ELO's and Purpose?"),
      checklistItem('fsa.3', 'Conditions and requirements for candidate to perform assessment is clearly indicated?'),
      checklistItem('fsa.4', 'Required evidence and/or performance required is clearly indicated?'),
      checklistItem('fsa.5', 'Competency level/ Pass Mark is indicated'),
      checklistItem('fsa.6', 'Time allocation is highlighted.'),
    ]),
  ];
}

export function isLegacyFisaStandardChecklist(sections: ChecklistSection[]): boolean {
  return sections[0]?.items[0]?.id === LEGACY_FISA_STANDARD_FIRST_ITEM_ID;
}
