import type { ValidationIssue } from '../../shared/validation/types';
import type { ScriptModerationFinding, ScriptVerification, ScriptVerificationResult, ScriptVerificationRow, SiteVisit, VisitType } from './types';
import { visitQualificationsOf } from './visitQualifications';

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

// Batch V1 (05.13): a new row starts on the visit's only qualification, or unchosen when there are several.
export function emptyScriptRow(qualificationId?: string): ScriptVerificationRow {
  return { id: crypto.randomUUID(), qualificationId, scriptReference: '', component: '', markedOutcome: '', moderatedFinding: null, comment: '' };
}

// Batch V1 (05.13): the qualification a script belongs to. Rows stored before Batch V1 have none and
// belong to the visit's only qualification.
export function scriptQualificationIdOf(visit: SiteVisit, row: ScriptVerificationRow): string | null {
  const list = visitQualificationsOf(visit);
  if (row.qualificationId && list.some((q) => q.id === row.qualificationId)) return row.qualificationId;
  return list.length === 1 ? list[0].id : null;
}

// Sample size per qualification (in the visit's order) and in total.
export function scriptSampleSizes(visit: SiteVisit): { perQualification: { id: string; title: string; count: number }[]; total: number } {
  const { rows } = scriptVerificationOf(visit);
  return {
    perQualification: visitQualificationsOf(visit).map((q) => ({
      id: q.id,
      title: q.qualificationTitle,
      count: rows.filter((r) => scriptQualificationIdOf(visit, r) === q.id).length,
    })),
    total: rows.length,
  };
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
  const noQualification = rows.filter((r) => scriptQualificationIdOf(visit, r) === null).length;
  if (noQualification > 0) {
    issues.push({ field: 'script-qualification', message: `Choose the qualification on ${noQualification} script row(s).` });
  }
  const incomplete = rows.filter((r) => !isScriptRowComplete(r)).length;
  if (incomplete > 0) {
    issues.push({ field: 'script-rows-incomplete', message: `Complete the reference, component, marked outcome and moderated finding on ${incomplete} script row(s).` });
  }
  if (!overallResult) issues.push({ field: 'script-result', message: 'Choose the overall script verification result.' });
  return issues;
}
