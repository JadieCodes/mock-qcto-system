import { useV2Role } from '../../../shared/ui/useV2Role';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { isScheduleOnlyAccess } from '../../../shared/visibility/moduleAccess';
import { VisitSchedulePanel } from '../components/VisitSchedulePanel';
import { InternalDashboard } from './InternalDashboard';

// Batch Z2 (11.9): the Director and the Chief Director see the Visit schedule and nothing else. No planning,
// no "Plan a New Visit", no visit records, and a row does not open a visit.
export function SiteVisitsInternal() {
  const { role } = useV2Role();
  if (!isScheduleOnlyAccess('internal', 'site-visits', role)) return <InternalDashboard />;
  return (
    <div className="space-y-6">
      <PageHeader title="Site Visits & Monitoring" description="The monthly visit schedule of each sub-unit, read-only." />
      <VisitSchedulePanel />
    </div>
  );
}
