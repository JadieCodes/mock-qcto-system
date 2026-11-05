import { checklistItem, checklistSection, type ChecklistSection } from '../../shared/checklist/types';

// QCTO feedback 3.10: wording copied from QCTO's own "FISA Validation of Instrument Report"
// (supplied 29 Oct 2026). Replaces the EISA checklist FISA used to borrow. Section 2
// ("Compliance to Standards set for Qualification Exit Level Outcomes") has no items in QCTO's
// form, so it is a comment box on the record (FisaValidationRecord.section2Comment), not a
// checklist section here. Item 3.4 ends with a dangling "OR" in QCTO's file; the "OR" is left out
// (open question in progress.md).

export const FISA_VALIDATION_SECTION_2_TITLE = 'Compliance to Standards set for Qualification Exit Level Outcomes';

const ITEM_1_7_LEAD = 'The following has been indicated on the Assessment:';

export function buildFisaInstrumentValidationChecklist(): ChecklistSection[] {
  return [
    checklistSection('1', 'Development of assessment instrument', [
      checklistItem('1.1', 'The correct Qualification Name has been indicated on the Assessment'),
      checklistItem('1.2', 'All Exit Level Outcomes of the qualification have been met in the FISA'),
      checklistItem('1.3', 'Assessment complies with recommended cognitive application'),
      checklistItem('1.4', 'The FISA assessment questions/task are relevant to applied knowledge and skills'),
      checklistItem('1.5', 'There is a clear relationship between mark allocation and the level of difficulty'),
      checklistItem('1.6', "The required evidence is suitable to the corresponding ELO's"),
      checklistItem('1.7.1', `${ITEM_1_7_LEAD} Assessment requirements needed`),
      checklistItem('1.7.2', `${ITEM_1_7_LEAD} Competence/Pass requirements`),
    ]),
    checklistSection('3', 'Content Coverage', [
      checklistItem('3.1', 'The assessment instrument covers questions/tasks of various types'),
      checklistItem('3.2', 'Examples, graphs or illustrations used are clear, suitable and appropriate (if used)'),
      checklistItem('3.3', 'The content is pitched at the correct NQF level'),
      checklistItem('3.4', 'Questions have not been repeated verbatim from previous questions'),
      checklistItem('3.5', 'There is a variety of questions/tasks in the item bank (eAssessment)'),
    ]),
    checklistSection('4', 'Marking Memorandum/Guideline (this includes any format, e.g. rubric, competency performance, etc.)', [
      checklistItem('4.1', 'The marking memorandum (numbers and content) corresponds with the assessment instrument'),
      checklistItem('4.2', 'The marking memorandum facilitates consistent marking (provides clear guidelines, and clear mark allocation)'),
      checklistItem('4.3', 'The marking memorandum totals correspond with the totals in the assessment instrument'),
    ]),
    checklistSection('5', 'Technical Aspects', [
      checklistItem(
        '5.1',
        'The assessment instrument has all the relevant information such as title of qualification, duration, date, total, and applicable instructions for the FISA',
      ),
      checklistItem('5.2', 'The instructions to candidates are clear and unambiguous'),
      checklistItem('5.3', 'The questions have been correctly numbered'),
      checklistItem('5.4', 'The pages are correctly numbered (if written assessment instrument)'),
      checklistItem('5.5', 'Mark allocation has been clearly indicated for each question and section'),
      checklistItem('5.6', 'The assessment instrument and memorandum is complete in all aspects, including any attachments'),
      checklistItem('5.7', 'The same font is used throughout the paper/format used in eAssessment is user-friendly'),
      checklistItem('5.8', 'Candidates will be able to complete the assessment in the given time allocation'),
    ]),
  ];
}
