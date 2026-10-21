import { useEffect, useState, type ReactNode } from 'react';
import { rolesForPortal } from '../../config/roles';
import type { Portal, Role } from '../../types';
import { RoleContext } from './useV2Role';

// Deliberately separate from the app-wide AppContext: the v2 CLAUDE.md only allows importing
// components/ui/*, lib/utils and npm packages from outside this folder. AppContext.currentRole
// is a single value shared by every domain in the app — reusing it here would mean switching
// role in v2 changes the active role everywhere else too. This context is scoped to v2 only.

function storageKey(portal: Portal) {
  return `assessmentsV2:currentRole:${portal}`;
}

export function RoleProvider({ portal, children }: { portal: Portal; children: ReactNode }) {
  const available = rolesForPortal(portal);
  const [role, setRole] = useState<Role>(() => {
    try {
      const stored = localStorage.getItem(storageKey(portal));
      if (stored && available.some((r) => r.role === stored)) return stored as Role;
    } catch {
      // ignore, fall through to default
    }
    return available[0].role;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(portal), role);
    } catch {
      // storage unavailable — role stays in-memory for this session
    }
  }, [portal, role]);

  return <RoleContext.Provider value={{ portal, role, setRole }}>{children}</RoleContext.Provider>;
}
