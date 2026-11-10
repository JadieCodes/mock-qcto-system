import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ClosingDate } from '../components/ClosingDate';
import { useResetClosingOverride, useSetClosingOverride } from '../hooks';
import { calcRegistrationClosingDate, closingDateOf } from '../registrationClosing';
import type { EisaSitting } from '../types';

// Batch S (05.11): the super admin changes one published sitting's registration closing date, or
// brings the calculated one back. A reason is required both ways; both are audited.
export function ClosingDateDialog({ sitting, onClose }: { sitting: EisaSitting | null; onClose: () => void }) {
  return (
    <Dialog open={!!sitting} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">{sitting && <ClosingDateForm key={sitting.id} sitting={sitting} onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}

function ClosingDateForm({ sitting, onClose }: { sitting: EisaSitting; onClose: () => void }) {
  const { role, person } = useV2Role();
  const setOverride = useSetClosingOverride();
  const resetOverride = useResetClosingOverride();
  const [date, setDate] = useState(closingDateOf(sitting));
  const [reason, setReason] = useState('');
  const calculated = calcRegistrationClosingDate(sitting.date, sitting.onDemand);
  const actor = { sittingId: sitting.id, reason, actorRole: role, actorId: person.id, actorName: person.name };
  const pending = setOverride.isPending || resetOverride.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Change registration closing date</DialogTitle>
        <DialogDescription>
          {sitting.qualificationTitle} — sitting on {sitting.date}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 text-sm">
        <p className="text-gray-600">
          Closes now: <span className="font-medium text-gray-900"><ClosingDate sitting={sitting} /></span>
          <span className="block text-xs text-gray-500">Calculated by the normal rule: {calculated}</span>
        </p>
        <div className="space-y-1">
          <Label htmlFor="closing-date">New closing date *</Label>
          <Input id="closing-date" type="date" value={date} max={sitting.date} onChange={(e) => setDate(e.target.value)} />
          <p className="text-xs text-gray-500">Earlier or later than calculated, but never after the sitting date ({sitting.date}).</p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="closing-reason">Reason *</Label>
          <Textarea id="closing-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is the date changing?" />
        </div>
      </div>
      <DialogFooter className="gap-2 sm:justify-between">
        {sitting.registrationClosingOverride ? (
          <Button
            variant="outline"
            disabled={pending || !reason.trim()}
            onClick={() => resetOverride.mutate(actor, { onSuccess: onClose })}
          >
            Reset to calculated
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending || !reason.trim() || !date} onClick={() => setOverride.mutate({ ...actor, date }, { onSuccess: onClose })}>
            Save closing date
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
