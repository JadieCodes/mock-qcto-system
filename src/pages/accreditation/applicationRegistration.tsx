import React, { useMemo, useState } from 'react';
import type { ApplicationForm, ApplicationType, FormAnswers, FlatAnswers  } from '@/types';

/* ============================================================================
 * TYPES
 * ----------------------------------------------------------------------------
 * These replace the old ApplicationForm / ApplicationType / ApplicantInfo /
 * AccreditationDocument shapes from '@/types'. The old model (fullName,
 * idNumber, qualification, documents[]) can't hold 5 genuinely different
 * question sets, so it's now { applicationType, answers }. If '@/types'
 * exports these elsewhere in your app, update that module to match instead
 * of keeping two definitions — but this file works standalone either way.
 * ========================================================================= */



const applicationTypes: { value: ApplicationType; label: string; description: string }[] = [
  {
    value: 'OC',
    label: 'OC — Occupational Qualifications & Part Qualifications',
    description: 'Apply as a Skills Development Provider for an Occupational Qualification or Part Qualification.',
  },
  {
    value: 'SP',
    label: 'SP — Skills Programme',
    description: 'Apply as a Skills Development Provider for an Occupational Skills Programme.',
  },
  {
    value: 'N4-N6',
    label: 'N4 – N6 — NATED Programme',
    description: 'Apply as a Skills Development Provider for a NATED (N4–N6) programme.',
  },
  {
    value: 'AC',
    label: 'AC — Assessment / Trade Test Centre Accreditation',
    description: 'Apply for Assessment Centre and Trade Test Centre accreditation.',
  },
  {
    value: 'Permission',
    label: 'Permission — Temporary Training/Assessment Site Approval',
    description: 'Request temporary approval to train or assess at a site other than your accredited venue.',
  },
];

type Region =
  | 'Gauteng'
  | 'Western Cape'
  | 'KwaZulu-Natal'
  | 'Eastern Cape'
  | 'Free State'
  | 'Mpumalanga'
  | 'Limpopo'
  | 'North West'
  | 'Northern Cape';

const regions: Region[] = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Mpumalanga',
  'Limpopo',
  'North West',
  'Northern Cape',
];

type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'url'
  | 'date'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox-group'; // multiple checkboxes, value is string[]

interface FieldOption {
  value: string;
  label: string;
}

/** A single question. `id` must be unique within the section / repeat template it lives in. */
export interface FieldSchema  {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: FieldOption[];
  fullWidth?: boolean;
  /** Only show this field if another field in the same scope has this value. */
  showIf?: { fieldId: string; equals: string | string[] };
}

/** A plain group of fields, rendered once, under a heading. */
interface SectionSchema {
  kind: 'section';
  id: string;
  title: string;
  description?: string;
  fields: FieldSchema[];
}

/**
 * A block the applicant can repeat, e.g. "Details of Occupational Skills
 * Programme" which the source form allows up to 5 times (SP1..SP5). The
 * renderer shows `minItems` copies up front, then an "Add another
 * {itemLabel}" control until `maxItems` is reached.
 */
interface RepeatableGroupSchema {
  kind: 'repeatable';
  id: string;
  title: string;
  itemLabel: string;
  description?: string;
  minItems: number;
  maxItems: number;
  fields: FieldSchema[];
}

/** A long "select every item that is true" declaration/checklist block. */
interface DeclarationChecklistSchema {
  kind: 'checklist';
  id: string;
  title: string;
  description?: string;
  items: string[];
}

type FormBlock = SectionSchema | RepeatableGroupSchema | DeclarationChecklistSchema;

export interface ApplicationFormSchema {
  applicationType: ApplicationType;
  formTitle: string;
  formDescription?: string;
  blocks: FormBlock[];
}

/**
 * Answers are a flat bag keyed by field id, EXCEPT repeatable groups, which
 * are an array of per-item answer bags under the group's own id:
 *
 *   values: { tradingName: 'Acme Training', region: 'Gauteng', siteDeclaration: ['0','1','4'] }
 *   repeats: { skillsProgrammes: [{ title: '...', nqfLevel: '3' }, { ... }] }
 */



/**
 * A submitted application. There is no uploaded PDF/DOCX any more — the
 * document itself is filled in on the platform via `answers`.
 */

/**
 * The pre-submit "gate check". This used to run against the uploaded
 * application-form file; now that the form is filled in on the system
 * instead of uploaded, it runs against the completed `answers` for the
 * chosen schema. The Submit button stays disabled until this passes.
 */
type GateCheckStatus = 'idle' | 'processing' | 'passed' | 'failed';

type ValidationCheck = {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'passed' | 'failed';
  message?: string;
};

/* ============================================================================
 * SHARED OPTION LISTS + CHECKLISTS
 * ----------------------------------------------------------------------------
 * Pulled out once because they're reused by more than one of the 5 schemas
 * below — avoids the same 44-item checklist drifting apart in 3 places.
 * ========================================================================= */

const nqfLevelOptions: FieldOption[] = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `NQF Level ${i + 1}`,
}));

const titleOptions: FieldOption[] = [
  { value: 'Mr', label: 'Mr' },
  { value: 'Mrs', label: 'Mrs' },
  { value: 'Ms', label: 'Ms' },
  { value: 'Dr', label: 'Dr' },
  { value: 'Prof', label: 'Prof' },
];

const provinceOptions: FieldOption[] = regions.map((r) => ({ value: r, label: r }));

const employmentTypeOptions: FieldOption[] = [
  { value: 'full_time', label: 'Full Time (Long Term Contract 2 years or more)' },
  { value: 'part_time', label: 'Part Time (Short Term Contract less than 2 years)' },
];

const institutionTypeOptionsWithUniversity: FieldOption[] = [
  { value: 'private', label: 'Private Institution (Entity) (02)' },
  { value: 'public', label: 'Public Institution (Government Entity) (01)' },
  { value: 'cet', label: 'Community Education and Training (CET, CLC) (01)' },
  { value: 'tvet', label: 'Technical and Vocational Education and Training (TVET) (01)' },
  { value: 'employer', label: 'Employer Organisation (02)' },
  { value: 'university', label: 'Universities or University of Technology (01)' },
];

/** N4-N6 form omits the "Universities" option that the others include. */
const institutionTypeOptionsNoUniversity: FieldOption[] = institutionTypeOptionsWithUniversity.filter(
  (o) => o.value !== 'university'
);

const existingAccreditationOptions: FieldOption[] = [
  { value: 'not_accredited', label: 'Not Currently Accredited' },
  { value: 'accredited', label: 'Currently Accredited By QCTO' },
  { value: 'accredited_usi', label: 'Currently Accredited By QCTO with Unique Site Identifier (USI)' },
];

const modeOfDeliveryOptions: FieldOption[] = [
  { value: 'face_to_face', label: 'Face-to-Face (Traditional Classroom Learning)' },
  { value: 'hybrid', label: 'Hybrid / Blended' },
  { value: 'mobile_units', label: 'Mobile Units' },
  { value: 'simulated', label: 'Simulated Delivery (e.g., labs, mockup, virtual simulations, case studies, role-play)' },
];

const knowledgeModuleImplementationOptions: FieldOption[] = [
  { value: 'above_address', label: 'Will be provided at the above physical address.' },
  { value: 'other_address_known', label: 'Will be provided at other physical addresses (Address Known, MoU or SLA in place).' },
  {
    value: 'other_address_unknown',
    label: 'Will be provided at other physical addresses (Address Not yet Known or no MoU or SLA). NB: MoU or SLA will be required as evidence.',
  },
  { value: 'e_learning', label: 'To be provided using multi-modal remote learning systems (e-learning).' },
  { value: 'has_resources', label: 'The institution has all relevant physical resources for the implementation of all Knowledge Modules.' },
  {
    value: 'has_material',
    label: 'The institution has identified Learning Material to cover all Modules. NB: Proof of Learner Support (Learning Material Matrix) will be required as evidence.',
  },
];

const practicalModuleImplementationOptions: FieldOption[] = [
  { value: 'above_address', label: 'Will be provided at the above physical address.' },
  {
    value: 'other_address_known',
    label: 'Will be provided at other physical addresses (Address Known, MoU or SLA in place). NB: MoU or SLA will be required as evidence.',
  },
  { value: 'other_address_unknown', label: 'Will be provided at other physical addresses (Address Not yet Known or no MoU or SLA).' },
  { value: 'has_resources', label: 'The institution has all relevant physical resources for the implementation of all Practical Modules.' },
  { value: 'e_learning', label: 'To be provided using multi-modal remote learning systems (e-learning).' },
];

const workPlaceModuleImplementationOptions: FieldOption[] = [
  { value: 'not_applicable', label: 'Not applicable for this qualification / programme.' },
  { value: 'above_address', label: 'Will be provided at the above physical address.' },
  {
    value: 'other_address_known',
    label: 'Will be provided at other physical addresses (Address Known, MoU or SLA in place). NB: MoU or SLA will be required as evidence.',
  },
];

const assessmentModeOptions: FieldOption[] = [
  { value: 'face_to_face', label: 'Face-to-Face (Traditional Classroom Assessment)' },
  { value: 'hybrid', label: 'Hybrid / Blended Assessment' },
  { value: 'mobile_units', label: 'Mobile Units Assessment' },
  { value: 'simulated', label: 'Simulated Delivery (e.g., labs, mockup, virtual simulations, case studies, role-play) Assessment' },
];

