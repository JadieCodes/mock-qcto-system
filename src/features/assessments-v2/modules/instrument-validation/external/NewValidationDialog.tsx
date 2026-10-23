import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { useEligibleQsaAddenda, useStartValidation } from '../hooks';

// CR entry rule: a QP can only start a validation for a qualification whose QSA Addendum is
// Approved — the dropdown only ever lists those (`useEligibleQsaAddenda`).
export function NewValidationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { person } = useV2Role();
  const actorName = person.name;
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
      {
        qsaAddendumId: addendum.id,
        qpId: addendum.qpId,
        qpName: addendum.qpName,
        qualificationTitle: addendum.qualificationTitle,
        createdBy: actorName,
      },
      { onSuccess: close },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      size="sm"
      title="Start EISA Instrument Validation"
      description="Only qualifications with an Approved QSA Addendum can start a validation."
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button disabled={!selectedId || startValidation.isPending} onClick={onSubmit}>
            Start Validation
          </Button>
        </>
      }
    >
      {eligible.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">
          No qualifications are eligible yet — their QSA Addendum must be Approved first, and each addendum can only have one
          validation.
        </p>
      ) : (
        <div className="space-y-2">
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
    </Modal>
  );
}
