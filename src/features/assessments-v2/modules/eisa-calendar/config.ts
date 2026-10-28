import type { Role } from '../../types';

// Open question (process-flow.md §9 / progress.md): the register names no specific role for
// the EISA Calendar, only "QCTO officials". Defaulting to the ASD, who already owns the two
// highway stages either side of it (QSA evaluation, instrument validation) — see config/roles.ts.
export const CALENDAR_REVIEWER_ROLE: Role = 'ASD';

// CR-033 assumption: how many days out a published sitting counts as an "approaching deadline".
export const UPCOMING_DEADLINE_WINDOW_DAYS = 14;

// QCTO feedback 1.8: assumption pending QCTO — sittings per year for a qualification that has
// no approved QASA recording its own frequency.
export const DEFAULT_SITTINGS_PER_YEAR = 2;

// QCTO feedback 3.5: assumption pending QCTO — registration closes this many calendar months
// before the sitting (moved back to the previous working day if that is a weekend or holiday).
export const REGISTRATION_CLOSING_MONTHS_BEFORE = 3;
