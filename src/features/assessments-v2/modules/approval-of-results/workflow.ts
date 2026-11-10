import { fileUploadIssue } from '../../shared/files/fileCheck';
import { canActInStage } from '../../shared/workflow/engine';
import type { Role } from '../../types';
import { addWorkingDays, toIsoDate, workingDaysBetween } from '../../shared/dates/workingDays';
import type { ValidationIssue } from '../../shared/validation/types';
import type { WorkflowDefinition } from '../../shared/workflow/types';
import { POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT } from '../site-visits/config';
import { batchFiguresOf } from './calculation';
import {
  EISA_EVIDENCE_TAG_OPTIONS,
  EISA_REQUIRED_EVIDENCE_TAGS,
  EISA_SINGLE_USE_EVIDENCE_TAGS,
  eisaEvidenceTagLabel,
  FISA_EVIDENCE_TAG_OPTIONS,
  FISA_REQUIRED_EVIDENCE_TAGS,
  FISA_RESULTS_SUBMITTER_ROLE,
  FISA_SINGLE_USE_EVIDENCE_TAGS,
  fisaEvidenceTagLabel,
  RESULTS_AD_ROLE,
  RESULTS_CHIEF_DIRECTOR_ROLE,
  RESULTS_DD_ROLE,
  RESULTS_DIRECTOR_ROLE,
  RESULTS_DUE_SOON_WINDOW_WORKING_DAYS,
  RESULTS_SUBMISSION_DEADLINE_WORKING_DAYS,
} from './config';
import type { EisaEvidenceTag, EvidenceDocument, FisaEvidenceTag, FisaResultsBatch, OnFileDocument, OnFileDocumentChoice, OnFileDocumentId, ResultsBatch } from './types';

// CR-059: ASD (compliance review -> evidence evaluation -> folder-by-folder
// checklist) -> Deputy Director -> Director -> Chief Director final approval.
// Batch N1 (QCTO 5 Nov: "once you say decline... it's a decline"):
// - Every QCTO stage can "Request more evidence" (reason required). The batch goes back to the
//   QP (EISA) / SDP (FISA), who add evidence and resubmit: a fresh 'ad-review' cycle.
// - The Deputy Director and the Director can "Recommend decline" (reason required) while sending
//   the batch on. It shows to the next role.
// - Only the Chief Director can "Decline results". That is final: no resubmit, and the learners
//   rewrite at the next EISA. It needs the irregularities and corrective actions (api.ts).
export const RESULTS_WORKFLOW: WorkflowDefinition = {
  id: 'approval-of-results',
  stages: [
    { id: 'ad-review', label: 'ASD review', allowedRoles: [RESULTS_AD_ROLE] },
    { id: 'dd-review', label: 'Deputy Director review', allowedRoles: [RESULTS_DD_ROLE] },
    { id: 'director-review', label: 'Director review', allowedRoles: [RESULTS_DIRECTOR_ROLE] },
    { id: 'chief-director-review', label: 'Chief Director review', allowedRoles: [RESULTS_CHIEF_DIRECTOR_ROLE] },
    { id: 'approved', label: 'Approved', allowedRoles: [] },
    { id: 'more-evidence', label: 'More evidence requested', allowedRoles: ['QP'] },
    { id: 'declined', label: 'Declined', allowedRoles: [] },
  ],
  actions: [
    { id: 'ad-advance', label: 'Send to Deputy Director', fromStage: 'ad-review', toStage: 'dd-review', kind: 'advance' },
    { id: 'ad-request-evidence', label: 'Request more evidence', fromStage: 'ad-review', toStage: 'more-evidence', kind: 'send-back', requiresNote: true },
    { id: 'dd-advance', label: 'Send to Director', fromStage: 'dd-review', toStage: 'director-review', kind: 'advance' },
    { id: 'dd-recommend-decline', label: 'Recommend decline', fromStage: 'dd-review', toStage: 'director-review', kind: 'advance', requiresNote: true },
    { id: 'dd-request-evidence', label: 'Request more evidence', fromStage: 'dd-review', toStage: 'more-evidence', kind: 'send-back', requiresNote: true },
    { id: 'director-advance', label: 'Send to Chief Director', fromStage: 'director-review', toStage: 'chief-director-review', kind: 'advance' },
    {
      id: 'director-recommend-decline',
      label: 'Recommend decline',
      fromStage: 'director-review',
      toStage: 'chief-director-review',
      kind: 'advance',
      requiresNote: true,
    },
    { id: 'director-request-evidence', label: 'Request more evidence', fromStage: 'director-review', toStage: 'more-evidence', kind: 'send-back', requiresNote: true },
    { id: 'chief-director-approve', label: 'Final Approval', fromStage: 'chief-director-review', toStage: 'approved', kind: 'complete' },
    {
      id: 'chief-director-request-evidence',
      label: 'Request more evidence',
      fromStage: 'chief-director-review',
      toStage: 'more-evidence',
      kind: 'send-back',
      requiresNote: true,
    },
    { id: 'chief-director-decline', label: 'Decline results', fromStage: 'chief-director-review', toStage: 'declined', kind: 'reject', requiresNote: true },
    { id: 'batch-resubmit', label: 'Resubmit', fromStage: 'more-evidence', toStage: 'ad-review', kind: 'advance' },
  ],
};