const declareWithOptions: FieldOption[] = [
  { value: 'sa_id', label: 'South African Identity Number' },
  { value: 'passport', label: 'Passport Number' },
];

/** Shared 44-item checklist used verbatim by both the SP and OC source documents. */
const checklistSDP44: string[] = [
  'The environment is conducive to teaching and learning (clean / lighting / ventilation / equipment / furniture / learning material, etc).',
  'Evidence of OHS is available and valid: signage, evacuation plans, OHS signs, valid OHS verification.',
  'We shall ensure that CVs of all facilitators indicating relevant experience in a particular subject area are available.',
  'We shall ensure that all Facilitators are qualified for subjects that they are facilitating.',
  'We shall ensure that all Assessors are qualified for subjects that they are assessing.',
  'We shall ensure that all Moderators are qualified for subjects that they are moderating.',
  'We shall ensure that Timetables for learners are available.',
  'We shall ensure that Timetables for facilitators are available.',
  'We shall ensure that Planning and scheduling of assessments are available and QCTO is notified on time.',
  'We shall ensure that Documents are in Place to guide employees to comply with QCTO Quality Assurance & Certification requirements.',
  'We shall ensure that Learner Management System (LMS) in Place.',
  'We shall ensure that Available LMS can generate learner retention rates reports.',
  'We shall ensure that Available LMS can generate learner attainments reports.',
  'We shall ensure that Available LMS can generate learner attendance and learner details/ratio.',
  'We shall ensure that Documentation is in Place to guide employees on Quality Assurance and Learner Confidentiality.',
  'We shall ensure that Documentation is in Place to guide employees on Assessments and Moderation.',
  'We shall ensure that Documents are in Place to guide learners and employees on Learner Appeals.',
  'We shall ensure that Documents are in Place to guide employees and learners on Learner Health, Safety & Liabilities.',
  'We shall ensure that Documents are in Place to support Disabled and other vulnerable learners.',
  'We shall ensure that the prospectus and Marketing Materials are available.',
  'We shall ensure that Documents are in Place to guide employees and learners on cooperation with Practical Venues and Workplace.',
  'We shall ensure that employees and learners comply with the Trade Test regulation and other regulations where applicable.',
  'We shall ensure that Documents are in Place to encourage and support Facilitator/Assessor Continuous Professional Development (CPD).',
  'We shall ensure that Documents are in Place to guide employees and learners on additional Learning for struggling learners.',
  'We shall ensure that Documents are in Place to guide employees and learners on Recognition of Prior Learning (RPL).',
  'We shall ensure that Documents are in Place to guide employees and learners on finding additional learning resources online and offline.',
  'We shall ensure that Documents are in Place to guide employees and learners on Career guidance, Progression and Articulation.',
  'We shall ensure that Documents are in Place to ensure availability of equipment and consumables.',
  'We shall ensure that Documents are in Place to ensure availability of facilitators/assessors.',
  'We shall ensure that Documents are in Place to guide employees and learners on Teaching and Learning. (for SDP only)',
  'We shall ensure that Documents are in Place to guide employees and learners on Learner Induction and Support.',
  'We shall ensure that Documents are in Place to guide Learners and employees on a compulsory learner reflection and recording of workplace progress e.g. Logbook.',
  'We shall ensure that all learners are enrolled with QCTO within 21 days.',
  'We shall ensure that Signed enrollment forms are available for each learner.',
  'We shall ensure that Certified copies of IDs are on file and available for each learner.',
  'We shall ensure that: for foreign learners, certified copies of passport, and study permits are available for each learner.',
  "We shall ensure that Certified copies of learner's highest qualification is kept for each learner.",
  'We shall ensure that All learners have satisfied entrance requirements for each qualification.',
  'We shall ensure that Evidence of learner orientation and learner support throughout the programme is available.',
  'We shall ensure that Evidence that facilitators are prepared for each class (e.g. facilitator file, presentations, etc.) is available.',
  'We shall ensure that all learners supported for Work Integrated Learning and their learning reports (Logbooks) are reviewed and approved by the SDP.',
  'We shall ensure that the SDP interacts frequently with the workplace providing Work Integrated Learning.',
  'We shall ensure that Multi-modal remote learning systems are implemented and a reasonable level of support to enrolled learners is provided.',
  'We shall ensure that we comply with the latest QCTO policies and guidelines as published at https://www.qcto.org.za/publications/policies.',
];

/** 39-item checklist used by the Assessment Centre / Trade Test Centre form. */
const checklistAC39: string[] = [
  'The environment is conducive to Assessment/Testing (clean / lighting / ventilation / equipment / furniture / learning material, etc).',
  'Evidence of OHS is available and valid: signage, evacuation plans, OHS signs, valid OHS verification.',
  'We shall ensure that CVs of all facilitators indicating relevant experience in a particular subject area are available.',
  'We shall ensure that all Facilitators are qualified for the Occupations/Trades that they are facilitating.',
  'We shall ensure that all Assessors are qualified for the Occupations/Trades that they are assessing.',
  'We shall ensure that all Moderators are qualified for the Occupations/Trades that they are moderating.',
  'We shall ensure that Timetables for learners are available.',
  'We shall ensure that Timetables for facilitators are available.',
  'We shall ensure that Planning and scheduling of Assessments/Testing are available and QCTO is notified on time.',
  'We shall ensure that Documents are in Place to guide employees to comply with QCTO Quality Assurance & Certification requirements.',
  'We shall ensure that Learner Management System (LMS) in Place.',
  'We shall ensure that Available LMS can generate learner retention rates reports.',
  'We shall ensure that Available LMS can generate learner attainments reports.',
  'We shall ensure that Available LMS can generate learner attendance and learner details/ratio.',
  'We shall ensure that Documentation is in Place to guide employees on Quality Assurance and Learner Confidentiality.',
  'We shall ensure that Documentation is in Place to guide employees on Assessments and Moderation.',
  'We shall ensure that Documents are in Place to guide learners and employees on Learner Appeals.',
  'We shall ensure that Documents are in Place to guide employees and learners on Learner Health, Safety & Liabilities.',
  'We shall ensure that Documents are in Place to support Disabled and other vulnerable learners.',
  'We shall ensure that the prospectus and Marketing Materials are available.',
  'We shall ensure that Documents are in Place to guide employees and learners on cooperation with Practical Venues and Workplace.',
  'We shall ensure that employees and learners comply with the Trade Test regulation and other regulations where applicable.',
  'We shall ensure that Documents are in Place to encourage and support Facilitator/Assessor Continuous Professional Development (CPD).',
  'We shall ensure that Documents are in Place to guide employees and learners on additional Learning for struggling learners.',
  'We shall ensure that Documents are in Place to guide employees and learners on Recognition of Prior Learning (RPL).',
  'We shall ensure that Documents are in Place to guide employees and learners on finding additional learning resources online and offline.',
  'We shall ensure that Documents are in Place to guide employees and learners on Career guidance, Progression and Articulation.',
  'We shall ensure that Documents are in Place to ensure availability of equipment and consumables.',
  'We shall ensure that Documents are in Place to ensure availability of facilitators/assessors.',
  'We shall ensure that Documents are in Place to guide employees and learners on Learner Induction and Support.',
  'We shall ensure that Documents are in Place to guide Learners and employees on a compulsory learner reflection and recording of workplace progress e.g. Logbook.',
  'We shall ensure that Certified copies of IDs are on file and available for each learner.',
  'We shall ensure that: for foreign learners, certified copies of passport, and study permits are available for each learner.',
  "We shall ensure that Certified copies of learner's highest qualification is kept for each learner.",
  'We shall ensure that All learners have satisfied entrance requirements for each Occupation/Trade.',
  'We shall ensure that Evidence of learner orientation and learner support throughout the Assessment/Test is available.',
  'We shall ensure that Evidence that facilitators are prepared for each Assessment/Test is available.',
  'We shall ensure that Multi-modal remote learning systems are implemented and a reasonable level of support to learners is provided where applicable.',
  'We shall ensure that we comply with the latest QCTO policies and guidelines as published at https://www.qcto.org.za/publications/policies.',
];

