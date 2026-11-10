import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getAuditTrail } from '../../../shared/audit/auditLog';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { SectionCard, StatTile, StatTileGrid } from '../../../shared/ui/PageSections';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { FISA_RESULTS_RECORD_TYPE } from '../config';
import { BatchDocumentsCard } from '../components/BatchDocumentsCard';
import { BatchTabs } from '../components/BatchTabs';
import { EvidenceDates, FinalDecisionNotice } from '../components/DecisionPanels';
import { FisaOutcomeLetterDoc, FisaVerificationReportDoc } from '../components/Documents';
import { documentsForPortal, FISA_BATCH_DOCUMENTS } from '../batchDocuments';
import { FisaEvidenceList, FisaLearnerResultsList } from '../components/FisaBatchLists';
import { NextStepCard } from '../components/NextStepCard';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { downloadFisaVerificationReport } from '../fisaVerificationReport';
import { externalNextStep } from '../nextStep';
import { downloadLetterModel, fisaOutcomeLetter } from '../outcomeLetters';
import { externalTabIds, type ResultsTabId } from '../tabs';
import { useFisaResultsAction } from '../hooks';
import { fisaFiguresOf } from '../workflow';
import type { FisaResultsBatch } from '../types';

function SummaryTab({ batch, onOpenTab }: { batch: FisaResultsBatch; onOpenTab: (tab: ResultsTabId) => void }) {
  const { role, person } = useV2Role();
  const resultsAction = useFisaResultsAction();
  const latestRequest = batch.declineHistory[batch.declineHistory.length - 1];
  const figures = fisaFiguresOf(batch);
  const tiles: { label: string; value: string }[] = [
    { label: 'Enrolled', value: String(figures.enrolled) },
    { label: 'Completed', value: String(figures.completed) },
    { label: 'Absent', value: String(figures.absent) },
    { label: 'Competent', value: String(figures.competent) },
    { label: 'Competency rate', value: `${figures.competencyRatePercent}%` },
    { label: 'Throughput rate', value: `${figures.throughputRatePercent}%` },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Summary" description={`Submitted ${batch.submittedAt?.slice(0, 10) ?? '—'}`} actions={<ResultsBatchStatusBadge batch={batch} />} />
      <div className="space-y-1.5">
        <StatTileGrid className="grid-cols-2 sm:grid-cols-3">
          {tiles.map((t) => (
            <StatTile key={t.label} label={t.label} value={t.value} />
          ))}
        </StatTileGrid>
        <p className="text-xs text-gray-500">
          Competency rate = competent ÷ completed. Throughput rate = completed ÷ enrolled ({figures.completed} of {figures.enrolled}).
        </p>
      </div>
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

function EvidenceTab({ batch }: { batch: FisaResultsBatch }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Evidence">
        <div className="p-4">
          <FisaEvidenceList files={batch.evidenceDocuments} />
        </div>
      </SectionCard>
      <SectionCard title="Declaration">
        <p className="p-4 text-sm text-gray-700">
          {batch.declaration ? `Ticked by ${batch.declaration.acceptedBy} on ${batch.declaration.acceptedAt.slice(0, 10)}.` : '—'}
        </p>
      </SectionCard>
      {/* Batch N1: the SDP sees its Outcome Letter and its own documents, never the recommendation letter or the tracking register. */}
      <BatchDocumentsCard
        documents={documentsForPortal(FISA_BATCH_DOCUMENTS, 'external')}
        downloads={
          batch.finalDecision
            ? {
                'fisa-outcome-letter': () => downloadLetterModel(fisaOutcomeLetter(batch, false)),
                'fisa-verification-report': () => downloadFisaVerificationReport(batch, getAuditTrail(FISA_RESULTS_RECORD_TYPE, batch.id), 'external'),
              }
            : {}
        }
      />
    </div>
  );
}

// Batch N.1: the SDP's view of a submitted batch — Summary, Learner Results, Evidence and, once
// decided, the Outcome Letter and the Verification Report (without QCTO's Section E).
export function FisaSubmittedView({ batch, initialTab = 'summary' }: { batch: FisaResultsBatch; initialTab?: ResultsTabId }) {
  const [tab, setTab] = useState<ResultsTabId>(initialTab);
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
                  <FisaLearnerResultsList results={batch.learnerResults} />
                </div>
              </SectionCard>
            );
          case 'evidence':
            return <EvidenceTab batch={batch} />;
          case 'letter':
            return <FisaOutcomeLetterDoc batch={batch} />;
          case 'report':
            return <FisaVerificationReportDoc batch={batch} audit={getAuditTrail(FISA_RESULTS_RECORD_TYPE, batch.id)} audience="external" />;
          default:
            return null;
        }
      }}
    />
  );
}
