// QCTO feedback 29.31: EISA results per learner and per component — THE calculation.
//
// ASSUMPTION, until QCTO sends its calculator spreadsheet: the rule below is our reading of
// row 29.31 and must be checked against that spreadsheet when it arrives (open question in
// docs/assessments-v2/progress.md, "Batch L1"). Everything that shows a result, a weighted
// score, a competence rate or absenteeism reads it from here, so a change to the rule is a
// change to this file only.
//
// Assumed rule:
// - A component is competent when the mark is at least that component's pass mark.
// - A learner is Competent only when competent in every component; otherwise Not yet competent.
// - A learner marked Absent has no result and does not count as having written.
// - Weighted score = sum of (mark ÷ total marks × weighting), as a %, rounded to one decimal.
// - Batch: registered = learners on the batch; wrote = not absent; competence rate =
//   competent ÷ wrote; absenteeism = absent ÷ registered.
import type { EisaLearnerResult, ResultsComponent } from './types';

export type EisaLearnerOutcome = 'competent' | 'not-yet-competent' | 'absent';

export interface ComponentResult {
  componentId: string;
  mark: number | null;
  competent: boolean;
}

export interface LearnerCalculation {
  outcome: EisaLearnerOutcome;
  components: ComponentResult[];
  // Null when the learner was absent.
  weightedScorePercent: number | null;
}

export interface BatchFigures {
  registered: number;
  wrote: number;
  absent: number;
  competent: number;
  notYetCompetent: number;
  competenceRatePercent: number;
  absenteeismPercent: number;
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function percentOf(part: number, whole: number): number {
  return whole === 0 ? 0 : roundToOneDecimal((part / whole) * 100);
}

export function calculateLearnerResult(components: ResultsComponent[], learner: EisaLearnerResult): LearnerCalculation {
  if (learner.absent) {
    return { outcome: 'absent', components: components.map((c) => ({ componentId: c.id, mark: null, competent: false })), weightedScorePercent: null };
  }
  const results = components.map((c) => {
    const mark = learner.marks[c.id] ?? null;
    return { componentId: c.id, mark, competent: mark !== null && mark >= c.passMark };
  });
  const weighted = components.reduce((sum, c) => {
    const mark = learner.marks[c.id] ?? 0;
    return sum + (c.totalMarks > 0 ? (mark / c.totalMarks) * c.weightingPercent : 0);
  }, 0);
  return {
    outcome: results.length > 0 && results.every((r) => r.competent) ? 'competent' : 'not-yet-competent',
    components: results,
    weightedScorePercent: roundToOneDecimal(weighted),
  };
}

export function batchFiguresOf(batch: { components: ResultsComponent[]; learnerResults: EisaLearnerResult[] }): BatchFigures {
  const outcomes = batch.learnerResults.map((l) => calculateLearnerResult(batch.components, l).outcome);
  const registered = outcomes.length;
  const absent = outcomes.filter((o) => o === 'absent').length;
  const competent = outcomes.filter((o) => o === 'competent').length;
  const wrote = registered - absent;
  return {
    registered,
    wrote,
    absent,
    competent,
    notYetCompetent: wrote - competent,
    competenceRatePercent: percentOf(competent, wrote),
    absenteeismPercent: percentOf(absent, registered),
  };
}

export const EISA_OUTCOME_LABELS: Record<EisaLearnerOutcome, string> = {
  competent: 'Competent',
  'not-yet-competent': 'Not yet competent',
  absent: 'Absent',
};

// The compact forms for tables and downloads: "75% (3 of 4 wrote)" and "1 of 5 (20%)".
export function competenceRateText(f: BatchFigures): string {
  return `${f.competenceRatePercent}% (${f.competent} of ${f.wrote} wrote)`;
}

export function absenteeismText(f: BatchFigures): string {
  return `${f.absent} of ${f.registered} (${f.absenteeismPercent}%)`;
}
