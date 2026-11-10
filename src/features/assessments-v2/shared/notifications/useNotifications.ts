import { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead } from './store';
import type { AppNotification } from './types';

// Re-reads on mount and whenever the recipient role (or person) changes — enough for this demo,
// where one browser tab acts as a single user at a time via the role switcher (no live cross-tab
// sync). personId lets a message addressed to one named person (Batch S) reach only them.
export function useNotifications(recipientRole: string, personId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getNotifications(recipientRole, personId));

  useEffect(() => {
    setNotifications(getNotifications(recipientRole, personId));
  }, [recipientRole, personId]);

  const refresh = () => setNotifications(getNotifications(recipientRole, personId));

  const dismiss = (id: string) => {
    markNotificationRead(id);
    refresh();
  };

  return { notifications, dismiss, refresh };
}
