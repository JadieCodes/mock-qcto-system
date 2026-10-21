import type { RoleDescriptor } from '../types';

// CR-015: teams per role replace the old "QP portfolio ownership" assignment model.
export const ROLE_DESCRIPTORS: RoleDescriptor[] = [
  { role: 'QP', portal: 'external', label: 'Quality Partner (QP)', teams: [] },
  { role: 'SDP', portal: 'external', label: 'SDP', teams: [] },

  // CR-027/CR-032 open question: the register names no specific role for the EISA Calendar,
  // only "QCTO officials" — the ASD already owns the two stages either side of it on the
  // highway (QSA evaluation, instrument validation), so it picks up this team too.
  { role: 'ASD', portal: 'internal', label: 'ASD', teams: ['qsa-evaluation', 'instrument-validation', 'eisa-calendar', 'site-visits'] },
  { role: 'Assistant Director', portal: 'internal', label: 'Assistant Director', teams: ['registration', 'site-visits', 'fisa', 'approval-of-results'] },
  { role: 'Deputy Director', portal: 'internal', label: 'Deputy Director', teams: ['qsa-evaluation', 'site-visits', 'approval-of-results'] },
  { role: 'Director', portal: 'internal', label: 'Director', teams: ['approval-of-results'] },
  { role: 'Domain Director', portal: 'internal', label: 'Domain Director', teams: ['site-visits'] },
  { role: 'Chief Director', portal: 'internal', label: 'Chief Director', teams: ['approval-of-results'] },
  { role: 'IAC', portal: 'internal', label: 'IAC', teams: ['qsa-evaluation', 'rpl-toolkit', 'fisa'] },
  { role: 'CEO', portal: 'internal', label: 'CEO', teams: ['qsa-evaluation', 'rpl-toolkit'] },
  { role: 'Sub Domain Admin', portal: 'internal', label: 'Sub Domain Admin', teams: ['site-visits'] },
  { role: 'Director & Team', portal: 'internal', label: 'Director & Team', teams: ['rpl-toolkit'] },
  { role: 'Qualifications Development', portal: 'internal', label: 'Qualifications Development', teams: ['fisa'] },
];

export function rolesForPortal(portal: 'external' | 'internal'): RoleDescriptor[] {
  return ROLE_DESCRIPTORS.filter((r) => r.portal === portal);
}

export function roleDescriptor(role: string): RoleDescriptor | undefined {
  return ROLE_DESCRIPTORS.find((r) => r.role === role);
}
