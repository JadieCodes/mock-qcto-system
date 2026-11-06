import { appendAuditEntry } from '../../shared/audit/auditLog';
import { DIRECTOR_OFFICE_DIFFERENT_PERSON_MESSAGE, hasActedInRoles } from '../../shared/iac/differentPerson';
import {
  buildCertificationHandoff,
  CERTIFICATION_NOTIFIED_LABEL,
  componentsOf,
  validateAssessmentDetails,
  type AssessmentDetailsInput,
} from './assessmentDetails';
import { isChecklistComplete, type ChecklistSection } from '../../shared/checklist/types';
import { buildDdReviewChecklist } from '../../mock/data/ddReviewChecklistItems';
import { buildQsaAddendumChecklist } from '../../mock/data/qsaChecklistItems';
import { autoEvaluateQsaChecklist } from '../../mock/integrations/aiValidation';
import { readStore, writeStore } from '../../mock/api/storage';
import { addNotification } from '../../shared/notifications/store';
import { performAction } from '../../shared/workflow/engine';
import type { Role } from '../../types';
import { QSA_AUTO_EVALUATION_MANDATORY_ITEM_IDS } from './config';
import { REVIEW_COMPLETED_LABEL, withReviewStarted } from './review';
import { EVAL_WORKFLOW, isQasaApproved, isQasaUnderReview, OUTCOME_WORKFLOW } from './workflow';
import type { EvaluationReport, IacMinutesFile, NewApplicationInput, QsaAddendumApplication } from './types';

export const KEY = 'qsaAddendum:applications';

export const ACK_ISSUED_LABEL = 'Acknowledgement letter issued on submission';

function loadAll(): QsaAddendumApplication[] {
  return readStore<QsaAddendumApplication[]>(KEY, []);
}

function saveAll(apps: QsaAddendumApplication[]): void {
  writeStore(KEY, apps);
}

function getOrThrow(apps: QsaAddendumApplication[], id: string): QsaAddendumApplication {
  const app = apps.find((a) => a.id === id);
  if (!app) throw new Error(`QASA submission "${id}" not found.`);
  return app;
}

function replace(apps: QsaAddendumApplication[], updated: QsaAddendumApplication): QsaAddendumApplication[] {
  return apps.map((a) => (a.id === updated.id ? updated : a));
}

export async function listApplications(): Promise<QsaAddendumApplication[]> {
  return loadAll();
}

export async function getApplication(id: string): Promise<QsaAddendumApplication | undefined> {
  return loadAll().find((a) => a.id === id);
}

// QCTO feedback 05.5: the acknowledgement letter goes out at the point of submission, to
// acknowledge receipt — no ASD preview or DD review. Evaluation starts straight away.
export async function createApplication(input: NewApplicationInput): Promise<QsaAddendumApplication> {
  const app: QsaAddendumApplication = {
    id: crypto.randomUUID(),
    ...input,
    acknowledgementIssuedAt: new Date().toISOString(),
    evalState: { stageId: 'asd-evaluation' },
    outcomeState: { stageId: 'ceo-signature' },
    review: null,
    qsaChecklist: buildQsaAddendumChecklist(),
    ddReviewChecklist: buildDdReviewChecklist(),
    evaluationReport: { findings: '', recommendation: '', approvedEisaSittingsPerYear: null },
    iacPresentationFileName: null,
    iacMinutesFile: null,
  };
  const all = loadAll();
  saveAll([app, ...all]);
  appendAuditEntry({
    recordType: 'qsa-addendum-acknowledgement',
    recordId: app.id,
    actorRole: 'QP',
    actorId: input.qpId,
    actorName: input.qpName,
    action: ACK_ISSUED_LABEL,
  });
  addNotification({
    recipientRole: 'QP',
    title: 'Acknowledgement letter issued',
    body: `We received your QASA for "${app.qualificationTitle}". Your acknowledgement letter is ready to view.`,
  });
  return app;
}

interface ActionParams {
  applicationId: string;
  actionId: string;
  actorRole: Role;
  actorId: string;
  actorName: string;
  note?: string;
}

