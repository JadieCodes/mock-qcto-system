// Batch N1 (05.19): the verification code a batch gets when it receives its final decision
// (approved or declined). It is printed on every letter, report and register line.
//   EISA: QCTO/<last EISA date yyyymmdd>/V<yy>-<n>      e.g. QCTO/20180723/V18-8
//   FISA: QCTOSP/<last FISA date yyyymmdd>/C<yy>-<n>    e.g. QCTOSP/20221006/C24-01
// <yy> is the two-digit start year of QCTO's financial year (1 April to 31 March) of the decision
// date. <n> is a running number per financial year, separately for EISA and FISA.
// Assumption (progress.md, Batch N1): the FISA number is padded to two digits as in QCTO's
// example "C24-01"; the EISA number is not, as in "V18-8".
import type { FisaResultsBatch, ResultsBatch, ResultsTrack } from './types';

const CODE_PATTERN: Record<ResultsTrack, RegExp> = {
  eisa: /^QCTO\/\d{8}\/V(\d{2})-(\d+)$/,
  fisa: /^QCTOSP\/\d{8}\/C(\d{2})-(\d+)$/,
};

// "2027-03-31" -> 2026 (financial year 2026/27); "2027-04-01" -> 2027.
export function financialYearStartOf(isoDate: string): number {
  const [year, month] = isoDate.split('-').map(Number);
  return month >= 4 ? year : year - 1;
}

export function lastDateOf(dates: string[]): string {
  return [...dates].sort().at(-1) ?? '';
}

export function firstDateOf(dates: string[]): string {
  return [...dates].sort().at(0) ?? '';
}

export function nextVerificationNumber(track: ResultsTrack, decisionDate: string, existingCodes: string[]): number {
  const yy = String(financialYearStartOf(decisionDate) % 100).padStart(2, '0');
  const numbers = existingCodes.flatMap((code) => {
    const match = CODE_PATTERN[track].exec(code);
    return match && match[1] === yy ? [Number(match[2])] : [];
  });
  return Math.max(0, ...numbers) + 1;
}

export function buildVerificationCode(track: ResultsTrack, lastAssessmentDate: string, decisionDate: string, existingCodes: string[]): string {
  const yy = String(financialYearStartOf(decisionDate) % 100).padStart(2, '0');
  const n = nextVerificationNumber(track, decisionDate, existingCodes);
  const compact = lastAssessmentDate.replace(/-/g, '');
  return track === 'eisa' ? `QCTO/${compact}/V${yy}-${n}` : `QCTOSP/${compact}/C${yy}-${String(n).padStart(2, '0')}`;
}

type CodedBatch = Pick<ResultsBatch | FisaResultsBatch, 'verificationCode' | 'finalDecision'>;

// Batch W (QCTO process map 12): the code is allocated when the batch first reaches the ASD. A batch
// stored before Batch W has it only on its final decision.
export function verificationCodeOf(batch: CodedBatch): string {
  return batch.verificationCode || batch.finalDecision?.verificationCode || '';
}

export function verificationCodesOf(batches: CodedBatch[]): string[] {
  return batches.flatMap((b) => {
    const code = verificationCodeOf(b);
    return code ? [code] : [];
  });
}

// Batch W: gives a batch stored without a code the one it would have got when it reached the ASD,
// numbered in the order the batches reached the ASD. Deterministic and only touches batches without
// a code, so running it on every load is safe.
export function allocateMissingCodes<T extends CodedBatch>(
  batches: T[],
  track: ResultsTrack,
  rules: { reachedAsd: (b: T) => boolean; allocatedOn: (b: T) => string; lastDate: (b: T) => string },
): T[] {
  const existing = verificationCodesOf(batches);
  const missing = batches.filter((b) => !verificationCodeOf(b) && rules.reachedAsd(b)).sort((a, b) => rules.allocatedOn(a).localeCompare(rules.allocatedOn(b)));
  if (missing.length === 0) return batches;
  const assigned = new Map<T, string>();
  for (const batch of missing) {
    const code = buildVerificationCode(track, rules.lastDate(batch), rules.allocatedOn(batch), existing);
    existing.push(code);
    assigned.set(batch, code);
  }
  return batches.map((b) => (assigned.has(b) ? { ...b, verificationCode: assigned.get(b) } : b));
}
