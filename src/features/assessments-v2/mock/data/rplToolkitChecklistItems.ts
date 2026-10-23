import { checklistItem, checklistSection, type ChecklistSection } from '../../shared/checklist/types';

// PM-09: no old-build or QCTO precedent exists for RPL Toolkit Evaluation — built fresh, in
// the same evaluate/moderate/validate/approve shape as the QSA Addendum's checklist (CR-011's
// mandatory per-line comment applies the same way). Flagged in progress.md for QCTO's real
// RPL Toolkit checklist once the change request is raised.
export function buildRplToolkitChecklist(): ChecklistSection[] {
  return [
    checklistSection('rpl1', 'Toolkit Submission', [
      checklistItem('rpl1.1', 'Is the RPL Toolkit on the current template?'),
      checklistItem('rpl1.2', 'Does the toolkit clearly state which qualification/Skills Programme it supports?'),
      checklistItem('rpl1.3', 'Is it clear whether this is a new or an updated toolkit?'),
    ]),
    checklistSection('rpl2', 'Instrument Content', [
      checklistItem('rpl2.1', 'Do the instruments in the toolkit cover every required competency?'),
      checklistItem('rpl2.2', 'Are the assessment criteria and evidence requirements clearly specified?'),
      checklistItem('rpl2.3', 'Is the toolkit suitable for assessing real-world prior experience (RPL/ARPL)?'),
    ]),
    checklistSection('rpl3', 'Readiness for Use', [
      checklistItem('rpl3.1', 'Can SDPs use this toolkit as-is to run RPL/ARPL assessments?'),
      checklistItem('rpl3.2', 'Have any ambiguities or gaps been resolved?'),
    ]),
  ];
}
