import { RPL_TOOLKIT_ENABLED } from './featureFlags';
import type { Portal } from '../types';

export interface NavItem {
  path: string;
  label: string;
  comingInPhase?: number;
}

// Role-based hiding for every nav item now lives in ONE place:
// shared/visibility/moduleAccess.ts (isModuleVisible), backed by shared/visibility/config.ts's
// data tables — not scattered hiddenForRoles flags on individual NavItems.

export const INTERNAL_NAV: NavItem[] = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'qsa-addendum', label: 'QAS Addendum (QASA)' },
  { path: 'instrument-validation', label: 'EISA Instrument Validation' },
  // QCTO feedback 2.2: status only, visible to every role (shared/visibility/config.ts).
  { path: 'qasa-status', label: 'QASA Status and Approved Instruments' },
  { path: 'eisa-calendar', label: 'EISA Calendar' },
  { path: 'eisa-registration', label: 'Learner EISA Registration' },
  { path: 'eisa-confirmation', label: 'EISA Confirmation' },
  { path: 'site-visits', label: 'Site Visits & Monitoring' },
  { path: 'approval-of-results', label: 'Approval of Results' },
  // CR-026: fully independent of the EISA/QSA Addendum flow — never triggered by the SAQA gate check.
  { path: 'fisa', label: 'FISA' },
  // QCTO feedback 3.8: status only, Qualifications Development only (shared/visibility/config.ts).
  { path: 'fisa-status', label: 'FISA Standards Status' },
  // PM-09: not in the change request register yet — built behind a feature flag pending a raised CR.
  { path: 'rpl-toolkit', label: 'RPL Toolkit' },
];

// Batch S: the Super Admin's Administration section (shared/visibility/config.ts hides it from every other role).
export const ADMIN_NAV: NavItem[] = [
  { path: 'administration/role-names', label: 'Role names' },
  { path: 'administration/acting', label: 'Acting appointments' },
  { path: 'administration/overdue', label: 'Overdue items' },
];

export const EXTERNAL_NAV: NavItem[] = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'qsa-addendum', label: 'QAS Addendum (QASA)' },
  { path: 'instrument-validation', label: 'EISA Instrument Validation' },
  { path: 'qasa-status', label: 'QASA Status and Approved Instruments' },
  { path: 'eisa-calendar', label: 'EISA Calendar' },
  { path: 'eisa-registration', label: 'Learner EISA Registration' },
  { path: 'eisa-confirmation', label: 'EISA Confirmation' },
  { path: 'site-visits', label: 'Site Visits & Monitoring' },
  // Shared visit outcomes: a separate, read-only page for the QP (shared/visibility/config.ts).
  { path: 'visit-outcomes', label: 'Visit Outcomes' },
  { path: 'approval-of-results', label: 'Approval of Results' },
  { path: 'fisa', label: 'FISA' },
  { path: 'rpl-toolkit', label: 'RPL Toolkit' },
];

export function navForPortal(portal: Portal): NavItem[] {
  const items = portal === 'internal' ? [...INTERNAL_NAV, ...ADMIN_NAV] : EXTERNAL_NAV;
  // PM-09: hide the RPL Toolkit nav entry entirely (not just block the route) while the
  // feature flag is off — flip the flag once QCTO raises the change request.
  return RPL_TOOLKIT_ENABLED ? items : items.filter((item) => item.path !== 'rpl-toolkit');
}
