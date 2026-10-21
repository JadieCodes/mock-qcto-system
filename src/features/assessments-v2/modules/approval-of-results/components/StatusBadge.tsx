import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { resultsStatusLabel, resultsStatusTone, type ResultsStatusTone } from '../workflow';
import type { ResultsBatch } from '../types';

const TONE_CLASSES: Record<ResultsStatusTone, string> = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};

export function ResultsBatchStatusBadge({ batch }: { batch: ResultsBatch }) {
  const tone = resultsStatusTone(batch);
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap font-medium', TONE_CLASSES[tone])}>
      {resultsStatusLabel(batch)}
    </Badge>
  );
}
