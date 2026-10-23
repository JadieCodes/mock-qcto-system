import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppNotification } from './types';

export function NotificationBanner({
  notifications,
  onDismiss,
}: {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}) {
  const unread = notifications.filter((n) => !n.read);
  if (unread.length === 0) return null;

  return (
    <div className="space-y-2">
      {unread.map((n) => (
        <div
          key={n.id}
          className={cn(
            'flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800',
          )}
        >
          <Bell className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{n.title}</p>
            <p className="text-blue-700">{n.body}</p>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(n.id)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
