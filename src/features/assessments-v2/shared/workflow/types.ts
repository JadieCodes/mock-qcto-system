import type { Role } from '../../types';

export interface WorkflowStage {
  id: string;
  label: string;
  allowedRoles: Role[];
}

export type ActionKind = 'advance' | 'send-back' | 'reject' | 'reroute' | 'complete';

export interface WorkflowAction {
  id: string;
  label: string;
  fromStage: string;
  toStage: string;
  kind: ActionKind;
  // CR-053: the approver must be a different user than whoever submitted the work being approved.
  requiresDifferentActor?: boolean;
  // CR-055: a manual re-route is only allowed with a mandatory audit note.
  requiresNote?: boolean;
}

export interface WorkflowDefinition {
  id: string;
  stages: WorkflowStage[];
  actions: WorkflowAction[];
}

export interface WorkflowRecordState {
  stageId: string;
  submittedBy?: string;
  // The id of the named person who last acted — what CR-053's "different person" check
  // actually compares. Optional for backward compatibility with any in-flight mock state that
  // predates per-person identity; the engine falls back to a name comparison when absent.
  submittedById?: string;
}

// CR-056: send-back-for-clarification and reject must be available on every approval stage.
export function withStandardApprovalActions(
  stageId: string,
  approvalAction: Omit<WorkflowAction, 'kind' | 'fromStage'>,
  sendBackToStage: string,
  rejectToStage: string,
): WorkflowAction[] {
  return [
    { ...approvalAction, fromStage: stageId, kind: 'advance' },
    {
      id: `${stageId}-send-back`,
      label: 'Send back for clarification',
      fromStage: stageId,
      toStage: sendBackToStage,
      kind: 'send-back',
    },
    {
      id: `${stageId}-reject`,
      label: 'Reject',
      fromStage: stageId,
      toStage: rejectToStage,
      kind: 'reject',
      requiresNote: true,
    },
  ];
}
