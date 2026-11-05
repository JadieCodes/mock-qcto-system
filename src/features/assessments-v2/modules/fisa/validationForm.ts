import { buildFisaInstrumentValidationChecklist } from '../../mock/data/fisaInstrumentValidationChecklistItems';
import { getChecklistIssues, type ChecklistSection } from '../../shared/checklist/types';
import type { ValidationIssue } from '../../shared/validation/types';
import type {
  FisaValidationFormVersion,
  FisaValidationRecord,
  FisaValidationReportHeader,
  FisaValidationSignOff,
} from './types';

// QCTO feedback 3.10: the FISA Instrument Validation form is QCTO's "FISA Validation of
// Instrument Report". The api, the seed and the screens all read and check it through here.

export const FISA_VALIDATION_FORM_VERSION: FisaValidationFormVersion = 'qcto-2026-10';

// QCTO's form is Yes/No only, so a comment per line is optional on FISA. CR-011 still applies
// to EISA Instrument Validation and every other checklist.
export const FISA_VALIDATION_REQUIRES_COMMENT = false;

export interface FisaValidationForm {
  // False for a record validated on the old borrowed EISA checklist; its report shows that
  // checklist as it was and has no QCTO header, findings or sign-off.
  isQctoForm: boolean;
  header: FisaValidationReportHeader;
  checklist: ChecklistSection[];
  section2Comment: string;
  findings: string;
  signOff: FisaValidationSignOff;
}

export function blankFisaReportHeader(record: Pick<FisaValidationRecord, 'sdpName' | 'skillsProgrammeTitle'>): FisaValidationReportHeader {
  return {
    qapSdpName: record.sdpName,
    contactNumber: '',
    evaluatorName: '',
    dateCompleted: null,
    qualificationTitle: record.skillsProgrammeTitle,
    spId: '',
    nqfLevel: '',
    credits: '',
    fisaDatePeriod: '',
    duration: '',
    totalMarks: '',
    passMark: '',
  };
}

export function blankFisaSignOff(): FisaValidationSignOff {
  return { fullNames: '', designation: '', signed: false, date: null };
}

// Safe read of the form: fields missing on a stored record get their blank value.
export function fisaValidationFormOf(record: FisaValidationRecord): FisaValidationForm {
  return {
    isQctoForm: record.formVersion === FISA_VALIDATION_FORM_VERSION,
    header: { ...blankFisaReportHeader(record), ...record.reportHeader },
    checklist: record.checklist,
    section2Comment: record.section2Comment ?? '',
    findings: record.findings ?? '',
    signOff: { ...blankFisaSignOff(), ...record.signOff },
  };
}

// A fresh, blank QCTO form on the record (new records, and old unfinished records upgraded on
// read — their answers on the old checklist lines are dropped).
export function withBlankFisaValidationForm(record: FisaValidationRecord): FisaValidationRecord {
  return {
    ...record,
    formVersion: FISA_VALIDATION_FORM_VERSION,
    checklist: buildFisaInstrumentValidationChecklist(),
    reportHeader: blankFisaReportHeader(record),
    section2Comment: '',
    findings: '',
    signOff: blankFisaSignOff(),
  };
}

// PM-01 loop: after "Not approved" the next cycle starts on a blank checklist, findings and
// sign-off. The header details the evaluator typed (contact number, marks, …) carry over; the
// evaluator and completion date are set again by the next outcome.
export function withNextCycleFisaValidationForm(record: FisaValidationRecord): FisaValidationRecord {
  const { header } = fisaValidationFormOf(record);
  return {
    ...withBlankFisaValidationForm(record),
    reportHeader: { ...header, evaluatorName: '', dateCompleted: null },
  };
}

// Records stored before 3.10 that are not yet validated move onto QCTO's form. Validated ones
// keep their old checklist so their report still shows what was answered.
export function upgradeFisaValidationRecord(record: FisaValidationRecord): FisaValidationRecord {
  if (record.formVersion === FISA_VALIDATION_FORM_VERSION || record.instrumentStatus === 'validated') return record;
  return withBlankFisaValidationForm(record);
}

// What must be done before any outcome can be recorded: every line answered Yes or No,
// Findings and Recommendations, and the sign-off (full names, designation, "Signed").
export function getFisaValidationFormIssues(record: FisaValidationRecord): ValidationIssue[] {
  const form = fisaValidationFormOf(record);
  const issues = getChecklistIssues(form.checklist, FISA_VALIDATION_REQUIRES_COMMENT);
  if (!form.findings.trim()) issues.push({ field: 'findings', message: 'Findings and Recommendations — required.' });
  if (!form.signOff.fullNames.trim()) issues.push({ field: 'signOff.fullNames', message: 'Sign-off — enter your full names.' });
  if (!form.signOff.designation.trim()) issues.push({ field: 'signOff.designation', message: 'Sign-off — enter your designation.' });
  if (!form.signOff.signed) issues.push({ field: 'signOff.signed', message: 'Sign-off — tick "Signed".' });
  return issues;
}

export function isFisaValidationFormComplete(record: FisaValidationRecord): boolean {
  return getFisaValidationFormIssues(record).length === 0;
}