/** 46-item checklist used by the NATED (N4-N6) form — includes LMIS and Armed Response items unique to it. */
const checklistN4N6_46: string[] = [
  'The environment is conducive to teaching and learning (clean / lighting / ventilation / equipment / furniture / learning material, etc).',
  'Evidence of OHS is available and valid: signage, evacuation plans, OHS signs, valid OHS verification.',
  'We shall ensure that CVs of all facilitators indicating relevant experience in a particular subject area are available.',
  'We shall ensure that all Facilitators are qualified for subjects that they are facilitating.',
  'We shall ensure that all Assessors are qualified for subjects that they are assessing.',
  'We shall ensure that all Moderators are qualified for subjects that they are moderating.',
  'We shall ensure that Timetables for learners are available.',
  'We shall ensure that Timetables for facilitators are available.',
  'We shall ensure that Planning and scheduling of assessments are available and QCTO is notified on time.',
  'We shall ensure that Documents are in Place to guide employees to comply with QCTO Quality Assurance & Certification requirements.',
  'We shall ensure that Learner Management System (LMS) in Place.',
  'We shall ensure that Available LMS can generate learner retention rates reports.',
  'We shall ensure that Available LMS can generate learner attainments reports.',
  'We shall ensure that Available LMS can generate learner attendance and learner details/ratio.',
  'We shall ensure that Documentation is in Place to guide employees on Quality Assurance and Learner Confidentiality.',
  'We shall ensure that Documentation is in Place to guide employees on Assessments and Moderation.',
  'We shall ensure that Documents are in Place to guide learners and employees on Learner Appeals.',
  'We shall ensure that Documents are in Place to guide employees and learners on Learner Health, Safety & Liabilities.',
  'We shall ensure that Documents are in Place to support Disabled and other vulnerable learners.',
  'We shall ensure that the prospectus and Marketing Materials are available.',
  'We shall ensure that Documents are in Place to guide employees and learners on cooperation with Practical Venues and Workplace.',
  'We shall ensure that employees and learners comply with the Trade Test regulation and other regulations where applicable.',
  'We shall ensure that Documents are in Place to encourage and support Facilitator/Assessor Continuous Professional Development (CPD).',
  'We shall ensure that Documents are in Place to guide employees and learners on additional Learning for struggling learners.',
  'We shall ensure that Documents are in Place to guide employees and learners on Recognition of Prior Learning (RPL).',
  'We shall ensure that Documents are in Place to guide employees and learners on finding additional learning resources online and offline.',
  'We shall ensure that Documents are in Place to guide employees and learners on Career guidance, Progression and Articulation.',
  'We shall ensure that Documents are in Place to ensure availability of equipment and consumables.',
  'We shall ensure that Documents are in Place to ensure availability of facilitators/assessors.',
  'We shall ensure that Documents are in Place to guide employees and learners on Teaching and Learning. (for SDP only)',
  'We shall ensure that Documents are in Place to guide employees and learners on Learner Induction and Support.',
  'We shall ensure that Documents are in Place to guide Learners and employees on a compulsory learner reflection and recording of workplace progress e.g. Logbook.',
  'We shall ensure that the safe/strong room is in place.',
  'We shall ensure that Signed enrollment forms are available for each learner.',
  'We shall ensure that Certified copies of IDs are on file and available for each learner.',
  'We shall ensure that: for foreign learners, certified copies of passport, and study permits are available for each learner.',
  "We shall ensure that Certified copies of learner's highest qualification is kept for each learner.",
  'We shall ensure that All learners have satisfied entrance requirements for each qualification.',
  'We shall ensure that Evidence of learner orientation and learner support throughout the programme is available.',
  'We shall ensure that Evidence that facilitators are prepared for each class (e.g. facilitator file, presentations, etc.) is available.',
  'We shall ensure that all learners supported for Work Integrated Learning and their learning reports (Logbooks) are reviewed and approved by the SDP.',
  'We shall ensure that the SDP interacts frequently with the workplace providing Work Integrated Learning.',
  'We shall ensure that Multi-modal remote learning systems are implemented and a reasonable level of support to enrolled learners is provided.',
  'We shall ensure that we comply with the latest QCTO policies and guidelines as published at https://www.qcto.org.za/publications/policies.',
  'We shall ensure that the LMIS is in place.',
  'We shall ensure that the Armed Response Security is in place.',
];

/** "APPLICANT DETAILS" — institution identity + physical address block, shared by OC/SP/N4-N6/AC. */
function organisationCoreFields(opts: { includeGoogleMaps: boolean; includePostalCode: boolean }): FieldSchema[] {
  const fields: FieldSchema[] = [
    { id: 'tradingName', label: 'Trading Name of Institution (Entity)', type: 'text', required: true },
    {
      id: 'legalName',
      label: 'Legal Name of Institution',
      type: 'text',
      required: true,
      helpText:
        'To speed up processing, ensure the legal name exactly matches the establishing documents (CIPC, EMIS, LRA Gazette of relevant determination or Act). Errors may cause delays.',
    },
    { id: 'websiteAddress', label: 'Website Address of the Institution', type: 'url', placeholder: 'e.g. www.example.co.za' },
    {
      id: 'physicalAddress',
      label: 'Physical Address (one site per application)',
      type: 'textarea',
      required: true,
      fullWidth: true,
      helpText: 'A valid physical address is required as the legal domicilium citandi, even for online, hybrid, or mobile qualifications.',
    },
    { id: 'buildingNameFloor', label: 'Building Name / Floor (If Applicable)', type: 'text' },
    { id: 'townCity', label: 'Town / City', type: 'text', required: true },
    { id: 'province', label: 'Province', type: 'select', required: true, options: provinceOptions },
  ];

  if (opts.includePostalCode) {
    fields.push({
      id: 'postalCode',
      label: 'Postal Code',
      type: 'text',
      required: true,
      helpText: "Enter the correct postal code for your institution's physical address (from your municipal account or PO box).",
    });
  }

  if (opts.includeGoogleMaps) {
    fields.push({
      id: 'googleMapsLink',
      label: 'Google Maps Location Link',
      type: 'url',
      placeholder: 'e.g. https://maps.app.goo.gl/qGJwiWYckCraPV4B8',
      helpText: 'Find your physical address on Google Maps, right-click it, choose "Share this location" → "Copy link", and paste it here.',
    });
  }

  return fields;
}

/** Primary contact person fields, shared across OC/SP/N4-N6/AC. */
const contactPersonFields: FieldSchema[] = [
  { id: 'contactTitle', label: 'Title of Contact Person', type: 'select', required: true, options: titleOptions },
  { id: 'contactPosition', label: 'Position / Designation', type: 'text', required: true },
  { id: 'contactSurname', label: 'Surname of Contact Person', type: 'text', required: true },
  { id: 'contactFullNames', label: 'Full Name(s) of Contact Person', type: 'text', required: true },
  {
    id: 'contactEmail',
    label: 'Email Address of Contact Person',
    type: 'email',
    required: true,
    helpText: 'This must be a valid e-mail — all communications will come through this address.',
  },
  { id: 'contactPhoneOffice', label: 'Contact Number 1 (Office)', type: 'tel', required: true },
  { id: 'contactPhoneMobile', label: 'Contact Number 2 (Mobile)', type: 'tel' },
];

/** "Do you want to add an additional contact person?" — modelled as an optional 1-item repeat. */
const additionalContactGroup: RepeatableGroupSchema = {
  kind: 'repeatable',
  id: 'additionalContacts',
  title: 'Additional Contact Person',
  itemLabel: 'Additional Contact Person',
  minItems: 0,
  maxItems: 1,
  fields: [
    { id: 'title', label: 'Title of Additional Contact Person', type: 'select', options: titleOptions },
    { id: 'surname', label: 'Surname of Additional Contact Person', type: 'text' },
    { id: 'fullNames', label: 'Full Name(s) of Additional Contact Person', type: 'text' },
    { id: 'email', label: 'Email Address of Additional Contact Person', type: 'email' },
    { id: 'phone', label: 'Contact Number of Additional Contact Person', type: 'tel' },
  ],
};

const organisationUniqueIdField: FieldSchema = {
  id: 'cipcRegistrationNumber',
  label: 'CIPC Registration Number / EMIS for TVET or CEP / (LRA Reference Number)',
  type: 'text',
  required: true,
  helpText:
    'To speed up processing, ensure the registration number exactly matches the establishing documents (CIPC, EMIS, LRA Gazette Number of relevant establishing determination or Act). Errors may cause delays.',
};

const existingAccreditationField: FieldSchema = {
  id: 'existingAccreditationStatus',
  label: 'Existing Accreditation Number (if currently accredited for any qualification)',
  type: 'radio',
  required: true,
  options: existingAccreditationOptions,
};

/** Final "I hereby confirm..." declaration — Full Name + SA ID/Passport, common to all 4 accreditation forms. */
function declarationFields(): FieldSchema[] {
  return [
    { id: 'declarantFullName', label: 'Full Names and Surname', type: 'text', required: true },
    { id: 'declareWith', label: 'I want to declare with my', type: 'radio', required: true, options: declareWithOptions },
    { id: 'declarantIdOrPassportNumber', label: 'South African Identity Number / Passport Number', type: 'text', required: true },
  ];
}

/** Accounting Officer + Board/Governing Body members — used by N4-N6 and AC only. */
function accountingOfficerAndBoardFields(): FieldSchema[] {
  return [
    { id: 'accountingOfficerName', label: 'Accounting Officer Name and Surname', type: 'text', required: true, helpText: 'e.g. CEO, Principal, Department Head, Campus Manager' },
    { id: 'accountingOfficerIdOrPassport', label: 'Accounting Officer ID/Passport Number', type: 'text', required: true },
    { id: 'accountingOfficerEmail', label: 'Accounting Officer E-mail', type: 'email', required: true },
    { id: 'board1Name', label: '1st Board / Governing Body / Accounting Authority — Member Name and Surname', type: 'text', required: true },
    { id: 'board1Id', label: '1st Board / Governing Body / Accounting Authority — Member ID or Passport Number', type: 'text', required: true },
    { id: 'board2Name', label: '2nd Board / Governing Body / Accounting Authority — Member Name and Surname (if applicable)', type: 'text' },
    { id: 'board2Id', label: '2nd Board / Governing Body / Accounting Authority — Member ID or Passport Number (if applicable)', type: 'text' },
    { id: 'board3Name', label: '3rd Board / Governing Body / Accounting Authority — Member Name and Surname (if applicable)', type: 'text' },
    { id: 'board3Id', label: '3rd Board / Governing Body / Accounting Authority — Member ID or Passport Number (if applicable)', type: 'text' },
  ];
}

