// Demo seed — EISA Calendar, item 1.9 (plus 2.3 and 3.5 visible on real data). Written in the
// same shape as eisa-calendar/api.ts (proposeSittingBatch, performBatchAction, addSitting,
// performSittingLifecycleAction), with the audit entries and notifications each step implies.
// Every date is relative to today. "Y1" = the calendar year of today + 240 days, so a full
// year of future dates always exists. The registration closing date is never stored — it is
// calculated (registrationClosing.ts), 3 months before the sitting.
//
// Batches (QP proposals; all dates pass the CR-032 checks — working day, no holiday, outside
// the 21-working-day lead time):
//  B1  Electrical Trades  Nomvula Dlamini     Y1, 3 dates   Published (ASD approved, then published)
//  B2  Plumbing           Johan van der Merwe Y1, 2 dates   Proposed — waiting for ASD review
//  B3  Welding            Precious Mahlangu   Y1, 2 dates   Rejected with a reason — QP can correct and resubmit
//
// Sittings added straight to the calendar by the ASD (CR-027):
//  S1  Electrical Trades  today - 15   Published (past)
//  S2  Welding            today - 45   Published (past)
//  S3  Plumbing           today - 30   Published (past)
//  S4  Electrical Trades  today + 35   Published — registration closed
//  S5  Welding            today + 55   Published — registration closed
//  S6  Plumbing           today + 65   Postponed through request R1 (approved by the Director)
//  S7  Electrical Trades  today + 80   Cancelled (reason, audit entry, notifications — recorded before
//                                      QCTO feedback 2.4, so it has no request)
//  S8  Welding            today + 125  Published — registration open; request R2 open at the DD
// Added in phase C2, so Confirmation and Approval of Results have enough past sittings (one
// results batch per sitting) and Lerato Training Institute has an open Plumbing sitting:
//  S9  Electrical Trades  today - 60   Published (past)
//  S10 Plumbing           today - 75   Published (past)
//  S11 Welding            today - 90   Published (past)
//  S12 Electrical Trades  today - 105  Published (past)
//  S13 Plumbing           today - 130  Published (past)
//  S14 Welding            today - 150  Published (past)
//  S15 Electrical Trades  today - 170  Published (past)
//  S16 Plumbing           today - 50   Published (past)
//  S17 Plumbing           today + 150  Published — registration open; request R3 open at the Director
// B1's three dates are published with registration open.
//
// Postponement and cancellation requests (QCTO feedback 2.4, changeRequests.ts), each with a
// formal letter:
//  R1  S6   Postponement  Johan van der Merwe   DD recommended, Director approved (decided)
//  R2  S8   Postponement  Precious Mahlangu     waiting for the DD's recommendation
//  R3  S17  Cancellation  Johan van der Merwe   DD recommended, waiting for the Director's recommendation
//
// Batch sittings-per-year counts come from the approved QASA (qasa.ts: Electrical Trades 3,
// Plumbing 2, Welding 2), the same rule as eisa-calendar/api.ts listEligibleQualifications().
import { findQualification } from '../../api/accreditation';
import { CHANGE_REQUEST_RECORD_TYPE } from '../../../modules/eisa-calendar/changeRequests';
import {
  CALENDAR_REVIEWER_ROLE,
  DEFAULT_SITTINGS_PER_YEAR,
  POSTPONEMENT_DECIDER_ROLE,
  REQUEST_RECOMMENDER_ROLE,
} from '../../../modules/eisa-calendar/config';
import { checkSittingDate } from '../../../modules/eisa-calendar/dateChecks';
import {
  BATCH_WORKFLOW,
  CANCELLATION_REQUEST_WORKFLOW,
  POSTPONEMENT_REQUEST_WORKFLOW,
  SITTING_LIFECYCLE_WORKFLOW,
} from '../../../modules/eisa-calendar/workflow';
import type { ChangeRequestKind, EisaSitting, EisaSittingBatch, EisaSittingChangeRequest } from '../../../modules/eisa-calendar/types';
import { isApprovalLetterFinal } from '../../../modules/qsa-addendum/workflow';
import type { QsaAddendumApplication } from '../../../modules/qsa-addendum/types';
import {
  audit,
  createClock,
  notify,
  seedId,
  seedPerson,
  spreadWorkingDates,
  step,
  todayIso,
  workingDateFromToday,
  yearOf,
  type SeedLog,
} from './helpers';

