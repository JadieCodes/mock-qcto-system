// EISA results per learner and per component — THE calculation. Follows the "QCTO EISA
// Calculator, updated 01/12/2021" and the "QAS Addendum Control Sheet" (Batch L1.1). Everything
// that shows a result, an EISA percentage, a competence rate or absenteeism reads it from here,
// so a change to the rule is a change to this file only.
//
// Rule:
// - Component percentage = mark ÷ highest mark (the component total) × 100.
// - Weighted value = component percentage × weighting ÷ 100.
// - EISA Percentage Obtained (decimal) = the sum of the weighted values, rounded to 2 decimals
//   (QCTO's formula). EISA Percentage Obtained (final) = that value rounded half-up to a whole
//   number (QCTO's written step: 1.4 -> 1, 1.5 -> 2). This is the figure written on File 03.
// - A component is Competent when the mark is at least that component's lowest mark (the
//   competence mark set in the QASA), otherwise Not yet competent.
// - A learner is Competent when the final EISA percentage is at least the QASA's Addendum pass %
//   AND the learner is competent in every component; otherwise Not yet competent, with the reason.
// - A learner marked Absent has no result and does not count as having written.
// - Batch: registered = learners on the batch; wrote = not absent; competence rate =
//   competent ÷ wrote; absenteeism = absent ÷ registered; throughput rate = wrote ÷ registered.
// Open questions (progress.md, "Batch L1.1"): whether the lowest mark is a sub-minimum, whole
// number or 2-decimal rounding, and what FLC stands for.
import type { EisaLearnerResult, ResultsComponent } from './types';

export type EisaLearnerOutcome = 'competent' | 'not-yet-competent' | 'absent';

export interface ComponentResult {
  componentId: string;
  mark: number | null;
  // Component percentage and weighted value, 2 decimals; null when there is no mark.
  percent: number | null;
  weightedValue: number | null;
  competent: boolean;
}

export interface LearnerCalculation {
  outcome: EisaLearnerOutcome;
  components: ComponentResult[];
  // EISA Percentage Obtained: null when the learner was absent.
  eisaPercentDecimal: number | null;
  eisaPercentFinal: number | null;
  passPercent: number;
  // "Below pass %" and/or "Not yet competent in <component>"; empty when competent or absent.
  reasons: string[];
}

export interface BatchFigures {
  registered: number;
  wrote: number;
  absent: number;
  competent: number;
  notYetCompetent: number;
  competenceRatePercent: number;
  absenteeismPercent: number;
  // Batch N1: wrote / registered (QCTO's tracking register).
  throughputRatePercent: number;
}

// The tiny offset keeps values such as 44.5 or 1.005 from falling to the wrong side in floating point.
const EPSILON = 1e-9;

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100 + EPSILON) / 100;
}

// QCTO's written step: 1.4 -> 1, 1.5 -> 2 (half rounds up).
export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5 + EPSILON);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function percentOf(part: number, whole: number): number {
  return whole === 0 ? 0 : roundToOneDecimal((part / whole) * 100);
}

export const BELOW_PASS_PERCENT_REASON = 'Below pass %';

export function notYetCompetentInReason(componentName: string): string {
  return `Not yet competent in ${componentName}`;
}

export function reasonText(calc: LearnerCalculation): string {
  return calc.reasons.join('; ');
}

export function calculateLearnerResult(components: ResultsComponent[], learner: EisaLearnerResult, passPercent: number): LearnerCalculation {
  if (learner.absent) {
    return {
      outcome: 'absent',
      components: components.map((c) => ({ componentId: c.id, mark: null, percent: null, weightedValue: null, competent: false })),
      eisaPercentDecimal: null,
      eisaPercentFinal: null,
      passPercent,
      reasons: [],
    };
  }
  let weightedSum = 0;
  const results = components.map((c): ComponentResult => {
    const mark = learner.marks[c.id] ?? null;
    const rawPercent = mark !== null && c.highestMark > 0 ? (mark / c.highestMark) * 100 : 0;
    const rawWeighted = (rawPercent * c.weightingPercent) / 100;
    weightedSum += rawWeighted;
    return {
      componentId: c.id,
      mark,
      percent: mark === null ? null : roundToTwoDecimals(rawPercent),
      weightedValue: mark === null ? null : roundToTwoDecimals(rawWeighted),
      competent: mark !== null && mark >= c.lowestMark,
    };
  });
  const eisaPercentDecimal = roundToTwoDecimals(weightedSum);
  const eisaPercentFinal = roundHalfUp(eisaPercentDecimal);
  const reasons: string[] = [];
  if (eisaPercentFinal < passPercent) reasons.push(BELOW_PASS_PERCENT_REASON);
  components.forEach((c, i) => {
    if (!results[i].competent) reasons.push(notYetCompetentInReason(c.name));
  });
  return {
    outcome: results.length > 0 && reasons.length === 0 ? 'competent' : 'not-yet-competent',
    components: results,
    eisaPercentDecimal,
    eisaPercentFinal,
    passPercent,
    reasons,
  };
}

export function batchFiguresOf(batch: { components: ResultsComponent[]; addendumPassPercent: number; learnerResults: EisaLearnerResult[] }): BatchFigures {
  const outcomes = batch.learnerResults.map((l) => calculateLearnerResult(batch.components, l, batch.addendumPassPercent).outcome);
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
    throughputRatePercent: percentOf(wrote, registered),
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

export function throughputRateText(f: BatchFigures): string {
  return `${f.throughputRatePercent}% (${f.wrote} of ${f.registered} registered)`;
}
