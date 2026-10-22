import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { useSittingsAwaitingSubmission, useSubmitResultsBatch } from '../hooks';
import { submissionDeadlineFor } from '../workflow';
import type { EisaConfirmationRecord } from '../../eisa-confirmation/types';
import type { EvidenceDocument } from '../types';

// The form only mounts while a sitting is selected, keyed by its id — closing (or switching
// sittings) unmounts it and discards whatever was typed, so the next open always starts fresh
// from that sitting's current values with no reset effect needed (same pattern as the EISA
// Calendar's AddEditSittingDialog).
function SubmitResultsBatchForm({
  sitting,
  actorId,
  actorName,
  onDone,
}: {
  sitting: EisaConfirmationRecord;
  actorId: string;
  actorName: string;
  onDone: () => void;
}) {
  const submitBatch = useSubmitResultsBatch();
  const [competentCount, setCompetentCount] = useState(sitting.learners.length);
  const [evidenceDocuments, setEvidenceDocuments] = useState<EvidenceDocument[]>([]);

  const onSubmit = () => {
    submitBatch.mutate(
      { sittingId: sitting.sittingId, competentCount, evidenceDocuments, submittedBy: actorName, submittedById: actorId },
      { onSuccess: onDone },
    );
  };

  return (
    <>
      <DialogDescription>
        {sitting.qualificationTitle} — sitting {sitting.sittingDate}
      </DialogDescription>

      <div className="space-y-4">
        <DeadlineBadge deadline={submissionDeadlineFor(sitting.sittingDate)} />

        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Total Registered Learners</Label>
          <p className="text-sm font-medium">{sitting.learners.length}</p>
        </div>

        <div className="space-y-2">
          <Label>Learners Found Competent *</Label>
          <Input
            type="number"
            min={0}
            max={sitting.learners.length}
            value={competentCount}
            onChange={(e) => setCompetentCount(Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label>Evidence Documents (optional)</Label>
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setEvidenceDocuments((prev) => [...prev, { fileName: file.name, fileSize: file.size, uploadedAt: new Date().toISOString() }]);
            }}
          />
          {evidenceDocuments.length > 0 && (
            <ul className="text-xs text-gray-500 space-y-0.5">
              {evidenceDocuments.map((d, i) => (
                <li key={i} className="font-mono">
                  {d.fileName}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button disabled={submitBatch.isPending || competentCount < 0 || competentCount > sitting.learners.length} onClick={onSubmit}>
          Submit
        </Button>
      </DialogFooter>
    </>
  );
}

// CR-059: the QP submits a results batch for a confirmed sitting — total learners is read
// from the EISA Confirmation record, the QP only enters how many were found competent and can
// attach evidence (UI-only file names, same pattern as every other upload in this domain).
export function SubmitResultsBatchDialog({ sittingId, onOpenChange }: { sittingId: string | null; onOpenChange: (open: boolean) => void }) {
  const { person } = useV2Role();
  const { data: awaiting = [] } = useSittingsAwaitingSubmission();
  const sitting = awaiting.find((s) => s.sittingId === sittingId);

  return (
    <Dialog open={!!sittingId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Results Batch</DialogTitle>
        </DialogHeader>
        {sitting && (
          <SubmitResultsBatchForm key={sitting.id} sitting={sitting} actorId={person.id} actorName={person.name} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
