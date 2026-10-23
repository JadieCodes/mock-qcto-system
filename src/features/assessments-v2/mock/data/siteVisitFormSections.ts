import { checklistItem, checklistSection, type ChecklistSection } from '../../shared/checklist/types';

// Wording copied from the old build's Site Visit execution form, "Quality Assurance Report —
// QCTO Occupational Qualifications Marking Sessions"
// (src/pages/assessment/Internal/InternalSiteVisitsAndMonitoringPage.tsx:794-867, 1147-1193),
// with "AQP" renamed to "QP" (CR-006). CR-048: the execution form changes per visit type —
// this is the Marking & Moderation variant; other visit types get their own section sets later.
export function buildMarkingModerationVisitSections(): ChecklistSection[] {
  return [
    checklistSection('1', '1. Efficient Planning Conducted by Marking Centre', [
      checklistItem('1.1', 'All answer scripts have been marked'),
      checklistItem('1.2', 'Required appointments for Marking and Moderation were made timeously by the QP'),
      checklistItem(
        '1.3',
        'Moderators and Markers appointed all have the necessary subject knowledge and required experience',
      ),
      checklistItem('1.4', 'Marking guidelines training was attended by all appointed Markers and Moderators'),
      checklistItem('1.5', 'The Attendance Register is available for the virtual Marking Guidelines'),
      checklistItem(
        '1.6',
        'Appointed Markers and Moderators who did not take part in the Marking Guidelines Discussion session were withdrawn',
      ),
      checklistItem('1.7', 'Standardisation of the marking memorandum was determined'),
      checklistItem(
        '1.8',
        'Final Marking memorandum was received timeously by the markers to begin marking as scheduled',
      ),
      checklistItem(
        '1.9',
        'There are measures in place to ensure that markers do not mark scripts of candidates from their own SDP',
      ),
      checklistItem('1.10', 'Are the calculations of Marks done accurately'),
      checklistItem('1.11', 'Are all questions on the scripts marked'),
    ]),
    checklistSection('2', '2. Marking Venue is of the Required Standard', [
      checklistItem('2.1', 'Required furniture and ventilation were available'),
      checklistItem('2.2', 'The attendance register was completed by appointed markers'),
      checklistItem('2.3', 'Only QP Appointed Marking officials were allowed in the Marking venue/s'),
      checklistItem('2.4', 'Were scripts Marked by QP Appointed Marker/s and Moderator'),
    ]),
    checklistSection('3', '3. Security of Venue and Scripts is Maintained', [
      checklistItem('3.1', 'Scripts were received timeously from the Assessment Centres'),
      checklistItem(
        '3.2',
        'Security protocols for the receipt of scripts and return of scripts was followed at all times',
      ),
      checklistItem('3.3', 'All scripts were marked'),
      checklistItem('3.4', 'The required percentage of scripts was moderated'),
    ]),
    checklistSection('4', '4. Standard of Marking is Consistent, and Irregularities Identified', [
      checklistItem('4.1', 'The Moderator and Marker adhered to the final Marking Guidelines'),
      checklistItem(
        '4.2',
        'Were any changes to marking guidelines received after the finalization of the marking guidelines?',
      ),
      checklistItem(
        '4.3',
        'The moderator identified a marker who was applying the marking guidelines incorrectly or inconsistently and brought up to standard',
      ),
      checklistItem(
        '4.4',
        'Feedback was provided to markers from the samples moderated by Moderator to ensure consistency of marking',
      ),
      checklistItem('4.5', 'Major discrepancies between marker and moderator were addressed'),
      checklistItem(
        '4.6',
        'Marks awarded for each question for each script was checked for accuracy and totalling before capturing of results',
      ),
      checklistItem('4.7', 'Irregularities were identified'),
      checklistItem('4.8', 'If applicable, explain how these irregularities were dealt with'),
    ]),
    checklistSection('5', '5. Adherence to Required Policies, Schedules and Quality of Reporting', [
      checklistItem('5.1', 'Marking Centre adhered strictly to QP Assessment Policy'),
      checklistItem('5.2', 'Marking and Moderation was completed according to the QP schedule'),
      checklistItem('5.3', 'Required Marker and Moderator Reports were submitted timeously to the QP'),
      checklistItem(
        '5.4',
        'The reports were read and quality assured by the QP for accuracy and valuable input before being sent to the QCTO',
      ),
      checklistItem('5.5', 'The QP verified the accuracy of the results received from the Moderator'),
      checklistItem('5.6', 'Marking and Moderation took place as per the QP schedule'),
      checklistItem('5.7', 'Required documents and reports will be sent to the QCTO by the due date'),
    ]),
    checklistSection('6', '6. Comment on the following', [
      checklistItem(
        '6.1',
        'In the case of different marks awarded by the Marker and the Moderator, which marks are captured as the final result for the EISA?',
      ),
      checklistItem(
        '6.2',
        'More sample marking should be conducted before the marking of batches. Was this done by marker and Moderator?',
      ),
    ]),
  ];
}

// Sections 7-8 are free text, and Completion Details is a small name/date pair —
// both copied from the same source, lines 1147-1193.
export const SITE_VISIT_FREE_TEXT_SECTIONS = [
  { id: '7', title: '7. Quality of Question Paper/s', placeholder: "As identified in Marker's and Moderator's Reports..." },
  { id: '8', title: '8. General Comments', placeholder: 'General comments...' },
];

export const SITE_VISIT_COMPLETION_FIELDS = [
  { id: 'completedBy', label: 'Completed By (Name)' },
  { id: 'completedDate', label: 'Completion Date' },
];
