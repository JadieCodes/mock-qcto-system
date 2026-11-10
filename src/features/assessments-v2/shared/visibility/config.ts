import type { ProcessStageTeam, Role } from '../../types';

// QCTO feedback 2.2 (replaces approved correction 6 in 09-visibility-matrix.md): modules every
// role on both portals can open. Only status-only views belong here.
export const MODULES_VISIBLE_TO_ALL_ROLES: string[] = ['qasa-status'];

// 09-visibility-matrix.md Table A (external portal). SDP additions beyond the existing
// CR-018 instrument-validation hide: qsa-addendum, eisa-confirmation, site-visits,
// rpl-toolkit (approval-of-results was hidden too until QCTO feedback 3.14). QP additions:
// eisa-registration, fisa.
export const EXTERNAL_MODULE_HIDDEN_FOR_ROLE: Record<string, Role[]> = {
  'qsa-addendum': ['SDP'],
  'instrument-validation': ['SDP'], // CR-018
  'eisa-registration': ['QP'],
  'eisa-confirmation': ['SDP'],
  // QCTO feedback 2.12 (replaces CR-047's "QP sees own visits"): visits are scheduled by QCTO,
  // so external Site Visits is hidden and blocked for every external role. The external screens
  // stay in modules/site-visits/external/ but are never reached.
  'site-visits': ['SDP', 'QP'],
  // Shared visit outcomes: the QP's read-only list of visits shared with them. Separate from
  // site-visits above, which stays hidden and blocked for the QP.
  'visit-outcomes': ['SDP'],
  // QCTO feedback 3.14: the SDP now opens Approval of Results too, but only its FISA tab
  // (APPROVAL_OF_RESULTS_EXTERNAL_TABS below).
  fisa: ['QP'],
  'rpl-toolkit': ['SDP'],
};

// QCTO feedback 3.14: Approval of Results has an EISA tab and a FISA tab. On the external
// portal each role sees only the track it submits: the QP submits EISA results, the SDP
// submits FISA results (FISA has no QP). Every internal role that can open the module sees both.
export const APPROVAL_OF_RESULTS_EXTERNAL_TABS: Partial<Record<Role, ('eisa' | 'fisa')[]>> = {
  QP: ['eisa'],
  SDP: ['fisa'],
};

// 09-visibility-matrix.md Table B (internal portal) — a role sees an internal module if the
// module's CR-015 process-stage team is one of that role's teams (config/roles.ts).
export const INTERNAL_MODULE_TEAM: Partial<Record<string, ProcessStageTeam>> = {
  'qsa-addendum': 'qsa-evaluation',
  'instrument-validation': 'instrument-validation',
  'eisa-calendar': 'eisa-calendar',
  'eisa-registration': 'registration',
  'site-visits': 'site-visits',
  'approval-of-results': 'approval-of-results',
  fisa: 'fisa',
  'rpl-toolkit': 'rpl-toolkit',
};

// EISA Confirmation has no CR-015 team (09-visibility-matrix.md Section 4, gap #8).
// [ASSUMPTION] the ASD — the record's generator role — is the visibility owner, per the
// matrix's Section 1/Section 5 assumption. Still an open question for QCTO.
export const INTERNAL_MODULE_ROLE_OVERRIDE: Partial<Record<string, Role[]>> = {
  'eisa-confirmation': ['ASD'],
  // QCTO feedback 3.8: the FISA Standards status list is for the Qualifications Development
  // domain only. Every role's access to the FISA module itself is unchanged.
  'fisa-status': ['Qualifications Development'],
  // QCTO feedback 2.4: the DD, Director and CEO act on postponement and cancellation requests.
  'eisa-calendar': ['ASD', 'Deputy Director', 'Director', 'CEO', 'Super Admin'],
  // Batch S: the Administration screens are the Super Admin's alone (config/administration.ts).
  'administration/role-names': ['Super Admin'],
  'administration/acting': ['Super Admin'],
  'administration/overdue': ['Super Admin'],
};
