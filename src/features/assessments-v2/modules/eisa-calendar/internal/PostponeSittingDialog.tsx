import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { EisaSitting } from '../types';

// Row 22/23 (D-11): postpone carries a mandatory reason plus an optional proposed new date —
// no negotiation, the ASD just states it and it's shown to the SDP/QP and in the audit trail.
export function PostponeSittingDialog({
  sitting,
  onOpenChange,
  onConfirm,
}: {
  sitting: EisaSitting | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, proposedNewDate: string | null) => void;
}) {
  const [reason, setReason] = useState('');
  const [proposedNewDate, setProposedNewDate] = useState('');

  const reset = () => {
    setReason('');
    setProposedNewDate('');
  };

  return (
    <Dialog
      open={!!sitting}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Postpone this sitting</DialogTitle>
          {sitting && (
            <DialogDescription>
              "{sitting.qualificationTitle}" on {sitting.date} — the affected SDPs and the QP will be notified.
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="postpone-reason">Reason *</Label>
            <Textarea id="postpone-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain why..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postpone-new-date">Proposed new date (optional)</Label>
            <Input id="postpone-new-date" type="date" value={proposedNewDate} onChange={(e) => setProposedNewDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!reason.trim()}
            onClick={() => {
              const r = reason.trim();
              const d = proposedNewDate.trim() || null;
              reset();
              onOpenChange(false);
              onConfirm(r, d);
            }}
          >
            Postpone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
