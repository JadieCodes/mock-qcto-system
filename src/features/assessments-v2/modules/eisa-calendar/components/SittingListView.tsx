import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ClosingDate } from './ClosingDate';
import { displayOrDash, qualificationIdOf } from '../sittingDetails';
import { EisaSittingStatusBadge } from './StatusBadge';
import { UNPUBLISHED_SITTING_STATUSES } from '../api';
import type { EisaSitting } from '../types';

const isUnpublished = (s: EisaSitting) => UNPUBLISHED_SITTING_STATUSES.includes(s.status);

// CR-033: list view of the visual calendar. Management actions (CR-027) are only wired up for
// the internal portal. QCTO feedback 2.4: nobody postpones or cancels directly — the QP (own
// sittings) and the DD raise a request instead; the ASD updates or deletes unpublished sittings only.
export function SittingListView({
  sittings,
  onRequestPostponement,
  onRequestCancellation,
  canRequest,
  openRequestSittingIds,
  onEdit,
  onDelete,
  onChangeClosing,
  sittingIdsWithRegistrations,
}: {
  sittings: EisaSitting[];
  onRequestPostponement?: (sitting: EisaSitting) => void;
  onRequestCancellation?: (sitting: EisaSitting) => void;
  // Narrows who may raise a request on a given row (the QP only on their own sittings).
  canRequest?: (sitting: EisaSitting) => boolean;
  openRequestSittingIds?: Set<string>;
  onEdit?: (sitting: EisaSitting) => void;
  onDelete?: (sitting: EisaSitting) => void;
  // Batch S (05.11): the super admin's "Change closing date" on a published sitting.
  onChangeClosing?: (sitting: EisaSitting) => void;
  // Row 22/23 (D-17): sittings in this set already have registrations against them — Delete
  // is blocked for those.
  sittingIdsWithRegistrations?: Set<string>;
}) {
  const canManage = !!(onRequestPostponement || onRequestCancellation || onEdit || onDelete || onChangeClosing);
  const sorted = [...sittings].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-gray-500">No sittings to show yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {/* QCTO feedback 2.3 / 3.5 */}
              {['Date(s)', 'Qualification ID', 'Qualification name', 'QP', 'Registration closes', 'Status', ...(canManage ? [''] : [])].map(
                (h) => (
                  <TableHead key={h} className="whitespace-nowrap">
                    {h}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="whitespace-nowrap font-medium">{s.date}</TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs">{qualificationIdOf(s)}</TableCell>
                <TableCell className="max-w-[220px] truncate">{displayOrDash(s.qualificationTitle)}</TableCell>
                <TableCell className="whitespace-nowrap">{displayOrDash(s.qpName)}</TableCell>
                <TableCell className="whitespace-nowrap"><ClosingDate sitting={s} /></TableCell>
                <TableCell>
                  <EisaSittingStatusBadge status={s.status} />
                  {s.status === 'rejected' && s.rejectionReason && <p className="mt-1 text-xs text-red-600">{s.rejectionReason}</p>}
                  {s.status === 'postponed' && s.postponementReason && (
                    <p className="mt-1 text-xs text-purple-600">
                      {s.postponementReason}
                      {s.proposedNewDate && <span className="block">New date: {s.proposedNewDate}</span>}
                    </p>
                  )}
                  {s.status === 'cancelled' && s.cancellationReason && <p className="mt-1 text-xs text-gray-500">{s.cancellationReason}</p>}
                </TableCell>
                {canManage && (
                  <TableCell className="whitespace-nowrap space-x-1">
                    {s.status === 'published' && onChangeClosing && (
                      <Button size="sm" variant="outline" onClick={() => onChangeClosing(s)}>
                        Change closing date
                      </Button>
                    )}
                    {s.status === 'published' && openRequestSittingIds?.has(s.id) && (
                      <span className="text-xs text-amber-700">Request open</span>
                    )}
                    {s.status === 'published' && !openRequestSittingIds?.has(s.id) && (canRequest?.(s) ?? true) && (
                      <>
                        {onRequestPostponement && (
                          <Button size="sm" variant="outline" onClick={() => onRequestPostponement(s)}>
                            Request postponement
                          </Button>
                        )}
                        {onRequestCancellation && (
                          <Button size="sm" variant="outline" onClick={() => onRequestCancellation(s)}>
                            Request cancellation
                          </Button>
                        )}
                      </>
                    )}
                    {isUnpublished(s) && onEdit && (
                      <Button size="sm" variant="ghost" onClick={() => onEdit(s)}>
                        Update
                      </Button>
                    )}
                    {isUnpublished(s) && onDelete && sittingIdsWithRegistrations?.has(s.id) ? (
                      <Button size="sm" variant="ghost" disabled title="This sitting already has registrations and cannot be deleted.">
                        Delete
                      </Button>
                    ) : (
                      isUnpublished(s) &&
                      onDelete && (
                        <Button size="sm" variant="ghost" onClick={() => onDelete(s)}>
                          Delete
                        </Button>
                      )
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
