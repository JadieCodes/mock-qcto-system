import { getAuditTrail } from '../../../shared/audit/auditLog';

// Row 18: shared between the internal workspace and the external QP view so both audit
// trail tabs show the same entries in the same shape.
export function InstrumentValidationAuditTrail({ recordId }: { recordId: string }) {
  const entries = [
    ...getAuditTrail('instrument-validation-scheduling', recordId),
    ...getAuditTrail('instrument-validation-validation', recordId),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  if (entries.length === 0) return <p className="text-xs text-gray-400">No actions recorded yet.</p>;

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-xl border bg-gray-50 px-3 py-2 text-xs">
          <p className="font-medium text-gray-700">
            {entry.action} — <span className="text-gray-500">{entry.actorName} ({entry.actorRole})</span>
          </p>
          {entry.note && <p className="text-gray-500 mt-0.5 whitespace-pre-wrap">{entry.note}</p>}
          <p className="text-gray-400 mt-0.5">{new Date(entry.timestamp).toLocaleString('en-ZA')}</p>
        </div>
      ))}
    </div>
  );
}
