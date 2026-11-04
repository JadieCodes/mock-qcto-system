import type { Role } from '../../types';

// CR-007/CR-008 follow-up — answered (row 13, test findings): the Deputy Director signs the
// approval letter. Kept as a constant to change if QCTO ever names someone else.
export const APPROVAL_LETTER_SIGNER_ROLE: Role = 'Deputy Director';

// QCTO feedback 2.1: the Director Office quality-assures moderated QASAs and decides which go
// to the IAC. It is the same role (label "Director Office") that moderates RPL Toolkits.
export const QASA_DIRECTOR_OFFICE_ROLE: Role = 'Director & Team';

// QCTO feedback 2.1: the Deputy Director presents at the IAC and records the committee's
// outcome — the IAC itself does not act in the system.
export const IAC_OUTCOME_RECORDER_ROLE: Role = 'Deputy Director';

// Row 7 (test findings): which QSA checklist lines are "mandatory" for the automatic
// evaluation outcome — a "No" on any of these makes the outcome NEGATIVE. The register
// doesn't name a smaller mandatory subset, so this defaults to every line being mandatory
// (the same reading the test finding itself suggests: "any No on a mandatory line"). Change
// to a specific array of item ids if QCTO names a narrower set.
export const QSA_AUTO_EVALUATION_MANDATORY_ITEM_IDS: string[] | 'all' = 'all';

// QCTO feedback 1.4: on QASA screens the CEO-signed letter after the IAC decision is the
// "feedback letter". It still uses the shared `outcome` template, which RPL Toolkit shares.
export const FEEDBACK_LETTER_TITLE = 'Feedback Letter';
