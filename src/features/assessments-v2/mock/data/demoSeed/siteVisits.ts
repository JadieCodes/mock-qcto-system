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
// Planners (ASD): Lindiwe Khumalo / Riaan Pretorius. Deputy Director: Grace
// Mokoena / Peter Botha. Domain Director: Michael van Wyk / Nokuthula Dube. Sub Domain Admin:
// Karabo Sithole / Katlego Mahlangu. Report submitters (ASD): Sipho Ndlovu / Thandeka Zulu.
import { LABELS } from '../../../config/labels';
import type { RplArplMonitoringItem } from '../../api/siteVisitsStore';
import { buildEisaReadinessVisitSections } from '../eisaReadinessVisitSections';
import { buildPostEisaMonitoringVisitSections } from '../postEisaMonitoringSections';
import { buildRplArplMonitoringVisitSections } from '../rplArplVisitSections';
import { buildMarkingGuidelineDiscussionSections, buildMarkingModerationVisitSections } from '../siteVisitFormSections';
import { isChecklistComplete, type ChecklistSection } from '../../../shared/checklist/types';
import type { Role } from '../../../types';
import type { ResultsBatch } from '../../../modules/approval-of-results/types';
import { competencyRatePercent, isBelowPostEisaThreshold } from '../../../modules/approval-of-results/workflow';
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
import { getScriptVerificationIssues, visitHasScriptVerification } from '../../../modules/site-visits/scriptVerification';
import { isSharedWithStakeholder, visitCanBeShared } from '../../../modules/site-visits/stakeholderShare';
import type {
  NotificationFlag,
  ScriptVerificationResult,
  ScriptVerificationRow,
  SiteVisit,
  VisitDomain,
  VisitType,
} from '../../../modules/site-visits/types';
import { DEFAULT_VISIT_DOMAIN } from '../../../modules/site-visits/visitDomains';
import { isPerQualificationVisit, visitHasPurpose, visitHasQp, visitHasSdp, visitIsMeeting, visitSubject } from '../../../modules/site-visits/visitTypeLabels';
import { PLANNING_WORKFLOW, REPORT_WORKFLOW } from '../../../modules/site-visits/workflow';
import { RESULTS_SEED_IDS } from './approvalOfResults';
import { sittingAt } from './eisaRegistration';
import { answerChecklist, audit, createClock, dateOf, notify, seedId, seedPerson, step, workingDateFromToday, type SeedClock, type SeedLog } from './helpers';

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
  verifyScripts: (rows: Omit<ScriptVerificationRow, 'id'>[], overallResult: ScriptVerificationResult) => VisitSeedBuilder;
  report: (actionId: string, actorId: string, atDaysAgo: number, note?: string) => VisitSeedBuilder;
  shareWithStakeholder: (actorId: string, atDaysAgo: number, outcomeSummary: string) => VisitSeedBuilder;
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

  function builder(initial: SiteVisit, clock: SeedClock, plannerId: string | null): VisitSeedBuilder {
    let visit = initial;
    const subject = () => visitSubject(visit);

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
            body: `"${subject()}" is booked for ${visit.visitDate}. The execution form is ready.`,
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
        visit = { ...visit, scriptVerification: { rows: rows.map((r, i) => ({ ...r, id: `${visit.id}-script-${i + 1}` })), overallResult } };
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
    if (perQualification !== !!input.sitting) throw new Error(`Demo seed: a ${input.visitType} visit ${perQualification ? 'needs' : 'cannot have'} a sitting link here.`);
    if (input.sitting && input.sitting.qpId !== input.qpId) throw new Error('Demo seed: the sitting belongs to another QP.');
    // createVisit(), QCTO feedback 2.5.
    if (visitIsMeeting(input.visitType) !== !!input.meetingTitle?.trim()) throw new Error('Demo seed: only a special meeting has a title, and it needs one.');
    if (visitHasPurpose(input.visitType) !== !!input.purpose?.trim()) throw new Error(`Demo seed: a ${input.visitType} visit ${input.purpose ? 'has no' : 'needs a'} purpose.`);
    const notificationFlag = input.notificationFlag ?? 'notified';
    const visit: SiteVisit = {
      id: seedId(VISIT_ID_GROUP, ++n),
      visitType: input.visitType,
      domain: input.domain ?? DEFAULT_VISIT_DOMAIN,
      meetingTitle: input.meetingTitle,
      purpose: input.purpose,
      qpId: qp?.id ?? '',
      qpName: qp?.name ?? '',
      qualificationTitle: input.sitting?.qualificationTitle ?? '',
      // A2: Readiness and Marking & Moderation have no SDP; none of the planned visits here is a
      // type that takes one from the sitting.
      sdpId: null,
      sdpName: null,
      sittingId: input.sitting?.id ?? null,
      visitDate: input.sitting?.date ?? input.visitDate ?? '',
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
      resultsApprovedForSitting: false,
      completedBy: '',
      completedDate: '',
      sourceRegistrationId: null,
      sourceMonitoringItemId: null,
      learnerNames: [],
      createdBy: planner.name,
      createdAt: clock.at(input.createdDaysAgo, 9),
    };
    if (!visit.visitDate) throw new Error('Demo seed: a visit needs a date.');
    if (visitHasSdp(input.visitType)) throw new Error('Demo seed: RPL/ARPL and Post-EISA visits come from a registration or a results batch here.');
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
      resultsApprovedForSitting: true,
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
      resultsApprovedForSitting: false,
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

  // QCTO feedback 2.8: final approval below the threshold always creates the visit, so the seed
  // may not leave an approved batch below it without one.
  const missingPemVisit = updatedResults.find((b) => b.workflow.stageId === 'approved' && isBelowPostEisaThreshold(b) && !b.pemVisitId);
  if (missingPemVisit) throw new Error(`Demo seed: approved batch ${missingPemVisit.id} is below the threshold but has no Post-EISA Monitoring visit.`);

  // Newest first, the order createVisit() leaves the list in.
  return { visits: visits.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), results: updatedResults };
}
