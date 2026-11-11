import { LABELS } from '../../config/labels';
import { assertFileNotEmpty } from '../../shared/files/fileCheck';
import { appendAuditEntry } from '../../shared/audit/auditLog';
import { isChecklistComplete, type ChecklistSection } from '../../shared/checklist/types';
import { addNotification } from '../../shared/notifications/store';
import { getPerson } from '../../shared/people/directory';
import { addWorkingDays, toIsoDate, workingDaysBetween } from '../../shared/dates/workingDays';
import { canActInStage, performAction, WorkflowError } from '../../shared/workflow/engine';
import { listMonitoringItems, type RplArplMonitoringItem } from '../../mock/api/siteVisitsStore';
import { readStore, writeStore } from '../../mock/api/storage';
import { buildEisaReadinessVisitSections } from '../../mock/data/eisaReadinessVisitSections';
import { buildPostEisaMonitoringVisitSections } from '../../mock/data/postEisaMonitoringSections';
import { buildMarkingGuidelineDiscussionSections, buildMarkingModerationVisitSections } from '../../mock/data/siteVisitFormSections';
import { buildRplArplMonitoringVisitSections } from '../../mock/data/rplArplVisitSections';
import type { Role } from '../../types';
import { listPublishedSittings } from '../eisa-calendar/api';
import { qualificationIdOf } from '../eisa-calendar/sittingDetails';
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
import {
  bookedVisitNotificationBody,
  remediationRequestedNotification,
  remediationSubmittedNotification,
  visitMovedNotification,
  visitNoticeNotification,
  visitReminderNotification,
  visitResponseNotification,
} from './notificationText';
import {
  COMPLETE_VISIT_BLOCKED_MESSAGE,
  MISSING_REMEDIATION_ITEMS_MESSAGE,
  MISSING_REMEDIATION_RESPONSE_MESSAGE,
  openRemediationRound,
  remediationResponderOf,
  remediationRoundsOf,
  remediationStakeholderName,
  REMEDIATION_AWAITING_STAGE,
  visitCanHaveRemediation,
} from './remediation';
import { visitEndDateIssue } from './schedule';
import { getScriptVerificationIssues } from './scriptVerification';
import { MISSING_SUB_UNIT_MESSAGE, defaultSubUnitFor } from './subUnits';
import {
  MOVE_VISIT_DATE_MESSAGE,
  MOVE_VISIT_REASON_MESSAGE,
  NOT_AVAILABLE_REASON_MESSAGE,
  remindersDueBy,
  visitIsUnannounced,
  visitNeedsNotice,
  visitStakeholderOf,
} from './stakeholderResponse';
import { isSharedWithStakeholder, shareIsLockedByRemediation, visitCanBeShared, visitShareRecipientOf } from './stakeholderShare';
import { PLANNING_WORKFLOW, REPORT_WORKFLOW, overallStatusLabel } from './workflow';
import type {
  NewVisitInput,
  RemediationRound,
  ScriptVerification,
  SiteVisit,
  StakeholderAnswer,
  VisitDateMove,
  VisitQualification,
  VisitStakeholder,
  VisitOfficial,
  VisitStakeholderResponse,
  VisitType,
} from './types';
import { isMultiQualificationVisit, qualificationEntriesHaveSitting, qualificationListIssues, saqaIdForQualification, visitQualificationsOf } from './visitQualifications';
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
    qualifications: [{ id: crypto.randomUUID(), qualificationTitle: item.qualificationTitle, saqaId: saqaIdForQualification(item.qualificationTitle), sittingId: null, eisaDate: '' }],
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

const SYSTEM_ACTOR = { actorRole: REPORT_SUBMITTER_ROLE, actorId: 'system', actorName: 'System (visit notice)' } as const;

// Batch V2: told through the system. An assessment centre has no portal, so its notices go to the ASD,
// who records the answer for it.
function notifyStakeholder(stakeholder: VisitStakeholder, text: { title: string; body: string }): void {
  if (stakeholder.kind === 'assessment-centre') {
    addNotification({ recipientRole: REPORT_SUBMITTER_ROLE, ...text });
    return;
  }
  addNotification({ recipientRole: stakeholder.kind, recipientPersonId: stakeholder.id ?? undefined, ...text });
}

