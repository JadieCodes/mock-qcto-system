// Batch W: QCTO's "QP RPL Evaluation". A self-audit the QP completes when submitting (Yes / No /
// In process, with Notes / Evidence), with a QCTO feedback column the ASD completes. Replaces the
// checklist built in PM-09 (that one had no QCTO precedent). Question ids are "<part>.<group>.<n>".
// QCTO's form lists the second RIGOROUS question twice; it is used once here (progress.md, Batch W).
export interface RplSelfAuditQuestion {
  id: string;
  text: string;
}

export interface RplSelfAuditGroup {
  id: string;
  title: string;
  questions: RplSelfAuditQuestion[];
}

export interface RplSelfAuditPart {
  id: string;
  title: string;
  groups: RplSelfAuditGroup[];
}

function group(partNo: number, groupNo: number, title: string, texts: string[]): RplSelfAuditGroup {
  return {
    id: `${partNo}.${groupNo}`,
    title,
    questions: texts.map((text, i) => ({ id: `${partNo}.${groupNo}.${i + 1}`, text })),
  };
}

export const RPL_SELF_AUDIT_PARTS: RplSelfAuditPart[] = [
  {
    id: 'part1',
    title: 'Part 1: Readiness in terms of Guiding Principles for Quality Provision',
    groups: [
      group(1, 1, 'ACCESSIBLE', [
        'Does the process provide detailed information and advice for each step of the RPL process?',
        'Is information freely available and also online?',
        'Does the process include an explanation of the fees involved?',
        'Does the process include an explanation of the timeline involved and timeframes for assessment and any necessary reassessment?',
        'Does the process include an explanation of who conducts advising and assessing functions?',
        'Does the process include an explanation of what assessments are (a description)?',
        'Does the process include an explanation of how assessment results are provided?',
        'Is an online self-assessment available to improve information and access?',
      ]),
      group(1, 2, 'TRANSPARENT', [
        'Is the information written in plain language?',
        'Does the process fully inform applicants of how the assessment process works?',
        'Does the process provide applicants with details of their results, including learning gaps, differences, and achievements?',
        'Does the process explain options for unsuccessful candidates?',
        'Does the process include post-assessment guidance in the form of next steps?',
      ]),
      group(1, 3, 'FAIR AND RESPECTFUL', [
        "Does the process recognise that 'same' treatment is not necessarily 'fair' treatment?",
        'Is the RPL process more burdensome than methods used for students already enrolled for occupational qualifications?',
        "Does the process consider a candidate's unique circumstances?",
        'Does the process allow for the use of translators for some assessments?',
        'Are the fees affordable and are there payment options?',
        'Does the RPL process have an appeals mechanism?',
        'Do the processes ensure that candidates have equivalent opportunity to engage?',
        'Do the processes ensure that barriers are removed?',
        'Is there more than one assessment per year?',
        'Are the standards against which assessment will happen clear?',
      ]),
      group(1, 4, 'VALID', [
        'Do we use tools and methods that test acquired knowledge, skills and experience as stipulated for the relevant qualification or part qualification?',
        'Do we use tools that have been translated into plain language?',
        'Does the process accept a variety of assessments to accommodate applicants with a language or writing disposition?',
      ]),
      group(1, 5, 'RELIABLE / CONSISTENT', [
        'Will the assessment results be the same regardless of who the trained assessor is?',
        'Do the processes provide clear assessment criteria with accompanying scoring grids, charts, or rubrics?',
      ]),
      group(1, 6, 'FLEXIBLE', [
        'Do the processes provide applicants with more than one opportunity to demonstrate knowledge, skills and abilities?',
        'Do the processes consider evidence from a variety of sources?',
        'Do the processes allow for re-assessment?',
      ]),
      group(1, 7, 'RIGOROUS', [
        'Do the tools and methods evaluate stated competencies, standards, and outcomes?',
        'Do the tools and methods test all required knowledge, skills and experience as stipulated for the relevant modules of qualification or part qualification?',
      ]),
      group(1, 8, 'PROFESSIONAL', [
        'Do we conduct regular reviews of RPL policies and procedures?',
        'Do we ask for the perspective of candidates who use RPL?',
        'Do we ensure all staff involved with RPL practices receive initial and continuing training?',
        'Do we continuously update ourselves on the content of the relevant curricula?',
      ]),
    ],
  },
  {
    id: 'part2',
    title: 'Part 2: Readiness in terms of the Five Steps for the Provision of Quality RPL Services',
    groups: [
      group(2, 1, 'EXPLAIN THE RPL PROCESS', [
        'Does the process provide clear information in both print and digital media?',
        'Does the process clearly describe each step of the RPL process?',
        'Does the process state the cost and timelines?',
        'Does the process describe the roles and responsibilities of the staff involved in the RPL process and the type of support that can be expected?',
        'Does the process specify the occupations and qualifications for which RPL services are provided?',
        'Does the process provide contact information of staff?',
      ]),
      group(2, 2, 'PROVIDE INFORMATION ON EXPECTED REQUIREMENTS AND SELF-ASSESSMENT', [
        'Does the process specify the assessment criteria and work experience requirements per module of the related curriculum?',
        'Does the process provide detailed self-assessment checklists (based on the curriculum) against which learning and experiences can be reflected?',
        'Does the process provide information to assist in identification and presentation of sources of evidence?',
        'Does the process provide RPL application forms and application processes?',
        'Does the process provide for diagnostic assessment instruments for the evaluation of self-assessments?',
      ]),
      group(2, 3, 'EVALUATE APPLICATION AND SELF ASSESSMENT', [
        'Does the process provide for a verification interview to validate the authenticity of evidence presented as part of the self-assessment?',
        'Does the process provide for feedback on additional evidence required?',
        'Does the process provide for the establishment of learning and development plans?',
      ]),
      group(2, 4, 'ASSIST IN PREPARATION FOR ASSESSMENT AND CONDUCT ASSESSMENT', [
        'Does the process provide for the provision of learning material to enable applicants to prepare for the assessment?',
        'Does the process provide for on-going support to the applicant during the preparation phase?',
        'Does the process establish networking opportunities with SDPs and workplaces to offer "gap" training?',
        'Does the process provide assistance to candidates to promote and present their knowledge, skills and abilities?',
        'Does the process provide information on assessment time frames?',
        'Does the process provide for the development of assessment instruments?',
        'Does the process provide appropriate RPL assessment training for assessors?',
        'Does the process offer flexible assessment options to accommodate applicants with differences in learning abilities and language preferences?',
        'Does the process validate assessment results to ensure reliability?',
      ]),
      group(2, 5, 'PROVIDE ASSESSMENT RESULTS', [
        'Does the process provide constructive feedback on both successes and areas where improvements are needed?',
        'Does the process obtain feedback from applicants on their experience of the RPL process?',
        'Does the process document successful RPL assessment results and provide feedback to the QCTO?',
      ]),
    ],
  },
];

export function allRplSelfAuditQuestions(): RplSelfAuditQuestion[] {
  return RPL_SELF_AUDIT_PARTS.flatMap((part) => part.groups.flatMap((g) => g.questions));
}

// Toolkits stored before Batch W were evaluated on the old checklist (ids "rpl1.1" ...).
export const LEGACY_RPL_CHECKLIST_FIRST_ITEM_ID = 'rpl1.1';
