import {
  ESCALATION_NEXT_ROLE,
  ESCALATION_NEXT_ROLE_BY_MODULE,
  ESCALATION_TOP_LEVEL_ROLE,
  ESCALATION_WORKING_DAYS,
} from '../../config/administration';
import { roleDescriptor } from '../../config/roles';
import { readStore, writeStore } from '../../mock/api/storage';
import { listRecords as listConfirmations } from '../../modules/eisa-confirmation/api';
import { CONFIRMATION_WORKFLOW } from '../../modules/eisa-confirmation/workflow';
import { listBatches as listCalendarBatches } from '../../modules/eisa-calendar/api';
import { listChangeRequests, CHANGE_REQUEST_RECORD_TYPE } from '../../modules/eisa-calendar/changeRequests';
import { BATCH_WORKFLOW, changeRequestWorkflow } from '../../modules/eisa-calendar/workflow';
import { listRecords as listRegistrations } from '../../modules/eisa-registration/api';
import { REGISTRATION_WORKFLOW } from '../../modules/eisa-registration/workflow';
import { listBatches as listResultsBatches } from '../../modules/approval-of-results/api';
import { EISA_RESULTS_RECORD_TYPE, FISA_RESULTS_RECORD_TYPE } from '../../modules/approval-of-results/config';
import { listFisaResultsBatches } from '../../modules/approval-of-results/fisaApi';
import { FISA_RESULTS_WORKFLOW, RESULTS_WORKFLOW } from '../../modules/approval-of-results/workflow';
import { listFisaStandards, listFisaValidations, VALIDATION_KEY as FISA_VALIDATION_KEY } from '../../modules/fisa/api';
import { FISA_STANDARD_WORKFLOW, FISA_VALIDATION_WORKFLOW } from '../../modules/fisa/workflow';
import { listRecords as listInstrumentValidations } from '../../modules/instrument-validation/api';
import { SCHEDULING_WORKFLOW, VALIDATION_WORKFLOW } from '../../modules/instrument-validation/workflow';
import { listApplications as listQasa } from '../../modules/qsa-addendum/api';
import { EVAL_WORKFLOW, OUTCOME_WORKFLOW } from '../../modules/qsa-addendum/workflow';
import { KEY as RPL_KEY, listRplToolkitApplications } from '../../modules/rpl-toolkit/api';
import { RPL_EVAL_WORKFLOW, RPL_OUTCOME_WORKFLOW } from '../../modules/rpl-toolkit/workflow';
import { KEY as SITE_VISITS_KEY, listVisits } from '../../modules/site-visits/api';
import { PLANNING_WORKFLOW, REPORT_WORKFLOW } from '../../modules/site-visits/workflow';
import type { Role } from '../../types';
import { appendAuditEntry, getAuditTrail } from '../audit/auditLog';
import { toIsoDate, workingDaysBetween } from '../dates/workingDays';
import { addNotification } from '../notifications/store';
import { getPerson, personsForRole } from '../people/directory';
import type { WorkflowDefinition, WorkflowRecordState } from '../workflow/types';
import { activeActingHolders, actingName } from './acting';
import { roleLabel } from './roleLabels';

// Batch S (29.2): an internal item that has waited at one stage longer than ESCALATION_WORKING_DAYS
// working days (SA public holidays skipped) is "Overdue". The time it entered the stage is read from
// the audit trail — the latest entry whose action leads INTO the current stage — because the
// workflow records themselves hold only the stage, not when it began. Where there is no such entry
// (a record created straight into a stage) the record's own created/submitted date is used.

export type OverdueSourceId =
  | 'qasa'
  | 'qasa-letter'
  | 'iv'
  | 'iv-scheduling'
  | 'cal-batch'
  | 'cal-request'
  | 'registration'
  | 'confirmation'
  | 'results'
  | 'fisa-results'
  | 'fisa-standard'
  | 'fisa-validation'
  | 'rpl'
  | 'rpl-letter'
  | 'visit-planning'
  | 'visit-report';

type ReassignKind = 'fisa-validation' | 'rpl' | 'visit-report';