// Batch N1: only the Chief Director, at the Chief Director stage, can decline the results.
export function canDeclineResults(role: Role, stageId: string): boolean {
  return role === RESULTS_CHIEF_DIRECTOR_ROLE && stageId === 'chief-director-review' && canActInStage(RESULTS_WORKFLOW, stageId, role);
}

export function isRequestEvidenceAction(actionId: string): boolean {
  return actionId.endsWith('-request-evidence');
}

export function isRecommendDeclineAction(actionId: string): boolean {
  return actionId.endsWith('-recommend-decline');
}

// QCTO feedback 3.14: FISA results go through the same internal chain and checks as EISA
// (the stages and actions above, reused as they are). Two differences only: the SDP builds a
// draft first and submits it, and "more evidence requested" goes back to the SDP, not a QP.
export const FISA_RESULTS_WORKFLOW: WorkflowDefinition = {
  id: 'fisa-approval-of-results',
  stages: [
    { id: 'sdp-draft', label: 'Awaiting submission', allowedRoles: [FISA_RESULTS_SUBMITTER_ROLE] },
    ...RESULTS_WORKFLOW.stages.map((stage) => (stage.id === 'more-evidence' ? { ...stage, allowedRoles: [FISA_RESULTS_SUBMITTER_ROLE] } : stage)),
  ],
  actions: [
    { id: 'fisa-submit', label: 'Submit results', fromStage: 'sdp-draft', toStage: 'ad-review', kind: 'advance' },
    ...RESULTS_WORKFLOW.actions,
  ],
};

export type ResultsStatusTone = 'gray' | 'amber' | 'blue' | 'indigo' | 'purple' | 'emerald' | 'red';

// What the status badge needs — shared by EISA and FISA batches.
export type ResultsStatusSource = Pick<ResultsBatch, 'workflow' | 'cycleCount' | 'recommendation'> & { id?: string };

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
    case 'more-evidence':
      return 'More evidence requested';
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
    case 'more-evidence':
      return 'amber';
    case 'declined':
      return 'red';
    default:
      return 'amber';
  }
}

// Row 40: the competent count is derived from the per-learner results, not stored as its own
// hand-typed number. QCTO feedback 29.31: from the per-component marks (calculation.ts).
export function competentCountOf(batch: ResultsBatch): number {
  return batchFiguresOf(batch).competent;
}

// CR-059: the batch competency rate, shown to QCTO and checked against the Post-EISA
// Monitoring threshold (QCTO feedback 2.8). QCTO feedback 29.31: competent ÷ wrote (absent
// learners are left out), from calculation.ts.
export function competencyRatePercent(batch: ResultsBatch): number {
  return batchFiguresOf(batch).competenceRatePercent;
}

// QCTO feedback 2.8: the one comparison against the threshold, used by the api, the screen and the seed.
export function isBelowPostEisaThreshold(batch: ResultsBatch): boolean {
  return competencyRatePercent(batch) < POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT;
}

// QCTO feedback 3.14, Batch N1: the FISA batch figures, from the learners the SDP put on the batch.
// Enrolled = every learner listed; completed = not absent; competency rate = competent / completed;
// throughput rate = completed / enrolled.
export interface FisaFigures {
  enrolled: number;
  completed: number;
  absent: number;
  competent: number;
  notYetCompetent: number;
  competencyRatePercent: number;
  throughputRatePercent: number;
}

function onePercent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;
}

export function fisaFiguresOf(batch: Pick<FisaResultsBatch, 'learnerResults'>): FisaFigures {
  const enrolled = batch.learnerResults.length;
  const absent = batch.learnerResults.filter((r) => r.outcome === 'absent').length;
  const competent = batch.learnerResults.filter((r) => r.outcome === 'competent').length;
  const completed = enrolled - absent;
  return {
    enrolled,
    completed,
    absent,
    competent,
    notYetCompetent: completed - competent,
    competencyRatePercent: onePercent(competent, completed),
    throughputRatePercent: onePercent(completed, enrolled),
  };
}

export function fisaCompetentCountOf(batch: Pick<FisaResultsBatch, 'learnerResults'>): number {
  return fisaFiguresOf(batch).competent;
}

export function fisaCompetencyRatePercent(batch: Pick<FisaResultsBatch, 'learnerResults'>): number {
  return fisaFiguresOf(batch).competencyRatePercent;
}

