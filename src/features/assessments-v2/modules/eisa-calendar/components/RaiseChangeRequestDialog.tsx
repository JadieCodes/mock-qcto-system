import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { changeRequestKindLabel } from '../changeRequests';
import { checkSittingDate } from '../dateChecks';
import { useRaiseChangeRequest } from '../hooks';
import type { ChangeRequestKind, EisaSitting, FormalLetterFile } from '../types';
import { letterSummary, toLetterFile } from './letterFile';
import { RegistrationCloses } from './RegistrationCloses';

export interface ChangeRequestTarget {
  sitting: EisaSitting;
  kind: ChangeRequestKind;
}

// QCTO feedback 2.4: the QP (own sittings) or the DD raises a postponement or cancellation
// request on a published sitting — reason and formal letter required for both.
export function RaiseChangeRequestDialog({ target, onClose }: { target: ChangeRequestTarget | null; onClose: () => void }) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {target && <RaiseChangeRequestForm key={`${target.sitting.id}-${target.kind}`} target={target} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function RaiseChangeRequestForm({ target, onClose }: { target: ChangeRequestTarget; onClose: () => void }) {
  const { role, person } = useV2Role();
  const raise = useRaiseChangeRequest();
  const [reason, setReason] = useState('');
  const [newDate, setNewDate] = useState('');
  const [letter, setLetter] = useState<FormalLetterFile | null>(null);
  const { sitting, kind } = target;
  const isPostponement = kind === 'postponement';
  const label = changeRequestKindLabel(kind);

  const dateCheck = isPostponement && newDate ? checkSittingDate(newDate) : null;
  const dateNotAfter = isPostponement && !!newDate && newDate <= sitting.date;
  const dateOk = !isPostponement || (!!newDate && !!dateCheck?.ok && !dateNotAfter);
  const canSubmit = !!reason.trim() && !!letter && dateOk;

  const onSubmit = () => {
    if (!canSubmit || !letter) return;
    raise.mutate(
      {
        kind,
        sittingId: sitting.id,
        proposedNewDate: isPostponement ? newDate : null,
        reason,
        letter,
        actorRole: role,
        actorId: person.id,
        actorName: person.name,
        actorQpId: person.qpId,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Request {label.toLowerCase()}</DialogTitle>
        <DialogDescription>
          "{sitting.qualificationTitle}" on {sitting.date}.{' '}
          {isPostponement ? 'The DD recommends and the Director decides.' : 'The DD and the Director recommend and the CEO decides.'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {isPostponement && (
          <div className="space-y-2">
            <Label htmlFor="request-new-date">Proposed new date *</Label>
            <Input id="request-new-date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            {/^\d{4}-\d{2}-\d{2}$/.test(newDate) && <RegistrationCloses sittingDate={newDate} passedNotice="short" />}
            {dateNotAfter && <p className="text-xs text-red-600">The new date must be after {sitting.date}.</p>}
            {dateCheck && !dateCheck.ok && <p className="text-xs text-red-600">{dateCheck.reasons.join(' ')}</p>}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="request-reason">Reason *</Label>
          <Textarea id="request-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="request-letter">Formal letter *</Label>
          <input
            id="request-letter"
            type="file"
            accept=".pdf,.doc,.docx"
            className="block text-sm"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              setLetter(file ? toLetterFile(file) : null);
            }}
          />
          {letter && <p className="text-xs text-gray-500">{letterSummary(letter)}</p>}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" disabled={!canSubmit || raise.isPending} onClick={onSubmit}>
          Send request
        </Button>
      </DialogFooter>
    </>
  );
}
