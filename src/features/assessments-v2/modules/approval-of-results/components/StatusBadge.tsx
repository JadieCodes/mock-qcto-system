import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { resultsStatusLabel, resultsStatusTone, type ResultsStatusSource, type ResultsStatusTone } from '../workflow';
import { OverdueMark } from '../../../shared/administration/OverdueMark';
import { relabel } from '../../../shared/administration/roleLabels';

const TONE_CLASSES: Record<ResultsStatusTone, string> = {
  gray: 'bg-gray-50 text-gray-700 border-gray-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};

// Used for EISA and FISA results batches alike.
export function ResultsBatchStatusBadge({ batch }: { batch: ResultsStatusSource }) {
  const tone = resultsStatusTone(batch);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge variant="outline" className={cn('whitespace-nowrap font-medium', TONE_CLASSES[tone])}>{relabel(resultsStatusLabel(batch))}</Badge>
      <OverdueMark source="results" id={batch.id ?? ''} />
      <OverdueMark source="fisa-results" id={batch.id ?? ''} />
    </span>
  );
}
