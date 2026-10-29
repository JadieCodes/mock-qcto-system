import { readStore, writeStore } from '../../mock/api/storage';
import type { AppNotification } from './types';

export const KEY = 'notifications';

// Email/SMS are not built — in-app notifications only, per the module CLAUDE.md.
export function addNotification(notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): AppNotification {
  const full: AppNotification = {
    ...notification,
    id: crypto.randomUUID(),
    read: false,
    createdAt: new Date().toISOString(),
  };
  const existing = readStore<AppNotification[]>(KEY, []);
  writeStore(KEY, [full, ...existing]);
  return full;
}

export function getNotifications(recipientRole: string): AppNotification[] {
  return readStore<AppNotification[]>(KEY, []).filter((n) => n.recipientRole === recipientRole);
}

export function markNotificationRead(id: string): void {
  const all = readStore<AppNotification[]>(KEY, []);
  writeStore(KEY, all.map((n) => (n.id === id ? { ...n, read: true } : n)));
}
