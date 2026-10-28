import type { WorkflowDefinition } from '../../shared/workflow/types';
import { FISA_STANDARD_SIGNOFF_ROLE } from './config';
import type { FisaStandardRecord, FisaValidationRecord } from './types';

// CR-026/PM-10: evaluate -> moderate -> validate -> approve, the same shape as the QSA
// Addendum's evaluation flow, but final sign-off is the Qualifications Development Director &
// Team — never the Assessments CEO, and there is no outcome-letter/CEO stage anywhere here.
export const FISA_STANDARD_WORKFLOW: WorkflowDefinition = {
  id: 'fisa-standard',
  stages: [
    { id: 'qd-submission', label: 'Qualifications Development — source documents', allowedRoles: ['Qualifications Development'] },
    { id: 'asd-evaluation', label: 'ASD evaluation', allowedRoles: ['ASD'] },
    { id: 'dd-review', label: 'Deputy Director review', allowedRoles: ['Deputy Director'] },
    { id: 'iac-review', label: 'IAC review', allowedRoles: ['IAC'] },
    { id: 'qd-signoff', label: 'Qualifications Development Director Office sign-off', allowedRoles: [FISA_STANDARD_SIGNOFF_ROLE] },
    { id: 'approved', label: 'Approved', allowedRoles: [] },
    { id: 'declined', label: 'Declined', allowedRoles: [] },
  ],
  actions: [
    { id: 'standard-submit', label: 'Send to ASD for evaluation', fromStage: 'qd-submission', toStage: 'asd-evaluation', kind: 'advance' },

    { id: 'standard-asd-send-to-dd', label: 'Send to Deputy Director', fromStage: 'asd-evaluation', toStage: 'dd-review', kind: 'advance' },
    {
      id: 'standard-asd-request-docs',
      label: 'Send back for clarification',
      fromStage: 'asd-evaluation',
      toStage: 'qd-submission',
      kind: 'send-back',
      requiresNote: true,
    },
    { id: 'standard-asd-reject', label: 'Reject', fromStage: 'asd-evaluation', toStage: 'declined', kind: 'reject', requiresNote: true },

    {
      id: 'standard-dd-send-to-iac',
      label: 'Send to IAC',
      fromStage: 'dd-review',
      toStage: 'iac-review',
      kind: 'advance',
      requiresDifferentActor: true,
    },
    {
      id: 'standard-dd-return-to-asd',
      label: 'Send back for clarification',
      fromStage: 'dd-review',
      toStage: 'asd-evaluation',
      kind: 'send-back',
      requiresNote: true,
    },
    { id: 'standard-dd-reject', label: 'Reject', fromStage: 'dd-review', toStage: 'declined', kind: 'reject', requiresNote: true },

    {
      id: 'standard-iac-send-to-qd',
      label: 'Send to Qualifications Development for sign-off',
      fromStage: 'iac-review',
      toStage: 'qd-signoff',
      kind: 'advance',
      requiresDifferentActor: true,
    },
    {
      id: 'standard-iac-remediation',
      label: 'Send for remediation',
      fromStage: 'iac-review',
      toStage: 'asd-evaluation',
      kind: 'send-back',
      requiresNote: true,
    },
    { id: 'standard-iac-decline', label: 'Decline', fromStage: 'iac-review', toStage: 'declined', kind: 'reject', requiresNote: true },

    {
      id: 'standard-qd-signoff',
      label: 'Sign off — Approved',
      fromStage: 'qd-signoff',
      toStage: 'approved',
      kind: 'complete',
      requiresDifferentActor: true,
    },
    {
      id: 'standard-qd-return',
      label: 'Send back for clarification',
      fromStage: 'qd-signoff',
      toStage: 'dd-review',
      kind: 'send-back',
      requiresNote: true,
    },
    // CR-056: send-back AND reject must both be available on every approval stage — qd-signoff
    // only had the send-back half until this fix.
    { id: 'standard-qd-reject', label: 'Reject', fromStage: 'qd-signoff', toStage: 'declined', kind: 'reject', requiresNote: true },
  ],
};

