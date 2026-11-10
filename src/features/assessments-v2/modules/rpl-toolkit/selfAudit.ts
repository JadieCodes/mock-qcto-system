import { allRplSelfAuditQuestions } from '../../mock/data/rplToolkitChecklistItems';
import { qpDirectoryEntryFor } from '../../mock/data/qpDirectory';
import type { ValidationIssue } from '../../shared/validation/types';
import type { RplApproved, RplQctoEvaluation, RplSelfAudit, RplSelfAuditAnswer, RplSelfAuditLine, RplToolkitApplication } from './types';

export const RPL_ANSWER_OPTIONS: { value: RplSelfAuditAnswer; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'in-process', label: 'In process' },
];

export const RPL_APPROVED_OPTIONS: { value: Exclude<RplApproved, ''>; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

// Designation shown for the ASD in "Evaluated by (QCTO official)" until they change it.
export const RPL_EVALUATOR_DEFAULT_DESIGNATION = 'ASD';

export function blankSelfAuditLines(): Record<string, RplSelfAuditLine> {
  return Object.fromEntries(allRplSelfAuditQuestions().map((q) => [q.id, { answer: null, notes: '', qctoFeedback: '' }]));
}

// "Self audit checklist completed by": the QP's name and organisation are pre-filled.
export function blankSelfAudit(qpId: string, qpName: string): RplSelfAudit {
  return {
    lines: blankSelfAuditLines(),
    completedBy: {
      fullName: qpName,
      designation: '',
      organisation: qpDirectoryEntryFor(qpId)?.organisation ?? '',
      date: new Date().toISOString().slice(0, 10),
    },
  };
}

export function blankQctoEvaluation(): RplQctoEvaluation {
  return { approved: '', comments: '', evaluatedByName: '', evaluatedByDesignation: '', evaluatedOn: '' };
}

// A record stored before Batch W has no self-audit: it gets a blank one (never overwriting an existing one).
export function selfAuditOf(application: Pick<RplToolkitApplication, 'selfAudit' | 'qpId' | 'qpName'>): RplSelfAudit {
  return application.selfAudit ?? blankSelfAudit(application.qpId, application.qpName);
}

export function qctoEvaluationOf(application: Pick<RplToolkitApplication, 'qctoEvaluation'>): RplQctoEvaluation {
  return application.qctoEvaluation ?? blankQctoEvaluation();
}

// "Answered on the previous checklist": a toolkit evaluated on the checklist used before Batch W.
export function hasLegacyChecklistAnswers(application: Pick<RplToolkitApplication, 'checklist'>): boolean {
  return application.checklist.some((section) => section.items.some((item) => item.answer !== null));
}

// What the QP must complete before submitting: every question answered with its notes ("n/a" is
// fine under No, with the reason in the notes), and the "completed by" block.
export function selfAuditIssues(audit: RplSelfAudit): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const question of allRplSelfAuditQuestions()) {
    const line = audit.lines[question.id];
    if (!line?.answer) issues.push({ field: question.id, message: `${question.id} — select Yes, No or In process.` });
    else if (!line.notes.trim()) issues.push({ field: question.id, message: `${question.id} — add Notes / Evidence (write "n/a" and the reason under No).` });
  }
  const by = audit.completedBy;
  if (!by.fullName.trim()) issues.push({ field: 'completedBy.fullName', message: 'Enter the full name of the person who completed the self audit.' });
  if (!by.designation.trim()) issues.push({ field: 'completedBy.designation', message: 'Enter the designation.' });
  if (!by.organisation.trim()) issues.push({ field: 'completedBy.organisation', message: 'Enter the organisation.' });
  if (!by.date) issues.push({ field: 'completedBy.date', message: 'Enter the date.' });
  return issues;
}

// What the ASD must complete before sending on or returning (CR-011: a comment on every line).
export function qctoFeedbackIssues(audit: RplSelfAudit, evaluation: RplQctoEvaluation): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const question of allRplSelfAuditQuestions()) {
    if (!audit.lines[question.id]?.qctoFeedback.trim()) issues.push({ field: question.id, message: `${question.id} — QCTO feedback is required.` });
  }
  if (evaluation.approved === '') issues.push({ field: 'approved', message: 'Select whether the RPL Toolkit is approved (Yes or No).' });
  return issues;
}

export function answeredCount(audit: RplSelfAudit): number {
  return allRplSelfAuditQuestions().filter((q) => audit.lines[q.id]?.answer).length;
}
