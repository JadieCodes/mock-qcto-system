import { checklistItem, checklistSection, type ChecklistSection } from '../../shared/checklist/types';

// Wording copied from the old build's 44-item "QAS Addendum Preliminary Checklist"
// (src/pages/assessment/Internal/QasaEvaluation.tsx:112-173), with "AQP" renamed to "QP" (CR-006).
// This is the "blueprint" evaluation checklist for a QSA Addendum application (CR-011: comment
// on every line, enforced by shared/checklist/Checklist.tsx, not by this data).
export function buildQsaAddendumChecklist(): ChecklistSection[] {
  return [
    checklistSection('1.1', 'Assessment Model and Distribution', [
      checklistItem(
        '1.1.1',
        'Evaluator has read all relevant documentation (SAQA Qualification Document, Curriculum Document, External Assessment Specifications)',
      ),
      checklistItem(
        '1.1.2',
        'Type of Model has been clearly defined (min required: written/practical; how many final EISAs)',
      ),
      checklistItem('1.1.3', 'Described model is the same as in the original external assessment specifications'),
      checklistItem('1.1.4', 'QP has clearly stated where copies will be made (e.g. by QP or Assessment Centres)'),
      checklistItem('1.1.5', 'The QP has explained the distribution process of the EISA (for each one if more than one)'),
      checklistItem(
        '1.1.6',
        'QP has clearly provided a timeline of how many days/weeks in advance the EISA will be distributed',
      ),
      checklistItem('1.1.7', 'The QP has explained acceptable security precautions'),
    ]),
    checklistSection('1.2', 'Qualification Outcomes (table)', [
      checklistItem('1.2.1', 'The Exit Level Outcomes listed are the same as in the SAQA qualification document'),
      checklistItem(
        '1.2.2',
        'The Exit Level Outcomes listed are the same as in the Curriculum document (Section 2 - Occupational Profile)',
      ),
      checklistItem(
        '1.2.3',
        'Integrated Assessment Focus Areas (numbered) in the Assessment Standards match the qualification',
      ),
      checklistItem('1.2.4', 'The weighting per ELO is the same as in the curriculum'),
      checklistItem(
        '1.2.5',
        'The Key Assessment Focus Areas are bulleted concisely as job specifications / job competencies (not a copy-paste of ACs)',
      ),
    ]),
    checklistSection("1.3", "Distribution of Cognitive Application (Bloom's Taxonomy)", [
      checklistItem('1.3.1', 'The correct level of the qualification has been indicated'),
      checklistItem(
        '1.3.2',
        'The spread of percentages in the lower, medium and higher order should suit the type of model described',
      ),
      checklistItem('1.3.3', 'All percentages must add up to 100%'),
    ]),
    checklistSection('1.4', 'Assessment Requirements', [
      checklistItem('1.4.1', 'Correct Qualification Title (as per SAQA)'),
      checklistItem('1.4.2', 'Correct NQF Level'),
      checklistItem('1.4.3', 'Correct total number of Credits'),
      checklistItem('1.4.4', 'Duration: stipulated in hours/days for each EISA'),
      checklistItem(
        '1.4.5',
        'Total Marks / Total Competency stated (written: total mark; practical: core competencies)',
      ),
      checklistItem(
        '1.4.6',
        'Format indicated (written/practical/presentation/computer-based; number of final assessment instruments)',
      ),
      checklistItem('1.4.7', 'Layout: technical aspects (number of sections; overview of question types)'),
      checklistItem('1.4.8', 'Open or Closed Book: stated whether candidates may have reference material'),
      checklistItem('1.4.9', 'Points: at which stage the EISA will take place (for each if more than one)'),
      checklistItem(
        '1.4.10',
        'Supplementary Assessments: indicated whether re-assessments will be allowed and requirements',
      ),
      checklistItem('1.4.11', '% to be moderated stated (cannot be less than 10%)'),
      checklistItem('1.4.12', 'Days allowed for marking are indicated'),
      checklistItem('1.4.13', 'Days allowed for moderation are indicated'),
      checklistItem(
        '1.4.14',
        'Days from assessment date to submission of learner achievements to QCTO has been indicated',
      ),
    ]),
    checklistSection('1.5', 'Assessment Grid (Blueprint)', [
      checklistItem('1.5.1', 'Step 1: ELOs can either be listed separately or combined'),
      checklistItem('1.5.2', 'Step 2: Key assessment Focus Areas are listed in the block below the ELOs (IAFAs)'),
      checklistItem(
        '1.5.3',
        'Step 3: Under "Evidence required" column, the most suitable form of evidence is listed',
      ),
      checklistItem('1.5.4', 'Step 4: For each identified evidence there is a question number'),
      checklistItem('1.5.5', 'Step 5: Key for types of questions indicated (MC, TE, etc.)'),
      checklistItem('1.5.6', 'Step 6: Marks per question have been indicated'),
      checklistItem('1.5.7', 'Step 7: Time has been indicated (in minutes) for each question'),
      checklistItem('1.5.8', 'Step 8: Module(s) and module code(s) for each question have been indicated'),
      checklistItem(
        '1.5.9',
        'Step 9: Cognitive order allocated: Marks written under applicable column / Competencies marked in crosses',
      ),
      checklistItem('1.5.10', 'Final Check: Marks have been subtotalled'),
      checklistItem('1.5.11', 'Final Check: Grand total of marks has been indicated'),
      checklistItem('1.5.12', 'Final Check: Marks is the same as stipulated under 1.4'),
      checklistItem('1.5.13', 'Final Check: Time has been subtotalled (in minutes)'),
      checklistItem(
        '1.5.14',
        'Final Check: Grand total of minutes is the same as the time (in hours) stipulated under 1.4',
      ),
      checklistItem(
        '1.5.15',
        'Final Check: Cognitive marks distribution % is the same as indicated in 1.3 (L/M/H)',
      ),
    ]),
  ];
}
