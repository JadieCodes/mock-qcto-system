import { cn } from '@/lib/utils';
import { useSdpMonitoringStatus } from '../hooks';

// Batch R1 (29.18): the SDP's QA monitoring status — one line, red when it blocks the
// registration number.
export function MonitoringStatusLine({ sdpName }: { sdpName: string }) {
  const { data: status } = useSdpMonitoringStatus(sdpName);
  if (!status) return null;
  return <p className={cn('font-medium', status.blocksRegistrationNumber ? 'text-red-700' : 'text-emerald-700')}>{status.text}</p>;
}
