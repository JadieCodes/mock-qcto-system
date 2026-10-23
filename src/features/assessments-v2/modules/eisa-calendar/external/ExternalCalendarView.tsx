import { useV2Role } from '../../../shared/ui/useV2Role';
import { QpCalendarView } from './QpCalendarView';
import { SdpCalendarView } from './SdpCalendarView';

// External portal has two roles here: the QP proposes dates, the SDP only views the published
// calendar and gets notified of changes (CR-018-style separation, same idea as Instrument
// Validation keeping SDPs out of the QP-only process).
export function ExternalCalendarView() {
  const { role } = useV2Role();
  return role === 'SDP' ? <SdpCalendarView /> : <QpCalendarView />;
}
