import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getAuditTrail } from '../../../shared/audit/auditLog';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { EISA_RESULTS_RECORD_TYPE } from '../config';
import { BatchDocumentsCard } from '../components/BatchDocumentsCard';
import { BatchDownloads } from '../components/BatchDownloads';
import { EvidenceDates, FinalDecisionNotice } from '../components/DecisionPanels';
import { OutcomeLetterView } from '../components/OutcomeLetterView';
import { DeclarationLine, EisaEvidenceList, OnFileDocumentsList } from '../components/EisaSubmissionPack';
import { documentsForPortal, EISA_BATCH_DOCUMENTS } from '../batchDocuments';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { EisaBatchFigures } from '../components/EisaBatchFigures';
import { EisaLearnerResultsTable } from '../components/EisaLearnerResultsTable';
import { downloadEisaVerificationReport } from '../eisaVerificationReport';
import { downloadLetterModel, eisaOutcomeLetter } from '../outcomeLetters';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { useEisaReportContext, useResultsAction, useResultsBatch } from '../hooks';

// CR-059: QP-facing read-only summary — status, the batch figures and per-component results
// (29.31), the latest request for more evidence (if any) with a resubmit action, and once the
// batch is decided its Outcome Letter. Batch N1: the QP never sees the Certification recommendation letter.
export function ResultsBatchDetail({ batchId, onClose }: { batchId: string | null; onClose: () => void }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const { data: batch } = useResultsBatch(batchId);
  const resultsAction = useResultsAction();
  const reportContext = useEisaReportContext(batch?.sittingId ?? null);

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
          <EvidenceDates requestedAt={batch.evidenceRequestedAt} receivedAt={batch.finalEvidenceReceivedAt} />
          {batch.workflow.stageId === 'more-evidence' && batch.declineHistory.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-1">
              <p className="text-xs font-semibold text-amber-700 uppercase">More Evidence Requested</p>
              <p className="text-sm text-amber-800">{batch.declineHistory[batch.declineHistory.length - 1].reason}</p>
            </div>
          )}
          {batch.finalDecision && <FinalDecisionNotice decision={batch.finalDecision} />}
          {batch.finalDecision && (
            <BatchDownloads
              onDownloadLetter={() => downloadLetterModel(eisaOutcomeLetter(batch, false))}
              onDownloadReport={() => downloadEisaVerificationReport(batch, getAuditTrail(EISA_RESULTS_RECORD_TYPE, batch.id), reportContext)}
            />
          )}
          <BatchDocumentsCard
            documents={documentsForPortal(EISA_BATCH_DOCUMENTS, 'external')}
            downloads={
              batch.finalDecision
                ? {
                    'eisa-outcome-letter': () => downloadLetterModel(eisaOutcomeLetter(batch, false)),
                    'eisa-verification-report': () => downloadEisaVerificationReport(batch, getAuditTrail(EISA_RESULTS_RECORD_TYPE, batch.id), reportContext),
                  }
                : {}
            }
          />
          {batch.finalDecision && <OutcomeLetterView model={eisaOutcomeLetter(batch, false)} />}
          {batch.workflow.stageId === 'more-evidence' && (
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
