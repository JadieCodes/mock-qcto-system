import { roleLabel } from '../../shared/administration/roleLabels';
import type { WorkflowDefinition } from '../../shared/workflow/types';
import {
  CALENDAR_REVIEWER_ROLE,
  CANCELLATION_DECIDER_ROLE,
  CANCELLATION_SECOND_RECOMMENDER_ROLE,
  POSTPONEMENT_DECIDER_ROLE,
  REQUEST_RECOMMENDER_ROLE,
} from './config';
import type { Role } from '../../types';
import type { ChangeRequestKind, ChangeRequestRecommendation, EisaSittingBatch, EisaSittingChangeRequest, EisaSittingStatus } from './types';

// CR-028: QP proposes dates -> QCTO approves or rejects (with reason) -> QCTO publishes to the
// calendar. Kept as three distinct actions, not one combined "approve & publish" step, so QCTO
// keeps a deliberate "go live" moment separate from the internal decision.
// Row 21 (D-08): a rejected batch is not terminal — the QP can edit the dates and resubmit,
// so `rejected` has the QP as its one actionable role (`batch-resubmit`, back to review).
export const BATCH_WORKFLOW: WorkflowDefinition = {
  id: 'eisa-calendar-batch',
  stages: [
    { id: 'qcto-review', label: 'Awaiting QCTO review', allowedRoles: [CALENDAR_REVIEWER_ROLE] },
    { id: 'approved', label: 'Approved — ready to publish', allowedRoles: [CALENDAR_REVIEWER_ROLE] },
    { id: 'rejected', label: 'Rejected', allowedRoles: ['QP'] },
    { id: 'published', label: 'Published', allowedRoles: [] },
  ],
  actions: [
    { id: 'batch-approve', label: 'Approve', fromStage: 'qcto-review', toStage: 'approved', kind: 'advance' },
    { id: 'batch-reject', label: 'Reject', fromStage: 'qcto-review', toStage: 'rejected', kind: 'reject', requiresNote: true },
    { id: 'batch-publish', label: 'Publish to calendar', fromStage: 'approved', toStage: 'published', kind: 'complete' },
    { id: 'batch-resubmit', label: 'Resubmit corrected dates', fromStage: 'rejected', toStage: 'qcto-review', kind: 'advance' },
  ],
};

// CR-034: only QCTO can postpone or cancel a published date, and a reason is mandatory.
// QCTO feedback 2.4: nobody does this directly any more — it is applied when a postponement
// request (Director decides) or a cancellation request (CEO decides) is approved, by the
// person who decided it.
export const SITTING_LIFECYCLE_WORKFLOW: WorkflowDefinition = {
  id: 'eisa-calendar-sitting',
  stages: [
    { id: 'published', label: 'Published', allowedRoles: [POSTPONEMENT_DECIDER_ROLE, CANCELLATION_DECIDER_ROLE] },
    { id: 'postponed', label: 'Postponed', allowedRoles: [] },
    { id: 'cancelled', label: 'Cancelled', allowedRoles: [] },
  ],
  actions: [
    { id: 'sitting-postpone', label: 'Postpone', fromStage: 'published', toStage: 'postponed', kind: 'send-back', requiresNote: true },
    { id: 'sitting-cancel', label: 'Cancel', fromStage: 'published', toStage: 'cancelled', kind: 'reject', requiresNote: true },
  ],
};

// QCTO feedback 2.4: requests raised by the QP (or the DD) on a published sitting. Each step
// must be a different person from the one before it (requiresDifferentActor); changeRequests.ts
// also refuses anyone who already acted on the same request at an earlier step.
// QCTO 05.10: at a recommendation stage the person chooses "Recommend" or "Do not recommend" —
// both need a comment and both move the request to the same next stage.
export const POSTPONEMENT_REQUEST_WORKFLOW: WorkflowDefinition = {
  id: 'eisa-calendar-postponement-request',
  stages: [
    { id: 'dd-recommendation', label: 'With the DD for recommendation', allowedRoles: [REQUEST_RECOMMENDER_ROLE] },
    { id: 'director-decision', label: 'With the Director for decision', allowedRoles: [POSTPONEMENT_DECIDER_ROLE] },
    { id: 'approved', label: 'Approved', allowedRoles: [] },
    { id: 'declined', label: 'Declined', allowedRoles: [] },
  ],
  actions: [
    { id: 'request-recommend', label: 'Recommend', fromStage: 'dd-recommendation', toStage: 'director-decision', kind: 'advance', requiresDifferentActor: true, requiresNote: true },
    { id: 'request-not-recommend', label: 'Do not recommend', fromStage: 'dd-recommendation', toStage: 'director-decision', kind: 'advance', requiresDifferentActor: true, requiresNote: true },
    { id: 'request-approve', label: 'Approve postponement', fromStage: 'director-decision', toStage: 'approved', kind: 'complete', requiresDifferentActor: true },
    { id: 'request-decline', label: 'Decline postponement', fromStage: 'director-decision', toStage: 'declined', kind: 'reject', requiresDifferentActor: true, requiresNote: true },
  ],
};

