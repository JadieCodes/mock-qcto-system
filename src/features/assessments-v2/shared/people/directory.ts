import { rolesForPortal } from '../../config/roles';
import { QP_DIRECTORY } from '../../mock/data/qpDirectory';
import { SDP_DIRECTORY } from '../../mock/data/sdpDirectory';
import { USERS } from '../../mock/data/users';
import type { Portal, Role } from '../../types';
import type { Person } from './types';

const INTERNAL_PEOPLE: Person[] = USERS.map((u) => ({
  id: u.id,
  name: u.name,
  role: u.role,
  portal: 'internal',
  teams: u.teams,
  managerId: u.managerId,
}));

const QP_PEOPLE: Person[] = QP_DIRECTORY.map((qp) => ({
  id: qp.qpId,
  name: qp.name,
  role: 'QP',
  portal: 'external',
  teams: [],
  qpId: qp.qpId,
}));

const SDP_PEOPLE: Person[] = SDP_DIRECTORY.map((sdp) => ({
  id: sdp.sdpId,
  name: sdp.name,
  role: 'SDP',
  portal: 'external',
  teams: [],
  sdpId: sdp.sdpId,
}));

export const ALL_PEOPLE: Person[] = [...INTERNAL_PEOPLE, ...QP_PEOPLE, ...SDP_PEOPLE];

export function personsForPortal(portal: Portal): Person[] {
  return ALL_PEOPLE.filter((p) => p.portal === portal);
}

export function personsForRole(role: Role): Person[] {
  return ALL_PEOPLE.filter((p) => p.role === role);
}

export function getPerson(id: string): Person | undefined {
  return ALL_PEOPLE.find((p) => p.id === id);
}

export function defaultPersonForRole(role: Role): Person {
  const person = personsForRole(role)[0];
  if (!person) throw new Error(`No seeded person for role "${role}".`);
  return person;
}

export function defaultPersonForPortal(portal: Portal): Person {
  for (const descriptor of rolesForPortal(portal)) {
    const person = personsForRole(descriptor.role)[0];
    if (person) return person;
  }
  throw new Error(`No seeded person for portal "${portal}".`);
}
