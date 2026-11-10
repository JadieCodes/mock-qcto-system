import { buildRplToolkitModerationChecklist } from '../../mock/data/rplToolkitModerationChecklistItems';
import { readStore, writeStore } from '../../mock/api/storage';
import { addNotification } from '../../shared/notifications/store';
import { getPerson } from '../../shared/people/directory';
import { isChecklistComplete, type ChecklistSection } from '../../shared/checklist/types';
import { RPL_EVALUATOR_DEFAULT_DESIGNATION, qctoEvaluationOf, qctoFeedbackIssues, selfAuditIssues, selfAuditOf } from './selfAudit';
import { performAction } from '../../shared/workflow/engine';
import type { Role } from '../../types';
import { RPL_EVAL_WORKFLOW, RPL_OUTCOME_WORKFLOW } from './workflow';
import type { NewRplToolkitInput, RplQctoEvaluation, RplSelfAudit, RplToolkitApplication } from './types';

export const KEY = 'rplToolkit:applications';

// Batch W: a toolkit stored before QCTO's "QP RPL Evaluation" gets a blank self-audit and a blank
// QCTO evaluation (each only when missing, so this can run any number of times). Answers on the old
// checklist stay where they are and show read-only as "Answered on the previous checklist"; the
// new questions start unanswered.
function loadAll(): RplToolkitApplication[] {
  return readStore<RplToolkitApplication[]>(KEY, []).map((app) =>
    app.selfAudit && app.qctoEvaluation ? app : { ...app, selfAudit: selfAuditOf(app), qctoEvaluation: qctoEvaluationOf(app) },
  );
}

function saveAll(apps: RplToolkitApplication[]): void {
  writeStore(KEY, apps);
}

function getOrThrow(apps: RplToolkitApplication[], id: string): RplToolkitApplication {
  const app = apps.find((a) => a.id === id);
  if (!app) throw new Error(`RPL Toolkit application "${id}" not found.`);
  return app;
}

function replace(apps: RplToolkitApplication[], updated: RplToolkitApplication): RplToolkitApplication[] {
  return apps.map((a) => (a.id === updated.id ? updated : a));
}

export async function listRplToolkitApplications(): Promise<RplToolkitApplication[]> {
  return loadAll();
}

export async function getRplToolkitApplication(id: string): Promise<RplToolkitApplication | undefined> {
  return loadAll().find((a) => a.id === id);
}

// Row 48 (test findings J-05): the QP's own approved toolkits, offered when they pick
// "Updated toolkit" so the new submission can be linked to the one it supersedes.
export async function listApprovedRplToolkitsForQp(qpId: string): Promise<RplToolkitApplication[]> {
  return loadAll().filter((a) => a.qpId === qpId && a.evalState.stageId === 'approved');
}

export async function createRplToolkitApplication(input: NewRplToolkitInput): Promise<RplToolkitApplication> {
  // Batch W: the QP's self-audit is part of the submission.
  const auditIssues = selfAuditIssues(input.selfAudit);
  if (auditIssues.length > 0) throw new Error(auditIssues[0].message);
  let version = 1;
  let updatesToolkitId: string | null = null;

  if (input.toolkitType === 'updated') {
    if (!input.updatesToolkitId) {
      throw new Error('Pick the existing approved toolkit this update is for.');
    }
    const approved = await listApprovedRplToolkitsForQp(input.qpId);
    const previous = approved.find((a) => a.id === input.updatesToolkitId);
    if (!previous) {
      throw new Error('The selected toolkit is not one of your approved toolkits.');
    }
    version = previous.version + 1;
    updatesToolkitId = previous.id;
  }

  const app: RplToolkitApplication = {
    id: crypto.randomUUID(),
    ...input,
    evalState: { stageId: 'ad-allocation', submittedBy: input.qpName, submittedById: input.qpId },
    outcomeState: { stageId: 'ceo-signature' },
    allocatedAsdId: null,
    allocatedAsdName: null,
    checklist: [],
    evaluationReport: { findings: '', recommendation: '' },
    qctoEvaluation: qctoEvaluationOf({}),
    moderationChecklist: buildRplToolkitModerationChecklist(),
    iacEndorsementNote: '',
    version,
    updatesToolkitId,
    createdBy: input.qpName,
    createdAt: new Date().toISOString(),
  };
  saveAll([app, ...loadAll()]);
  return app;
}

// Batch W: the QP corrects the self-audit while the toolkit is back with them.
export async function saveRplSelfAudit(applicationId: string, selfAudit: RplSelfAudit): Promise<RplToolkitApplication> {
  const all = loadAll();
  const app = getOrThrow(all, applicationId);
  if (app.evalState.stageId !== 'qp-corrections') throw new Error('The self audit can only be changed while corrections are requested.');
  const updated = { ...app, selfAudit: { ...selfAudit, lines: mergeFeedback(selfAudit, app) } };
  saveAll(replace(all, updated));
  return updated;
}

