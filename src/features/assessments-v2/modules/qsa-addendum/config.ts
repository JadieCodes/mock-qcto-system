import type { Role } from '../../types';

// CR-007/CR-008 follow-up — open question: who signs the approval letter now that the CEO
// only signs the outcome letter? Defaulting to Deputy Director as the simplest reading;
// change here if QCTO confirms otherwise. Recorded as an open question in progress.md.
export const APPROVAL_LETTER_SIGNER_ROLE: Role = 'Deputy Director';
