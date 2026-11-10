// Batch N2 (29.28, 29.35): QCTO's tracking registers (EISA and FISA) as CSV, the per-batch audit
// trail CSV, and the working-day rules behind them. The headings are QCTO's own, in QCTO's order.
// Rules (QCTO's register): "submitted in how many days?" = working days from the last EISA date to
// the date results were received; due dates = 21 working days after the EISA / after the final
// evidence; QCTO Turnaround Time = working days from the final outstanding evidence to the approval
// letter; Competency Rate = competent / wrote x 100 (FISA: competent / completed); Throughput Rate =
// wrote / registered x 100. Quarters follow the financial year (April to March): 202526Q3.
// Only approved batches are in a register (they are the ones with an approval letter).
import { qpDirectoryEntryFor } from '../../mock/data/qpDirectory';
import type { AuditEntry } from '../../shared/audit/types';
import { csvField, withExcelPrefix } from '../../shared/csv/csv';
import { addWorkingDays, workingDaysBetween } from '../../shared/dates/workingDays';
import { batchFiguresOf, calculateLearnerResult } from './calculation';
import { RESULTS_SUBMISSION_DEADLINE_WORKING_DAYS } from './config';
import { eisaDatesOf, lastFisaDateOf } from './outcomeLetters';
import { financialYearStartOf, firstDateOf, lastDateOf, verificationCodeOf } from './verificationCode';
import { fisaFiguresOf } from './workflow';
import type { FisaResultsBatch, ResultsBatch } from './types';

export const EISA_REGISTER_HEADINGS = [
  'No.',
  'Verification Code',
  'DATE OF NOTIFICATION:',
  // QCTO's own heading; everywhere else on screen this is the QP.
  'AQP:',
  'SAQA ID:',
  'QUALIFICATION NAME',
  'Level',
  'Credits',
  'Date Conducted',
  'Last date of EISA',
  'submitted in how many days?',
  'Date Results Due (within 21 days of EISA)',
  'Date Results Received',
  'Date final outstanding evidence received',
  'Date Approval Due (within 21 days)',
  'Date Approval Letter Issued',
  'QCTO Turnaround Time',
  'Quarter Approved',
  'Turnaround time verification',
  'No. Registered',
  'No. from RPL',
  'No. per SDP',
  'No. Wrote',
  'Total No. Competent',
  'Total No. NYC',
  'RPL Competent',
  'RPL NYC',
  'SDP Province',
  'Competency Rate',
  'Throughput Rate',
  'Project Name',
  'Comments',
];

export const FISA_REGISTER_HEADINGS = [
  'FISA Verification Code',
  'SDP:',
  'SKILLS Programme ID:',
  'Title of Skills Programme',
  'Level',
  'Credits',
  'Date FISA Conducted',
  'Quarter in which FISA will take place',
  'No of learner Enrolled',
  'No of learners Competent',
  'Date Results Due (within 21 days of FISA)',
  'Date Results Received',
  'QA Verification Report Received',
  'Copy of FISA Instrument & Marking Guideline Received',
  'Date Additional Evidence Requested',
  'Date final outstanding evidence received',
  'Date Approval Due (within 21 days)',
  'Date Approval Letter Issued',
  'QCTO Turnaround Time',
  'Quarter Approved',
  'Competency Rate',
];

// ----- dates -----

// 2026-08-05 -> 2026/08/05; blank stays blank.
export function slashDate(iso: string): string {
  return iso.replace(/-/g, '/');
}

export function dateOf(timestamp: string): string {
  return timestamp.slice(0, 10);
}

// "202526Q3": the financial year 2025/26, third quarter (October to December).
export function quarterLabelOf(iso: string): string {
  const fy = financialYearStartOf(iso);
  const month = Number(iso.slice(5, 7));
  const quarter = month >= 4 ? Math.floor((month - 4) / 3) + 1 : 4;
  return `${fy}${String((fy + 1) % 100).padStart(2, '0')}Q${quarter}`;
}

export interface QuarterRange {
  label: string;
  from: string;
  to: string;
}

const QUARTER_MONTHS = [
  { startMonth: 4, endMonth: 6, endDay: 30, yearOffset: 0 },
  { startMonth: 7, endMonth: 9, endDay: 30, yearOffset: 0 },
  { startMonth: 10, endMonth: 12, endDay: 31, yearOffset: 0 },
  { startMonth: 1, endMonth: 3, endDay: 31, yearOffset: 1 },
];

const pad = (n: number) => String(n).padStart(2, '0');

