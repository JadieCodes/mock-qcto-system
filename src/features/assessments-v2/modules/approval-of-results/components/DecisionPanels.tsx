import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RESULTS_WORKFLOW } from '../workflow';
import type { DeclineRecommendation, ResultsFinalDecision } from '../types';

function stageName(stageId: string): string {
  return RESULTS_WORKFLOW.stages.find((s) => s.id === stageId)?.label ?? stageId;
}

// Batch N1: what the Deputy Director and the Director recommended while sending the batch on.
// Shown to the next role; only the Chief Director can make the decline final.
export function DeclineRecommendationsNotice({ recommendations, cycle }: { recommendations: DeclineRecommendation[]; cycle: number }) {
  const current = recommendations.filter((r) => r.cycle === cycle);
  if (current.length === 0) return null;
  return (
    <div className="space-y-1.5 rounded-xl border border-amber-300 bg-amber-50 p-3">
      <p className="text-xs font-semibold uppercase text-amber-800">Decline recommended</p>
      {current.map((r) => (
        <p key={`${r.stageId}-${r.recommendedAt}`} className="text-sm text-amber-900">
          <span className="font-medium">
            {r.recommendedBy} ({stageName(r.stageId)}):
          </span>{' '}
          {r.reason}
        </p>
      ))}
    </div>
  );
}

function linesOf(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

// Batch N1: "Decline results" (final), Chief Director only. Both lists need at least one line.
export function DeclineResultsForm({
  disabled,
  onDecline,
}: {
  disabled?: boolean;
  onDecline: (irregularities: string[], correctiveActions: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [irregularities, setIrregularities] = useState('');
  const [correctiveActions, setCorrectiveActions] = useState('');
  const ready = linesOf(irregularities).length > 0 && linesOf(correctiveActions).length > 0;

  if (!open) {
    return (
      <Button size="sm" variant="destructive" disabled={disabled} onClick={() => setOpen(true)}>
        Decline results
      </Button>
    );
  }
  return (
    <div className="w-full space-y-3 rounded-xl border border-red-200 bg-red-50 p-3">
      <p className="text-xs font-medium text-red-800">Decline results — final. The batch cannot be resubmitted; the learners rewrite at the next assessment.</p>
      <div className="space-y-1.5">
        <Label htmlFor="decline-irregularities">Irregularities * (one per line)</Label>
        <Textarea id="decline-irregularities" rows={3} value={irregularities} onChange={(e) => setIrregularities(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="decline-corrective-actions">Corrective actions * (one per line)</Label>
        <Textarea id="decline-corrective-actions" rows={3} value={correctiveActions} onChange={(e) => setCorrectiveActions(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          disabled={!ready || disabled}
          onClick={() => {
            onDecline(linesOf(irregularities), linesOf(correctiveActions));
            setOpen(false);
          }}
        >
          Confirm decline
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// The final decision on screen: the verification code, and for a decline the two lists.
export function FinalDecisionNotice({ decision }: { decision: ResultsFinalDecision }) {
  const declined = decision.outcome === 'declined';
  return (
    <div
      className={
        declined
          ? 'space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800'
          : 'space-y-1 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800'
      }
    >
      <p className="font-semibold">
        {declined ? 'Results declined' : 'Approved'} by {decision.decidedBy} on {decision.decidedAt.slice(0, 10)}.
      </p>
      <p>
        Verification code: <span className="font-mono">{decision.verificationCode}</span>
      </p>
      {declined && (
        <>
          <div>
            <p className="font-medium">Irregularities</p>
            <ol className="list-decimal pl-5">
              {decision.irregularities.map((line, i) => (
                <li key={`${line}-${i}`}>{line}</li>
              ))}
            </ol>
          </div>
          <div>
            <p className="font-medium">Corrective actions</p>
            <ol className="list-decimal pl-5">
              {decision.correctiveActions.map((line, i) => (
                <li key={`${line}-${i}`}>{line}</li>
              ))}
            </ol>
          </div>
          <p className="text-xs">This decline is final. There is no resubmit and no Post-EISA visit.</p>
        </>
      )}
    </div>
  );
}

// Batch N1: the two evidence dates QCTO tracks.
export function EvidenceDates({ requestedAt, receivedAt }: { requestedAt: string | null; receivedAt: string | null }) {
  if (!requestedAt) return null;
  return (
    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
      <p>
        <span className="text-xs uppercase text-gray-400">Date additional evidence requested</span>
        <span className="block font-medium">{requestedAt}</span>
      </p>
      <p>
        <span className="text-xs uppercase text-gray-400">Date final outstanding evidence received</span>
        <span className="block font-medium">{receivedAt ?? '—'}</span>
      </p>
    </div>
  );
}
