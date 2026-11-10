import { closingDateOf, type ClosingSitting } from '../registrationClosing';

// Batch S (05.11): the registration closing date of one sitting. A date the super admin changed
// reads "<date> (changed by the super admin)" with the reason on hover or when expanded.
export function ClosingDate({ sitting }: { sitting: ClosingSitting }) {
  const date = closingDateOf(sitting);
  const override = sitting.registrationClosingOverride;
  if (!override) return <>{date}</>;
  return (
    <span title={`Reason: ${override.reason}`}>
      {date}{' '}
      <details className="inline align-top">
        <summary className="inline cursor-pointer text-xs font-medium text-amber-700">(changed by the super admin)</summary>
        <span className="block max-w-[260px] whitespace-normal text-xs font-normal text-gray-600">
          Reason: {override.reason}. Calculated date was {override.calculatedDate}.
        </span>
      </details>
    </span>
  );
}