export function fisaThroughputRatePercent(batch: Pick<FisaResultsBatch, 'learnerResults'>): number {
  return fisaFiguresOf(batch).throughputRatePercent;
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
    ...(batch.evidenceDocuments.some((d) => !d.tag) ? [{ field: 'evidenceTags', message: 'Every evidence file needs a tag.' }] : []),
    // Batch P (05.18): QCTO's report, Section D. The message names what is missing.
    ...FISA_REQUIRED_EVIDENCE_TAGS.filter((tag) => !batch.evidenceDocuments.some((d) => d.tag === tag)).map((tag) => ({
      field: `evidence-${tag}`,
      message: `Upload the ${fisaEvidenceTagLabel(tag).toLowerCase()}.`,
    })),
    ...FISA_SINGLE_USE_EVIDENCE_TAGS.filter((tag) => batch.evidenceDocuments.filter((d) => d.tag === tag).length > 1).map((tag) => ({
      field: `evidence-${tag}-once`,
      message: `Use the ${fisaEvidenceTagLabel(tag).toLowerCase()} tag once only. Remove the extra file.`,
    })),
    ...(declarationAccepted ? [] : [{ field: 'declaration', message: 'Tick the declaration.' }]),
  ];
}

// Batch P (05.18): the same single-use rule for FISA evidence.
export function availableFisaEvidenceTags(files: { tag: FisaEvidenceTag }[]): FisaEvidenceTag[] {
  const used = new Set(files.map((f) => f.tag));
  return FISA_EVIDENCE_TAG_OPTIONS.map((o) => o.value).filter((tag) => !(FISA_SINGLE_USE_EVIDENCE_TAGS.includes(tag) && used.has(tag)));
}

// Batch M.1: the tags still offered for the next EISA evidence file — a single-use tag drops out
// once a file carries it, and comes back when that file is removed.
export function availableEisaEvidenceTags(files: EvidenceDocument[]): EisaEvidenceTag[] {
  const used = new Set(files.map((f) => f.tag));
  return EISA_EVIDENCE_TAG_OPTIONS.map((o) => o.value).filter((tag) => !(EISA_SINGLE_USE_EVIDENCE_TAGS.includes(tag) && used.has(tag)));
}

// Batch M.1: what "Replace" on an "Already on file" line does. An empty file leaves the choices
// exactly as they were and returns the message; a real file sets only that document's choice.
export function replaceOnFileDocument(
  choices: OnFileDocumentChoice[],
  documentId: OnFileDocumentId,
  file: { name: string; size: number; type: string },
  uploadedAt: string = new Date().toISOString(),
): { choices: OnFileDocumentChoice[]; error: string | null } {
  const error = fileUploadIssue(file);
  if (error) return { choices, error };
  const next: OnFileDocumentChoice = {
    documentId,
    choice: 'replaced',
    replacement: { fileName: file.name, fileSize: file.size, fileType: file.type || 'unknown', uploadedAt },
  };
  return { choices: [...choices.filter((c) => c.documentId !== documentId), next], error: null };
}

// QCTO feedback 29.23, 29.25, 29.26: what must be in place on an EISA batch besides the marks
// before the QP can submit. Shown on screen and enforced in api.ts submitResultsBatch().
export function eisaSubmissionIssues(
  evidenceDocuments: EvidenceDocument[],
  onFile: OnFileDocument[],
  choices: OnFileDocumentChoice[],
  declarationAccepted: boolean,
): ValidationIssue[] {
  const missingEvidence = EISA_REQUIRED_EVIDENCE_TAGS.filter((tag) => !evidenceDocuments.some((d) => d.tag === tag)).map((tag) => ({
    field: `evidence-${tag}`,
    message: `Upload the ${eisaEvidenceTagLabel(tag).toLowerCase()}.`,
  }));
  const repeatedSingleUse = EISA_SINGLE_USE_EVIDENCE_TAGS.filter((tag) => evidenceDocuments.filter((d) => d.tag === tag).length > 1).map((tag) => ({
    field: `evidence-${tag}-once`,
    message: `Use the ${eisaEvidenceTagLabel(tag).toLowerCase()} tag once only. Remove the extra file.`,
  }));
  const unconfirmed = onFile
    .filter((doc) => !choices.some((c) => c.documentId === doc.id && (c.choice === 'confirmed' || c.replacement !== null)))
    .map((doc) => ({ field: `on-file-${doc.id}`, message: `Confirm or replace: ${doc.label}.` }));
  return [
    ...missingEvidence,
    ...repeatedSingleUse,
    ...unconfirmed,
    ...(declarationAccepted ? [] : [{ field: 'declaration', message: 'Tick the declaration.' }]),
  ];
}

// Batch W: where the sitting has an accepted EISA Confirmation with a results submission date, the
// batch is due on that date (QCTO 29.20); otherwise the 21-working-day rule applies.
export function submissionDeadlineFor(sittingDate: string, confirmedResultsDate?: string | null): string {
  if (confirmedResultsDate) return confirmedResultsDate;
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