const BATCH_ID_GROUP = 3;
const SITTING_ID_GROUP = 4;
const REQUEST_ID_GROUP = 12;

const SIPHO = 'sipho-ndlovu';
const THANDEKA = 'thandeka-zulu';
const GRACE = 'grace-mokoena';
const PETER = 'peter-botha';
const ZANELE = 'zanele-mthembu';

interface CalendarQualification {
  qualificationId: string;
  qualificationTitle: string;
  qpId: string;
  qpName: string;
  sittingsPerYear: number;
}

function calendarQualification(name: string, qasa: QsaAddendumApplication[]): CalendarQualification {
  const q = findQualification(name);
  if (!q) throw new Error(`Demo seed: "${name}" is not in mock/data/accreditedQualifications.ts.`);
  const approved = qasa.find(
    (a) => isApprovalLetterFinal(a.approvalState) && a.qpId === q.qpId && a.qualificationTitle.toLowerCase() === name.toLowerCase(),
  );
  return {
    qualificationId: q.qualificationId,
    qualificationTitle: q.qualificationName,
    qpId: q.qpId,
    qpName: q.qpName,
    sittingsPerYear: approved?.evaluationReport.approvedEisaSittingsPerYear ?? DEFAULT_SITTINGS_PER_YEAR,
  };
}

function sittingRow(id: string, q: CalendarQualification, date: string, batchId: string | null, createdBy: string, createdAt: string): EisaSitting {
  return {
    id,
    batchId,
    qualificationId: q.qualificationId,
    qualificationTitle: q.qualificationTitle,
    qpId: q.qpId,
    qpName: q.qpName,
    year: yearOf(date),
    date,
    status: 'published',
    rejectionReason: null,
    postponementReason: null,
    proposedNewDate: null,
    cancellationReason: null,
    createdBy,
    createdAt,
  };
}

// Dates for a QP's Y1 batch: evenly spread from February (or 4 months from now, if later) to
// the end of November, each one checked against the same CR-032 rules a real proposal meets.
function batchDates(year: number, count: number, shift: number): string[] {
  const fourMonthsOut = workingDateFromToday(120);
  const from = fourMonthsOut > `${year}-02-01` ? fourMonthsOut : `${year}-02-01`;
  const dates = spreadWorkingDates(from, `${year}-11-30`, count, shift);
  for (const date of dates) {
    const check = checkSittingDate(date);
    if (!check.ok || yearOf(date) !== year) throw new Error(`Demo seed: batch date ${date} — ${check.reasons.join(' ')}`);
  }
  return dates;
}

export interface CalendarSeed {
  batches: EisaSittingBatch[];
  sittings: EisaSitting[];
  requests: EisaSittingChangeRequest[];
}

