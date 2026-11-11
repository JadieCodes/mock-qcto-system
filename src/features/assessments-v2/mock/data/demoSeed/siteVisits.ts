// Demo seed — Site Visits & Monitoring, items 1.12 and 2.8. Written in the same shape as
// site-visits/api.ts (createVisit, updateVisitDetails, performPlanningAction, saveChecklist,
// saveFreeTextNotes, saveCompletionDetails, performReportAction), with the audit entries and
// notifications each step implies. Days are "days ago"; visit dates are relative to today.
// QCTO feedback A2: EISA Readiness has no qualification, sitting or SDP; Marking & Moderation
// has a sitting but no SDP. Batch A3 (QCTO feedback 2.7, 2.12): RPL/ARPL visits are held at
// the SDP with no QP and no sitting or EISA date; sharing an outcome completes the visit.
//
//  #     Type                  QP / subject                         Visit date    Stage
//  SV1   EISA Readiness        Nomvula Dlamini                      today + 30    Plan submitted — waiting for the Deputy Director
//  SV2   Marking & Moderation  Electrical Trades sitting today + 35 today + 35    Recommended — waiting for the Domain Director
//  SV3   Post-EISA Monitoring  Welding sitting today - 150          no date yet   To be scheduled — created automatically when the
//                              (Precious Mahlangu, 40% batch)                     Chief Director approved the batch below the 45%
//                                                                                 threshold (QCTO feedback 2.8); the planner picks
//                                                                                 the date.
//  SV4   RPL/ARPL Monitoring   Thabo Technical College (SDP, no QP) today + 20    Booked — awaiting execution (auto-created from
//                              Electrical Trades (registration G6)                the RPL/ARPL-flagged registration)
//  SV5   Marking & Moderation  Electrical Trades sitting today - 15 today - 15    Booked — report in draft (first section done,
//                                                                                 one attendance register uploaded)
//  SV6   EISA Readiness        Precious Mahlangu                    today - 10    Report submitted — waiting for the Deputy Director
//  SV7   Marking & Moderation  Welding sitting today - 45           today - 45    Report approved — waiting to share the outcome
//  SV8   RPL/ARPL Monitoring   Lerato Training Institute (SDP, no   today - 80    Closed — outcome shared, visit completed
//                              QP), Plumbing (registration P5)
//  SV9   EISA Readiness        Johan van der Merwe                  today - 20    Report sent back for clarification — ASD to answer
//  SV10  EISA Readiness        Johan van der Merwe                  today + 10    Plan rejected by the Domain Director (reason given)
//  SV11  Marking & Moderation  Plumbing sitting today - 75          today - 75    Closed — outcome shared, QP notified
//  SV12  Marking & Moderation  Welding sitting today + 55           today + 55    Plan sent back to the ASD (reason given)
//  SV13  Marking guideline     Nomvula Dlamini                      today + 15    Recommended — waiting for the Domain Director
//        discussion
//  SV14  Instrument validation Nomvula Dlamini                      today - 12    Report approved — shared with the QP
//        visit
//  SV15  QASA development      Nomvula Dlamini (Qualifications      today - 30    Closed — shared with the QP
//        visit                 Development domain)
//  SV16  Other / special       "Certification hand-off working      today + 5     Booked — awaiting execution (no QP)
//        meeting               session" (Certification domain)
//
// Batch G: SV7 and SV11 carry a filled script verification (QCTO feedback 3.7), which Submit
// Report needs on a Marking & Moderation visit. Completing a visit no longer notifies the QP;
// only a visit shared with the stakeholder does, so the QP Nomvula Dlamini sees exactly two
// shared outcomes (SV14, SV15) on Visit Outcomes. Every other visit is not shared.
//
// The Electrical Trades batch at 50% (Nomvula Dlamini) is above the 45% threshold, so it has no
// Post-EISA Monitoring visit. SV5, SV7 and SV11 are linked to sittings
// that have a results batch or are awaiting one, so Approval of Results shows their Marking &
// Moderation status.
//
// QCTO feedback 1.12 (Batch D): a report can only be submitted with at least one "Visit report"
// file, so every visit whose report was ever submitted (SV6, SV7, SV8, SV9, SV11) carries one
// sample visit report, uploaded by the ASD after executing the visit. SV5 (draft) has one
// attendance register and no report yet.
//
// Batch V1 (05.13, 05.14): four visits added at the end (the original sixteen are unchanged).
//  SV17  Marking & Moderation  Three qualifications (Electrical Trades,  today - 8     Report submitted — waiting for the Deputy Director
//                              Welding, Plumbing), each with its own                  (script verification spread over the three)
//                              published EISA sitting
//  SV18  Marking guideline     Nomvula Dlamini                          today - 14    Approved with remediation — awaiting QP (shared with
//        discussion                                                                    the QP automatically; she already has two outcomes)
//  SV19  Instrument validation Precious Mahlangu                        today - 25    Remediation submitted — DD review (round 1 sent back
//        visit                                                                         for further remediation; round 2 has a response and
//                                                                                      evidence)
//  SV20  RPL/ARPL Monitoring   Khanya Skills Academy (SDP, no QP),      today - 6     Report submitted — waiting for the Deputy Director
//                              Electrical Trades and Welding
//
// Batch V2 (QCTO 29.36, item 2.12): five visits added at the end, for the notice and response step.
//  SV21  Marking & Moderation  Plumbing sitting today + 62 (Johan van    today + 62    Booked 3 working days ago, notified; the QP has not
//                              der Merwe)                                               answered and has had one reminder
//  SV22  RPL/ARPL Monitoring   Thabo Technical College (Welding)        today + 25    Booked; the SDP accepted the date
//  SV23  RPL/ARPL Monitoring   Lerato Training Institute (Plumbing)     today + 20    Booked; the SDP is not available (reason and a
//                                                                                     suggested date); the ASD can move the visit
//  SV24  RPL/ARPL Monitoring   Khanya Skills Academy (Welding)          today + 40    Moved after "not available": back at Deputy Director
//                                                                                     recommendation, old date, reason and answer in the history
//  SV25  RPL/ARPL Monitoring   Thabo Technical College (Plumbing)       today + 9     Booked, unannounced: no notice, no response step
// Every earlier visit predates the step (no notice, no response). SV3's Post-EISA questionnaires open because
// its results batch (the Welding 40% batch) is approved: they read the real batch, not a flag on the visit.
//
// Planners (ASD): Lindiwe Khumalo / Riaan Pretorius. Deputy Director: Grace
// Mokoena / Peter Botha. Domain Director: Michael van Wyk / Nokuthula Dube. Sub Domain Admin:
// Karabo Sithole / Katlego Mahlangu. Report submitters (ASD): Sipho Ndlovu / Thandeka Zulu.
import { LABELS } from '../../../config/labels';
import { SDP_DIRECTORY } from '../sdpDirectory';
import type { RplArplMonitoringItem } from '../../api/siteVisitsStore';
import { buildEisaReadinessVisitSections } from '../eisaReadinessVisitSections';
import { buildPostEisaMonitoringVisitSections } from '../postEisaMonitoringSections';
import { buildRplArplMonitoringVisitSections } from '../rplArplVisitSections';
import { buildMarkingGuidelineDiscussionSections, buildMarkingModerationVisitSections } from '../siteVisitFormSections';
import { isChecklistComplete, type ChecklistSection } from '../../../shared/checklist/types';
import type { Person } from '../../../shared/people/types';
import type { Role } from '../../../types';
import type { ResultsBatch } from '../../../modules/approval-of-results/types';
import { competencyRatePercent, isBelowPostEisaThreshold } from '../../../modules/approval-of-results/workflow';
import { qualificationIdOf } from '../../../modules/eisa-calendar/sittingDetails';
import type { EisaSitting } from '../../../modules/eisa-calendar/types';
import type { EisaRegistrationRecord } from '../../../modules/eisa-registration/types';
import {
  BOOKING_ROLE,
  DEFAULT_NOTICE_LEAD_TIME_DAYS,
  MISSING_VISIT_DATE_MESSAGE,
  PLAN_APPROVER_ROLE,
  PLAN_RECOMMENDER_ROLE,
  PLANNER_ROLE,
  POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT,
  REPORT_APPROVER_ROLE,
  REPORT_SUBMITTER_ROLE,
  STAKEHOLDER_SHARE_ROLE,
} from '../../../modules/site-visits/config';
import { evidenceOf, hasVisitReportFile, MISSING_VISIT_REPORT_MESSAGE, type VisitEvidenceCategory } from '../../../modules/site-visits/evidence';
import { freeTextFieldsForType } from '../../../modules/site-visits/freeTextFields';
import {
  bookedVisitNotificationBody,
  remediationRequestedNotification,
  remediationSubmittedNotification,
  visitMovedNotification,
  visitNoticeNotification,
  visitReminderNotification,
  visitResponseNotification,
} from '../../../modules/site-visits/notificationText';
import { openRemediationRound, remediationResponderOf, remediationRoundsOf, remediationStakeholderName } from '../../../modules/site-visits/remediation';
import { remindersDueBy, visitNeedsNotice, visitStakeholderOf } from '../../../modules/site-visits/stakeholderResponse';
import { getScriptVerificationIssues, visitHasScriptVerification } from '../../../modules/site-visits/scriptVerification';
import { isSharedWithStakeholder, visitCanBeShared, visitShareRecipientOf } from '../../../modules/site-visits/stakeholderShare';
import type {
  NotificationFlag,
  ScriptVerificationResult,
  RemediationRound,
  ScriptVerificationRow,
  SiteVisit,
  StakeholderAnswer,
  VisitDateMove,
  VisitDomain,
  VisitQualification,
  VisitStakeholder,
  VisitType,
} from '../../../modules/site-visits/types';
import { isMultiQualificationVisit, qualificationListIssues, saqaIdForQualification, visitSittingIdsOf } from '../../../modules/site-visits/visitQualifications';
import { DEFAULT_VISIT_DOMAIN } from '../../../modules/site-visits/visitDomains';
import { isPerQualificationVisit, visitHasPurpose, visitHasQp, visitHasSdp, visitIsMeeting, visitSubject } from '../../../modules/site-visits/visitTypeLabels';
import { PLANNING_WORKFLOW, REPORT_WORKFLOW } from '../../../modules/site-visits/workflow';
import { isWorkingDay, subtractWorkingDays, toIsoDate } from '../../../shared/dates/workingDays';
import { RESULTS_SEED_IDS } from './approvalOfResults';
import { sittingAt } from './eisaRegistration';
import { answerChecklist, audit, createClock, dateOf, notify, seedId, seedPerson, step, todayIso, workingDateFromToday, type SeedClock, type SeedLog } from './helpers';

