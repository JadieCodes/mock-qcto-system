import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { QasaSlotsNote, SittingDateCards } from '../components/SittingDateCards';
import { buildComponentDates, componentDaySlots, datesForSlots, earliestDate, emptySitting, isSingleDateFallback, singleDateSlots, sittingsReady, type ComponentDaySlot } from '../componentDays';
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
  const [slots, setSlots] = useState<ComponentDaySlot[] | null>(null);
  const [sittings, setSittings] = useState<string[][] | null>(null);
  // Batch Q2: the slots come from the approved QASA (loaded once); each sitting starts from the
  // component dates it was saved with, padded with blank sittings up to the required number.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const found = batch.qualificationId ? await componentDaySlots(batch.qualificationId) : singleDateSlots();
      if (cancelled) return;
      const existing = batch.dates.map((date, i) => datesForSlots(found, batch.sittings?.[i]?.componentDates, date));
      const padding = Array.from({ length: Math.max(minimum - existing.length, 0) }, () => emptySitting(found));
      setSlots(found);
      setSittings([...existing, ...padding]);
    })();
    return () => {
      cancelled = true;
    };
  }, [batch, minimum]);

  const activeSlots = slots ?? singleDateSlots();
  const activeSittings = sittings ?? [];
  const starts = activeSittings.map((d) => earliestDate(d)).filter(Boolean);
  const duplicates = starts.length !== new Set(starts).size;
  const countMatches = activeSittings.length >= minimum;
  const canSubmit = slots !== null && sittingsReady(activeSlots, activeSittings, batch.year, batch.onDemand === true, minimum);

  const onSubmit = () => {
    if (!canSubmit) return;
    const params = {
      batchId: batch.id,
      dates: activeSittings.map((d) => earliestDate(d)),
      sittings: isSingleDateFallback(activeSlots) ? undefined : activeSittings.map((d) => ({ componentDates: buildComponentDates(activeSlots, d) })),
      actorRole: role,
      actorId: person.id,
      actorName: person.name,
    };
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
            {slots && <QasaSlotsNote slots={slots} />}
            {sittings && (
              <SittingDateCards
                slots={activeSlots}
                sittings={sittings}
                onChange={setSittings}
                minimum={minimum}
                onDemand={batch.onDemand === true}
                year={batch.year}
                idPrefix="resubmit"
              />
            )}
            {sittings && !countMatches && (
              <Alert className="border-amber-500 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  {batch.onDemand
                    ? 'Add at least one sitting.'
                    : `"${batch.qualificationTitle}" requires ${batch.requiredCount} sitting(s) per year — you have ${activeSittings.length}.`}
                </AlertDescription>
              </Alert>
            )}
            {duplicates && (
              <Alert className="border-amber-500 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">Two sittings cannot start on the same date.</AlertDescription>
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
