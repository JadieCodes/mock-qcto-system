import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { overallStatusLabel, overallStatusTone, type SiteVisitStatusTone } from '../workflow';
import type { SiteVisit } from '../types';
import { OverdueMark } from '../../../shared/administration/OverdueMark';
import { relabel } from '../../../shared/administration/roleLabels';

const TONE_CLASSES: Record<SiteVisitStatusTone, string> = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};

// Row 37: pass forQp on every QP-facing render so a Post-EISA Monitoring outcome never leaks
// before the Deputy Director shares it.
export function SiteVisitStatusBadge({ visit, forQp }: { visit: SiteVisit; forQp?: boolean }) {
  const tone = overallStatusTone(visit, { forQp });
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge variant="outline" className={cn('whitespace-nowrap font-medium', TONE_CLASSES[tone])}>{relabel(overallStatusLabel(visit, { forQp }))}</Badge>
      <OverdueMark source="visit-planning" id={visit.id} />
      <OverdueMark source="visit-report" id={visit.id} />
    </span>
  );
}
