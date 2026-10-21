import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roleDescriptor } from '../../../config/roles';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { useEligibleQsaAddenda, useStartValidation } from '../hooks';

// CR entry rule: a QP can only start a validation for a qualification whose QSA Addendum is
// Approved — the dropdown only ever lists those (`useEligibleQsaAddenda`).
export function NewValidationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { role } = useV2Role();
  const actorName = roleDescriptor(role)?.label ?? role;
  const { data: eligible = [] } = useEligibleQsaAddenda();
  const [selectedId, setSelectedId] = useState('');
  const startValidation = useStartValidation();

  const close = () => {
    onOpenChange(false);
    setSelectedId('');
  };

  const onSubmit = () => {
    const addendum = eligible.find((a) => a.id === selectedId);
    if (!addendum) return;
    startValidation.mutate(
      { qsaAddendumId: addendum.id, qpName: addendum.qpName, qualificationTitle: addendum.qualificationTitle, createdBy: actorName },
      { onSuccess: close },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start EISA Instrument Validation</DialogTitle>
          <DialogDescription>Only qualifications with an Approved QSA Addendum can start a validation.</DialogDescription>
        </DialogHeader>

        {eligible.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            No qualifications are eligible yet — their QSA Addendum must be Approved first, and each addendum can only have one
            validation.
          </p>
        ) : (
          <div className="space-y-2 py-2">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a qualification" />
              </SelectTrigger>
              <SelectContent>
                {eligible.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.qualificationTitle} — {a.qpName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button disabled={!selectedId || startValidation.isPending} onClick={onSubmit}>
            Start Validation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