const VISIT_ID_GROUP = 8;

const LINDIWE = 'lindiwe-khumalo';
const RIAAN = 'riaan-pretorius';
const GRACE = 'grace-mokoena';
const PETER = 'peter-botha';
const MICHAEL = 'michael-van-wyk';
const NOKUTHULA = 'nokuthula-dube';
const KARABO = 'karabo-sithole';
const KATLEGO = 'katlego-mahlangu';
const SIPHO = 'sipho-ndlovu';
const THANDEKA = 'thandeka-zulu';
const FRANCOIS = 'francois-le-roux';
const NOMVULA = 'qp-nomvula-dlamini';
const JOHAN = 'qp-johan-van-der-merwe';
const PRECIOUS = 'qp-precious-mahlangu';

// api.ts buildChecklistForType().
function checklistForType(visitType: VisitType): ChecklistSection[] {
  switch (visitType) {
    case 'eisa-readiness':
      return buildEisaReadinessVisitSections();
    case 'marking-moderation':
      return buildMarkingModerationVisitSections();
    case 'rpl-arpl-monitoring':
      return buildRplArplMonitoringVisitSections();
    case 'post-eisa-monitoring':
      return buildPostEisaMonitoringVisitSections();
    case 'marking-guideline-discussion':
      return buildMarkingGuidelineDiscussionSections();
    case 'instrument-validation-visit':
    case 'qasa-development-visit':
    case 'other-meeting':
      return [];
  }
}

// api.ts bookedVisitNotificationTitle().
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

// api.ts PLANNING_NEXT_OWNER.
const PLANNING_NEXT_OWNER: Partial<Record<string, Role>> = {
  'plan-dd-send-back': PLANNER_ROLE,
  'plan-dd-reject': PLANNER_ROLE,
  'plan-domain-director-send-back': PLAN_RECOMMENDER_ROLE,
  'plan-domain-director-reject': PLANNER_ROLE,
  'plan-sda-send-back': PLAN_APPROVER_ROLE,
  'plan-sda-reject': PLANNER_ROLE,
};

const NOTES_BY_TYPE: Record<VisitType, Record<string, string>> = {
  'eisa-readiness': { notes: 'The QP walked through the EISA plan, venues and assessor appointments. No readiness concerns remain.' },
  'marking-moderation': {
    '7': 'The question papers were at the right level. The moderator noted one ambiguous item in section B, to be reworded for the next sitting.',
    '8': 'Marking followed the memorandum, and moderation was done on a 10% sample as required.',
  },
  'rpl-arpl-monitoring': { notes: 'The RPL/ARPL learner evidence portfolio was complete and the SDP followed its approved RPL policy.' },
  'post-eisa-monitoring': {
    bestPractice: 'Weekly practical mock assessments were introduced after the last sitting.',
    recommendedImprovements: 'Spend more time on the knowledge modules that most learners failed.',
  },
  'marking-guideline-discussion': { notes: 'Markers and moderators worked through the final marking guidelines and agreed the standard for the open questions.' },
  'instrument-validation-visit': { notes: 'The QP presented the instrument and memorandum. Two items were reworded on the day.' },
  'qasa-development-visit': { notes: 'The QP and QCTO worked through the draft QASA components and weights.' },
  'other-meeting': { notes: 'QCTO and the QP agreed the timelines and next steps.' },
};

const CHECKLIST_COMMENT = 'Observed on site — in order.';

const EVIDENCE_FILE_SIZE: Record<VisitEvidenceCategory, number> = { report: 1_048_576, attendance: 312_000, other: 204_800 };

interface PlanInput {
  visitType: VisitType;
  // Empty for an "Other / special meeting", which has a title instead (QCTO feedback 2.5).
  qpId?: string;
  meetingTitle?: string;
  purpose?: string;
  domain?: VisitDomain;
  // Marking & Moderation and Post-EISA Monitoring link to a published sitting (CR-050), which
  // fills the QP, qualification and date; EISA Readiness has neither (QCTO feedback 2.6).
  sitting?: EisaSitting;
  // Batch V1 (05.13): a Marking & Moderation visit with several qualifications, each with its own
  // published sitting. The visit date is then planned by hand (it is not the EISA date).
  sittings?: EisaSitting[];
  // Batch V1 (05.13): an RPL/ARPL visit planned by an official, at an SDP, for these qualifications.
  rplSdpId?: string;
  rplQualifications?: string[];
  visitDate?: string;
  venue: string;
  notificationFlag?: NotificationFlag;
  plannerId: string;
  createdDaysAgo: number;
}

interface VisitSeedBuilder {
  updateDetails: (patch: Partial<Pick<SiteVisit, 'visitDate' | 'venue'>>) => VisitSeedBuilder;
  submitPlan: (atDaysAgo: number, planNote: string) => VisitSeedBuilder;
  plan: (actionId: string, actorId: string, atDaysAgo: number, note?: string) => VisitSeedBuilder;
  execute: (asdId: string, atDaysAgo: number, complete: boolean) => VisitSeedBuilder;
  upload: (category: VisitEvidenceCategory, fileName: string, asdId: string, atDaysAgo: number) => VisitSeedBuilder;
  verifyScripts: (rows: (Omit<ScriptVerificationRow, 'id' | 'qualificationId'> & { qualification?: number })[], overallResult: ScriptVerificationResult) => VisitSeedBuilder;
  approveWithRemediation: (actorId: string, atDaysAgo: number, items: string) => VisitSeedBuilder;
  respondToRemediation: (actorId: string, atDaysAgo: number, response: string, evidenceFileNames: string[]) => VisitSeedBuilder;
  requireFurtherRemediation: (actorId: string, atDaysAgo: number, items: string) => VisitSeedBuilder;
  report: (actionId: string, actorId: string, atDaysAgo: number, note?: string) => VisitSeedBuilder;
  shareWithStakeholder: (actorId: string, atDaysAgo: number, outcomeSummary: string) => VisitSeedBuilder;
  // Batch V2 (QCTO 29.36): the notice sent when the visit was booked, the reminders due by today, the stakeholder's
  // answer, and the ASD moving the visit back through approval.
  sendNotice: () => VisitSeedBuilder;
  remindersSoFar: () => VisitSeedBuilder;
  respondToNotice: (answer: StakeholderAnswer, personId: string, atDaysAgo: number, reason?: string, suggestedDate?: string) => VisitSeedBuilder;
  moveVisit: (actorId: string, atDaysAgo: number, newDate: string, source: VisitDateMove['reasonSource'], reason: string) => VisitSeedBuilder;
  done: () => void;
}

export interface SiteVisitsSeed {
  visits: SiteVisit[];
  results: ResultsBatch[];
}

