// Demo seed — Site Visits & Monitoring, items 1.12 and 2.8. Written in the same shape as
// site-visits/api.ts (createVisit, updateVisitDetails, performPlanningAction, saveChecklist,
// saveFreeTextNotes, saveCompletionDetails, performReportAction), with the audit entries and
// notifications each step implies. Days are "days ago"; visit dates are relative to today.
// QCTO feedback A2: EISA Readiness has no qualification, sitting or SDP; Marking & Moderation
// has a sitting but no SDP.
//
//  #     Type                  QP / subject                         Visit date    Stage
//  SV1   EISA Readiness        Nomvula Dlamini                      today + 30    Plan submitted — waiting for the Deputy Director
//  SV2   Marking & Moderation  Electrical Trades sitting today + 35 today + 35    Recommended — waiting for the Domain Director
//  SV3   Post-EISA Monitoring  Electrical Trades sitting today - 170 today + 21   Approved plan — waiting for Sub Domain Admin booking.
//                              (Nomvula Dlamini, 50% batch)                       Created from the low-competency results batch
//                                                                                 (createPemVisitForBatch), so that batch no longer
//                                                                                 offers "Create Post-EISA Monitoring Visit".
//  SV4   RPL/ARPL Monitoring   Thabo Technical College, Electrical  today + 35    Booked — awaiting execution (auto-created from
//                              Trades (registration G6)                           the RPL/ARPL-flagged registration)
//  SV5   Marking & Moderation  Electrical Trades sitting today - 15 today - 15    Booked — report in draft (first section done,
//                                                                                 one attendance register uploaded)
//  SV6   EISA Readiness        Precious Mahlangu                    today - 10    Report submitted — waiting for the Deputy Director
//  SV7   Marking & Moderation  Welding sitting today - 45           today - 45    Report approved — waiting to share the outcome
//  SV8   RPL/ARPL Monitoring   Lerato Training Institute, Plumbing  today - 75    Outcome shared — waiting for the QP to acknowledge
//                              (registration P5)
//  SV9   EISA Readiness        Johan van der Merwe                  today - 20    Report sent back for clarification — ASD to answer
//  SV10  EISA Readiness        Johan van der Merwe                  today + 10    Plan rejected by the Domain Director (reason given)
//  SV11  Marking & Moderation  Plumbing sitting today - 75          today - 75    Closed — outcome shared and acknowledged by the QP
//  SV12  Marking & Moderation  Welding sitting today + 55           today + 55    Plan sent back to the Assistant Director (reason given)
//
// The Welding low-competency batch (Precious Mahlangu, 40%) is left without a visit, so its
// "Create Post-EISA Monitoring Visit" button still shows. SV5, SV7 and SV11 are linked to sittings
// that have a results batch or are awaiting one, so Approval of Results shows their Marking &
// Moderation status.
//
// QCTO feedback 1.12 (Batch D): a report can only be submitted with at least one "Visit report"
// file, so every visit whose report was ever submitted (SV6, SV7, SV8, SV9, SV11) carries one
// sample visit report, uploaded by the ASD after executing the visit. SV5 (draft) has one
// attendance register and no report yet.
//
// Planners (Assistant Director): Lindiwe Khumalo / Riaan Pretorius. Deputy Director: Grace
// Mokoena / Peter Botha. Domain Director: Michael van Wyk / Nokuthula Dube. Sub Domain Admin:
// Karabo Sithole / Katlego Mahlangu. Report submitters (ASD): Sipho Ndlovu / Thandeka Zulu.
import { LABELS } from '../../../config/labels';
import type { RplArplMonitoringItem } from '../../api/siteVisitsStore';
import { buildEisaReadinessVisitSections } from '../eisaReadinessVisitSections';
import { buildPostEisaMonitoringVisitSections } from '../postEisaMonitoringSections';
import { buildRplArplMonitoringVisitSections } from '../rplArplVisitSections';
import { buildMarkingModerationVisitSections } from '../siteVisitFormSections';
import { isChecklistComplete, type ChecklistSection } from '../../../shared/checklist/types';
import type { Role } from '../../../types';
import type { ResultsBatch } from '../../../modules/approval-of-results/types';
import { competencyRatePercent } from '../../../modules/approval-of-results/workflow';
import type { EisaSitting } from '../../../modules/eisa-calendar/types';
import type { EisaRegistrationRecord } from '../../../modules/eisa-registration/types';
import {
  BOOKING_ROLE,
  DEFAULT_NOTICE_LEAD_TIME_DAYS,
  PLAN_APPROVER_ROLE,
  PLAN_RECOMMENDER_ROLE,
  PLANNER_ROLE,
  POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT,
  REPORT_APPROVER_ROLE,
  REPORT_SUBMITTER_ROLE,
} from '../../../modules/site-visits/config';
import { evidenceOf, hasVisitReportFile, MISSING_VISIT_REPORT_MESSAGE, type VisitEvidenceCategory } from '../../../modules/site-visits/evidence';
import { freeTextFieldsForType } from '../../../modules/site-visits/freeTextFields';
import type { NotificationFlag, SiteVisit, VisitType } from '../../../modules/site-visits/types';
import { isPerQualificationVisit, visitHasSdp, visitSubject } from '../../../modules/site-visits/visitTypeLabels';
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
};

