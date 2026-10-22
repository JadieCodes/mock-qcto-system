import type { Role } from '../../types';

export interface AuditEntry {
  id: string;
  recordType: string;
  recordId: string;
  actorRole: Role;
  // The named person who acted, not just their role label — every holder of a role used to
  // share one label, which made "who did this" unreadable and CR-053's "different person"
  // check unenforceable against two people with the same role.
  actorId: string;
  actorName: string;
  action: string;
  note?: string;
  timestamp: string;
}
