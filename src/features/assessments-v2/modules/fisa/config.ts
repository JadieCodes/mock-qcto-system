import type { Role } from '../../types';

// QCTO feedback 2.9 (29 Oct 2026): FISA Standards follow the QASA route. The Director Office
// quality-assures and approves for tabling, the Deputy Director presents at the IAC and records
// its outcome, and the CEO signs the outcome letter. This replaces PM-10's Qualifications
// Development sign-off.
export const FISA_DIRECTOR_OFFICE_ROLE: Role = 'Director & Team';
export const FISA_IAC_OUTCOME_RECORDER_ROLE: Role = 'Deputy Director';
export const FISA_OUTCOME_LETTER_SIGNER_ROLE: Role = 'CEO';

// PM-01/PM-11: a submitted FISA instrument is allocated to a named ASD. QCTO feedback 3.11
// (29 Oct 2026): the "Assistant Director" who used to allocate is the ASD, and the DD allocates
// work to the ASDs, so the DD allocates here. The DD only allocates — the outcome still goes
// straight from the ASD back to the SDP (PM-01).
export const FISA_VALIDATION_ALLOCATOR_ROLE: Role = 'Deputy Director';
