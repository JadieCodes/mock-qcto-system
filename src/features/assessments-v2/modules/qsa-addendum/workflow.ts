import type { IacOutcomeOption } from '../../shared/iac/types';
import type { WorkflowDefinition } from '../../shared/workflow/types';
import { IAC_OUTCOME_RECORDER_ROLE, QASA_DIRECTOR_OFFICE_ROLE, QASA_REVIEW_STARTER_ROLE } from './config';
import type { QsaAddendumApplication } from './types';

// Audit-entry action labels the screens look up to show the latest note for a step.
export const RETURN_TO_DD_LABEL = 'Return to DD';
export const APPROVE_FOR_TABLING_LABEL = 'Approve for tabling';
export const IAC_REMEDIATION_LABEL = 'Record IAC outcome: Remediation requested';
export const RETURN_TO_QP_LABEL = 'Return to QP for corrections';
export const START_REVIEW_LABEL = 'Start review';

// CR-014 Flow 1: evaluation approval. QCTO feedback 2.1 (29 Oct 2026): ASD evaluates -> DD
// moderates -> Director Office quality-assures and approves for tabling -> the DD presents at
// the IAC and records its outcome. The CEO never appears here (CR-008).
//
// Row 7 (test findings): the ASD does not choose between `eval-send-to-dd` and
// `eval-return-to-qp` — the mock/integrations/aiValidation.ts `autoEvaluateQsaChecklist`
// result picks exactly one of these two for them (positive -> DD, negative -> QP), enforced
// again server-side in api.ts's `performEvaluationAction`. Both actions stay as two separate
// workflow actions (not one conditional one) so the engine's normal fromStage/toStage shape
// still applies — only the UI/API layer decides which one is actually reachable.
export const EVAL_WORKFLOW: WorkflowDefinition = {
  id: 'qsa-addendum-evaluation',
  stages: [
    { id: 'asd-evaluation', label: 'ASD evaluation', allowedRoles: ['ASD'] },
    { id: 'qp-corrections', label: 'Corrections requested from QP', allowedRoles: ['QP'] },
    { id: 'dd-review', label: 'Deputy Director moderation', allowedRoles: ['Deputy Director'] },
    { id: 'director-office-review', label: 'Director Office quality assurance', allowedRoles: [QASA_DIRECTOR_OFFICE_ROLE] },
    { id: 'iac-review', label: 'Awaiting IAC outcome', allowedRoles: [IAC_OUTCOME_RECORDER_ROLE] },
    // QCTO feedback 05.2: the only action from here is the DD starting a review. api.ts also
    // checks the CEO has signed the feedback letter and no review is already running.
    { id: 'approved', label: 'Approved', allowedRoles: [QASA_REVIEW_STARTER_ROLE] },
  ],
  actions: [
    { id: 'eval-send-to-dd', label: 'Send to Deputy Director', fromStage: 'asd-evaluation', toStage: 'dd-review', kind: 'advance' },
    // CR-012: corrections only ever travel DD -> ASD -> QP. There is no direct DD -> QP action
    // anywhere — only the ASD can hand work to the QP.
    {
      id: 'eval-return-to-qp',
      label: RETURN_TO_QP_LABEL,
      fromStage: 'asd-evaluation',
      toStage: 'qp-corrections',
      kind: 'send-back',
    },
    { id: 'eval-qp-resubmit', label: 'Resubmit to ASD', fromStage: 'qp-corrections', toStage: 'asd-evaluation', kind: 'advance' },
    {
      id: 'eval-dd-return-to-asd',
      label: 'Return to ASD',
      fromStage: 'dd-review',
      toStage: 'asd-evaluation',
      kind: 'send-back',
      requiresNote: true,
    },
    {
      id: 'eval-dd-send-to-director-office',
      label: 'Send to Director Office',
      fromStage: 'dd-review',
      toStage: 'director-office-review',
      kind: 'advance',
      requiresDifferentActor: true,
    },
    // QCTO feedback 2.1: the engine only compares against the DD who sent it; api.ts also
    // checks the Director Office person was not the ASD on the same submission.
    {
      id: 'eval-do-approve-for-tabling',
      label: APPROVE_FOR_TABLING_LABEL,
      fromStage: 'director-office-review',
      toStage: 'iac-review',
      kind: 'advance',
      requiresDifferentActor: true,
    },
    {
      id: 'eval-do-return-to-dd',
      label: RETURN_TO_DD_LABEL,
      fromStage: 'director-office-review',
      toStage: 'dd-review',
      kind: 'send-back',
      requiresNote: true,
      requiresDifferentActor: true,
    },
    // CR-016 / QCTO feedback 2.1: the DD records the IAC's outcome. Remediation returns the
    // QASA to the QP, the same way a negative evaluation does. QCTO feedback 05.7: a QASA is
    // never declined — if the IAC is not satisfied it always goes back for remediation.
    {
      id: 'eval-iac-approve',
      label: 'Record IAC outcome: Approved',
      fromStage: 'iac-review',
      toStage: 'approved',
      kind: 'advance',
    },
    {
      id: 'eval-iac-remediation',
      label: IAC_REMEDIATION_LABEL,
      fromStage: 'iac-review',
      toStage: 'qp-corrections',
      kind: 'send-back',
      requiresNote: true,
    },
    // QCTO feedback 05.2: review an approved QASA through the normal route again. The reason
    // is mandatory and lands in the audit trail.
    {
      id: 'eval-start-review',
      label: START_REVIEW_LABEL,
      fromStage: 'approved',
      toStage: 'asd-evaluation',
      kind: 'send-back',
      requiresNote: true,
    },
  ],
};

