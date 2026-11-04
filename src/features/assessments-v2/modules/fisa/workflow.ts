import type { IacOutcomeOption } from '../../shared/iac/types';
import type { WorkflowDefinition } from '../../shared/workflow/types';
import { FISA_DIRECTOR_OFFICE_ROLE, FISA_IAC_OUTCOME_RECORDER_ROLE, FISA_OUTCOME_LETTER_SIGNER_ROLE } from './config';
import type { FisaStandardRecord, FisaValidationRecord } from './types';

// Audit-entry action labels the screens look up to show the latest note for a step.
export const STANDARD_RETURN_TO_DD_LABEL = 'Return to DD';
export const STANDARD_APPROVE_FOR_TABLING_LABEL = 'Approve for tabling';
export const STANDARD_IAC_REMEDIATION_LABEL = 'Record IAC outcome: Remediation requested';

// QCTO feedback 2.9 (29 Oct 2026): the same route as the QASA (2.1). Qualifications
// Development creates -> ASD evaluates -> DD moderates -> Director Office quality-assures and
// approves for tabling -> the DD presents at the IAC and records its outcome -> the CEO signs
// the outcome letter. Both IAC outcomes that end the process (approved or declined) reach the
// CEO; the Standard is only Approved once the CEO signs an "approved" letter.
export const FISA_STANDARD_WORKFLOW: WorkflowDefinition = {
  id: 'fisa-standard',
  stages: [
    { id: 'qd-submission', label: 'Qualifications Development — source documents', allowedRoles: ['Qualifications Development'] },
    { id: 'asd-evaluation', label: 'ASD evaluation', allowedRoles: ['ASD'] },
    { id: 'dd-review', label: 'Deputy Director moderation', allowedRoles: ['Deputy Director'] },
    { id: 'director-office-review', label: 'Director Office quality assurance', allowedRoles: [FISA_DIRECTOR_OFFICE_ROLE] },
    { id: 'iac-review', label: 'Awaiting IAC outcome', allowedRoles: [FISA_IAC_OUTCOME_RECORDER_ROLE] },
    { id: 'ceo-signature', label: 'Outcome letter awaiting CEO signature — IAC approved', allowedRoles: [FISA_OUTCOME_LETTER_SIGNER_ROLE] },
    { id: 'ceo-signature-declined', label: 'Outcome letter awaiting CEO signature — IAC declined', allowedRoles: [FISA_OUTCOME_LETTER_SIGNER_ROLE] },
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
      id: 'standard-dd-send-to-director-office',
      label: 'Send to Director Office',
      fromStage: 'dd-review',
      toStage: 'director-office-review',
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

    // The engine only compares against the DD who sent it; api.ts also checks the Director
    // Office person was not the ASD on the same Standard.
    {
      id: 'standard-do-approve-for-tabling',
      label: STANDARD_APPROVE_FOR_TABLING_LABEL,
      fromStage: 'director-office-review',
      toStage: 'iac-review',
      kind: 'advance',
      requiresDifferentActor: true,
    },
    {
      id: 'standard-do-return-to-dd',
      label: STANDARD_RETURN_TO_DD_LABEL,
      fromStage: 'director-office-review',
      toStage: 'dd-review',
      kind: 'send-back',
      requiresNote: true,
      requiresDifferentActor: true,
    },

    // The DD records the IAC's outcome. Remediation returns the Standard to Qualifications
    // Development, which started it (FISA has no QP).
    { id: 'standard-iac-approve', label: 'Record IAC outcome: Approved', fromStage: 'iac-review', toStage: 'ceo-signature', kind: 'advance' },
    {
      id: 'standard-iac-decline',
      label: 'Record IAC outcome: Declined',
      fromStage: 'iac-review',
      toStage: 'ceo-signature-declined',
      kind: 'reject',
      requiresNote: true,
    },
    {
      id: 'standard-iac-remediation',
      label: STANDARD_IAC_REMEDIATION_LABEL,
      fromStage: 'iac-review',
      toStage: 'qd-submission',
      kind: 'send-back',
      requiresNote: true,
    },

    // CR-008: the CEO only signs the outcome letter.
    { id: 'standard-ceo-sign', label: 'Sign outcome letter', fromStage: 'ceo-signature', toStage: 'approved', kind: 'complete' },
    { id: 'standard-ceo-sign-declined', label: 'Sign outcome letter', fromStage: 'ceo-signature-declined', toStage: 'declined', kind: 'complete' },
  ],
};

export const STANDARD_IAC_OUTCOME_OPTIONS: IacOutcomeOption[] = [
  { actionId: 'standard-iac-approve', label: 'Approved', commentRequired: false },
  { actionId: 'standard-iac-decline', label: 'Declined', commentRequired: true },
  { actionId: 'standard-iac-remediation', label: 'Remediation requested', commentRequired: true },
];

export function isAwaitingCeoSignature(record: FisaStandardRecord): boolean {
  return record.workflow.stageId === 'ceo-signature' || record.workflow.stageId === 'ceo-signature-declined';
}

export type FisaStandardStatusTone = 'amber' | 'blue' | 'indigo' | 'emerald' | 'red';

export function fisaStandardStatusLabel(record: FisaStandardRecord): string {
  switch (record.workflow.stageId) {
    case 'qd-submission':
      return 'With Qualifications Development';
    case 'asd-evaluation':
      return 'Under ASD evaluation';
    case 'dd-review':
      return 'Under Deputy Director moderation';
    case 'director-office-review':
      return 'With Director Office for quality assurance';
    case 'iac-review':
      return 'Approved for tabling — awaiting IAC outcome';
    case 'ceo-signature':
      return 'Approved by the IAC — outcome letter pending CEO signature';
    case 'ceo-signature-declined':
      return 'Declined by the IAC — outcome letter pending CEO signature';
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
    case 'director-office-review':
      return 'indigo';
    case 'iac-review':
      return 'indigo';
    case 'ceo-signature':
      return 'blue';
    case 'ceo-signature-declined':
      return 'red';
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