export async function performEvaluationAction(params: ActionParams): Promise<QsaAddendumApplication> {
  const all = loadAll();
  const app = getOrThrow(all, params.applicationId);

  // Row 7 (test findings): the ASD's outcome is generated automatically from the checklist —
  // they cannot choose between sending to the Deputy Director or back to the QP. Whichever of
  // these two actions they call, it must match what the auto-evaluation function computed.
  if (params.actionId === 'eval-send-to-dd' || params.actionId === 'eval-return-to-qp') {
    if (!isChecklistComplete(app.qsaChecklist, true)) {
      throw new Error('Every checklist line needs an answer and a comment before the evaluation outcome can be generated.');
    }
    if (!app.evaluationReport.findings.trim() || !app.evaluationReport.recommendation) {
      throw new Error('Complete the evaluation report (findings and recommendation) before the evaluation outcome can be generated.');
    }
    if (app.evaluationReport.approvedEisaSittingsPerYear == null && !app.evaluationReport.eisaSittingsOnDemand) {
      throw new Error('Record the approved EISA sittings per year (or mark them as on demand) before the evaluation outcome can be generated.');
    }
    const detailIssues = validateAssessmentDetails({ components: componentsOf(app) });
    if (detailIssues.length > 0) {
      throw new Error(detailIssues.map((i) => i.message).join(' '));
    }
    const outcome = autoEvaluateQsaChecklist(app.qsaChecklist, QSA_AUTO_EVALUATION_MANDATORY_ITEM_IDS);
    const expectedActionId = outcome === 'negative' ? 'eval-return-to-qp' : 'eval-send-to-dd';
    if (params.actionId !== expectedActionId) {
      throw new Error(
        `The automatic evaluation outcome is ${outcome.toUpperCase()} — ` +
          `${expectedActionId === 'eval-return-to-qp' ? 'the report goes back to the QP' : 'the report goes to the Deputy Director'}. The ASD cannot override this.`,
      );
    }
  }
  if (params.actionId === 'eval-dd-send-to-director-office' && !isChecklistComplete(app.ddReviewChecklist, true)) {
    throw new Error('Every Deputy Director checklist line needs an answer and a comment before sending to the Director Office.');
  }
  if (
    app.evalState.stageId === 'director-office-review' &&
    hasActedInRoles('qsa-addendum-evaluation', app.id, params.actorId, ['ASD', 'Deputy Director'])
  ) {
    throw new Error(DIRECTOR_OFFICE_DIFFERENT_PERSON_MESSAGE);
  }
  if (params.actionId === 'eval-start-review' && (!isQasaApproved(app) || isQasaUnderReview(app))) {
    throw new Error('A review can only be started on an approved QASA (feedback letter signed by the CEO) that is not already under review.');
  }

  const nextState = performAction({
    definition: EVAL_WORKFLOW,
    record: app.evalState,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: params.note,
    recordType: 'qsa-addendum-evaluation',
    recordId: app.id,
  });
  const updated =
    params.actionId === 'eval-start-review'
      ? withReviewStarted(app, nextState, {
          startedAt: new Date().toISOString(),
          startedBy: params.actorName,
          startedById: params.actorId,
          reason: params.note ?? '',
        })
      : { ...app, evalState: nextState };
  saveAll(replace(all, updated));

  if (params.actionId === 'eval-start-review') {
    // QCTO feedback 05.8: the QP sees the stage, not the DD's internal reason.
    addNotification({
      recipientRole: 'QP',
      title: 'Approved QASA under review',
      body: `Your approved QASA for "${app.qualificationTitle}" is being reviewed. It stays approved while the review runs. Follow it on the Progress tab.`,
    });
    addNotification({
      recipientRole: 'ASD',
      title: 'Approved QASA sent for review',
      body: `The Deputy Director started a review of the approved QASA for "${app.qualificationTitle}". It is back at ASD evaluation.`,
    });
  }
  if (nextState.stageId === 'qp-corrections') {
    addNotification(
      params.actionId === 'eval-iac-remediation'
        ? {
            recipientRole: 'QP',
            title: 'IAC requested remediation — corrections needed',
            body: `The IAC requested remediation on "${app.qualificationTitle}". IAC comment: ${params.note ?? ''} Correct the QASA and resubmit it.`,
          }
        : {
            recipientRole: 'QP',
            title: 'Negative evaluation outcome — corrections needed',
            body: params.note
              ? `The evaluation of "${app.qualificationTitle}" was negative. ASD notes: ${params.note}`
              : `The evaluation of "${app.qualificationTitle}" was negative. See the evaluation report for details and correct and resubmit.`,
          },
    );
  }
  if (params.actionId === 'eval-iac-approve') {
    addNotification({
      recipientRole: 'QP',
      title: 'QASA decision reached',
      body: `The IAC has approved "${app.qualificationTitle}". The feedback letter is with the CEO for signature.`,
    });
  }
  return updated;
}

