import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { rplOverallStatusLabel, rplOverallStatusTone, type RplStatusTone } from '../workflow';
import type { RplToolkitApplication } from '../types';
import { OverdueMark } from '../../../shared/administration/OverdueMark';
import { relabel } from '../../../shared/administration/roleLabels';

const TONE_CLASSES: Record<RplStatusTone, string> = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};

export function RplToolkitStatusBadge({ application }: { application: RplToolkitApplication }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge variant="outline" className={cn('whitespace-nowrap font-medium', TONE_CLASSES[rplOverallStatusTone(application)])}>{relabel(rplOverallStatusLabel(application))}</Badge>
      <OverdueMark source="rpl" id={application.id} />
      <OverdueMark source="rpl-letter" id={application.id} />
    </span>
  );
}