// The QP's form never carries the ASD's feedback, so a save keeps what the ASD wrote.
function mergeFeedback(incoming: RplSelfAudit, app: RplToolkitApplication): RplSelfAudit['lines'] {
  const stored = selfAuditOf(app).lines;
  return Object.fromEntries(Object.entries(incoming.lines).map(([id, line]) => [id, { ...line, qctoFeedback: stored[id]?.qctoFeedback ?? line.qctoFeedback }]));
}

// Batch W: the ASD's QCTO feedback per question, then the approved decision, comments and evaluator.
export async function saveRplAsdEvaluation(
  applicationId: string,
  feedback: Record<string, string>,
  evaluation: RplQctoEvaluation,
): Promise<RplToolkitApplication> {
  const all = loadAll();
  const app = getOrThrow(all, applicationId);
  if (app.evalState.stageId !== 'asd-evaluation') throw new Error('The QCTO feedback can only be written during the ASD evaluation.');
  const audit = selfAuditOf(app);
  const lines = Object.fromEntries(Object.entries(audit.lines).map(([id, line]) => [id, { ...line, qctoFeedback: feedback[id] ?? line.qctoFeedback }]));
  const updated = { ...app, selfAudit: { ...audit, lines }, qctoEvaluation: evaluation };
  saveAll(replace(all, updated));
  return updated;
}

// Row 46: the Director & Team's own moderation checklist, separate from the ASD's evaluation
// checklist — CR-011's mandatory per-line comment applies here too.
export async function saveRplModerationChecklist(applicationId: string, sections: ChecklistSection[]): Promise<RplToolkitApplication> {
  const all = loadAll();
  const app = getOrThrow(all, applicationId);
  const updated = { ...app, moderationChecklist: sections };
  saveAll(replace(all, updated));
  return updated;
}

// Row 46: the IAC's own endorsement note, required before it can approve or send for
// remediation — mirrors the QSA Addendum's "IAC Summary Presentation" gate.
export async function saveRplIacEndorsementNote(applicationId: string, note: string): Promise<RplToolkitApplication> {
  const all = loadAll();
  const app = getOrThrow(all, applicationId);
  const updated = { ...app, iacEndorsementNote: note };
  saveAll(replace(all, updated));
  return updated;
}

interface EvalActionParams {
  applicationId: string;
  actionId: string;
  actorRole: Role;
  actorId: string;
  actorName: string;
  note?: string;
  allocatedAsdId?: string;
}

