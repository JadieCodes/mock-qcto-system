// Wording copied from the old build's Facilitator and Learner Questionnaires
// (src/pages/assessment/External/ExternalSiteVisitsAndMonitoring.tsx:727-831), with "AQP"
// renamed to "QP" (CR-006). CR-057: only ever shown on a Post-EISA Monitoring visit, and only
// once the related results batch is approved. Stored as a flat question list (id + label)
// rather than ~25 named fields each, so the form is one data-driven render loop.
export interface QuestionnaireQuestion {
  id: string;
  label: string;
}

export const FACILITATOR_QUESTIONNAIRE_QUESTIONS: QuestionnaireQuestion[] = [
  { id: 'q1', label: 'An orientation session / staff meeting was held with academic staff prior to the training starting:' },
  { id: 'q2', label: 'Who is the QP (Quality Partner) for this qualification?' },
  { id: 'q3', label: 'Did you consult the Qualification document prior to starting with the training of the learners?' },
  { id: 'q4', label: 'Did you consult the Curriculum document prior to starting with the training of the learners?' },
  { id: 'q5', label: 'To whom do the facilitators report to? (e.g. Head of Department / Academic Manager / Head of Institution)' },
  { id: 'q6', label: 'Was an information session held with facilitators and learners as to what is expected of them? Explain what happened during this session:' },
  { id: 'q7', label: 'Was the learning material received timeously in order for you to prepare your lessons/sessions?' },
  { id: 'q8', label: 'Provide your opinion on the learning material used? (Was it useful; did it cover all modules; was it pitched at the correct level?) Provide detailed comments:' },
  { id: 'q9', label: 'What did you do in addition to using the learning material to make your lessons more interesting for the learners?' },
  { id: 'q10', label: 'Were attendance registers taken for each class?' },
  { id: 'q11', label: 'What is the difference between facilitating the legacy qualification and facilitating the new Occupational Qualification, if any?' },
  { id: 'q12', label: 'What is the most important objective (end result) for a learner who does an Occupational Qualification?' },
  { id: 'q13', label: 'What additional support was provided and/or types of meetings held with management to ensure successful facilitation?' },
  { id: 'q14', label: 'Were formal internal summative assessments completed at the end of each module?' },
  { id: 'q15', label: 'What format/methods were used for these summative assessments?' },
  { id: 'q16', label: 'Who recorded these formal results?' },
  { id: 'q17', label: 'Where were these results recorded?' },
  { id: 'q18', label: 'Did you provide feedback to the learners after each assessment? If so, how?' },
  { id: 'q19', label: 'Did you re-assess learners found Not Yet Competent in a module?' },
  { id: 'q20', label: 'How were learners that were Not Yet Competent in a module re-assessed?' },
  { id: 'q21', label: 'Where did the learners do their workplace component?' },
  { id: 'q22', label: 'Was the workplace monitored by you or the SDP whilst the learners were there?' },
  { id: 'q23', label: 'What is your understanding of the External Integrated Summative Assessment (EISA)?' },
  { id: 'q24', label: 'Did you receive the exemplar of the EISA beforehand and work through it with the learners in preparation?' },
  { id: 'q25', label: 'Why do you think the learners performed so poorly during the EISA?' },
  { id: 'q26', label: 'Are there any other matters you would like to bring to the attention of QCTO?' },
];

export const LEARNER_QUESTIONNAIRE_QUESTIONS: QuestionnaireQuestion[] = [
  { id: 'q1', label: 'An orientation session was held with all learners prior to the training starting:' },
  { id: 'q2', label: 'Did you receive enough information regarding your qualification at the beginning? Were you provided with information on the different components you will be completing?' },
  { id: 'q3', label: 'Did you read the Qualification and Curriculum document prior to starting with the training?' },
  { id: 'q4', label: 'Where did you complete your Workplace Component?' },
  { id: 'q5', label: 'Did you have a supervisor or mentor that signed off your workplace competencies as you completed them?' },
  { id: 'q6', label: 'Did the provider or facilitator monitor you at any time while you were at the workplace?' },
  { id: 'q7', label: 'Did you do a formal assessment after each knowledge and practical module?' },
  { id: 'q9', label: 'Was the learning material received at the beginning of training?' },
  { id: 'q10', label: 'What did you think of the learning material used? (Was it useful; did it cover all the modules; was it easy to understand?) Provide detailed comments:' },
  { id: 'q11', label: 'Were you given any additional materials to assist with the learning besides the learning material?' },
  { id: 'q12', label: 'Was an attendance register completed for each class?' },
  { id: 'q13', label: 'What did you enjoy most about this programme?' },
  { id: 'q14', label: 'What can be done to improve the quality of your training?' },
  { id: 'q15', label: 'Were you informed at the beginning of the programme that you would be completing an EISA conducted by a QP?' },
  { id: 'q16', label: 'Who is the QP (Quality Partner) for this qualification?' },
  { id: 'q17', label: 'Were you given an opportunity to provide feedback on your facilitators to the Provider? If yes, how?' },
  { id: 'q18', label: 'What is your understanding of the EISA (External Integrated Summative Assessment)?' },
  { id: 'q19', label: 'Did you have an opportunity to revise for the EISA by doing the Exemplar with your facilitator, and was feedback provided?' },
  { id: 'q20', label: 'Were you well-prepared for the final assessment (EISA)? Provide a reason for your answer.' },
  { id: 'q21', label: 'What more could have been done to improve your performance in the EISA?' },
  { id: 'q22', label: 'Why do you think learners performed so poorly in the EISA?' },
  { id: 'q23', label: 'Are there any other matters that prevented you from receiving quality training?' },
  { id: 'q24', label: 'What would you like to do once you have achieved this qualification?' },
];
