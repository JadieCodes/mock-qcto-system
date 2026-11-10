import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { overallStatusLabel, overallStatusTone, type InstrumentValidationStatusTone } from '../workflow';
import type { InstrumentValidationRecord } from '../types';
import { OverdueMark } from '../../../shared/administration/OverdueMark';
import { relabel } from '../../../shared/administration/roleLabels';

const TONE_CLASSES: Record<InstrumentValidationStatusTone, string> = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function InstrumentValidationStatusBadge({ record }: { record: InstrumentValidationRecord }) {
  const tone = overallStatusTone(record);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge variant="outline" className={cn('whitespace-nowrap font-medium', TONE_CLASSES[tone])}>{relabel(overallStatusLabel(record))}</Badge>
      <OverdueMark source="iv" id={record.id} />
      <OverdueMark source="iv-scheduling" id={record.id} />
    </span>
  );
}
