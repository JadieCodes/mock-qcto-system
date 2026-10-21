import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationBanner } from '../../../shared/notifications/NotificationBanner';
import { useNotifications } from '../../../shared/notifications/useNotifications';
import { SittingListView } from '../components/SittingListView';
import { SittingMonthView } from '../components/SittingMonthView';
import { UpcomingDeadlinesBanner } from '../components/UpcomingDeadlinesBanner';
import { useEisaSittings } from '../hooks';

// CR-018-style simplification: SDPs only see published/postponed/cancelled sittings — the
// internal review stages (proposed/approved/rejected) are a QP <-> QCTO matter.
const SDP_VISIBLE_STATUSES = new Set(['published', 'postponed', 'cancelled']);

export function SdpCalendarView() {
  const { data: sittings = [] } = useEisaSittings();
  const { notifications, dismiss } = useNotifications('SDP');
  const visible = sittings.filter((s) => SDP_VISIBLE_STATUSES.has(s.status));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">EISA Calendar</h2>
        <p className="text-sm text-gray-500 mt-1">Published EISA sitting dates.</p>
      </div>

      <NotificationBanner notifications={notifications} onDismiss={dismiss} />
      <UpcomingDeadlinesBanner sittings={sittings} />

      <Tabs defaultValue="month">
        <TabsList>
          <TabsTrigger value="month">Month View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        <TabsContent value="month" className="pt-4">
          <SittingMonthView sittings={visible} />
        </TabsContent>
        <TabsContent value="list" className="pt-4">
          <SittingListView sittings={visible} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
