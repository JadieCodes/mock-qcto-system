import type { InternalRole, ProcessStageTeam } from '../../types';

// Named demo users (09-visibility-matrix.md Section 3, approved). Two per internal role so
// CR-053's "a different person, not just a different role" and CR-055's "re-route to a named
// colleague" are actually demoable. managerId models the one explicit pairing the matrix called
// out (Grace Mokoena manages Sipho Ndlovu) plus the mirrored second pairing (Peter Botha / Thandeka Zulu).
export interface AppUser {
  id: string;
  name: string;
  role: InternalRole;
  teams: ProcessStageTeam[];
  managerId?: string;
}

const ASD_TEAMS: ProcessStageTeam[] = ['qsa-evaluation', 'instrument-validation', 'eisa-calendar', 'site-visits', 'fisa', 'rpl-toolkit'];
const AD_TEAMS: ProcessStageTeam[] = ['registration', 'site-visits', 'fisa', 'approval-of-results', 'rpl-toolkit'];
const DD_TEAMS: ProcessStageTeam[] = ['qsa-evaluation', 'site-visits', 'approval-of-results', 'fisa', 'rpl-toolkit'];

export const USERS: AppUser[] = [
  { id: 'sipho-ndlovu', name: 'Sipho Ndlovu', role: 'ASD', teams: ASD_TEAMS, managerId: 'grace-mokoena' },
  { id: 'thandeka-zulu', name: 'Thandeka Zulu', role: 'ASD', teams: ASD_TEAMS, managerId: 'peter-botha' },

  { id: 'lindiwe-khumalo', name: 'Lindiwe Khumalo', role: 'Assistant Director', teams: AD_TEAMS },
  { id: 'riaan-pretorius', name: 'Riaan Pretorius', role: 'Assistant Director', teams: AD_TEAMS },

  { id: 'grace-mokoena', name: 'Grace Mokoena', role: 'Deputy Director', teams: DD_TEAMS },
  { id: 'peter-botha', name: 'Peter Botha', role: 'Deputy Director', teams: DD_TEAMS },

  { id: 'zanele-mthembu', name: 'Zanele Mthembu', role: 'Director', teams: ['approval-of-results'] },
  { id: 'sarah-naidoo', name: 'Sarah Naidoo', role: 'Director', teams: ['approval-of-results'] },

  { id: 'michael-van-wyk', name: 'Michael van Wyk', role: 'Domain Director', teams: ['site-visits'] },
  { id: 'nokuthula-dube', name: 'Nokuthula Dube', role: 'Domain Director', teams: ['site-visits'] },

  { id: 'busisiwe-radebe', name: 'Busisiwe Radebe', role: 'Chief Director', teams: ['approval-of-results'] },
  { id: 'francois-le-roux', name: 'Francois Le Roux', role: 'Chief Director', teams: ['approval-of-results'] },

  { id: 'thabiso-molefe', name: 'Thabiso Molefe', role: 'IAC', teams: ['qsa-evaluation', 'rpl-toolkit', 'fisa'] },
  { id: 'palesa-nkosi', name: 'Palesa Nkosi', role: 'IAC', teams: ['qsa-evaluation', 'rpl-toolkit', 'fisa'] },

  { id: 'angela-fourie', name: 'Angela Fourie', role: 'CEO', teams: ['qsa-evaluation', 'rpl-toolkit'] },
  { id: 'david-molewa', name: 'David Molewa', role: 'CEO', teams: ['qsa-evaluation', 'rpl-toolkit'] },

  { id: 'karabo-sithole', name: 'Karabo Sithole', role: 'Sub Domain Admin', teams: ['site-visits'] },
  { id: 'katlego-mahlangu', name: 'Katlego Mahlangu', role: 'Sub Domain Admin', teams: ['site-visits'] },

  { id: 'elsabe-steyn', name: 'Elsabe Steyn', role: 'Director & Team', teams: ['rpl-toolkit'] },
  { id: 'johannes-pretorius', name: 'Johannes Pretorius', role: 'Director & Team', teams: ['rpl-toolkit'] },

  { id: 'fundiswa-ngcobo', name: 'Fundiswa Ngcobo', role: 'Qualifications Development', teams: ['fisa'] },
  { id: 'ayesha-patel', name: 'Ayesha Patel', role: 'Qualifications Development', teams: ['fisa'] },
];
