import { buildRplToolkitChecklist } from '../../mock/data/rplToolkitChecklistItems';
import { readStore, writeStore } from '../../mock/api/storage';
import { addNotification } from '../../shared/notifications/store';
import { getPerson } from '../../shared/people/directory';
import { isChecklistComplete, type ChecklistSection } from '../../shared/checklist/types';
import { performAction } from '../../shared/workflow/engine';
import type { Role } from '../../types';
import { RPL_EVAL_WORKFLOW, RPL_OUTCOME_WORKFLOW } from './workflow';
import type { NewRplToolkitInput, RplEvaluationReport, RplToolkitApplication } from './types';

const KEY = 'rplToolkit:applications';

function loadAll(): RplToolkitApplication[] {
  return readStore<RplToolkitApplication[]>(KEY, []);
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

export async function createRplToolkitApplication(input: NewRplToolkitInput): Promise<RplToolkitApplication> {
  const app: RplToolkitApplication = {
    id: crypto.randomUUID(),
    ...input,
    evalState: { stageId: 'ad-allocation', submittedBy: input.qpName, submittedById: input.qpId },
    outcomeState: { stageId: 'ceo-signature' },
    allocatedAsdId: null,
    allocatedAsdName: null,
    checklist: buildRplToolkitChecklist(),
    evaluationReport: { findings: '', recommendation: '' },
    createdBy: input.qpName,
    createdAt: new Date().toISOString(),
  };
  saveAll([app, ...loadAll()]);
  return app;
}

export async function saveRplToolkitChecklist(applicationId: string, sections: ChecklistSection[]): Promise<RplToolkitApplication> {
  const all = loadAll();
  const app = getOrThrow(all, applicationId);
  const updated = { ...app, checklist: sections };
  saveAll(replace(all, updated));
  return updated;
}

export async function saveRplEvaluationReport(applicationId: string, report: RplEvaluationReport): Promise<RplToolkitApplication> {
  const all = loadAll();
  const app = getOrThrow(all, applicationId);
  const updated = { ...app, evaluationReport: report };
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
  if (params.actionId === 'rpl-asd-send-to-dd') {
    if (!isChecklistComplete(app.checklist, true)) {
      throw new Error('Every checklist line needs an answer and a comment before sending to the Deputy Director.');
    }
    if (!app.evaluationReport.findings.trim() || !app.evaluationReport.recommendation) {
      throw new Error('Complete the evaluation report (findings and recommendation) before sending to the Deputy Director.');
    }
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
  }
  if (nextState.stageId === 'approved' || nextState.stageId === 'declined') {
    addNotification({
      recipientRole: 'QP',
      title: 'RPL Toolkit decision reached',
      body: `The IAC has reached a decision on "${app.toolkitTitle}". The outcome letter is being prepared.`,
    });
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
