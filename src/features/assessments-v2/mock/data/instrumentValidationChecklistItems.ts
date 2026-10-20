import { checklistItem, checklistSection, type ChecklistSection } from '../../shared/checklist/types';

// Wording copied from the old build's "QA Validation of Assessment Instrument Checklist"
// (src/pages/assessment/Internal/InternalEisaValidation.tsx:688-794). Used for EISA Instrument
// Validation (CR-018: QP-only, no SDP visibility) and, per 01-process-flow.md §3 map 4,
// reused for FISA Instrument Validation with the "FISA Validation Report" output name.

export interface RequiredDocument {
  id: string;
  label: string;
}

export const REQUIRED_INSTRUMENT_DOCUMENTS: RequiredDocument[] = [
  { id: 'moderatorReport', label: 'Moderator Report' },
  { id: 'examinerReport', label: 'Examiner Report' },
  { id: 'cv', label: 'CV' },
  { id: 'confidentialityAgreement', label: 'Confidentiality Agreement' },
  { id: 'eisaInstrumentMemo', label: 'EISA Instrument and Memo (written)' },
  { id: 'eisaInstrumentRubric', label: 'EISA Instrument and Rubric (practical)' },
];

export function buildInstrumentValidationChecklist(): ChecklistSection[] {
  return [
    checklistSection('1', 'QAS Addendum', [
      checklistItem('1.1', 'Has the QAS Addendum been developed and approved?'),
      checklistItem('1.2', 'Is the QAS Addendum correctly filed on the Assessment SharePoint?'),
      checklistItem('1.3', 'Is the Component Details correctly captured on the EISA Component Control Register?'),
      checklistItem('1.4', 'Is the QAS Addendum on the current template?'),
      checklistItem(
        '1.5',
        'Do the Component details (Total Marks and Pass/Competency Requirements) match the instrument being validated?',
      ),
      checklistItem('1.6', 'Was a template for FILE 3 as well as an example of FILE 3 provided to the QP?'),
      checklistItem(
        '1.7',
        'Was an EISA Final Percentage Calculator (where applicable) developed and provided to the QP?',
      ),
    ]),
    checklistSection('2', 'Examiner / Developer Details and Findings', [
      checklistItem('2.1', 'Has the criteria for the Examiner / Developer been specified?'),
      checklistItem('2.2', 'Does Examiner / Developer meet the specified criteria according to his/her CV?'),
      checklistItem('2.3', 'Has the Examiner / Developer completed their report on this instrument?'),
      checklistItem(
        '2.4',
        "Has the Examiner / Developer's report been completed on the QCTO prescribed template?",
      ),
      checklistItem(
        '2.5',
        'Examiner / Assessor Report checked for compliance to QAS addendum, content coverage, marking memorandum and technical aspects?',
      ),
      checklistItem('2.6', 'Was the Examiner / Developer requested to do any remediations as per Moderator findings?'),
    ]),
    checklistSection('3', 'Moderator Details and Findings', [
      checklistItem('3.1', 'Has the criteria for the Moderator been specified?'),
      checklistItem('3.2', 'Does Moderator meet the specified criteria according to his/her CV?'),
      checklistItem('3.3', 'Has the Moderator completed their report on this instrument?'),
      checklistItem('3.4', "Has the Moderator's report been completed on the QCTO prescribed template?"),
      checklistItem('3.5', 'Did the moderator request remediation from the Examiner / Developer?'),
      checklistItem('3.6', 'Has the moderator made any changes to the instrument?'),
      checklistItem('3.7', 'Were changes, if any, communicated to the Examiner / Developer?'),
      checklistItem(
        '3.8',
        'Moderator Report checked for compliance to QAS addendum, content coverage, marking memorandum and technical aspects?',
      ),
    ]),
    checklistSection('4', 'Overall Evaluation', [
      checklistItem('4.1', 'Has the EISA assessment instrument been approved by the Moderator?'),
      checklistItem(
        '4.2',
        'The assessment instrument and the marking memo / guideline are clearly separated documents?',
      ),
      checklistItem(
        '4.3',
        'The memorandum / guideline corresponds to the assessment instrument with regards to question numbers and mark allocation?',
      ),
      checklistItem(
        '4.4',
        'All details on the front page correct (Logo, Date, Duration, Total Marks, Pass Mark, Instructions to candidates are clear)?',
      ),
      checklistItem('4.5', 'EISA rules have been clearly stipulated on the instrument?'),
      checklistItem('4.6', 'Assessment instructions have been included?'),
      checklistItem('4.7', 'Instructions in questions are clear (candidates will know what is expected of them)?'),
      checklistItem('4.8', 'Grammar has been checked?'),
      checklistItem('4.9', 'Spelling has been checked?'),
      checklistItem(
        '4.10',
        'Question numbers and marks allocated per question are as indicated in the QAS Addendum (Blueprint)?',
      ),
      checklistItem('4.11', 'The language used is pitched at a suitable level?'),
      checklistItem(
        '4.12',
        'Does the instrument inspire confidence by starting with lower cognitive questions first and thereafter increasing the cognitive levels?',
      ),
    ]),
  ];
}
