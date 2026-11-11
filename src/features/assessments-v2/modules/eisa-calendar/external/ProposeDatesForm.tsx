import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LABELS } from '../../../config/labels';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterExternalRecords } from '../../../shared/visibility/recordVisibility';
import { QasaSlotsNote, SittingDateCards } from '../components/SittingDateCards';
import { buildComponentDates, earliestDate, emptySitting, isSingleDateFallback, singleDateSlots, sittingsReady } from '../componentDays';
import { minimumDateCount, requiredCountText } from '../api';
import { useEligibleQualifications, useProposeSittingBatch } from '../hooks';

const YEAR_OPTIONS = [0, 1, 2].map((offset) => new Date().getFullYear() + offset);

// CR-029/CR-030/CR-032: the QP's in-system date-submission form. QCTO feedback 2.4: choosing a
// qualification pre-fills one row per required sitting (from the approved QASA); those rows
// cannot be removed, but more can be added. An "On demand" qualification needs one date.
export function ProposeDatesForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: allEligible = [] } = useEligibleQualifications();
  const { person } = useV2Role();
  const proposeBatch = useProposeSittingBatch();

  const [qualificationId, setQualificationId] = useState('');
  const [year, setYear] = useState<number>(YEAR_OPTIONS[0]);
  // Batch Q2: one entry per sitting, one date per component day of the QASA (slots).
  const [sittings, setSittings] = useState<string[][]>([['']]);

  // QCTO feedback 1.8: only the qualifications under this QP's ambit with accredited SDPs.
  const eligible = filterExternalRecords(allEligible, person, { qpIdOf: (q) => q.qpId });
  const selected = eligible.find((q) => q.qualificationId === qualificationId);
  const requiredCount = selected?.sittingsPerYear ?? null;
  const onDemand = selected?.onDemand === true;
  const minimum = selected ? minimumDateCount(selected.sittingsPerYear, selected.onDemand) : 1;
  const slots = selected?.componentSlots ?? singleDateSlots();

  const onSelectQualification = (id: string) => {
    setQualificationId(id);
    const q = eligible.find((e) => e.qualificationId === id);
    const rows = q ? minimumDateCount(q.sittingsPerYear, q.onDemand) : 1;
    const newSlots = q?.componentSlots ?? singleDateSlots();
    setSittings(Array.from({ length: rows }, () => emptySitting(newSlots)));
  };

  const starts = sittings.map((d) => earliestDate(d)).filter(Boolean);
  const duplicates = starts.length !== new Set(starts).size;
  const countMatches = requiredCount != null && sittings.length >= minimum;
  const ready = !!selected && sittingsReady(slots, sittings, year, onDemand, minimum);

  const resetAll = () => {
    setQualificationId('');
    setYear(YEAR_OPTIONS[0]);
    setSittings([['']]);
  };

  const canSubmit = ready && requiredCount != null && countMatches;

  const onSubmit = () => {
    if (!selected || !canSubmit) return;
    proposeBatch.mutate(
      {
        qualificationId: selected.qualificationId,
        qualificationTitle: selected.qualificationTitle,
        qpId: selected.qpId,
        qpName: selected.qpName,
        year,
        dates: sittings.map((d) => earliestDate(d)),
        sittings: isSingleDateFallback(slots) ? undefined : sittings.map((d) => ({ componentDates: buildComponentDates(slots, d) })),
        submittedBy: person.name,
        submittedById: person.id,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetAll();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetAll();
      }}
    >
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Propose EISA Sitting Dates</DialogTitle>
          <DialogDescription>Propose sitting dates for a qualification with accredited SDPs.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Qualification *</Label>
            <Select value={qualificationId} onValueChange={onSelectQualification}>
              <SelectTrigger>
                <SelectValue placeholder="Select a qualification" />
              </SelectTrigger>
              <SelectContent>
                {eligible.map((q) => (
                  <SelectItem key={q.qualificationId} value={q.qualificationId}>
                    {q.qualificationId} — {q.qualificationTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {eligible.length === 0 && (
              <p className="text-xs text-gray-400">No qualifications with accredited SDPs under your ambit yet.</p>
            )}
          </div>

          {selected && (
            <div className="rounded-xl border bg-gray-50 px-3 py-2 text-xs text-gray-600">
              QP: <span className="font-medium">{selected.qpName}</span> · Required sittings per year:{' '}
              <span className="font-medium">{requiredCountText(selected.sittingsPerYear, selected.onDemand)}</span>
              {selected.sittingsPerYearIsDefault && <span> (default)</span>}
              {onDemand && <span className="mt-1 block text-gray-700">{LABELS.eisaOnDemandHint}</span>}
            </div>
          )}

          <div className="space-y-2">
            <Label>Year *</Label>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {selected && <QasaSlotsNote slots={slots} />}
            <SittingDateCards
              slots={slots}
              sittings={sittings}
              onChange={setSittings}
              minimum={minimum}
              onDemand={onDemand}
              year={year}
              idPrefix="propose"
            />
            {requiredCount != null && !countMatches && (
              <Alert className="border-amber-500 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  {selected?.onDemand
                    ? 'Add at least one sitting.'
                    : `"${selected?.qualificationTitle}" requires ${requiredCount} sitting(s) per year — you have ${sittings.length}.`}
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
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!canSubmit || proposeBatch.isPending} onClick={onSubmit}>
            Submit for QCTO Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