// Batch V2 (QCTO 29.36): the notice for a booked, notified visit. Called when the visit is booked (or
// booked again after a move), and when an auto-created RPL/ARPL visit, booked from the start, is given
// its date. Unannounced visits get none (CR-051).
function sendNotice(visit: SiteVisit, actor: { actorRole: Role; actorId: string; actorName: string }): SiteVisit {
  const stakeholder = visitStakeholderOf(visit);
  if (!stakeholder || !visitNeedsNotice(visit)) return visit;
  const text = visitNoticeNotification(visit, stakeholder.kind === 'assessment-centre', stakeholder.name);
  notifyStakeholder(stakeholder, text);
  appendAuditEntry({
    recordType: 'site-visit-planning',
    recordId: visit.id,
    actorRole: actor.actorRole,
    actorId: actor.actorId,
    actorName: actor.actorName,
    action: `Visit notice sent to ${stakeholder.name} (${stakeholder.kind === 'assessment-centre' ? 'assessment centre' : stakeholder.kind})`,
    note: `Visit date ${visit.visitDate}`,
  });
  return {
    ...visit,
    stakeholderNotice: { sentAt: new Date().toISOString(), sentTo: stakeholder.kind, sentToName: stakeholder.name },
    stakeholderResponse: undefined,
    reminders: [],
  };
}

// Worked out on load (the same pattern as the Batch S escalation): a notified visit with no response
// gets a reminder REMINDER_WORKING_DAYS working days after the notice, and again every
// REMINDER_WORKING_DAYS after that, until the stakeholder answers or the visit date passes. Each
// reminder is sent once: the count already stored is never sent again.
function syncStakeholderReminders(): void {
  const today = toIsoDate(new Date());
  const all = loadAll();
  let changed = false;
  const next = all.map((visit) => {
    const due = remindersDueBy(visit, today);
    const sent = visit.reminders?.length ?? 0;
    const stakeholder = visitStakeholderOf(visit);
    if (!stakeholder || due.length <= sent) return visit;
    const fresh = due.slice(sent).map((date, i) => ({ number: sent + i + 1, sentAt: new Date(Math.min(Date.parse(`${date}T07:00:00Z`), Date.now())).toISOString() }));
    for (const reminder of fresh) {
      notifyStakeholder(stakeholder, visitReminderNotification(visit, stakeholder.kind === 'assessment-centre', stakeholder.name, reminder.number));
      appendAuditEntry({
        recordType: 'site-visit-planning',
        recordId: visit.id,
        ...SYSTEM_ACTOR,
        actorName: 'System (reminder)',
        action: `Reminder ${reminder.number} sent to ${stakeholder.name}`,
        note: `No response to the visit date ${visit.visitDate} yet.`,
      });
    }
    changed = true;
    return { ...visit, reminders: [...(visit.reminders ?? []), ...fresh] };
  });
  if (changed) saveAll(next);
}

export async function listVisits(): Promise<SiteVisit[]> {
  await syncAutoCreatedVisits();
  syncStakeholderReminders();
  return loadAll();
}

