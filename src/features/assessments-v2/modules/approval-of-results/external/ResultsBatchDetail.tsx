import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { useResultsAction, useResultsBatch } from '../hooks';
import { competencyRatePercent } from '../workflow';

// CR-059: QP-facing read-only summary — status, competency rate, the latest decline reason
// (if any) and a resubmit action once declined.
export function ResultsBatchDetail({ batchId, onClose }: { batchId: string | null; onClose: () => void }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const { data: batch } = useResultsBatch(batchId);
  const resultsAction = useResultsAction();

  return (
    <Dialog open={!!batchId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        {batch && (
          <>
            <DialogHeader>
              <DialogTitle>{batch.qualificationTitle}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <ResultsBatchStatusBadge batch={batch} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Submission</span>
                <DeadlineBadge deadline={batch.submissionDeadline} submittedAt={batch.submittedAt} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Competency Rate</span>
                <span className="text-sm font-semibold">
                  {competencyRatePercent(batch)}% ({batch.competentCount}/{batch.learnerCount})
                </span>
              </div>
              {batch.declineHistory.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-1">
                  <p className="text-xs font-semibold text-red-700 uppercase">Latest Decline Reason</p>
                  <p className="text-sm text-red-800">{batch.declineHistory[batch.declineHistory.length - 1].reason}</p>
                </div>
              )}
              {batch.recommendation && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  Recommended to Certification on {new Date(batch.recommendation.recommendedAt).toLocaleDateString('en-ZA')}.
                </div>
              )}
              {batch.workflow.stageId === 'declined' && (
                <Button
                  size="sm"
                  disabled={resultsAction.isPending}
                  onClick={() => resultsAction.mutate({ batchId: batch.id, actionId: 'batch-resubmit', actorRole: role, actorId, actorName })}
                >
                  Resubmit
                </Button>
              )}
            </div>
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
