// Batch S demo seed (QCTO 29.1, 29.2, 05.11): the super admin's three screens.
//  - Role names: NOT seeded. Every role shows its default name.
//  - Acting appointments: Lindiwe Khumalo (ASD) acts as Deputy Director for the current week (Monday
//    to Sunday, so it is active on every weekday); Riaan Pretorius (ASD) acted as Deputy Director
//    about a month ago and it has ended.
//  - Overdue items: nothing to seed here. The records in the other seed files already carry their
//    real stage-entered times (audit entries), several of them well past three working days in
//    different modules, e.g. an ASD evaluation, a FISA validation and an RPL toolkit.
//  - Closing date override: one published sitting far enough out that no EISA Confirmation or
//    postponement/cancellation request depends on it. Moving its closing date later changes nothing
//    already seeded (registrations on it were made while it was open).
import { ACTING_RECORD_TYPE, type ActingAppointment } from '../../../shared/administration/acting';
import { addWorkingDays, subtractWorkingDays, toIsoDate } from '../../../shared/dates/workingDays';
import { calcRegistrationClosingDate } from '../../../modules/eisa-calendar/registrationClosing';
import type { EisaSitting, EisaSittingChangeRequest } from '../../../modules/eisa-calendar/types';
import type { EisaConfirmationRecord } from '../../../modules/eisa-confirmation/types';
import { audit, createClock, notify, seedId, seedPerson, todayIso, type SeedLog } from './helpers';

const SUPER_ADMIN_ID = 'nomsa-khanyile';

function shiftIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

// Monday and Sunday of the week that contains `iso` (weeks run Monday to Sunday).
function weekOf(iso: string): { monday: string; sunday: string } {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay();
  const monday = shiftIso(iso, -((dow + 6) % 7));
  return { monday, sunday: shiftIso(monday, 6) };
}

export function seedActingAppointments(log: SeedLog): ActingAppointment[] {
  const admin = seedPerson(SUPER_ADMIN_ID);
  const clock = createClock();
  const today = todayIso();
  const { monday, sunday } = weekOf(today);
  const pastTo = shiftIso(monday, -21);
  const pastFrom = shiftIso(pastTo, -9);

  const rows: { personId: string; from: string; to: string; reason: string; id: number; daysAgo: number }[] = [
    {
      id: 1,
      personId: 'riaan-pretorius',
      from: pastFrom,
      to: pastTo,
      reason: 'Deputy Director on leave; moderation continues.',
      daysAgo: 45,
    },
    {
      id: 2,
      personId: 'lindiwe-khumalo',
      from: monday,
      to: sunday,
      reason: 'Deputy Director attending the IAC meeting and a workshop this week.',
      daysAgo: 3,
    },
  ];
  return rows.map((r) => {
    const person = seedPerson(r.personId);
    const createdAt = clock.at(r.daysAgo, 10);
    const appointment: ActingAppointment = {
      id: seedId(0xad, r.id),
      personId: person.id,
      personName: person.name,
      actingRole: 'Deputy Director',
      from: r.from,
      to: r.to,
      reason: r.reason,
      createdAt,
      createdByName: admin.name,
      endedAt: null,
      endedReason: null,
    };
    audit(log, {
      recordType: ACTING_RECORD_TYPE,
      recordId: appointment.id,
      actor: admin,
      action: `Acting appointment: ${person.name} acts as Deputy Director, ${r.from} to ${r.to}`,
      note: r.reason,
      timestamp: createdAt,
    });
    notify(log, createdAt, {
      recipientRole: person.role,
      recipientPersonId: person.id,
      title: 'Acting appointment',
      body: `You act as Deputy Director from ${r.from} to ${r.to}. Switch to that role in the header. Reason: ${r.reason}`,
    });
    return appointment;
  });
}

// 05.11: the closing date of one published sitting is later than calculated, with a reason.
export function applyClosingOverride(
  log: SeedLog,
  sittings: EisaSitting[],
  confirmations: EisaConfirmationRecord[],
  requests: EisaSittingChangeRequest[],
): EisaSitting[] {
  const today = todayIso();
  const usedIds = new Set([...confirmations.map((c) => c.sittingId), ...requests.map((r) => r.sittingId)]);
  const target = sittings.find((s) => s.status === 'published' && !s.onDemand && s.date > shiftIso(today, 100) && !usedIds.has(s.id));
  if (!target) throw new Error('Demo seed: no published sitting free for the closing date override.');

  const admin = seedPerson(SUPER_ADMIN_ID);
  const at = createClock().at(2, 11);
  const calculated = calcRegistrationClosingDate(target.date, target.onDemand);
  const later = addWorkingDays(calculated, 10);
  const date = later < target.date ? later : subtractWorkingDays(target.date, 1);
  const reason = 'Two accredited SDPs were affected by flooding and asked for more time to register learners.';

  audit(log, {
    recordType: 'eisa-calendar-sitting',
    recordId: target.id,
    actor: admin,
    action: `Registration closing date changed from ${calculated} to ${date}`,
    note: reason,
    timestamp: at,
  });
  for (const recipientRole of ['SDP', 'QP']) {
    notify(log, at, {
      recipientRole,
      title: 'Registration closing date changed',
      body: `EISA sitting for "${target.qualificationTitle}" on ${target.date}: registration closing has been changed by the super admin from ${calculated} to ${date}. Reason: ${reason}`,
    });
  }
  return sittings.map((s) =>
    s.id === target.id ? { ...s, registrationClosingOverride: { date, reason, calculatedDate: calculated, changedByName: admin.name, changedAt: at } } : s,
  );
}
