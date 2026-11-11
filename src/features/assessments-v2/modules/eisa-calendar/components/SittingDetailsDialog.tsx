import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClosingDate } from './ClosingDate';
import { componentDateLabel } from '../componentDays';
import { displayOrDash, qualificationIdOf } from '../sittingDetails';
import type { EisaSitting } from '../types';
import { EisaSittingStatusBadge } from './StatusBadge';

// QCTO feedback 2.3 / 3.5: the details of one calendar entry, opened from the Month view.
export function SittingDetailsDialog({ sitting, onClose }: { sitting: EisaSitting | null; onClose: () => void }) {
  return (
    <Dialog open={!!sitting} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {sitting && (
          <>
            <DialogHeader>
              <DialogTitle>EISA Sitting</DialogTitle>
              <DialogDescription>{displayOrDash(sitting.qualificationTitle)}</DialogDescription>
            </DialogHeader>
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">{sitting.componentDates?.length ? 'EISA dates' : 'Date'}</dt>
              <dd className="font-medium">
                {sitting.componentDates?.length ? (
                  <ul className="space-y-0.5">
                    {sitting.componentDates.map((c) => (
                      <li key={`${c.componentId}-${c.day}`}>
                        {c.date} <span className="text-xs font-normal text-gray-500">{componentDateLabel(c)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  sitting.date
                )}
              </dd>
              <dt className="text-gray-500">Qualification ID</dt>
              <dd className="font-mono text-xs leading-5">{qualificationIdOf(sitting)}</dd>
              <dt className="text-gray-500">Qualification name</dt>
              <dd>{displayOrDash(sitting.qualificationTitle)}</dd>
              <dt className="text-gray-500">QP</dt>
              <dd>{displayOrDash(sitting.qpName)}</dd>
              <dt className="text-gray-500">Registration closes</dt>
              <dd><ClosingDate sitting={sitting} /></dd>
              <dt className="text-gray-500">Status</dt>
              <dd>
                <EisaSittingStatusBadge status={sitting.status} />
              </dd>
              {sitting.status === 'rejected' && sitting.rejectionReason && (
                <>
                  <dt className="text-gray-500">Rejection reason</dt>
                  <dd>{sitting.rejectionReason}</dd>
                </>
              )}
              {sitting.status === 'postponed' && sitting.postponementReason && (
                <>
                  <dt className="text-gray-500">Postponement reason</dt>
                  <dd>
                    {sitting.postponementReason}
                    {sitting.proposedNewDate && <span className="block text-xs text-gray-500">New date: {sitting.proposedNewDate}</span>}
                  </dd>
                </>
              )}
              {sitting.status === 'cancelled' && sitting.cancellationReason && (
                <>
                  <dt className="text-gray-500">Cancellation reason</dt>
                  <dd>{sitting.cancellationReason}</dd>
                </>
              )}
            </dl>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
