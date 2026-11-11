import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toIsoDate } from '../../../shared/dates/workingDays';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { useRespondToVisitNotice } from '../hooks';
import { NOT_AVAILABLE_REASON_MESSAGE } from '../stakeholderResponse';
import type { SiteVisit } from '../types';

// Batch V2 (QCTO 29.36): "Accept the date" or "Not available" (a reason is required, a suggested date is
// optional). Used by the QP and the SDP on their Site Visits list, and by the ASD to record the answer of
// an assessment centre, which has no portal.
export function RespondToNotice({ visit, onBehalfOf }: { visit: SiteVisit; onBehalfOf?: string }) {
  const { role, person } = useV2Role();
  const respond = useRespondToVisitNotice();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const actor = { visitId: visit.id, actorRole: role, actorId: person.id, actorName: person.name };
  const forWhom = onBehalfOf ? ` for ${onBehalfOf}` : '';

  const submitNotAvailable = () => {
    if (!reason.trim()) {
      setReasonError(NOT_AVAILABLE_REASON_MESSAGE);
      return;
    }
    setReasonError(null);
    respond.mutate({ ...actor, answer: 'not-available', reason, suggestedDate }, { onSuccess: () => setDeclining(false) });
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <p className="text-sm text-amber-900">
        {onBehalfOf ? `${onBehalfOf} has no portal. Record whether it accepts ${visit.visitDate} or is not available.` : `Please confirm the visit date, ${visit.visitDate}.`}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="gap-2" disabled={respond.isPending} onClick={() => respond.mutate({ ...actor, answer: 'accepted' })}>
          <Check className="h-4 w-4" />
          Accept the date{forWhom}
        </Button>
        <Button size="sm" variant="outline" className="gap-2" disabled={respond.isPending} onClick={() => setDeclining((d) => !d)}>
          <X className="h-4 w-4" />
          Not available{forWhom}
        </Button>
      </div>
      {declining && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`not-available-reason-${visit.id}`}>Reason *</Label>
            <Textarea
              id={`not-available-reason-${visit.id}`}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why can the visit not take place on this date?"
            />
            {reasonError && (
              <p role="alert" className="text-xs text-red-600">
                {reasonError}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`not-available-date-${visit.id}`}>Suggested date (optional)</Label>
            <Input
              id={`not-available-date-${visit.id}`}
              type="date"
              min={toIsoDate(new Date())}
              value={suggestedDate}
              onChange={(e) => setSuggestedDate(e.target.value)}
              className="w-48"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" disabled={respond.isPending} onClick={submitNotAvailable}>
              Send: not available
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
