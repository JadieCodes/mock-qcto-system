import { readStore, writeStore } from '../../mock/api/storage';
import { appendAuditEntry } from '../audit/auditLog';
import { toIsoDate } from '../dates/workingDays';
import { addNotification } from '../notifications/store';
import { getPerson } from '../people/directory';
import { roleLabel } from './roleLabels';
import { SUPER_ADMIN_ROLE } from '../../config/administration';
import type { Role } from '../../types';

// Batch S (29.2): the super admin gives a person another role's rights for a date range. While the
// appointment is active that person can switch to the role and act in it; what they do is recorded as
// "<name> (acting <role>)" (see actingName). Nothing here changes role ids or workflow rights.
export const ACTING_KEY = 'adminActingAppointments';
export const ACTING_RECORD_TYPE = 'administration-acting';

export interface ActingAppointment {
  id: string;
  personId: string;
  personName: string;
  actingRole: Role;
  from: string; // ISO yyyy-mm-dd, first day
  to: string; // ISO yyyy-mm-dd, last day (inclusive)
  reason: string;
  createdAt: string;
  createdByName: string;
  // Set when the super admin ends it before `to`.
  endedAt: string | null;
  endedReason: string | null;
}

export type AppointmentStatus = 'active' | 'upcoming' | 'past';

export function appointmentStatus(a: ActingAppointment, todayIso: string = toIsoDate(new Date())): AppointmentStatus {
  if (a.endedAt) return 'past';
  if (todayIso < a.from) return 'upcoming';
  if (todayIso > a.to) return 'past'; // ends by itself after the end date
  return 'active';
}

export function listAppointments(): ActingAppointment[] {
  return readStore<ActingAppointment[]>(ACTING_KEY, []);
}

// Roles `personId` may switch to right now, besides their own.
export function activeActingRoles(personId: string, todayIso?: string): Role[] {
  return listAppointments()
    .filter((a) => a.personId === personId && appointmentStatus(a, todayIso) === 'active')
    .map((a) => a.actingRole);
}

// People (other than the role's own holders) who hold an active appointment for `role`.
export function activeActingHolders(role: Role, todayIso?: string): string[] {
  return listAppointments()
    .filter((a) => a.actingRole === role && appointmentStatus(a, todayIso) === 'active')
    .map((a) => a.personId);
}

// What goes into history and audit for an action taken while acting.
export function actingName(name: string, actingRole: Role): string {
  return `${name} (acting ${roleLabel(actingRole)})`;
}

interface Actor {
  actorId: string;
  actorName: string;
  actorRole: Role;
}

export function createAppointment(input: Actor & { personId: string; actingRole: Role; from: string; to: string; reason: string }): ActingAppointment {
  const person = getPerson(input.personId);
  if (!person || person.portal !== 'internal') throw new Error('Choose an internal person.');
  if (input.actingRole === person.role) throw new Error(`${person.name} already holds that role.`);
  if (input.actingRole === SUPER_ADMIN_ROLE || person.role === SUPER_ADMIN_ROLE) {
    throw new Error('The Super Admin role cannot be part of an acting appointment.');
  }
  if (!input.from || !input.to) throw new Error('Choose a start and an end date.');
  if (input.to < input.from) throw new Error('The end date cannot be before the start date.');
  if (!input.reason.trim()) throw new Error('A reason is required.');
  const overlaps = listAppointments().some(
    (a) => a.personId === input.personId && a.actingRole === input.actingRole && !a.endedAt && a.from <= input.to && a.to >= input.from,
  );
  if (overlaps) throw new Error('This person already has an appointment for that role in these dates.');

  const appointment: ActingAppointment = {
    id: crypto.randomUUID(),
    personId: person.id,
    personName: person.name,
    actingRole: input.actingRole,
    from: input.from,
    to: input.to,
    reason: input.reason.trim(),
    createdAt: new Date().toISOString(),
    createdByName: input.actorName,
    endedAt: null,
    endedReason: null,
  };
  writeStore(ACTING_KEY, [...listAppointments(), appointment]);
  appendAuditEntry({
    recordType: ACTING_RECORD_TYPE,
    recordId: appointment.id,
    actorRole: input.actorRole,
    actorId: input.actorId,
    actorName: input.actorName,
    action: `Acting appointment: ${person.name} acts as ${roleLabel(input.actingRole)}, ${input.from} to ${input.to}`,
    note: appointment.reason,
  });
  addNotification({
    recipientRole: person.role,
    recipientPersonId: person.id,
    title: 'Acting appointment',
    body: `You act as ${roleLabel(input.actingRole)} from ${input.from} to ${input.to}. Switch to that role in the header. Reason: ${appointment.reason}`,
  });
  return appointment;
}

export function endAppointmentEarly(input: Actor & { id: string; reason: string }): void {
  if (!input.reason.trim()) throw new Error('A reason is required.');
  const all = listAppointments();
  const target = all.find((a) => a.id === input.id);
  if (!target || appointmentStatus(target) === 'past') throw new Error('That appointment has already ended.');
  writeStore(
    ACTING_KEY,
    all.map((a) => (a.id === input.id ? { ...a, endedAt: new Date().toISOString(), endedReason: input.reason.trim() } : a)),
  );
  appendAuditEntry({
    recordType: ACTING_RECORD_TYPE,
    recordId: input.id,
    actorRole: input.actorRole,
    actorId: input.actorId,
    actorName: input.actorName,
    action: `Acting appointment ended early: ${target.personName} as ${roleLabel(target.actingRole)}`,
    note: input.reason.trim(),
  });
  const person = getPerson(target.personId);
  if (person) {
    addNotification({
      recipientRole: person.role,
      recipientPersonId: person.id,
      title: 'Acting appointment ended',
      body: `Your appointment as ${roleLabel(target.actingRole)} was ended early. Reason: ${input.reason.trim()}`,
    });
  }
}
