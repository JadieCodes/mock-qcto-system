// Batch R2 (QCTO 29.15): QCTO's File 4, "Learner Enrolment and Readiness for EISA". RPL or formal
// comes from the readiness type, never from a tick box. The codes and rules are from QCTO's
// Learner Enrolment guideline (July 2022).
import type { SorFile } from './types';

export type ReadinessTypeId = 1 | 2 | 3 | 4 | 5 | 6;
export type StatementStatus = '01' | '02';
export type FlcCode = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08';

export const READINESS_TYPES: { id: ReadinessTypeId; label: string }[] = [
  { id: 1, label: 'Enrolled' },
  { id: 2, label: 'RPL for access to EISA determined by SDP' },
  { id: 3, label: 'Mixed mode to EISA' },
  { id: 4, label: 'SDP training and assessment for readiness' },
  { id: 5, label: 'SDP e-learning training and assessment for readiness' },
  { id: 6, label: 'RPL for access to EISA determined by the Assessment/Quality Partner' },
];

export const STATEMENT_STATUSES: { code: StatementStatus; label: string }[] = [
  { code: '01', label: 'Issued' },
  { code: '02', label: 'Not yet issued' },
];

export const FLC_CODES: { code: FlcCode; label: string }[] = [
  { code: '01', label: 'FLC certificate (competent)' },
  { code: '02', label: 'RPL' },
  { code: '03', label: 'Grade 12/NCV Level 4 Maths and English pass' },
  { code: '04', label: 'Not yet competent' },
  { code: '05', label: 'FLC not completed yet' },
  { code: '06', label: 'Not applicable (NQF 5 and above)' },
  { code: '07', label: 'Enrolled for FLC' },
  { code: '08', label: 'N3 Mathematics and Business Language' },
];

// FLC answers that earn an amber warning when the QASA says FLC is required.
export const FLC_WARNING_CODES: FlcCode[] = ['04', '05', '07'];

// ASSUMPTION (QCTO to confirm): mixed mode (3) counts as RPL/ARPL, together with 2 and 6.
const RPL_ARPL_TYPES: ReadinessTypeId[] = [2, 3, 6];

export function isRplArplType(type: ReadinessTypeId): boolean {
  return RPL_ARPL_TYPES.includes(type);
}

export function readinessTypeText(type: ReadinessTypeId): string {
  return `${type} - ${READINESS_TYPES.find((t) => t.id === type)?.label ?? ''}`;
}

export function statementStatusText(status: StatementStatus): string {
  return `${status} - ${STATEMENT_STATUSES.find((s) => s.code === status)?.label ?? ''}`;
}

export function flcText(code: FlcCode | null): string {
  return code ? `${code} - ${FLC_CODES.find((f) => f.code === code)?.label ?? ''}` : 'Not recorded';
}

export function isReadinessTypeId(value: number): value is ReadinessTypeId {
  return READINESS_TYPES.some((t) => t.id === value);
}

export function isStatementStatus(value: string): value is StatementStatus {
  return STATEMENT_STATUSES.some((s) => s.code === value);
}

export function isFlcCode(value: string): value is FlcCode {
  return FLC_CODES.some((f) => f.code === value);
}

