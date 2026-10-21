import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { STATUS_CLASSES, STATUS_LABELS } from './statusStyles';
import type { EisaSittingStatus } from '../types';

export function EisaSittingStatusBadge({ status }: { status: EisaSittingStatus }) {
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap font-medium', STATUS_CLASSES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function StatusLegend() {
  const statuses = Object.keys(STATUS_LABELS) as EisaSittingStatus[];
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => (
        <span key={s} className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', STATUS_CLASSES[s])}>
          {STATUS_LABELS[s]}
        </span>
      ))}
    </div>
  );
}