const CHECKLIST_COMMENT = 'Observed on site — in order.';

const EVIDENCE_FILE_SIZE: Record<VisitEvidenceCategory, number> = { report: 1_048_576, attendance: 312_000, other: 204_800 };

interface PlanInput {
  visitType: VisitType;
  qpId: string;
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
  report: (actionId: string, actorId: string, atDaysAgo: number, note?: string) => VisitSeedBuilder;
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
          checklist: answerChecklist(sections, CHECKLIST_COMMENT, complete ? {} : { onlySectionIds: [sections[0].id] }),
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
      // performReportAction() (no re-route is seeded).
      report(actionId, actorId, atDaysAgo, note) {
        if (actionId === 'report-submit') {
          if (!isChecklistComplete(visit.checklist, true)) throw new Error('Demo seed: every checklist line needs an answer and a comment before submitting the report.');
          if (!visit.completedBy.trim() || !visit.completedDate) throw new Error('Demo seed: complete "Completed By" and "Completion Date" before submitting.');
          if (!hasVisitReportFile(visit)) throw new Error(`Demo seed: ${MISSING_VISIT_REPORT_MESSAGE}`);
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
          notify(log, at, { recipientRole: 'QP', title: 'Visit outcome shared', body: `The outcome for "${subject()}" (${visit.qpName}) is ready to review.` });
          if (visit.visitType === 'post-eisa-monitoring') {
            if (visit.sdpName) {
              notify(log, at, { recipientRole: 'SDP', title: 'Post-EISA Monitoring outcome shared', body: `The visit outcome for "${subject()}" (${visit.sdpName}) has been shared.` });
            }
            audit(log, {
              recordType: 'site-visit-report',
              recordId: visit.id,
              actor,
              action: 'Shared the PEM report with Quality Assurance and Accreditation (simulated — no screen in either domain yet)',
              timestamp: at,
            });
          }
        }
        if (actionId === 'qp-acknowledge-outcome') {
          notify(log, at, { recipientRole: REPORT_APPROVER_ROLE, title: 'QP acknowledged the visit outcome', body: `"${subject()}" — the QP has acknowledged the shared outcome.` });
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
    const qp = seedPerson(input.qpId);
    const perQualification = isPerQualificationVisit(input.visitType);
    if (perQualification !== !!input.sitting) throw new Error(`Demo seed: a ${input.visitType} visit ${perQualification ? 'needs' : 'cannot have'} a sitting link here.`);
    if (input.sitting && input.sitting.qpId !== input.qpId) throw new Error('Demo seed: the sitting belongs to another QP.');
    const notificationFlag = input.notificationFlag ?? 'notified';
    const visit: SiteVisit = {
      id: seedId(VISIT_ID_GROUP, ++n),
      visitType: input.visitType,
      qpId: input.qpId,
      qpName: qp.name,
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

  // approval-of-results/api.ts createPemVisitForBatch(): the "Create Post-EISA Monitoring Visit"
  // button. That function is async and stamps a random id and today's time, so the seed builds
  // the same record (createVisit's fields, the "results approved" flag set, pemVisitId on the
  // batch) with a seed id and a past time. It writes no audit entry or notification.
  function pemVisitForBatch(batchId: string, actorId: string, createdDaysAgo: number): VisitSeedBuilder {
    const batch = updatedResults.find((b) => b.id === batchId);
    if (!batch) throw new Error(`Demo seed: results batch ${batchId} missing — Post-EISA Monitoring needs the Approval of Results seed.`);
    if (batch.workflow.stageId !== 'approved') throw new Error('Demo seed: only an approved results batch can trigger a Post-EISA Monitoring visit.');
    if (batch.pemVisitId) throw new Error('Demo seed: a Post-EISA Monitoring visit has already been created for this batch.');
    if (competencyRatePercent(batch) >= POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT) {
      throw new Error('Demo seed: a Post-EISA Monitoring visit can only be offered when the batch competency rate is below the threshold.');
    }
    const actor = seedPerson(actorId);
    if (!['Assistant Director', 'Deputy Director', 'Director', 'Chief Director'].includes(actor.role)) {
      throw new Error(`Demo seed: ${actor.name} cannot see Approval of Results.`);
    }
    const clock = createClock();
    const createdAt = clock.at(createdDaysAgo, 9);
    if (batch.recommendation && createdAt < batch.recommendation.recommendedAt) throw new Error('Demo seed: the visit was created before the batch was approved.');
    const visit: SiteVisit = {
      id: seedId(VISIT_ID_GROUP, ++n),
      visitType: 'post-eisa-monitoring',
      qpId: batch.qpId,
      qpName: batch.qpName,
      qualificationTitle: batch.qualificationTitle,
      sdpId: null,
      sdpName: null,
      sittingId: batch.sittingId,
      visitDate: batch.sittingDate,
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
    // The planning chain starts with the Assistant Director, as for any other visit.
    return builder(visit, clock, actor.role === PLANNER_ROLE ? actor.id : null);
  }

  // api.ts buildAutoCreatedVisit(): the RPL/ARPL visit syncAutoCreatedVisits() makes from a
  // monitoring item — already booked, no sitting link. Seeded with the item's id as
  // sourceMonitoringItemId so the sync does not create it a second time.
  function autoRplVisit(registrationSdpId: string, sittingDate: string): VisitSeedBuilder {
    const registration = registrations.find((r) => r.sdpId === registrationSdpId && r.sittingDate === sittingDate && r.rplMonitoringItemId);
    const item = monitoringItems.find((i) => i.id === registration?.rplMonitoringItemId);
    if (!registration || !item) throw new Error(`Demo seed: no RPL/ARPL monitoring item for ${registrationSdpId} ${sittingDate}.`);
    const clock = createClock();
    const visit: SiteVisit = {
      id: seedId(VISIT_ID_GROUP, ++n),
      visitType: 'rpl-arpl-monitoring',
      qpId: item.qpId,
      qpName: item.qpName,
      qualificationTitle: item.qualificationTitle,
      sdpId: item.sdpId,
      sdpName: item.sdpName,
      sittingId: null,
      visitDate: item.sittingDate,
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

  // SV3 — Post-EISA Monitoring from the Electrical Trades 50% batch (sitting today - 170):
  // created from Approval of Results, dated and placed by the planner, waiting for booking.
  pemVisitForBatch(RESULTS_SEED_IDS.lowCompetencyElectrical, LINDIWE, 16)
    .updateDetails({ visitDate: workingDateFromToday(21), venue: 'Thabo Technical College, Pretoria' })
    .submitPlan(15, 'Only 2 of 4 learners were found competent (50%). Interview the facilitators and learners and review the training records.')
    .plan('plan-recommend', GRACE, 12)
    .plan('plan-approve', MICHAEL, 9)
    .done();

  // SV4 — RPL/ARPL monitoring from Thabo's Electrical Trades registration (G6): booked, awaiting execution.
  autoRplVisit('sdp-thabo-technical-college', workingDateFromToday(35)).done();

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
    .report('report-submit', THANDEKA, 41)
    .report('report-approve', PETER, 38)
    .done();

  // SV8 — RPL/ARPL monitoring from Lerato's Plumbing registration (P5, today - 75): outcome
  // shared with the QP, who has not acknowledged it yet.
  autoRplVisit('sdp-lerato-training-institute', workingDateFromToday(-75))
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

  // SV11 — Marking & Moderation, Plumbing sitting at today - 75: closed (QP acknowledged the outcome).
  planVisit({ visitType: 'marking-moderation', qpId: JOHAN, sitting: sittingAt(sittings, 'Plumbing', -75), venue: 'Marking centre, Bloemfontein', plannerId: RIAAN, createdDaysAgo: 105 })
    .submitPlan(104, 'Monitor the marking session and verify a sample of marked and moderated scripts.')
    .plan('plan-recommend', GRACE, 101)
    .plan('plan-approve', NOKUTHULA, 98)
    .plan('plan-book', KATLEGO, 95)
    .execute(SIPHO, 72, true)
    .upload('report', 'Marking_Moderation_Visit_Report_Plumbing.pdf', SIPHO, 72)
    .report('report-submit', SIPHO, 71)
    .report('report-approve', GRACE, 68)
    .report('share-visit-outcome', GRACE, 66)
    .report('qp-acknowledge-outcome', JOHAN, 60)
    .done();

  // SV12 — Marking & Moderation, Welding sitting at today + 55: plan sent back to the planner.
  planVisit({ visitType: 'marking-moderation', qpId: PRECIOUS, sitting: sittingAt(sittings, 'Welding', 55), venue: 'To be confirmed', plannerId: RIAAN, createdDaysAgo: 10 })
    .submitPlan(9, 'Monitor the marking session and verify a sample of marked and moderated scripts.')
    .plan('plan-dd-send-back', PETER, 6, 'The venue is still "To be confirmed". Add the marking centre the QP has booked and resubmit.')
    .done();

  // Newest first, the order createVisit() leaves the list in.
  return { visits: visits.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), results: updatedResults };
}