export function isRealCompactDate(text: string): boolean {
  if (!/^\d{8}$/.test(text)) return false;
  const year = Number(text.slice(0, 4));
  const month = Number(text.slice(4, 6));
  const day = Number(text.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function compactDate(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

export function isoFromCompact(compact: string): string {
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

// A record stored with the old RPL/ARPL tick box: ticked is type 2, not ticked is type 4, with the
// SOR status from whether an SOR was uploaded. Only called when the record has no readiness type yet.
export function readinessFromLegacy(
  rplTicked: boolean,
  sor: SorFile | null,
): { readinessType: ReadinessTypeId; statementStatus: StatementStatus; statementIssueDate: string | null } {
  return {
    readinessType: rplTicked ? 2 : 4,
    statementStatus: sor ? '01' : '02',
    statementIssueDate: sor ? sor.uploadedAt.slice(0, 10) : null,
  };
}

export interface ReadinessInput {
  statementStatus: string;
  // YYYYMMDD, or blank
  statementIssueDate: string;
  readinessType: string;
  assessmentCentreCode: string;
  flc: string;
  flcStatementNumber: string;
  // YYYYMMDD
  dateStamp: string;
}

export interface ReadinessContext {
  // YYYY-MM-DD
  eisaDate: string;
  today: string;
  accreditedCentreCodes: string[];
  flcRequired: boolean;
}

export interface ReadinessCheck {
  errors: string[];
  warnings: string[];
}

// One check for the File 4 upload and for adding a learner by hand.
export function checkReadiness(input: ReadinessInput, context: ReadinessContext): ReadinessCheck {
  const errors: string[] = [];
  const warnings: string[] = [];

  const status = input.statementStatus.trim();
  const statusOk = isStatementStatus(status);
  if (!statusOk) errors.push(`StatementofResultsStatus "${status}" is not valid. Use 01 (issued) or 02 (not yet issued).`);

  const issueDate = input.statementIssueDate.trim();
  if (status === '01') {
    if (issueDate === '') errors.push('StatementofResultsIssueDate is required when StatementofResultsStatus is 01.');
  } else if (status === '02' && issueDate !== '') {
    errors.push('StatementofResultsIssueDate must be blank when StatementofResultsStatus is 02.');
  }
  if (issueDate !== '') {
    if (!isRealCompactDate(issueDate)) errors.push(`StatementofResultsIssueDate "${issueDate}" is not a valid date. Use YYYYMMDD, for example 20261105.`);
    else if (isoFromCompact(issueDate) > context.eisaDate) errors.push(`StatementofResultsIssueDate ${issueDate} is after the EISA date (${compactDate(context.eisaDate)}).`);
  }

  const centre = input.assessmentCentreCode.trim();
  if (centre !== '' && !context.accreditedCentreCodes.some((c) => c.toLowerCase() === centre.toLowerCase())) {
    errors.push(`AssessmentCentreCode "${centre}" is not a centre accredited for this qualification.`);
  }

  const typeText = input.readinessType.trim();
  const typeId = Number(typeText);
  if (!/^\d$/.test(typeText) || !isReadinessTypeId(typeId)) {
    errors.push(`LearnerReadinessforEISATypeId "${typeText}" is not valid. Use 1 to 6.`);
  } else if (statusOk) {
    if (typeId === 1 && (status !== '02' || issueDate !== '')) {
      errors.push('Readiness type 1 (Enrolled) needs StatementofResultsStatus 02 and a blank StatementofResultsIssueDate.');
    } else if (typeId !== 1 && (status !== '01' || issueDate === '')) {
      errors.push(`Readiness type ${typeId} needs StatementofResultsStatus 01 and a StatementofResultsIssueDate.`);
    }
  }

  const flc = input.flc.trim();
  if (flc === '') {
    errors.push('FLC is required.');
  } else if (!isFlcCode(flc)) {
    errors.push(`FLC "${flc}" is not valid. Use 01 to 08.`);
  } else if (context.flcRequired && FLC_WARNING_CODES.includes(flc)) {
    warnings.push(`This qualification requires an FLC and the FLC answer is "${flcText(flc)}".`);
  }

  const flcNumber = input.flcStatementNumber.trim();
  if (flcNumber === '') {
    errors.push('FLCStatementofresultnumber is required.');
  } else if (flc === '02') {
    const rpl = /^RPL(\d{8})$/.exec(flcNumber);
    if (!rpl || !isRealCompactDate(rpl[1])) errors.push('FLCStatementofresultnumber must be RPL followed by a date (RPLYYYYMMDD) when FLC is 02.');
  }

  const stamp = input.dateStamp.trim();
  if (!isRealCompactDate(stamp)) errors.push(`DateStamp "${stamp}" is not a valid date. Use YYYYMMDD, for example 20261105.`);
  else if (isoFromCompact(stamp) > context.today) errors.push(`DateStamp ${stamp} is in the future.`);

  return { errors, warnings };
}

// What is stored on a registration learner once the readiness input has passed checkReadiness.
export interface ReadinessData {
  readinessType: ReadinessTypeId;
  statementStatus: StatementStatus;
  statementIssueDate: string | null;
  assessmentCentre: string | null;
  flc: FlcCode | null;
  flcStatementNumber: string | null;
  dateStamp: string | null;
}

// Null when the input is not valid, so callers run checkReadiness first.
export function readinessDataOf(input: ReadinessInput, centres: { code: string; name: string }[]): ReadinessData | null {
  const typeId = Number(input.readinessType.trim());
  const status = input.statementStatus.trim();
  const flc = input.flc.trim();
  if (!isReadinessTypeId(typeId) || !isStatementStatus(status) || !isFlcCode(flc)) return null;
  const issueDate = input.statementIssueDate.trim();
  const stamp = input.dateStamp.trim();
  const centreCode = input.assessmentCentreCode.trim().toLowerCase();
  return {
    readinessType: typeId,
    statementStatus: status,
    statementIssueDate: issueDate === '' ? null : isoFromCompact(issueDate),
    assessmentCentre: centres.find((c) => c.code.toLowerCase() === centreCode)?.name ?? null,
    flc,
    flcStatementNumber: input.flcStatementNumber.trim(),
    dateStamp: stamp === '' ? null : isoFromCompact(stamp),
  };
}
