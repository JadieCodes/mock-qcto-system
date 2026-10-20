import { readStore, writeStore } from '../../mock/api/storage';
import type { AuditEntry } from './types';

const KEY = 'audit';

export function appendAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
  const full: AuditEntry = { ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
  const existing = readStore<AuditEntry[]>(KEY, []);
  writeStore(KEY, [...existing, full]);
  return full;
}

export function getAuditTrail(recordType?: string, recordId?: string): AuditEntry[] {
  const all = readStore<AuditEntry[]>(KEY, []);
  return all.filter(
    (e) => (recordType ? e.recordType === recordType : true) && (recordId ? e.recordId === recordId : true),
  );
}