/* ============================================================================
 * THE 5 SCHEMAS
 * ----------------------------------------------------------------------------
 * One object per Application Type, transcribed from the docs you uploaded.
 * This is the ONLY place you need to touch to add/reword/reorder a question
 * — nothing else in this file needs to change.
 * ========================================================================= */

// ---- OC — Occupational Qualifications & Part Qualifications ----------------

const ocQualificationTemplate: FieldSchema[] = [
  { id: 'title', label: 'Title of Occupational Qualification or Part Qualification', type: 'text', required: true },
  { id: 'qualificationId', label: 'ID of Occupational Qualification or Part Qualification', type: 'text', required: true },
  { id: 'nqfLevel', label: 'NQF Level', type: 'text', required: true, helpText: 'Confirm against https://regqs.saqa.org.za/ — an incorrect level can delay or reject your application.' },
  {
    id: 'hasHistoricalQualification',
    label: 'Do you have existing accreditation for a comparable Historical Qualification (pre-2009) in the above field of training?',
    type: 'radio',
    required: true,
    options: [
      { value: 'yes', label: 'Yes, I will submit our accredited pre-2009 Historical Qualification as part of the evidence.' },
      { value: 'no', label: 'No' },
    ],
  },
  { id: 'facilitatorName', label: 'Full Name(s) and Surname of Facilitator', type: 'text', required: true, helpText: 'Facilitator CV, certified copies of ID and valid work permits are required to comply with the Immigration Act 13 of 2002.' },
  { id: 'facilitatorEmail', label: 'E-mail Address of Facilitator', type: 'email', required: true },
  { id: 'facilitatorEmploymentType', label: 'Facilitator Employment Type by Your Institution', type: 'radio', required: true, options: employmentTypeOptions },
  { id: 'facilitatorRegistration', label: 'Facilitator Registration Number and Registration Institution', type: 'text', helpText: 'Leave blank and note "Facilitator not yet registered" if applicable.' },
  {
    id: 'wantsAssessmentCentre',
    label: 'Would you like to apply to become an Assessment Centre (AC) for this qualification?',
    type: 'radio',
    required: true,
    options: [
      { value: 'yes', label: 'Yes, this serves as our application to become an Assessment Centre.' },
      { value: 'no', label: 'No' },
    ],
  },
  { id: 'theoryModeOfDelivery', label: 'Theory Modules (KM) Mode of Delivery', type: 'radio', required: true, options: modeOfDeliveryOptions },
  { id: 'knowledgeModuleImplementation', label: 'Knowledge Modules Programme Implementation', type: 'checkbox-group', required: true, options: knowledgeModuleImplementationOptions },
  { id: 'practicalModuleImplementation', label: 'Practical Modules Programme Implementation', type: 'checkbox-group', required: true, options: practicalModuleImplementationOptions },
  { id: 'workPlaceModuleImplementation', label: 'Work Place Modules Programme Implementation', type: 'checkbox-group', required: true, options: workPlaceModuleImplementationOptions },
];

const ocSchema: ApplicationFormSchema = {
  applicationType: 'OC',
  formTitle: 'Skills Development Provider — Occupational Qualifications & Part Qualifications',
  formDescription: 'By submitting this form you agree to all QCTO Terms and Conditions as well as the QCTO PAJA, POPIA and PAIA policies.',
  blocks: [
    { kind: 'section', id: 'applicantDetails', title: 'Applicant Details', fields: [...organisationCoreFields({ includeGoogleMaps: true, includePostalCode: false }), ...contactPersonFields] },
    additionalContactGroup,
    { kind: 'section', id: 'institutionType', title: 'Type of Institution', fields: [{ id: 'institutionType', label: 'Type of Institution (Entity)', type: 'radio', required: true, options: institutionTypeOptionsWithUniversity }] },
    { kind: 'section', id: 'organisationId', title: 'Organisation Unique ID', fields: [organisationUniqueIdField] },
    { kind: 'section', id: 'existingAccreditation', title: 'Existing Accreditations', fields: [existingAccreditationField] },
    {
      kind: 'repeatable',
      id: 'qualifications',
      title: 'Details of Occupational Qualification (OQ) or Part Qualification',
      itemLabel: 'Occupational Qualification / Part Qualification',
      description: 'Your application will not be considered if there are no details of a qualified facilitator. Confirm the Qualification Title, ID and NQF Level are correct.',
      minItems: 1,
      maxItems: 5,
      fields: ocQualificationTemplate,
    },
    { kind: 'checklist', id: 'siteDeclaration', title: 'Site-Specific Programme Implementation Questionnaire and Declaration', description: 'I hereby declare that the selected items below are in place, functional and still valid for this site.', items: checklistSDP44 },
    { kind: 'section', id: 'finalDeclaration', title: 'Final Declaration', description: 'I hereby confirm and declare that I am authorised to complete this form and this form is a true reflection of the status of our institution.', fields: declarationFields() },
  ],
};

// ---- SP — Skills Programme (SP1..SP5) --------------------------------------

/** SP's practical-modules list has one extra option (e-learning) vs. OC/N4-N6. */
const spPracticalModuleImplementationOptions: FieldOption[] = [
  { value: 'above_address', label: 'Will be provided at the above physical address.' },
  { value: 'other_address_known', label: 'Will be provided at other physical addresses (Address Known, MoU or SLA in place). NB: MoU or SLA will be required as evidence.' },
  { value: 'other_address_unknown', label: 'Will be provided at other physical addresses (Address Not yet Known or no MoU or SLA).' },
  { value: 'has_resources', label: 'The institution has all relevant physical resources for the implementation of all Practical Modules/Topics.' },
  { value: 'e_learning', label: 'To be provided using multi-modal remote learning systems (e-learning).' },
];

const spSkillsProgrammeTemplate: FieldSchema[] = [
  { id: 'title', label: 'Title of Occupational Skills Programme', type: 'text', required: true },
  { id: 'programmeId', label: 'ID of Occupational Skills Programme', type: 'text', required: true, placeholder: 'e.g. SP-191210', helpText: 'Enter a valid Occupational Skills Programme ID in the format SP-191210.' },
  { id: 'nqfLevel', label: 'NQF Level', type: 'text', required: true },
  {
    id: 'hasSimilarQualification',
    label: 'Similar Qualification: Is your institution currently accredited by the QCTO for a similar qualification or part-qualification that allows for credit transfer towards this Occupational Skills Programme?',
    type: 'radio',
    required: true,
    helpText: 'Refer to the Skills Programme and Qualification document to verify alignment. Proof of accreditation will be required.',
    options: [
      { value: 'yes', label: 'Yes, we are currently accredited for a similar qualification by QCTO' },
      { value: 'no', label: 'No' },
    ],
  },
  { id: 'similarQualificationId', label: 'Similar Qualification ID', type: 'text', helpText: 'Proof of accreditation must be submitted as evidence.', showIf: { fieldId: 'hasSimilarQualification', equals: 'yes' } },
  { id: 'facilitatorName', label: 'Full Name(s) and Surname of Facilitator', type: 'text', required: true, helpText: 'Facilitator CV, certified copies of ID and valid work permits are required to comply with the Immigration Act 13 of 2002.' },
  { id: 'facilitatorEmail', label: 'E-mail Address of Facilitator', type: 'email', required: true },
  { id: 'facilitatorEmploymentType', label: 'Facilitator Employment Type by Your Institution', type: 'radio', required: true, options: employmentTypeOptions },
  { id: 'facilitatorRegistration', label: 'Facilitator Registration Number and Registration Institution', type: 'text', helpText: 'Leave blank and note "Facilitator not yet registered" if applicable.' },
  { id: 'theoryModeOfDelivery', label: 'Theory Modules (KM) Mode of Delivery', type: 'radio', required: true, options: modeOfDeliveryOptions },
  { id: 'knowledgeModuleImplementation', label: 'Knowledge Modules/Topics Programme Implementation', type: 'checkbox-group', required: true, options: knowledgeModuleImplementationOptions },
  { id: 'practicalModuleImplementation', label: 'Practical Modules/Topics Programme Implementation', type: 'checkbox-group', required: true, options: spPracticalModuleImplementationOptions },
  { id: 'workPlaceModuleImplementation', label: 'Work Place Modules/Topics Programme Implementation', type: 'checkbox-group', required: true, options: workPlaceModuleImplementationOptions },
  { id: 'assessmentMode', label: 'Planned Mode of Assessment (Final Integrated Supervised Assessment — FISA)', type: 'radio', required: true, options: assessmentModeOptions },
];

