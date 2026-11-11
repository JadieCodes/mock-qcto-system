import { SUPER_ADMIN_ROLE } from '../../config/administration';
import { roleDescriptor } from '../../config/roles';
import type { Portal, Role } from '../../types';
import {
  EXTERNAL_MODULE_HIDDEN_FOR_ROLE,
  INTERNAL_MODULE_ROLE_OVERRIDE,
  INTERNAL_MODULE_TEAM,
  INTERNAL_SCHEDULE_ONLY_ROLES,
  MODULES_VISIBLE_TO_ALL_ROLES,
} from './config';

// ONE place that decides whether a role can see a module, for both portals. Used by the nav
// (shared/ui/AssessmentsV2Layout.tsx), the dashboard tiles (shared/ui/Dashboard.tsx) and the
// route guard (index.tsx's ModuleRoute) — a direct URL gets exactly the same answer the nav
// link would have given.
// Batch Z2: the role opens the module, but only to read its monthly schedule.
export function isScheduleOnlyAccess(portal: Portal, modulePath: string, role: Role): boolean {
  return portal === 'internal' && (INTERNAL_SCHEDULE_ONLY_ROLES[modulePath]?.includes(role) ?? false);
}

export function isModuleVisible(portal: Portal, modulePath: string, role: Role): boolean {
  if (modulePath === 'dashboard') return true;
  // Batch S: the Super Admin sees the Administration section and the EISA Calendar (closing dates), nothing else.
  if (role === SUPER_ADMIN_ROLE) return portal === 'internal' && (modulePath === 'eisa-calendar' || modulePath.startsWith('administration/'));
  if (MODULES_VISIBLE_TO_ALL_ROLES.includes(modulePath)) return true;

  if (portal === 'external') {
    return !EXTERNAL_MODULE_HIDDEN_FOR_ROLE[modulePath]?.includes(role);
  }

  if (isScheduleOnlyAccess(portal, modulePath, role)) return true;

  const override = INTERNAL_MODULE_ROLE_OVERRIDE[modulePath];
  if (override) return override.includes(role);

  const team = INTERNAL_MODULE_TEAM[modulePath];
  if (!team) return true; // no rule recorded for this module path — fail open, not closed
  return roleDescriptor(role)?.teams.includes(team) ?? false;
}
