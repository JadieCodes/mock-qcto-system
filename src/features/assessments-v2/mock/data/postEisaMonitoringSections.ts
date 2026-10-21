import { checklistItem, checklistSection, type ChecklistSection } from '../../shared/checklist/types';

// Wording copied from the old build's Post-EISA Performance (PEM) Report, Sections B-E
// (src/pages/assessment/Internal/InternalSiteVisitsAndMonitoringPage.tsx:1384-1433), with
// "AQP" renamed to "QP" (CR-006). CR-048: this is the Post-EISA Monitoring variant of the
// dynamic execution form — a different section set to Marking & Moderation's.
export function buildPostEisaMonitoringVisitSections(): ChecklistSection[] {
  return [
    checklistSection('B', 'B. Training of Learners', [
      checklistItem('B1', 'Induction/orientation of learners took place'),
      checklistItem('B2', 'CVs of facilitators contain relevant industry experience'),
      checklistItem('B3', 'Copies of certified copies of Facilitators qualifications'),
      checklistItem('B4', 'Facilitators employment contracts are for the duration of the qualification'),
      checklistItem('B5', 'Minutes of Staff meetings with facilitators have been held'),
      checklistItem('B6', 'Timetabling allows for completion of qualifications'),
      checklistItem('B7', 'Sufficient time has been allocated for each required component'),
      checklistItem('B8', 'Facilitators files indicate well-prepared lessons'),
      checklistItem('B9', 'Facilitator files contain qualification and curriculum documents'),
      checklistItem('B10', 'Attendance Registers for each class/session'),
      checklistItem('B11', 'Attendance register tallies with learners that wrote the EISA'),
      checklistItem('B12', 'If discrepancy above, state difference and reason'),
      checklistItem('B13', 'Effective transitioning from legacy to occupational qualification'),
      checklistItem('B14', 'Measures taken by facilitator to "bring the world of work" into the classroom'),
      checklistItem('B15', 'Telephonic confirmation with sample of learners workplaces'),
    ]),
    checklistSection('C', 'C. Internal Assessments', [
      checklistItem('C1', 'Formative assessments are continuously conducted informally'),
      checklistItem('C2', 'Formal summative assessments conducted for each module and results recorded'),
      checklistItem('C2.1', 'Assessment instruments and memo available'),
      checklistItem('C2.2', 'Marked and moderated answer scripts (at least 10%) available for each learner'),
      checklistItem('C3', 'Completed "Workplace Statement of Results" for each learner'),
      checklistItem('C3.1', 'Competencies signed off by workplace over the period of time'),
      checklistItem('C4', 'Internal summative results formally recorded for all components'),
      checklistItem('C4.1', 'Results reflect on the Statement of Results issued'),
      checklistItem('C5', 'Learners have worked through the Exemplar of the EISA instrument'),
    ]),
    checklistSection('D', 'D. Internal Quality Assurance', [
      checklistItem('D1', 'SDP has a valid accreditation letter for this qualification'),
      checklistItem('D2', 'If also accredited as Assessment Centre, valid accreditation letter'),
      checklistItem('D3', 'Recruitment of learners has been done well'),
      checklistItem('D4', 'Implementation of the OC has been done well'),
      checklistItem('D5', 'Each learner has a learner file containing required documents'),
      checklistItem('D6', 'All learners have met entry requirements of the qualification'),
      checklistItem('D7', 'Evaluation forms completed by learners anonymously'),
      checklistItem('D8', 'Internal moderator reports on final summative assessments completed'),
      checklistItem('D9', 'Matrix available indicating how internal summative assessment criteria are met'),
      checklistItem('D10', 'NYC learners given opportunity to be re-assessed until competent'),
      checklistItem('D11', 'Measures taken by SDP to assist and monitor learner in workplace'),
    ]),
    checklistSection('E', 'E. Conduct of EISA', [
      checklistItem('E1', 'Assessment instruments received timeously from QP'),
      checklistItem('E2', 'Storage of assessment instruments in safe prior to assessment'),
      checklistItem('E3', 'Assessment venue is of acceptable standard'),
      checklistItem('E4', 'EISA conducted by trained invigilator'),
      checklistItem('E5', 'Invigilators know how to deal with irregularities'),
      checklistItem('E6', 'State whether scripts were couriered or marked/moderated at AC'),
      checklistItem('E7', 'If couriered, answer scripts were couriered on the same day'),
    ]),
  ];
}
