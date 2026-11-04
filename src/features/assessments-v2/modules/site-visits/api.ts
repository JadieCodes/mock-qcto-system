import { LABELS } from '../../config/labels';
import { appendAuditEntry } from '../../shared/audit/auditLog';
import { isChecklistComplete, type ChecklistSection } from '../../shared/checklist/types';
import { addNotification } from '../../shared/notifications/store';
import { getPerson } from '../../shared/people/directory';
import { canActInStage, performAction, WorkflowError } from '../../shared/workflow/engine';
import { listMonitoringItems, type RplArplMonitoringItem } from '../../mock/api/siteVisitsStore';
import { readStore, writeStore } from '../../mock/api/storage';
import { buildEisaReadinessVisitSections } from '../../mock/data/eisaReadinessVisitSections';
import { buildPostEisaMonitoringVisitSections } from '../../mock/data/postEisaMonitoringSections';
import { buildMarkingGuidelineDiscussionSections, buildMarkingModerationVisitSections } from '../../mock/data/siteVisitFormSections';
import { buildRplArplMonitoringVisitSections } from '../../mock/data/rplArplVisitSections';
import type { Role } from '../../types';
import { listPublishedSittings } from '../eisa-calendar/api';
import type { EisaSitting } from '../eisa-calendar/types';
import { listRegisteredRegistrationsForSitting } from '../eisa-registration/api';
import {
  BOOKING_ROLE,
  DEFAULT_NOTICE_LEAD_TIME_DAYS,
  MISSING_VISIT_DATE_MESSAGE,
  PLAN_APPROVER_ROLE,
  PLAN_RECOMMENDER_ROLE,
  PLANNER_ROLE,
  REPORT_APPROVER_ROLE,
  REPORT_SUBMITTER_ROLE,
  STAKEHOLDER_SHARE_ROLE,
} from './config';
import { evidenceOf, hasVisitReportFile, MISSING_VISIT_REPORT_MESSAGE, type VisitEvidenceCategory, type VisitEvidenceFile } from './evidence';
import { getScriptVerificationIssues } from './scriptVerification';
import { isSharedWithStakeholder, visitCanBeShared } from './stakeholderShare';
import { PLANNING_WORKFLOW, REPORT_WORKFLOW } from './workflow';
import type { NewVisitInput, ScriptVerification, SiteVisit, VisitType } from './types';
import { DEFAULT_VISIT_DOMAIN } from './visitDomains';
import { visitHasPurpose, visitHasQp, visitHasSdp, visitHasSiteSelection, visitHasSittingLink, visitIsMeeting, visitSubject } from './visitTypeLabels';

export const KEY = 'siteVisits:visits';

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

// Row 39 (PM-04, G-25): the official names for the readiness notice and the marking/moderation
// visit request are still placeholders pending QCTO — kept in config/labels.ts so the real
// names, once confirmed, are a one-line change here and everywhere else that reads them. Other
// visit types have no distinct trigger name in the register, so they keep the generic wording.
function bookedVisitNotificationTitle(visitType: VisitType): string {
  switch (visitType) {
    case 'eisa-readiness':
      return LABELS.eisaReadinessNoticePlaceholder;
    case 'marking-moderation':
      return LABELS.markingModerationVisitRequestPlaceholder;
    default:
      return 'Visit booked — ready to conduct';
  }
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
    // QCTO feedback 2.5: the new types reuse existing sections where one fits; the others are
    // recorded through the notes and the uploaded report only.
    case 'marking-guideline-discussion':
      return buildMarkingGuidelineDiscussionSections();
    case 'instrument-validation-visit':
    case 'qasa-development-visit':
    case 'other-meeting':
      return [];
  }
}

