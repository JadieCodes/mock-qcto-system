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
//  S6  Plumbing           today + 65   Postponed (reason, proposed new date, audit entry, notifications)
//  S7  Electrical Trades  today + 80   Cancelled (reason, audit entry, notifications)
//  S8  Welding            today + 125  Published — registration open
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
//  S17 Plumbing           today + 150  Published — registration open
// B1's three dates are published with registration open.
//
// Batch sittings-per-year counts come from the approved QASA (qasa.ts: Electrical Trades 3,
// Plumbing 2, Welding 2), the same rule as eisa-calendar/api.ts listEligibleQualifications().
import { findQualification } from '../../api/accreditation';
import { CALENDAR_REVIEWER_ROLE, DEFAULT_SITTINGS_PER_YEAR } from '../../../modules/eisa-calendar/config';
import { checkSittingDate } from '../../../modules/eisa-calendar/dateChecks';
import { BATCH_WORKFLOW, SITTING_LIFECYCLE_WORKFLOW } from '../../../modules/eisa-calendar/workflow';
import type { EisaSitting, EisaSittingBatch } from '../../../modules/eisa-calendar/types';
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

const SIPHO = 'sipho-ndlovu';
const THANDEKA = 'thandeka-zulu';

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

  // performSittingLifecycleAction(): workflow audit entry, then SDP and QP notifications.
  function lifecycle(
    entry: ReturnType<typeof addDirect>,
    actionId: 'sitting-postpone' | 'sitting-cancel',
    daysAgo: number,
    reason: string,
    proposedNewDate: string | null,
  ): EisaSitting {
    const { sitting, clock, asd } = entry;
    const at = clock.at(daysAgo, 14);
    const next = step(log, {
      definition: SITTING_LIFECYCLE_WORKFLOW,
      state: { stageId: sitting.status },
      actionId,
      actor: asd,
      at,
      recordType: 'eisa-calendar-sitting',
      recordId: sitting.id,
      note: proposedNewDate ? `${reason} (Proposed new date: ${proposedNewDate})` : reason,
    });
    const verb = actionId === 'sitting-postpone' ? 'postponed' : 'cancelled';
    const dateNote = proposedNewDate ? ` A new date of ${proposedNewDate} has been proposed.` : '';
    notify(log, at, {
      recipientRole: 'SDP',
      title: `EISA sitting ${verb}`,
      body: `The EISA sitting for "${sitting.qualificationTitle}" on ${sitting.date} has been ${verb}: ${reason}${dateNote}`,
    });
    notify(log, at, {
      recipientRole: 'QP',
      title: `EISA sitting ${verb}`,
      body: `Your EISA sitting for "${sitting.qualificationTitle}" on ${sitting.date} has been ${verb}: ${reason}${dateNote}`,
    });
    return {
      ...sitting,
      status: next.stageId as EisaSitting['status'],
      postponementReason: actionId === 'sitting-postpone' ? reason : null,
      proposedNewDate,
      cancellationReason: actionId === 'sitting-cancel' ? reason : null,
    };
  }

  sittings.push(
    addDirect(electrical, -15, SIPHO, 200).sitting,
    addDirect(welding, -45, THANDEKA, 210).sitting,
    addDirect(plumbing, -30, SIPHO, 205).sitting,
    addDirect(electrical, 35, SIPHO, 190).sitting,
    addDirect(welding, 55, THANDEKA, 185).sitting,
    lifecycle(
      addDirect(plumbing, 65, SIPHO, 180),
      'sitting-postpone',
      6,
      'The assessment centre is closed for maintenance that week. The QP has agreed to move the sitting.',
      workingDateFromToday(110),
    ),
    lifecycle(
      addDirect(electrical, 80, SIPHO, 175),
      'sitting-cancel',
      3,
      'Too few learners are expected for this sitting. The QP asked to combine it with the next published sitting.',
      null,
    ),
    addDirect(welding, 125, THANDEKA, 20).sitting,
    // Phase C2 — each added about 200 days before it was held, like S1–S3.
    addDirect(electrical, -60, SIPHO, 260).sitting,
    addDirect(plumbing, -75, SIPHO, 275).sitting,
    addDirect(welding, -90, THANDEKA, 290).sitting,
    addDirect(electrical, -105, SIPHO, 305).sitting,
    addDirect(plumbing, -130, SIPHO, 330).sitting,
    addDirect(welding, -150, THANDEKA, 350).sitting,
    addDirect(electrical, -170, SIPHO, 370).sitting,
    addDirect(plumbing, -50, SIPHO, 250).sitting,
    addDirect(plumbing, 150, SIPHO, 25).sitting,
  );

  // Sanity check on the sittings the rest of the seed relies on: past ones are in the past,
  // and every future one has a date after today.
  const today = todayIso();
  if (sittings.some((s) => s.batchId && s.date <= today)) throw new Error('Demo seed: a batch date is not in the future.');

  return {
    batches: batches.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    sittings: sittings.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
