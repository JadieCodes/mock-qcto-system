import { checklistItem, checklistSection, type ChecklistSection } from '../../shared/checklist/types';

// CR-059: "folder-by-folder compliance checks" for a results batch. This is a brand-new
// module (no old-build or QCTO template exists for it) — built fresh, in the same checklist
// shape as every other evaluation in this domain (CR-011: comment on every line). Flagged in
// progress.md as needing QCTO's real folder list and wording, same as Phase 5's freshly-built
// EISA Readiness / RPL-ARPL visit checklists.
export function buildResultsComplianceChecklist(): ChecklistSection[] {
  return [
    checklistSection('f1', 'Registration & Learner Documentation', [
      checklistItem('f1.1', 'The registered-learner list matches the confirmed EISA Confirmation list'),
      checklistItem('f1.2', 'Every learner has a valid, uploaded Statement of Results (SOR)'),
      checklistItem('f1.3', 'No flagged/unresolved SOR issues remain on any learner'),
    ]),
    checklistSection('f2', 'Marking & Moderation Evidence', [
      checklistItem('f2.1', 'Marking records are present and complete for every learner'),
      checklistItem('f2.2', 'Moderation sign-off is present and complete'),
      checklistItem('f2.3', 'The linked Marking & Moderation monitoring visit shows no outstanding findings'),
    ]),
    checklistSection('f3', 'Results Evidence', [
      checklistItem('f3.1', 'Competent / Not Yet Competent outcomes are supported by the submitted evidence'),
      checklistItem('f3.2', 'The submitted competency rate matches the evidence provided'),
    ]),
    checklistSection('f4', 'QA & Compliance', [
      checklistItem('f4.1', 'The SDP compliance status was in good standing for this sitting'),
      checklistItem('f4.2', 'Any RPL/ARPL learners on this sitting have an associated monitoring item'),
    ]),
  ];
}
