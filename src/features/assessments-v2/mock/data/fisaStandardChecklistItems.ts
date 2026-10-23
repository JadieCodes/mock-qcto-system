import { checklistItem, checklistSection, type ChecklistSection } from '../../shared/checklist/types';

// CR-026: no old-build precedent exists for FISA Standards as its own process — the old build
// only ever reached "FISA" by routing a failed QASA application, which used the QASA checklist.
// Built fresh, in the same evaluate/moderate/validate/approve shape as the QSA Addendum's own
// checklist (CR-011's mandatory per-line comment applies the same way). Flagged in progress.md
// for QCTO's real FISA Standards checklist.
export function buildFisaStandardChecklist(): ChecklistSection[] {
  return [
    checklistSection('fs1', 'Source Documents', [
      checklistItem('fs1.1', 'Has Qualifications Development supplied all required source documents for this Skills Programme?'),
      checklistItem('fs1.2', 'Do the source documents match the Skills Programme title being assessed?'),
      checklistItem('fs1.3', 'Are the source documents on the current template?'),
    ]),
    checklistSection('fs2', 'Final-Assessment Standard Content', [
      checklistItem('fs2.1', 'Does the standard clearly define the final-assessment requirements for this Skills Programme?'),
      checklistItem('fs2.2', 'Are the pass/competency requirements clearly specified?'),
      checklistItem('fs2.3', 'Is the standard internally consistent with the Skills Programme curriculum?'),
    ]),
    checklistSection('fs3', 'Readiness for Instrument Development', [
      checklistItem('fs3.1', 'Is the standard clear enough for an SDP to develop an instrument against it?'),
      checklistItem('fs3.2', 'Have any ambiguities or gaps been resolved?'),
    ]),
  ];
}
