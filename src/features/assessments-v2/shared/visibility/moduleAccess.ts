import { roleDescriptor } from '../../config/roles';
import type { Portal, Role } from '../../types';
import { EXTERNAL_MODULE_HIDDEN_FOR_ROLE, INTERNAL_MODULE_ROLE_OVERRIDE, INTERNAL_MODULE_TEAM } from './config';

// ONE place that decides whether a role can see a module, for both portals. Used by the nav
// (shared/ui/AssessmentsV2Layout.tsx), the dashboard tiles (shared/ui/Dashboard.tsx) and the
// route guard (index.tsx's ModuleRoute) — a direct URL gets exactly the same answer the nav
// link would have given.
export function isModuleVisible(portal: Portal, modulePath: string, role: Role): boolean {
  if (modulePath === 'dashboard') return true;

  if (portal === 'external') {
    return !EXTERNAL_MODULE_HIDDEN_FOR_ROLE[modulePath]?.includes(role);
  }

  const override = INTERNAL_MODULE_ROLE_OVERRIDE[modulePath];
  if (override) return override.includes(role);

  const team = INTERNAL_MODULE_TEAM[modulePath];
  if (!team) return true; // no rule recorded for this module path — fail open, not closed
  return roleDescriptor(role)?.teams.includes(team) ?? false;
}
