import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { overallStatusLabel, overallStatusTone, type InstrumentValidationStatusTone } from '../workflow';
import type { InstrumentValidationRecord } from '../types';

const TONE_CLASSES: Record<InstrumentValidationStatusTone, string> = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function InstrumentValidationStatusBadge({ record }: { record: InstrumentValidationRecord }) {
  const tone = overallStatusTone(record);
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap font-medium', TONE_CLASSES[tone])}>
      {overallStatusLabel(record)}
    </Badge>
  );
}
