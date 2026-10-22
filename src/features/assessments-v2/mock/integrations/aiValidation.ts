import type { ChecklistSection } from '../../shared/checklist/types';
import { notImplemented, type BackendStubResult } from './types';

// CR-009: AI-assisted pre-checks ahead of the DD/ASD evaluation review.
export function aiAssistedEvaluationPrecheck(submissionId: string): Promise<BackendStubResult> {
  return notImplemented('CR-009', `No AI-assisted pre-check available for submission "${submissionId}" yet.`);
}

export type QsaAutoEvaluationOutcome = 'positive' | 'negative';

// Row 7 (test findings): a simulated stand-in for CR-009/CR-010's real AI-assisted evaluation
// — this one actually runs (the stubs above don't), standing in only until the real backend
// exists. A "No" on a mandatory line makes the outcome NEGATIVE; otherwise POSITIVE. Which
// lines are mandatory is the caller's `mandatoryItemIds` ('all' = every line is mandatory,
// the default in `qsa-addendum/config.ts`) so the rule can be narrowed without touching this
// function.
export function autoEvaluateQsaChecklist(
  sections: ChecklistSection[],
  mandatoryItemIds: string[] | 'all',
): QsaAutoEvaluationOutcome {
  const isMandatory = (itemId: string) => mandatoryItemIds === 'all' || mandatoryItemIds.includes(itemId);
  const hasNegativeMandatoryAnswer = sections.some((section) =>
    section.items.some((item) => isMandatory(item.id) && item.answer === 'no'),
  );
  return hasNegativeMandatoryAnswer ? 'negative' : 'positive';
}

// CR-010: hybrid automatic/manual validation of the 44-item QSA Addendum checklist —
// auto-check objective items (SAQA ID, NQF level, credits, totals), leave subjective
// items to manual review. The comment-field portion is already live (CR-011); this is
// the auto-checking portion.
export function hybridValidateQsaChecklist(submissionId: string): Promise<BackendStubResult> {
  return notImplemented('CR-010', `No automated objective-item checking for submission "${submissionId}" yet.`);
}

// CR-022: the same hybrid automatic/manual validation logic as CR-010, applied to the
// instrument validation checklist instead of the QSA Addendum checklist.
export function hybridValidateInstrumentChecklist(validationId: string): Promise<BackendStubResult> {
  return notImplemented('CR-022', `No automated checking for instrument validation "${validationId}" yet.`);
}
