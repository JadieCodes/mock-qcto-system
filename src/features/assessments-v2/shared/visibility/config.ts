import type { ProcessStageTeam, Role } from '../../types';

// 09-visibility-matrix.md Table A (external portal). SDP additions beyond the existing
// CR-018 instrument-validation hide: qsa-addendum, eisa-confirmation, site-visits,
// approval-of-results, rpl-toolkit. QP additions: eisa-registration, fisa.
export const EXTERNAL_MODULE_HIDDEN_FOR_ROLE: Record<string, Role[]> = {
  'qsa-addendum': ['SDP'],
  'instrument-validation': ['SDP'], // CR-018
  'eisa-registration': ['QP'],
  'eisa-confirmation': ['SDP'],
  'site-visits': ['SDP'],
  'approval-of-results': ['SDP'],
  fisa: ['QP'],
  'rpl-toolkit': ['SDP'],
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
// [ASSUMPTION] the Assistant Director — the record's generator role — is the visibility
// owner, per the matrix's Section 1/Section 5 assumption. Still an open question for QCTO.
export const INTERNAL_MODULE_ROLE_OVERRIDE: Partial<Record<string, Role[]>> = {
  'eisa-confirmation': ['Assistant Director'],
};
