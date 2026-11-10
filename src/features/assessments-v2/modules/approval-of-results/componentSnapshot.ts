import { approvedAddendumOf, approvedComponentsOf } from '../qsa-addendum/assessmentDetails';
import type { QsaAddendumApplication } from '../qsa-addendum/types';
import { isQasaApproved } from '../qsa-addendum/workflow';
import { componentEisaDates } from './componentDates';
import type { ResultsComponent } from './types';

export const NO_COMPONENTS_MESSAGE =
  'Results cannot be captured for this EISA yet: the approved QASA for this qualification has no assessment components. The ASD must add the components (with highest and lowest marks) to the QASA first.';

export const NO_PASS_PERCENT_MESSAGE =
  'Results cannot be captured for this EISA yet: the approved QASA for this qualification has no addendum pass %. The ASD must add it to the QASA first.';

// What a new batch is built from: the approved QASA's components and Addendum pass %.
export interface ResultsRules {
  components: ResultsComponent[];
  addendumPassPercent: number | null;
}

// The message that blocks capture, or null when the QASA gives everything a batch needs.
export function resultsRulesIssue(rules: ResultsRules): string | null {
  if (rules.components.length === 0) return NO_COMPONENTS_MESSAGE;
  if (rules.addendumPassPercent === null) return NO_PASS_PERCENT_MESSAGE;
  return null;
}

// QCTO feedback 29.31: the components of a results batch come from the approved QASA for the
// same QP and qualification (same match as the EISA Calendar). Under review (05.2) the approved
// components are the ones in the Certification hand-off. Batch L1.1: with the Addendum pass %
// and each component's lowest and highest mark, so later QASA changes do not move a batch.
export function snapshotResultsRules(
  qasas: QsaAddendumApplication[],
  sitting: { qpId: string; qualificationTitle: string; sittingDate: string },
): ResultsRules {
  const qasa = qasas.find(
    (a) => isQasaApproved(a) && a.qpId === sitting.qpId && a.qualificationTitle.toLowerCase() === sitting.qualificationTitle.toLowerCase(),
  );
  const components = qasa ? approvedComponentsOf(qasa) : [];
  const dates = componentEisaDates(sitting.sittingDate, components.length);
  return {
    addendumPassPercent: qasa ? approvedAddendumOf(qasa).passPercent : null,
    components: components.map((c, i) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      weightingPercent: c.weightingPercent,
      highestMark: c.highestMark,
      lowestMark: c.lowestMark,
      eisaDate: dates[i],
    })),
  };
}

// Batch N1: the SAQA ID, NQF level and credits printed on the outcome letter, copied from the same
// approved QASA when the batch is created.
export function qualificationDetailsOf(
  qasas: QsaAddendumApplication[],
  sitting: { qpId: string; qualificationTitle: string },
): { saqaId: string; nqfLevel: string; credits: string } {
  const qasa = qasas.find(
    (a) => isQasaApproved(a) && a.qpId === sitting.qpId && a.qualificationTitle.toLowerCase() === sitting.qualificationTitle.toLowerCase(),
  );
  return { saqaId: qasa?.saqaId ?? 'Pending', nqfLevel: qasa?.nqfLevel ?? '', credits: qasa?.credits ?? '' };
}
