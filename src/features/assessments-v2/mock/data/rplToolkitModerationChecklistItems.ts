import { checklistItem, checklistSection, type ChecklistSection } from '../../shared/checklist/types';

// Row 46 (test findings J-03): a team-level moderation step for the Director & Team, before
// the IAC — no old-build or QCTO precedent exists, built fresh in the same CR-011 shape
// (mandatory per-line comment) as every other checklist in this domain. Flagged in
// progress.md for QCTO's real moderation checklist once the change request is raised.
export function buildRplToolkitModerationChecklist(): ChecklistSection[] {
  return [
    checklistSection('mod1', 'Moderation of the Evaluation', [
      checklistItem('mod1.1', "Does the team agree with the ASD's findings and recommendation?"),
      checklistItem('mod1.2', 'Is the evidence in the toolkit consistent with the checklist answers?'),
      checklistItem('mod1.3', 'Are there any moderation concerns that should go back to the ASD?'),
    ]),
    checklistSection('mod2', 'Readiness to Endorse', [
      checklistItem('mod2.1', 'Is the toolkit ready to be sent to the IAC for endorsement?'),
    ]),
  ];
}
