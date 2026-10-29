// CR-042/CR-044: an RPL/ARPL-flagged EISA Registration is the ONLY automatic trigger into
// Site Visits & Monitoring. That hub itself is built in Phase 5 — this is just the shared
// store for the one monitoring-item type that can be created before then. Phase 5 reads from
// this same `siteVisits:monitoringItems` key instead of inventing a second store.
import { readStore, writeStore } from './storage';

export interface RplArplMonitoringItem {
  id: string;
  visitType: 'rpl-arpl-monitoring';
  sourceRegistrationId: string;
  qualificationTitle: string;
  // Carried over from the registration (Phase 6 fix) instead of a placeholder.
  qpId: string;
  qpName: string;
  sdpId: string;
  sdpName: string;
  sittingDate: string;
  learnerNames: string[];
  createdBy: string;
  createdAt: string;
}

export const KEY = 'siteVisits:monitoringItems';

function loadAll(): RplArplMonitoringItem[] {
  return readStore<RplArplMonitoringItem[]>(KEY, []);
}

function saveAll(items: RplArplMonitoringItem[]): void {
  writeStore(KEY, items);
}

export async function createMonitoringItem(
  input: Omit<RplArplMonitoringItem, 'id' | 'createdAt' | 'visitType'>,
): Promise<RplArplMonitoringItem> {
  const item: RplArplMonitoringItem = { ...input, id: crypto.randomUUID(), visitType: 'rpl-arpl-monitoring', createdAt: new Date().toISOString() };
  saveAll([item, ...loadAll()]);
  return item;
}

export async function listMonitoringItems(): Promise<RplArplMonitoringItem[]> {
  return loadAll();
}