export async function performOutcomeAction(params: ActionParams): Promise<QsaAddendumApplication> {
  const all = loadAll();
  const app = getOrThrow(all, params.applicationId);
  // QCTO feedback 05.7: the feedback letter is only reached when the IAC approves.
  if (app.evalState.stageId !== 'approved') {
    throw new Error('The feedback letter is only ready once the IAC has approved the QASA.');
  }

  const nextState = performAction({
    definition: OUTCOME_WORKFLOW,
    record: app.outcomeState,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: params.note,
    recordType: 'qsa-addendum-outcome-letter',
    recordId: app.id,
  });

  let updated: QsaAddendumApplication = { ...app, outcomeState: nextState };
  // QCTO feedback 3.3 / 05.1: simulated hand-off — the Certification domain has no role in this
  // build, so it is recorded on the QASA and in the audit trail, as Approval of Results does. A
  // completed review (05.2) notifies Certification again, with the reviewed details.
  if (nextState.stageId === 'signed') {
    const entry = { recordType: 'qsa-addendum-outcome-letter', recordId: app.id, actorRole: params.actorRole, actorId: params.actorId, actorName: params.actorName };
    updated = { ...updated, certificationHandoff: buildCertificationHandoff(updated, new Date().toISOString(), params.actorName) };
    appendAuditEntry({ ...entry, action: CERTIFICATION_NOTIFIED_LABEL });
    if (isQasaUnderReview(app)) {
      updated = { ...updated, review: null };
      appendAuditEntry({ ...entry, action: REVIEW_COMPLETED_LABEL });
    }
  }
  saveAll(replace(all, updated));

  if (nextState.stageId === 'signed') {
    // QCTO feedback 05.6: one letter only — the CEO-signed feedback letter is the approval.
    addNotification({
      recipientRole: 'QP',
      title: 'QASA approved — feedback letter signed',
      body: `The CEO has signed the feedback letter for "${app.qualificationTitle}". Your QASA is approved: the signed feedback letter is your approval. It is now available to EISA Instrument Validation and the EISA Calendar.`,
    });
  }
  return updated;
}

export async function saveQsaChecklist(applicationId: string, sections: ChecklistSection[]): Promise<QsaAddendumApplication> {
  const all = loadAll();
  const app = getOrThrow(all, applicationId);
  const updated = { ...app, qsaChecklist: sections };
  saveAll(replace(all, updated));
  return updated;
}

export async function saveDdReviewChecklist(applicationId: string, sections: ChecklistSection[]): Promise<QsaAddendumApplication> {
  const all = loadAll();
  const app = getOrThrow(all, applicationId);
  const updated = { ...app, ddReviewChecklist: sections };
  saveAll(replace(all, updated));
  return updated;
}

export async function saveEvaluationReport(applicationId: string, report: EvaluationReport): Promise<QsaAddendumApplication> {
  const all = loadAll();
  const app = getOrThrow(all, applicationId);
  const updated = { ...app, evaluationReport: report };
  saveAll(replace(all, updated));
  return updated;
}

export async function saveIacPresentation(applicationId: string, fileName: string): Promise<QsaAddendumApplication> {
  const all = loadAll();
  const app = getOrThrow(all, applicationId);
  const updated = { ...app, iacPresentationFileName: fileName };
  saveAll(replace(all, updated));
  return updated;
}

// QCTO feedback 3.3: the optional assessment details, captured by the ASD during evaluation.
export async function saveAssessmentDetails(applicationId: string, input: AssessmentDetailsInput): Promise<QsaAddendumApplication> {
  const all = loadAll();
  const app = getOrThrow(all, applicationId);
  if (app.evalState.stageId !== 'asd-evaluation') {
    throw new Error('The assessment details can only be changed while the ASD is evaluating the QASA.');
  }
  const issues = validateAssessmentDetails(input);
  if (issues.length > 0) throw new Error(issues.map((i) => i.message).join(' '));
  const updated = { ...app, assessmentComponents: input.components };
  saveAll(replace(all, updated));
  return updated;
}

// QCTO feedback 2.1: optional minutes from the IAC meeting, uploaded by the DD while recording
// the outcome. Null removes the file.
export async function saveIacMinutes(applicationId: string, file: IacMinutesFile | null): Promise<QsaAddendumApplication> {
  const all = loadAll();
  const app = getOrThrow(all, applicationId);
  if (app.evalState.stageId !== 'iac-review') {
    throw new Error('The committee minutes can only be changed while the IAC outcome is being recorded.');
  }
  const updated = { ...app, iacMinutesFile: file };
  saveAll(replace(all, updated));
  return updated;
}

// CR: once approved, the QASA is available to EISA Instrument Validation and the EISA Calendar.
// QCTO feedback 05.6: "approved" means isQasaApproved — IAC Approved and the CEO's signature on
// the feedback letter (still true while under review, 05.2).
export async function listApprovedQsaAddenda(): Promise<QsaAddendumApplication[]> {
  return loadAll().filter(isQasaApproved);
}
