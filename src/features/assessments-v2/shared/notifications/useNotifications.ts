import { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead } from './store';
import type { AppNotification } from './types';

// Re-reads on mount and whenever the recipient role changes — enough for this demo, where one
// browser tab acts as a single user at a time via the role switcher (no live cross-tab sync).
export function useNotifications(recipientRole: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getNotifications(recipientRole));

  useEffect(() => {
    setNotifications(getNotifications(recipientRole));
  }, [recipientRole]);

  const refresh = () => setNotifications(getNotifications(recipientRole));

  const dismiss = (id: string) => {
    markNotificationRead(id);
    refresh();
  };

  return { notifications, dismiss, refresh };
}