export function seedEisaCalendar(log: SeedLog, qasa: QsaAddendumApplication[]): CalendarSeed {
  const electrical = calendarQualification('Electrical Trades', qasa);
  const plumbing = calendarQualification('Plumbing', qasa);
  const welding = calendarQualification('Welding', qasa);
  const y1 = yearOf(workingDateFromToday(240));
  const batches: EisaSittingBatch[] = [];
  const sittings: EisaSitting[] = [];
  let sittingNo = 0;
  const nextSittingId = () => seedId(SITTING_ID_GROUP, ++sittingNo);

  // QP proposal — proposeSittingBatch() writes the batch and one "proposed" sitting per date
  // (no audit entry, no notification).
  function propose(n: number, q: CalendarQualification, shift: number, daysAgo: number) {
    const clock = createClock();
    const qp = seedPerson(q.qpId);
    const submittedAt = clock.at(daysAgo, 10);
    const batch: EisaSittingBatch = {
      id: seedId(BATCH_ID_GROUP, n),
      qualificationId: q.qualificationId,
      qualificationTitle: q.qualificationTitle,
      qpId: q.qpId,
      qpName: q.qpName,
      year: y1,
      requiredCount: q.sittingsPerYear,
      dates: batchDates(y1, q.sittingsPerYear, shift),
      state: { stageId: 'qcto-review', submittedBy: qp.name, submittedById: qp.id },
      rejectionReason: null,
      rejectionHistory: [],
      submittedBy: qp.name,
      submittedAt,
    };
    const rows = batch.dates.map((date) => ({ ...sittingRow(nextSittingId(), q, date, batch.id, qp.name, submittedAt), year: y1, status: 'proposed' as const }));
    return { batch, rows, clock };
  }

  // B1 — approved and published by the ASD (performBatchAction).
  {
    const { batch, rows, clock } = propose(1, electrical, 0, 40);
    const asd = seedPerson(SIPHO);
    const approved = step(log, { definition: BATCH_WORKFLOW, state: batch.state, actionId: 'batch-approve', actor: asd, at: clock.at(35), recordType: 'eisa-calendar-batch', recordId: batch.id });
    const publishedAt = clock.at(34);
    const published = step(log, { definition: BATCH_WORKFLOW, state: approved, actionId: 'batch-publish', actor: asd, at: publishedAt, recordType: 'eisa-calendar-batch', recordId: batch.id });
    batches.push({ ...batch, state: published });
    sittings.push(...rows.map((s) => ({ ...s, status: 'published' as const })));
    notify(log, publishedAt, {
      recipientRole: 'QP',
      title: 'EISA sitting dates published',
      body: `Your approved sitting dates for "${batch.qualificationTitle}" (${batch.year}) are now published on the EISA Calendar.`,
    });
    notify(log, publishedAt, {
      recipientRole: 'SDP',
      title: 'New EISA sitting dates published',
      body: `New EISA sitting dates for "${batch.qualificationTitle}" (${batch.year}) are now on the EISA Calendar.`,
    });
  }

  // B2 — waiting for the ASD to approve or reject.
  {
    const { batch, rows } = propose(2, plumbing, 14, 4);
    batches.push(batch);
    sittings.push(...rows);
  }

  // B3 — rejected with a reason; the QP corrects the dates and resubmits (resubmitBatch).
  {
    const { batch, rows, clock } = propose(3, welding, 7, 20);
    const reason = `The first date (${batch.dates[0]}) is in the same week as the trade test at the shared assessment centre. Please move it at least two weeks later and resubmit.`;
    const rejectedAt = clock.at(15);
    const rejected = step(log, {
      definition: BATCH_WORKFLOW,
      state: batch.state,
      actionId: 'batch-reject',
      actor: seedPerson(THANDEKA),
      at: rejectedAt,
      recordType: 'eisa-calendar-batch',
      recordId: batch.id,
      note: reason,
    });
    batches.push({ ...batch, state: rejected, rejectionReason: reason, rejectionHistory: [{ reason, rejectedAt }] });
    sittings.push(...rows.map((s) => ({ ...s, status: 'rejected' as const, rejectionReason: reason })));
    notify(log, rejectedAt, {
      recipientRole: 'QP',
      title: 'EISA sitting dates rejected',
      body: `Your proposed sitting dates for "${batch.qualificationTitle}" (${batch.year}) were rejected: ${reason}`,
    });
  }

  // S1–S8 — added straight to the calendar by the ASD (addSitting), some later postponed or cancelled.
  function addDirect(q: CalendarQualification, offsetDays: number, asdId: string, addedDaysAgo: number) {
    const clock = createClock();
    const asd = seedPerson(asdId);
    const date = workingDateFromToday(offsetDays);
    const addedAt = clock.at(addedDaysAgo, 11);
    const sitting = sittingRow(nextSittingId(), q, date, null, asd.name, addedAt);
    audit(log, {
      recordType: 'eisa-calendar-sitting',
      recordId: sitting.id,
      actor: asd,
      actorRole: CALENDAR_REVIEWER_ROLE,
      action: `Added sitting directly to the calendar (${sitting.date})`,
      timestamp: addedAt,
    });
    return { sitting, clock, asd };
  }

  const requests: EisaSittingChangeRequest[] = [];

  // changeRequests.ts raiseChangeRequest(): audit entry, then DD and QP notifications.
  function raiseRequest(n: number, kind: ChangeRequestKind, sitting: EisaSitting, daysAgo: number, reason: string, proposedNewDate: string | null) {
    const clock = createClock();
    const qp = seedPerson(sitting.qpId);
    const raisedAt = clock.at(daysAgo, 10);
    const request: EisaSittingChangeRequest = {
      id: seedId(REQUEST_ID_GROUP, n),
      kind,
      sittingId: sitting.id,
      sittingDate: sitting.date,
      qualificationId: sitting.qualificationId ?? null,
      qualificationTitle: sitting.qualificationTitle,
      qpId: sitting.qpId,
      qpName: sitting.qpName,
      proposedNewDate,
      reason,
      letter: {
        fileName: `${kind === 'postponement' ? 'Postponement' : 'Cancellation'} request - ${sitting.qualificationTitle}.pdf`,
        fileSize: 180000 + n * 7300,
        fileType: 'application/pdf',
        uploadedAt: raisedAt,
      },
      raisedByRole: 'QP',
      raisedBy: qp.name,
      raisedById: qp.id,
      raisedAt,
      state: { stageId: 'dd-recommendation', submittedBy: qp.name, submittedById: qp.id },
      recommendations: [],
      decision: null,
      decisionComment: null,
      decidedBy: null,
      decidedAt: null,
    };
    const dateNote = proposedNewDate ? ` Proposed new date: ${proposedNewDate}.` : '';
    audit(log, {
      recordType: CHANGE_REQUEST_RECORD_TYPE,
      recordId: request.id,
      actor: qp,
      action: `Raised a ${kind} request (${sitting.qualificationTitle}, ${sitting.date})`,
      note: `${reason}${dateNote} Formal letter: ${request.letter.fileName}`,
      timestamp: raisedAt,
    });
    notify(log, raisedAt, {
      recipientRole: REQUEST_RECOMMENDER_ROLE,
      title: `EISA sitting ${kind} request`,
      body: `A ${kind} request for "${sitting.qualificationTitle}" on ${sitting.date} is waiting for your recommendation.`,
    });
    notify(log, raisedAt, {
      recipientRole: 'QP',
      title: `EISA sitting ${kind} request raised`,
      body: `Your ${kind} request for "${sitting.qualificationTitle}" on ${sitting.date} has been received and is with the DD.`,
    });
    return { request, clock };
  }

  // changeRequests.ts performChangeRequestAction('request-recommend').
  function recommend(entry: ReturnType<typeof raiseRequest>, actorId: string, daysAgo: number, comment: string) {
    const { request, clock } = entry;
    const actor = seedPerson(actorId);
    const at = clock.at(daysAgo, 11);
    const definition = request.kind === 'postponement' ? POSTPONEMENT_REQUEST_WORKFLOW : CANCELLATION_REQUEST_WORKFLOW;
    const next = step(log, { definition, state: request.state, actionId: 'request-recommend', actor, at, recordType: CHANGE_REQUEST_RECORD_TYPE, recordId: request.id, note: comment });
    const nextStage = definition.stages.find((s) => s.id === next.stageId);
    const subject = `"${request.qualificationTitle}" on ${request.sittingDate}`;
    if (nextStage?.allowedRoles[0]) {
      notify(log, at, {
        recipientRole: nextStage.allowedRoles[0],
        title: `EISA sitting ${request.kind} request`,
        body: `A ${request.kind} request for ${subject} was recommended by the DD and is waiting for you.`,
      });
    }
    notify(log, at, {
      recipientRole: 'QP',
      title: `EISA sitting ${request.kind} request recommended`,
      body: `The ${request.kind} request for ${subject} was recommended. It is now ${nextStage?.label.toLowerCase() ?? 'with the next official'}.`,
    });
    const recommended: EisaSittingChangeRequest = {
      ...request,
      state: next,
      recommendations: [...request.recommendations, { role: actor.role, personId: actor.id, personName: actor.name, comment, at }],
    };
    return { request: recommended, clock };
  }

  // The Director approves a postponement: the request is decided, then the sitting is postponed
  // by the same person (api.ts applyApprovedSittingChange) with the usual SDP and QP notices.
  function approvePostponement(entry: ReturnType<typeof raiseRequest>, sitting: EisaSitting, actorId: string, daysAgo: number) {
    const { request, clock } = entry;
    const actor = seedPerson(actorId);
    if (actor.role !== POSTPONEMENT_DECIDER_ROLE) throw new Error('Demo seed: a postponement is decided by the Director.');
    const at = clock.at(daysAgo, 14);
    const decided = step(log, { definition: POSTPONEMENT_REQUEST_WORKFLOW, state: request.state, actionId: 'request-approve', actor, at, recordType: CHANGE_REQUEST_RECORD_TYPE, recordId: request.id });
    const newDate = request.proposedNewDate;
    const next = step(log, {
      definition: SITTING_LIFECYCLE_WORKFLOW,
      state: { stageId: sitting.status },
      actionId: 'sitting-postpone',
      actor,
      at,
      recordType: 'eisa-calendar-sitting',
      recordId: sitting.id,
      note: `${request.reason} (Proposed new date: ${newDate})`,
    });
    // Registrations are seeded after the calendar, and none is made against a postponed sitting.
    const notice = `has been postponed: ${request.reason} The new date is ${newDate}. No learners are registered for this sitting yet.`;
    notify(log, at, { recipientRole: 'SDP', title: 'EISA sitting postponed', body: `The EISA sitting for "${sitting.qualificationTitle}" on ${sitting.date} ${notice}` });
    notify(log, at, { recipientRole: 'QP', title: 'EISA sitting postponed', body: `Your EISA sitting for "${sitting.qualificationTitle}" on ${sitting.date} ${notice}` });
    notify(log, at, {
      recipientRole: 'QP',
      title: 'EISA sitting postponement request approved',
      body: `The postponement request for "${sitting.qualificationTitle}" on ${sitting.date} was approved.`,
    });
    return {
      request: { ...request, state: decided, decision: 'approved' as const, decisionComment: null, decidedBy: actor.name, decidedAt: at },
      sitting: { ...sitting, status: next.stageId as EisaSitting['status'], postponementReason: request.reason, proposedNewDate: newDate },
    };
  }

  // S7 was cancelled by the ASD before QCTO feedback 2.4 moved cancellations to the request
  // flow — the record and its audit entry are kept as they were.
  function directCancel(entry: ReturnType<typeof addDirect>, daysAgo: number, reason: string): EisaSitting {
    const { sitting, clock, asd } = entry;
    const at = clock.at(daysAgo, 14);
    audit(log, { recordType: 'eisa-calendar-sitting', recordId: sitting.id, actor: asd, action: 'Cancel', note: reason, timestamp: at });
    notify(log, at, {
      recipientRole: 'SDP',
      title: 'EISA sitting cancelled',
      body: `The EISA sitting for "${sitting.qualificationTitle}" on ${sitting.date} has been cancelled: ${reason}`,
    });
    notify(log, at, {
      recipientRole: 'QP',
      title: 'EISA sitting cancelled',
      body: `Your EISA sitting for "${sitting.qualificationTitle}" on ${sitting.date} has been cancelled: ${reason}`,
    });
    return { ...sitting, status: 'cancelled', cancellationReason: reason };
  }

  // Same call order as before 2.4, so every sitting keeps its seed id.
  const s1to5 = [
    addDirect(electrical, -15, SIPHO, 200).sitting,
    addDirect(welding, -45, THANDEKA, 210).sitting,
    addDirect(plumbing, -30, SIPHO, 205).sitting,
    addDirect(electrical, 35, SIPHO, 190).sitting,
    addDirect(welding, 55, THANDEKA, 185).sitting,
  ];
  const s6 = addDirect(plumbing, 65, SIPHO, 180).sitting;
  const s7 = directCancel(
    addDirect(electrical, 80, SIPHO, 175),
    3,
    'Too few learners are expected for this sitting. The QP asked to combine it with the next published sitting.',
  );
  const s8 = addDirect(welding, 125, THANDEKA, 30).sitting;
  // Phase C2 — each added about 200 days before it was held, like S1–S3.
  const s9to16 = [
    addDirect(electrical, -60, SIPHO, 260).sitting,
    addDirect(plumbing, -75, SIPHO, 275).sitting,
    addDirect(welding, -90, THANDEKA, 290).sitting,
    addDirect(electrical, -105, SIPHO, 305).sitting,
    addDirect(plumbing, -130, SIPHO, 330).sitting,
    addDirect(welding, -150, THANDEKA, 350).sitting,
    addDirect(electrical, -170, SIPHO, 370).sitting,
    addDirect(plumbing, -50, SIPHO, 250).sitting,
  ];
  const s17 = addDirect(plumbing, 150, SIPHO, 25).sitting;

  // R1 — decided: DD recommended, Director approved, S6 postponed.
  const r1 = approvePostponement(
    recommend(
      raiseRequest(
        1,
        'postponement',
        s6,
        14,
        'The assessment centre is closed for maintenance that week. The QP has agreed to move the sitting.',
        workingDateFromToday(110),
      ),
      GRACE,
      10,
      'Supported. The centre confirmed the maintenance dates in writing.',
    ),
    s6,
    ZANELE,
    6,
  );
  // R2 — waiting for the DD.
  const r2 = raiseRequest(
    2,
    'postponement',
    s8,
    2,
    'Two of the three assessors for this sitting are booked for a national moderation panel on that date.',
    workingDateFromToday(160),
  );
  // R3 — DD recommended; waiting for the Director's recommendation (the CEO decides after that).
  const r3 = recommend(
    raiseRequest(
      3,
      'cancellation',
      s17,
      5,
      'The assessment venue for this date is no longer available, and no other accredited venue in the region can host the sitting.',
      null,
    ),
    PETER,
    3,
    'Supported. The venue confirmed the withdrawal in writing; the learners can register for the next sitting.',
  );
  requests.push(r1.request, r2.request, r3.request);

  sittings.push(...s1to5, r1.sitting, s7, s8, ...s9to16, s17);

  // Sanity check on the sittings the rest of the seed relies on: past ones are in the past,
  // and every future one has a date after today.
  const today = todayIso();
  if (sittings.some((s) => s.batchId && s.date <= today)) throw new Error('Demo seed: a batch date is not in the future.');
  // QCTO feedback 2.4: every postponement request's new date passes the checks a real one does.
  for (const r of requests) {
    if (!r.proposedNewDate) continue;
    const check = checkSittingDate(r.proposedNewDate);
    if (!check.ok || r.proposedNewDate <= r.sittingDate) throw new Error(`Demo seed: request new date ${r.proposedNewDate} — ${check.reasons.join(' ')}`);
  }

  return {
    batches: batches.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    sittings: sittings.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    requests: requests.sort((a, b) => b.raisedAt.localeCompare(a.raisedAt)),
  };
}
