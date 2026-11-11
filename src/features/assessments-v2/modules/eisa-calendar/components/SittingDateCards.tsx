import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { checkSittingComponentDates, earliestDate, emptySitting, isSingleDateFallback, NO_COMPONENT_DETAILS_NOTE, qasaSummary, type ComponentDaySlot } from '../componentDays';
import { RegistrationCloses } from './RegistrationCloses';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Batch Q2 (29.12): the QASA line above the sittings — its components and days, or the note that
// one date is asked per sitting.
export function QasaSlotsNote({ slots }: { slots: ComponentDaySlot[] }) {
  const summary = qasaSummary(slots);
  return <p className="text-xs text-gray-600">{summary ?? NO_COMPONENT_DETAILS_NOTE}</p>;
}

// One sitting: a date input per component day, the per-date checks, and the registration closing
// date worked out from the earliest date.
export function SittingDateCard({
  title,
  slots,
  dates,
  onChange,
  onRemove,
  onDemand,
  year,
  idPrefix,
  warnOnly = false,
}: {
  title?: string;
  slots: ComponentDaySlot[];
  dates: string[];
  onChange: (dates: string[]) => void;
  onRemove?: () => void;
  onDemand: boolean;
  year?: number;
  idPrefix: string;
  // QCTO adding a sitting directly may override a failed check, so it is shown as a warning.
  warnOnly?: boolean;
}) {
  // A blank slot is not an error on screen (the submit button stays off until it is filled).
  const errors = checkSittingComponentDates(slots, dates, undefined, onDemand);
  const earliest = earliestDate(dates);
  return (
    <div className="space-y-2 rounded-xl border bg-white p-3">
      {(title || onRemove) && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-800">{title}</p>
          {onRemove && (
            <Button type="button" variant="ghost" size="sm" aria-label={`Remove ${title ?? 'sitting'}`} onClick={onRemove}>
              <Trash2 className="h-4 w-4 text-gray-400" />
            </Button>
          )}
        </div>
      )}
      {slots.map((slot, i) => {
        const filled = (dates[i] ?? '').trim() !== '';
        const shown = filled ? errors[i] : [];
        const id = `${idPrefix}-${i}`;
        return (
          <div key={`${slot.componentId}-${slot.day}`} className="space-y-1">
            <Label htmlFor={id} className="text-xs">
              {slot.label}
            </Label>
            <Input id={id} type="date" value={dates[i] ?? ''} onChange={(e) => onChange(dates.map((d, j) => (j === i ? e.target.value : d)))} />
            {shown.length > 0 && <p className={warnOnly ? 'text-xs text-amber-700' : 'text-xs text-red-600'}>{shown.join(' ')}</p>}
          </div>
        );
      })}
      {ISO_DATE.test(earliest) && (
        <div>
          {!isSingleDateFallback(slots) && <span className="text-xs text-gray-500">From the earliest date, {earliest}. </span>}
          <RegistrationCloses sittingDate={earliest} passedNotice="full" onDemand={onDemand} />
        </div>
      )}
      {year !== undefined && ISO_DATE.test(earliest) && Number(earliest.slice(0, 4)) !== year && (
        <p className="text-xs text-red-600">The sitting must start in {year}.</p>
      )}
    </div>
  );
}

// A list of sitting cards, "Sitting 1, Sitting 2 …". The first `minimum` cannot be removed.
export function SittingDateCards({
  slots,
  sittings,
  onChange,
  minimum,
  onDemand,
  year,
  idPrefix,
}: {
  slots: ComponentDaySlot[];
  sittings: string[][];
  onChange: (sittings: string[][]) => void;
  minimum: number;
  onDemand: boolean;
  year: number;
  idPrefix: string;
}) {
  const starts = sittings.map((d) => earliestDate(d)).filter(Boolean);
  const duplicateStart = starts.length !== new Set(starts).size;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Sittings *</Label>
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => onChange([...sittings, emptySitting(slots)])}>
          <Plus className="h-3.5 w-3.5" />
          Add sitting
        </Button>
      </div>
      {sittings.map((dates, idx) => (
        <SittingDateCard
          key={idx}
          title={`Sitting ${idx + 1}`}
          slots={slots}
          dates={dates}
          year={year}
          onDemand={onDemand}
          idPrefix={`${idPrefix}-${idx}`}
          onChange={(next) => onChange(sittings.map((d, i) => (i === idx ? next : d)))}
          onRemove={idx >= minimum ? () => onChange(sittings.filter((_, i) => i !== idx)) : undefined}
        />
      ))}
      {duplicateStart && <p className="text-xs text-amber-700">Two sittings cannot start on the same date.</p>}
    </div>
  );
}
