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
