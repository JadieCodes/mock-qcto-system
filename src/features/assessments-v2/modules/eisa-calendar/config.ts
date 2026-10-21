import type { Role } from '../../types';

// Open question (process-flow.md §9 / progress.md): the register names no specific role for
// the EISA Calendar, only "QCTO officials". Defaulting to the ASD, who already owns the two
// highway stages either side of it (QSA evaluation, instrument validation) — see config/roles.ts.
export const CALENDAR_REVIEWER_ROLE: Role = 'ASD';

// CR-033 assumption: how many days out a published sitting counts as an "approaching deadline".
export const UPCOMING_DEADLINE_WINDOW_DAYS = 14;
