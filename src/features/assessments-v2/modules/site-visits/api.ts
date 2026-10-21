import { appendAuditEntry } from '../../shared/audit/auditLog';
import { isChecklistComplete, type ChecklistSection } from '../../shared/checklist/types';
import { addNotification } from '../../shared/notifications/store';
import { canActInStage, performAction, WorkflowError } from '../../shared/workflow/engine';
import { listMonitoringItems, type RplArplMonitoringItem } from '../../mock/api/siteVisitsStore';
import { readStore, writeStore } from '../../mock/api/storage';
import { buildEisaReadinessVisitSections } from '../../mock/data/eisaReadinessVisitSections';
import { buildPostEisaMonitoringVisitSections } from '../../mock/data/postEisaMonitoringSections';
import { buildMarkingModerationVisitSections } from '../../mock/data/siteVisitFormSections';
import { buildRplArplMonitoringVisitSections } from '../../mock/data/rplArplVisitSections';
import type { Role } from '../../types';
import { listPublishedSittings } from '../eisa-calendar/api';
import type { EisaSitting } from '../eisa-calendar/types';
import {
  DEFAULT_NOTICE_LEAD_TIME_DAYS,
  PLAN_APPROVER_ROLE,
  REPORT_APPROVER_ROLE,
  REPORT_SUBMITTER_ROLE,
} from './config';
import { PLANNING_WORKFLOW, REPORT_WORKFLOW } from './workflow';
import type { NewVisitInput, SiteVisit, VisitType } from './types';

const KEY = 'siteVisits:visits';

function loadAll(): SiteVisit[] {
  return readStore<SiteVisit[]>(KEY, []);
}

function saveAll(visits: SiteVisit[]): void {
  writeStore(KEY, visits);
}

function getOrThrow(visits: SiteVisit[], id: string): SiteVisit {
  const visit = visits.find((v) => v.id === id);
  if (!visit) throw new Error(`Site visit "${id}" not found.`);
  return visit;
}

function replace(visits: SiteVisit[], updated: SiteVisit): SiteVisit[] {
  return visits.map((v) => (v.id === updated.id ? updated : v));
}

// CR-048: the checklist shape changes per visit type.
function buildChecklistForType(visitType: VisitType): ChecklistSection[] {
  switch (visitType) {
    case 'eisa-readiness':
      return buildEisaReadinessVisitSections();
    case 'marking-moderation':
      return buildMarkingModerationVisitSections();
    case 'rpl-arpl-monitoring':
      return buildRplArplMonitoringVisitSections();
    case 'post-eisa-monitoring':
      return buildPostEisaMonitoringVisitSections();
  }
}

function buildAutoCreatedVisit(item: RplArplMonitoringItem): SiteVisit {
  return {
    id: crypto.randomUUID(),
    visitType: 'rpl-arpl-monitoring',
    // Phase 6 fix: carried over from the registration's EISA sitting instead of a placeholder.
    qpName: item.qpName,
    qualificationTitle: item.qualificationTitle,
    sdpName: item.sdpName,
    sittingId: null,
    visitDate: item.sittingDate,
    venue: '',
    notificationFlag: 'notified',
    noticeLeadTimeDays: DEFAULT_NOTICE_LEAD_TIME_DAYS,
    planNote: 'Automatically created from an RPL/ARPL-flagged EISA Registration (CR-042/CR-044) — the only automatic trigger into this hub.',
    // CR-044: the one automatic trigger skips the planning chain — it is already a known,
    // real requirement, not a plan someone still needs to propose and get approved.
    planningWorkflow: { stageId: 'booked' },
    reportWorkflow: { stageId: 'awaiting-execution' },
    checklist: buildRplArplMonitoringVisitSections(),
    freeTextNotes: {},
    facilitatorAnswers: {},
    learnerAnswers: {},
    resultsApprovedForSitting: false,
    completedBy: '',
    completedDate: '',
    sourceRegistrationId: item.sourceRegistrationId,
    sourceMonitoringItemId: item.id,
    learnerNames: item.learnerNames,
    createdBy: `${item.createdBy} (via RPL/ARPL registration)`,
    createdAt: item.createdAt,
  };
}

// CR-042/CR-044: pulls in any new RPL/ARPL monitoring items from the Phase 4 store that don't
// have a visit yet. This is the ONLY automatic trigger into the hub — every other visit type
// is created explicitly by an official via createVisit() below.
async function syncAutoCreatedVisits(): Promise<void> {
  const items = await listMonitoringItems();
  if (items.length === 0) return;
  const all = loadAll();
  const existingSourceIds = new Set(all.map((v) => v.sourceMonitoringItemId).filter((id): id is string => !!id));
  const newItems = items.filter((i) => !existingSourceIds.has(i.id));
  if (newItems.length === 0) return;
  saveAll([...newItems.map(buildAutoCreatedVisit), ...all]);
}

export async function listVisits(): Promise<SiteVisit[]> {
  await syncAutoCreatedVisits();
  return loadAll();
}

