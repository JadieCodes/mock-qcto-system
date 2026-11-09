import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getAuditTrail } from '../../../shared/audit/auditLog';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { EISA_RESULTS_RECORD_TYPE } from '../config';
import { BatchDocumentsCard } from '../components/BatchDocumentsCard';
import { BatchDownloads } from '../components/BatchDownloads';
import { DeclarationLine, EisaEvidenceList, OnFileDocumentsList } from '../components/EisaSubmissionPack';
import { EISA_BATCH_DOCUMENTS } from '../batchDocuments';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { EisaBatchFigures } from '../components/EisaBatchFigures';
import { EisaLearnerResultsTable } from '../components/EisaLearnerResultsTable';
import { downloadEisaApprovalLetter, downloadEisaVerificationReport } from '../downloads';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { useResultsAction, useResultsBatch } from '../hooks';

// CR-059: QP-facing read-only summary — status, the batch figures and per-component results
// (29.31), the latest decline reason (if any) and a resubmit action once declined.
export function ResultsBatchDetail({ batchId, onClose }: { batchId: string | null; onClose: () => void }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const { data: batch } = useResultsBatch(batchId);
  const resultsAction = useResultsAction();

  return (
    <Modal
      open={!!batchId}
      onOpenChange={(open) => !open && onClose()}
      size="lg"
      title={batch?.qualificationTitle ?? ''}
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      {batch && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Status</span>
            <ResultsBatchStatusBadge batch={batch} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Submission</span>
            <DeadlineBadge deadline={batch.submissionDeadline} submittedAt={batch.submittedAt} />
          </div>
          {/* QCTO feedback 29.32: "EISA date", not "Sitting date". */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">EISA Date</span>
            <span className="text-sm font-medium">{batch.sittingDate}</span>
          </div>
          {/* QCTO feedback 29.31: the batch figures and the results per learner and component. */}
          <EisaBatchFigures batch={batch} />
          <EisaLearnerResultsTable batch={batch} />
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400 uppercase">Evidence</Label>
            <EisaEvidenceList files={batch.evidenceDocuments} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-400 uppercase">Already on File</Label>
            <OnFileDocumentsList documents={batch.onFileDocuments} />
          </div>
          <DeclarationLine declaration={batch.declaration} />
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
          {batch.workflow.stageId === 'approved' && (
            <BatchDownloads
              onDownloadLetter={() => downloadEisaApprovalLetter(batch)}
              onDownloadReport={() => downloadEisaVerificationReport(batch, getAuditTrail(EISA_RESULTS_RECORD_TYPE, batch.id))}
            />
          )}
          <BatchDocumentsCard
            documents={EISA_BATCH_DOCUMENTS}
            downloads={
              batch.workflow.stageId === 'approved'
                ? {
                    'eisa-outcome-letter': () => downloadEisaApprovalLetter(batch),
                    'eisa-verification-report': () => downloadEisaVerificationReport(batch, getAuditTrail(EISA_RESULTS_RECORD_TYPE, batch.id)),
                  }
                : {}
            }
          />
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
      )}
    </Modal>
  );
}