const spSchema: ApplicationFormSchema = {
  applicationType: 'SP',
  formTitle: 'Skills Development Provider — Occupational Skills Programmes',
  formDescription: 'By submitting this form you agree to all QCTO Terms and Conditions as well as the QCTO PAJA, POPIA and PAIA policies.',
  blocks: [
    { kind: 'section', id: 'applicantDetails', title: 'Applicant Details', fields: [...organisationCoreFields({ includeGoogleMaps: true, includePostalCode: false }), ...contactPersonFields] },
    additionalContactGroup,
    { kind: 'section', id: 'institutionType', title: 'Type of Institution', fields: [{ id: 'institutionType', label: 'Type of Institution (Entity)', type: 'radio', required: true, options: institutionTypeOptionsWithUniversity }] },
    { kind: 'section', id: 'organisationId', title: 'Organisation Unique ID', fields: [organisationUniqueIdField] },
    { kind: 'section', id: 'existingAccreditation', title: 'Existing Accreditations', fields: [existingAccreditationField] },
    {
      kind: 'repeatable',
      id: 'skillsProgrammes',
      title: 'Details of Occupational Skills Programme',
      itemLabel: 'Skills Programme',
      description: 'Your application will not be considered if there are no details of a qualified facilitator. Confirm the Skills Programme Title, ID and NQF Level are correct.',
      minItems: 1,
      maxItems: 5,
      fields: spSkillsProgrammeTemplate,
    },
    {
      kind: 'section',
      id: 'acknowledgements',
      title: 'Acknowledgements',
      fields: [
        {
          id: 'acknowledgements',
          label: 'We officially acknowledge that:',
          type: 'checkbox-group',
          required: true,
          fullWidth: true,
          options: [
            { value: 'notify_qcto', label: 'We will notify the QCTO of the assessment date and venue at least one week in advance.' },
            { value: 'own_expense_risk', label: 'Failure to provide timely notification may result in learners being reassessed at our own expense.' },
            { value: 'no_own_certificates', label: 'We will not issue our own certificates; all certificates will be printed and issued by the QCTO upon submission and verification of learner results.' },
            { value: 'monitoring_visits', label: 'We understand that the QCTO or the relevant SETA may conduct monitoring visits, audits, or verifications at any time to ensure compliance with applicable standards and regulations.' },
          ],
        },
      ],
    },
    { kind: 'checklist', id: 'siteDeclaration', title: 'Site-Specific Programme Implementation Questionnaire and Declaration', description: 'I hereby declare that the selected items below are in place, functional and still valid for this site.', items: checklistSDP44 },
    { kind: 'section', id: 'finalDeclaration', title: 'Final Declaration', description: 'I hereby confirm and declare that I am authorised to complete this form and this form is a true reflection of the status of our institution.', fields: declarationFields() },
  ],
};

// ---- N4-N6 — NATED --------------------------------------------------------

const n4n6ProgrammeTemplate: FieldSchema[] = [
  { id: 'title', label: 'Title of NATED (N4-N6) Qualification', type: 'text', required: true, placeholder: 'e.g. National Certificate: N4 Art and Design', helpText: 'Separate each NATED programme into its own entry.' },
  { id: 'qualificationId', label: 'ID of NATED (N4-N6) Qualification, per Programme', type: 'text', required: true },
  { id: 'nqfLevel', label: 'NQF Level', type: 'text', required: true },
  { id: 'facilitatorName', label: 'Full Name(s) and Surname of Facilitator', type: 'text', required: true, helpText: 'Facilitator CV, certified copies of ID and valid work permits are required to comply with the Immigration Act 13 of 2002.' },
  { id: 'facilitatorEmail', label: 'E-mail Address of Facilitator', type: 'email', required: true },
  { id: 'facilitatorEmploymentType', label: 'Facilitator Employment Type by Your Institution', type: 'radio', required: true, options: employmentTypeOptions },
  { id: 'facilitatorRegistration', label: 'Facilitator Registration Number and Registration Institution', type: 'text', helpText: 'Leave blank and note "Facilitator not yet registered" if applicable.' },
  { id: 'knowledgeModuleImplementation', label: 'Knowledge Modules Programme Implementation', type: 'checkbox-group', required: true, options: knowledgeModuleImplementationOptions },
  { id: 'practicalModuleImplementation', label: 'Practical Modules Programme Implementation', type: 'checkbox-group', required: true, options: practicalModuleImplementationOptions },
];

const n4n6Schema: ApplicationFormSchema = {
  applicationType: 'N4-N6',
  formTitle: 'Skills Development Provider — NATED (N4-N6)',
  formDescription: 'By submitting this form you agree to all QCTO Terms and Conditions as well as the QCTO PAJA, POPIA and PAIA policies.',
  blocks: [
    { kind: 'section', id: 'applicantDetails', title: 'Applicant Details', fields: [...organisationCoreFields({ includeGoogleMaps: true, includePostalCode: false }), ...contactPersonFields] },
    additionalContactGroup,
    {
      kind: 'section',
      id: 'institutionType',
      title: 'Type of Institution',
      fields: [
        { id: 'institutionType', label: 'Type of Institution (Entity)', type: 'radio', required: true, options: institutionTypeOptionsNoUniversity },
        {
          id: 'activeAccreditationsCount',
          label: 'Number of Active Accreditations',
          type: 'radio',
          required: true,
          options: [
            { value: '1', label: '1 Active Accreditation' },
            { value: '1-5', label: 'Between 1 and 5 Accreditations' },
            { value: '5+', label: 'Over 5 Active Accreditations' },
          ],
        },
        {
          id: 'activeAccreditationsWithLearners',
          label: 'Number of Active Accreditations with Learners Enrolled in the Past 12 Months',
          type: 'radio',
          required: true,
          options: [
            { value: 'none', label: 'No Learners Enrolled in the Past 12 Months' },
            { value: '1', label: '1 Active Accreditation with Learners Enrolled in the Past 12 Months' },
            { value: '1-5', label: 'Between 1 and 5 Accreditations with Learners Enrolled in the Past 12 Months' },
            { value: '5+', label: 'Over 5 Active Accreditations with Learners Enrolled in the Past 12 Months' },
          ],
        },
        {
          id: 'natedPhaseOutAwareness',
          label: 'Are you aware that NATED Programmes are being phased out by June 2026?',
          type: 'radio',
          required: true,
          options: [
            { value: 'aware_know_what_to_do', label: 'I am aware and know what to do after that.' },
            { value: 'aware_send_details', label: 'I am aware, please send me more details.' },
            { value: 'not_aware_send_details', label: 'I am NOT aware, please send me more details.' },
            { value: 'not_aware_no_details', label: "I am NOT aware, don't send me details." },
          ],
        },
      ],
    },
    { kind: 'section', id: 'organisationId', title: 'Organisation Unique ID', fields: [organisationUniqueIdField] },
    { kind: 'section', id: 'existingAccreditation', title: 'Existing Accreditations', fields: [existingAccreditationField] },
    {
      kind: 'repeatable',
      id: 'natedProgrammes',
      title: 'Details of NATED (N4-N6) Programme',
      itemLabel: 'NATED Programme',
      description: 'Your application will not be considered if there are no details of a qualified facilitator. Confirm the Qualification Title, ID and NQF Level via https://regqs.saqa.org.za/.',
      minItems: 1,
      maxItems: 5,
      fields: n4n6ProgrammeTemplate,
    },
    { kind: 'checklist', id: 'siteDeclaration', title: 'Site-Specific Programme Implementation Questionnaire and Declaration', description: 'I hereby declare that the selected items below are in place, functional and still valid for this site.', items: checklistN4N6_46 },
    { kind: 'section', id: 'finalDeclaration', title: 'Final Declaration', description: 'I hereby confirm and declare that I am authorised to complete this form and this form is a true reflection of the status of our institution.', fields: [...declarationFields(), ...accountingOfficerAndBoardFields()] },
  ],
};

// ---- AC — Assessment Centre / Trade Test Centre ----------------------------

const acPracticalAssessmentOptions: FieldOption[] = [
  { value: 'above_address', label: 'Will be provided at the above physical address.' },
  { value: 'other_address_known', label: 'Will be provided at other physical addresses (Address Known, MoU or SLA in place). NB: MoU or SLA will be required as evidence.' },
  { value: 'other_address_unknown', label: 'Will be provided at other physical addresses (Address Not yet Known or no MoU or SLA).' },
  { value: 'has_resources', label: 'The institution has all relevant physical resources for the implementation of all Practical Assessment/Testing for this Occupation/Trade.' },
];

const acWorkPlaceAssessmentOptions: FieldOption[] = [
  { value: 'not_applicable', label: 'Not applicable for this Occupation/Trade.' },
  { value: 'above_address', label: 'Will be provided at the above physical address.' },
  { value: 'other_address_known', label: 'Will be provided at other physical addresses (Address Known, MoU or SLA in place). NB: MoU or SLA will be required as evidence.' },
];

const acQualificationTemplate: FieldSchema[] = [
  { id: 'title', label: 'Title of Occupational Qualification, Part Qualification or Listed Trade', type: 'text', required: true },
  { id: 'qualificationId', label: 'ID of Occupational Qualification, Part Qualification or OFO for Trade', type: 'text', required: true },
  { id: 'nqfLevel', label: 'NQF Level', type: 'text', required: true, helpText: 'Confirm details via https://www.qcto.org.za/services/qualifications and https://regqs.saqa.org.za/ — incorrect details may delay or reject the application.' },
  { id: 'assessorName', label: 'Full Name(s) and Surname of Assessor', type: 'text', required: true, helpText: 'Assessor CV, certified copies of ID and valid work permits are required to comply with the Immigration Act 13 of 2002.' },
  { id: 'assessorEmail', label: 'E-mail Address of Assessor', type: 'email', required: true },
  { id: 'assessorEmploymentType', label: 'Assessor Employment Type by Your Institution', type: 'radio', required: true, options: employmentTypeOptions },
  { id: 'assessorRegistration', label: 'Assessor Registration Number and Registration Institution', type: 'text', helpText: 'Leave blank and note "Assessor not yet registered" if applicable.' },
  { id: 'practicalAssessmentImplementation', label: 'Practical Assessment/Trade Test Implementation for Qualification', type: 'checkbox-group', required: true, options: acPracticalAssessmentOptions },
  { id: 'workPlaceAssessmentImplementation', label: 'Work Place Assessment/Testing Implementation for Qualification', type: 'checkbox-group', required: true, options: acWorkPlaceAssessmentOptions },
];

