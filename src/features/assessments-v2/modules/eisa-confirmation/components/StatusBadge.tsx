import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { confirmationStatusLabel, confirmationStatusTone, type ConfirmationStatusTone } from '../workflow';
import type { EisaConfirmationRecord } from '../types';

const TONE_CLASSES: Record<ConfirmationStatusTone, string> = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function ConfirmationStatusBadge({ record }: { record: EisaConfirmationRecord }) {
  const tone = confirmationStatusTone(record);
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap font-medium', TONE_CLASSES[tone])}>
      {confirmationStatusLabel(record)}
    </Badge>
  );
}
