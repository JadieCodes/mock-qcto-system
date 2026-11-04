import { SITE_VISIT_FREE_TEXT_SECTIONS } from '../../mock/data/siteVisitFormSections';
import type { VisitType } from './types';

export interface FreeTextField {
  id: string;
  label: string;
  placeholder: string;
}

// CR-048: the free-text part of the execution form changes per visit type too, not just the
// checklist. Marking & Moderation keeps the two sections copied from the old build; the other
// types (none of which have an old-build or QCTO template) get one generic notes field.
export function freeTextFieldsForType(visitType: VisitType): FreeTextField[] {
  switch (visitType) {
    case 'marking-moderation':
      return SITE_VISIT_FREE_TEXT_SECTIONS.map((s) => ({ id: s.id, label: s.title, placeholder: s.placeholder }));
    case 'post-eisa-monitoring':
      return [
        { id: 'bestPractice', label: 'Best Practice Identified', placeholder: 'Describe any best practice observed...' },
        { id: 'recommendedImprovements', label: 'Recommended Improvements', placeholder: 'Describe recommended improvements...' },
      ];
    case 'eisa-readiness':
    case 'rpl-arpl-monitoring':
    case 'marking-guideline-discussion':
    case 'instrument-validation-visit':
    case 'qasa-development-visit':
      return [{ id: 'notes', label: 'Notes', placeholder: 'General comments...' }];
    // QCTO feedback 2.5: the planner records what the meeting covered, then uploads the report.
    case 'other-meeting':
      return [{ id: 'notes', label: 'Meeting notes', placeholder: 'What was discussed and agreed...' }];
  }
}