const acSchema: ApplicationFormSchema = {
  applicationType: 'AC',
  formTitle: 'Assessment Centre and Trade Test Centre Accreditation Application',
  formDescription: 'By submitting this form you agree to all QCTO Terms and Conditions as well as the QCTO PAJA, POPIA and PAIA policies.',
  blocks: [
    { kind: 'section', id: 'applicantDetails', title: 'Applicant Details', fields: [...organisationCoreFields({ includeGoogleMaps: false, includePostalCode: true }), ...contactPersonFields] },
    additionalContactGroup,
    { kind: 'section', id: 'institutionType', title: 'Type of Institution', fields: [{ id: 'institutionType', label: 'Type of Institution (Entity)', type: 'radio', required: true, options: institutionTypeOptionsWithUniversity }] },
    { kind: 'section', id: 'organisationId', title: 'Private Institution / Employer Organisation', fields: [organisationUniqueIdField] },
    {
      kind: 'repeatable',
      id: 'qualifications',
      title: 'Details of Occupational Qualification (OQ), Part Qualification or Historically Listed Trade',
      itemLabel: 'Occupational Qualification / Trade',
      description: 'Your application will not be considered if there are no details of a qualified Assessor.',
      minItems: 1,
      maxItems: 5,
      fields: acQualificationTemplate,
    },
    { kind: 'checklist', id: 'siteDeclaration', title: 'Site-Specific Programme Implementation Questionnaire and Declaration', description: 'I hereby declare that the selected items below are in place, functional and still valid for this site.', items: checklistAC39 },
    { kind: 'section', id: 'finalDeclaration', title: 'Final Declaration', description: 'I hereby confirm and declare that I am authorised to complete this form and this form is a true reflection of the status of our institution.', fields: [...declarationFields(), ...accountingOfficerAndBoardFields()] },
  ],
};

// ---- Permission — Temporary Training/Assessment Site Approval --------------
// NOTE: this source doc is a Google-Forms export whose dropdowns ("Select
// your answer") lost their option lists in the conversion — Applicant
// Capacity and Original Accreditation Issued By below are reasonable
// placeholders, flagged inline. Confirm the real lists with QCTO before
// shipping. The doc's numbering also stops abruptly at Q20 with no
// signature section, which may mean a later page didn't survive the export.

const permissionSchema: ApplicationFormSchema = {
  applicationType: 'Permission',
  formTitle: 'Application for Temporary Training/Assessment Site Approval',
  formDescription:
    'Accredited providers can use this form to request QCTO permission to offer training at a different site from the originally accredited venue. Approval is temporary and valid for a maximum of 12 months. Submission confirms your acceptance of all QCTO Terms and Conditions, including the PAJA, POPIA and PAIA policies.',
  blocks: [
    {
      kind: 'section',
      id: 'applicant',
      title: 'Applicant Details',
      fields: [
        { id: 'applicantTitle', label: 'Applicant Title', type: 'select', required: true, options: titleOptions },
        { id: 'applicantSurname', label: 'Applicant Surname', type: 'text', required: true },
        { id: 'applicantNames', label: 'Applicant Name(s)', type: 'text', required: true },
        {
          id: 'applicantCapacity',
          label: 'Applicant Capacity',
          type: 'select',
          required: true,
          helpText: 'Placeholder options — confirm the exact list QCTO expects.',
          options: [
            { value: 'owner', label: 'Owner' },
            { value: 'director', label: 'Director' },
            { value: 'principal', label: 'Principal' },
            { value: 'campus_manager', label: 'Campus Manager' },
            { value: 'compliance_officer', label: 'Compliance / Quality Officer' },
            { value: 'other', label: 'Other' },
          ],
        },
      ],
    },
    {
      kind: 'section',
      id: 'accreditation',
      title: 'Existing Accreditation',
      fields: [
        { id: 'accreditationNumber', label: 'Accreditation Number', type: 'text', required: true, helpText: 'Accreditation evidence must be submitted to the QCTO.' },
        { id: 'existingUsi', label: 'Existing Unique Site Identifier (USI)', type: 'text', helpText: 'Effective July 2025, the USI is included on all accreditations and serves as the permanent identification number for your site. Capture it exactly as displayed.' },
        { id: 'accreditationEndDate', label: 'Accreditation End Date', type: 'date', required: true },
        {
          id: 'originalAccreditationIssuedBy',
          label: 'Original Accreditation Issued By',
          type: 'select',
          required: true,
          helpText: 'Placeholder options — confirm the exact list QCTO expects.',
          options: [
            { value: 'qcto', label: 'QCTO' },
            { value: 'seta', label: 'SETA' },
            { value: 'legacy_etqa', label: 'Legacy ETQA' },
            { value: 'other', label: 'Other' },
          ],
        },
      ],
    },
    {
      kind: 'section',
      id: 'institution',
      title: 'Institution Details',
      fields: [
        { id: 'tradingName', label: 'Trading Name of Institution (Entity)', type: 'text', required: true },
        { id: 'legalName', label: 'Legal Name of Institution', type: 'text', required: true, helpText: 'As per CIPC or Establishing Act for Public Entities.' },
        {
          id: 'cipcRegistrationNumber',
          label: 'CIPC Registration Number / EMIS for TVET or CEP / (LRA Reference Number)',
          type: 'text',
          required: true,
          helpText: 'To speed up processing, ensure the registration number exactly matches the establishing documents. Errors may cause delays.',
        },
      ],
    },
    {
      kind: 'section',
      id: 'accreditedSite',
      title: 'Accredited Site (Original Venue)',
      fields: [
        { id: 'accreditedPhysicalAddress', label: 'Accredited Physical Address', type: 'textarea', required: true, fullWidth: true },
        { id: 'buildingNameFloor', label: 'Building Name / Floor (If Applicable)', type: 'text' },
        { id: 'townCity', label: 'Town / City', type: 'text', required: true },
        { id: 'province', label: 'Province', type: 'select', required: true, options: provinceOptions },
        {
          id: 'googleMapsLink',
          label: 'Accredited Address Google Maps Location Link',
          type: 'url',
          placeholder: 'e.g. https://maps.app.goo.gl/qGJwiWYckCraPV4B8',
          helpText: 'Find your location on Google Maps, right-click it, choose "Share this location" → "Copy link", and paste it here.',
        },
      ],
    },
    {
      kind: 'section',
      id: 'qualification',
      title: 'Qualification / Programme to Be Trained',
      fields: [
        {
          id: 'qualificationTitle',
          label: 'Title of Qualification/Programme to Be Trained',
          type: 'text',
          required: true,
          helpText: 'Refer to the QCTO or SAQA website to confirm the official title. Incorrect information, or information for more than one qualification, will lead to rejection.',
        },
        {
          id: 'qualificationId',
          label: 'ID of Qualification/Programme to Be Trained',
          type: 'text',
          required: true,
          helpText: 'Refer to the QCTO or SAQA website to confirm the official ID. Incorrect information, or information for more than one qualification, will lead to rejection.',
        },
        { id: 'nqfLevel', label: 'NQF Level', type: 'select', required: true, options: nqfLevelOptions },
        { id: 'lastEnrollmentDate', label: 'Last Date of Enrollment for Qualification/Programme to Be Trained', type: 'date', required: true },
      ],
    },
  ],
};

/** One place to look up "which digital document goes with this Application Type?" */
export const applicationSchemas: Record<ApplicationType, ApplicationFormSchema> = {
  OC: ocSchema,
  SP: spSchema,
  'N4-N6': n4n6Schema,
  AC: acSchema,
  Permission: permissionSchema,
};

/* ============================================================================
 * FORM HELPERS (init / validate)
 * ========================================================================= */

/** Build a fresh, empty answers object for a schema — repeatable groups start with `minItems` blank rows. */
function initAnswers(schema: ApplicationFormSchema): FormAnswers {
  const answers: FormAnswers = { values: {}, repeats: {} };
  for (const block of schema.blocks) {
    if (block.kind === 'repeatable') {
      answers.repeats[block.id] = Array.from({ length: block.minItems }, () => ({}));
    }
  }
  return answers;
}

function isFieldVisibleIn(field: FieldSchema, scope: FlatAnswers): boolean {
  if (!field.showIf) return true;
  const actual = scope[field.showIf.fieldId];
  const expected = field.showIf.equals;
  if (Array.isArray(expected)) return typeof actual === 'string' && expected.includes(actual);
  return actual === expected;
}