export async function getVisit(id: string): Promise<SiteVisit | undefined> {
  await syncAutoCreatedVisits();
  return loadAll().find((v) => v.id === id);
}

// CR-050: the visit can optionally be linked to a published EISA Calendar sitting.
export async function listSchedulableSittings(): Promise<EisaSitting[]> {
  return listPublishedSittings();
}

export async function createVisit(input: NewVisitInput): Promise<SiteVisit> {
  const visit: SiteVisit = {
    id: crypto.randomUUID(),
    visitType: input.visitType,
    qpName: input.qpName,
    qualificationTitle: input.qualificationTitle,
    sdpName: input.sdpName,
    sittingId: input.sittingId,
    visitDate: input.visitDate,
    venue: input.venue,
    notificationFlag: input.notificationFlag,
    noticeLeadTimeDays: input.notificationFlag === 'notified' ? input.noticeLeadTimeDays ?? DEFAULT_NOTICE_LEAD_TIME_DAYS : null,
    planNote: '',
    planningWorkflow: { stageId: 'ad-planning' },
    reportWorkflow: { stageId: 'awaiting-execution' },
    checklist: buildChecklistForType(input.visitType),
    freeTextNotes: {},
    facilitatorAnswers: {},
    learnerAnswers: {},
    resultsApprovedForSitting: false,
    completedBy: '',
    completedDate: '',
    sourceRegistrationId: null,
    sourceMonitoringItemId: null,
    learnerNames: [],
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
  };
  saveAll([visit, ...loadAll()]);
  return visit;
}

export async function updateVisitDetails(
  id: string,
  patch: Partial<Pick<SiteVisit, 'qpName' | 'qualificationTitle' | 'sdpName' | 'venue' | 'visitDate'>>,
): Promise<SiteVisit> {
  const all = loadAll();
  const updated = { ...getOrThrow(all, id), ...patch };
  saveAll(replace(all, updated));
  return updated;
}

interface PlanningActionParams {
  visitId: string;
  actionId: 'plan-submit' | 'plan-recommend' | 'plan-approve' | 'plan-book';
  actorRole: Role;
  actorName: string;
  planNote?: string;
}

export async function performPlanningAction(params: PlanningActionParams): Promise<SiteVisit> {
  const all = loadAll();
  const visit = getOrThrow(all, params.visitId);

  const nextWorkflow = performAction({
    definition: PLANNING_WORKFLOW,
    record: visit.planningWorkflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorName: params.actorName,
    recordType: 'site-visit-planning',
    recordId: visit.id,
  });

  let updated: SiteVisit = { ...visit, planningWorkflow: nextWorkflow };
  if (params.actionId === 'plan-submit' && params.planNote !== undefined) {
    updated = { ...updated, planNote: params.planNote };
  }
  saveAll(replace(all, updated));

  if (params.actionId === 'plan-recommend') {
    addNotification({ recipientRole: PLAN_APPROVER_ROLE, title: 'Visit plan awaiting approval', body: `"${visit.qualificationTitle}" (${visit.visitType}) needs Domain Director approval.` });
  }
  if (nextWorkflow.stageId === 'booked') {
    addNotification({
      recipientRole: REPORT_SUBMITTER_ROLE,
      title: 'Visit booked — ready to conduct',
      body: `"${visit.qualificationTitle}" is booked for ${visit.visitDate}. The execution form is ready.`,
    });
  }

  return updated;
}

interface ReportActionParams {
  visitId: string;
  actionId: 'report-submit' | 'report-approve' | 'report-send-back' | 'report-reject' | 'report-reroute' | 'share-visit-outcome' | 'qp-acknowledge-outcome';
  actorRole: Role;
  actorName: string;
  note?: string;
}

