import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  fisaRegistrationStatusLabel,
  fisaRegistrationStatusTone,
  fisaStandardStatusLabel,
  fisaStandardStatusTone,
  fisaValidationStatusLabel,
  fisaValidationStatusTone,
  type FisaRegistrationStatusTone,
  type FisaStandardStatusTone,
  type FisaValidationStatusTone,
} from '../workflow';
import type { FisaRegistrationRecord, FisaStandardRecord, FisaValidationRecord } from '../types';

const TONE_CLASSES: Record<FisaStandardStatusTone | FisaValidationStatusTone | FisaRegistrationStatusTone, string> = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};

export function FisaStandardStatusBadge({ record }: { record: FisaStandardRecord }) {
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap font-medium', TONE_CLASSES[fisaStandardStatusTone(record)])}>
      {fisaStandardStatusLabel(record)}
    </Badge>
  );
}

export function FisaValidationStatusBadge({ record }: { record: FisaValidationRecord }) {
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap font-medium', TONE_CLASSES[fisaValidationStatusTone(record)])}>
      {fisaValidationStatusLabel(record)}
    </Badge>
  );
}

export function FisaRegistrationStatusBadge({ record }: { record: FisaRegistrationRecord }) {
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap font-medium', TONE_CLASSES[fisaRegistrationStatusTone(record)])}>
      {fisaRegistrationStatusLabel(record)}
    </Badge>
  );
}
