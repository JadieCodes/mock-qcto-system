import { addWorkingDays, toIsoDate, workingDaysBetween } from '../../shared/dates/workingDays';
import type { WorkflowDefinition } from '../../shared/workflow/types';
import {
  RESULTS_AD_ROLE,
  RESULTS_CHIEF_DIRECTOR_ROLE,
  RESULTS_DD_ROLE,
  RESULTS_DIRECTOR_ROLE,
  RESULTS_DUE_SOON_WINDOW_WORKING_DAYS,
  RESULTS_SUBMISSION_DEADLINE_WORKING_DAYS,
} from './config';
import type { ResultsBatch } from './types';

// CR-059: Assistant Director (compliance review -> evidence evaluation -> folder-by-folder
// checklist) -> Deputy Director -> Director -> Chief Director final approval. The register's
// "QCTO can approve or decline" is read as available at every one of QCTO's four internal
// stages, not only the last one — mirroring this domain's running "decline/send-back
// available on every approval stage" theme (CR-056), in the absence of a stage-specific
// restriction. A decline always needs a reason; the QP is notified and can resubmit, which
// loops the batch back to a fresh 'ad-review' cycle.
export const RESULTS_WORKFLOW: WorkflowDefinition = {
  id: 'approval-of-results',
  stages: [
    { id: 'ad-review', label: 'Assistant Director review', allowedRoles: [RESULTS_AD_ROLE] },
    { id: 'dd-review', label: 'Deputy Director review', allowedRoles: [RESULTS_DD_ROLE] },
    { id: 'director-review', label: 'Director review', allowedRoles: [RESULTS_DIRECTOR_ROLE] },
    { id: 'chief-director-review', label: 'Chief Director review', allowedRoles: [RESULTS_CHIEF_DIRECTOR_ROLE] },
    { id: 'approved', label: 'Approved', allowedRoles: [] },
    { id: 'declined', label: 'Declined', allowedRoles: ['QP'] },
  ],
  actions: [
    { id: 'ad-advance', label: 'Send to Deputy Director', fromStage: 'ad-review', toStage: 'dd-review', kind: 'advance' },
    { id: 'ad-decline', label: 'Decline', fromStage: 'ad-review', toStage: 'declined', kind: 'reject', requiresNote: true },
    { id: 'dd-advance', label: 'Send to Director', fromStage: 'dd-review', toStage: 'director-review', kind: 'advance' },
    { id: 'dd-decline', label: 'Decline', fromStage: 'dd-review', toStage: 'declined', kind: 'reject', requiresNote: true },
    { id: 'director-advance', label: 'Send to Chief Director', fromStage: 'director-review', toStage: 'chief-director-review', kind: 'advance' },
    { id: 'director-decline', label: 'Decline', fromStage: 'director-review', toStage: 'declined', kind: 'reject', requiresNote: true },
    { id: 'chief-director-approve', label: 'Final Approval', fromStage: 'chief-director-review', toStage: 'approved', kind: 'complete' },
    {
      id: 'chief-director-decline',
      label: 'Decline',
      fromStage: 'chief-director-review',
      toStage: 'declined',
      kind: 'reject',
      requiresNote: true,
    },
    { id: 'batch-resubmit', label: 'Resubmit', fromStage: 'declined', toStage: 'ad-review', kind: 'advance' },
  ],
};

export type ResultsStatusTone = 'amber' | 'blue' | 'indigo' | 'purple' | 'emerald' | 'red';

export function resultsStatusLabel(batch: ResultsBatch): string {
  switch (batch.workflow.stageId) {
    case 'ad-review':
      return batch.cycleCount > 1 ? `With Assistant Director (cycle ${batch.cycleCount})` : 'With Assistant Director';
    case 'dd-review':
      return 'With Deputy Director';
    case 'director-review':
      return 'With Director';
    case 'chief-director-review':
      return 'With Chief Director';
    case 'approved':
      return batch.recommendation ? 'Approved — Recommended to Certification' : 'Approved';
    case 'declined':
      return 'Declined';
    default:
      return batch.workflow.stageId;
  }
}

export function resultsStatusTone(batch: ResultsBatch): ResultsStatusTone {
  switch (batch.workflow.stageId) {
    case 'ad-review':
      return 'amber';
    case 'dd-review':
      return 'blue';
    case 'director-review':
      return 'indigo';
    case 'chief-director-review':
      return 'purple';
    case 'approved':
      return 'emerald';
    case 'declined':
      return 'red';
    default:
      return 'amber';
  }
}

// Row 40: the competent count is derived from the per-learner results, not stored as its own
// hand-typed number.
export function competentCountOf(batch: ResultsBatch): number {
  return batch.learnerResults.filter((r) => r.outcome === 'competent').length;
}

// CR-059: the batch competency rate, shown to QCTO and checked against the Post-EISA
// Monitoring threshold (PM-06).
export function competencyRatePercent(batch: ResultsBatch): number {
  if (batch.learnerCount === 0) return 0;
  return Math.round((competentCountOf(batch) / batch.learnerCount) * 1000) / 10;
}

export function submissionDeadlineFor(sittingDate: string): string {
  return addWorkingDays(sittingDate, RESULTS_SUBMISSION_DEADLINE_WORKING_DAYS);
}

export type DeadlineState = 'on-track' | 'due-soon' | 'overdue';

// CR-059: the 21-working-day deadline, shown as a countdown with "due soon" and "overdue"
// states before a batch has been submitted.
export function deadlineState(deadlineIso: string, asOfIso: string = toIsoDate(new Date())): DeadlineState {
  if (asOfIso > deadlineIso) return 'overdue';
  return workingDaysBetween(asOfIso, deadlineIso) <= RESULTS_DUE_SOON_WINDOW_WORKING_DAYS ? 'due-soon' : 'on-track';
}

export function workingDaysRemaining(deadlineIso: string, asOfIso: string = toIsoDate(new Date())): number {
  return asOfIso > deadlineIso ? -workingDaysBetween(deadlineIso, asOfIso) : workingDaysBetween(asOfIso, deadlineIso);
}

export function submittedOnTime(submittedAt: string, submissionDeadline: string): boolean {
  return submittedAt.split('T')[0] <= submissionDeadline;
}
