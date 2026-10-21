import type { Portal, Role } from '../types';

export interface NavItem {
  path: string;
  label: string;
  comingInPhase?: number;
  // CR-018: SDPs must not see EISA Instrument Validation at all — not even the nav link.
  hiddenForRoles?: Role[];
}

export const INTERNAL_NAV: NavItem[] = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'qsa-addendum', label: 'QSA Addendum' },
  { path: 'instrument-validation', label: 'EISA Instrument Validation' },
  { path: 'eisa-calendar', label: 'EISA Calendar' },
  { path: 'eisa-registration', label: 'EISA Registration' },
  { path: 'eisa-confirmation', label: 'EISA Confirmation' },
  { path: 'site-visits', label: 'Site Visits & Monitoring', comingInPhase: 5 },
  { path: 'approval-of-results', label: 'Approval of Results', comingInPhase: 6 },
  { path: 'fisa', label: 'FISA', comingInPhase: 7 },
  { path: 'rpl-toolkit', label: 'RPL Toolkit', comingInPhase: 7 },
];

export const EXTERNAL_NAV: NavItem[] = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'qsa-addendum', label: 'QSA Addendum' },
  { path: 'instrument-validation', label: 'EISA Instrument Validation', hiddenForRoles: ['SDP'] },
  { path: 'eisa-calendar', label: 'EISA Calendar' },
  { path: 'eisa-registration', label: 'EISA Registration' },
  { path: 'eisa-confirmation', label: 'EISA Confirmation' },
  { path: 'site-visits', label: 'Site Visits & Monitoring', comingInPhase: 5 },
];

export function navForPortal(portal: Portal): NavItem[] {
  return portal === 'internal' ? INTERNAL_NAV : EXTERNAL_NAV;
}
