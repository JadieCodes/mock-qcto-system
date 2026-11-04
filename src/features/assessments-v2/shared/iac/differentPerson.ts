import { getAuditTrail } from '../audit/auditLog';
import type { Role } from '../../types';

// QCTO feedback 2.1 / 2.9, CR-053: the Director Office person must not be someone who already
// acted on the same record as one of `roles` (the ASD who evaluated or the DD who moderated).
// The workflow engine only compares against the last submitter, so this reads the audit trail.
export function hasActedInRoles(recordType: string, recordId: string, personId: string, roles: Role[]): boolean {
  return getAuditTrail(recordType, recordId).some((entry) => entry.actorId === personId && roles.includes(entry.actorRole));
}

export const DIRECTOR_OFFICE_DIFFERENT_PERSON_MESSAGE =
  'The Director Office quality assurance must be done by a different person from the ASD and Deputy Director on this record.';
