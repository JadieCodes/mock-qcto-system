// Batch N.1: which tabs a results batch shows, in order. Pure, so the seed check can read it. A tab
// that does not apply is left out, never shown empty. The internal tabs do not depend on the role:
// the ASD, Deputy Director, Director and Chief Director see the same documents, and the role only
// decides which fields can be edited and which actions show.
import type { FisaResultsBatch, ResultsBatch } from './types';

export type ResultsTabId =
  | 'summary'
  | 'results'
  | 'evidence'
  | 'compliance'
  | 'section-e'
  | 'checklist'
  | 'chain'
  | 'letter'
  | 'report'
  | 'recommendation'
  | 'audit';

export const RESULTS_TAB_LABELS: Record<ResultsTabId, string> = {
  summary: 'Summary',
  results: 'Learner Results',
  evidence: 'Evidence',
  compliance: 'Compliance Review',
  'section-e': 'Section E',
  checklist: 'Letter Checklist',
  chain: 'Approval Chain',
  letter: 'Outcome Letter',
  report: 'Verification Report',
  recommendation: 'Certification Recommendation',
  audit: 'Audit Trail',
};

// The Outcome Letter is a draft from the Deputy Director stage onwards and final once decided.
const DRAFT_LETTER_STAGES = ['dd-review', 'director-review', 'chief-director-review'];

type TabSource = Pick<ResultsBatch | FisaResultsBatch, 'finalDecision' | 'workflow'>;

function hasLetter(batch: TabSource): boolean {
  return !!batch.finalDecision || DRAFT_LETTER_STAGES.includes(batch.workflow.stageId);
}

function hasRecommendation(batch: TabSource): boolean {
  return batch.finalDecision?.outcome === 'approved';
}

export function eisaInternalTabIds(batch: TabSource): ResultsTabId[] {
  const letter = hasLetter(batch);
  return [
    'summary',
    'results',
    'evidence',
    'compliance',
    ...(letter ? (['checklist'] as const) : []),
    'chain',
    ...(letter ? (['letter'] as const) : []),
    'report',
    ...(hasRecommendation(batch) ? (['recommendation'] as const) : []),
    'audit',
  ];
}

export function fisaInternalTabIds(batch: TabSource): ResultsTabId[] {
  return [
    'summary',
    'results',
    'evidence',
    'section-e',
    'chain',
    ...(hasLetter(batch) ? (['letter'] as const) : []),
    'report',
    ...(hasRecommendation(batch) ? (['recommendation'] as const) : []),
    'audit',
  ];
}

// The QP and the SDP see their own batch and, once it is decided, the Outcome Letter and the report.
// The module has no progress view for them, so there is no Progress tab.
export function externalTabIds(batch: Pick<TabSource, 'finalDecision'>): ResultsTabId[] {
  return ['summary', 'results', 'evidence', ...(batch.finalDecision ? (['letter', 'report'] as const) : [])];
}
