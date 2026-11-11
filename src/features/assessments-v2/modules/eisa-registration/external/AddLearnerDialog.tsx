import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toIsoDate } from '../../../shared/dates/workingDays';
import { useAccreditedCentres } from '../../eisa-confirmation/hooks';
import { compactDate, FLC_CODES, READINESS_TYPES, STATEMENT_STATUSES, type ReadinessInput } from '../readiness';

interface FormValues {
  readinessType: string;
  statementStatus: string;
  statementIssueDate: string;
  assessmentCentreCode: string;
  flc: string;
  flcStatementNumber: string;
  dateStamp: string;
}

const SELECT_CLASS = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

// Batch R2 (29.15, 29.17): adding one enrolled learner by hand. RPL or formal follows from the
// readiness type chosen here; there is no RPL/ARPL tick box any more.
export function AddLearnerDialog({
  learnerName,
  qualificationTitle,
  pending,
  onCancel,
  onSubmit,
}: {
  learnerName: string;
  qualificationTitle: string;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (readiness: ReadinessInput) => void;
}) {
  const { data: centres = [] } = useAccreditedCentres(qualificationTitle);
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { readinessType: '4', statementStatus: '01', statementIssueDate: '', assessmentCentreCode: '', flc: '', flcStatementNumber: '', dateStamp: toIsoDate(new Date()) },
  });

  const submit = handleSubmit((v) =>
    onSubmit({
      readinessType: v.readinessType,
      statementStatus: v.statementStatus,
      statementIssueDate: compactDate(v.statementIssueDate),
      assessmentCentreCode: v.assessmentCentreCode,
      flc: v.flc,
      flcStatementNumber: v.flcStatementNumber,
      dateStamp: compactDate(v.dateStamp),
    }),
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add {learnerName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="readinessType">Readiness for EISA</Label>
            <select id="readinessType" className={SELECT_CLASS} {...register('readinessType')}>
              {READINESS_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id} - {t.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">Types 2, 3 and 6 count as RPL/ARPL, the others as formal.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="statementStatus">Statement of Results status</Label>
              <select id="statementStatus" className={SELECT_CLASS} {...register('statementStatus')}>
                {STATEMENT_STATUSES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="statementIssueDate">Statement of Results issue date</Label>
              <Input id="statementIssueDate" type="date" {...register('statementIssueDate')} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="assessmentCentreCode">Assessment centre (optional)</Label>
            <select id="assessmentCentreCode" className={SELECT_CLASS} {...register('assessmentCentreCode')}>
              <option value="">None</option>
              {centres.map((c) => (
                <option key={c.centreId} value={c.centreId}>
                  {c.name} ({c.town})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="flc">FLC</Label>
              <select id="flc" className={SELECT_CLASS} {...register('flc')}>
                <option value="">Choose</option>
                {FLC_CODES.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.code} - {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="flcStatementNumber">FLC Statement of Result number</Label>
              <Input id="flcStatementNumber" placeholder="For RPL: RPL20261105" {...register('flcStatementNumber')} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="dateStamp">Date stamp</Label>
            <Input id="dateStamp" type="date" {...register('dateStamp')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              Add learner
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
