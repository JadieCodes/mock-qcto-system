import { roleDescriptor } from '../../config/roles';
import { getAuditTrail } from './auditLog';

// recordId omitted shows every entry for the given record type(s) — used for a module-wide
// audit view (e.g. CR-034's "full audit trail" for the EISA Calendar).
export function AuditTrailView({ recordTypes, recordId }: { recordTypes: string[]; recordId?: string }) {
  const entries = recordTypes
    .flatMap((type) => getAuditTrail(type, recordId))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (entries.length === 0) return <p className="text-xs text-gray-400">No actions recorded yet.</p>;

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-xl border bg-gray-50 px-3 py-2 text-xs">
          <p className="font-medium text-gray-700">
            {entry.action} — <span className="text-gray-500">{entry.actorName} ({roleDescriptor(entry.actorRole)?.label ?? entry.actorRole})</span>
          </p>
          {entry.note && <p className="text-gray-500 mt-0.5 whitespace-pre-wrap">{entry.note}</p>}
          <p className="text-gray-400 mt-0.5">{new Date(entry.timestamp).toLocaleString('en-ZA')}</p>
        </div>
      ))}
    </div>
  );
}
