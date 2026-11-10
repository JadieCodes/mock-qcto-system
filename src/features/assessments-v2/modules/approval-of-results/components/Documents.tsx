import type { AuditEntry } from '../../../shared/audit/types';
import { ddLetterChecklistModel, eisaVerificationReportModel, type DocAudience, type EisaReportContext } from '../eisaVerificationReport';
import { fisaVerificationReportModel } from '../fisaVerificationReport';
import { eisaOutcomeLetter, eisaRecommendationLetter, fisaOutcomeLetter, fisaRecommendationLetter } from '../outcomeLetters';
import type { FisaResultsBatch, ResultsBatch } from '../types';
import { DocumentView } from './DocumentView';
import { OutcomeLetterView } from './OutcomeLetterView';

// Batch N.1: one component per document. Each builds the same model its download uses, so the
// screen and the download cannot differ. Before the final decision the outcome letter and the
// report carry the Draft banner.

export function EisaOutcomeLetterDoc({ batch }: { batch: ResultsBatch }) {
  return <OutcomeLetterView model={eisaOutcomeLetter(batch, !batch.finalDecision)} />;
}

export function FisaOutcomeLetterDoc({ batch }: { batch: FisaResultsBatch }) {
  return <OutcomeLetterView model={fisaOutcomeLetter(batch, !batch.finalDecision)} />;
}

// Internal only; an approved batch has one, any other batch has nothing to show.
export function EisaRecommendationLetterDoc({ batch }: { batch: ResultsBatch }) {
  const model = eisaRecommendationLetter(batch);
  return model ? <OutcomeLetterView model={model} /> : null;
}

export function FisaRecommendationLetterDoc({ batch }: { batch: FisaResultsBatch }) {
  const model = fisaRecommendationLetter(batch);
  return model ? <OutcomeLetterView model={model} /> : null;
}

export function EisaVerificationReportDoc({ batch, audit, ctx, audience }: { batch: ResultsBatch; audit: AuditEntry[]; ctx: EisaReportContext; audience: DocAudience }) {
  return <DocumentView model={eisaVerificationReportModel(batch, audit, ctx, audience)} />;
}

export function FisaVerificationReportDoc({ batch, audit, audience }: { batch: FisaResultsBatch; audit: AuditEntry[]; audience: DocAudience }) {
  return <DocumentView model={fisaVerificationReportModel(batch, audit, audience)} />;
}

// The Deputy Director's checklist, read-only (the editable one is DdLetterChecklistPanel).
export function DdLetterChecklistDoc({ batch }: { batch: ResultsBatch }) {
  return <DocumentView model={ddLetterChecklistModel(batch)} />;
}
