import type { ValidationIssue } from '../../shared/validation/types';
import type { ScriptModerationFinding, ScriptVerification, ScriptVerificationResult, ScriptVerificationRow, SiteVisit, VisitType } from './types';

export const SCRIPT_FINDING_LABELS: Record<ScriptModerationFinding, string> = {
  agree: 'Agree',
  disagree: 'Disagree',
};

export const SCRIPT_RESULT_LABELS: Record<ScriptVerificationResult, string> = {
  verified: 'Verified',
  'verified-with-findings': 'Verified with findings',
  'not-verified': 'Not verified',
};

export const SCRIPT_RESULT_OPTIONS = Object.keys(SCRIPT_RESULT_LABELS) as ScriptVerificationResult[];

// QCTO feedback 3.7: script verification is part of the Marking & Moderation visit itself.
export function visitHasScriptVerification(visitType: VisitType): boolean {
  return visitType === 'marking-moderation';
}

export function scriptVerificationOf(visit: SiteVisit): ScriptVerification {
  return visit.scriptVerification ?? { rows: [], overallResult: null };
}

export function emptyScriptRow(): ScriptVerificationRow {
  return { id: crypto.randomUUID(), scriptReference: '', component: '', markedOutcome: '', moderatedFinding: null, comment: '' };
}

export function isScriptRowComplete(row: ScriptVerificationRow): boolean {
  return !!row.scriptReference.trim() && !!row.component.trim() && !!row.markedOutcome.trim() && row.moderatedFinding !== null;
}

// QCTO feedback 3.7: at least one complete script row and an overall result before Submit Report.
export function getScriptVerificationIssues(visit: SiteVisit): ValidationIssue[] {
  if (!visitHasScriptVerification(visit.visitType)) return [];
  const { rows, overallResult } = scriptVerificationOf(visit);
  const issues: ValidationIssue[] = [];
  if (rows.length === 0) issues.push({ field: 'script-rows', message: 'Add at least one verified script to the script verification sample.' });
  const incomplete = rows.filter((r) => !isScriptRowComplete(r)).length;
  if (incomplete > 0) {
    issues.push({ field: 'script-rows-incomplete', message: `Complete the reference, component, marked outcome and moderated finding on ${incomplete} script row(s).` });
  }
  if (!overallResult) issues.push({ field: 'script-result', message: 'Choose the overall script verification result.' });
  return issues;
}
