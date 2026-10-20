import { appendAuditEntry } from '../audit/auditLog';
import type { Role } from '../../types';
import type { WorkflowDefinition, WorkflowRecordState } from './types';

export class WorkflowError extends Error {}

export function canActInStage(definition: WorkflowDefinition, stageId: string, role: Role): boolean {
  const stage = definition.stages.find((s) => s.id === stageId);
  return !!stage && stage.allowedRoles.includes(role);
}

export function availableActions(definition: WorkflowDefinition, stageId: string) {
  return definition.actions.filter((a) => a.fromStage === stageId);
}

export interface PerformActionParams {
  definition: WorkflowDefinition;
  record: WorkflowRecordState;
  actionId: string;
  actorRole: Role;
  actorName: string;
  recordType: string;
  recordId: string;
  note?: string;
}

export function performAction({
  definition,
  record,
  actionId,
  actorRole,
  actorName,
  recordType,
  recordId,
  note,
}: PerformActionParams): WorkflowRecordState {
  const action = definition.actions.find((a) => a.id === actionId && a.fromStage === record.stageId);
  if (!action) {
    throw new WorkflowError(`Action "${actionId}" is not available from stage "${record.stageId}".`);
  }

  if (!canActInStage(definition, record.stageId, actorRole)) {
    throw new WorkflowError(`Role "${actorRole}" may not act in stage "${record.stageId}".`);
  }

  // CR-053: nobody approves their own submission.
  if (action.requiresDifferentActor && record.submittedBy && record.submittedBy === actorName) {
    throw new WorkflowError('The approver must be a different person from the submitter.');
  }

  // CR-055: a manual re-route (or reject) needs a mandatory audit note.
  if (action.requiresNote && !note?.trim()) {
    throw new WorkflowError(`"${action.label}" requires a note explaining why.`);
  }

  appendAuditEntry({
    recordType,
    recordId,
    actorRole,
    actorName,
    action: action.label,
    note,
  });

  return { ...record, stageId: action.toStage, submittedBy: actorName };
}
