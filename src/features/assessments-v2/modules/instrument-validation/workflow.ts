import type { WorkflowDefinition } from '../../shared/workflow/types';
import type { InstrumentValidationRecord } from './types';

// CR-017: the QP cannot schedule alone. ASD and QP propose, accept or counter-propose a
// date/time/venue until both sides agree — modelled as a workflow so the shared engine's
// role-gating and audit trail apply here the same as everywhere else in this domain.
export const SCHEDULING_WORKFLOW: WorkflowDefinition = {
  id: 'instrument-validation-scheduling',
  stages: [
    { id: 'awaiting-qp-proposal', label: 'Awaiting QP proposal', allowedRoles: ['QP'] },
    { id: 'awaiting-asd-response', label: 'Awaiting ASD response', allowedRoles: ['ASD'] },
    { id: 'awaiting-qp-response', label: 'Awaiting QP response', allowedRoles: ['QP'] },
    { id: 'agreed', label: 'Agreed', allowedRoles: [] },
  ],
  actions: [
    {
      id: 'sched-qp-propose',
      label: 'Propose a date, time and venue',
      fromStage: 'awaiting-qp-proposal',
      toStage: 'awaiting-asd-response',
      kind: 'advance',
    },
    { id: 'sched-asd-accept', label: 'Accept this slot', fromStage: 'awaiting-asd-response', toStage: 'agreed', kind: 'complete' },
    {
      id: 'sched-asd-counter',
      label: 'Counter-propose',
      fromStage: 'awaiting-asd-response',
      toStage: 'awaiting-qp-response',
      kind: 'advance',
    },
    { id: 'sched-qp-accept', label: 'Accept this slot', fromStage: 'awaiting-qp-response', toStage: 'agreed', kind: 'complete' },
    {
      id: 'sched-qp-counter',
      label: 'Counter-propose',
      fromStage: 'awaiting-qp-response',
      toStage: 'awaiting-asd-response',
      kind: 'advance',
    },
  ],
};

// CR-018, CR-023, CR-024: QP <-> ASD only, outcome goes straight back to the QP (no Deputy
// Director stage), and finishing this never creates or opens an EISA Registration.
export const VALIDATION_WORKFLOW: WorkflowDefinition = {
  id: 'instrument-validation-validation',
  stages: [
    { id: 'qp-instrument', label: 'QP preparing instrument', allowedRoles: ['QP'] },
    { id: 'asd-validation', label: 'ASD validating', allowedRoles: ['ASD'] },
    { id: 'validated', label: 'Validated', allowedRoles: [] },
  ],
  actions: [
    {
      id: 'val-submit',
      label: 'Submit instrument for validation',
      fromStage: 'qp-instrument',
      toStage: 'asd-validation',
      kind: 'advance',
    },
    { id: 'val-approve', label: 'Record outcome: Approved', fromStage: 'asd-validation', toStage: 'validated', kind: 'complete' },
    {
      id: 'val-approve-with-conditions',
      label: 'Record outcome: Approved with conditions',
      fromStage: 'asd-validation',
      toStage: 'validated',
      kind: 'complete',
    },
    // CR-023: "changes required" loops straight back to the QP — no Deputy Director stop.
    {
      id: 'val-not-approved',
      label: 'Record outcome: Not approved — return to QP',
      fromStage: 'asd-validation',
      toStage: 'qp-instrument',
      kind: 'send-back',
      requiresNote: true,
    },
  ],
};

export function schedulingStatusLabel(record: InstrumentValidationRecord): string {
  switch (record.scheduling.workflow.stageId) {
    case 'awaiting-qp-proposal':
      return 'Awaiting QP to propose a slot';
    case 'awaiting-asd-response':
      return 'Awaiting ASD response';
    case 'awaiting-qp-response':
      return 'Awaiting QP response';
    case 'agreed':
      return 'Slot agreed';
    default:
      return record.scheduling.workflow.stageId;
  }
}

// One combined status for dashboards/badges: scheduling must be agreed before the
// validation workflow's own stage becomes the interesting one.
export function overallStatusLabel(record: InstrumentValidationRecord): string {
  if (record.scheduling.workflow.stageId !== 'agreed') {
    return schedulingStatusLabel(record);
  }
  if (record.instrumentStatus === 'validated') return 'Validated';
  switch (record.validationWorkflow.stageId) {
    case 'qp-instrument':
      return record.cycleCount > 1 ? 'Changes requested — awaiting resubmission' : 'Awaiting instrument upload';
    case 'asd-validation':
      return 'Under ASD validation';
    default:
      return record.validationWorkflow.stageId;
  }
}

export type InstrumentValidationStatusTone = 'amber' | 'blue' | 'emerald';

export function overallStatusTone(record: InstrumentValidationRecord): InstrumentValidationStatusTone {
  if (record.scheduling.workflow.stageId !== 'agreed') return 'amber';
  if (record.instrumentStatus === 'validated') return 'emerald';
  if (record.validationWorkflow.stageId === 'asd-validation') return 'blue';
  return 'amber';
}