export async function performRplEvaluationAction(params: EvalActionParams): Promise<RplToolkitApplication> {
  const all = loadAll();
  const app = getOrThrow(all, params.applicationId);

  if (params.actionId === 'rpl-allocate' && !params.allocatedAsdId) {
    throw new Error('Pick the ASD this RPL Toolkit is allocated to.');
  }
  // Batch W: "Approved = Yes leads to Send to DD; No leads to Return to QP for corrections".
  const evaluation = qctoEvaluationOf(app);
  if (params.actionId === 'rpl-asd-send-to-dd' || params.actionId === 'rpl-return-to-qp') {
    const feedbackIssues = qctoFeedbackIssues(selfAuditOf(app), evaluation);
    if (feedbackIssues.length > 0) throw new Error(feedbackIssues[0].message);
    if (params.actionId === 'rpl-asd-send-to-dd' && evaluation.approved !== 'yes') {
      throw new Error('Only an approved RPL Toolkit (Approved = Yes) goes to the Deputy Director. Select Return to QP for corrections instead.');
    }
    if (params.actionId === 'rpl-return-to-qp' && evaluation.approved !== 'no') {
      throw new Error('Return to QP for corrections needs Approved = No.');
    }
  }
  if (params.actionId === 'rpl-qp-resubmit') {
    const auditIssues = selfAuditIssues(selfAuditOf(app));
    if (auditIssues.length > 0) throw new Error(auditIssues[0].message);
  }
  // Row 46: the Director & Team must complete the moderation checklist before sending to IAC.
  if (params.actionId === 'rpl-director-team-send-to-iac' && !isChecklistComplete(app.moderationChecklist, true)) {
    throw new Error('Every moderation checklist line needs an answer and a comment before sending to the IAC.');
  }
  // Row 46: the IAC must record an endorsement note before it can approve or send for
  // remediation — mirrors the QSA Addendum's mandatory IAC presentation gate.
  if (
    (params.actionId === 'rpl-iac-approve' || params.actionId === 'rpl-iac-remediation') &&
    !app.iacEndorsementNote.trim()
  ) {
    throw new Error('Record the IAC endorsement note before reaching a decision.');
  }

  const nextState = performAction({
    definition: RPL_EVAL_WORKFLOW,
    record: app.evalState,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: params.note,
    recordType: 'rpl-toolkit-evaluation',
    recordId: app.id,
  });

  let updated: RplToolkitApplication = { ...app, evalState: nextState };
  if (params.actionId === 'rpl-asd-send-to-dd' || params.actionId === 'rpl-return-to-qp') {
    // "Evaluated by (QCTO official)": what the ASD left blank is the ASD and the action date.
    updated = {
      ...updated,
      qctoEvaluation: {
        ...evaluation,
        evaluatedByName: evaluation.evaluatedByName.trim() || params.actorName,
        evaluatedByDesignation: evaluation.evaluatedByDesignation.trim() || RPL_EVALUATOR_DEFAULT_DESIGNATION,
        evaluatedOn: evaluation.evaluatedOn || new Date().toISOString().slice(0, 10),
      },
    };
  }

  // The next ASD pass decides Approved afresh; the feedback already written stays.
  if (params.actionId === 'rpl-qp-resubmit') {
    updated = { ...updated, qctoEvaluation: { ...evaluation, approved: '' } };
  }

  if (params.actionId === 'rpl-allocate' && params.allocatedAsdId) {
    const asd = getPerson(params.allocatedAsdId);
    if (!asd || asd.role !== 'ASD') throw new Error('The allocation target must be a named ASD.');
    updated = { ...updated, allocatedAsdId: asd.id, allocatedAsdName: asd.name };
    addNotification({
      recipientRole: 'ASD',
      title: 'RPL Toolkit allocated',
      body: `"${app.toolkitTitle}" has been allocated to ${asd.name} for evaluation.`,
    });
  }

  if (nextState.stageId === 'qp-corrections') {
    addNotification({
      recipientRole: 'QP',
      title: 'Corrections requested',
      body: `Corrections were requested on "${app.toolkitTitle}": ${params.note ?? ''}`,
    });
  } else if (nextState.stageId === 'approved' || nextState.stageId === 'declined') {
    addNotification({
      recipientRole: 'QP',
      title: 'RPL Toolkit decision reached',
      body: `The IAC has reached a decision on "${app.toolkitTitle}". The outcome letter is being prepared.`,
    });
  } else if (params.actionId !== 'rpl-allocate') {
    // Every other handoff (ASD -> DD, DD -> Director & Team, Director & Team -> IAC, and every
    // send-back to the ASD) notifies whoever can act next, derived from the workflow definition
    // itself — same generic pattern as FISA Standards' performStandardAction. This was missing
    // entirely before: the chain only ever notified the allocated ASD and the QP, so nobody
    // downstream (DD, Director & Team, IAC) was told a record had reached them.
    const nextStage = RPL_EVAL_WORKFLOW.stages.find((s) => s.id === nextState.stageId);
    const action = RPL_EVAL_WORKFLOW.actions.find((a) => a.id === params.actionId);
    const title = action?.kind === 'send-back' ? 'RPL Toolkit sent back for clarification' : `RPL Toolkit ready: ${nextStage?.label ?? nextState.stageId}`;
    const body = params.note
      ? `"${app.toolkitTitle}": ${params.note}`
      : `"${app.toolkitTitle}" is now at ${nextStage?.label ?? nextState.stageId}.`;
    if (nextStage?.allowedRoles[0]) {
      addNotification({ recipientRole: nextStage.allowedRoles[0], title, body });
    }
  }

  saveAll(replace(all, updated));
  return updated;
}

interface OutcomeActionParams {
  applicationId: string;
  actionId: string;
  actorRole: Role;
  actorId: string;
  actorName: string;
}

export async function performRplOutcomeAction(params: OutcomeActionParams): Promise<RplToolkitApplication> {
  const all = loadAll();
  const app = getOrThrow(all, params.applicationId);
  if (app.evalState.stageId !== 'approved' && app.evalState.stageId !== 'declined') {
    throw new Error('The outcome letter is only ready once the IAC has reached a decision.');
  }

  const nextState = performAction({
    definition: RPL_OUTCOME_WORKFLOW,
    record: app.outcomeState,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    recordType: 'rpl-toolkit-outcome',
    recordId: app.id,
  });

  const updated: RplToolkitApplication = { ...app, outcomeState: nextState };
  saveAll(replace(all, updated));

  if (nextState.stageId === 'signed') {
    addNotification({
      recipientRole: 'QP',
      title: 'RPL Toolkit outcome letter signed',
      body: `The outcome letter for "${app.toolkitTitle}" has been signed and is ready to view.`,
    });
  }
  return updated;
}