export async function performReportAction(params: ReportActionParams): Promise<SiteVisit> {
  const all = loadAll();
  const visit = getOrThrow(all, params.visitId);

  if (params.actionId === 'report-submit') {
    if (!isChecklistComplete(visit.checklist, true)) {
      throw new Error('Every checklist line needs an answer and a comment before submitting the report.');
    }
    if (!visit.completedBy.trim() || !visit.completedDate) {
      throw new Error('Complete "Completed By" and "Completion Date" before submitting.');
    }
  }
  // CR-058: the outcome-sharing step is specific to Post-EISA Monitoring — every other visit
  // type's workflow ends at "Approved".
  if (params.actionId === 'share-visit-outcome' && visit.visitType !== 'post-eisa-monitoring') {
    throw new Error('Only a Post-EISA Monitoring visit has a "Share Visit Outcome" step.');
  }

  // CR-055: re-routing is logged as an audit note only — it deliberately does NOT go through
  // the generic workflow engine. That engine always stamps the acting role's name onto
  // `submittedBy` on every transition; since every Deputy Director shares the same role label
  // in this no-individual-login build, running a same-stage reroute through it would
  // overwrite the original ASD's submittedBy with "Deputy Director" and then immediately trip
  // CR-053's different-actor check on the next approve. The workflow stage itself never
  // changes, so there is nothing for the engine to legitimately transition anyway.
  if (params.actionId === 'report-reroute') {
    if (!canActInStage(REPORT_WORKFLOW, visit.reportWorkflow.stageId, params.actorRole)) {
      throw new WorkflowError(`Role "${params.actorRole}" may not act in stage "${visit.reportWorkflow.stageId}".`);
    }
    if (!params.note?.trim()) {
      throw new Error('Re-routing requires a note explaining why.');
    }
    appendAuditEntry({
      recordType: 'site-visit-report',
      recordId: visit.id,
      actorRole: params.actorRole,
      actorName: params.actorName,
      action: 'Re-routed to another Deputy Director',
      note: params.note,
    });
    return visit;
  }

  const nextWorkflow = performAction({
    definition: REPORT_WORKFLOW,
    record: visit.reportWorkflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorName: params.actorName,
    note: params.note,
    recordType: 'site-visit-report',
    recordId: visit.id,
  });

  const updated: SiteVisit = { ...visit, reportWorkflow: nextWorkflow };
  saveAll(replace(all, updated));

  if (params.actionId === 'report-submit') {
    addNotification({ recipientRole: REPORT_APPROVER_ROLE, title: 'Site visit report submitted', body: `"${visit.qualificationTitle}" (${visit.visitType}) is awaiting your review.` });
  }
  if (params.actionId === 'report-approve') {
    addNotification({ recipientRole: REPORT_SUBMITTER_ROLE, title: 'Report approved', body: `Your report for "${visit.qualificationTitle}" was approved.` });
  }
  if (params.actionId === 'report-send-back') {
    addNotification({ recipientRole: REPORT_SUBMITTER_ROLE, title: 'Report sent back for clarification', body: params.note ?? '' });
  }
  if (params.actionId === 'report-reject') {
    addNotification({ recipientRole: REPORT_SUBMITTER_ROLE, title: 'Report rejected', body: params.note ?? '' });
  }
  if (params.actionId === 'share-visit-outcome') {
    // PM-07: QA and Accreditation have no role in this build's Role union to notify directly —
    // simulated as an audit entry alongside the real in-app notifications to QP and SDP.
    addNotification({ recipientRole: 'QP', title: 'Post-EISA Monitoring outcome shared', body: `The visit outcome for "${visit.qualificationTitle}" is ready to review.` });
    if (visit.sdpName) {
      addNotification({ recipientRole: 'SDP', title: 'Post-EISA Monitoring outcome shared', body: `The visit outcome for "${visit.qualificationTitle}" (${visit.sdpName}) has been shared.` });
    }
    appendAuditEntry({
      recordType: 'site-visit-report',
      recordId: visit.id,
      actorRole: params.actorRole,
      actorName: params.actorName,
      action: 'Shared the PEM report with Quality Assurance and Accreditation (simulated — no screen in either domain yet)',
    });
  }
  if (params.actionId === 'qp-acknowledge-outcome') {
    addNotification({ recipientRole: REPORT_APPROVER_ROLE, title: 'QP acknowledged the visit outcome', body: `"${visit.qualificationTitle}" — the QP has acknowledged the shared outcome.` });
  }

  return updated;
}

export async function saveChecklist(id: string, sections: ChecklistSection[]): Promise<SiteVisit> {
  const all = loadAll();
  const updated = { ...getOrThrow(all, id), checklist: sections };
  saveAll(replace(all, updated));
  return updated;
}

export async function saveFreeTextNotes(id: string, freeTextNotes: Record<string, string>): Promise<SiteVisit> {
  const all = loadAll();
  const updated = { ...getOrThrow(all, id), freeTextNotes };
  saveAll(replace(all, updated));
  return updated;
}

export async function saveCompletionDetails(id: string, completedBy: string, completedDate: string): Promise<SiteVisit> {
  const all = loadAll();
  const updated = { ...getOrThrow(all, id), completedBy, completedDate };
  saveAll(replace(all, updated));
  return updated;
}

// CR-057: only ever relevant for 'post-eisa-monitoring'.
export async function saveFacilitatorAnswers(id: string, facilitatorAnswers: Record<string, string>): Promise<SiteVisit> {
  const all = loadAll();
  const updated = { ...getOrThrow(all, id), facilitatorAnswers };
  saveAll(replace(all, updated));
  return updated;
}

export async function saveLearnerAnswers(id: string, learnerAnswers: Record<string, string>): Promise<SiteVisit> {
  const all = loadAll();
  const updated = { ...getOrThrow(all, id), learnerAnswers };
  saveAll(replace(all, updated));
  return updated;
}

// CR-057 placeholder: toggles the simulated "results approved" flag until Phase 6 exists —
// see config.ts RESULTS_APPROVAL_IS_SIMULATED.
export async function setResultsApprovedForSitting(id: string, approved: boolean): Promise<SiteVisit> {
  const all = loadAll();
  const updated = { ...getOrThrow(all, id), resultsApprovedForSitting: approved };
  saveAll(replace(all, updated));
  return updated;
}
