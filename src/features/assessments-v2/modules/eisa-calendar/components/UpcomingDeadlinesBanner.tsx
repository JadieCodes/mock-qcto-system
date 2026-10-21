import { AlertTriangle } from 'lucide-react';
import { toIsoDate } from '../../../shared/dates/workingDays';
import { UPCOMING_DEADLINE_WINDOW_DAYS } from '../config';
import type { EisaSitting } from '../types';

// CR-033: in-app banner for approaching deadlines — purely derived from published sittings,
// not a stored notification (those are for one-off events like a rejection or postponement).
export function UpcomingDeadlinesBanner({ sittings }: { sittings: EisaSitting[] }) {
  const today = toIsoDate(new Date());
  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + UPCOMING_DEADLINE_WINDOW_DAYS);
  const windowEndIso = toIsoDate(windowEnd);

  const upcoming = sittings
    .filter((s) => s.status === 'published' && s.date >= today && s.date <= windowEndIso)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (upcoming.length === 0) return null;

  return (
    <div className="space-y-2">
      {upcoming.map((s) => {
        const daysAway = Math.round(
          (new Date(`${s.date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86_400_000,
        );
        return (
          <div key={s.id} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>
              <span className="font-semibold">{s.qualificationTitle}</span> sitting on {s.date} is in {daysAway} day
              {daysAway === 1 ? '' : 's'}.
            </p>
          </div>
        );
      })}
    </div>
  );
}