export interface OverdueItem {
  // `${source}:${itemId}` — what OverdueMark looks up.
  key: string;
  source: OverdueSourceId;
  module: string;
  moduleLabel: string;
  itemId: string;
  itemLabel: string;
  stageId: string;
  stageLabel: string;
  // The internal role holding the item at this stage.
  role: Role;
  enteredAt: string;
  workingDays: number;
  assigneeId: string | null;
  assigneeName: string | null;
  // Set only where the module records a named person for the item.
  reassignKind: ReassignKind | null;
}

interface Candidate {
  source: OverdueSourceId;
  module: string;
  moduleLabel: string;
  itemId: string;
  itemLabel: string;
  definition: WorkflowDefinition;
  state: WorkflowRecordState;
  recordTypes: string[];
  fallbackDate: string;
  // Stages to leave out because the wait is not on the role (e.g. waiting for the visit itself).
  ignoreStages?: string[];
  assigneeId?: string | null;
  assigneeName?: string | null;
  reassignKind?: ReassignKind;
}

function todayIso(): string {
  return toIsoDate(new Date());
}

function enteredStageAt(c: Candidate): string {
  const into = new Set(c.definition.actions.filter((a) => a.toStage === c.state.stageId).map((a) => a.label));
  let latest = '';
  for (const type of c.recordTypes) {
    for (const entry of getAuditTrail(type, c.itemId)) {
      if (into.has(entry.action) && entry.timestamp > latest) latest = entry.timestamp;
    }
  }
  return latest || c.fallbackDate;
}

// Stages where a record rests once a step is finished: nobody is holding it up. (An approved QASA
// lists the DD as the one who may start a review, but it is not waiting for them.)
const RESTING_STAGES = ['approved', 'signed', 'closed', 'declined', 'validated', 'registered', 'accepted', 'published', 'booked', 'agreed', 'planning-rejected', 'rejected'];

function toItem(c: Candidate, today: string): OverdueItem | null {
  const stage = c.definition.stages.find((s) => s.id === c.state.stageId);
  if (!stage || RESTING_STAGES.includes(stage.id) || c.ignoreStages?.includes(stage.id)) return null;
  const role = stage.allowedRoles.find((r) => roleDescriptor(r)?.portal === 'internal');
  if (!role) return null;
  const enteredAt = enteredStageAt(c);
  if (!enteredAt) return null;
  const workingDays = workingDaysBetween(enteredAt.slice(0, 10), today);
  return {
    key: `${c.source}:${c.itemId}`,
    source: c.source,
    module: c.module,
    moduleLabel: c.moduleLabel,
    itemId: c.itemId,
    itemLabel: c.itemLabel,
    stageId: stage.id,
    stageLabel: stage.label,
    role,
    enteredAt,
    workingDays,
    assigneeId: c.assigneeId ?? null,
    assigneeName: c.assigneeName ?? null,
    // Set by the adapter only while the item sits with the role the person assignment belongs to.
    reassignKind: c.reassignKind ?? null,
  };
}

