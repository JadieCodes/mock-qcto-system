import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { checkSittingDate } from '../dateChecks';
import { useEligibleQualifications } from '../hooks';
import type { EisaSitting } from '../types';

const YEAR_OPTIONS = [0, 1, 2].map((offset) => new Date().getFullYear() + offset);

// CR-027: QCTO can add or edit a sitting directly, at any time. The automatic date checks
// (CR-032) only produce a non-blocking warning here — QCTO is the authority, so they can
// override it, unlike a QP's proposal which is hard-blocked.
//
// The form only mounts while `open` is true, so closing the dialog unmounts it and discards
// whatever was typed — the next open always starts from `sitting`'s current values, with no
// reset effect needed.
export function AddEditSittingDialog({
  open,
  onOpenChange,
  sitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sitting: EisaSitting | null;
  onSubmit: (values: { qualificationTitle: string; qpId: string; qpName: string; year: number; date: string }) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{sitting ? 'Edit Sitting' : 'Add Sitting'}</DialogTitle>
          <DialogDescription>QCTO can add, edit or delete calendar sittings at any time.</DialogDescription>
        </DialogHeader>
        {open && (
          <AddEditSittingForm
            sitting={sitting}
            onCancel={() => onOpenChange(false)}
            onSubmit={(values) => {
              onSubmit(values);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddEditSittingForm({
  sitting,
  onCancel,
  onSubmit,
}: {
  sitting: EisaSitting | null;
  onCancel: () => void;
  onSubmit: (values: { qualificationTitle: string; qpId: string; qpName: string; year: number; date: string }) => void;
}) {
  const { data: eligible = [] } = useEligibleQualifications();
  const [qualificationTitle, setQualificationTitle] = useState(sitting?.qualificationTitle ?? '');
  const [qpId, setQpId] = useState(sitting?.qpId ?? '');
  const [qpName, setQpName] = useState(sitting?.qpName ?? '');
  const [year, setYear] = useState<number>(sitting?.year ?? YEAR_OPTIONS[0]);
  const [date, setDate] = useState(sitting?.date ?? '');

  const warning = date ? checkSittingDate(date) : null;
  const ready = qualificationTitle.trim() !== '' && qpName.trim() !== '' && date !== '';

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Qualification</Label>
          <Select
            value={qualificationTitle}
            onValueChange={(value) => {
              setQualificationTitle(value);
              const match = eligible.find((q) => q.qualificationTitle === value);
              if (match) {
                setQpName(match.qpName);
                setQpId(match.qpId);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a qualification with an approved QASA" />
            </SelectTrigger>
            <SelectContent>
              {eligible.map((q) => (
                <SelectItem key={q.qualificationTitle} value={q.qualificationTitle}>
                  {q.qualificationTitle}
                </SelectItem>
              ))}
              {sitting && !eligible.some((q) => q.qualificationTitle === sitting.qualificationTitle) && (
                <SelectItem value={sitting.qualificationTitle}>{sitting.qualificationTitle}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sitting-qp-name">QP</Label>
          <Input id="sitting-qp-name" value={qpName} onChange={(e) => setQpName(e.target.value)} placeholder="Name of QP" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Year</Label>
            <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
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
            <Label htmlFor="sitting-date">Date</Label>
            <Input id="sitting-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {warning && !warning.ok && (
          <Alert className="border-amber-500 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              This date would normally be auto-rejected: {warning.reasons.join(' ')} You can still save it — QCTO may override.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!ready}
          onClick={() => onSubmit({ qualificationTitle: qualificationTitle.trim(), qpId, qpName: qpName.trim(), year, date })}
        >
          {sitting ? 'Save Changes' : 'Add Sitting'}
        </Button>
      </DialogFooter>
    </>
  );
}