export const IAC_OUTCOME_ACTION_IDS = ['eval-iac-approve', 'eval-iac-remediation'] as const;
export type IacOutcomeActionId = (typeof IAC_OUTCOME_ACTION_IDS)[number];

export const IAC_OUTCOME_OPTIONS: (IacOutcomeOption & { actionId: IacOutcomeActionId })[] = [
  { actionId: 'eval-iac-approve', label: 'Approved', commentRequired: false },
  { actionId: 'eval-iac-remediation', label: 'Remediation requested', commentRequired: true },
];

// CR-014 Flow 2: the feedback letter — generated from a template, viewed, then the CEO signs
// it. The CEO does not tick any checklist (CR-008). QCTO feedback 05.6/05.7: this flow is only
// reached once the IAC approves, and the signed feedback letter IS the approval — there is no
// separate approval letter.
export const OUTCOME_WORKFLOW: WorkflowDefinition = {
  id: 'qsa-addendum-outcome-letter',
  stages: [
    { id: 'ceo-signature', label: 'Awaiting CEO signature', allowedRoles: ['CEO'] },
    { id: 'signed', label: 'Signed', allowedRoles: [] },
  ],
  actions: [{ id: 'outcome-sign', label: 'Sign feedback letter', fromStage: 'ceo-signature', toStage: 'signed', kind: 'complete' }],
};

// QCTO feedback 05.6: the one meaning of "approved QASA" for every module (QASA screens, EISA
// Instrument Validation, the EISA Calendar, the status page): the IAC recorded Approved AND the
// CEO signed the feedback letter. QCTO feedback 05.2: a QASA under review stays approved —
// a review can only start from that state, and it ends with a new CEO signature.
export function isQasaApproved(app: QsaAddendumApplication): boolean {
  return (app.evalState.stageId === 'approved' && app.outcomeState.stageId === 'signed') || isQasaUnderReview(app);
}

export function isQasaUnderReview(app: QsaAddendumApplication): boolean {
  return app.review != null;
}

function stageStatusLabel(app: QsaAddendumApplication): string {
  switch (app.evalState.stageId) {
    case 'asd-evaluation':
      return 'Under ASD evaluation';
    case 'qp-corrections':
      return 'Remediation requested';
    case 'dd-review':
      return 'Under Deputy Director moderation';
    case 'director-office-review':
      return 'With Director Office for quality assurance';
    case 'iac-review':
      return 'Approved for tabling — awaiting IAC outcome';
    case 'approved':
      return app.outcomeState.stageId === 'signed' ? 'Approved' : 'Approved by the IAC — feedback letter pending CEO signature';
    default:
      return app.evalState.stageId;
  }
}

export const QASA_UNDER_REVIEW_LABEL = 'Approved — under review';

export function qsaOverallStatusLabel(app: QsaAddendumApplication): string {
  if (isQasaUnderReview(app)) return `${QASA_UNDER_REVIEW_LABEL} (${stageStatusLabel(app)})`;
  return stageStatusLabel(app);
}

export type QsaStatusTone = 'amber' | 'blue' | 'indigo' | 'emerald';

export function qsaOverallStatusTone(app: QsaAddendumApplication): QsaStatusTone {
  if (isQasaUnderReview(app)) return 'emerald';
  switch (app.evalState.stageId) {
    case 'asd-evaluation':
      return 'amber';
    case 'qp-corrections':
      return 'amber';
    case 'dd-review':
      return 'blue';
    case 'director-office-review':
      return 'indigo';
    case 'iac-review':
      return 'indigo';
    case 'approved':
      return isQasaApproved(app) ? 'emerald' : 'blue';
    default:
      return 'blue';
  }
}
