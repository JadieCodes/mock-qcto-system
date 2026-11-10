import { useState } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { RegistrationCloses } from '../components/RegistrationCloses';
import { checkSittingDate } from '../dateChecks';
import { minimumDateCount, requiredCountText } from '../api';
import { useEditBatch, useResubmitBatch } from '../hooks';
import type { EisaSittingBatch } from '../types';

export type BatchDialogMode = 'resubmit' | 'edit';

// Row 21 (D-08): lets the QP correct a rejected batch's dates and resubmit the same batch —
// the earlier rejection reason is shown here for context but is never cleared by this action.
// QCTO feedback 2.4: the same form edits a proposal that is not yet published ("edit" mode).
export function ResubmitBatchDialog({
  batch,
  mode = 'resubmit',
  onClose,
}: {
  batch: EisaSittingBatch | null;
  mode?: BatchDialogMode;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!batch} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        {batch && <ResubmitBatchForm key={`${batch.id}-${mode}`} batch={batch} mode={mode} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

// Mounted fresh per batch (keyed by id in the parent) instead of resetting its own state in
// an effect — same "mount-only-while-open" pattern as AddEditSittingDialog/SubmitResultsBatchDialog.
function ResubmitBatchForm({ batch, mode, onClose }: { batch: EisaSittingBatch; mode: BatchDialogMode; onClose: () => void }) {
  const { role, person } = useV2Role();
  const resubmit = useResubmitBatch();
  const editBatch = useEditBatch();
  const isPending = resubmit.isPending || editBatch.isPending;
  // QCTO feedback 2.4: the required rows cannot be removed; extra rows can.
  const minimum = minimumDateCount(batch.requiredCount, batch.onDemand);
  const [dates, setDates] = useState<string[]>(() => [...batch.dates, ...Array<string>(Math.max(minimum - batch.dates.length, 0)).fill('')]);

  const filledDates = dates.filter((d) => d.trim() !== '');
  const dateChecks = filledDates.map((d) => ({ date: d, result: checkSittingDate(d, undefined, batch.onDemand === true) }));
  const yearMismatch = filledDates.filter((d) => Number(d.slice(0, 4)) !== batch.year);
  const duplicates = filledDates.length !== new Set(filledDates).size;
  const countMatches = filledDates.length >= minimum;
  const allDatesOk = dateChecks.every((c) => c.result.ok);
  const canSubmit = countMatches && allDatesOk && yearMismatch.length === 0 && !duplicates;

  const onSubmit = () => {
    if (!canSubmit) return;
    const params = { batchId: batch.id, dates: filledDates, actorRole: role, actorId: person.id, actorName: person.name };
    if (mode === 'edit') {
      editBatch.mutate({ ...params, actorQpId: person.qpId }, { onSuccess: onClose });
    } else {
      resubmit.mutate(params, { onSuccess: onClose });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{mode === 'edit' ? 'Edit proposed sitting dates' : 'Correct & resubmit sitting dates'}</DialogTitle>
        <DialogDescription>
          "{batch.qualificationTitle}" ({batch.year}) — required sittings per year: {requiredCountText(batch.requiredCount, batch.onDemand)}
          {mode === 'edit' && batch.state.stageId === 'approved' && '. These dates were approved; editing them sends them back for review.'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
          {batch.rejectionHistory.length > 0 && (
            <div className="space-y-1">
              <Label>Previous rejection(s)</Label>
              <div className="space-y-1">
                {batch.rejectionHistory.map((entry, i) => (
                  <div key={i} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                    {entry.reason}
                    <span className="block text-red-500 mt-0.5">{new Date(entry.rejectedAt).toLocaleString('en-ZA')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{mode === 'edit' ? 'Dates *' : 'Corrected Dates *'}</Label>
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setDates((d) => [...d, ''])}>
                <Plus className="h-3.5 w-3.5" />
                Add date
              </Button>
            </div>
            <div className="space-y-2">
              {dates.map((d, idx) => {
                const check = d.trim() ? checkSittingDate(d, undefined, batch.onDemand === true) : null;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={d}
                        onChange={(e) => setDates((prev) => prev.map((value, i) => (i === idx ? e.target.value : value)))}
                      />
                      {idx >= minimum && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setDates((prev) => prev.filter((_, i) => i !== idx))}>
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      )}
                    </div>
                    {/^\d{4}-\d{2}-\d{2}$/.test(d) && <RegistrationCloses sittingDate={d} passedNotice="full" onDemand={batch.onDemand} />}
                    {check && !check.ok && <p className="text-xs text-red-600">{check.reasons.join(' ')}</p>}
                    {check && check.ok && Number(d.slice(0, 4)) !== batch.year && (
                      <p className="text-xs text-red-600">This date is not in {batch.year}.</p>
                    )}
                  </div>
                );
              })}
            </div>

            {filledDates.length > 0 && !countMatches && (
              <Alert className="border-amber-500 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  {batch.onDemand
                    ? 'Enter at least one date.'
                    : `"${batch.qualificationTitle}" requires ${batch.requiredCount} sitting(s) per year — you have entered ${filledDates.length}.`}
                </AlertDescription>
              </Alert>
            )}
            {duplicates && (
              <Alert className="border-amber-500 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">Duplicate dates are not allowed.</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" disabled={!canSubmit || isPending} onClick={onSubmit}>
          {mode === 'edit' ? 'Save and send for QCTO Review' : 'Resubmit for QCTO Review'}
        </Button>
      </DialogFooter>
    </>
  );
}
