import type { WorkflowDefinition } from '../../shared/workflow/types';
import { CALENDAR_REVIEWER_ROLE } from './config';
import type { EisaSittingBatch, EisaSittingStatus } from './types';

// CR-028: QP proposes dates -> QCTO approves or rejects (with reason) -> QCTO publishes to the
// calendar. Kept as three distinct actions, not one combined "approve & publish" step, so QCTO
// keeps a deliberate "go live" moment separate from the internal decision.
export const BATCH_WORKFLOW: WorkflowDefinition = {
  id: 'eisa-calendar-batch',
  stages: [
    { id: 'qcto-review', label: 'Awaiting QCTO review', allowedRoles: [CALENDAR_REVIEWER_ROLE] },
    { id: 'approved', label: 'Approved — ready to publish', allowedRoles: [CALENDAR_REVIEWER_ROLE] },
    { id: 'rejected', label: 'Rejected', allowedRoles: [] },
    { id: 'published', label: 'Published', allowedRoles: [] },
  ],
  actions: [
    { id: 'batch-approve', label: 'Approve', fromStage: 'qcto-review', toStage: 'approved', kind: 'advance' },
    { id: 'batch-reject', label: 'Reject', fromStage: 'qcto-review', toStage: 'rejected', kind: 'reject', requiresNote: true },
    { id: 'batch-publish', label: 'Publish to calendar', fromStage: 'approved', toStage: 'published', kind: 'complete' },
  ],
};

// CR-034: only QCTO can postpone or cancel a published date, and a reason is mandatory.
export const SITTING_LIFECYCLE_WORKFLOW: WorkflowDefinition = {
  id: 'eisa-calendar-sitting',
  stages: [
    { id: 'published', label: 'Published', allowedRoles: [CALENDAR_REVIEWER_ROLE] },
    { id: 'postponed', label: 'Postponed', allowedRoles: [] },
    { id: 'cancelled', label: 'Cancelled', allowedRoles: [] },
  ],
  actions: [
    { id: 'sitting-postpone', label: 'Postpone', fromStage: 'published', toStage: 'postponed', kind: 'send-back', requiresNote: true },
    { id: 'sitting-cancel', label: 'Cancel', fromStage: 'published', toStage: 'cancelled', kind: 'reject', requiresNote: true },
  ],
};

// Lets the shared EisaSittingStatus badge double up as the batch's status display — every
// BATCH_WORKFLOW stage id matches a status value except "qcto-review", which reads as "proposed".
export function batchDisplayStatus(batch: EisaSittingBatch): EisaSittingStatus {
  return batch.state.stageId === 'qcto-review' ? 'proposed' : (batch.state.stageId as EisaSittingStatus);
}