export function quarterRange(financialYearStart: number, quarter: 1 | 2 | 3 | 4): QuarterRange {
  const q = QUARTER_MONTHS[quarter - 1];
  const year = financialYearStart + q.yearOffset;
  return {
    label: `${financialYearStart}${pad((financialYearStart + 1) % 100)}Q${quarter}`,
    from: `${year}-${pad(q.startMonth)}-01`,
    to: `${year}-${pad(q.endMonth)}-${pad(q.endDay)}`,
  };
}

export function financialYearQuarters(todayIso: string): QuarterRange[] {
  const fy = financialYearStart(todayIso);
  return ([1, 2, 3, 4] as const).map((q) => quarterRange(fy, q));
}

function financialYearStart(iso: string): number {
  return financialYearStartOf(iso);
}

export function currentQuarterRange(todayIso: string): QuarterRange {
  return financialYearQuarters(todayIso).find((q) => todayIso >= q.from && todayIso <= q.to) ?? quarterRange(financialYearStart(todayIso), 1);
}

// ----- shared batch dates -----

// "Date Results Received": the first submission (a resubmission does not move it).
export function eisaResultsReceived(batch: Pick<ResultsBatch, 'submittedAt'>): string {
  return dateOf(batch.submittedAt);
}

// "Date final outstanding evidence received": the resubmission after more evidence was requested;
// a batch that never needed more evidence has its submission as the final evidence.
export function eisaFinalEvidence(batch: Pick<ResultsBatch, 'submittedAt' | 'finalEvidenceReceivedAt'>): string {
  return batch.finalEvidenceReceivedAt ?? eisaResultsReceived(batch);
}

export function fisaResultsReceived(batch: Pick<FisaResultsBatch, 'firstSubmittedAt' | 'submittedAt'>): string {
  return dateOf(batch.firstSubmittedAt ?? batch.submittedAt ?? '');
}

export function fisaFinalEvidence(batch: Pick<FisaResultsBatch, 'firstSubmittedAt' | 'submittedAt' | 'finalEvidenceReceivedAt'>): string {
  return batch.finalEvidenceReceivedAt ?? fisaResultsReceived(batch);
}

export function letterDateOf(batch: { finalDecision: { decidedAt: string } | null }): string {
  return batch.finalDecision ? dateOf(batch.finalDecision.decidedAt) : '';
}

// Blank when either date is missing.
export function turnaroundDays(fromIso: string, toIso: string): string {
  return fromIso && toIso ? String(workingDaysBetween(fromIso, toIso)) : '';
}

function dueDate(fromIso: string): string {
  return fromIso ? addWorkingDays(fromIso, RESULTS_SUBMISSION_DEADLINE_WORKING_DAYS) : '';
}

function ratePercent(part: number, whole: number): string {
  return whole === 0 ? '' : String(Math.round((part / whole) * 1000) / 10);
}

// ----- EISA register -----

export function isInDateRange(iso: string, from: string, to: string): boolean {
  return iso !== '' && (!from || iso >= from) && (!to || iso <= to);
}

// Approved batches whose approval letter falls in the range, oldest letter first.
export function eisaRegisterBatches(batches: ResultsBatch[], from: string, to: string): ResultsBatch[] {
  return batches
    .filter((b) => b.finalDecision?.outcome === 'approved' && isInDateRange(letterDateOf(b), from, to))
    .sort((a, b) => (a.finalDecision?.decidedAt ?? '').localeCompare(b.finalDecision?.decidedAt ?? ''));
}

