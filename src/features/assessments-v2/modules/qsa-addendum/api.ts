import { isChecklistComplete, type ChecklistSection } from '../../shared/checklist/types';
import { buildDdReviewChecklist } from '../../mock/data/ddReviewChecklistItems';
import { buildQsaAddendumChecklist } from '../../mock/data/qsaChecklistItems';
import { autoEvaluateQsaChecklist } from '../../mock/integrations/aiValidation';
import { readStore, writeStore } from '../../mock/api/storage';
import { addNotification } from '../../shared/notifications/store';
import { performAction } from '../../shared/workflow/engine';
import type { Role } from '../../types';
import { QSA_AUTO_EVALUATION_MANDATORY_ITEM_IDS } from './config';
import { ACK_WORKFLOW, APPROVAL_LETTER_WORKFLOW, EVAL_WORKFLOW, isApprovalLetterFinal, OUTCOME_WORKFLOW } from './workflow';
import type { ApprovalLetterDraft, EvaluationReport, NewApplicationInput, QsaAddendumApplication } from './types';

const KEY = 'qsaAddendum:applications';

function loadAll(): QsaAddendumApplication[] {
  return readStore<QsaAddendumApplication[]>(KEY, []);
}

function saveAll(apps: QsaAddendumApplication[]): void {
  writeStore(KEY, apps);
}

function getOrThrow(apps: QsaAddendumApplication[], id: string): QsaAddendumApplication {
  const app = apps.find((a) => a.id === id);
  if (!app) throw new Error(`QSA Addendum application "${id}" not found.`);
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

export async function createApplication(input: NewApplicationInput): Promise<QsaAddendumApplication> {
  const app: QsaAddendumApplication = {
    id: crypto.randomUUID(),
    ...input,
    ackState: { stageId: 'asd-preview' },
    evalState: { stageId: 'asd-evaluation' },
    outcomeState: { stageId: 'ceo-signature' },
    approvalState: null,
    approvalLetterDraft: null,
    approvalLetterSignedBy: null,
    qsaChecklist: buildQsaAddendumChecklist(),
    ddReviewChecklist: buildDdReviewChecklist(),
    evaluationReport: { findings: '', recommendation: '', approvedEisaSittingsPerYear: null },
    iacPresentationFileName: null,
  };
  const all = loadAll();
  saveAll([app, ...all]);
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

export async function performAckAction(params: ActionParams): Promise<QsaAddendumApplication> {
  const all = loadAll();
  const app = getOrThrow(all, params.applicationId);
  const nextState = performAction({
    definition: ACK_WORKFLOW,
    record: app.ackState,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: params.note,
    recordType: 'qsa-addendum-acknowledgement',
    recordId: app.id,
  });
  const updated = { ...app, ackState: nextState };
  saveAll(replace(all, updated));
  if (nextState.stageId === 'acknowledged') {
    addNotification({
      recipientRole: 'QP',
      title: 'Acknowledgement letter ready',
      body: `Your acknowledgement letter for "${app.qualificationTitle}" is ready to view.`,
    });
  }
  return updated;
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
    if (app.evaluationReport.approvedEisaSittingsPerYear == null) {
      throw new Error('Record the approved EISA sittings per year before the evaluation outcome can be generated.');
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
  if (params.actionId === 'eval-dd-send-to-iac' && !isChecklistComplete(app.ddReviewChecklist, true)) {
    throw new Error('Every Deputy Director checklist line needs an answer and a comment before sending to the IAC.');
  }
  if (
    (params.actionId === 'eval-iac-approve' || params.actionId === 'eval-iac-decline' || params.actionId === 'eval-iac-remediation') &&
    !app.iacPresentationFileName
  ) {
    throw new Error('Upload the summary presentation before recording an IAC decision.');
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
  const updated = { ...app, evalState: nextState };
  saveAll(replace(all, updated));

  if (nextState.stageId === 'qp-corrections') {
    addNotification({
      recipientRole: 'QP',
      title: 'Negative evaluation outcome — corrections needed',
      body: params.note
        ? `The evaluation of "${app.qualificationTitle}" was negative. ASD notes: ${params.note}`
        : `The evaluation of "${app.qualificationTitle}" was negative. See the evaluation report for details and correct and resubmit.`,
    });
  }
  if (nextState.stageId === 'approved' || nextState.stageId === 'declined') {
    addNotification({
      recipientRole: 'QP',
      title: 'QSA Addendum decision reached',
      body: `The IAC has reached a decision on "${app.qualificationTitle}". The outcome letter is being prepared.`,
    });
  }
  return updated;
}

export async function performOutcomeAction(params: ActionParams): Promise<QsaAddendumApplication> {
  const all = loadAll();
  const app = getOrThrow(all, params.applicationId);
  if (app.evalState.stageId !== 'approved' && app.evalState.stageId !== 'declined') {
    throw new Error('The outcome letter is only ready once the IAC has reached a decision.');
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
  if (nextState.stageId === 'signed' && app.evalState.stageId === 'approved' && !updated.approvalState) {
    // Row 13: the approval letter now starts as an ASD draft, not straight at the signer.
    updated = { ...updated, approvalState: { stageId: 'asd-draft' }, approvalLetterDraft: { notes: '' } };
  }
  saveAll(replace(all, updated));

  if (nextState.stageId === 'signed') {
    addNotification({
      recipientRole: 'QP',
      title: 'Outcome letter signed',
      body: `The outcome letter for "${app.qualificationTitle}" has been signed and is ready to view.`,
    });
  }
  return updated;
}

export async function performApprovalLetterAction(params: ActionParams): Promise<QsaAddendumApplication> {
  const all = loadAll();
  const app = getOrThrow(all, params.applicationId);
  if (!app.approvalState) {
    throw new Error('The approval letter is only ready once the outcome letter has been signed.');
  }

  const nextState = performAction({
    definition: APPROVAL_LETTER_WORKFLOW,
    record: app.approvalState,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: params.note,
    recordType: 'qsa-addendum-approval-letter',
    recordId: app.id,
  });
  let updated = { ...app, approvalState: nextState };
  // The Deputy Director's name needs to survive the later "send to QP" step, which
  // overwrites `approvalState.submittedBy` with the ASD's name.
  if (params.actionId === 'approval-sign') {
    updated = { ...updated, approvalLetterSignedBy: nextState.submittedBy ?? null };
  }
  saveAll(replace(all, updated));

  if (nextState.stageId === 'sent-to-qp') {
    addNotification({
      recipientRole: 'QP',
      title: 'Approval letter sent',
      body: `The signed approval letter for "${app.qualificationTitle}" has been sent to you. It is now approved and available to EISA Instrument Validation and the EISA Calendar.`,
    });
  }
  return updated;
}

export async function saveApprovalLetterDraft(applicationId: string, draft: ApprovalLetterDraft): Promise<QsaAddendumApplication> {
  const all = loadAll();
  const app = getOrThrow(all, applicationId);
  const updated = { ...app, approvalLetterDraft: draft };
  saveAll(replace(all, updated));
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

// CR: once approved, the QSA Addendum is available to EISA Instrument Validation and the
// EISA Calendar (built in later phases) — they will read this list instead of all applications.
export async function listApprovedQsaAddenda(): Promise<QsaAddendumApplication[]> {
  return loadAll().filter((a) => isApprovalLetterFinal(a.approvalState));
}