export async function getVisit(id: string): Promise<SiteVisit | undefined> {
  await syncAutoCreatedVisits();
  syncStakeholderReminders();
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

// Batch V1 (05.13): the checks every new Marking & Moderation / RPL/ARPL list goes through. A
// Marking & Moderation entry takes its title, SAQA ID and EISA date from its published sitting, so
// they cannot disagree with the Calendar.
async function resolveQualifications(visitType: VisitType, entries: VisitQualification[]): Promise<VisitQualification[]> {
  const issue = qualificationListIssues(visitType, entries)[0];
  if (issue) throw new Error(issue);
  const sittings = qualificationEntriesHaveSitting(visitType) ? await listPublishedSittings() : [];
  const resolved = entries.map((entry): VisitQualification => {
    if (!qualificationEntriesHaveSitting(visitType)) {
      return { id: entry.id || crypto.randomUUID(), qualificationTitle: entry.qualificationTitle.trim(), saqaId: entry.saqaId || saqaIdForQualification(entry.qualificationTitle), sittingId: null, eisaDate: '' };
    }
    const sitting = sittings.find((s) => s.id === entry.sittingId);
    if (!sitting) throw new Error(`"${entry.qualificationTitle}" needs a published EISA sitting.`);
    return { id: entry.id || crypto.randomUUID(), qualificationTitle: sitting.qualificationTitle, saqaId: qualificationIdOf(sitting), sittingId: sitting.id, eisaDate: sitting.date };
  });
  const duplicate = qualificationListIssues(visitType, resolved)[0];
  if (duplicate) throw new Error(duplicate);
  return resolved;
}

// Batch Z2: the planner is always the first official; the rest are internal staff, each listed once.
export const MISSING_OFFICIALS_MESSAGE = 'Choose at least one QCTO official.';

function resolveOfficials(plannerId: string, officialIds: string[]): VisitOfficial[] {
  const ids = [plannerId, ...officialIds].filter((id, i, all) => !!id && all.indexOf(id) === i);
  return ids.map((id) => {
    const person = getPerson(id);
    if (!person || person.portal !== 'internal') throw new Error('Choose QCTO officials from the internal staff.');
    return { personId: person.id, name: person.name };
  });
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
  // Batch Z2 (11.9): the sub-unit has no default for a special meeting; the last day of a multi-day visit is checked.
  const domain = input.domain ?? DEFAULT_VISIT_DOMAIN;
  const subUnit = input.subUnit ?? defaultSubUnitFor(input.visitType, domain);
  if (!subUnit) throw new Error(MISSING_SUB_UNIT_MESSAGE);
  const endDateIssue = visitEndDateIssue(input.visitDate, input.visitEndDate);
  if (endDateIssue) throw new Error(endDateIssue);
  const officials = resolveOfficials(input.createdById, (input.officials ?? []).map((o) => o.personId));
  // Batch V1 (05.13): Marking & Moderation and RPL/ARPL cover a list of qualifications.
  const qualifications = isMultiQualificationVisit(input.visitType) ? await resolveQualifications(input.visitType, input.qualifications ?? []) : undefined;
  const visit: SiteVisit = {
    id: crypto.randomUUID(),
    visitType: input.visitType,
    domain: input.domain ?? DEFAULT_VISIT_DOMAIN,
    meetingTitle: isMeeting ? input.meetingTitle?.trim() : undefined,
    purpose: visitHasPurpose(input.visitType) ? input.purpose?.trim() : undefined,
    subUnit,
    officials,
    visitEndDate: input.visitEndDate || null,
    qpId: hasQp ? input.qpId : '',
    qpName: hasQp ? input.qpName : '',
    qualificationTitle: qualifications ? (qualifications[0]?.qualificationTitle ?? '') : input.qualificationTitle,
    qualifications,
    sdpId: visitHasSdp(input.visitType) ? input.sdpId : null,
    sdpName: visitHasSdp(input.visitType) ? input.sdpName : null,
    assessmentCentreName: input.assessmentCentreName?.trim() || null,
    sittingId: qualifications ? (qualifications[0]?.sittingId ?? null) : visitHasSittingLink(input.visitType) ? input.sittingId : null,
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
  patch: Partial<Pick<SiteVisit, 'qpId' | 'qpName' | 'qualificationTitle' | 'sdpName' | 'venue' | 'visitDate' | 'domain' | 'meetingTitle' | 'purpose' | 'subUnit' | 'visitEndDate'>> & { officialIds?: string[] },
): Promise<SiteVisit> {
  const all = loadAll();
  const visit = getOrThrow(all, id);
  // QCTO 29.36: a booked visit's date only changes through "Move the visit", which sends the new date
  // back through approval. A booked visit with no date yet (auto-created RPL/ARPL) can still be given one.
  if (patch.visitDate !== undefined && patch.visitDate !== visit.visitDate && visit.planningWorkflow.stageId === 'booked' && visit.visitDate) {
    throw new Error('This visit is booked. Use "Move the visit" to change its date.');
  }
  const { officialIds, ...rest } = patch;
  let updated: SiteVisit = { ...visit, ...rest };
  // Batch Z2: the last day stays valid against the date, and the planner (the first official) stays on the visit.
  if (patch.visitEndDate !== undefined) updated = { ...updated, visitEndDate: patch.visitEndDate || null };
  const endDateIssue = visitEndDateIssue(updated.visitDate, updated.visitEndDate);
  if (endDateIssue) throw new Error(endDateIssue);
  if (officialIds) {
    const plannerId = visit.officials?.[0]?.personId ?? officialIds[0] ?? '';
    const officials = resolveOfficials(plannerId, officialIds);
    if (officials.length === 0) throw new Error(MISSING_OFFICIALS_MESSAGE);
    updated = { ...updated, officials };
  }
  if (patch.visitDate && !visit.visitDate && !visit.stakeholderNotice && patch.visitDate >= toIsoDate(new Date())) {
    updated = sendNotice(updated, SYSTEM_ACTOR);
  }
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
  | 'plan-sda-reject'
  | 'plan-move';

interface PlanningActionParams {
  visitId: string;
  actionId: PlanningActionId;
  actorRole: Role;
  actorId: string;
  actorName: string;
  planNote?: string;
  // Row 33: mandatory on every send-back/reject action. For 'plan-move' it is the reason.
  note?: string;
  // 'plan-move' only (Batch V2): the new visit date, and whether the reason is the stakeholder's "not
  // available" or QCTO's own decision.
  newDate?: string;
  moveReasonSource?: VisitDateMove['reasonSource'];
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

// QCTO 29.36: "Move the visit" is for a booked visit that has not been carried out yet. The new date must
// be a different day that is not in the past, and the reason is always written down.
function assertCanMoveVisit(visit: SiteVisit, params: PlanningActionParams): void {
  if (visit.planningWorkflow.stageId !== 'booked') throw new Error('Only a booked visit can be moved.');
  if (visit.reportWorkflow.stageId !== 'awaiting-execution') throw new Error('A visit can only be moved before it is carried out.');
  if (!params.newDate) throw new Error(MOVE_VISIT_DATE_MESSAGE);
  if (!params.note?.trim()) throw new Error(MOVE_VISIT_REASON_MESSAGE);
  if (params.newDate === visit.visitDate) throw new Error('The new date must be different from the current date.');
  if (params.newDate < toIsoDate(new Date())) throw new Error('The new date cannot be in the past.');
  if (params.moveReasonSource === 'stakeholder-not-available' && visit.stakeholderResponse?.answer !== 'not-available') {
    throw new Error('The stakeholder has not said they are not available for this date.');
  }
}

function moveAuditNote(visit: SiteVisit, params: PlanningActionParams): string {
  const source = params.moveReasonSource === 'stakeholder-not-available' ? 'Stakeholder not available' : 'QCTO decision';
  return `From ${visit.visitDate} to ${params.newDate ?? ''}. ${source}: ${params.note?.trim() ?? ''}`;
}

export async function performPlanningAction(params: PlanningActionParams): Promise<SiteVisit> {
  const all = loadAll();
  const visit = getOrThrow(all, params.visitId);
  // QCTO feedback 2.8: an auto-created Post-EISA Monitoring visit has no date until the planner picks one.
  if (params.actionId === 'plan-submit' && !visit.visitDate) throw new Error(MISSING_VISIT_DATE_MESSAGE);
  const movedFromDate = visit.visitDate;
  if (params.actionId === 'plan-move') assertCanMoveVisit(visit, params);

  const nextWorkflow = performAction({
    definition: PLANNING_WORKFLOW,
    record: visit.planningWorkflow,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: params.actionId === 'plan-move' ? moveAuditNote(visit, params) : params.note,
    recordType: 'site-visit-planning',
    recordId: visit.id,
  });

  let updated: SiteVisit = { ...visit, planningWorkflow: nextWorkflow };
  if (params.actionId === 'plan-submit' && params.planNote !== undefined) {
    updated = { ...updated, planNote: params.planNote };
  }
  // Batch V2 (QCTO 29.36): the old date, the reason and the stakeholder's answer stay in dateMoves; the
  // new date starts again with no notice, answer or reminders, and is put to the stakeholder when booked.
  if (params.actionId === 'plan-move') {
    const move: VisitDateMove = {
      id: crypto.randomUUID(),
      fromDate: visit.visitDate,
      toDate: params.newDate ?? '',
      reason: params.note?.trim() ?? '',
      reasonSource: params.moveReasonSource ?? 'qcto',
      movedBy: params.actorName,
      movedById: params.actorId,
      movedAt: new Date().toISOString(),
      previousNotice: visit.stakeholderNotice ?? null,
      previousResponse: visit.stakeholderResponse ?? null,
      previousReminders: visit.reminders?.length ?? 0,
    };
    // Batch Z2: a multi-day visit keeps its length in working days on the new date; the last day stays editable.
    const spanWorkingDays = visit.visitEndDate ? workingDaysBetween(visit.visitDate, visit.visitEndDate) : 0;
    updated = {
      ...updated,
      visitDate: move.toDate,
      visitEndDate: visit.visitEndDate ? addWorkingDays(move.toDate, spanWorkingDays) : visit.visitEndDate,
      dateMoves: [...(visit.dateMoves ?? []), move],
      stakeholderNotice: undefined,
      stakeholderResponse: undefined,
      reminders: undefined,
    };
  }
  if (params.actionId === 'plan-book') updated = sendNotice(updated, params);
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
  if (params.actionId === 'plan-move') {
    const text = visitMovedNotification(updated, movedFromDate, params.note?.trim() ?? '');
    addNotification({ recipientRole: PLAN_RECOMMENDER_ROLE, ...text });
  }
  if (nextWorkflow.stageId === 'booked') {
    addNotification({
      recipientRole: REPORT_SUBMITTER_ROLE,
      title: bookedVisitNotificationTitle(visit.visitType),
      body: bookedVisitNotificationBody(visit),
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
  actionId:
    | 'report-submit'
    | 'report-approve'
    | 'report-approve-remediation'
    | 'remediation-submit'
    | 'remediation-approve-final'
    | 'remediation-further'
    | 'report-send-back'
    | 'report-reject'
    | 'report-reroute'
    | 'share-visit-outcome'
    | 'qp-acknowledge-outcome';
  actorRole: Role;
  actorId: string;
  actorName: string;
  // For report-approve-remediation and remediation-further this is the remediation items; for
  // remediation-submit it is the response.
  note?: string;
  // CR-055: the named colleague (same role) a report is being re-routed to.
  targetPersonId?: string;
}

interface RemediationActor {
  actorRole: Role;
  actorId: string;
  actorName: string;
}

// Batch V1 (05.14): the QP named on the visit answers the items; for a stakeholder without a QP
// (RPL at an SDP or assessment centre) the ASD records the response until SDPs get their own view.
function assertCanRespondToRemediation(visit: SiteVisit, actor: RemediationActor): void {
  const responder = remediationResponderOf(visit);
  if (responder === 'ASD') {
    if (actor.actorRole !== REPORT_SUBMITTER_ROLE) throw new Error(`Only the ${REPORT_SUBMITTER_ROLE} records the response for this visit.`);
    return;
  }
  if (responder === 'SDP') {
    if (actor.actorRole !== 'SDP' || actor.actorId !== visit.sdpId) throw new Error('Only the SDP named on this visit can respond to the remediation.');
    return;
  }
  if (actor.actorRole !== 'QP' || actor.actorId !== visit.qpId) throw new Error('Only the QP named on this visit can respond to the remediation.');
}

function newRemediationRound(visit: SiteVisit, items: string, actor: RemediationActor): RemediationRound {
  return {
    id: crypto.randomUUID(),
    round: remediationRoundsOf(visit).length + 1,
    items,
    requestedBy: actor.actorName,
    requestedById: actor.actorId,
    requestedAt: new Date().toISOString(),
    sharedWith: remediationStakeholderName(visit),
    evidence: [],
    response: '',
    submittedBy: null,
    submittedById: null,
    submittedByRole: null,
    submittedAt: null,
    review: null,
  };
}

// The QP is told when remediation is requested; for a stakeholder without a QP the ASD is told
// instead, because the ASD records the response.
function notifyRemediationRequested(visit: SiteVisit, round: RemediationRound): void {
  const text = remediationRequestedNotification(visit, round.items, round.round);
  const responder = remediationResponderOf(visit);
  if (responder === 'ASD') {
    addNotification({ recipientRole: REPORT_SUBMITTER_ROLE, title: `${text.title} — record the response`, body: `${text.body} Record the response of ${round.sharedWith} on the visit.` });
  } else if (responder === 'SDP') {
    addNotification({ recipientRole: 'SDP', recipientPersonId: visit.sdpId ?? undefined, title: text.title, body: `${text.body} (${round.sharedWith}). See Site Visits.` });
  } else {
    addNotification({ recipientRole: 'QP', title: text.title, body: `${text.body} (${visit.qpName}). See Visit Outcomes.` });
  }
}

export async function performReportAction(params: ReportActionParams): Promise<SiteVisit> {
  const all = loadAll();
  const visit = getOrThrow(all, params.visitId);
  const items = params.note?.trim() ?? '';
  const openRound = openRemediationRound(visit);

  if (params.actionId === 'share-visit-outcome' && visit.reportWorkflow.stageId !== 'approved') throw new Error(COMPLETE_VISIT_BLOCKED_MESSAGE);
  if (params.actionId === 'report-approve-remediation') {
    if (!visitCanHaveRemediation(visit)) throw new Error('This visit has no QP, SDP or assessment centre to send remediation to. Use "Approved (final)".');
    if (!items) throw new Error(MISSING_REMEDIATION_ITEMS_MESSAGE);
  }
  if (params.actionId === 'remediation-further' && !items) throw new Error(MISSING_REMEDIATION_ITEMS_MESSAGE);
  if (params.actionId === 'remediation-submit') {
    assertCanRespondToRemediation(visit, params);
    if (!items) throw new Error(MISSING_REMEDIATION_RESPONSE_MESSAGE);
  }

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
  let updated: SiteVisit = { ...visit, reportWorkflow: completed ? { ...nextWorkflow, stageId: 'closed' } : nextWorkflow };

  // Batch V1 (05.14): keep the full history of rounds (items, response, evidence, who and when).
  const now = new Date().toISOString();
  const review = (decision: 'approved-final' | 'further-remediation') => ({ decision, reviewedBy: params.actorName, reviewedById: params.actorId, reviewedAt: now });
  let newRound: RemediationRound | null = null;
  if (params.actionId === 'report-approve-remediation' || params.actionId === 'remediation-further') {
    const closed = remediationRoundsOf(visit).map((r) => (r.id === openRound?.id ? { ...r, review: review('further-remediation') } : r));
    newRound = newRemediationRound(visit, items, params);
    updated = { ...updated, remediationRounds: [...closed, newRound] };
  }
  if (params.actionId === 'remediation-submit' && openRound) {
    updated = {
      ...updated,
      remediationRounds: remediationRoundsOf(visit).map((r) =>
        r.id === openRound.id
          ? { ...r, response: items, submittedBy: params.actorName, submittedById: params.actorId, submittedByRole: params.actorRole === 'QP' ? 'QP' : params.actorRole === 'SDP' ? 'SDP' : 'ASD', submittedAt: now }
          : r,
      ),
    };
  }
  if (params.actionId === 'remediation-approve-final' && openRound) {
    updated = { ...updated, remediationRounds: remediationRoundsOf(visit).map((r) => (r.id === openRound.id ? { ...r, review: review('approved-final') } : r)) };
  }
  // The report and the items go to the stakeholder automatically, whatever the share Yes/No says.
  if (params.actionId === 'report-approve-remediation' && visitShareRecipientOf(visit) && !isSharedWithStakeholder(visit)) {
    updated = {
      ...updated,
      stakeholderShare: {
        shared: true,
        outcomeSummary: visit.stakeholderShare?.outcomeSummary || 'Approved with remediation. The remediation items are listed with this report.',
        changedAt: now,
        changedBy: params.actorName,
        changedById: params.actorId,
      },
    };
  }
  saveAll(replace(all, updated));
  if (newRound && params.actionId === 'report-approve-remediation') {
    appendAuditEntry({
      recordType: 'site-visit-report',
      recordId: visit.id,
      actorRole: params.actorRole,
      actorId: params.actorId,
      actorName: params.actorName,
      action: `Report and remediation items shared with ${newRound.sharedWith}`,
      note: newRound.items,
    });
  }
  if (newRound) notifyRemediationRequested(updated, newRound);
  if (params.actionId === 'remediation-submit') {
    const text = remediationSubmittedNotification(visit);
    addNotification({ recipientRole: REPORT_APPROVER_ROLE, title: text.title, body: text.body });
  }

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
    addNotification({ recipientRole: REPORT_SUBMITTER_ROLE, title: 'Report approved', body: `Your report for "${visitSubject(visit)}" was approved (final).` });
  }
  if (params.actionId === 'report-approve-remediation') {
    addNotification({ recipientRole: REPORT_SUBMITTER_ROLE, title: 'Report approved with remediation', body: `Your report for "${visitSubject(visit)}" was approved with remediation.` });
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
  const recipient = visitShareRecipientOf(visit);
  if (!recipient || !visitCanBeShared(visit)) throw new Error('This report cannot be shared yet.');
  if (params.shared === isSharedWithStakeholder(visit)) return visit;
  if (!params.shared && shareIsLockedByRemediation(visit)) {
    throw new Error('Sharing cannot be stopped: remediation was requested, so the report and items were shared automatically.');
  }
  const outcomeSummary = params.outcomeSummary?.trim() ?? visit.stakeholderShare?.outcomeSummary ?? '';
  if (params.shared && !outcomeSummary) throw new Error(`Enter the outcome summary the ${recipient.kind} will see.`);

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
    action: params.shared ? `Report shared with the ${recipient.kind} (${recipient.name})` : `Report no longer shared with the ${recipient.kind} (${recipient.name})`,
    note: params.shared ? outcomeSummary : undefined,
  });
  if (params.shared) {
    const where = recipient.kind === 'QP' ? 'Visit Outcomes' : 'Site Visits';
    addNotification({
      recipientRole: recipient.kind,
      recipientPersonId: recipient.id ?? undefined,
      title: 'Visit outcome shared',
      body: `QCTO has shared the outcome of the visit for "${visitSubject(visit)}" (${recipient.name}). See ${where}.`,
    });
  }
  return updated;
}

interface RespondToNoticeParams {
  visitId: string;
  answer: StakeholderAnswer;
  reason?: string;
  suggestedDate?: string;
  actorRole: Role;
  actorId: string;
  actorName: string;
}

const ISO_DATE = /^d{4}-d{2}-d{2}$/;

// Batch V2 (QCTO 29.36): the stakeholder accepts the date, or says they are not available (a reason is
// required, a suggested date is optional). Recorded with who, when and the reason, on the visit and in
// the audit trail; the ASD and DD are told. An assessment centre has no portal, so the ASD records the
// answer for it.
export async function respondToVisitNotice(params: RespondToNoticeParams): Promise<SiteVisit> {
  const all = loadAll();
  const visit = getOrThrow(all, params.visitId);
  const stakeholder = visitStakeholderOf(visit);
  const today = toIsoDate(new Date());
  if (!stakeholder || visitIsUnannounced(visit)) throw new Error('This visit has no notice to respond to.');
  if (!visit.stakeholderNotice || !visitNeedsNotice(visit)) throw new Error('This visit has not been notified yet.');
  if (visit.stakeholderResponse) throw new Error('This visit date has already been answered.');
  if (visit.visitDate < today) throw new Error('The visit date has passed.');
  const byAsd = stakeholder.kind === 'assessment-centre';
  if (byAsd ? params.actorRole !== REPORT_SUBMITTER_ROLE : params.actorRole !== stakeholder.kind || params.actorId !== stakeholder.id) {
    throw new Error(byAsd ? `Only the ${REPORT_SUBMITTER_ROLE} records the response for ${stakeholder.name}.` : `Only ${stakeholder.name} can respond to this visit.`);
  }
  const reason = params.reason?.trim() ?? '';
  const suggestedDate = params.answer === 'not-available' ? (params.suggestedDate ?? '') : '';
  if (params.answer === 'not-available' && !reason) throw new Error(NOT_AVAILABLE_REASON_MESSAGE);
  if (suggestedDate && (!ISO_DATE.test(suggestedDate) || suggestedDate < today)) throw new Error('The suggested date must be a date that is not in the past.');

  const response: VisitStakeholderResponse = {
    answer: params.answer,
    reason: params.answer === 'accepted' ? '' : reason,
    suggestedDate,
    respondedBy: params.actorName,
    respondedById: params.actorId,
    respondedByRole: params.actorRole === 'QP' ? 'QP' : params.actorRole === 'SDP' ? 'SDP' : 'ASD',
    respondedAt: new Date().toISOString(),
  };
  const updated: SiteVisit = { ...visit, stakeholderResponse: response };
  saveAll(replace(all, updated));
  const forWhom = byAsd ? `Recorded for ${stakeholder.name}: ` : '';
  appendAuditEntry({
    recordType: 'site-visit-planning',
    recordId: visit.id,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    action: params.answer === 'accepted' ? `${forWhom}Accepted the visit date (${visit.visitDate})` : `${forWhom}Not available on ${visit.visitDate}`,
    note: params.answer === 'accepted' ? undefined : `${reason}${suggestedDate ? ` Suggested date: ${suggestedDate}.` : ''}`,
  });
  const text = visitResponseNotification(visit, params.answer, stakeholder.name, reason, suggestedDate);
  addNotification({ recipientRole: REPORT_SUBMITTER_ROLE, ...text });
  addNotification({ recipientRole: PLAN_RECOMMENDER_ROLE, ...text });
  return updated;
}

export interface SharedVisitOutcome {
  id: string;
  visitType: VisitType;
  visitDate: string;
  // Batch V1 (05.13): every qualification the visit covers, with its EISA date where it has one.
  qualifications: VisitQualification[];
  outcomeSummary: string;
  reportFileNames: string[];
  // Batch V1 (05.14): the status, and the rounds of remediation (oldest first).
  statusLabel: string;
  remediationRounds: RemediationRound[];
  // True while the QP can add evidence and submit (the stage is "awaiting QP").
  canRespond: boolean;
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
      qualifications: visitQualificationsOf(v),
      outcomeSummary: v.stakeholderShare?.outcomeSummary ?? '',
      reportFileNames: evidenceOf(v)
        .filter((f) => f.category === 'report')
        .map((f) => f.fileName),
      statusLabel: overallStatusLabel(v),
      remediationRounds: remediationRoundsOf(v),
      canRespond: v.reportWorkflow.stageId === REMEDIATION_AWAITING_STAGE,
    }))
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
}

// Batch V1 (05.14): evidence for the open round, added by the QP (or by the ASD for a stakeholder
// without a QP) before "Submit remediation". Empty files are refused with the shared helper.
export async function addRemediationEvidence(
  visitId: string,
  file: { fileName: string; fileSize: number },
  actor: RemediationActor,
): Promise<SiteVisit> {
  const all = loadAll();
  const visit = getOrThrow(all, visitId);
  const round = openRemediationRound(visit);
  if (visit.reportWorkflow.stageId !== REMEDIATION_AWAITING_STAGE || !round) throw new Error('Evidence can only be added while the remediation is awaiting a response.');
  assertCanRespondToRemediation(visit, actor);
  assertFileNotEmpty(file);
  const uploaded = { ...file, uploadedAt: new Date().toISOString(), uploadedBy: actor.actorName };
  const updated: SiteVisit = {
    ...visit,
    remediationRounds: remediationRoundsOf(visit).map((r) => (r.id === round.id ? { ...r, evidence: [...r.evidence, uploaded] } : r)),
  };
  saveAll(replace(all, updated));
  appendAuditEntry({
    recordType: 'site-visit-report',
    recordId: visit.id,
    actorRole: actor.actorRole,
    actorId: actor.actorId,
    actorName: actor.actorName,
    action: `Remediation evidence added (round ${round.round})`,
    note: file.fileName,
  });
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