export function eisaRegisterRow(batch: ResultsBatch, no: number): string[] {
  const dates = eisaDatesOf(batch);
  const firstEisa = firstDateOf(dates);
  const lastEisa = lastDateOf(dates);
  const received = eisaResultsReceived(batch);
  const finalEvidence = eisaFinalEvidence(batch);
  const letter = letterDateOf(batch);
  const turnaround = turnaroundDays(finalEvidence, letter);
  const f = batchFiguresOf(batch);
  const qp = qpDirectoryEntryFor(batch.qpId);

  const rplIds = new Set(batch.sourceInfo.learners.filter((l) => l.rpl).map((l) => l.learnerId));
  const rplOutcomes = batch.learnerResults
    .filter((r) => rplIds.has(r.learnerId))
    .map((r) => calculateLearnerResult(batch.components, r, batch.addendumPassPercent).outcome);
  const rplCount = batch.learnerResults.filter((r) => rplIds.has(r.learnerId)).length;

  return [
    String(no),
    verificationCodeOf(batch),
    slashDate(batch.sourceInfo.notifiedAt),
    qp?.organisation ?? batch.qpName,
    batch.saqaId,
    batch.qualificationTitle,
    batch.nqfLevel,
    batch.credits,
    slashDate(firstEisa),
    slashDate(lastEisa),
    turnaroundDays(lastEisa, received),
    slashDate(dueDate(lastEisa)),
    slashDate(received),
    slashDate(finalEvidence),
    slashDate(dueDate(finalEvidence)),
    slashDate(letter),
    turnaround,
    letter ? quarterLabelOf(letter) : '',
    // Assumption (progress.md, Batch N2): QCTO's definition is not known; this is the 21-day check.
    turnaround === '' ? '' : Number(turnaround) <= RESULTS_SUBMISSION_DEADLINE_WORKING_DAYS ? 'Within 21 days' : 'Over 21 days',
    String(f.registered),
    String(rplCount),
    String(f.registered - rplCount),
    String(f.wrote),
    String(f.competent),
    String(f.notYetCompetent),
    String(rplOutcomes.filter((o) => o === 'competent').length),
    String(rplOutcomes.filter((o) => o === 'not-yet-competent').length),
    '',
    ratePercent(f.competent, f.wrote),
    ratePercent(f.wrote, f.registered),
    '',
    '',
  ];
}

function csvOf(headings: string[], rows: string[][]): string {
  return withExcelPrefix([headings, ...rows].map((row) => row.map(csvField).join(',')).join('\r\n') + '\r\n');
}

export function eisaRegisterCsv(batches: ResultsBatch[], from: string, to: string): { csv: string; rowCount: number } {
  const selected = eisaRegisterBatches(batches, from, to);
  return { csv: csvOf(EISA_REGISTER_HEADINGS, selected.map((b, i) => eisaRegisterRow(b, i + 1))), rowCount: selected.length };
}

// ----- FISA register -----

export function fisaRegisterBatches(batches: FisaResultsBatch[], from: string, to: string): FisaResultsBatch[] {
  return batches
    .filter((b) => b.finalDecision?.outcome === 'approved' && isInDateRange(letterDateOf(b), from, to))
    .sort((a, b) => (a.finalDecision?.decidedAt ?? '').localeCompare(b.finalDecision?.decidedAt ?? ''));
}

export function fisaRegisterRow(batch: FisaResultsBatch): string[] {
  const fisaDate = lastFisaDateOf(batch);
  const received = fisaResultsReceived(batch);
  const finalEvidence = fisaFinalEvidence(batch);
  const letter = letterDateOf(batch);
  const f = fisaFiguresOf(batch);
  const has = (tag: string) => (batch.evidenceDocuments.some((d) => d.tag === tag) ? 'Yes' : 'No');
  return [
    verificationCodeOf(batch),
    batch.sdpName,
    batch.skillsProgrammeId,
    batch.skillsProgrammeTitle,
    batch.nqfLevel,
    batch.credits,
    slashDate(fisaDate),
    fisaDate ? quarterLabelOf(fisaDate) : '',
    String(f.enrolled),
    String(f.competent),
    slashDate(dueDate(fisaDate)),
    slashDate(received),
    has('verification-report'),
    has('assessment-instrument'),
    slashDate(batch.evidenceRequestedAt ?? ''),
    slashDate(finalEvidence),
    slashDate(dueDate(finalEvidence)),
    slashDate(letter),
    turnaroundDays(finalEvidence, letter),
    letter ? quarterLabelOf(letter) : '',
    ratePercent(f.competent, f.completed),
  ];
}

export function fisaRegisterCsv(batches: FisaResultsBatch[], from: string, to: string): { csv: string; rowCount: number } {
  const selected = fisaRegisterBatches(batches, from, to);
  return { csv: csvOf(FISA_REGISTER_HEADINGS, selected.map(fisaRegisterRow)), rowCount: selected.length };
}

// ----- audit trail -----

export const AUDIT_CSV_HEADINGS = ['Date', 'Time (UTC)', 'Action', 'Name', 'Role', 'Note'];

export function auditTrailCsv(entries: AuditEntry[], from: string, to: string): { csv: string; rowCount: number } {
  const selected = [...entries]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .filter((e) => isInDateRange(dateOf(e.timestamp), from, to));
  const rows = selected.map((e) => [slashDate(dateOf(e.timestamp)), e.timestamp.slice(11, 16), e.action, e.actorName, e.actorRole, e.note ?? '']);
  return { csv: csvOf(AUDIT_CSV_HEADINGS, rows), rowCount: selected.length };
}
