import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getAuditTrail } from '../../../shared/audit/auditLog';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { useEvaluationAction } from '../hooks';
import type { QsaAddendumApplication } from '../types';

// CR-012: corrections only ever travel DD -> ASD -> QP, so this panel is only actionable from
// the external portal as QP. Internal roles see it read-only (there is no DD -> QP shortcut).
export function CorrectionsPanel({ application }: { application: QsaAddendumApplication }) {
  const { role, portal, person } = useV2Role();
  const [response, setResponse] = useState('');
  const evaluationAction = useEvaluationAction();

  const latestNote = getAuditTrail('qsa-addendum-evaluation', application.id)
    .slice()
    .reverse()
    .find((entry) => entry.action === 'Return to QP for corrections')?.note;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
      <p className="text-sm font-semibold text-amber-800">Corrections requested</p>
      {latestNote && (
        <p className="text-sm text-amber-900 bg-white rounded-xl p-3 border border-amber-100 whitespace-pre-wrap">{latestNote}</p>
      )}
      {portal === 'external' && role === 'QP' ? (
        <div className="space-y-2">
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Describe what you changed (optional)..."
            rows={3}
          />
          <Button
            size="sm"
            disabled={evaluationAction.isPending}
            onClick={() =>
              evaluationAction.mutate({
                applicationId: application.id,
                actionId: 'eval-qp-resubmit',
                actorRole: role,
                actorId: person.id,
                actorName: person.name,
                note: response || undefined,
              })
            }
          >
            Resubmit to ASD
          </Button>
        </div>
      ) : (
        <p className="text-xs text-amber-700">Waiting for the QP to resubmit from the external portal.</p>
      )}
    </div>
  );
}