async function loadCandidates(): Promise<Candidate[]> {
  const [qasa, iv, batches, requests, registrations, confirmations, results, fisaResults, standards, fisaValidations, rpl, visits] = await Promise.all([
    listQasa(),
    listInstrumentValidations(),
    listCalendarBatches(),
    listChangeRequests(),
    listRegistrations(),
    listConfirmations(),
    listResultsBatches(),
    listFisaResultsBatches(),
    listFisaStandards(),
    listFisaValidations(),
    listRplToolkitApplications(),
    listVisits(),
  ]);
  const out: Candidate[] = [];

  for (const a of qasa) {
    const base = { module: 'qsa-addendum', moduleLabel: 'QAS Addendum (QASA)', itemId: a.id, itemLabel: `${a.qualificationTitle} (${a.qpName})`, fallbackDate: a.submissionDate };
    out.push({ ...base, source: 'qasa', definition: EVAL_WORKFLOW, state: a.evalState, recordTypes: ['qsa-addendum-evaluation'] });
    out.push({ ...base, source: 'qasa-letter', definition: OUTCOME_WORKFLOW, state: a.outcomeState, recordTypes: ['qsa-addendum-outcome-letter'] });
  }
  for (const r of iv) {
    const base = { module: 'instrument-validation', moduleLabel: 'EISA Instrument Validation', itemId: r.id, itemLabel: `${r.qualificationTitle} (${r.qpName})`, fallbackDate: r.createdAt };
    out.push({ ...base, source: 'iv', definition: VALIDATION_WORKFLOW, state: r.validationWorkflow, recordTypes: ['instrument-validation-validation'] });
    out.push({ ...base, source: 'iv-scheduling', definition: SCHEDULING_WORKFLOW, state: r.scheduling.workflow, recordTypes: ['instrument-validation-scheduling'] });
  }
  for (const b of batches) {
    out.push({
      source: 'cal-batch',
      module: 'eisa-calendar',
      moduleLabel: 'EISA Calendar',
      itemId: b.id,
      itemLabel: `${b.qualificationTitle} ${b.year} dates (${b.qpName})`,
      definition: BATCH_WORKFLOW,
      state: b.state,
      recordTypes: ['eisa-calendar-batch'],
      fallbackDate: b.submittedAt,
    });
  }
  for (const q of requests) {
    out.push({
      source: 'cal-request',
      module: 'eisa-calendar',
      moduleLabel: 'EISA Calendar',
      itemId: q.id,
      itemLabel: `${q.kind === 'postponement' ? 'Postponement' : 'Cancellation'} request — ${q.qualificationTitle} (${q.sittingDate})`,
      definition: changeRequestWorkflow(q.kind),
      state: q.state,
      recordTypes: [CHANGE_REQUEST_RECORD_TYPE],
      fallbackDate: q.raisedAt,
    });
  }
  for (const r of registrations) {
    out.push({
      source: 'registration',
      module: 'eisa-registration',
      moduleLabel: 'Learner EISA Registration',
      itemId: r.id,
      itemLabel: `${r.qualificationTitle} — ${r.sdpName} (${r.sittingDate})`,
      definition: REGISTRATION_WORKFLOW,
      state: r.workflow,
      recordTypes: ['eisa-registration'],
      fallbackDate: r.createdAt,
    });
  }
  for (const c of confirmations) {
    out.push({
      source: 'confirmation',
      module: 'eisa-confirmation',
      moduleLabel: 'EISA Confirmation',
      itemId: c.id,
      itemLabel: `${c.qualificationTitle} (${c.sittingDate}) — ${c.qpName}`,
      definition: CONFIRMATION_WORKFLOW,
      state: c.workflow,
      recordTypes: ['eisa-confirmation'],
      fallbackDate: c.sharedAt,
    });
  }
  for (const b of results) {
    out.push({
      source: 'results',
      module: 'approval-of-results',
      moduleLabel: 'Approval of Results (EISA)',
      itemId: b.id,
      itemLabel: `${b.qualificationTitle} (${b.sittingDate}) — ${b.qpName}`,
      definition: RESULTS_WORKFLOW,
      state: b.workflow,
      recordTypes: [EISA_RESULTS_RECORD_TYPE],
      fallbackDate: b.submittedAt,
    });
  }
  for (const b of fisaResults) {
    out.push({
      source: 'fisa-results',
      module: 'approval-of-results',
      moduleLabel: 'Approval of Results (FISA)',
      itemId: b.id,
      itemLabel: `${b.skillsProgrammeTitle} — ${b.sdpName}`,
      definition: FISA_RESULTS_WORKFLOW,
      state: b.workflow,
      recordTypes: [FISA_RESULTS_RECORD_TYPE],
      fallbackDate: b.submittedAt || b.createdAt,
    });
  }
  for (const s of standards) {
    out.push({
      source: 'fisa-standard',
      module: 'fisa',
      moduleLabel: 'FISA Standards',
      itemId: s.id,
      itemLabel: s.skillsProgrammeTitle,
      definition: FISA_STANDARD_WORKFLOW,
      state: s.workflow,
      recordTypes: ['fisa-standard'],
      fallbackDate: s.createdAt,
    });
  }
  for (const v of fisaValidations) {
    out.push({
      source: 'fisa-validation',
      module: 'fisa',
      moduleLabel: 'FISA Instrument Validation',
      itemId: v.id,
      itemLabel: `${v.skillsProgrammeTitle} — ${v.sdpName}`,
      definition: FISA_VALIDATION_WORKFLOW,
      state: v.workflow,
      recordTypes: ['fisa-instrument-validation'],
      fallbackDate: v.createdAt,
      assigneeId: v.allocatedAsdId,
      assigneeName: v.allocatedAsdName,
      reassignKind: v.workflow.stageId === 'asd-validation' ? 'fisa-validation' : undefined,
    });
  }
  for (const a of rpl) {
    const base = { module: 'rpl-toolkit', moduleLabel: 'RPL Toolkit', itemId: a.id, itemLabel: `${a.toolkitTitle} (${a.qpName})`, fallbackDate: a.submissionDate };
    out.push({
      ...base,
      source: 'rpl',
      definition: RPL_EVAL_WORKFLOW,
      state: a.evalState,
      recordTypes: ['rpl-toolkit-evaluation'],
      assigneeId: a.allocatedAsdId,
      assigneeName: a.allocatedAsdName,
      reassignKind: a.evalState.stageId === 'asd-evaluation' ? 'rpl' : undefined,
    });
    out.push({ ...base, source: 'rpl-letter', definition: RPL_OUTCOME_WORKFLOW, state: a.outcomeState, recordTypes: ['rpl-toolkit-outcome'] });
  }
  for (const v of visits) {
    const base = { module: 'site-visits', moduleLabel: 'Site Visits & Monitoring', itemId: v.id, itemLabel: `${v.qualificationTitle || v.assessmentCentreName || 'Site visit'} (${v.visitDate})`, fallbackDate: v.createdAt };
    out.push({ ...base, source: 'visit-planning', definition: PLANNING_WORKFLOW, state: v.planningWorkflow, recordTypes: ['site-visit-planning'] });
    out.push({
      ...base,
      source: 'visit-report',
      definition: REPORT_WORKFLOW,
      state: v.reportWorkflow,
      recordTypes: ['site-visit-report'],
      // Waiting for the visit to happen is not waiting on a person.
      ignoreStages: ['awaiting-execution'],
      assigneeId: v.reroutedToId,
      assigneeName: v.reroutedToName,
      reassignKind: v.reportWorkflow.stageId === 'dd-report-review' ? 'visit-report' : undefined,
    });
  }
  return out;
}