function buildAutoCreatedVisit(item: RplArplMonitoringItem): SiteVisit {
  return {
    id: crypto.randomUUID(),
    visitType: 'rpl-arpl-monitoring',
    // QCTO feedback 2.7: held at the registering SDP, with no QP and no link to the EISA sitting
    // or its date — the officials set the visit date and venue on the Details tab.
    qpId: '',
    qpName: '',
    qualificationTitle: item.qualificationTitle,
    sdpId: item.sdpId,
    sdpName: item.sdpName,
    assessmentCentreName: null,
    sittingId: null,
    visitDate: '',
    venue: '',
    notificationFlag: 'notified',
    noticeLeadTimeDays: DEFAULT_NOTICE_LEAD_TIME_DAYS,
    planNote: 'Automatically created from an RPL/ARPL-flagged Learner EISA Registration.',
    // CR-044: the one automatic trigger skips the planning chain — it is already a known,
    // real requirement, not a plan someone still needs to propose and get approved.
    planningWorkflow: { stageId: 'booked' },
    reportWorkflow: { stageId: 'awaiting-execution' },
    reroutedToId: null,
    reroutedToName: null,
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

// G-06: there is no SDP picker on the planning form any more — an SDP has no access to Site
// Visits at all (09-visibility-matrix.md), so a planner should never be choosing one by hand.
// When a visit is linked to a sitting, this reads the real SDP(s) already registered against
// it (read-only information, not a selectable field).
export async function listSdpsForSitting(sittingId: string): Promise<{ sdpId: string; sdpName: string }[]> {
  const registrations = await listRegisteredRegistrationsForSitting(sittingId);
  const seen = new Map<string, string>();
  for (const r of registrations) seen.set(r.sdpId, r.sdpName);
  return [...seen.entries()].map(([sdpId, sdpName]) => ({ sdpId, sdpName }));
}

export async function createVisit(input: NewVisitInput & Pick<SiteVisit, 'assessmentCentreName'>): Promise<SiteVisit> {
  // QCTO feedback 2.7: an RPL/ARPL visit needs its SDP or assessment centre, and never has a
  // QP or a sitting link.
  const hasQp = visitHasQp(input.visitType);
  if (visitHasSiteSelection(input.visitType) && !input.sdpName?.trim() && !input.assessmentCentreName?.trim()) {
    throw new Error('Choose the SDP or enter the assessment centre where the RPL/ARPL visit takes place.');
  }
  // QCTO feedback 2.5: a special meeting needs a title; every new type needs its purpose.
  const isMeeting = visitIsMeeting(input.visitType);
  if (isMeeting && !input.meetingTitle?.trim()) throw new Error('Enter the title of the meeting.');
  if (visitHasPurpose(input.visitType) && !input.purpose?.trim()) throw new Error('Enter the purpose of the visit.');
  const visit: SiteVisit = {
    id: crypto.randomUUID(),
    visitType: input.visitType,
    domain: input.domain ?? DEFAULT_VISIT_DOMAIN,
    meetingTitle: isMeeting ? input.meetingTitle?.trim() : undefined,
    purpose: visitHasPurpose(input.visitType) ? input.purpose?.trim() : undefined,
    qpId: hasQp ? input.qpId : '',
    qpName: hasQp ? input.qpName : '',
    qualificationTitle: input.qualificationTitle,
    sdpId: visitHasSdp(input.visitType) ? input.sdpId : null,
    sdpName: visitHasSdp(input.visitType) ? input.sdpName : null,
    assessmentCentreName: input.assessmentCentreName?.trim() || null,
    sittingId: visitHasSittingLink(input.visitType) ? input.sittingId : null,
    visitDate: input.visitDate,
    venue: input.venue,
    notificationFlag: input.notificationFlag,
    noticeLeadTimeDays: input.notificationFlag === 'notified' ? input.noticeLeadTimeDays ?? DEFAULT_NOTICE_LEAD_TIME_DAYS : null,
    planNote: '',
    planningWorkflow: { stageId: 'ad-planning' },
    reportWorkflow: { stageId: 'awaiting-execution' },
    reroutedToId: null,
    reroutedToName: null,
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
  patch: Partial<Pick<SiteVisit, 'qpId' | 'qpName' | 'qualificationTitle' | 'sdpName' | 'venue' | 'visitDate' | 'domain' | 'meetingTitle' | 'purpose'>>,
): Promise<SiteVisit> {
  const all = loadAll();
  const updated = { ...getOrThrow(all, id), ...patch };
  saveAll(replace(all, updated));
  return updated;
}

type PlanningActionId =
  | 'plan-submit'
  | 'plan-recommend'
  | 'plan-approve'
  | 'plan-book'
  | 'plan-dd-send-back'
  | 'plan-dd-reject'
  | 'plan-domain-director-send-back'
  | 'plan-domain-director-reject'
  | 'plan-sda-send-back'
  | 'plan-sda-reject';

interface PlanningActionParams {
  visitId: string;
  actionId: PlanningActionId;
  actorRole: Role;
  actorId: string;
  actorName: string;
  planNote?: string;
  // Row 33: mandatory on every send-back/reject action.
  note?: string;
}

// Row 33: notify the role that will need to act next. Send-back goes to whichever role owns
// the stage the record is returning to; reject is terminal, so the planner (the one who would
// need to raise a fresh plan) is notified instead — there is no "next stage" to notify.
const PLANNING_NEXT_OWNER: Partial<Record<PlanningActionId, Role>> = {
  'plan-dd-send-back': PLANNER_ROLE,
  'plan-dd-reject': PLANNER_ROLE,
  'plan-domain-director-send-back': PLAN_RECOMMENDER_ROLE,
  'plan-domain-director-reject': PLANNER_ROLE,
  'plan-sda-send-back': PLAN_APPROVER_ROLE,
  'plan-sda-reject': PLANNER_ROLE,
};

export async function performPlanningAction(params: PlanningActionParams): Promise<SiteVisit> {
  const all = loadAll();
  const visit = getOrThrow(all, params.visitId);
  // QCTO feedback 2.8: an auto-created Post-EISA Monitoring visit has no date until the planner picks one.
  if (params.actionId === 'plan-submit' && !visit.visitDate) throw new Error(MISSING_VISIT_DATE_MESSAGE);

  const nextWorkflow = performAction({
    definition: PLANNING_WORKFLOW,
    record: visit.planningWorkflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: params.note,
    recordType: 'site-visit-planning',
    recordId: visit.id,
  });

  let updated: SiteVisit = { ...visit, planningWorkflow: nextWorkflow };
  if (params.actionId === 'plan-submit' && params.planNote !== undefined) {
    updated = { ...updated, planNote: params.planNote };
  }
  saveAll(replace(all, updated));

  // Every forward step notifies whoever owns the stage it just moved into — plan-recommend and
  // plan-approve were already two of these; plan-submit was the missing one, so the Deputy
  // Director only ever found out a plan was waiting by opening the dashboard themselves.
  if (params.actionId === 'plan-submit') {
    addNotification({ recipientRole: PLAN_RECOMMENDER_ROLE, title: 'Visit plan awaiting recommendation', body: `"${visitSubject(visit)}" (${visit.visitType}) needs Deputy Director recommendation.` });
  }
  if (params.actionId === 'plan-recommend') {
    addNotification({ recipientRole: PLAN_APPROVER_ROLE, title: 'Visit plan awaiting approval', body: `"${visitSubject(visit)}" (${visit.visitType}) needs Domain Director approval.` });
  }
  if (params.actionId === 'plan-approve') {
    addNotification({ recipientRole: BOOKING_ROLE, title: 'Visit plan awaiting booking', body: `"${visitSubject(visit)}" (${visit.visitType}) needs Sub Domain Admin booking.` });
  }
  if (nextWorkflow.stageId === 'booked') {
    addNotification({
      recipientRole: REPORT_SUBMITTER_ROLE,
      title: bookedVisitNotificationTitle(visit.visitType),
      body: `"${visitSubject(visit)}" is booked for ${visit.visitDate}. The execution form is ready.`,
    });
  }

  const nextOwner = PLANNING_NEXT_OWNER[params.actionId];
  if (nextOwner) {
    const isReject = params.actionId.endsWith('reject');
    addNotification({
      recipientRole: nextOwner,
      title: isReject ? 'Visit plan rejected' : 'Visit plan sent back for clarification',
      body: `"${visitSubject(visit)}" (${visit.visitType}): ${params.note ?? ''}`,
    });
  }

  return updated;
}

interface ReportActionParams {
  visitId: string;
  actionId: 'report-submit' | 'report-approve' | 'report-send-back' | 'report-reject' | 'report-reroute' | 'share-visit-outcome' | 'qp-acknowledge-outcome';
  actorRole: Role;
  actorId: string;
  actorName: string;
  note?: string;
  // CR-055: the named colleague (same role) a report is being re-routed to.
  targetPersonId?: string;
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
    if (!hasVisitReportFile(visit)) {
      throw new Error(MISSING_VISIT_REPORT_MESSAGE);
    }
    const scriptIssue = getScriptVerificationIssues(visit)[0];
    if (scriptIssue) throw new Error(scriptIssue.message);
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
    if (!params.targetPersonId) {
      throw new Error('Pick a named colleague to re-route this report to.');
    }
    const target = getPerson(params.targetPersonId);
    if (!target || target.role !== params.actorRole) {
      throw new Error('The re-route target must hold the same role.');
    }
    const updated: SiteVisit = { ...visit, reroutedToId: target.id, reroutedToName: target.name };
    saveAll(replace(all, updated));
    appendAuditEntry({
      recordType: 'site-visit-report',
      recordId: visit.id,
      actorRole: params.actorRole,
      actorId: params.actorId,
      actorName: params.actorName,
      action: `Re-routed to ${target.name} (${target.role})`,
      note: params.note,
    });
    // Row 35: notify the new owner. Notifications in this build are role-level, not
    // per-person (shared/notifications/store.ts), so every holder of the target's role sees
    // this — the same limitation every other notification in this domain already has; the
    // body names the specific colleague so it still reads correctly for them.
    addNotification({
      recipientRole: target.role,
      title: 'A visit report was re-routed to you',
      body: `"${visitSubject(visit)}" (${visit.visitType}) was re-routed to ${target.name} by ${params.actorName}: ${params.note}`,
    });
    return updated;
  }

  const nextWorkflow = performAction({
    definition: REPORT_WORKFLOW,
    record: visit.reportWorkflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: params.note,
    recordType: 'site-visit-report',
    recordId: visit.id,
  });

  // QCTO feedback 2.12: there is no QP acknowledgement step any more, so completing the visit
  // moves it straight on to 'closed', with its own audit entry. Whether the QP sees the report is
  // the separate per-visit choice in setStakeholderShare() below.
  const completed = params.actionId === 'share-visit-outcome';
  const updated: SiteVisit = { ...visit, reportWorkflow: completed ? { ...nextWorkflow, stageId: 'closed' } : nextWorkflow };
  saveAll(replace(all, updated));

  if (completed) {
    appendAuditEntry({
      recordType: 'site-visit-report',
      recordId: visit.id,
      actorRole: params.actorRole,
      actorId: params.actorId,
      actorName: params.actorName,
      action: 'Visit completed',
    });
  }

  if (params.actionId === 'report-submit') {
    addNotification({ recipientRole: REPORT_APPROVER_ROLE, title: 'Site visit report submitted', body: `"${visitSubject(visit)}" (${visit.visitType}) is awaiting your review.` });
  }
  if (params.actionId === 'report-approve') {
    addNotification({ recipientRole: REPORT_SUBMITTER_ROLE, title: 'Report approved', body: `Your report for "${visitSubject(visit)}" was approved.` });
  }
  if (params.actionId === 'report-send-back') {
    addNotification({ recipientRole: REPORT_SUBMITTER_ROLE, title: 'Report sent back for clarification', body: params.note ?? '' });
  }
  if (params.actionId === 'report-reject') {
    addNotification({ recipientRole: REPORT_SUBMITTER_ROLE, title: 'Report rejected', body: params.note ?? '' });
  }
  if (params.actionId === 'share-visit-outcome') {
    // PM-07's extra QA/Accreditation/SDP hand-off stays specific to Post-EISA Monitoring — the
    // register only names those extra recipients for that visit type. The QP is no longer
    // notified here: that only happens when the report is shared with them (setStakeholderShare).
    if (visit.visitType === 'post-eisa-monitoring') {
      // PM-07: QA and Accreditation have no role in this build's Role union to notify directly —
      // simulated as an audit entry alongside the real in-app notifications to QP and SDP.
      if (visit.sdpName) {
        addNotification({ recipientRole: 'SDP', title: 'Post-EISA Monitoring outcome shared', body: `The visit outcome for "${visitSubject(visit)}" (${visit.sdpName}) has been shared.` });
      }
      appendAuditEntry({
        recordType: 'site-visit-report',
        recordId: visit.id,
        actorRole: params.actorRole,
        actorId: params.actorId,
        actorName: params.actorName,
        action: 'Shared the Post-EISA Monitoring report with Quality Assurance and Accreditation',
      });
    }
  }
  if (params.actionId === 'qp-acknowledge-outcome') {
    addNotification({ recipientRole: REPORT_APPROVER_ROLE, title: 'QP acknowledged the visit outcome', body: `"${visitSubject(visit)}" — the QP has acknowledged the shared outcome.` });
  }

  return updated;
}

// Shared visit outcomes: QCTO chooses per visit whether the submitted or approved report is
// shared with the QP named on it. Default is not shared (some visits are internal meetings).
export async function setStakeholderShare(params: {
  visitId: string;
  shared: boolean;
  outcomeSummary?: string;
  actorRole: Role;
  actorId: string;
  actorName: string;
}): Promise<SiteVisit> {
  const all = loadAll();
  const visit = getOrThrow(all, params.visitId);
  if (params.actorRole !== STAKEHOLDER_SHARE_ROLE) throw new Error(`Only the ${STAKEHOLDER_SHARE_ROLE} can choose whether a report is shared.`);
  if (!visitCanBeShared(visit)) throw new Error('This report cannot be shared yet.');
  if (params.shared === isSharedWithStakeholder(visit)) return visit;
  const outcomeSummary = params.outcomeSummary?.trim() ?? visit.stakeholderShare?.outcomeSummary ?? '';
  if (params.shared && !outcomeSummary) throw new Error('Enter the outcome summary the QP will see.');

  const updated: SiteVisit = {
    ...visit,
    stakeholderShare: { shared: params.shared, outcomeSummary, changedAt: new Date().toISOString(), changedBy: params.actorName, changedById: params.actorId },
  };
  saveAll(replace(all, updated));
  appendAuditEntry({
    recordType: 'site-visit-report',
    recordId: visit.id,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    action: params.shared ? `Report shared with the QP (${visit.qpName})` : `Report no longer shared with the QP (${visit.qpName})`,
    note: params.shared ? outcomeSummary : undefined,
  });
  if (params.shared) {
    addNotification({ recipientRole: 'QP', title: 'Visit outcome shared', body: `QCTO has shared the outcome of the visit for "${visitSubject(visit)}" (${visit.qpName}). See Visit Outcomes.` });
  }
  return updated;
}

export interface SharedVisitOutcome {
  id: string;
  visitType: VisitType;
  visitDate: string;
  outcomeSummary: string;
  reportFileNames: string[];
}

// The QP's read-only Visit Outcomes page: only visits shared with this QP, and only these
// columns — no checklist, notes, audit trail or workflow state.
export async function listSharedVisitOutcomesForQp(qpId: string): Promise<SharedVisitOutcome[]> {
  if (!qpId) return [];
  return loadAll()
    .filter((v) => v.qpId === qpId && isSharedWithStakeholder(v))
    .map((v) => ({
      id: v.id,
      visitType: v.visitType,
      visitDate: v.visitDate,
      outcomeSummary: v.stakeholderShare?.outcomeSummary ?? '',
      reportFileNames: evidenceOf(v)
        .filter((f) => f.category === 'report')
        .map((f) => f.fileName),
    }))
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
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

// QCTO feedback 1.12: evidence can only be added while the report is editable — the same
// stage in which the Execution & Report form is open to the ASD.
export async function uploadEvidence(
  id: string,
  file: { fileName: string; fileSize: number; category: VisitEvidenceCategory },
  uploadedBy: string,
): Promise<SiteVisit> {
  const all = loadAll();
  const visit = getOrThrow(all, id);
  if (visit.planningWorkflow.stageId !== 'booked' || visit.reportWorkflow.stageId !== 'awaiting-execution') {
    throw new Error('Evidence can only be uploaded while the report is being completed.');
  }
  const uploaded: VisitEvidenceFile = { ...file, uploadedAt: new Date().toISOString(), uploadedBy };
  const updated: SiteVisit = { ...visit, evidence: [...evidenceOf(visit), uploaded] };
  saveAll(replace(all, updated));
  return updated;
}

// QCTO feedback 3.7: Marking & Moderation only, editable while the report is being completed.
export async function saveScriptVerification(id: string, scriptVerification: ScriptVerification): Promise<SiteVisit> {
  const all = loadAll();
  const visit = getOrThrow(all, id);
  if (visit.reportWorkflow.stageId !== 'awaiting-execution') {
    throw new Error('Script verification can only be changed while the report is being completed.');
  }
  const updated: SiteVisit = { ...visit, scriptVerification };
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
