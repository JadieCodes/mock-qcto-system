import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Reusable mandatory-reason dialog — reject/postpone/cancel actions across the domain all
// need a mandatory note (CR-032, CR-034, and CR-056's later send-back/reject actions).
export function ReasonDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  fieldLabel = 'Reason *',
  placeholder = 'Explain why...',
  destructive,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  fieldLabel?: string;
  placeholder?: string;
  destructive?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setReason('');
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason-dialog-textarea">{fieldLabel}</Label>
          <Textarea id="reason-dialog-textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={placeholder} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            disabled={!reason.trim()}
            onClick={() => {
              const value = reason.trim();
              setReason('');
              onOpenChange(false);
              onConfirm(value);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