// Every item waiting at an internal stage, overdue or not (the seed check reads this).
export async function listStageWaits(today: string = todayIso()): Promise<OverdueItem[]> {
  const candidates = await loadCandidates();
  return candidates.flatMap((c) => toItem(c, today) ?? []);
}

export async function listOverdueItems(today: string = todayIso()): Promise<OverdueItem[]> {
  const waits = await listStageWaits(today);
  return waits
    .filter((item) => item.workingDays > ESCALATION_WORKING_DAYS)
    .sort((a, b) => b.workingDays - a.workingDays || a.moduleLabel.localeCompare(b.moduleLabel));
}

export function overdueLabel(item: Pick<OverdueItem, 'workingDays'>): string {
  return `Overdue (${item.workingDays} working days)`;
}

// ---- Escalation: the next level is told once per item and stage visit ----------------------

export const ESCALATIONS_KEY = 'adminEscalationsSent';
export const ESCALATION_RECORD_TYPE = 'administration-escalation';

export function nextLevelRole(item: Pick<OverdueItem, 'module' | 'role'>): Role {
  return ESCALATION_NEXT_ROLE_BY_MODULE[item.module]?.[item.role] ?? ESCALATION_NEXT_ROLE[item.role] ?? ESCALATION_TOP_LEVEL_ROLE;
}