export const CANCELLATION_REQUEST_WORKFLOW: WorkflowDefinition = {
  id: 'eisa-calendar-cancellation-request',
  stages: [
    { id: 'dd-recommendation', label: 'With the DD for recommendation', allowedRoles: [REQUEST_RECOMMENDER_ROLE] },
    { id: 'director-recommendation', label: 'With the Director for recommendation', allowedRoles: [CANCELLATION_SECOND_RECOMMENDER_ROLE] },
    { id: 'ceo-decision', label: 'With the CEO for decision', allowedRoles: [CANCELLATION_DECIDER_ROLE] },
    { id: 'approved', label: 'Approved', allowedRoles: [] },
    { id: 'declined', label: 'Declined', allowedRoles: [] },
  ],
  actions: [
    { id: 'request-recommend', label: 'Recommend', fromStage: 'dd-recommendation', toStage: 'director-recommendation', kind: 'advance', requiresDifferentActor: true, requiresNote: true },
    { id: 'request-not-recommend', label: 'Do not recommend', fromStage: 'dd-recommendation', toStage: 'director-recommendation', kind: 'advance', requiresDifferentActor: true, requiresNote: true },
    { id: 'request-recommend', label: 'Recommend', fromStage: 'director-recommendation', toStage: 'ceo-decision', kind: 'advance', requiresDifferentActor: true, requiresNote: true },
    { id: 'request-not-recommend', label: 'Do not recommend', fromStage: 'director-recommendation', toStage: 'ceo-decision', kind: 'advance', requiresDifferentActor: true, requiresNote: true },
    { id: 'request-approve', label: 'Approve cancellation', fromStage: 'ceo-decision', toStage: 'approved', kind: 'complete', requiresDifferentActor: true },
    { id: 'request-decline', label: 'Decline cancellation', fromStage: 'ceo-decision', toStage: 'declined', kind: 'reject', requiresDifferentActor: true, requiresNote: true },
  ],
};

export type ChangeRequestActionId = 'request-recommend' | 'request-not-recommend' | 'request-approve' | 'request-decline';

export function changeRequestWorkflow(kind: ChangeRequestKind): WorkflowDefinition {
  return kind === 'postponement' ? POSTPONEMENT_REQUEST_WORKFLOW : CANCELLATION_REQUEST_WORKFLOW;
}

export function changeRequestStageLabel(request: EisaSittingChangeRequest): string {
  return changeRequestWorkflow(request.kind).stages.find((s) => s.id === request.state.stageId)?.label ?? request.state.stageId;
}

// QCTO 05.10: internal status text adds the recommendations so far, e.g.
// "With the CEO for decision — DD: Recommend, Director: Do not recommend". The QP side shows
// the plain stage label only (changeRequestStageLabel).
export function recommendationRoleLabel(role: Role): string {
  // Batch S: the short "DD" is kept until the super admin renames the role.
  return role === 'Deputy Director' && roleLabel(role) === 'Deputy Director' ? 'DD' : roleLabel(role);
}

export function recommendationChoiceLabel(rec: ChangeRequestRecommendation): string {
  return rec.recommends === false ? 'Do not recommend' : 'Recommend';
}

export function changeRequestInternalStatusLabel(request: EisaSittingChangeRequest): string {
  const stage = changeRequestStageLabel(request);
  if (request.recommendations.length === 0) return stage;
  return `${stage} — ${request.recommendations.map((r) => `${recommendationRoleLabel(r.role)}: ${recommendationChoiceLabel(r)}`).join(', ')}`;
}

export function isChangeRequestOpen(request: EisaSittingChangeRequest): boolean {
  return request.state.stageId !== 'approved' && request.state.stageId !== 'declined';
}

// The stage where the request is decided (Approve / Decline) rather than recommended.
export function isDecisionStage(request: EisaSittingChangeRequest): boolean {
  return request.state.stageId === 'director-decision' || request.state.stageId === 'ceo-decision';
}

// Lets the shared EisaSittingStatus badge double up as the batch's status display — every
// BATCH_WORKFLOW stage id matches a status value except "qcto-review", which reads as "proposed".
export function batchDisplayStatus(batch: EisaSittingBatch): EisaSittingStatus {
  return batch.state.stageId === 'qcto-review' ? 'proposed' : (batch.state.stageId as EisaSittingStatus);
}
