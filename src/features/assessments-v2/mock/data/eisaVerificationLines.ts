// Batch N2 (29.29): section 2 of QCTO's "EISA Quality Assurance Verification Report", in QCTO's own
// order and wording. It replaces the invented four-folder checklist (resultsComplianceFolders.ts)
// for EISA results. Lines k and m are free text in QCTO's form, so they have no Yes/No.
export interface EisaReviewLineDef {
  id: string;
  text: string;
  kind: 'yes-no' | 'free-text';
}

export const EISA_REVIEW_LINES: EisaReviewLineDef[] = [
  { id: 'a', kind: 'yes-no', text: 'QAS Addendum: EISA was developed and conducted in accordance with the QAS Addendum' },
  {
    id: 'b',
    kind: 'yes-no',
    text: 'Notification: Assessment Instruments were developed by Subject Matter Experts (SMEs); qualified examiners and moderators were used in the design/development of the assessment instruments (CVs received and perused)',
  },
  {
    id: 'b2',
    kind: 'yes-no',
    text: 'According to the Notification, the QP has confirmed that Assessment Centres/Sites or TTCs, Invigilators or assessors, moderators used were trained',
  },
  {
    id: 'b3',
    kind: 'yes-no',
    text: 'QP has confirmed state of readiness for EISA beforehand (instruments in place, relevant reports in place, exemplar published on website) – as per Notification received',
  },
  { id: 'b4', kind: 'yes-no', text: 'QP/QCTO has confirmation that candidates meet entry requirements for the EISA (SoR)' },
  {
    id: 'c',
    kind: 'yes-no',
    text: 'Moderator Report: The Moderator has confirmed that the EISA assessment instruments have been developed according to the QAS Addendum, and have been signed off as "fit for purpose" and are print/distribution ready',
  },
  { id: 'd', kind: 'yes-no', text: 'Accredited SDPs: If candidates are from SDPs, all SDPs are accredited by the QCTO and their accreditation is still valid' },
  { id: 'e', kind: 'yes-no', text: 'Accredited ACs/TTC: Accredited ACs/TTCs or approved Assessment Sites have been used' },
  {
    id: 'f',
    kind: 'yes-no',
    text: 'Monitoring Report: According to the Monitoring Report (either by the QCTO or the QP), the EISA session was conducted in a credible manner, and would therefore contribute towards the validation of results.',
  },
  {
    id: 'g',
    kind: 'yes-no',
    text: "Marker/Trade Test Report: Marker's Report or Trade Test Report provide a satisfactory standard of the marking/assessing that took place",
  },
  {
    id: 'g2',
    kind: 'yes-no',
    text: 'The marking / assessment session was sampled by the QCTO and a "Monitoring of Marking / Assessment" report was completed by the QCTO',
  },
  { id: 'g3', kind: 'yes-no', text: 'If marking session was sampled by the QCTO, it was found to be credible' },
  {
    id: 'h',
    kind: 'yes-no',
    text: 'Moderator Report: According to the Moderator Report the results are upheld, and any issues were dealt with uniformly so as not to disadvantage any learner',
  },
  {
    id: 'i',
    kind: 'yes-no',
    text: 'Learner enrolments have been completed with all relevant details (either by SDP: enrolled learners or QP/ASC: RPL learners) and submitted within 21 working days of start of training (LEISA File) or 3 months prior to the EISA if RPL candidates',
  },
  { id: 'j', kind: 'yes-no', text: 'Learner Achievements: File 3 was submitted to QCTO by the QP within 21 working days' },
  {
    id: 'j2',
    kind: 'yes-no',
    text: 'Results submitted by the QP (File 3) were verified, and statistics provided by the QP correlate with the data on the File 3',
  },
  {
    id: 'k',
    kind: 'free-text',
    text: 'Analysis of Learner Results by the QP: short summary from the Analysis of Results Report from the QP',
  },
  {
    id: 'l',
    kind: 'yes-no',
    text: 'Confirmation/ Declaration letter from QP: The QP has confirmed that all information submitted to the QCTO for certification of results is correct',
  },
  {
    id: 'm',
    kind: 'free-text',
    text: 'Sample verification of results by QCTO: comment, and remedial action if not of an acceptable standard',
  },
];

export const EISA_IMPACT_LABELS = {
  negative: 'Negative impact – results cannot be approved',
  sorted: 'Irregularity sorted and does not impact approval',
} as const;

export const EISA_REVIEW_SECTION_ID = 'qcto-s2';
export const EISA_REVIEW_SECTION_TITLE = 'Section 2: Compliance review (QCTO EISA Quality Assurance Verification Report)';
