import { addWorkingDays, toIsoDate, workingDaysBetween } from '../../shared/dates/workingDays';
import type { ValidationIssue } from '../../shared/validation/types';
import type { WorkflowDefinition } from '../../shared/workflow/types';
import { POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT } from '../site-visits/config';
import {
  FISA_RESULTS_SUBMITTER_ROLE,
  RESULTS_AD_ROLE,
  RESULTS_CHIEF_DIRECTOR_ROLE,
  RESULTS_DD_ROLE,
  RESULTS_DIRECTOR_ROLE,
  RESULTS_DUE_SOON_WINDOW_WORKING_DAYS,
  RESULTS_SUBMISSION_DEADLINE_WORKING_DAYS,
} from './config';
import type { FisaResultsBatch, ResultsBatch } from './types';

// CR-059: ASD (compliance review -> evidence evaluation -> folder-by-folder
// checklist) -> Deputy Director -> Director -> Chief Director final approval. The register's
// "QCTO can approve or decline" is read as available at every one of QCTO's four internal
// stages, not only the last one — mirroring this domain's running "decline/send-back
// available on every approval stage" theme (CR-056), in the absence of a stage-specific
// restriction. A decline always needs a reason; the QP is notified and can resubmit, which
// loops the batch back to a fresh 'ad-review' cycle.
export const RESULTS_WORKFLOW: WorkflowDefinition = {
  id: 'approval-of-results',
  stages: [
    { id: 'ad-review', label: 'ASD review', allowedRoles: [RESULTS_AD_ROLE] },
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

// QCTO feedback 3.14: FISA results go through the same internal chain and checks as EISA
// (the stages and actions above, reused as they are). Two differences only: the SDP builds a
// draft first and submits it, and a declined batch goes back to the SDP, not a QP.
export const FISA_RESULTS_WORKFLOW: WorkflowDefinition = {
  id: 'fisa-approval-of-results',
  stages: [
    { id: 'sdp-draft', label: 'Awaiting submission', allowedRoles: [FISA_RESULTS_SUBMITTER_ROLE] },
    ...RESULTS_WORKFLOW.stages.map((stage) => (stage.id === 'declined' ? { ...stage, allowedRoles: [FISA_RESULTS_SUBMITTER_ROLE] } : stage)),
  ],
  actions: [
    { id: 'fisa-submit', label: 'Submit results', fromStage: 'sdp-draft', toStage: 'ad-review', kind: 'advance' },
    ...RESULTS_WORKFLOW.actions,
  ],
};

export type ResultsStatusTone = 'gray' | 'amber' | 'blue' | 'indigo' | 'purple' | 'emerald' | 'red';

// What the status badge needs — shared by EISA and FISA batches.
export type ResultsStatusSource = Pick<ResultsBatch, 'workflow' | 'cycleCount' | 'recommendation'>;

export function resultsStatusLabel(batch: ResultsStatusSource): string {
  switch (batch.workflow.stageId) {
    case 'sdp-draft':
      return 'Awaiting submission';
    case 'ad-review':
      return batch.cycleCount > 1 ? `With ASD (cycle ${batch.cycleCount})` : 'With ASD';
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

export function resultsStatusTone(batch: ResultsStatusSource): ResultsStatusTone {
  switch (batch.workflow.stageId) {
    case 'sdp-draft':
      return 'gray';
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
// Monitoring threshold (QCTO feedback 2.8).
export function competencyRatePercent(batch: ResultsBatch): number {
  if (batch.learnerCount === 0) return 0;
  return Math.round((competentCountOf(batch) / batch.learnerCount) * 1000) / 10;
}

// QCTO feedback 2.8: the one comparison against the threshold, used by the api, the screen and the seed.
export function isBelowPostEisaThreshold(batch: ResultsBatch): boolean {
  return competencyRatePercent(batch) < POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT;
}

// QCTO feedback 3.14: the FISA batch rate, from the learners the SDP put on the batch.
export function fisaCompetentCountOf(batch: Pick<FisaResultsBatch, 'learnerResults'>): number {
  return batch.learnerResults.filter((r) => r.outcome === 'competent').length;
}

export function fisaCompetencyRatePercent(batch: Pick<FisaResultsBatch, 'learnerResults'>): number {
  if (batch.learnerResults.length === 0) return 0;
  return Math.round((fisaCompetentCountOf(batch) / batch.learnerResults.length) * 1000) / 10;
}

// QCTO feedback 3.14: what must be in place before the SDP can submit a FISA batch. Shown on
// screen and enforced in fisaApi.ts submitFisaResultsBatch().
export function fisaSubmissionIssues(
  batch: Pick<FisaResultsBatch, 'learnerResults' | 'evidenceDocuments'>,
  declarationAccepted: boolean,
): ValidationIssue[] {
  return [
    ...(batch.learnerResults.length === 0
      ? [{ field: 'learnerResults', message: 'Add at least one learner with a result (Competent or Not yet competent).' }]
      : []),
    ...(batch.evidenceDocuments.length === 0 ? [{ field: 'evidenceDocuments', message: 'Upload at least one evidence file.' }] : []),
    ...(batch.evidenceDocuments.some((d) => !d.tag) ? [{ field: 'evidenceTags', message: 'Every evidence file needs a tag.' }] : []),
    ...(declarationAccepted ? [] : [{ field: 'declaration', message: 'Tick the declaration.' }]),
  ];
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
