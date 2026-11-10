import { useState } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LABELS } from '../../../config/labels';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterExternalRecords } from '../../../shared/visibility/recordVisibility';
import { RegistrationCloses } from '../components/RegistrationCloses';
import { minimumDateCount, requiredCountText } from '../api';
import { checkSittingDate } from '../dateChecks';
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
  const [dates, setDates] = useState<string[]>(['']);

  // QCTO feedback 1.8: only the qualifications under this QP's ambit with accredited SDPs.
  const eligible = filterExternalRecords(allEligible, person, { qpIdOf: (q) => q.qpId });
  const selected = eligible.find((q) => q.qualificationId === qualificationId);
  const requiredCount = selected?.sittingsPerYear ?? null;
  const onDemand = selected?.onDemand === true;
  const minimum = selected ? minimumDateCount(selected.sittingsPerYear, selected.onDemand) : 1;

  const onSelectQualification = (id: string) => {
    setQualificationId(id);
    const q = eligible.find((e) => e.qualificationId === id);
    const rows = q ? minimumDateCount(q.sittingsPerYear, q.onDemand) : 1;
    setDates((prev) => {
      const filled = prev.filter((d) => d.trim() !== '');
      return [...filled, ...Array<string>(Math.max(rows - filled.length, 0)).fill('')];
    });
  };

  const filledDates = dates.filter((d) => d.trim() !== '');
  const dateChecks = filledDates.map((d) => ({ date: d, result: checkSittingDate(d, undefined, onDemand) }));
  const yearMismatch = filledDates.filter((d) => Number(d.slice(0, 4)) !== year);
  const duplicates = filledDates.length !== new Set(filledDates).size;
  const countMatches = requiredCount != null && filledDates.length >= minimum;
  const allDatesOk = dateChecks.every((c) => c.result.ok);

  const resetAll = () => {
    setQualificationId('');
    setYear(YEAR_OPTIONS[0]);
    setDates(['']);
  };

  const canSubmit =
    !!selected && requiredCount != null && countMatches && allDatesOk && yearMismatch.length === 0 && !duplicates && filledDates.length > 0;

  const onSubmit = () => {
    if (!selected || !canSubmit) return;
    proposeBatch.mutate(
      {
        qualificationId: selected.qualificationId,
        qualificationTitle: selected.qualificationTitle,
        qpId: selected.qpId,
        qpName: selected.qpName,
        year,
        dates: filledDates,
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
            <div className="flex items-center justify-between">
              <Label>Proposed Dates *</Label>
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setDates((d) => [...d, ''])}>
                <Plus className="h-3.5 w-3.5" />
                Add date
              </Button>
            </div>
            <div className="space-y-2">
              {dates.map((d, idx) => {
                const check = d.trim() ? checkSittingDate(d, undefined, onDemand) : null;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={d}
                        onChange={(e) =>
                          setDates((prev) => prev.map((value, i) => (i === idx ? e.target.value : value)))
                        }
                      />
                      {idx >= minimum && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDates((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      )}
                    </div>
                    {/^\d{4}-\d{2}-\d{2}$/.test(d) && <RegistrationCloses sittingDate={d} passedNotice="full" onDemand={onDemand} />}
                    {check && !check.ok && <p className="text-xs text-red-600">{check.reasons.join(' ')}</p>}
                    {check && check.ok && Number(d.slice(0, 4)) !== year && (
                      <p className="text-xs text-red-600">This date is not in {year}.</p>
                    )}
                  </div>
                );
              })}
            </div>

            {requiredCount != null && filledDates.length > 0 && !countMatches && (
              <Alert className="border-amber-500 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  {selected?.onDemand
                    ? 'Enter at least one date.'
                    : `"${selected?.qualificationTitle}" requires ${requiredCount} sitting(s) per year — you have entered ${filledDates.length}.`}
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
