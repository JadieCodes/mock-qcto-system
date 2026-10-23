import { checklistItem, checklistSection, type ChecklistSection } from '../../shared/checklist/types';

// No old-build or QCTO template exists for this visit type (PM-05 is still an open item —
// readiness visits aren't in the change request register). Built fresh as a minimal,
// reasonable checklist in the same shape as every other visit-type form, so it is easy to
// replace once QCTO confirms the real template (CR-048 "needs the template set from QCTO").
export function buildEisaReadinessVisitSections(): ChecklistSection[] {
  return [
    checklistSection('1', '1. Assessment Logistics', [
      checklistItem('1.1', 'The assessment venue has been confirmed and is of an acceptable standard'),
      checklistItem('1.2', 'Assessment instruments have been received and are securely stored'),
      checklistItem('1.3', 'Invigilators/assessors have been appointed and briefed'),
      checklistItem('1.4', 'The SDP has confirmed all registered learners are aware of the sitting date and venue'),
    ]),
    checklistSection('2', '2. Learner Readiness', [
      checklistItem('2.1', 'Registered learners have completed all required training components'),
      checklistItem('2.2', 'Statements of Results are available for every registered learner'),
      checklistItem('2.3', 'Learners have had access to the exemplar/practice instrument'),
    ]),
    checklistSection('3', '3. Quality Assurance Sign-off', [
      checklistItem('3.1', 'The Quality Assurance domain confirms the SDP is in good standing'),
      checklistItem('3.2', 'No outstanding compliance issues were raised for this SDP'),
    ]),
  ];
}