export type FisaStandardStatusTone = 'amber' | 'blue' | 'indigo' | 'emerald' | 'red';

export function fisaStandardStatusLabel(record: FisaStandardRecord): string {
  switch (record.workflow.stageId) {
    case 'qd-submission':
      return 'With Qualifications Development';
    case 'asd-evaluation':
      return 'Under ASD evaluation';
    case 'dd-review':
      return 'Under Deputy Director review';
    case 'iac-review':
      return 'With IAC';
    case 'qd-signoff':
      return 'Awaiting Qualifications Development sign-off';
    case 'approved':
      return 'Approved';
    case 'declined':
      return 'Declined';
    default:
      return record.workflow.stageId;
  }
}

export function fisaStandardStatusTone(record: FisaStandardRecord): FisaStandardStatusTone {
  switch (record.workflow.stageId) {
    case 'qd-submission':
      return 'amber';
    case 'asd-evaluation':
      return 'amber';
    case 'dd-review':
      return 'blue';
    case 'iac-review':
      return 'indigo';
    case 'qd-signoff':
      return 'blue';
    case 'approved':
      return 'emerald';
    case 'declined':
      return 'red';
    default:
      return 'blue';
  }
}

// PM-01/PM-11: the SDP submits, the Assistant Director allocates to an ASD, the ASD validates,
// and the outcome goes STRAIGHT back to the SDP — no Deputy Director stage anywhere.
export const FISA_VALIDATION_WORKFLOW: WorkflowDefinition = {
  id: 'fisa-instrument-validation',
  stages: [
    { id: 'sdp-instrument', label: 'SDP developing instrument', allowedRoles: ['SDP'] },
    { id: 'awaiting-allocation', label: 'Awaiting Assistant Director allocation', allowedRoles: ['Assistant Director'] },
    { id: 'asd-validation', label: 'ASD validating', allowedRoles: ['ASD'] },
    { id: 'validated', label: 'Validated', allowedRoles: [] },
  ],
  actions: [
    { id: 'fval-submit', label: 'Notify QCTO — submit instrument', fromStage: 'sdp-instrument', toStage: 'awaiting-allocation', kind: 'advance' },
    { id: 'fval-allocate', label: 'Allocate to an ASD', fromStage: 'awaiting-allocation', toStage: 'asd-validation', kind: 'advance' },
    { id: 'fval-approve', label: 'Record outcome: Approved', fromStage: 'asd-validation', toStage: 'validated', kind: 'complete' },
    {
      id: 'fval-approve-with-conditions',
      label: 'Record outcome: Approved with conditions',
      fromStage: 'asd-validation',
      toStage: 'validated',
      kind: 'complete',
    },
    // PM-01: "changes required" loops straight back to the SDP — no Deputy Director stop.
    {
      id: 'fval-not-approved',
      label: 'Record outcome: Not approved — return to SDP',
      fromStage: 'asd-validation',
      toStage: 'sdp-instrument',
      kind: 'send-back',
      requiresNote: true,
    },
  ],
};

export type FisaValidationStatusTone = 'amber' | 'blue' | 'emerald';

export function fisaValidationStatusLabel(record: FisaValidationRecord): string {
  switch (record.workflow.stageId) {
    case 'sdp-instrument':
      return record.cycleCount > 1 ? 'Changes requested — awaiting resubmission' : 'Developing instrument';
    case 'awaiting-allocation':
      return 'Awaiting Assistant Director allocation';
    case 'asd-validation':
      return `Under ASD validation${record.allocatedAsdName ? ` (${record.allocatedAsdName})` : ''}`;
    case 'validated':
      return 'Validated';
    default:
      return record.workflow.stageId;
  }
}

export function fisaValidationStatusTone(record: FisaValidationRecord): FisaValidationStatusTone {
  if (record.instrumentStatus === 'validated') return 'emerald';
  if (record.workflow.stageId === 'asd-validation') return 'blue';
  return 'amber';
}
