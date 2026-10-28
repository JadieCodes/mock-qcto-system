import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { useEligibleFisaStandards, useStartFisaValidation } from '../hooks';

// CR-026 entry rule: an SDP can only start developing an instrument against a Skills
// Programme whose FISA Standard is Approved (mirrors EISA Instrument Validation's entry rule).
export function NewValidationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { person } = useV2Role();
  const { data: eligible = [] } = useEligibleFisaStandards();
  const [fisaStandardId, setFisaStandardId] = useState('');
  const startValidation = useStartFisaValidation();

  const close = () => {
    onOpenChange(false);
    setFisaStandardId('');
  };

  const onSubmit = () => {
    if (!fisaStandardId) return;
    startValidation.mutate(
      { fisaStandardId, sdpId: person.sdpId ?? person.id, sdpName: person.name, createdBy: person.name },
      { onSuccess: close },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start FISA Instrument Development</DialogTitle>
          <DialogDescription>Only Skills Programmes with an Approved FISA Standard are eligible.</DialogDescription>
        </DialogHeader>

        {eligible.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            No Skills Programmes are eligible yet — their FISA Standard must be Approved first.
          </p>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Skills Programme *</Label>
              <Select value={fisaStandardId} onValueChange={setFisaStandardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a Skills Programme" />
                </SelectTrigger>
                <SelectContent>
                  {eligible.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.skillsProgrammeTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SDP</Label>
              <p className="text-sm font-medium py-2">{person.name}</p>
              <p className="text-xs text-gray-400">Developing as the acting SDP — switch person in the header to develop as someone else.</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button disabled={!fisaStandardId || startValidation.isPending} onClick={onSubmit}>
            Start
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