function isEmptyValue(value: string | string[] | undefined): boolean {
  if (value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  return value.trim().length === 0;
}

/**
 * Required-field validation across the whole schema. Section/top-level
 * errors are keyed by `fieldId`; repeat-group errors are keyed by
 * `${groupId}.${itemIndex}.${fieldId}` so they can be shown next to the
 * right row. Checklist blocks are declarations, not force-required.
 */
function validateAnswers(schema: ApplicationFormSchema, answers: FormAnswers): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const block of schema.blocks) {
    if (block.kind === 'section') {
      for (const field of block.fields) {
        if (field.required && isFieldVisibleIn(field, answers.values) && isEmptyValue(answers.values[field.id])) {
          errors[field.id] = `${field.label.replace(/\s*\*$/, '')} is required`;
        }
      }
    }

    if (block.kind === 'repeatable') {
      const items = answers.repeats[block.id] || [];
      items.forEach((item, index) => {
        for (const field of block.fields) {
          if (field.required && isFieldVisibleIn(field, item) && isEmptyValue(item[field.id])) {
            errors[`${block.id}.${index}.${field.id}`] = `${field.label.replace(/\s*\*$/, '')} is required`;
          }
        }
      });
    }
  }

  return errors;
}

/* ============================================================================
 * FIELD / SECTION RENDERING
 * ========================================================================= */

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';

