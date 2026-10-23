import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SorStatus } from '../types';

// Row 25 (E-10): shown on the learner row for both the SDP and the Assistant Director, so
// both sides read the same status off the same field.
const LABELS: Record<SorStatus, string> = {
  uploaded: 'Uploaded',
  'under-review': 'Under review',
  accepted: 'Accepted',
  flagged: 'Flagged',
  replaced: 'Replaced',
};

const TONE_CLASSES: Record<SorStatus, string> = {
  uploaded: 'bg-blue-50 text-blue-700 border-blue-200',
  'under-review': 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  flagged: 'bg-red-50 text-red-700 border-red-200',
  replaced: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function SorStatusBadge({ status }: { status: SorStatus | null }) {
  if (!status) return <span className="text-xs text-gray-400">No SOR</span>;
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap text-xs font-medium', TONE_CLASSES[status])}>
      {LABELS[status]}
    </Badge>
  );
}
