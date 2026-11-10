import type { WorkflowDefinition } from '../../shared/workflow/types';
import type { EisaConfirmationRecord } from './types';

// Batch T (29.20, 29.21): the QP builds and submits the confirmation, the ASD accepts it or returns it
// to the QP with a reason. The old "awaiting QP acknowledgement" and "awaiting QP confirmation" stages
// and the ASD's "generate" action are gone; the system shares the list (sharing.ts).
export const CONFIRMATION_WORKFLOW: WorkflowDefinition = {
  id: 'eisa-confirmation',
  stages: [
    { id: 'qp-draft', label: 'With the QP', allowedRoles: ['QP'] },
    { id: 'with-asd', label: 'With the ASD', allowedRoles: ['ASD'] },
    { id: 'accepted', label: 'Accepted', allowedRoles: [] },
  ],
  actions: [
    { id: 'conf-submit', label: 'Submit EISA Confirmation', fromStage: 'qp-draft', toStage: 'with-asd', kind: 'advance' },
    { id: 'conf-accept', label: 'Accept EISA Confirmation', fromStage: 'with-asd', toStage: 'accepted', kind: 'complete' },
    { id: 'conf-return', label: 'Return to QP', fromStage: 'with-asd', toStage: 'qp-draft', kind: 'send-back', requiresNote: true },
  ],
};

export type ConfirmationStatusTone = 'amber' | 'blue' | 'emerald' | 'red';

export function isConfirmationAccepted(record: EisaConfirmationRecord): boolean {
  return record.workflow.stageId === 'accepted';
}

// A returned confirmation is back with the QP until it is resubmitted.
export function isReturnedToQp(record: EisaConfirmationRecord): boolean {
  return record.workflow.stageId === 'qp-draft' && record.returns.length > 0;
}

export function confirmationStatusLabel(record: EisaConfirmationRecord): string {
  if (isReturnedToQp(record)) return 'Returned to the QP';
  switch (record.workflow.stageId) {
    case 'qp-draft':
      return 'With the QP';
    case 'with-asd':
      return 'With the ASD';
    case 'accepted':
      return 'Accepted';
    default:
      return record.workflow.stageId;
  }
}

export function confirmationStatusTone(record: EisaConfirmationRecord): ConfirmationStatusTone {
  if (isReturnedToQp(record)) return 'red';
  if (record.workflow.stageId === 'accepted') return 'emerald';
  if (record.workflow.stageId === 'with-asd') return 'blue';
  return 'amber';
}