function Field({
  field,
  value,
  error,
  onChange,
}: {
  field: FieldSchema;
  value: string | string[] | undefined;
  error?: string;
  onChange: (value: string | string[]) => void;
}) {
  const label = (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {field.label}
      {field.required ? ' *' : ''}
    </label>
  );
  const help = field.helpText ? <p className="mt-1 text-xs text-gray-500">{field.helpText}</p> : null;
  const errorMsg = error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null;
  const wrapperClass = field.fullWidth ? 'col-span-1 md:col-span-2' : '';

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'url':
    case 'date':
      return (
        <div className={wrapperClass}>
          {label}
          <input
            type={field.type}
            value={(value as string) || ''}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
          {help}
          {errorMsg}
        </div>
      );

    case 'textarea':
      return (
        <div className={wrapperClass}>
          {label}
          <textarea
            value={(value as string) || ''}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className={inputClass}
          />
          {help}
          {errorMsg}
        </div>
      );

    case 'select':
      return (
        <div className={wrapperClass}>
          {label}
          <select value={(value as string) || ''} onChange={(e) => onChange(e.target.value)} className={inputClass}>
            <option value="">Select an option</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {help}
          {errorMsg}
        </div>
      );

    case 'radio':
      return (
        <div className={`${wrapperClass} ${field.options && field.options.length > 3 ? 'col-span-1 md:col-span-2' : ''}`}>
          {label}
          <div className="space-y-2 mt-1">
            {field.options?.map((opt) => (
              <label key={opt.value} className="flex items-start gap-2 text-sm text-gray-700">
                <input type="radio" name={field.id} checked={value === opt.value} onChange={() => onChange(opt.value)} className="mt-1" />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          {help}
          {errorMsg}
        </div>
      );

    case 'checkbox-group': {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="col-span-1 md:col-span-2">
          {label}
          <div className="space-y-2 mt-1 border border-gray-200 rounded-md p-3 bg-gray-50">
            {field.options?.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onChange(checked ? selected.filter((v) => v !== opt.value) : [...selected, opt.value])}
                    className="mt-1"
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
          {help}
          {errorMsg}
        </div>
      );
    }

    default:
      return null;
  }
}

function DynamicFormRenderer({
  schema,
  answers,
  errors,
  onChangeValue,
  onChangeRepeatValue,
  onAddRepeatItem,
  onRemoveRepeatItem,
  onToggleChecklistItem,
}: {
  schema: ApplicationFormSchema;
  answers: FormAnswers;
  errors: Record<string, string>;
  onChangeValue: (fieldId: string, value: string | string[]) => void;
  onChangeRepeatValue: (groupId: string, itemIndex: number, fieldId: string, value: string | string[]) => void;
  onAddRepeatItem: (groupId: string) => void;
  onRemoveRepeatItem: (groupId: string, itemIndex: number) => void;
  onToggleChecklistItem: (checklistId: string, itemIndex: number) => void;
}) {
  return (
    <div className="space-y-8">
      {schema.blocks.map((block) => {
        if (block.kind === 'section') {
          return (
            <section key={block.id} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{block.title}</h3>
                {block.description && <p className="text-sm text-gray-500 mt-1">{block.description}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {block.fields
                  .filter((f) => isFieldVisibleIn(f, answers.values))
                  .map((field) => (
                    <Field
                      key={field.id}
                      field={field}
                      value={answers.values[field.id]}
                      error={errors[field.id]}
                      onChange={(value) => onChangeValue(field.id, value)}
                    />
                  ))}
              </div>
            </section>
          );
        }

        if (block.kind === 'repeatable') {
          const items = answers.repeats[block.id] || [];
          return (
            <section key={block.id} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{block.title}</h3>
                {block.description && <p className="text-sm text-gray-500 mt-1">{block.description}</p>}
              </div>

              {items.map((item, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-blue-700">
                      {block.itemLabel} {items.length > 1 ? `#${index + 1}` : ''}
                    </h4>
                    {index >= block.minItems && (
                      <button type="button" onClick={() => onRemoveRepeatItem(block.id, index)} className="text-sm font-medium text-red-600 hover:text-red-700">
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {block.fields
                      .filter((f) => isFieldVisibleIn(f, item))
                      .map((field) => (
                        <Field
                          key={field.id}
                          field={field}
                          value={item[field.id]}
                          error={errors[`${block.id}.${index}.${field.id}`]}
                          onChange={(value) => onChangeRepeatValue(block.id, index, field.id, value)}
                        />
                      ))}
                  </div>
                </div>
              ))}

              {items.length < block.maxItems && (
                <button
                  type="button"
                  onClick={() => onAddRepeatItem(block.id)}
                  className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  + Add another {block.itemLabel} ({items.length}/{block.maxItems})
                </button>
              )}
            </section>
          );
        }

        if (block.kind === 'checklist') {
          const selected = (answers.values[block.id] as string[]) || [];
          return (
            <section key={block.id} className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{block.title}</h3>
                {block.description && <p className="text-sm text-gray-500 mt-1">{block.description}</p>}
              </div>
              <div className="space-y-2 border border-gray-200 rounded-md p-4 bg-gray-50 max-h-96 overflow-y-auto">
                {block.items.map((text, index) => {
                  const checked = selected.includes(String(index));
                  return (
                    <label key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={checked} onChange={() => onToggleChecklistItem(block.id, index)} className="mt-1" />
                      <span>
                        {index + 1}. {text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        }

        return null;
      })}
    </div>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================= */

interface ApplicationRegistrationProps {
  onSave?: (applicationData: ApplicationForm) => void;
  onCancel?: () => void;
}

export default function ApplicationRegistration({ onSave, onCancel }: ApplicationRegistrationProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [applicationType, setApplicationType] = useState<ApplicationType | null>(null);
  const [answers, setAnswers] = useState<FormAnswers>({ values: {}, repeats: {} });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [typeError, setTypeError] = useState('');

  // --- Gate check (runs against the completed form, gates the Submit button) ---
  const [gateCheckStatus, setGateCheckStatus] = useState<GateCheckStatus>('idle');
  const [gateCheckError, setGateCheckError] = useState('');
  const [gateCheckProgress, setGateCheckProgress] = useState(0);
  const [gateCheckChecks, setGateCheckChecks] = useState<ValidationCheck[]>([]);
  const [isRunningGateCheck, setIsRunningGateCheck] = useState(false);
  const [gateCheckTestMode, setGateCheckTestMode] = useState<'pass' | 'fail'>('pass');

  const schema = applicationType ? applicationSchemas[applicationType] : null;

  // --- Step 1: choose application type -----------------------------------

  const resetGateCheck = () => {
    setGateCheckStatus('idle');
    setGateCheckError('');
    setGateCheckProgress(0);
    setGateCheckChecks([]);
  };

  const handleSelectType = (type: ApplicationType) => {
    setApplicationType(type);
    setTypeError('');
    setAnswers(initAnswers(applicationSchemas[type]));
    setErrors({});
    resetGateCheck();
  };

  const handleGoToStep2 = (): void => {
    if (!applicationType) {
      setTypeError('Please select an application type to continue');
      return;
    }
    setCurrentStep(2);
  };

  // --- Step 2: dynamic, on-system form ------------------------------------
  // Any edit after a gate check has run invalidates it — the applicant must
  // re-run the check against the latest answers before they can submit.

  const handleChangeValue = (fieldId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, values: { ...prev.values, [fieldId]: value } }));
    if (gateCheckStatus !== 'idle') resetGateCheck();
  };

  const handleChangeRepeatValue = (groupId: string, itemIndex: number, fieldId: string, value: string | string[]) => {
    setAnswers((prev) => {
      const items = [...(prev.repeats[groupId] || [])];
      items[itemIndex] = { ...items[itemIndex], [fieldId]: value };
      return { ...prev, repeats: { ...prev.repeats, [groupId]: items } };
    });
    if (gateCheckStatus !== 'idle') resetGateCheck();
  };

  const handleAddRepeatItem = (groupId: string) => {
    setAnswers((prev) => ({ ...prev, repeats: { ...prev.repeats, [groupId]: [...(prev.repeats[groupId] || []), {}] } }));
    if (gateCheckStatus !== 'idle') resetGateCheck();
  };

  const handleRemoveRepeatItem = (groupId: string, itemIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      repeats: { ...prev.repeats, [groupId]: (prev.repeats[groupId] || []).filter((_, i) => i !== itemIndex) },
    }));
    if (gateCheckStatus !== 'idle') resetGateCheck();
  };

  const handleToggleChecklistItem = (checklistId: string, itemIndex: number) => {
    setAnswers((prev) => {
      const current = (prev.values[checklistId] as string[]) || [];
      const key = String(itemIndex);
      const next = current.includes(key) ? current.filter((v) => v !== key) : [...current, key];
      return { ...prev, values: { ...prev.values, [checklistId]: next } };
    });
    if (gateCheckStatus !== 'idle') resetGateCheck();
  };

  const handleBack = (): void => {
    setCurrentStep(1);
  };

  /**
   * The gate check itself. Mirrors the old 3-stage upload-validation
   * simulator, but runs against the completed on-system answers instead of
   * a file. `gateCheckTestMode` is a dev/demo toggle standing in for the
   * real QCTO compliance checks — wire real logic in where the simulated
   * `await new Promise(...)` steps are.
   */
  const runGateCheck = async (): Promise<void> => {
    if (!schema) return;

    // Required fields must already be complete before the gate check runs.
    const requiredFieldErrors = validateAnswers(schema, answers);
    setErrors(requiredFieldErrors);
    if (Object.keys(requiredFieldErrors).length > 0) {
      alert('Please complete all required fields before running the gate check.');
      return;
    }

    setIsRunningGateCheck(true);

    const checks: ValidationCheck[] = [
      { id: 'completeness_check', label: 'Checking all required fields are complete...', status: 'pending' },
      { id: 'format_check', label: 'Checking application data format and consistency...', status: 'pending' },
      { id: 'content_check', label: 'Checking application content against QCTO requirements...', status: 'pending' },
    ];

    setGateCheckChecks(checks);
    setGateCheckStatus('processing');
    setGateCheckError('');
    setGateCheckProgress(0);

    const shouldPass = gateCheckTestMode === 'pass';
    const updatedChecks = [...checks];

    updatedChecks[0].status = 'processing';
    setGateCheckChecks([...updatedChecks]);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setGateCheckProgress(30);

    if (!shouldPass) {
      updatedChecks[0].status = 'failed';
      updatedChecks[0].message = 'One or more required fields did not pass validation.';
      setGateCheckChecks([...updatedChecks]);
      setGateCheckStatus('failed');
      setGateCheckError('Gate check failed at the completeness stage.');
      setIsRunningGateCheck(false);
      return;
    }

    updatedChecks[0].status = 'passed';
    updatedChecks[1].status = 'processing';
    setGateCheckChecks([...updatedChecks]);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setGateCheckProgress(65);

    if (!shouldPass) {
      updatedChecks[1].status = 'failed';
      updatedChecks[1].message = 'Some answers appear incomplete or inconsistent with each other.';
      setGateCheckChecks([...updatedChecks]);
      setGateCheckStatus('failed');
      setGateCheckError('Gate check failed at the format/consistency stage.');
      setIsRunningGateCheck(false);
      return;
    }

    updatedChecks[1].status = 'passed';
    updatedChecks[2].status = 'processing';
    setGateCheckChecks([...updatedChecks]);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setGateCheckProgress(100);

    if (!shouldPass) {
      updatedChecks[2].status = 'failed';
      updatedChecks[2].message = 'Application content does not meet QCTO requirements.';
      setGateCheckChecks([...updatedChecks]);
      setGateCheckStatus('failed');
      setGateCheckError('Gate check failed at the content stage.');
      setIsRunningGateCheck(false);
      return;
    }

    updatedChecks[2].status = 'passed';
    setGateCheckChecks([...updatedChecks]);
    setGateCheckStatus('passed');
    setIsRunningGateCheck(false);
  };

  const handleSubmit = (): void => {
    if (!schema) return;

    const validationErrors = validateAnswers(schema, answers);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      alert('Please complete all required fields before submitting.');
      return;
    }

    if (gateCheckStatus !== 'passed') {
      alert('Please run the gate check and make sure it passes before submitting.');
      return;
    }

    const applicationWithId: ApplicationForm = {
      id: `APP-${Date.now()}`,
      applicationId: `APP-${Date.now()}`,
      applicationType: schema.applicationType,
      answers,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
    };

    console.log('Application form submitted:', applicationWithId);

    alert('Application submitted successfully! You will be notified of the initial review outcome.');

    if (onSave) {
      onSave(applicationWithId);
    }

    setCurrentStep(1);
    setApplicationType(null);
    setAnswers({ values: {}, repeats: {} });
    setErrors({});
    resetGateCheck();
  };

  const step2Label = schema ? schema.formTitle : 'Application Details';

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Select the Application Type</h3>
      <p className="text-sm text-gray-500">
        The digital document you'll fill in on the next step is chosen automatically based on your selection.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {applicationTypes.map((type) => {
          const selected = applicationType === type.value;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => handleSelectType(type.value)}
              className={`text-left rounded-lg border-2 p-4 transition-colors ${
                selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">{type.label}</span>
                {selected && <span className="text-blue-600 text-sm font-medium">Selected</span>}
              </div>
              <p className="text-sm text-gray-500 mt-1">{type.description}</p>
            </button>
          );
        })}
      </div>

      {typeError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{typeError}</p>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => {
    if (!schema) return null;
    return (
      <>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800">{schema.formTitle}</h3>
          {schema.formDescription && <p className="text-sm text-gray-500 mt-1">{schema.formDescription}</p>}
        </div>

        <DynamicFormRenderer
          schema={schema}
          answers={answers}
          errors={errors}
          onChangeValue={handleChangeValue}
          onChangeRepeatValue={handleChangeRepeatValue}
          onAddRepeatItem={handleAddRepeatItem}
          onRemoveRepeatItem={handleRemoveRepeatItem}
          onToggleChecklistItem={handleToggleChecklistItem}
        />

        <div className="mt-8 rounded-lg border border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between gap-4 mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Application Gate Check</h3>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Gate Check Test Mode:</label>
              <select
                value={gateCheckTestMode}
                onChange={(e) => setGateCheckTestMode(e.target.value as 'pass' | 'fail')}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Before this application can be submitted it must pass a gate check against your answers above. Run the
            check below — the Submit button unlocks once it passes.
          </p>

          <button
            type="button"
            onClick={runGateCheck}
            disabled={isRunningGateCheck}
            className={`mt-3 px-4 py-2 rounded-md text-sm font-medium ${
              isRunningGateCheck
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {gateCheckStatus === 'idle' ? 'Run Gate Check' : 'Re-run Gate Check'}
          </button>

          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-800">Gate Check Result</h4>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  gateCheckStatus === 'passed'
                    ? 'bg-green-100 text-green-700'
                    : gateCheckStatus === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : gateCheckStatus === 'processing'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {gateCheckStatus === 'idle' ? 'Not run yet' : gateCheckStatus}
              </span>
            </div>

            {gateCheckStatus === 'idle' && (
              <p className="text-sm text-gray-500">Run the gate check to verify this application is ready to submit.</p>
            )}

            {gateCheckStatus === 'processing' && (
              <div className="space-y-3">
                <p className="text-sm text-blue-600">Running gate check against your application...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${gateCheckProgress}%` }} />
                </div>
              </div>
            )}

            {gateCheckChecks.length > 0 && (
              <div className="space-y-2 mt-3">
                {gateCheckChecks.map((check) => (
                  <div key={check.id} className="flex items-center justify-between p-2 rounded border border-gray-200">
                    <div>
                      <span className="text-sm text-gray-700">{check.label}</span>
                      {check.message && <p className="text-xs text-gray-500 mt-1">{check.message}</p>}
                    </div>

                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        check.status === 'passed'
                          ? 'bg-green-100 text-green-700'
                          : check.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : check.status === 'processing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {check.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {gateCheckStatus === 'failed' && gateCheckError && (
              <p className="mt-3 text-sm text-red-600">{gateCheckError}</p>
            )}

            {gateCheckStatus === 'passed' && (
              <p className="mt-3 text-sm text-green-600">This application passed the gate check and is ready to submit.</p>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">New Application</h2>
        <p className="text-gray-600">Choose an application type, then complete the digital form on this page.</p>
      </div>

      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2
              ${currentStep >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}
            >
              1
            </div>
            <span className="ml-2 text-sm font-medium">Application Type</span>
          </div>

          <div className={`flex-1 h-1 mx-4 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>

          <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2
              ${currentStep >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}
            >
              2
            </div>
            <span className="ml-2 text-sm font-medium truncate max-w-xs">{step2Label}</span>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (currentStep === 1) handleGoToStep2();
          else handleSubmit();
        }}
      >
        {currentStep === 1 ? renderStep1() : renderStep2()}

        <div className="flex justify-between mt-6">
          <div>
            {currentStep === 2 && (
              <button type="button" onClick={handleBack} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                Back
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this application?')) {
                  onCancel?.();
                }
              }}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={currentStep === 1 ? handleGoToStep2 : handleSubmit}
              disabled={currentStep === 2 && gateCheckStatus !== 'passed'}
              title={
                currentStep === 2 && gateCheckStatus !== 'passed'
                  ? 'Run the gate check above and make sure it passes before you can submit'
                  : undefined
              }
              className={`px-4 py-2 rounded-md text-white ${
                currentStep === 2 && gateCheckStatus !== 'passed'
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {currentStep === 2 ? 'Submit' : 'Next'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">What happens next?</h4>
        <p className="text-sm text-gray-600">
          After submission, your application will be reviewed. You can track its status in your Applicant Portfolio.
          You'll receive notifications about site visits and the final outcome.
        </p>
      </div>
    </div>
  );
}