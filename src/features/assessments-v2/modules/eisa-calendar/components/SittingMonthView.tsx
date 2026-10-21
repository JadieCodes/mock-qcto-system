import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StatusLegend } from './StatusBadge';
import { STATUS_CLASSES } from './statusStyles';
import type { EisaSitting } from '../types';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// CR-033: month view of the visual calendar, with status colours.
export function SittingMonthView({ sittings, onSelectSitting }: { sittings: EisaSitting[]; onSelectSitting?: (sitting: EisaSitting) => void }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const byDate = useMemo(() => {
    const map = new Map<string, EisaSitting[]>();
    for (const sitting of sittings) {
      const existing = map.get(sitting.date);
      if (existing) existing.push(sitting);
      else map.set(sitting.date, [sitting]);
    }
    return map;
  }, [sittings]);

  const firstOfMonth = new Date(cursor.year, cursor.month, 1);
  const startWeekday = firstOfMonth.getDay();
  const totalDays = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = firstOfMonth.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

  const goToPreviousMonth = () => setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }));
  const goToNextMonth = () => setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }));

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <Button type="button" variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-semibold text-gray-900">{monthLabel}</p>
          <Button type="button" variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 border-b text-center text-xs font-semibold text-gray-400">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} className="h-24 border-b border-r bg-gray-50/40 last:border-r-0" />;
            const dateIso = `${cursor.year}-${pad(cursor.month + 1)}-${pad(day)}`;
            const daySittings = byDate.get(dateIso) ?? [];
            return (
              <div key={idx} className="h-24 border-b border-r p-1.5 overflow-hidden last:border-r-0">
                <p className="text-xs text-gray-400">{day}</p>
                <div className="mt-0.5 space-y-0.5">
                  {daySittings.slice(0, 3).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onSelectSitting?.(s)}
                      title={`${s.qualificationTitle} — ${s.status}`}
                      className={cn('block w-full truncate rounded border px-1 py-0.5 text-left text-[10px] font-medium', STATUS_CLASSES[s.status])}
                    >
                      {s.qualificationTitle}
                    </button>
                  ))}
                  {daySittings.length > 3 && <p className="text-[10px] text-gray-400">+{daySittings.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <StatusLegend />
    </div>
  );
}
