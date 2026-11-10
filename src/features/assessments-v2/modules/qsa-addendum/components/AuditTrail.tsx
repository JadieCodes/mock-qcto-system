import { relabel, roleLabel } from '../../../shared/administration/roleLabels';
import { getAuditTrail } from '../../../shared/audit/auditLog';

// Row 14 (test findings): the audit trail lives in its own tab. QCTO feedback 05.8: internal
// only — the QP sees the Progress tab (components/QpProgress.tsx) instead.
export function QsaAuditTrail({ applicationId }: { applicationId: string }) {
  const entries = [
    ...getAuditTrail('qsa-addendum-acknowledgement', applicationId),
    ...getAuditTrail('qsa-addendum-evaluation', applicationId),
    ...getAuditTrail('qsa-addendum-outcome-letter', applicationId),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  if (entries.length === 0) return <p className="text-xs text-gray-400">No actions recorded yet.</p>;

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-xl border bg-gray-50 px-3 py-2 text-xs">
          <p className="font-medium text-gray-700">
            {relabel(entry.action)} — <span className="text-gray-500">{entry.actorName} ({roleLabel(entry.actorRole)})</span>
          </p>
          {entry.note && <p className="text-gray-500 mt-0.5 whitespace-pre-wrap">{entry.note}</p>}
          <p className="text-gray-400 mt-0.5">{new Date(entry.timestamp).toLocaleString('en-ZA')}</p>
        </div>
      ))}
    </div>
  );
}
