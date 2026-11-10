import type { Role } from '../types';

// Batch S ASSUMPTION: QCTO still has to say who the super admin is. One mock person holds the role.
export const SUPER_ADMIN_ROLE: Role = 'Super Admin';

// Batch S (29.2) ASSUMPTION, QCTO to confirm the number: an internal item that has waited at one
// stage longer than this many working days (SA public holidays skipped) is "Overdue".
export const ESCALATION_WORKING_DAYS = 3;

// Batch S (29.2) ASSUMPTION: who is told, once, when an item goes overdue. ASD -> DD -> Director ->
// Chief Director (CEO in the EISA Calendar, where the CEO decides cancellations). A role at the top
// of its chain has no next level, so the Super Admin is told instead.
export const ESCALATION_NEXT_ROLE: Partial<Record<Role, Role>> = {
  ASD: 'Deputy Director',
  'Deputy Director': 'Director',
  Director: 'Chief Director',
  'Sub Domain Admin': 'Domain Director',
  'Domain Director': 'Chief Director',
  'Director & Team': 'Chief Director',
  IAC: 'Chief Director',
  'Qualifications Development': 'Deputy Director',
};
export const ESCALATION_NEXT_ROLE_BY_MODULE: Record<string, Partial<Record<Role, Role>>> = {
  'eisa-calendar': { Director: 'CEO' },
};
export const ESCALATION_TOP_LEVEL_ROLE: Role = SUPER_ADMIN_ROLE;

// Nav paths of the Administration section (internal portal, Super Admin only).
export const ADMIN_PATHS = ['administration/role-names', 'administration/acting', 'administration/overdue'] as const;
