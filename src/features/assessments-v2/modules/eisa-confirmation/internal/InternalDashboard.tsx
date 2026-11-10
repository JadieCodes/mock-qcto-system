import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReasonDialog } from '../../../shared/ui/ReasonDialog';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ConfirmationStatusBadge } from '../components/StatusBadge';
import { ConfirmationSummary } from '../components/ConfirmationSummary';
import { LearnerListPanel } from '../components/LearnerListPanel';
import { UpcomingSharesTable } from '../components/UpcomingSharesTable';
import { useAcceptConfirmation, useConfirmationRecord, useConfirmationRecords, useReturnConfirmation, useUpcomingShares } from '../hooks';
import { isReturnedToQp } from '../workflow';

function ReviewDialog({ recordId, onClose }: { recordId: string | null; onClose: () => void }) {
  const { data: record } = useConfirmationRecord(recordId);
  const { role, person } = useV2Role();
  const accept = useAcceptConfirmation();
  const returnToQp = useReturnConfirmation();
  const [returning, setReturning] = useState(false);

  const actor = { actorRole: role, actorId: person.id, actorName: person.name };
  const canReview = role === 'ASD' && record?.workflow.stageId === 'with-asd';

  return (
    <Dialog open={!!recordId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {record && (
          <>
            <DialogHeader>
              <DialogTitle>{record.qualificationTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {record.qpName} · EISA date {record.sittingDate}
                </span>
                <ConfirmationStatusBadge record={record} />
              </div>
              {record.returns.length > 0 && (
                <div className="rounded-xl border bg-gray-50 p-3 text-sm space-y-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Returned to the QP</p>
                  {record.returns.map((r) => (
                    <p key={r.cycle}>
                      {r.returnedAt.slice(0, 10)} by {r.returnedBy}: {r.reason}
                    </p>
                  ))}
                </div>
              )}
              <LearnerListPanel record={record} showCentre />
              {record.workflow.stageId === 'qp-draft' && !isReturnedToQp(record) ? (
                <p className="text-sm text-gray-500">The QP has not submitted a confirmation yet.</p>
              ) : (
                <ConfirmationSummary record={record} />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {canReview && (
                <>
                  <Button variant="outline" disabled={returnToQp.isPending} onClick={() => setReturning(true)}>
                    Return to QP
                  </Button>
                  <Button disabled={accept.isPending} onClick={() => accept.mutate({ recordId: record.id, ...actor })}>
                    Accept
                  </Button>
                </>
              )}
            </DialogFooter>
            <ReasonDialog
              open={returning}
              title="Return to QP"
              description="The QP sees your reason, corrects the confirmation and submits it again."
              confirmLabel="Return to QP"
              onOpenChange={setReturning}
              onConfirm={(reason) => returnToQp.mutate({ recordId: record.id, reason, ...actor })}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Batch T (29.20): the system shares the list; the ASD reviews what the QP submits.
export function InternalDashboard() {
  const { data: records = [] } = useConfirmationRecords();
  const { data: upcoming = [] } = useUpcomingShares();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const awaiting = records.filter((r) => r.workflow.stageId === 'with-asd');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">EISA Confirmation</h2>
        <p className="text-sm text-gray-500 mt-1">
          The system shares the consolidated learner list with the QP once registration has closed. The QP confirms the centres and dates; you accept the confirmation or return it.
        </p>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold text-gray-900">Waiting for Your Review</h3>
        </div>
        {awaiting.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-gray-400">No confirmations are waiting for review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification', 'QP', 'EISA Date', 'Submitted', ''].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {awaiting.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium max-w-[220px] truncate">{r.qualificationTitle}</TableCell>
                    <TableCell>{r.qpName}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.sittingDate}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.submittedAt?.slice(0, 10) ?? ''}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => setSelectedId(r.id)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {upcoming.length > 0 && (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50/80">
            <h3 className="text-base font-semibold text-gray-900">Learner Lists to be Shared</h3>
          </div>
          <UpcomingSharesTable shares={upcoming} />
        </div>
      )}

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold text-gray-900">All Confirmations</h3>
        </div>
        {records.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-medium text-gray-500">No learner lists shared yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification', 'QP', 'EISA Date', 'Learners', 'Shared', 'Status'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(r.id)}>
                    <TableCell className="font-medium max-w-[220px] truncate">{r.qualificationTitle}</TableCell>
                    <TableCell>{r.qpName}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.sittingDate}</TableCell>
                    <TableCell>{r.learners.length}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.sharedAt.slice(0, 10)}</TableCell>
                    <TableCell>
                      <ConfirmationStatusBadge record={r} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ReviewDialog recordId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
