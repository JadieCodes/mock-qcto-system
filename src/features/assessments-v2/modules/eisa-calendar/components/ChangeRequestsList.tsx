import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { changeRequestKindLabel } from '../changeRequests';
import type { EisaSittingChangeRequest } from '../types';
import { changeRequestInternalStatusLabel, changeRequestStageLabel } from '../workflow';

// QCTO 05.10: only the internal side sees the recommendations in the status; the QP sees the stage.
export function ChangeRequestStatusBadge({ request }: { request: EisaSittingChangeRequest }) {
  const { portal } = useV2Role();
  const tone =
    request.state.stageId === 'approved'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : request.state.stageId === 'declined'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';
  return (
    <Badge variant="outline" className={cn('whitespace-normal font-medium', tone)}>
      {portal === 'internal' ? changeRequestInternalStatusLabel(request) : changeRequestStageLabel(request)}
    </Badge>
  );
}

// QCTO feedback 2.4: the "Requests" list (internal) and "My requests" list (QP).
export function ChangeRequestsList({
  requests,
  onOpen,
  emptyText,
}: {
  requests: EisaSittingChangeRequest[];
  onOpen: (request: EisaSittingChangeRequest) => void;
  emptyText: string;
}) {
  const sorted = [...requests].sort((a, b) => b.raisedAt.localeCompare(a.raisedAt));

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-gray-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {['Request', 'Qualification', 'QP', 'Sitting date', 'New date', 'Raised by', 'Status', ''].map((h) => (
                <TableHead key={h} className="whitespace-nowrap">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap font-medium">{changeRequestKindLabel(r.kind)}</TableCell>
                <TableCell className="max-w-[200px] truncate">{r.qualificationTitle}</TableCell>
                <TableCell className="whitespace-nowrap">{r.qpName}</TableCell>
                <TableCell className="whitespace-nowrap">{r.sittingDate}</TableCell>
                <TableCell className="whitespace-nowrap">{r.proposedNewDate ?? '—'}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {r.raisedBy}
                  <span className="block text-xs text-gray-400">{new Date(r.raisedAt).toLocaleDateString('en-ZA')}</span>
                </TableCell>
                <TableCell>
                  <ChangeRequestStatusBadge request={r} />
                  {r.decision === 'declined' && r.decisionComment && <p className="mt-1 text-xs text-red-600">{r.decisionComment}</p>}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => onOpen(r)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
