import type { Role } from '../../types';

// QCTO feedback 2.9 (29 Oct 2026): FISA Standards follow the QASA route. The Director Office
// quality-assures and approves for tabling, the Deputy Director presents at the IAC and records
// its outcome, and the CEO signs the outcome letter. This replaces PM-10's Qualifications
// Development sign-off.
export const FISA_DIRECTOR_OFFICE_ROLE: Role = 'Director & Team';
export const FISA_IAC_OUTCOME_RECORDER_ROLE: Role = 'Deputy Director';
export const FISA_OUTCOME_LETTER_SIGNER_ROLE: Role = 'CEO';

// PM-01/PM-11: the Assistant Director allocates a submitted FISA instrument to an ASD. This
// build has no individual logins, so "allocating to an ASD" is recorded as a free-text name
// for the audit trail/display rather than a real assignment to one of several ASD accounts.
export const FISA_VALIDATION_ALLOCATOR_ROLE = 'Assistant Director' as const;
