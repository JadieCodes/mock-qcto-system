import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import type { ValidationIssue } from '../../../shared/validation/types';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { useSittingsAwaitingSubmission, useSubmitResultsBatch } from '../hooks';
import { submissionDeadlineFor } from '../workflow';
import type { EisaConfirmationRecord } from '../../eisa-confirmation/types';
import type { EvidenceDocument, LearnerResultOutcome } from '../types';

const OUTCOME_OPTIONS: { value: LearnerResultOutcome; label: string }[] = [
  { value: 'competent', label: 'Competent' },
  { value: 'not-yet-competent', label: 'Not yet competent' },
];

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
  // Row 40: a result per learner, listed from the sitting's confirmed registrations — the
  // competent count (and the batch competency rate) comes from these, not a typed-in number.
  const [outcomes, setOutcomes] = useState<Record<string, LearnerResultOutcome | null>>(
    () => Object.fromEntries(sitting.learners.map((l) => [l.learnerId, null])),
  );
  const [evidenceDocuments, setEvidenceDocuments] = useState<EvidenceDocument[]>([]);

  // Fix 2A: the shared validation-summary shape, not a silently-disabled button.
  const issues: ValidationIssue[] = sitting.learners
    .filter((l) => !outcomes[l.learnerId])
    .map((l) => ({ field: l.learnerId, message: `${l.fullName} — select Competent or Not yet competent.` }));
  const allAnswered = issues.length === 0;

  const onSubmit = () => {
    if (!allAnswered) return;
    const learnerResults = sitting.learners.map((l) => ({ learnerId: l.learnerId, fullName: l.fullName, outcome: outcomes[l.learnerId]! }));
    submitBatch.mutate(
      { sittingId: sitting.sittingId, learnerResults, evidenceDocuments, submittedBy: actorName, submittedById: actorId },
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

        <div className="space-y-2">
          <Label>Learner Results *</Label>
          <div className="rounded-xl border divide-y max-h-64 overflow-y-auto">
            {sitting.learners.map((learner) => (
              <div key={learner.learnerId} className="flex items-center justify-between gap-3 p-2.5">
                <span className="text-sm text-gray-700 truncate">{learner.fullName}</span>
                <Select
                  value={outcomes[learner.learnerId] ?? undefined}
                  onValueChange={(v) => setOutcomes((prev) => ({ ...prev, [learner.learnerId]: v as LearnerResultOutcome }))}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Select a result" />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTCOME_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        <ValidationSummary issues={issues} title="Every learner needs a result before you can submit:" />

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
        <Button disabled={submitBatch.isPending || !allAnswered} onClick={onSubmit}>
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
