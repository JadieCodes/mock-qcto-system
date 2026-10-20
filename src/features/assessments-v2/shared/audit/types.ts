import type { Role } from '../../types';

export interface AuditEntry {
  id: string;
  recordType: string;
  recordId: string;
  actorRole: Role;
  actorName: string;
  action: string;
  note?: string;
  timestamp: string;
}
