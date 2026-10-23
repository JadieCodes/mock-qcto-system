import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { EisaSittingStatusBadge } from './StatusBadge';
import type { EisaSitting } from '../types';

// CR-033: list view of the visual calendar. Management actions (CR-027, CR-034) are only
// wired up for the internal portal — external views pass no handlers and get a read-only list.
export function SittingListView({
  sittings,
  onPostpone,
  onCancel,
  onEdit,
  onDelete,
  sittingIdsWithRegistrations,
}: {
  sittings: EisaSitting[];
  onPostpone?: (sitting: EisaSitting) => void;
  onCancel?: (sitting: EisaSitting) => void;
  onEdit?: (sitting: EisaSitting) => void;
  onDelete?: (sitting: EisaSitting) => void;
  // Row 22/23 (D-17): sittings in this set already have registrations against them — Delete
  // is blocked for those; Postpone/Cancel are offered instead.
  sittingIdsWithRegistrations?: Set<string>;
}) {
  const canManage = !!(onPostpone || onCancel || onEdit || onDelete);
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
              {['Date', 'Qualification', 'QP', 'Year', 'Status', ...(canManage ? [''] : [])].map((h) => (
                <TableHead key={h} className="whitespace-nowrap">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="whitespace-nowrap font-medium">{s.date}</TableCell>
                <TableCell className="max-w-[220px] truncate">{s.qualificationTitle}</TableCell>
                <TableCell className="whitespace-nowrap">{s.qpName}</TableCell>
                <TableCell>{s.year}</TableCell>
                <TableCell>
                  <EisaSittingStatusBadge status={s.status} />
                  {s.status === 'rejected' && s.rejectionReason && <p className="mt-1 text-xs text-red-600">{s.rejectionReason}</p>}
                  {s.status === 'postponed' && s.postponementReason && (
                    <p className="mt-1 text-xs text-purple-600">
                      {s.postponementReason}
                      {s.proposedNewDate && <span className="block">Proposed new date: {s.proposedNewDate}</span>}
                    </p>
                  )}
                  {s.status === 'cancelled' && s.cancellationReason && <p className="mt-1 text-xs text-gray-500">{s.cancellationReason}</p>}
                </TableCell>
                {canManage && (
                  <TableCell className="whitespace-nowrap space-x-1">
                    {s.status === 'published' && onPostpone && (
                      <Button size="sm" variant="outline" onClick={() => onPostpone(s)}>
                        Postpone
                      </Button>
                    )}
                    {s.status === 'published' && onCancel && (
                      <Button size="sm" variant="destructive" onClick={() => onCancel(s)}>
                        Cancel
                      </Button>
                    )}
                    {onEdit && (
                      <Button size="sm" variant="ghost" onClick={() => onEdit(s)}>
                        Edit
                      </Button>
                    )}
                    {onDelete && sittingIdsWithRegistrations?.has(s.id) ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled
                        title="This sitting already has registrations — use Postpone or Cancel instead."
                      >
                        Delete
                      </Button>
                    ) : (
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
