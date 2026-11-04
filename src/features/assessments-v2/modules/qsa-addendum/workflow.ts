import type { IacOutcomeOption } from '../../shared/iac/types';
import type { WorkflowDefinition, WorkflowRecordState } from '../../shared/workflow/types';
import { APPROVAL_LETTER_SIGNER_ROLE, IAC_OUTCOME_RECORDER_ROLE, QASA_DIRECTOR_OFFICE_ROLE } from './config';
import type { QsaAddendumApplication } from './types';

// CR-005, CR-007: the acknowledgement letter is generated on submission, previewed by the
// ASD, reviewed by the DD, and stops there — no CEO involvement anywhere in this flow.
export const ACK_WORKFLOW: WorkflowDefinition = {
  id: 'qsa-addendum-acknowledgement',
  stages: [
    { id: 'asd-preview', label: 'ASD preview', allowedRoles: ['ASD'] },
    { id: 'dd-review', label: 'Deputy Director review', allowedRoles: ['Deputy Director'] },
    { id: 'acknowledged', label: 'Acknowledged', allowedRoles: [] },
  ],
  actions: [
    { id: 'ack-send-to-dd', label: 'Send to Deputy Director', fromStage: 'asd-preview', toStage: 'dd-review', kind: 'advance' },
    {
      id: 'ack-send-back',
      label: 'Send back to ASD',
      fromStage: 'dd-review',
      toStage: 'asd-preview',
      kind: 'send-back',
      // Row 10 (test finding B-08): the DD's reason for sending it back must be captured and
      // shown to the ASD, not just silently bounced.
      requiresNote: true,
    },
    {
      id: 'ack-acknowledge',
      label: 'Acknowledge',
      fromStage: 'dd-review',
      toStage: 'acknowledged',
      kind: 'complete',
      requiresDifferentActor: true,
    },
  ],
};

// Audit-entry action labels the screens look up to show the latest note for a step.
export const RETURN_TO_DD_LABEL = 'Return to DD';
export const APPROVE_FOR_TABLING_LABEL = 'Approve for tabling';
export const IAC_REMEDIATION_LABEL = 'Record IAC outcome: Remediation requested';

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
    { id: 'approved', label: 'Approved', allowedRoles: [] },
    { id: 'declined', label: 'Declined', allowedRoles: [] },
  ],
  actions: [
    { id: 'eval-send-to-dd', label: 'Send to Deputy Director', fromStage: 'asd-evaluation', toStage: 'dd-review', kind: 'advance' },
    // CR-012: corrections only ever travel DD -> ASD -> QP. There is no direct DD -> QP action
    // anywhere — only the ASD can hand work to the QP.
    {
      id: 'eval-return-to-qp',
      label: 'Return to QP for corrections',
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
    // QASA to the QP, the same way a negative evaluation does.
    {
      id: 'eval-iac-approve',
      label: 'Record IAC outcome: Approved',
      fromStage: 'iac-review',
      toStage: 'approved',
      kind: 'advance',
    },
    {
      id: 'eval-iac-decline',
      label: 'Record IAC outcome: Declined',
      fromStage: 'iac-review',
      toStage: 'declined',
      kind: 'reject',
      requiresNote: true,
    },
    {
      id: 'eval-iac-remediation',
      label: IAC_REMEDIATION_LABEL,
      fromStage: 'iac-review',
      toStage: 'qp-corrections',
      kind: 'send-back',
      requiresNote: true,
    },
  ],
};

export const IAC_OUTCOME_ACTION_IDS = ['eval-iac-approve', 'eval-iac-decline', 'eval-iac-remediation'] as const;
export type IacOutcomeActionId = (typeof IAC_OUTCOME_ACTION_IDS)[number];

export const IAC_OUTCOME_OPTIONS: (IacOutcomeOption & { actionId: IacOutcomeActionId })[] = [
  { actionId: 'eval-iac-approve', label: 'Approved', commentRequired: false },
  { actionId: 'eval-iac-decline', label: 'Declined', commentRequired: true },
  { actionId: 'eval-iac-remediation', label: 'Remediation requested', commentRequired: true },
];

