import { calcRegistrationClosingDate, isRegistrationClosed } from '../registrationClosing';

// QCTO feedback 3.5: read-only "Registration closes" line, always calculated from the date.
// "full" explains the passed date on the propose form; "short" just flags it in tables.
export function RegistrationCloses({ sittingDate, passedNotice }: { sittingDate: string; passedNotice?: 'full' | 'short' }) {
  const closing = calcRegistrationClosingDate(sittingDate);
  const passed = isRegistrationClosed(sittingDate);
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
export function DatesWithClosing({ dates }: { dates: string[] }) {
  return (
    <div className="space-y-1">
      {dates.map((date) => (
        <div key={date} className="text-xs">
          <span className="font-medium text-gray-700">{date}</span>
          <RegistrationCloses sittingDate={date} passedNotice="short" />
        </div>
      ))}
    </div>
  );
}
