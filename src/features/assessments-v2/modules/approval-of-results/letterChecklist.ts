// Batch N2 (29.35): QCTO's "Approval of Results letter checklist" for an EISA batch. The Deputy
// Director ticks it against the draft Outcome Letter (N1) and cannot send the batch on without it
// (api.ts). The table at the top is filled by the system; "Correct verification number" is ticked by
// the system once the batch has its final decision.
import { sdpDirectoryEntryByName } from '../../mock/data/sdpDirectory';
import type { ValidationIssue } from '../../shared/validation/types';
import { batchFiguresOf } from './calculation';
import { eisaDatesOf } from './outcomeLetters';
import { dateOf, eisaFinalEvidence, eisaResultsReceived, letterDateOf, turnaroundDays } from './trackingRegister';
import type { DdLetterChecklist, ResultsBatch } from './types';

export interface DdCheckLine {
  id: string;
  text: string;
  // Ticked by the system, never by the Deputy Director.
  auto?: boolean;
}

export const VERIFICATION_NUMBER_LINE_ID = 'verification-number';

export const DD_LETTER_CHECK_LINES: DdCheckLine[] = [
  { id: 'contact-name', text: 'Correct contact name has been used' },
  { id: 'address', text: 'Correct address has been indicated' },
  { id: 'subject-qualification', text: 'Subject line indicates correct name of qualification' },
  { id: 'subject-saqa-id', text: 'Subject line indicates the correct SAQA ID' },
  { id: 'subject-eisa-date', text: 'Subject line indicates the correct EISA date' },
  { id: 'qp-name', text: 'Correct name of QP in the first paragraph' },
  { id: 'info-table', text: 'All information in the information table is correct' },
  { id: VERIFICATION_NUMBER_LINE_ID, text: 'Correct verification number has been allocated', auto: true },
  { id: 'evidence-on-file', text: 'All required evidence as per the QA Verification Report is on file in the system' },
  {
    id: 'batch-holds',
    text: 'The batch holds learner results, the QA verification report, the outcome letter, the tracking register entry and the certification letter',
  },
];

export const DD_REQUIRED_LINE_IDS = DD_LETTER_CHECK_LINES.filter((l) => !l.auto).map((l) => l.id);

export function blankDdChecklist(): DdLetterChecklist {
  return { checkedIds: [], completedBy: null, completedById: null, completedAt: null };
}

// What shows as ticked: the DD's ticks, plus the verification number once it is allocated.
export function ddCheckedIdsOf(batch: Pick<ResultsBatch, 'ddChecklist' | 'finalDecision'>): string[] {
  const ticked = batch.ddChecklist?.checkedIds ?? [];
  return batch.finalDecision ? [...new Set([...ticked, VERIFICATION_NUMBER_LINE_ID])] : ticked;
}

export function ddChecklistIssues(checklist: DdLetterChecklist | null): ValidationIssue[] {
  const ticked = new Set(checklist?.checkedIds ?? []);
  return DD_LETTER_CHECK_LINES.filter((l) => !l.auto && !ticked.has(l.id)).map((l) => ({ field: l.id, message: `Tick: ${l.text}.` }));
}

export function assertDdChecklistComplete(batch: Pick<ResultsBatch, 'ddChecklist'>): void {
  const issues = ddChecklistIssues(batch.ddChecklist);
  if (issues.length > 0) throw new Error(`Complete the Approval of Results letter checklist before sending the batch on. ${issues[0].message}`);
}

export function accreditedCentreCount(batch: Pick<ResultsBatch, 'centres'>): number {
  return batch.centres.filter((c) => sdpDirectoryEntryByName(c)?.accreditationNumber).length;
}

// The auto-filled table at the top of the checklist.
export function ddLetterTable(batch: ResultsBatch): [string, string][] {
  const f = batchFiguresOf(batch);
  const letter = letterDateOf(batch);
  const finalResults = eisaFinalEvidence(batch);
  return [
    ['Name of Qualification', batch.qualificationTitle],
    ['SAQA ID', batch.saqaId],
    ['Date of EISA', [...new Set(eisaDatesOf(batch))].sort().join(', ')],
    ['Date results submitted', eisaResultsReceived(batch)],
    ['Date final results submitted', finalResults],
    ['Date of approval letter', letter],
    ['No. of days turnaround time', turnaroundDays(finalResults, letter)],
    ['Name of QP', batch.qpName],
    ['Number of candidates registered', String(f.registered)],
    ['Number of candidates who wrote', String(f.wrote)],
    ['Number of candidates competent', String(f.competent)],
    ['Number of candidates NYC', String(f.notYetCompetent)],
    ['No. accredited assessment centres used', String(accreditedCentreCount(batch))],
  ];
}

export function ddCompletedText(checklist: DdLetterChecklist | null): string {
  return checklist?.completedBy && checklist.completedAt ? `${checklist.completedBy}, ${dateOf(checklist.completedAt)}` : '—';
}
