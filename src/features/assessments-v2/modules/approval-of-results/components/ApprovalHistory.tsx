import { roleLabel } from '../../../shared/administration/roleLabels';
import { SectionCard } from '../../../shared/ui/PageSections';
import type { AuditEntry } from '../../../shared/audit/types';
import { approvalHistoryFromAudit, stageLabel } from '../downloads';
import type { ResultsDeclineEntry } from '../types';

const STAGES: { id: string; label: string }[] = [
  { id: 'ad-review', label: 'ASD' },
  { id: 'dd-review', label: 'Deputy Director' },
  { id: 'director-review', label: 'Director' },
  { id: 'chief-director-review', label: 'Chief Director' },
];

// Batch N.1: for each approval stage — who acted, when, and their comment — read from the audit
// trail (the deciding cycle), then any earlier requests for more evidence.
export function ApprovalHistory({
  audit,
  currentStageId,
  declineHistory,
}: {
  audit: AuditEntry[];
  currentStageId: string;
  declineHistory: ResultsDeclineEntry[];
}) {
  const done = approvalHistoryFromAudit(audit);
  return (
    <SectionCard title="History of each stage">
      <ul className="divide-y">
        {STAGES.map((stage) => {
          const step = done.find((d) => d.stageId === stage.id);
          return (
            <li key={stage.id} className="space-y-0.5 px-4 py-3 text-sm">
              <p className="font-medium text-gray-900">{stage.label}</p>
              {step ? (
                <>
                  <p className="text-gray-700">
                    {step.actorName} ({roleLabel(step.actorRole)}) on {step.date}
                  </p>
                  <p className="text-xs text-gray-500">Comment: {step.comment || 'None.'}</p>
                </>
              ) : (
                <p className="text-xs text-gray-500">{currentStageId === stage.id ? 'In progress.' : 'Not reached yet.'}</p>
              )}
            </li>
          );
        })}
      </ul>
      {declineHistory.length > 0 && (
        <div className="space-y-1 border-t bg-amber-50/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase text-amber-800">Earlier requests for more evidence</p>
          {declineHistory.map((d) => (
            <p key={`${d.stageId}-${d.decidedAt}`} className="text-sm text-amber-900">
              {stageLabel(d.stageId)} — {d.decidedBy} on {d.decidedAt.slice(0, 10)}: {d.reason}
            </p>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