// Called whenever an internal screen opens. Safe to call repeatedly: each (item, stage, time it
// entered the stage) is notified at most once, so a second call sends nothing.
export async function escalateOverdueItems(today: string = todayIso()): Promise<number> {
  const items = await listOverdueItems(today);
  const sent = new Set(readStore<string[]>(ESCALATIONS_KEY, []));
  const fresh = items.filter((item) => !sent.has(`${item.key}|${item.stageId}|${item.enteredAt}`));
  if (fresh.length === 0) return 0;

  // One message per next-level role and module, listing the items, so a first load does not flood
  // the inbox; every item still gets its own audit entry and is recorded as told.
  const groups = new Map<string, OverdueItem[]>();
  for (const item of fresh) {
    const groupKey = `${nextLevelRole(item)}|${item.moduleLabel}`;
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), item]);
  }
  for (const group of groups.values()) {
    const next = nextLevelRole(group[0]);
    const listed = group.slice(0, 3).map((i) => `${i.itemLabel} (${i.workingDays} working days at "${i.stageLabel}")`);
    const more = group.length > 3 ? ` and ${group.length - 3} more` : '';
    addNotification({
      recipientRole: next,
      title: `Overdue in ${group[0].moduleLabel}: ${group.length} item${group.length === 1 ? '' : 's'}`,
      body: `Waiting longer than ${ESCALATION_WORKING_DAYS} working days with the role below you: ${listed.join('; ')}${more}.`,
    });
  }
  for (const item of fresh) {
    const next = nextLevelRole(item);
    appendAuditEntry({
      recordType: ESCALATION_RECORD_TYPE,
      recordId: item.itemId,
      actorRole: item.role,
      actorId: 'system',
      actorName: 'System (escalation)',
      action: `Escalated to ${roleLabel(next)}: overdue at "${item.stageLabel}"`,
      note: `${item.workingDays} working days since ${item.enteredAt.slice(0, 10)}.`,
    });
    sent.add(`${item.key}|${item.stageId}|${item.enteredAt}`);
  }
  writeStore(ESCALATIONS_KEY, [...sent]);
  return fresh.length;
}

// ---- Reassign ------------------------------------------------------------------------------

export interface ReassignCandidate {
  id: string;
  name: string;
  acting: boolean;
}

// People who hold the item's role, plus anyone with an active acting appointment for it.
export function reassignCandidates(item: OverdueItem): ReassignCandidate[] {
  const own = personsForRole(item.role).map((p) => ({ id: p.id, name: p.name, acting: false }));
  const acting = activeActingHolders(item.role)
    .filter((id) => !own.some((p) => p.id === id))
    .flatMap((id) => getPerson(id) ?? [])
    .map((p) => ({ id: p.id, name: p.name, acting: true }));
  return [...own, ...acting].filter((p) => p.id !== item.assigneeId);
}

interface ReassignInput {
  item: OverdueItem;
  toPersonId: string;
  reason: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
}

interface AssignmentRecord {
  id: string;
  [field: string]: unknown;
}

function assignInStore(key: string, id: string, idField: string, nameField: string, personId: string, personName: string): void {
  const all = readStore<AssignmentRecord[]>(key, []);
  writeStore(key, all.map((r) => (r.id === id ? { ...r, [idField]: personId, [nameField]: personName } : r)));
}

export function reassignItem({ item, toPersonId, reason, actorId, actorName, actorRole }: ReassignInput): void {
  if (!item.reassignKind) throw new Error('This module has no person assignment to change.');
  if (!reason.trim()) throw new Error('A reason is required.');
  const person = reassignCandidates(item).find((p) => p.id === toPersonId);
  if (!person) throw new Error('Choose a person who holds this role or an active acting appointment for it.');
  const displayName = person.acting ? actingName(person.name, item.role) : person.name;

  // The module's own stores keep the named person; the workflow stage does not change.
  if (item.reassignKind === 'rpl') assignInStore(RPL_KEY, item.itemId, 'allocatedAsdId', 'allocatedAsdName', person.id, displayName);
  else if (item.reassignKind === 'fisa-validation') {
    assignInStore(FISA_VALIDATION_KEY, item.itemId, 'allocatedAsdId', 'allocatedAsdName', person.id, displayName);
  } else assignInStore(SITE_VISITS_KEY, item.itemId, 'reroutedToId', 'reroutedToName', person.id, displayName);

  const previous = item.assigneeName ? ` from ${item.assigneeName}` : '';
  appendAuditEntry({
    recordType: ESCALATION_RECORD_TYPE,
    recordId: item.itemId,
    actorRole,
    actorId,
    actorName,
    action: `Reassigned${previous} to ${displayName} (overdue at "${item.stageLabel}")`,
    note: reason.trim(),
  });
  const body = `${item.itemLabel} (${item.moduleLabel}) was reassigned${previous} to ${displayName} by the super admin. Reason: ${reason.trim()}`;
  const toNotify = [person.id, item.assigneeId].filter((id): id is string => !!id);
  for (const personId of new Set(toNotify)) {
    const target = getPerson(personId);
    if (target) addNotification({ recipientRole: target.role, recipientPersonId: target.id, title: 'Item reassigned', body });
  }
}
