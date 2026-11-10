import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getAuditTrail } from '../../../shared/audit/auditLog';
import { Modal } from '../../../shared/ui/Modal';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { SectionCard } from '../../../shared/ui/PageSections';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { EISA_RESULTS_RECORD_TYPE } from '../config';
import { BatchDocumentsCard } from '../components/BatchDocumentsCard';
import { BatchTabs } from '../components/BatchTabs';
import { EvidenceDates, FinalDecisionNotice } from '../components/DecisionPanels';
import { EisaOutcomeLetterDoc, EisaVerificationReportDoc } from '../components/Documents';
import { DeclarationLine, EisaEvidenceList, OnFileDocumentsList } from '../components/EisaSubmissionPack';
import { documentsForPortal, EISA_BATCH_DOCUMENTS } from '../batchDocuments';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { EisaBatchFigures } from '../components/EisaBatchFigures';
import { EisaLearnerResultsTable } from '../components/EisaLearnerResultsTable';
import { NextStepCard } from '../components/NextStepCard';
import { downloadEisaVerificationReport } from '../eisaVerificationReport';
import { externalNextStep } from '../nextStep';
import { downloadLetterModel, eisaDatesOf, eisaOutcomeLetter } from '../outcomeLetters';
import { externalTabIds, type ResultsTabId } from '../tabs';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { useEisaReportContext, useResultsAction, useResultsBatch } from '../hooks';
import type { ResultsBatch } from '../types';

function SummaryTab({ batch, onOpenTab }: { batch: ResultsBatch; onOpenTab: (tab: ResultsTabId) => void }) {
  const { role, person } = useV2Role();
  const resultsAction = useResultsAction();
  const latestRequest = batch.declineHistory[batch.declineHistory.length - 1];
  const dates = [...new Set(eisaDatesOf(batch))].sort();

  return (
    <div className="space-y-4">
      <PageHeader title="Summary" actions={<ResultsBatchStatusBadge batch={batch} />} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs uppercase text-gray-400">Submission</p>
          <DeadlineBadge deadline={batch.submissionDeadline} submittedAt={batch.submittedAt} />
        </div>
        <div className="space-y-1">
          {/* QCTO feedback 29.32: "EISA date", not "Sitting date". */}
          <p className="text-xs uppercase text-gray-400">{dates.length > 1 ? 'EISA Dates' : 'EISA Date'}</p>
          <p className="text-sm font-medium">{dates.join(', ')}</p>
        </div>
      </div>
      {/* QCTO feedback 29.31: the batch figures. */}
      <EisaBatchFigures batch={batch} />
      <EvidenceDates requestedAt={batch.evidenceRequestedAt} receivedAt={batch.finalEvidenceReceivedAt} />
      {batch.workflow.stageId === 'more-evidence' && latestRequest && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-700 uppercase">More Evidence Requested</p>
          <p className="text-sm text-amber-800">{latestRequest.reason}</p>
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={resultsAction.isPending}
              onClick={() => resultsAction.mutate({ batchId: batch.id, actionId: 'batch-resubmit', actorRole: role, actorId: person.id, actorName: person.name })}
            >
              Resubmit
            </Button>
          </div>
        </div>
      )}
      {batch.finalDecision && <FinalDecisionNotice decision={batch.finalDecision} />}
      <NextStepCard step={externalNextStep(batch.workflow.stageId, batch.finalDecision?.outcome ?? null)} onOpenTab={onOpenTab} />
    </div>
  );
}

function EvidenceTab({ batch }: { batch: ResultsBatch }) {
  const reportContext = useEisaReportContext(batch.sittingId);
  return (
    <div className="space-y-4">
      <SectionCard title="Evidence">
        <div className="p-4">
          <EisaEvidenceList files={batch.evidenceDocuments} />
        </div>
      </SectionCard>
      <SectionCard title="Already on file">
        <div className="p-4">
          <OnFileDocumentsList documents={batch.onFileDocuments} />
        </div>
      </SectionCard>
      <SectionCard title="Declaration">
        <div className="p-4">
          <DeclarationLine declaration={batch.declaration} />
        </div>
      </SectionCard>
      {/* Batch N1: the QP never sees the recommendation letter, the letter checklist or the tracking register. */}
      <BatchDocumentsCard
        documents={documentsForPortal(EISA_BATCH_DOCUMENTS, 'external')}
        downloads={
          batch.finalDecision
            ? {
                'eisa-outcome-letter': () => downloadLetterModel(eisaOutcomeLetter(batch, false)),
                'eisa-verification-report': () => downloadEisaVerificationReport(batch, getAuditTrail(EISA_RESULTS_RECORD_TYPE, batch.id), reportContext, 'external'),
              }
            : {}
        }
      />
    </div>
  );
}

// CR-059: QP-facing read-only view — Summary, Learner Results, Evidence and, once the batch is
// decided, its Outcome Letter and Verification Report (Batch N.1). The QP never sees the ASD's
// compliance review, the letter checklist, the tracking register or the recommendation letter.
export function ResultsBatchDetail({ batchId, onClose }: { batchId: string | null; onClose: () => void }) {
  const { data: batch } = useResultsBatch(batchId);
  return (
    <Modal
      open={!!batchId}
      onOpenChange={(open) => !open && onClose()}
      size="lg"
      title={batch?.qualificationTitle ?? ''}
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      {batch && <ResultsBatchDetailContent key={batch.id} batch={batch} />}
    </Modal>
  );
}

export function ResultsBatchDetailContent({ batch, initialTab = 'summary' }: { batch: ResultsBatch; initialTab?: ResultsTabId }) {
  const [tab, setTab] = useState<ResultsTabId>(initialTab);
  const reportContext = useEisaReportContext(batch.sittingId);
  return (
    <BatchTabs
      ids={externalTabIds(batch)}
      value={tab}
      onValueChange={setTab}
      render={(id) => {
        switch (id) {
          case 'summary':
            return <SummaryTab batch={batch} onOpenTab={setTab} />;
          case 'results':
            return (
              <SectionCard title="Learner results">
                <div className="p-4">
                  <EisaLearnerResultsTable batch={batch} />
                </div>
              </SectionCard>
            );
          case 'evidence':
            return <EvidenceTab batch={batch} />;
          case 'letter':
            return <EisaOutcomeLetterDoc batch={batch} />;
          case 'report':
            return <EisaVerificationReportDoc batch={batch} audit={getAuditTrail(EISA_RESULTS_RECORD_TYPE, batch.id)} ctx={reportContext} audience="external" />;
          default:
            return null;
        }
      }}
    />
  );
}
