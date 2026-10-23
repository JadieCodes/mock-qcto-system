import { checklistItem, checklistSection, type ChecklistSection } from '../../shared/checklist/types';

// No old-build or QCTO template exists for this visit type either. Built fresh, same shape as
// every other visit-type form — see the note in eisaReadinessVisitSections.ts.
export function buildRplArplMonitoringVisitSections(): ChecklistSection[] {
  return [
    checklistSection('1', '1. RPL/ARPL Toolkit & Process', [
      checklistItem('1.1', 'The approved RPL/ARPL Toolkit was used to assess the learner(s)'),
      checklistItem('1.2', 'Evidence of prior learning was collected and is on file for each learner'),
      checklistItem('1.3', 'The assessor applying the toolkit is appropriately qualified/registered'),
    ]),
    checklistSection('2', '2. Consistency & Record-keeping', [
      checklistItem('2.1', 'RPL/ARPL assessment decisions are consistent with the toolkit guidelines'),
      checklistItem('2.2', 'Each learner has a complete RPL/ARPL evidence file'),
    ]),
  ];
}
