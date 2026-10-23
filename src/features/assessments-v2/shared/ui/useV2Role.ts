import { createContext, useContext } from 'react';
import type { Person } from '../people/types';
import type { Portal, Role } from '../../types';

// Split out of RoleContext.tsx so that file only exports the RoleProvider component —
// react-refresh/only-export-components flags a file that exports both a component and a
// hook/non-component value.
export interface RoleContextValue {
  portal: Portal;
  role: Role;
  setRole: (role: Role) => void;
  person: Person;
  personId: string;
  setPersonId: (id: string) => void;
}

export const RoleContext = createContext<RoleContextValue | null>(null);

export function useV2Role(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useV2Role must be used within a RoleProvider');
  return ctx;
}

// Logout: forget which named person was active for a portal, so the next visit to that
// portal falls back to its default person (mirrors RoleContext.tsx's personStorageKey
// format). Deliberately separate from mock/api/storage.ts's resetDemoData() — logging out
// must never touch assessmentsV2: record data, only this one "who am I" selection.
export function clearStoredPerson(portal: Portal): void {
  try {
    localStorage.removeItem(`assessmentsV2:activePersonId:v2:${portal}`);
  } catch {
    // storage unavailable — nothing persisted to clear
  }
}