// CR-014 Flow 2: the outcome letter — generated from a template, viewed, then the CEO signs
// it. The CEO does not tick any checklist (CR-008) and reaches this flow however the IAC
// decided (approved or declined) — the outcome letter communicates whichever it was.
export const OUTCOME_WORKFLOW: WorkflowDefinition = {
  id: 'qsa-addendum-outcome-letter',
  stages: [
    { id: 'ceo-signature', label: 'Awaiting CEO signature', allowedRoles: ['CEO'] },
    { id: 'signed', label: 'Signed', allowedRoles: [] },
  ],
  actions: [{ id: 'outcome-sign', label: 'Sign feedback letter', fromStage: 'ceo-signature', toStage: 'signed', kind: 'complete' }],
};

// Row 13 (test findings): the approval letter only exists once the outcome is "approved".
// New flow — the ASD drafts and edits it, submits to the Deputy Director (the signer role is
// the config constant above), who signs or declines it back to the ASD with a mandatory note;
// once signed, the ASD is the one who forwards it to the QP (there is still no DD -> QP
// shortcut, same CR-012 rule as the evaluation flow).
export const APPROVAL_LETTER_WORKFLOW: WorkflowDefinition = {
  id: 'qsa-addendum-approval-letter',
  stages: [
    { id: 'asd-draft', label: 'ASD drafting', allowedRoles: ['ASD'] },
    { id: 'dd-review', label: 'Awaiting signature', allowedRoles: [APPROVAL_LETTER_SIGNER_ROLE] },
    { id: 'signed', label: 'Signed — awaiting send to QP', allowedRoles: ['ASD'] },
    { id: 'sent-to-qp', label: 'Sent to QP', allowedRoles: [] },
  ],
  actions: [
    { id: 'approval-submit-to-dd', label: 'Submit to Deputy Director', fromStage: 'asd-draft', toStage: 'dd-review', kind: 'advance' },
    {
      id: 'approval-decline',
      label: 'Decline',
      fromStage: 'dd-review',
      toStage: 'asd-draft',
      kind: 'send-back',
      requiresNote: true,
    },
    {
      id: 'approval-sign',
      label: 'Sign approval letter',
      fromStage: 'dd-review',
      toStage: 'signed',
      kind: 'complete',
      requiresDifferentActor: true,
    },
    { id: 'approval-send-to-qp', label: 'Send to QP', fromStage: 'signed', toStage: 'sent-to-qp', kind: 'complete' },
  ],
};

// `approvalState.stageId === 'signed'` only means the Deputy Director has signed — the letter
// is still sitting with the ASD to forward. Other modules (EISA Instrument Validation, the
// EISA Calendar) care about "is this QSA Addendum approved", not about letter delivery, so
// both `signed` and `sent-to-qp` count as final for that purpose.
export function isApprovalLetterFinal(state: WorkflowRecordState | null): boolean {
  return state?.stageId === 'signed' || state?.stageId === 'sent-to-qp';
}

export function qsaOverallStatusLabel(app: QsaAddendumApplication): string {
  switch (app.evalState.stageId) {
    case 'asd-evaluation':
      return 'Under ASD evaluation';
    case 'qp-corrections':
      return 'Corrections requested';
    case 'dd-review':
      return 'Under Deputy Director moderation';
    case 'director-office-review':
      return 'With Director Office for quality assurance';
    case 'iac-review':
      return 'Approved for tabling — awaiting IAC outcome';
    case 'declined':
      return app.outcomeState.stageId === 'signed' ? 'Declined' : 'Declined — feedback letter pending CEO signature';
    case 'approved':
      if (app.outcomeState.stageId !== 'signed') return 'Approved — feedback letter pending CEO signature';
      if (!app.approvalState || app.approvalState.stageId === 'asd-draft') {
        return 'Approved — approval letter drafted by ASD';
      }
      if (app.approvalState.stageId === 'dd-review') return 'Approved — approval letter awaiting Deputy Director signature';
      if (app.approvalState.stageId === 'signed') return 'Approved — approval letter signed, awaiting ASD to send to QP';
      return 'Approved';
    default:
      return app.evalState.stageId;
  }
}

export type QsaStatusTone = 'amber' | 'blue' | 'indigo' | 'emerald' | 'red';

export function qsaOverallStatusTone(app: QsaAddendumApplication): QsaStatusTone {
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
    case 'declined':
      return 'red';
    case 'approved':
      return app.approvalState?.stageId === 'sent-to-qp' ? 'emerald' : 'blue';
    default:
      return 'blue';
  }
}
