import type { WorkflowDefinition } from '../../shared/workflow/types';
import type { EisaConfirmationRecord } from './types';

// CR-043: the QP views the consolidated list and acknowledges, then separately confirms
// centres/counts/dates. Two distinct QP actions, as described in the process flow.
export const CONFIRMATION_WORKFLOW: WorkflowDefinition = {
  id: 'eisa-confirmation',
  stages: [
    { id: 'awaiting-qp-ack', label: 'Awaiting QP acknowledgement', allowedRoles: ['QP'] },
    { id: 'awaiting-qp-confirmation', label: 'Awaiting QP confirmation', allowedRoles: ['QP'] },
    { id: 'confirmed', label: 'Confirmed', allowedRoles: [] },
  ],
  actions: [
    {
      id: 'conf-acknowledge',
      label: 'Acknowledge consolidated learner list',
      fromStage: 'awaiting-qp-ack',
      toStage: 'awaiting-qp-confirmation',
      kind: 'advance',
    },
    {
      id: 'conf-confirm',
      label: 'Confirm centres, learner counts and dates',
      fromStage: 'awaiting-qp-confirmation',
      toStage: 'confirmed',
      kind: 'complete',
    },
  ],
};

export type ConfirmationStatusTone = 'amber' | 'blue' | 'emerald';

export function confirmationStatusLabel(record: EisaConfirmationRecord): string {
  switch (record.workflow.stageId) {
    case 'awaiting-qp-ack':
      return 'Awaiting QP acknowledgement';
    case 'awaiting-qp-confirmation':
      return 'Awaiting QP confirmation';
    case 'confirmed':
      return 'Confirmed';
    default:
      return record.workflow.stageId;
  }
}

export function confirmationStatusTone(record: EisaConfirmationRecord): ConfirmationStatusTone {
  if (record.workflow.stageId === 'confirmed') return 'emerald';
  if (record.workflow.stageId === 'awaiting-qp-confirmation') return 'blue';
  return 'amber';
}
