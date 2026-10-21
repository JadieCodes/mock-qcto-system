import type { WorkflowDefinition } from '../../shared/workflow/types';
import { REGISTRATION_PROCESSOR_ROLE } from './config';
import type { EisaRegistrationRecord } from './types';

// CR-024: started by the SDP for a published sitting — never by instrument validation
// finishing. CR-038's per-learner SOR flag/correct loop happens inside "ad-review" without a
// stage change (see api.ts) — only the final registration-number decision moves the stage.
export const REGISTRATION_WORKFLOW: WorkflowDefinition = {
  id: 'eisa-registration',
  stages: [
    { id: 'sdp-submission', label: 'SDP building registration', allowedRoles: ['SDP'] },
    { id: 'ad-review', label: 'Assistant Director review', allowedRoles: [REGISTRATION_PROCESSOR_ROLE] },
    { id: 'registered', label: 'Registered', allowedRoles: [] },
  ],
  actions: [
    { id: 'reg-submit', label: 'Submit to Assistant Director', fromStage: 'sdp-submission', toStage: 'ad-review', kind: 'advance' },
    { id: 'reg-create-number', label: 'Create registration number', fromStage: 'ad-review', toStage: 'registered', kind: 'complete' },
  ],
};

export type RegistrationStatusTone = 'amber' | 'blue' | 'emerald' | 'red';

export function registrationStatusLabel(record: EisaRegistrationRecord): string {
  if (record.workflow.stageId === 'registered') return `Registered — ${record.registrationNumber ?? ''}`.trim();
  if (record.workflow.stageId === 'ad-review') {
    return record.learners.some((l) => l.sorStatus === 'flagged') ? 'With Assistant Director — SOR flagged' : 'With Assistant Director';
  }
  return 'Building registration';
}

export function registrationStatusTone(record: EisaRegistrationRecord): RegistrationStatusTone {
  if (record.workflow.stageId === 'registered') return 'emerald';
  if (record.workflow.stageId === 'ad-review') return record.learners.some((l) => l.sorStatus === 'flagged') ? 'red' : 'blue';
  return 'amber';
}