export function seedSiteVisits(
  log: SeedLog,
  sittings: EisaSitting[],
  registrations: EisaRegistrationRecord[],
  monitoringItems: RplArplMonitoringItem[],
  results: ResultsBatch[],
): SiteVisitsSeed {
  const visits: SiteVisit[] = [];
  let updatedResults = results;
  let n = 0;

  // api.ts newRemediationRound().
  function seedRemediationRound(visit: SiteVisit, items: string, requestedBy: string, requestedById: string, requestedAt: string): RemediationRound {
    return {
      id: `${visit.id}-round-${remediationRoundsOf(visit).length + 1}`,
      round: remediationRoundsOf(visit).length + 1,
      items,
      requestedBy,
      requestedById,
      requestedAt,
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

  // api.ts notifyStakeholder(): a QP or SDP by name, an assessment centre through the ASD.
  function notifyStakeholder(stakeholder: VisitStakeholder, at: string, text: { title: string; body: string }): void {
    if (stakeholder.kind === 'assessment-centre') notify(log, at, { recipientRole: REPORT_SUBMITTER_ROLE, ...text });
    else notify(log, at, { recipientRole: stakeholder.kind, recipientPersonId: stakeholder.id ?? undefined, ...text });
  }

  // api.ts notifyRemediationRequested().
  function notifyRequested(visit: SiteVisit, round: RemediationRound, at: string): void {
    const text = remediationRequestedNotification(visit, round.items, round.round);
    const responder = remediationResponderOf(visit);
    if (responder === 'ASD') {
      notify(log, at, { recipientRole: REPORT_SUBMITTER_ROLE, title: `${text.title} — record the response`, body: `${text.body} Record the response of ${round.sharedWith} on the visit.` });
    } else if (responder === 'SDP') {
      notify(log, at, { recipientRole: 'SDP', recipientPersonId: visit.sdpId ?? undefined, title: text.title, body: `${text.body} (${round.sharedWith}). See Site Visits.` });
    } else {
      notify(log, at, { recipientRole: 'QP', title: text.title, body: `${text.body} (${visit.qpName}). See Visit Outcomes.` });
    }
  }

  function builder(initial: SiteVisit, clock: SeedClock, plannerId: string | null): VisitSeedBuilder {
    let visit = initial;
    const subject = () => visitSubject(visit);
    // The booking step: the notice goes out at that moment, from that person (api.ts sendNotice()).
    let booking: { at: string; actor: Person } | null = null;

    const api: VisitSeedBuilder = {
      // updateVisitDetails(): no audit entry or notification.
      updateDetails(patch) {
        visit = { ...visit, ...patch };
        return api;
      },
      submitPlan(atDaysAgo, planNote) {
        if (!plannerId) throw new Error('Demo seed: this visit skips planning.');
        if (!visit.visitDate) throw new Error(`Demo seed: ${MISSING_VISIT_DATE_MESSAGE}`);
        visit = { ...visit, planNote };
        return api.plan('plan-submit', plannerId, atDaysAgo);
      },
      // performPlanningAction().
      plan(actionId, actorId, atDaysAgo, note) {
        const actor = seedPerson(actorId);
        const at = clock.at(atDaysAgo, 10);
        if (actionId === 'plan-book' && dateOf(at) > visit.visitDate) throw new Error(`Demo seed: "${subject()}" booked after its visit date.`);
        const planningWorkflow = step(log, { definition: PLANNING_WORKFLOW, state: visit.planningWorkflow, actionId, actor, at, recordType: 'site-visit-planning', recordId: visit.id, note });
        visit = { ...visit, planningWorkflow };
        if (planningWorkflow.stageId === 'booked') booking = { at, actor };
        if (actionId === 'plan-submit') {
          notify(log, at, { recipientRole: PLAN_RECOMMENDER_ROLE, title: 'Visit plan awaiting recommendation', body: `"${subject()}" (${visit.visitType}) needs Deputy Director recommendation.` });
        }
        if (actionId === 'plan-recommend') {
          notify(log, at, { recipientRole: PLAN_APPROVER_ROLE, title: 'Visit plan awaiting approval', body: `"${subject()}" (${visit.visitType}) needs Domain Director approval.` });
        }
        if (actionId === 'plan-approve') {
          notify(log, at, { recipientRole: BOOKING_ROLE, title: 'Visit plan awaiting booking', body: `"${subject()}" (${visit.visitType}) needs Sub Domain Admin booking.` });
        }
        if (planningWorkflow.stageId === 'booked') {
          notify(log, at, {
            recipientRole: REPORT_SUBMITTER_ROLE,
            title: bookedVisitNotificationTitle(visit.visitType),
            body: bookedVisitNotificationBody(visit),
          });
        }
        const nextOwner = PLANNING_NEXT_OWNER[actionId];
        if (nextOwner) {
          notify(log, at, {
            recipientRole: nextOwner,
            title: actionId.endsWith('reject') ? 'Visit plan rejected' : 'Visit plan sent back for clarification',
            body: `"${subject()}" (${visit.visitType}): ${note ?? ''}`,
          });
        }
        return api;
      },
      // saveChecklist(), saveFreeTextNotes(), saveCompletionDetails() on the Execution & Report
      // tab — no audit entry. A draft has only the first checklist section and no completion details.
      execute(asdId, atDaysAgo, complete) {
        if (visit.planningWorkflow.stageId !== 'booked' || visit.reportWorkflow.stageId !== 'awaiting-execution') {
          throw new Error(`Demo seed: "${subject()}" can only be executed once booked and awaiting execution.`);
        }
        const asd = seedPerson(asdId);
        if (asd.role !== REPORT_SUBMITTER_ROLE) throw new Error(`Demo seed: ${asd.name} is not the report submitter role.`);
        const at = clock.at(atDaysAgo, 15);
        if (dateOf(at) < visit.visitDate) throw new Error(`Demo seed: "${subject()}" executed before its visit date.`);
        const sections = checklistForType(visit.visitType);
        const notes = NOTES_BY_TYPE[visit.visitType];
        const fieldIds = freeTextFieldsForType(visit.visitType).map((f) => f.id);
        visit = {
          ...visit,
          checklist: answerChecklist(sections, CHECKLIST_COMMENT, complete || sections.length === 0 ? {} : { onlySectionIds: [sections[0].id] }),
          freeTextNotes: complete ? Object.fromEntries(fieldIds.map((id) => [id, notes[id] ?? ''])) : {},
          completedBy: complete ? asd.name : '',
          completedDate: complete ? visit.visitDate : '',
        };
        return api;
      },
      // uploadEvidence() on the Execution & Report tab — no audit entry, only while the report is editable.
      upload(category, fileName, asdId, atDaysAgo) {
        if (visit.planningWorkflow.stageId !== 'booked' || visit.reportWorkflow.stageId !== 'awaiting-execution') {
          throw new Error(`Demo seed: evidence for "${subject()}" can only be uploaded while the report is being completed.`);
        }
        const asd = seedPerson(asdId);
        if (asd.role !== REPORT_SUBMITTER_ROLE) throw new Error(`Demo seed: ${asd.name} is not the report submitter role.`);
        const uploadedAt = clock.at(atDaysAgo, 16);
        visit = { ...visit, evidence: [...evidenceOf(visit), { fileName, fileSize: EVIDENCE_FILE_SIZE[category], uploadedAt, uploadedBy: asd.name, category }] };
        return api;
      },
      // saveScriptVerification() on the Execution & Report tab (QCTO feedback 3.7) — no audit entry.
      verifyScripts(rows, overallResult) {
        if (!visitHasScriptVerification(visit.visitType)) throw new Error(`Demo seed: "${subject()}" has no script verification.`);
        if (visit.reportWorkflow.stageId !== 'awaiting-execution') throw new Error(`Demo seed: script verification for "${subject()}" can only be changed while the report is being completed.`);
        // Batch V1: each script belongs to one of the visit's qualifications (by position in the list).
        const list = visit.qualifications ?? [];
        visit = {
          ...visit,
          scriptVerification: {
            rows: rows.map(({ qualification, ...r }, i) => ({ ...r, qualificationId: list[qualification ?? 0]?.id, id: `${visit.id}-script-${i + 1}` })),
            overallResult,
          },
        };
        return api;
      },
      // Batch V1 (05.14): performReportAction('report-approve-remediation') — round 1, the report and
      // items shared with the stakeholder automatically, the stakeholder (or the ASD) notified.
      approveWithRemediation(actorId, atDaysAgo, items) {
        const actor = seedPerson(actorId);
        const at = clock.at(atDaysAgo, 14);
        if (!remediationStakeholderName(visit)) throw new Error(`Demo seed: "${subject()}" has nobody to send remediation to.`);
        const reportWorkflow = step(log, { definition: REPORT_WORKFLOW, state: visit.reportWorkflow, actionId: 'report-approve-remediation', actor, at, recordType: 'site-visit-report', recordId: visit.id, note: items });
        const round = seedRemediationRound(visit, items, actor.name, actor.id, at);
        visit = { ...visit, reportWorkflow, remediationRounds: [...remediationRoundsOf(visit), round] };
        if (visitShareRecipientOf(visit) && !isSharedWithStakeholder(visit)) {
          visit = {
            ...visit,
            stakeholderShare: { shared: true, outcomeSummary: 'Approved with remediation. The remediation items are listed with this report.', changedAt: at, changedBy: actor.name, changedById: actor.id },
          };
        }
        audit(log, { recordType: 'site-visit-report', recordId: visit.id, actor, action: `Report and remediation items shared with ${round.sharedWith}`, note: items, timestamp: at });
        notify(log, at, { recipientRole: REPORT_SUBMITTER_ROLE, title: 'Report approved with remediation', body: `Your report for "${subject()}" was approved with remediation.` });
        notifyRequested(visit, round, at);
        return api;
      },
      // addRemediationEvidence() for each file, then performReportAction('remediation-submit').
      respondToRemediation(actorId, atDaysAgo, response, evidenceFileNames) {
        const actor = seedPerson(actorId);
        const round = openRemediationRound(visit);
        if (!round || visit.reportWorkflow.stageId !== 'remediation-awaiting') throw new Error(`Demo seed: "${subject()}" is not waiting for a remediation response.`);
        const responder = remediationResponderOf(visit);
        const expected = responder === 'ASD' ? REPORT_SUBMITTER_ROLE : responder;
        if (actor.role !== expected || (responder === 'QP' && actor.id !== visit.qpId) || (responder === 'SDP' && actor.id !== visit.sdpId)) throw new Error(`Demo seed: ${actor.name} cannot respond to the remediation of "${subject()}".`);
        if (!response.trim()) throw new Error('Demo seed: a remediation response needs text.');
        const evidence = evidenceFileNames.map((fileName, i) => ({ fileName, fileSize: 262_144 + i * 1024, uploadedAt: clock.at(atDaysAgo, 11), uploadedBy: actor.name }));
        for (const f of evidence) {
          audit(log, { recordType: 'site-visit-report', recordId: visit.id, actor, action: `Remediation evidence added (round ${round.round})`, note: f.fileName, timestamp: f.uploadedAt });
        }
        const at = clock.at(atDaysAgo, 14);
        const reportWorkflow = step(log, { definition: REPORT_WORKFLOW, state: visit.reportWorkflow, actionId: 'remediation-submit', actor, at, recordType: 'site-visit-report', recordId: visit.id, note: response });
        visit = {
          ...visit,
          reportWorkflow,
          remediationRounds: remediationRoundsOf(visit).map((r) =>
            r.id === round.id ? { ...r, evidence, response, submittedBy: actor.name, submittedById: actor.id, submittedByRole: actor.role === 'QP' ? 'QP' : actor.role === 'SDP' ? 'SDP' : 'ASD', submittedAt: at } : r,
          ),
        };
        const text = remediationSubmittedNotification(visit);
        notify(log, at, { recipientRole: REPORT_APPROVER_ROLE, title: text.title, body: text.body });
        return api;
      },
      // performReportAction('remediation-further'): closes the round and opens the next one.
      requireFurtherRemediation(actorId, atDaysAgo, items) {
        const actor = seedPerson(actorId);
        const round = openRemediationRound(visit);
        if (!round || visit.reportWorkflow.stageId !== 'remediation-review') throw new Error(`Demo seed: "${subject()}" has no submitted remediation to review.`);
        const at = clock.at(atDaysAgo, 14);
        const reportWorkflow = step(log, { definition: REPORT_WORKFLOW, state: visit.reportWorkflow, actionId: 'remediation-further', actor, at, recordType: 'site-visit-report', recordId: visit.id, note: items });
        const next = seedRemediationRound(visit, items, actor.name, actor.id, at);
        visit = {
          ...visit,
          reportWorkflow,
          remediationRounds: [
            ...remediationRoundsOf(visit).map((r) => (r.id === round.id ? { ...r, review: { decision: 'further-remediation' as const, reviewedBy: actor.name, reviewedById: actor.id, reviewedAt: at } } : r)),
            next,
          ],
        };
        notifyRequested(visit, next, at);
        return api;
      },
      // setStakeholderShare() with shared = true.
      shareWithStakeholder(actorId, atDaysAgo, outcomeSummary) {
        const actor = seedPerson(actorId);
        if (actor.role !== STAKEHOLDER_SHARE_ROLE) throw new Error(`Demo seed: ${actor.name} cannot choose whether a report is shared.`);
        if (!visitCanBeShared(visit)) throw new Error(`Demo seed: "${subject()}" cannot be shared yet.`);
        if (isSharedWithStakeholder(visit)) throw new Error(`Demo seed: "${subject()}" is already shared.`);
        if (!outcomeSummary.trim()) throw new Error('Demo seed: a shared report needs an outcome summary.');
        const at = clock.at(atDaysAgo, 15);
        visit = { ...visit, stakeholderShare: { shared: true, outcomeSummary, changedAt: at, changedBy: actor.name, changedById: actor.id } };
        audit(log, { recordType: 'site-visit-report', recordId: visit.id, actor, action: `Report shared with the QP (${visit.qpName})`, note: outcomeSummary, timestamp: at });
        notify(log, at, { recipientRole: 'QP', title: 'Visit outcome shared', body: `QCTO has shared the outcome of the visit for "${subject()}" (${visit.qpName}). See Visit Outcomes.` });
        return api;
      },
      // performReportAction() (no re-route is seeded).
      report(actionId, actorId, atDaysAgo, note) {
        if (actionId === 'report-submit') {
          if (!isChecklistComplete(visit.checklist, true)) throw new Error('Demo seed: every checklist line needs an answer and a comment before submitting the report.');
          if (!visit.completedBy.trim() || !visit.completedDate) throw new Error('Demo seed: complete "Completed By" and "Completion Date" before submitting.');
          if (!hasVisitReportFile(visit)) throw new Error(`Demo seed: ${MISSING_VISIT_REPORT_MESSAGE}`);
          const scriptIssue = getScriptVerificationIssues(visit)[0];
          if (scriptIssue) throw new Error(`Demo seed: ${scriptIssue.message}`);
        }
        const actor = seedPerson(actorId);
        const at = clock.at(atDaysAgo, 14);
        const reportWorkflow = step(log, { definition: REPORT_WORKFLOW, state: visit.reportWorkflow, actionId, actor, at, recordType: 'site-visit-report', recordId: visit.id, note });
        visit = { ...visit, reportWorkflow };
        if (actionId === 'report-submit') {
          notify(log, at, { recipientRole: REPORT_APPROVER_ROLE, title: 'Site visit report submitted', body: `"${subject()}" (${visit.visitType}) is awaiting your review.` });
        }
        if (actionId === 'report-approve') {
          notify(log, at, { recipientRole: REPORT_SUBMITTER_ROLE, title: 'Report approved', body: `Your report for "${subject()}" was approved.` });
        }
        if (actionId === 'report-send-back') {
          notify(log, at, { recipientRole: REPORT_SUBMITTER_ROLE, title: 'Report sent back for clarification', body: note ?? '' });
        }
        if (actionId === 'report-reject') {
          notify(log, at, { recipientRole: REPORT_SUBMITTER_ROLE, title: 'Report rejected', body: note ?? '' });
        }
        if (actionId === 'share-visit-outcome') {
          // "Complete Visit": closes the visit straight away (no QP acknowledgement) and does not
          // notify the QP — that only happens through shareWithStakeholder().
          visit = { ...visit, reportWorkflow: { ...reportWorkflow, stageId: 'closed' } };
          audit(log, { recordType: 'site-visit-report', recordId: visit.id, actor, action: 'Visit completed', timestamp: at });
          if (visit.visitType === 'post-eisa-monitoring') {
            if (visit.sdpName) {
              notify(log, at, { recipientRole: 'SDP', title: 'Post-EISA Monitoring outcome shared', body: `The visit outcome for "${subject()}" (${visit.sdpName}) has been shared.` });
            }
            audit(log, {
              recordType: 'site-visit-report',
              recordId: visit.id,
              actor,
              action: 'Shared the Post-EISA Monitoring report with Quality Assurance and Accreditation',
              timestamp: at,
            });
          }
        }
        return api;
      },
      // api.ts sendNotice(), run when the visit was booked: the stakeholder (the ASD, for an assessment centre) is told.
      sendNotice() {
        const stakeholder = visitStakeholderOf(visit);
        if (!booking || !stakeholder || !visitNeedsNotice(visit)) throw new Error(`Demo seed: "${subject()}" has no notice to send (it must be booked, notified, dated and have a stakeholder).`);
        notifyStakeholder(stakeholder, booking.at, visitNoticeNotification(visit, stakeholder.kind === 'assessment-centre', stakeholder.name));
        audit(log, {
          recordType: 'site-visit-planning',
          recordId: visit.id,
          actor: booking.actor,
          action: `Visit notice sent to ${stakeholder.name} (${stakeholder.kind === 'assessment-centre' ? 'assessment centre' : stakeholder.kind})`,
          note: `Visit date ${visit.visitDate}`,
          timestamp: booking.at,
        });
        visit = { ...visit, stakeholderNotice: { sentAt: booking.at, sentTo: stakeholder.kind, sentToName: stakeholder.name }, stakeholderResponse: undefined, reminders: [] };
        return api;
      },
      // api.ts syncStakeholderReminders(): every reminder due by today, with the same dates and counts, so
      // the first load of the app finds nothing more to send.
      remindersSoFar() {
        const stakeholder = visitStakeholderOf(visit);
        if (!stakeholder || !visit.stakeholderNotice) throw new Error(`Demo seed: "${subject()}" has no notice, so no reminders.`);
        const due = remindersDueBy(visit, todayIso());
        const fresh = due.map((date, i) => ({ number: i + 1, sentAt: new Date(Math.min(Date.parse(`${date}T07:00:00Z`), Date.now())).toISOString() }));
        for (const reminder of fresh) {
          notifyStakeholder(stakeholder, reminder.sentAt, visitReminderNotification(visit, stakeholder.kind === 'assessment-centre', stakeholder.name, reminder.number));
          log.audit.push({
            id: crypto.randomUUID(),
            recordType: 'site-visit-planning',
            recordId: visit.id,
            actorRole: REPORT_SUBMITTER_ROLE,
            actorId: 'system',
            actorName: 'System (reminder)',
            action: `Reminder ${reminder.number} sent to ${stakeholder.name}`,
            note: `No response to the visit date ${visit.visitDate} yet.`,
            timestamp: reminder.sentAt,
          });
        }
        visit = { ...visit, reminders: fresh };
        return api;
      },
      // api.ts respondToVisitNotice().
      respondToNotice(answer, personId, atDaysAgo, reason = '', suggestedDate = '') {
        const actor = seedPerson(personId);
        const stakeholder = visitStakeholderOf(visit);
        if (!stakeholder || !visit.stakeholderNotice || visit.stakeholderResponse) throw new Error(`Demo seed: "${subject()}" has no open notice to respond to.`);
        if (stakeholder.id !== actor.id) throw new Error(`Demo seed: ${actor.name} is not the stakeholder of "${subject()}".`);
        if (answer === 'not-available' && !reason.trim()) throw new Error('Demo seed: "not available" needs a reason.');
        const at = clock.at(atDaysAgo, 11);
        if (at <= visit.stakeholderNotice.sentAt) throw new Error(`Demo seed: the answer to "${subject()}" is dated before its notice.`);
        visit = {
          ...visit,
          stakeholderResponse: {
            answer,
            reason: answer === 'accepted' ? '' : reason,
            suggestedDate: answer === 'accepted' ? '' : suggestedDate,
            respondedBy: actor.name,
            respondedById: actor.id,
            respondedByRole: actor.role === 'QP' ? 'QP' : 'SDP',
            respondedAt: at,
          },
        };
        audit(log, {
          recordType: 'site-visit-planning',
          recordId: visit.id,
          actor,
          action: answer === 'accepted' ? `Accepted the visit date (${visit.visitDate})` : `Not available on ${visit.visitDate}`,
          note: answer === 'accepted' ? undefined : `${reason}${suggestedDate ? ` Suggested date: ${suggestedDate}.` : ''}`,
          timestamp: at,
        });
        const text = visitResponseNotification(visit, answer, stakeholder.name, reason, suggestedDate);
        notify(log, at, { recipientRole: REPORT_SUBMITTER_ROLE, ...text });
        notify(log, at, { recipientRole: PLAN_RECOMMENDER_ROLE, ...text });
        return api;
      },
      // api.ts performPlanningAction('plan-move'): back to Deputy Director recommendation with the new date.
      moveVisit(actorId, atDaysAgo, newDate, source, reason) {
        const actor = seedPerson(actorId);
        const at = clock.at(atDaysAgo, 12);
        if (visit.reportWorkflow.stageId !== 'awaiting-execution') throw new Error(`Demo seed: "${subject()}" can only be moved before it is carried out.`);
        if (source === 'stakeholder-not-available' && visit.stakeholderResponse?.answer !== 'not-available') throw new Error(`Demo seed: the stakeholder of "${subject()}" did not say they are not available.`);
        if (!newDate || newDate === visit.visitDate || newDate < todayIso()) throw new Error(`Demo seed: "${subject()}" needs a different, future date to move to.`);
        const sourceLabel = source === 'stakeholder-not-available' ? 'Stakeholder not available' : 'QCTO decision';
        const planningWorkflow = step(log, {
          definition: PLANNING_WORKFLOW,
          state: visit.planningWorkflow,
          actionId: 'plan-move',
          actor,
          at,
          recordType: 'site-visit-planning',
          recordId: visit.id,
          note: `From ${visit.visitDate} to ${newDate}. ${sourceLabel}: ${reason}`,
        });
        const move: VisitDateMove = {
          id: `${visit.id}-move-${(visit.dateMoves ?? []).length + 1}`,
          fromDate: visit.visitDate,
          toDate: newDate,
          reason,
          reasonSource: source,
          movedBy: actor.name,
          movedById: actor.id,
          movedAt: at,
          previousNotice: visit.stakeholderNotice ?? null,
          previousResponse: visit.stakeholderResponse ?? null,
          previousReminders: visit.reminders?.length ?? 0,
        };
        const fromDate = visit.visitDate;
        visit = { ...visit, planningWorkflow, visitDate: newDate, dateMoves: [...(visit.dateMoves ?? []), move], stakeholderNotice: undefined, stakeholderResponse: undefined, reminders: undefined };
        notify(log, at, { recipientRole: PLAN_RECOMMENDER_ROLE, ...visitMovedNotification(visit, fromDate, reason) });
        return api;
      },
      done() {
        visits.push(visit);
      },
    };
    return api;
  }

  // createVisit(), as the "Plan a New Visit" dialog calls it.
  function planVisit(input: PlanInput): VisitSeedBuilder {
    const clock = createClock();
    const planner = seedPerson(input.plannerId);
    if (planner.role !== PLANNER_ROLE) throw new Error(`Demo seed: ${planner.name} is not the planner role.`);
    if (visitHasQp(input.visitType) !== !!input.qpId) throw new Error(`Demo seed: a ${input.visitType} visit ${input.qpId ? 'cannot have' : 'needs'} a QP.`);
    const qp = input.qpId ? seedPerson(input.qpId) : null;
    const perQualification = isPerQualificationVisit(input.visitType);
    const sittingList = input.sittings ?? (input.sitting ? [input.sitting] : []);
    const isRpl = input.visitType === 'rpl-arpl-monitoring';
    if (isRpl) {
      if (!input.rplSdpId || !input.rplQualifications?.length || sittingList.length > 0) throw new Error('Demo seed: an RPL/ARPL visit needs an SDP and qualifications, and has no sitting.');
    } else if (perQualification !== (sittingList.length > 0)) {
      throw new Error(`Demo seed: a ${input.visitType} visit ${perQualification ? 'needs' : 'cannot have'} a sitting link here.`);
    }
    if (input.sitting && input.sitting.qpId !== input.qpId) throw new Error('Demo seed: the sitting belongs to another QP.');
    const rplSdp = isRpl ? SDP_DIRECTORY.find((d) => d.sdpId === input.rplSdpId) : undefined;
    if (isRpl && !rplSdp) throw new Error(`Demo seed: no SDP ${input.rplSdpId}.`);
    const visitId = seedId(VISIT_ID_GROUP, ++n);
    // Batch V1 (05.13): createVisit() list for Marking & Moderation and RPL/ARPL.
    let qualifications: VisitQualification[] | undefined;
    if (isMultiQualificationVisit(input.visitType)) {
      qualifications = isRpl
        ? (input.rplQualifications ?? []).map((title, i) => ({ id: `${visitId}-q${i + 1}`, qualificationTitle: title, saqaId: saqaIdForQualification(title), sittingId: null, eisaDate: '' }))
        : sittingList.map((sitting, i) => ({ id: `${visitId}-q${i + 1}`, qualificationTitle: sitting.qualificationTitle, saqaId: qualificationIdOf(sitting), sittingId: sitting.id, eisaDate: sitting.date }));
      const issue = qualificationListIssues(input.visitType, qualifications)[0];
      if (issue) throw new Error(`Demo seed: ${issue}`);
    }
    // createVisit(), QCTO feedback 2.5.
    if (visitIsMeeting(input.visitType) !== !!input.meetingTitle?.trim()) throw new Error('Demo seed: only a special meeting has a title, and it needs one.');
    if (visitHasPurpose(input.visitType) !== !!input.purpose?.trim()) throw new Error(`Demo seed: a ${input.visitType} visit ${input.purpose ? 'has no' : 'needs a'} purpose.`);
    const notificationFlag = input.notificationFlag ?? 'notified';
    const visit: SiteVisit = {
      id: visitId,
      visitType: input.visitType,
      domain: input.domain ?? DEFAULT_VISIT_DOMAIN,
      meetingTitle: input.meetingTitle,
      purpose: input.purpose,
      qpId: qp?.id ?? '',
      qpName: qp?.name ?? '',
      qualificationTitle: qualifications?.[0]?.qualificationTitle ?? sittingList[0]?.qualificationTitle ?? '',
      qualifications,
      // A2: Readiness and Marking & Moderation have no SDP; an RPL/ARPL visit planned here is held at one.
      sdpId: rplSdp?.sdpId ?? null,
      sdpName: rplSdp?.name ?? null,
      assessmentCentreName: isRpl ? null : undefined,
      sittingId: sittingList[0]?.id ?? null,
      visitDate: input.sittings ? (input.visitDate ?? '') : (input.sitting?.date ?? input.visitDate ?? ''),
      venue: input.venue,
      notificationFlag,
      noticeLeadTimeDays: notificationFlag === 'notified' ? DEFAULT_NOTICE_LEAD_TIME_DAYS : null,
      planNote: '',
      planningWorkflow: { stageId: 'ad-planning' },
      reportWorkflow: { stageId: 'awaiting-execution' },
      reroutedToId: null,
      reroutedToName: null,
      checklist: checklistForType(input.visitType),
      freeTextNotes: {},
      facilitatorAnswers: {},
      learnerAnswers: {},
      completedBy: '',
      completedDate: '',
      sourceRegistrationId: null,
      sourceMonitoringItemId: null,
      learnerNames: [],
      createdBy: planner.name,
      createdAt: clock.at(input.createdDaysAgo, 9),
    };
    if (!visit.visitDate) throw new Error('Demo seed: a visit needs a date.');
    if (visitHasSdp(input.visitType) && !isRpl) throw new Error('Demo seed: Post-EISA visits come from a results batch here.');
    return builder(visit, clock, planner.id);
  }

  // approval-of-results/api.ts ensurePemVisitForBatch(), run automatically by the Chief
  // Director's final approval (QCTO feedback 2.8). That function is async and stamps a random id
  // and today's time, so the seed builds the same record (createVisit's fields with no date, the
  // "results approved" flag set, pemVisitId on the batch, an audit entry on the visit and on the
  // batch, and the planner's notification) with a seed id, at the moment of final approval.
  function autoPemVisitForBatch(batchId: string, chiefDirectorId: string): VisitSeedBuilder {
    const batch = updatedResults.find((b) => b.id === batchId);
    if (!batch) throw new Error(`Demo seed: results batch ${batchId} missing — Post-EISA Monitoring needs the Approval of Results seed.`);
    if (batch.workflow.stageId !== 'approved' || !batch.recommendation) throw new Error('Demo seed: only an approved results batch can trigger a Post-EISA Monitoring visit.');
    if (batch.pemVisitId) throw new Error('Demo seed: a Post-EISA Monitoring visit has already been created for this batch.');
    if (!isBelowPostEisaThreshold(batch)) {
      throw new Error(`Demo seed: a Post-EISA Monitoring visit is only created below ${POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT}%.`);
    }
    const actor = seedPerson(chiefDirectorId);
    if (actor.role !== 'Chief Director' || actor.name !== batch.recommendation.recommendedBy) {
      throw new Error('Demo seed: the visit is created by the Chief Director who gave final approval.');
    }
    const clock = createClock();
    const createdAt = batch.recommendation.recommendedAt;
    const rate = competencyRatePercent(batch);
    const visit: SiteVisit = {
      id: seedId(VISIT_ID_GROUP, ++n),
      visitType: 'post-eisa-monitoring',
      qpId: batch.qpId,
      qpName: batch.qpName,
      qualificationTitle: batch.qualificationTitle,
      sdpId: null,
      sdpName: null,
      sittingId: batch.sittingId,
      visitDate: '',
      venue: '',
      notificationFlag: 'notified',
      noticeLeadTimeDays: DEFAULT_NOTICE_LEAD_TIME_DAYS,
      planNote: '',
      planningWorkflow: { stageId: 'ad-planning' },
      reportWorkflow: { stageId: 'awaiting-execution' },
      reroutedToId: null,
      reroutedToName: null,
      checklist: checklistForType('post-eisa-monitoring'),
      freeTextNotes: {},
      facilitatorAnswers: {},
      learnerAnswers: {},
      completedBy: '',
      completedDate: '',
      sourceRegistrationId: null,
      sourceMonitoringItemId: null,
      learnerNames: [],
      createdBy: actor.name,
      createdAt,
    };
    updatedResults = updatedResults.map((b) => (b.id === batch.id ? { ...b, pemVisitId: visit.id } : b));
    audit(log, {
      recordType: 'site-visit-planning',
      recordId: visit.id,
      actor,
      action: `Created automatically: results batch approved with a ${rate}% competency rate (below ${POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT}%). To be scheduled.`,
      timestamp: createdAt,
    });
    notify(log, createdAt, {
      recipientRole: PLANNER_ROLE,
      title: 'Post-EISA Monitoring visit to be scheduled',
      body: `"${batch.qualificationTitle}" (EISA date ${batch.sittingDate}) had a ${rate}% competency rate. Pick a date for the Post-EISA Monitoring visit in Site Visits & Monitoring.`,
    });
    audit(log, { recordType: 'results-batch', recordId: batch.id, actor, action: 'Post-EISA Monitoring visit created — waiting for a date', timestamp: createdAt });
    // The planning chain starts with the ASD (whoever picks the date), so the
    // seed itself never submits this plan.
    return builder(visit, clock, null);
  }

  // api.ts buildAutoCreatedVisit(): the RPL/ARPL visit syncAutoCreatedVisits() makes from a
  // monitoring item — already booked, held at the registering SDP, with no QP, no sitting link
  // and no date (QCTO feedback 2.7; the officials set the date and venue on the Details tab).
  // Seeded with the item's id as sourceMonitoringItemId so the sync does not create it a second time.
  function autoRplVisit(registrationSdpId: string, sittingDate: string): VisitSeedBuilder {
    const registration = registrations.find((r) => r.sdpId === registrationSdpId && r.sittingDate === sittingDate && r.rplMonitoringItemId);
    const item = monitoringItems.find((i) => i.id === registration?.rplMonitoringItemId);
    if (!registration || !item) throw new Error(`Demo seed: no RPL/ARPL monitoring item for ${registrationSdpId} ${sittingDate}.`);
    const clock = createClock();
    const visit: SiteVisit = {
      id: seedId(VISIT_ID_GROUP, ++n),
      visitType: 'rpl-arpl-monitoring',
      qpId: '',
      qpName: '',
      qualificationTitle: item.qualificationTitle,
      qualifications: [{ id: `${seedId(VISIT_ID_GROUP, n)}-q1`, qualificationTitle: item.qualificationTitle, saqaId: saqaIdForQualification(item.qualificationTitle), sittingId: null, eisaDate: '' }],
      sdpId: item.sdpId,
      sdpName: item.sdpName,
      assessmentCentreName: null,
      sittingId: null,
      visitDate: '',
      venue: '',
      notificationFlag: 'notified',
      noticeLeadTimeDays: DEFAULT_NOTICE_LEAD_TIME_DAYS,
      planNote: 'Automatically created from an RPL/ARPL-flagged Learner EISA Registration.',
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
    return builder(visit, clock, null);
  }

  // SV1 — Readiness for Nomvula Dlamini: plan submitted, waiting for the Deputy Director.
  planVisit({ visitType: 'eisa-readiness', qpId: NOMVULA, visitDate: workingDateFromToday(30), venue: 'QP offices, Midrand', plannerId: LINDIWE, createdDaysAgo: 6 })
    .submitPlan(5, 'Readiness session ahead of the next Electrical Trades sittings: assessor appointments, venue list and the EISA day plan.')
    .done();

  // SV2 — Marking & Moderation, Electrical Trades sitting at today + 35: with the Domain Director.
  planVisit({ visitType: 'marking-moderation', qpId: NOMVULA, sitting: sittingAt(sittings, 'Electrical Trades', 35), venue: 'Marking centre, Germiston', plannerId: LINDIWE, createdDaysAgo: 12 })
    .submitPlan(11, 'Monitor the marking and moderation sessions and verify a sample of marked and moderated scripts.')
    .plan('plan-recommend', GRACE, 7)
    .done();

  // SV3 — Post-EISA Monitoring from the Welding 40% batch (sitting today - 150): created
  // automatically by the Chief Director's final approval, no date yet ("To be scheduled").
  autoPemVisitForBatch(RESULTS_SEED_IDS.belowThresholdWelding, FRANCOIS).done();

  // SV4 — RPL/ARPL monitoring at Thabo Technical College, from its Electrical Trades
  // registration (G6): booked, awaiting execution. Dated by the officials, not by the sitting.
  autoRplVisit('sdp-thabo-technical-college', workingDateFromToday(35))
    .updateDetails({ visitDate: workingDateFromToday(20), venue: 'Thabo Technical College, Pretoria' })
    .done();

  // SV5 — Marking & Moderation, Electrical Trades sitting at today - 15: booked, report in draft.
  planVisit({ visitType: 'marking-moderation', qpId: NOMVULA, sitting: sittingAt(sittings, 'Electrical Trades', -15), venue: 'Marking centre, Germiston', plannerId: RIAAN, createdDaysAgo: 45 })
    .submitPlan(44, 'Monitor the marking session and verify a sample of scripts.')
    .plan('plan-recommend', PETER, 41)
    .plan('plan-approve', NOKUTHULA, 38)
    .plan('plan-book', KATLEGO, 35)
    .execute(SIPHO, 2, false)
    .upload('attendance', 'Marking_Session_Attendance_Register.pdf', SIPHO, 2)
    .done();

  // SV6 — Readiness for Precious Mahlangu (today - 10): report submitted, with the Deputy Director.
  planVisit({ visitType: 'eisa-readiness', qpId: PRECIOUS, visitDate: workingDateFromToday(-10), venue: 'QP offices, Vanderbijlpark', plannerId: LINDIWE, createdDaysAgo: 40 })
    .submitPlan(39, 'Readiness session for the Welding sittings later this year.')
    .plan('plan-recommend', PETER, 36)
    .plan('plan-approve', MICHAEL, 33)
    .plan('plan-book', KARABO, 30)
    .execute(THANDEKA, 6, true)
    .upload('report', 'EISA_Readiness_Visit_Report.pdf', THANDEKA, 6)
    .report('report-submit', THANDEKA, 3)
    .done();

  // SV7 — Marking & Moderation, Welding sitting at today - 45: report approved, outcome not yet shared.
  planVisit({ visitType: 'marking-moderation', qpId: PRECIOUS, sitting: sittingAt(sittings, 'Welding', -45), venue: 'Marking centre, Vanderbijlpark', plannerId: LINDIWE, createdDaysAgo: 80 })
    .submitPlan(79, 'Monitor the marking session and verify a sample of marked and moderated scripts.')
    .plan('plan-recommend', PETER, 76)
    .plan('plan-approve', MICHAEL, 72)
    .plan('plan-book', KARABO, 70)
    .execute(THANDEKA, 42, true)
    .upload('report', 'Marking_Moderation_Visit_Report_Welding.pdf', THANDEKA, 42)
    .verifyScripts(
      [
        { scriptReference: 'WLD-2026-014', component: 'Knowledge (written)', markedOutcome: '68%', moderatedFinding: 'agree', comment: 'Marks and totals confirmed.' },
        { scriptReference: 'WLD-2026-022', component: 'Knowledge (written)', markedOutcome: '51%', moderatedFinding: 'agree', comment: '' },
        { scriptReference: 'WLD-2026-037', component: 'Practical', markedOutcome: 'Competent', moderatedFinding: 'disagree', comment: 'Two rubric criteria not evidenced; moderator changed the outcome to Not yet competent.' },
        { scriptReference: 'WLD-2026-041', component: 'Practical', markedOutcome: 'Not yet competent', moderatedFinding: 'agree', comment: '' },
      ],
      'verified-with-findings',
    )
    .report('report-submit', THANDEKA, 41)
    .report('report-approve', PETER, 38)
    .done();

  // SV8 — RPL/ARPL monitoring at Lerato Training Institute, from its Plumbing registration
  // (P5, sitting today - 75): outcome shared, so the visit is completed (QCTO feedback 2.12).
  autoRplVisit('sdp-lerato-training-institute', workingDateFromToday(-75))
    .updateDetails({ visitDate: workingDateFromToday(-80), venue: 'Lerato Training Institute, Durban' })
    .execute(SIPHO, 72, true)
    .upload('report', 'RPL_ARPL_Monitoring_Visit_Report_Lerato.pdf', SIPHO, 72)
    .report('report-submit', SIPHO, 70)
    .report('report-approve', GRACE, 66)
    .report('share-visit-outcome', GRACE, 64)
    .done();

  // SV9 — Readiness for Johan van der Merwe (today - 20): report sent back for clarification.
  planVisit({ visitType: 'eisa-readiness', qpId: JOHAN, visitDate: workingDateFromToday(-20), venue: 'QP offices, Bloemfontein', plannerId: RIAAN, createdDaysAgo: 50 })
    .submitPlan(49, 'Readiness session for the Plumbing sittings.')
    .plan('plan-recommend', GRACE, 46)
    .plan('plan-approve', NOKUTHULA, 43)
    .plan('plan-book', KATLEGO, 41)
    .execute(SIPHO, 16, true)
    .upload('report', 'EISA_Readiness_Visit_Report_Bloemfontein.pdf', SIPHO, 16)
    .report('report-submit', SIPHO, 14)
    .report(
      'report-send-back',
      GRACE,
      10,
      'The notes say no readiness concerns remain, but the venue list for the Bloemfontein centre was still outstanding. Confirm whether it was received.',
    )
    .done();

  // SV10 — Readiness for Johan van der Merwe (today + 10): rejected by the Domain Director.
  planVisit({ visitType: 'eisa-readiness', qpId: JOHAN, visitDate: workingDateFromToday(10), venue: 'QP offices, Bloemfontein', plannerId: RIAAN, createdDaysAgo: 28 })
    .submitPlan(27, 'Follow-up readiness session for the Plumbing sittings.')
    .plan('plan-recommend', GRACE, 24)
    .plan(
      'plan-domain-director-reject',
      NOKUTHULA,
      22,
      'A readiness session with this QP was held recently. Plan a follow-up only once that report is approved and shows open issues.',
    )
    .done();

  // SV11 — Marking & Moderation, Plumbing sitting at today - 75: outcome shared, so the visit is
  // completed and the QP notified (QCTO feedback 2.12 — no QP acknowledgement step any more).
  planVisit({ visitType: 'marking-moderation', qpId: JOHAN, sitting: sittingAt(sittings, 'Plumbing', -75), venue: 'Marking centre, Bloemfontein', plannerId: RIAAN, createdDaysAgo: 105 })
    .submitPlan(104, 'Monitor the marking session and verify a sample of marked and moderated scripts.')
    .plan('plan-recommend', GRACE, 101)
    .plan('plan-approve', NOKUTHULA, 98)
    .plan('plan-book', KATLEGO, 95)
    .execute(SIPHO, 72, true)
    .upload('report', 'Marking_Moderation_Visit_Report_Plumbing.pdf', SIPHO, 72)
    .verifyScripts(
      [
        { scriptReference: 'PLB-2026-003', component: 'Knowledge (written)', markedOutcome: '74%', moderatedFinding: 'agree', comment: '' },
        { scriptReference: 'PLB-2026-011', component: 'Practical', markedOutcome: 'Competent', moderatedFinding: 'agree', comment: '' },
      ],
      'verified',
    )
    .report('report-submit', SIPHO, 71)
    .report('report-approve', GRACE, 68)
    .report('share-visit-outcome', GRACE, 66)
    .done();

  // SV12 — Marking & Moderation, Welding sitting at today + 55: plan sent back to the planner.
  planVisit({ visitType: 'marking-moderation', qpId: PRECIOUS, sitting: sittingAt(sittings, 'Welding', 55), venue: 'To be confirmed', plannerId: RIAAN, createdDaysAgo: 10 })
    .submitPlan(9, 'Monitor the marking session and verify a sample of marked and moderated scripts.')
    .plan('plan-dd-send-back', PETER, 6, 'The venue is still "To be confirmed". Add the marking centre the QP has booked and resubmit.')
    .done();

  // SV13 — Marking guideline discussion with Nomvula Dlamini (today + 15): with the Domain Director.
  planVisit({
    visitType: 'marking-guideline-discussion',
    qpId: NOMVULA,
    purpose: 'Discuss the final marking guidelines for the Electrical Trades written component with the appointed markers and moderators.',
    visitDate: workingDateFromToday(15),
    venue: 'Virtual (MS Teams)',
    plannerId: LINDIWE,
    createdDaysAgo: 9,
  })
    .submitPlan(8, 'Attend the marking guideline discussion before marking starts.')
    .plan('plan-recommend', GRACE, 5)
    .done();

  // SV14 — Instrument validation visit with Nomvula Dlamini (today - 12): report approved, and
  // shared with the QP (one of her two shared outcomes).
  planVisit({
    visitType: 'instrument-validation-visit',
    qpId: NOMVULA,
    purpose: 'Validate the revised Electrical Trades practical instrument and rubric with the QP.',
    visitDate: workingDateFromToday(-12),
    venue: 'QP offices, Midrand',
    plannerId: RIAAN,
    createdDaysAgo: 40,
  })
    .submitPlan(39, 'On-site validation of the revised practical instrument.')
    .plan('plan-recommend', GRACE, 37)
    .plan('plan-approve', MICHAEL, 35)
    .plan('plan-book', KARABO, 33)
    .execute(SIPHO, 7, true)
    .upload('report', 'Instrument_Validation_Visit_Report_Electrical.pdf', SIPHO, 7)
    .report('report-submit', SIPHO, 6)
    .report('report-approve', GRACE, 4)
    .shareWithStakeholder(GRACE, 3, 'The practical instrument is valid. Reword items 4 and 9 of the rubric before the next sitting.')
    .done();

  // SV15 — QASA development visit with Nomvula Dlamini (today - 30), Qualifications Development
  // domain: completed, and shared with the QP (her second shared outcome).
  planVisit({
    visitType: 'qasa-development-visit',
    qpId: NOMVULA,
    domain: 'qualifications-development',
    purpose: 'Work through the draft QASA components and weights for the new Electrical Trades qualification.',
    visitDate: workingDateFromToday(-30),
    venue: 'QCTO offices, Pretoria',
    plannerId: LINDIWE,
    createdDaysAgo: 60,
  })
    .submitPlan(59, 'QASA development session with the QP and Qualifications Development.')
    .plan('plan-recommend', PETER, 57)
    .plan('plan-approve', NOKUTHULA, 55)
    .plan('plan-book', KATLEGO, 52)
    .execute(THANDEKA, 25, true)
    .upload('report', 'QASA_Development_Visit_Report_Electrical.pdf', THANDEKA, 25)
    .report('report-submit', THANDEKA, 24)
    .report('report-approve', PETER, 21)
    .shareWithStakeholder(PETER, 20, 'The QASA components and weights were agreed. Submit the QASA within 30 days.')
    .report('share-visit-outcome', PETER, 19)
    .done();

  // SV16 — Other / special meeting (today + 5), Certification domain, no QP: booked, awaiting
  // the meeting notes and report.
  planVisit({
    visitType: 'other-meeting',
    meetingTitle: 'Certification hand-off working session',
    purpose: 'Agree with Certification how approved results and QASA hand-offs are received and checked.',
    domain: 'certification',
    visitDate: workingDateFromToday(5),
    venue: 'QCTO offices, Pretoria',
    notificationFlag: 'unannounced',
    plannerId: RIAAN,
    createdDaysAgo: 14,
  })
    .submitPlan(13, 'Internal working session with the Certification domain.')
    .plan('plan-recommend', PETER, 11)
    .plan('plan-approve', MICHAEL, 9)
    .plan('plan-book', KARABO, 7)
    .done();

  // Batch V1 (05.13): the most recent past published sitting of a qualification that no other
  // Marking & Moderation visit is linked to, so the visits already seeded keep their sittings to themselves.
  const latestUnusedPastSitting = (qualificationTitle: string): EisaSitting => {
    const cutoff = workingDateFromToday(-10);
    const used = new Set(visits.flatMap((v) => visitSittingIdsOf(v)));
    const found = sittings
      .filter((s) => s.qualificationTitle === qualificationTitle && s.status === 'published' && s.date <= cutoff && !used.has(s.id))
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!found) throw new Error(`Demo seed: no unused past published ${qualificationTitle} sitting.`);
    return found;
  };

  // SV17 — Marking & Moderation covering three qualifications, each with its own published EISA
  // sitting: report submitted with a script verification spread over the three, with the Deputy Director.
  planVisit({
    visitType: 'marking-moderation',
    qpId: NOMVULA,
    sittings: [latestUnusedPastSitting('Electrical Trades'), latestUnusedPastSitting('Welding'), latestUnusedPastSitting('Plumbing')],
    visitDate: workingDateFromToday(-8),
    venue: 'Marking centre, Germiston',
    plannerId: LINDIWE,
    createdDaysAgo: 40,
  })
    .submitPlan(39, 'Monitor the joint marking session for three qualifications and verify a sample of marked and moderated scripts from each.')
    .plan('plan-recommend', PETER, 36)
    .plan('plan-approve', MICHAEL, 33)
    .plan('plan-book', KARABO, 30)
    .execute(SIPHO, 6, true)
    .upload('report', 'Marking_Moderation_Visit_Report_Three_Qualifications.pdf', SIPHO, 6)
    .verifyScripts(
      [
        { qualification: 0, scriptReference: 'ELT-2026-008', component: 'Knowledge (written)', markedOutcome: '72%', moderatedFinding: 'agree', comment: '' },
        { qualification: 0, scriptReference: 'ELT-2026-019', component: 'Practical', markedOutcome: 'Competent', moderatedFinding: 'agree', comment: '' },
        { qualification: 1, scriptReference: 'WLD-2026-052', component: 'Practical', markedOutcome: 'Competent', moderatedFinding: 'disagree', comment: 'Weld inspection record incomplete; moderator changed the outcome to Not yet competent.' },
        { qualification: 1, scriptReference: 'WLD-2026-061', component: 'Knowledge (written)', markedOutcome: '58%', moderatedFinding: 'agree', comment: '' },
        { qualification: 2, scriptReference: 'PLB-2026-027', component: 'Practical', markedOutcome: 'Competent', moderatedFinding: 'agree', comment: '' },
      ],
      'verified-with-findings',
    )
    .report('report-submit', SIPHO, 5)
    .done();

  // SV18 — Marking guideline discussion with Nomvula Dlamini (who already has two shared
  // outcomes): approved with remediation, so the report and items are shared with her automatically
  // and she answers them on Visit Outcomes.
  planVisit({
    visitType: 'marking-guideline-discussion',
    qpId: NOMVULA,
    purpose: 'Discuss the final marking guidelines for the Electrical Trades practical component with the appointed markers and moderators.',
    visitDate: workingDateFromToday(-14),
    venue: 'Virtual (MS Teams)',
    plannerId: RIAAN,
    createdDaysAgo: 50,
  })
    .submitPlan(49, 'Attend the marking guideline discussion for the practical component.')
    .plan('plan-recommend', GRACE, 46)
    .plan('plan-approve', NOKUTHULA, 43)
    .plan('plan-book', KATLEGO, 41)
    .execute(THANDEKA, 10, true)
    .upload('report', 'Marking_Guideline_Discussion_Report_Electrical_Practical.pdf', THANDEKA, 10)
    .report('report-submit', THANDEKA, 9)
    .approveWithRemediation(
      PETER,
      6,
      '1. Add the model answer for question 6 to the marking guideline.\n2. Confirm in writing that the markers received the final guideline before marking started.',
    )
    .done();

  // SV19 — Instrument validation visit with Precious Mahlangu: two rounds of remediation. The DD asked
  // for further remediation after round 1; round 2 has a response and evidence and is with the DD.
  planVisit({
    visitType: 'instrument-validation-visit',
    qpId: PRECIOUS,
    purpose: 'Validate the revised Welding practical instrument and rubric with the QP.',
    visitDate: workingDateFromToday(-25),
    venue: 'QP offices, Vanderbijlpark',
    plannerId: LINDIWE,
    createdDaysAgo: 60,
  })
    .submitPlan(59, 'On-site validation of the revised Welding practical instrument.')
    .plan('plan-recommend', GRACE, 56)
    .plan('plan-approve', NOKUTHULA, 54)
    .plan('plan-book', KATLEGO, 52)
    .execute(SIPHO, 20, true)
    .upload('report', 'Instrument_Validation_Visit_Report_Welding.pdf', SIPHO, 20)
    .report('report-submit', SIPHO, 19)
    .approveWithRemediation(GRACE, 16, '1. Correct the weighting on rubric criteria 3 and 5.\n2. Add the safety criterion that was left out of the practical.')
    .respondToRemediation(PRECIOUS, 13, 'The weightings on criteria 3 and 5 are corrected. The safety criterion is being added.', ['Welding_Rubric_Corrections.pdf'])
    .requireFurtherRemediation(GRACE, 10, 'The safety criterion is still missing from the instrument. Send the revised instrument and the calibration certificates for the test equipment.')
    .respondToRemediation(
      PRECIOUS,
      6,
      'The safety criterion is now item 11 of the practical. The revised instrument and the calibration certificates are attached.',
      ['Revised_Welding_Practical_Instrument_v3.pdf', 'Equipment_Calibration_Certificates_2026.pdf'],
    )
    .done();

  // SV20 — RPL/ARPL monitoring at Khanya Skills Academy (no QP) for two qualifications: report
  // submitted, with the Deputy Director.
  planVisit({
    visitType: 'rpl-arpl-monitoring',
    rplSdpId: 'sdp-khanya-skills-academy',
    rplQualifications: ['Electrical Trades', 'Welding'],
    visitDate: workingDateFromToday(-6),
    venue: 'Khanya Skills Academy, Johannesburg',
    plannerId: RIAAN,
    createdDaysAgo: 35,
  })
    .submitPlan(34, 'Monitor the RPL/ARPL process at the SDP for both qualifications.')
    .plan('plan-recommend', PETER, 31)
    .plan('plan-approve', MICHAEL, 28)
    .plan('plan-book', KARABO, 26)
    .execute(THANDEKA, 3, true)
    .upload('report', 'RPL_ARPL_Monitoring_Visit_Report_Khanya.pdf', THANDEKA, 3)
    .report('report-submit', THANDEKA, 2)
    .done();

  // Batch V2 (QCTO 29.36, item 2.12): five visits for the notice, response, reminder and move steps. The
  // days are working days back from today (from the last working day when today is a weekend or a public
  // holiday), so the reminder counts come out the same on every weekday: a notice sent 3 working days back
  // has had exactly one reminder (at 2) and the next is due after today (at 4); an answer at 3 or 2 working
  // days back came before any reminder was due. Every earlier visit predates the step: no notice, no response.
  const today = todayIso();
  let lastWorkingDay = today;
  while (!isWorkingDay(lastWorkingDay)) lastWorkingDay = toIsoDate(new Date(Date.parse(`${lastWorkingDay}T00:00:00Z`) - 24 * 60 * 60 * 1000));
  // Calendar days ago of that working day, the unit the seed clock takes (it moves back to a working day by itself).
  const wdAgo = (workingDays: number): number => Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${subtractWorkingDays(lastWorkingDay, workingDays)}T00:00:00Z`)) / (24 * 60 * 60 * 1000));

  // SV21 — Marking & Moderation for Johan van der Merwe (Plumbing sitting at today + 62): booked 3 working
  // days back and notified; the QP has not answered, and has had one reminder.
  planVisit({ visitType: 'marking-moderation', qpId: JOHAN, sitting: sittingAt(sittings, 'Plumbing', 62), venue: 'Marking centre, Bloemfontein', plannerId: RIAAN, createdDaysAgo: wdAgo(14) })
    .submitPlan(wdAgo(13), 'Monitor the marking session and verify a sample of marked and moderated scripts.')
    .plan('plan-recommend', GRACE, wdAgo(9))
    .plan('plan-approve', NOKUTHULA, wdAgo(6))
    .plan('plan-book', KATLEGO, wdAgo(3))
    .sendNotice()
    .remindersSoFar()
    .done();

  // SV22 — RPL/ARPL monitoring at Thabo Technical College (Welding): booked 4 working days back; the SDP accepted the date.
  planVisit({
    visitType: 'rpl-arpl-monitoring',
    rplSdpId: 'sdp-thabo-technical-college',
    rplQualifications: ['Welding'],
    visitDate: workingDateFromToday(25),
    venue: 'Thabo Technical College, Pretoria',
    plannerId: LINDIWE,
    createdDaysAgo: wdAgo(15),
  })
    .submitPlan(wdAgo(14), 'Monitor the RPL/ARPL process at the SDP for Welding.')
    .plan('plan-recommend', PETER, wdAgo(10))
    .plan('plan-approve', MICHAEL, wdAgo(7))
    .plan('plan-book', KARABO, wdAgo(4))
    .sendNotice()
    .respondToNotice('accepted', 'sdp-thabo-technical-college', wdAgo(3))
    .done();

  // SV23 — RPL/ARPL monitoring at Lerato Training Institute (Plumbing): booked 3 working days back; the SDP said it is not
  // available, with a reason and a suggested date. The ASD can move the visit.
  planVisit({
    visitType: 'rpl-arpl-monitoring',
    rplSdpId: 'sdp-lerato-training-institute',
    rplQualifications: ['Plumbing'],
    visitDate: workingDateFromToday(20),
    venue: 'Lerato Training Institute, Durban',
    plannerId: RIAAN,
    createdDaysAgo: wdAgo(14),
  })
    .submitPlan(wdAgo(13), 'Monitor the RPL/ARPL process at the SDP for Plumbing.')
    .plan('plan-recommend', GRACE, wdAgo(9))
    .plan('plan-approve', NOKUTHULA, wdAgo(6))
    .plan('plan-book', KATLEGO, wdAgo(3))
    .sendNotice()
    .respondToNotice('not-available', 'sdp-lerato-training-institute', wdAgo(2), 'Our assessors are on the national moderation workshop that week and the venue is booked for a learnership intake.', workingDateFromToday(34))
    .done();

  // SV24 — RPL/ARPL monitoring at Khanya Skills Academy (Welding): the SDP said it was not available on the first date, and
  // the ASD moved the visit to the date it suggested. It is back at Deputy Director recommendation, with the old date,
  // the reason and the SDP's answer in the history.
  planVisit({
    visitType: 'rpl-arpl-monitoring',
    rplSdpId: 'sdp-khanya-skills-academy',
    rplQualifications: ['Welding'],
    visitDate: workingDateFromToday(18),
    venue: 'Khanya Skills Academy, Johannesburg',
    plannerId: RIAAN,
    createdDaysAgo: wdAgo(22),
  })
    .submitPlan(wdAgo(21), 'Monitor the RPL/ARPL process at the SDP for Welding.')
    .plan('plan-recommend', PETER, wdAgo(17))
    .plan('plan-approve', NOKUTHULA, wdAgo(14))
    .plan('plan-book', KARABO, wdAgo(11))
    .sendNotice()
    .respondToNotice('not-available', 'sdp-khanya-skills-academy', wdAgo(10), 'The SDP is closed for the staff development week on that date.', workingDateFromToday(40))
    .moveVisit(RIAAN, wdAgo(1), workingDateFromToday(40), 'stakeholder-not-available', 'The SDP is closed for the staff development week on that date. Moved to the date it suggested.')
    .done();

  // SV25 — RPL/ARPL monitoring at Thabo Technical College (Plumbing), unannounced (CR-051): booked, no notice and no response step.
  planVisit({
    visitType: 'rpl-arpl-monitoring',
    rplSdpId: 'sdp-thabo-technical-college',
    rplQualifications: ['Plumbing'],
    visitDate: workingDateFromToday(9),
    venue: 'Thabo Technical College, Pretoria',
    notificationFlag: 'unannounced',
    plannerId: LINDIWE,
    createdDaysAgo: wdAgo(10),
  })
    .submitPlan(wdAgo(9), 'Unannounced monitoring of the RPL/ARPL process at the SDP for Plumbing.')
    .plan('plan-recommend', GRACE, wdAgo(6))
    .plan('plan-approve', MICHAEL, wdAgo(4))
    .plan('plan-book', KATLEGO, wdAgo(2))
    .done();

  // QCTO feedback 2.8: final approval below the threshold always creates the visit, so the seed
  // may not leave an approved batch below it without one.
  const missingPemVisit = updatedResults.find((b) => b.workflow.stageId === 'approved' && isBelowPostEisaThreshold(b) && !b.pemVisitId);
  if (missingPemVisit) throw new Error(`Demo seed: approved batch ${missingPemVisit.id} is below the threshold but has no Post-EISA Monitoring visit.`);

  // Newest first, the order createVisit() leaves the list in.
  return { visits: visits.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), results: updatedResults };
}
