import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { registrationStatusLabel, registrationStatusTone, type RegistrationStatusTone } from '../workflow';
import type { EisaRegistrationRecord } from '../types';

const TONE_CLASSES: Record<RegistrationStatusTone, string> = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};

export function RegistrationStatusBadge({ record }: { record: EisaRegistrationRecord }) {
  const tone = registrationStatusTone(record);
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap font-medium', TONE_CLASSES[tone])}>
      {registrationStatusLabel(record)}
    </Badge>
  );
}
