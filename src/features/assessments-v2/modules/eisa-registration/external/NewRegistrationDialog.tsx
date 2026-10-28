import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { listSdps } from '../../../mock/api/qaDomain';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { calcRegistrationClosingDate, isRegistrationClosed } from '../../eisa-calendar/registrationClosing';
import { useRegistrableSittings, useStartRegistration } from '../hooks';
import type { RegistrationCategory } from '../types';

// CR-024: only PUBLISHED sittings from the EISA Calendar can be registered against.
// CR-041: the SDP compliance check runs against the acting SDP's identity — a non-compliant
// SDP is visually blocked before it can even try to submit.
export function NewRegistrationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { person } = useV2Role();
  const { data: sittings = [] } = useRegistrableSittings();
  const { data: sdps = [] } = useQuery({ queryKey: ['eisa-registration', 'sdps'], queryFn: listSdps });
  const startRegistration = useStartRegistration();

  const [sittingId, setSittingId] = useState('');
  const [category, setCategory] = useState<RegistrationCategory>('trades');

  const selectedSdp = sdps.find((s) => s.sdpId === person.sdpId);
  const blocked = !!selectedSdp && !selectedSdp.compliant;
  const canSubmit = !!sittingId && !blocked;

  const reset = () => {
    setSittingId('');
    setCategory('trades');
  };

  const onSubmit = () => {
    if (!canSubmit) return;
    startRegistration.mutate(
      { sittingId, sdpId: person.sdpId ?? person.id, sdpName: person.name, category, createdBy: person.name, createdById: person.id },
      {
        onSuccess: () => {
          onOpenChange(false);
          reset();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start EISA Registration</DialogTitle>
          <DialogDescription>Register enrolled learners against a published EISA sitting.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>EISA Sitting *</Label>
            <Select value={sittingId} onValueChange={setSittingId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a published sitting" />
              </SelectTrigger>
              <SelectContent>
                {/* QCTO feedback 3.5: closed sittings stay listed, disabled, with their closing date. */}
                {sittings.map((s) => {
                  const closing = calcRegistrationClosingDate(s.date);
                  const closed = isRegistrationClosed(s.date);
                  return (
                    <SelectItem key={s.id} value={s.id} disabled={closed}>
                      {s.qualificationTitle} — {s.date} ·{' '}
                      {closed ? `Registration closed on ${closing}` : `Registration closes ${closing}`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {sittings.length === 0 && (
              <p className="text-xs text-gray-400">No published sittings yet — publish one on the EISA Calendar first.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>SDP</Label>
            <p className="text-sm font-medium py-2">{person.name}</p>
            <p className="text-xs text-gray-400">Registering as the acting SDP — switch person in the header to register as someone else.</p>
          </div>

          {blocked && (
            <Alert className="border-red-400 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                "{person.name}" is not compliant (simulated QA status) and is blocked from submitting an EISA registration.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Category *</Label>
            <RadioGroup value={category} onValueChange={(v) => setCategory(v as RegistrationCategory)} className="flex gap-6">
              <div className="flex items-center gap-1.5">
                <RadioGroupItem id="cat-trades" value="trades" />
                <Label htmlFor="cat-trades" className="text-sm font-normal">
                  Trades
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem id="cat-non-trades" value="non-trades" />
                <Label htmlFor="cat-non-trades" className="text-sm font-normal">
                  Non-Trades
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || startRegistration.isPending} onClick={onSubmit}>
            Start Registration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
