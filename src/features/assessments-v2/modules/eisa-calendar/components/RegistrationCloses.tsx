import { componentDateLabel, earliestComponentDate } from '../componentDays';
import { checkSittingDate } from '../dateChecks';
import { calcRegistrationClosingDate, isRegistrationClosed } from '../registrationClosing';
import type { BatchSittingInput } from '../types';

// QCTO feedback 3.5: read-only "Registration closes" line, always calculated from the date.
// "full" explains the passed date on the propose form; "short" just flags it in tables.
export function RegistrationCloses({ sittingDate, passedNotice, onDemand }: { sittingDate: string; passedNotice?: 'full' | 'short'; onDemand?: boolean }) {
  const closing = calcRegistrationClosingDate(sittingDate, onDemand);
  const passed = isRegistrationClosed(sittingDate, undefined, onDemand);
  return (
    <span className="block text-xs text-gray-500">
      Registration closes: <span className="font-medium text-gray-700">{closing}</span>
      {passedNotice === 'short' && passed && <span className="text-amber-700"> (already passed)</span>}
      {passedNotice === 'full' && passed && (
        <span className="mt-1 block rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-amber-800">
          This closing date has already passed. You can still propose this date, but learners cannot be registered for it.
        </span>
      )}
    </span>
  );
}

// The batch tables list several dates in one cell — one line per date with its closing date.
// Batch Q2: a batch with component dates lists every component date of each sitting (with the
// per-date checks when `showChecks` is set, for the ASD's review), and the closing date comes
// from the sitting's earliest date.
export function DatesWithClosing({
  dates,
  sittings,
  onDemand,
  showChecks = false,
}: {
  dates: string[];
  sittings?: BatchSittingInput[];
  onDemand?: boolean;
  showChecks?: boolean;
}) {
  if (sittings?.length) {
    return (
      <div className="space-y-2">
        {sittings.map((sitting, i) => (
          <div key={i} className="space-y-0.5 text-xs">
            <p className="font-medium text-gray-700">Sitting {i + 1}</p>
            {sitting.componentDates.map((c) => {
              const check = showChecks ? checkSittingDate(c.date, undefined, onDemand === true) : null;
              return (
                <p key={`${c.componentId}-${c.day}`} className="text-gray-600">
                  {componentDateLabel(c)}: <span className="font-medium text-gray-800">{c.date}</span>
                  {check && (check.ok ? <span className="text-emerald-700"> — checks passed</span> : <span className="text-red-600"> — {check.reasons.join(' ')}</span>)}
                </p>
              );
            })}
            <RegistrationCloses sittingDate={earliestComponentDate(sitting.componentDates)} passedNotice="short" onDemand={onDemand} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      {dates.map((date) => (
        <div key={date} className="text-xs">
          <span className="font-medium text-gray-700">{date}</span>
          <RegistrationCloses sittingDate={date} passedNotice="short" onDemand={onDemand} />
        </div>
      ))}
    </div>
  );
}
