import { getAuditTrail } from '../../shared/audit/auditLog';
import type { AuditEntry } from '../../shared/audit/types';
import type { QsaAddendumApplication } from './types';
import { EVAL_WORKFLOW, IAC_REMEDIATION_LABEL, isQasaUnderReview, OUTCOME_WORKFLOW, RETURN_TO_QP_LABEL } from './workflow';

// QCTO feedback 05.8: the QP sees the stage and status of its QASA, not the audit trail. This
// reads the trail only to find dates, and returns no names and no internal comments — the one
// comment it returns is the remediation comment the QP has to act on.

export type QpProgressStepId =
  | 'submitted'
  | 'asd-evaluation'
  | 'dd-review'
  | 'director-office-review'
  | 'iac-review'
  | 'ceo-signature'
  | 'outcome';

export type QpProgressStepState = 'done' | 'current' | 'upcoming';

export interface QpProgressStep {
  id: QpProgressStepId;
  label: string;
  state: QpProgressStepState;
  // Only set on "Submitted" and on the current step: the date it entered that stage.
  enteredAt: string | null;
}

export interface QpProgress {
  steps: QpProgressStep[];
  outcome: 'approved' | 'remediation' | null;
  remediationComment: string | null;
  underReviewSince: string | null;
}

const STEP_LABELS: Record<Exclude<QpProgressStepId, 'outcome'>, string> = {
  submitted: 'Submitted',
  'asd-evaluation': 'ASD evaluation',
  'dd-review': 'Deputy Director moderation',
  'director-office-review': 'Director Office',
  'iac-review': 'IAC',
  'ceo-signature': 'CEO signature',
};

const STEP_ORDER: QpProgressStepId[] = ['submitted', 'asd-evaluation', 'dd-review', 'director-office-review', 'iac-review', 'ceo-signature', 'outcome'];

function lastEntry(entries: AuditEntry[], matches: (entry: AuditEntry) => boolean): AuditEntry | undefined {
  return entries.slice().reverse().find(matches);
}

// The newest evaluation audit entry whose action led to `stageId`.
function enteredEvalStageAt(entries: AuditEntry[], stageId: string): string | null {
  const labels = new Set(EVAL_WORKFLOW.actions.filter((a) => a.toStage === stageId).map((a) => a.label));
  return lastEntry(entries, (e) => labels.has(e.action))?.timestamp ?? null;
}

export function qpProgressOf(app: QsaAddendumApplication): QpProgress {
  const evalTrail = getAuditTrail('qsa-addendum-evaluation', app.id);
  const outcomeTrail = getAuditTrail('qsa-addendum-outcome-letter', app.id);
  const submittedAt = app.acknowledgementIssuedAt || app.submissionDate;

  let current: QpProgressStepId;
  let enteredAt: string | null;
  let lastDone: number;
  let outcome: QpProgress['outcome'] = null;
  let remediationComment: string | null = null;

  const stage = app.evalState.stageId;
  if (stage === 'qp-corrections') {
    const returned = lastEntry(evalTrail, (e) => e.action === RETURN_TO_QP_LABEL || e.action === IAC_REMEDIATION_LABEL);
    current = 'outcome';
    outcome = 'remediation';
    enteredAt = returned?.timestamp ?? null;
    remediationComment = returned?.note ?? null;
    // Everything up to the step that sent it back counts as done.
    lastDone = STEP_ORDER.indexOf(returned?.action === IAC_REMEDIATION_LABEL ? 'iac-review' : 'asd-evaluation');
  } else if (stage === 'approved') {
    const signLabel = OUTCOME_WORKFLOW.actions.find((a) => a.id === 'outcome-sign')?.label;
    if (app.outcomeState.stageId === 'signed') {
      current = 'outcome';
      outcome = 'approved';
      enteredAt = lastEntry(outcomeTrail, (e) => e.action === signLabel)?.timestamp ?? null;
    } else {
      current = 'ceo-signature';
      enteredAt = enteredEvalStageAt(evalTrail, 'approved');
    }
    lastDone = STEP_ORDER.indexOf(current) - 1;
  } else {
    current = STEP_ORDER.includes(stage as QpProgressStepId) ? (stage as QpProgressStepId) : 'asd-evaluation';
    enteredAt = enteredEvalStageAt(evalTrail, stage) ?? (current === 'asd-evaluation' ? submittedAt : null);
    lastDone = STEP_ORDER.indexOf(current) - 1;
  }

  const steps: QpProgressStep[] = STEP_ORDER.map((id, index) => {
    const state: QpProgressStepState = id === current ? 'current' : index <= lastDone ? 'done' : 'upcoming';
    const label = id === 'outcome' ? (outcome === 'remediation' ? 'Remediation requested' : 'Approved') : STEP_LABELS[id];
    return { id, label, state, enteredAt: id === 'submitted' ? submittedAt : state === 'current' ? enteredAt : null };
  });

  return { steps, outcome, remediationComment, underReviewSince: isQasaUnderReview(app) ? (app.review?.startedAt ?? null) : null };
}
