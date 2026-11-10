import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ConfirmationStatusBadge } from '../components/StatusBadge';
import { ConfirmationSummary } from '../components/ConfirmationSummary';
import { LearnerListPanel } from '../components/LearnerListPanel';
import { useConfirmationRecord } from '../hooks';
import { isReturnedToQp } from '../workflow';
import { ConfirmationBuilder } from './ConfirmationBuilder';

export function ConfirmationDetail({ recordId, onClose }: { recordId: string | null; onClose: () => void }) {
  const { data: record } = useConfirmationRecord(recordId);
  const { role } = useV2Role();

  if (!record) {
    return (
      <Dialog open={!!recordId} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl" />
      </Dialog>
    );
  }

  const canBuild = role === 'QP' && record.workflow.stageId === 'qp-draft';
  const lastReturn = record.returns[record.returns.length - 1];

  return (
    <Dialog open={!!recordId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record.qualificationTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Status</span>
            <ConfirmationStatusBadge record={record} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase">QP</p>
              <p className="font-medium">{record.qpName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">EISA Date</p>
              <p className="font-medium">{record.sittingDate}</p>
            </div>
          </div>

          {isReturnedToQp(record) && lastReturn && (
            <Alert className="border-red-400 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Returned by {lastReturn.returnedBy} on {lastReturn.returnedAt.slice(0, 10)}: {lastReturn.reason}
              </AlertDescription>
            </Alert>
          )}

          {canBuild ? (
            <>
              <LearnerListPanel record={record} />
              <ConfirmationBuilder key={record.id} record={record} />
            </>
          ) : (
            <>
              <LearnerListPanel record={record} showCentre />
              <ConfirmationSummary record={record} />
              {record.workflow.stageId === 'with-asd' && <p className="text-sm text-blue-700">Submitted to the ASD for review.</p>}
              {record.workflow.stageId === 'accepted' && <p className="text-sm text-emerald-700">Accepted. This step does not create a site visit.</p>}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
