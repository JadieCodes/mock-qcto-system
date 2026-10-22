import { useEffect, useState, type ReactNode } from 'react';
import { rolesForPortal } from '../../config/roles';
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
  const [personId, setPersonId] = useState<string>(() => resolveInitialPersonId(portal));

  useEffect(() => {
    try {
      localStorage.setItem(personStorageKey(portal), personId);
    } catch {
      // storage unavailable — identity stays in-memory for this session
    }
  }, [portal, personId]);

  const person = getPerson(personId) ?? defaultPersonForPortal(portal);

  const setRole = (nextRole: Role) => {
    setPersonId(defaultPersonForRole(nextRole).id);
  };

  return (
    <RoleContext.Provider value={{ portal, role: person.role, setRole, person, personId: person.id, setPersonId }}>
      {children}
    </RoleContext.Provider>
  );
}
