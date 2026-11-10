import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { useCreateFisaResultsBatch, useFisaStandardsForResults } from '../hooks';

// QCTO feedback 3.14: the SDP starts a FISA results batch for a skills programme whose FISA
// Standard is Approved. The batch opens as a draft ("Awaiting submission").
export function NewFisaResultsBatchDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (batchId: string) => void;
}) {
  const { person } = useV2Role();
  const { data: standards = [] } = useFisaStandardsForResults();
  const createBatch = useCreateFisaResultsBatch();
  const [fisaStandardId, setFisaStandardId] = useState('');
  const [fisaDate, setFisaDate] = useState('');

  const close = () => {
    onOpenChange(false);
    setFisaStandardId('');
    setFisaDate('');
  };

  const onCreate = () => {
    if (!fisaStandardId || !fisaDate) return;
    createBatch.mutate(
      { fisaStandardId, fisaDate, sdpId: person.sdpId ?? person.id, sdpName: person.name, createdBy: person.name, createdById: person.id },
      {
        onSuccess: (batch) => {
          close();
          onCreated(batch.id);
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      size="sm"
      title="New FISA Results Batch"
      description="Only skills programmes with an Approved FISA Standard can have results submitted."
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button disabled={!fisaStandardId || !fisaDate || createBatch.isPending} onClick={onCreate}>
            Create batch
          </Button>
        </>
      }
    >
      {standards.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">No skills programme has an Approved FISA Standard yet.</p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fisa-results-standard">Skills Programme *</Label>
            <Select value={fisaStandardId} onValueChange={setFisaStandardId}>
              <SelectTrigger id="fisa-results-standard">
                <SelectValue placeholder="Select a skills programme" />
              </SelectTrigger>
              <SelectContent>
                {standards.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.skillsProgrammeTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fisa-results-date">Date of the FISA *</Label>
            <Input id="fisa-results-date" type="date" value={fisaDate} onChange={(e) => setFisaDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>SDP</Label>
            <p className="text-sm font-medium">{person.name}</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
