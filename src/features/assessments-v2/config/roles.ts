import type { RoleDescriptor } from '../types';

// CR-015: teams per role replace the old "QP portfolio ownership" assignment model.
export const ROLE_DESCRIPTORS: RoleDescriptor[] = [
  { role: 'QP', portal: 'external', label: 'Quality Partner (QP)', teams: [] },
  { role: 'SDP', portal: 'external', label: 'SDP', teams: [] },

  // CR-027/CR-032 open question: the register names no specific role for the EISA Calendar,
  // only "QCTO officials" — the ASD already owns the two stages either side of it on the
  // highway (QSA evaluation, instrument validation), so it picks up this team too.
  {
    role: 'ASD',
    portal: 'internal',
    label: 'ASD',
    // CR-026/PM-09: ASD also evaluates FISA Standards and FISA/RPL Toolkit instruments.
    // QCTO feedback 3.11: the former "Assistant Director" role is the ASD, so its teams
    // (registration, approval-of-results) are the ASD's too.
    teams: ['qsa-evaluation', 'instrument-validation', 'eisa-calendar', 'registration', 'site-visits', 'approval-of-results', 'fisa', 'rpl-toolkit'],
  },
  {
    role: 'Deputy Director',
    portal: 'internal',
    label: 'Deputy Director',
    // CR-026/PM-09: reviews FISA Standards and RPL Toolkit evaluations too.
    // QCTO feedback 3.11: the DD allocates FISA instruments and RPL Toolkits to the ASDs.
    teams: ['qsa-evaluation', 'site-visits', 'approval-of-results', 'fisa', 'rpl-toolkit'],
  },
  { role: 'Director', portal: 'internal', label: 'Director', teams: ['approval-of-results'] },
  { role: 'Domain Director', portal: 'internal', label: 'Domain Director', teams: ['site-visits'] },
  { role: 'Chief Director', portal: 'internal', label: 'Chief Director', teams: ['approval-of-results'] },
  { role: 'IAC', portal: 'internal', label: 'IAC', teams: ['qsa-evaluation', 'rpl-toolkit', 'fisa'] },
  // QCTO feedback 2.9: the CEO also signs the FISA Standard outcome letter.
  { role: 'CEO', portal: 'internal', label: 'CEO', teams: ['qsa-evaluation', 'rpl-toolkit', 'fisa'] },
  { role: 'Sub Domain Admin', portal: 'internal', label: 'Sub Domain Admin', teams: ['site-visits'] },
  // QCTO feedback 2.1 / 2.9: the Director Office also quality-assures QASAs and FISA Standards before the IAC.
  { role: 'Director & Team', portal: 'internal', label: 'Director Office', teams: ['rpl-toolkit', 'qsa-evaluation', 'fisa'] },
  { role: 'Qualifications Development', portal: 'internal', label: 'Qualifications Development', teams: ['fisa'] },
  // Batch S (29.1, 29.2, 05.11) ASSUMPTION: QCTO still has to say who the super admin is. No process teams —
  // the role only sees Administration and sets a registration closing date in the EISA Calendar.
  { role: 'Super Admin', portal: 'internal', label: 'Super Admin', teams: [] },
];

export function rolesForPortal(portal: 'external' | 'internal'): RoleDescriptor[] {
  return ROLE_DESCRIPTORS.filter((r) => r.portal === portal);
}

export function roleDescriptor(role: string): RoleDescriptor | undefined {
  return ROLE_DESCRIPTORS.find((r) => r.role === role);
}
