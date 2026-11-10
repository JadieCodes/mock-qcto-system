import { useEffect, useState, type ReactNode } from 'react';
import { rolesForPortal } from '../../config/roles';
import { activeActingRoles, actingName } from '../administration/acting';
import { defaultPersonForPortal, defaultPersonForRole, getPerson } from '../people/directory';
import type { Portal, Role } from '../../types';
import { RoleContext } from './useV2Role';

// Deliberately separate from the app-wide AppContext: the v2 CLAUDE.md only allows importing
// components/ui/*, lib/utils and npm packages from outside this folder. AppContext.currentRole
// is a single value shared by every domain in the app — reusing it here would mean switching
// identity in v2 changes the active role everywhere else too. This context is scoped to v2 only.

// Identity is now a named person, not just a role — a role alone can't tell two Deputy
// Directors apart, which is what CR-053 ("a different person must approve") and CR-055
// ("re-route to a named colleague") actually need. The storage key is versioned so the old
// role-only value (assessmentsV2:currentRole:{portal}) migrates to a default person for that
// role instead of crashing the app on load.
const STORAGE_VERSION = 'v2';

function personStorageKey(portal: Portal) {
  return `assessmentsV2:activePersonId:${STORAGE_VERSION}:${portal}`;
}

function actingStorageKey(portal: Portal) {
  return `assessmentsV2:actingRole:${STORAGE_VERSION}:${portal}`;
}

function resolveInitialActingRole(portal: Portal): Role | null {
  try {
    return (localStorage.getItem(actingStorageKey(portal)) as Role | null) || null;
  } catch {
    return null;
  }
}

function legacyRoleStorageKey(portal: Portal) {
  return `assessmentsV2:currentRole:${portal}`;
}

function resolveInitialPersonId(portal: Portal): string {
  try {
    const storedPersonId = localStorage.getItem(personStorageKey(portal));
    if (storedPersonId && getPerson(storedPersonId)?.portal === portal) {
      return storedPersonId;
    }

    const legacyRole = localStorage.getItem(legacyRoleStorageKey(portal));
    if (legacyRole && rolesForPortal(portal).some((r) => r.role === legacyRole)) {
      return defaultPersonForRole(legacyRole as Role).id;
    }
  } catch {
    // storage unavailable — fall through to the default
  }
  return defaultPersonForPortal(portal).id;
}

export function RoleProvider({ portal, children }: { portal: Portal; children: ReactNode }) {
  const [personId, setPersonIdState] = useState<string>(() => resolveInitialPersonId(portal));
  const [storedActingRole, setActingRole] = useState<Role | null>(() => resolveInitialActingRole(portal));

  const basePerson = getPerson(personId) ?? defaultPersonForPortal(portal);
  // An appointment ends by itself after its end date, so the acting role is re-checked on every
  // render and quietly dropped once it is no longer active.
  const actingRole =
    storedActingRole && storedActingRole !== basePerson.role && activeActingRoles(basePerson.id).includes(storedActingRole)
      ? storedActingRole
      : null;

  useEffect(() => {
    try {
      localStorage.setItem(personStorageKey(portal), personId);
      if (actingRole) localStorage.setItem(actingStorageKey(portal), actingRole);
      else localStorage.removeItem(actingStorageKey(portal));
    } catch {
      // storage unavailable — identity stays in-memory for this session
    }
  }, [portal, personId, actingRole]);

  const effectiveRole = actingRole ?? basePerson.role;
  const person = actingRole ? { ...basePerson, role: actingRole, name: actingName(basePerson.name, actingRole) } : basePerson;

  const setRole = (nextRole: Role) => {
    if (nextRole === basePerson.role) {
      setActingRole(null);
    } else if (activeActingRoles(basePerson.id).includes(nextRole)) {
      setActingRole(nextRole);
    } else {
      setActingRole(null);
      setPersonIdState(defaultPersonForRole(nextRole).id);
    }
  };

  // Picking someone who is only here through an acting appointment keeps the role chosen above.
  const setPersonId = (id: string) => {
    const picked = getPerson(id);
    setPersonIdState(id);
    setActingRole(picked && picked.role !== effectiveRole && activeActingRoles(id).includes(effectiveRole) ? effectiveRole : null);
  };

  return (
    <RoleContext.Provider value={{ portal, role: effectiveRole, setRole, person, basePerson, actingRole, personId: basePerson.id, setPersonId }}>
      {children}
    </RoleContext.Provider>
  );
}
