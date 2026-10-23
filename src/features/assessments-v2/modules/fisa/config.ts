// PM-10: final sign-off on FISA Standards is the Qualifications Development Director & Team —
// not the Assessments CEO. There is no separate role for "Director & Team" inside the
// Qualifications Development domain in this build, so the existing 'Qualifications Development'
// role (already wired to the 'fisa' team in config/roles.ts) performs both the initial
// document supply and this final sign-off.
export const FISA_STANDARD_SIGNOFF_ROLE = 'Qualifications Development' as const;

// PM-01/PM-11: the Assistant Director allocates a submitted FISA instrument to an ASD. This
// build has no individual logins, so "allocating to an ASD" is recorded as a free-text name
// for the audit trail/display rather than a real assignment to one of several ASD accounts.
export const FISA_VALIDATION_ALLOCATOR_ROLE = 'Assistant Director' as const;

export const FISA_REGISTRATION_NUMBER_PREFIX = 'FISA-REG';
