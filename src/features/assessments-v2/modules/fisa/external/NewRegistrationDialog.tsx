import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roleDescriptor } from '../../../config/roles';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { useStartFisaRegistration, useValidatedFisaInstruments } from '../hooks';

// A simplified version of EISA Registration (CR-026): no EISA Calendar sitting to publish
// against, so the SDP records the sitting date directly against a validated instrument.
export function NewRegistrationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { role } = useV2Role();
  const actorName = roleDescriptor(role)?.label ?? role;
  const { data: instruments = [] } = useValidatedFisaInstruments();
  const startRegistration = useStartFisaRegistration();

  const [fisaValidationId, setFisaValidationId] = useState('');
  const [sdpName, setSdpName] = useState('');
  const [sittingDate, setSittingDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!fisaValidationId && !!sdpName.trim() && !!sittingDate;

  const reset = () => {
    setFisaValidationId('');
    setSdpName('');
    setSittingDate('');
    setError(null);
  };

  const onSubmit = () => {
    if (!canSubmit) return;
    setError(null);
    startRegistration.mutate(
      { fisaValidationId, sdpName: sdpName.trim(), sittingDate, createdBy: actorName },
      { onSuccess: () => { onOpenChange(false); reset(); }, onError: (e: Error) => setError(e.message) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start FISA Registration</DialogTitle>
          <DialogDescription>Register learners for a FISA sitting against a validated FISA instrument.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Validated FISA Instrument *</Label>
            <Select value={fisaValidationId} onValueChange={setFisaValidationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a validated instrument" />
              </SelectTrigger>
              <SelectContent>
                {instruments.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.skillsProgrammeTitle} — {i.sdpName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {instruments.length === 0 && (
              <p className="text-xs text-gray-400">No validated instruments yet — complete FISA Instrument Validation first.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fisa-reg-sdp">SDP *</Label>
            <Input id="fisa-reg-sdp" value={sdpName} onChange={(e) => setSdpName(e.target.value)} placeholder="Enter SDP name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fisa-sitting-date">FISA Sitting Date *</Label>
            <Input id="fisa-sitting-date" type="date" value={sittingDate} onChange={(e) => setSittingDate(e.target.value)} />
          </div>

          {error && (
            <Alert className="border-red-400 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
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
