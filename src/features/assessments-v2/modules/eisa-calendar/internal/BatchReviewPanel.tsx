import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { canActInStage } from '../../../shared/workflow/engine';
import { ReasonDialog } from '../../../shared/ui/ReasonDialog';
import { ScopeToggle } from '../../../shared/ui/ScopeToggle';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterByScope, type ListScope } from '../../../shared/visibility/recordVisibility';
import { EisaSittingStatusBadge } from '../components/StatusBadge';
import { useBatchAction, useEisaSittingBatches } from '../hooks';
import { BATCH_WORKFLOW, batchDisplayStatus } from '../workflow';
import type { EisaSittingBatch } from '../types';

// CR-028/CR-032: the review queue — QCTO approves, rejects with a mandatory reason, or
// publishes an approved batch to the calendar.
export function BatchReviewPanel() {
  const { data: allBatches = [] } = useEisaSittingBatches();
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const batchAction = useBatchAction();
  const [rejectTarget, setRejectTarget] = useState<EisaSittingBatch | null>(null);
  const [scope, setScope] = useState<ListScope>('mine');

  const canReview = canActInStage(BATCH_WORKFLOW, 'qcto-review', role);

  // A brand-new date-proposal nobody has personally touched yet still belongs under "My items"
  // for whichever role can act on its current stage (09-visibility-matrix.md "Approved corrections").
  const batches = filterByScope(allBatches, scope, person.id, (b) => [b.state.submittedById], (b) =>
    canActInStage(BATCH_WORKFLOW, b.state.stageId, role),
  );
  const sorted = [...batches].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  if (sorted.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <ScopeToggle scope={scope} onChange={setScope} />
        </div>
        <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-gray-500">No EISA sitting date submissions yet.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end mb-3">
        <ScopeToggle scope={scope} onChange={setScope} />
      </div>
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {['Qualification', 'QP', 'Year', 'Dates', 'Status', ''].map((h) => (
                  <TableHead key={h} className="whitespace-nowrap">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((batch) => {
                const status = batchDisplayStatus(batch);
                return (
                  <TableRow key={batch.id}>
                    <TableCell className="max-w-[200px] truncate font-medium">{batch.qualificationTitle}</TableCell>
                    <TableCell className="whitespace-nowrap">{batch.qpName}</TableCell>
                    <TableCell>{batch.year}</TableCell>
                    <TableCell className="text-xs text-gray-500">{batch.dates.join(', ')}</TableCell>
                    <TableCell>
                      <EisaSittingStatusBadge status={status} />
                      {batch.rejectionHistory.map((entry, i) => (
                        <p key={i} className="mt-1 text-xs text-red-600">
                          {entry.reason}
                        </p>
                      ))}
                    </TableCell>
                    <TableCell className="whitespace-nowrap space-x-1">
                      {canReview && batch.state.stageId === 'qcto-review' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              batchAction.mutate({ batchId: batch.id, actionId: 'batch-approve', actorRole: role, actorId, actorName })
                            }
                          >
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setRejectTarget(batch)}>
                            Reject
                          </Button>
                        </>
                      )}
                      {canReview && batch.state.stageId === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() =>
                            batchAction.mutate({ batchId: batch.id, actionId: 'batch-publish', actorRole: role, actorId, actorName })
                          }
                        >
                          Publish to calendar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <ReasonDialog
        open={!!rejectTarget}
        title="Reject these sitting dates"
        description={rejectTarget ? `"${rejectTarget.qualificationTitle}" (${rejectTarget.year}) — this goes back to the QP.` : undefined}
        confirmLabel="Reject"
        destructive
        onOpenChange={(open) => !open && setRejectTarget(null)}
        onConfirm={(reason) => {
          if (!rejectTarget) return;
          batchAction.mutate({ batchId: rejectTarget.id, actionId: 'batch-reject', actorRole: role, actorId, actorName, note: reason });
        }}
      />
    </>
  );
}
