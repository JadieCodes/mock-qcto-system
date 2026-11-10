import { useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getAuditTrail } from '../../../shared/audit/auditLog';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { Checklist } from '../../../shared/checklist/Checklist';
import { getChecklistIssues, isChecklistComplete } from '../../../shared/checklist/types';
import { fileUploadIssue } from '../../../shared/files/fileCheck';
import { DocumentChecked, FileCheckError } from '../../../shared/files/FileCheckNotice';
import { Modal } from '../../../shared/ui/Modal';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { SectionCard, StatTile, StatTileGrid } from '../../../shared/ui/PageSections';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import type { ValidationIssue } from '../../../shared/validation/types';
import { FISA_RESULTS_RECORD_TYPE, RESULTS_AD_ROLE, RESULTS_DD_ROLE } from '../config';
import { ApprovalHistory } from '../components/ApprovalHistory';
import { BatchDocumentsCard } from '../components/BatchDocumentsCard';
import { AuditTrailCsvDownload } from '../components/AuditTrailCsvDownload';
import { BatchTabs } from '../components/BatchTabs';
import { FisaOutcomeLetterDoc, FisaRecommendationLetterDoc, FisaVerificationReportDoc } from '../components/Documents';
import { FisaSectionE1, FisaSectionE2 } from '../components/FisaSectionEForm';
import { FisaEvidenceList, FisaLearnerResultsList } from '../components/FisaBatchLists';
import { DeclineRecommendationsNotice, DeclineResultsForm, EvidenceDates, FinalDecisionNotice } from '../components/DecisionPanels';
import { NextStepCard } from '../components/NextStepCard';
import { ResultsActionBar } from '../components/ResultsActionBar';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { documentsForPortal, FISA_BATCH_DOCUMENTS, type FisaBatchDocumentId } from '../batchDocuments';
import { downloadCsvFile } from '../../../shared/csv/csv';
import { fisaSectionEIssues } from '../fisaSectionE';
import { downloadFisaVerificationReport } from '../fisaVerificationReport';
import { internalNextStep } from '../nextStep';
import { fisaInternalTabIds, type ResultsTabId } from '../tabs';
import { fisaRegisterCsv } from '../trackingRegister';
import { downloadLetterModel, fisaOutcomeLetter, fisaRecommendationLetter } from '../outcomeLetters';
import {
  useFisaResultsAction,
  useFisaResultsBatch,
  useSaveFisaComplianceChecklist,
  useSaveFisaComplianceReviewNotes,
  useSaveFisaEvidenceEvaluationNotes,
  useSaveFisaRecommendations,
  useUploadFisaReviewEvidence,
} from '../hooks';
import { canDeclineResults, FISA_RESULTS_WORKFLOW, fisaFiguresOf } from '../workflow';
import type { FisaResultsBatch } from '../types';

function stageLabel(stageId: string): string {
  return FISA_RESULTS_WORKFLOW.stages.find((s) => s.id === stageId)?.label ?? stageId;
}

// QCTO feedback 05.17: only the documents that already have a download are linked.
// Batch N1 (05.16): on any batch with a final decision — the Outcome Letter, the verification report
// and, on an approved batch only, the SP certification recommendation letter.
function fisaDownloads(batch: FisaResultsBatch): Partial<Record<FisaBatchDocumentId, () => void>> {
  if (!batch.finalDecision) return {};
  const recommendation = fisaRecommendationLetter(batch);
  return {
    'fisa-outcome-letter': () => downloadLetterModel(fisaOutcomeLetter(batch, false)),
    'fisa-verification-report': () => downloadFisaVerificationReport(batch, getAuditTrail(FISA_RESULTS_RECORD_TYPE, batch.id)),
    ...(recommendation
      ? {
          'fisa-recommendation-letter': () => downloadLetterModel(recommendation),
          'fisa-tracking-register': () => downloadCsvFile(`Tracking_Register_Entry_FISA_${batch.id.slice(-4)}.csv`, fisaRegisterCsv([batch], '', '').csv),
        }
      : {}),
  };
}

function InfoItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-gray-400 uppercase">{label}</Label>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

// Batch N.1, Summary tab. A decided batch also shows the ASD's recommendations for improvements
// here (read-only), the same text the Outcome Letter prints.
function SummaryTab({ batch, onOpenTab }: { batch: FisaResultsBatch; onOpenTab: (tab: ResultsTabId) => void }) {
  const { role } = useV2Role();
  const figures = fisaFiguresOf(batch);
  const latestRequest = batch.declineHistory[batch.declineHistory.length - 1];
  const step = internalNextStep(FISA_RESULTS_WORKFLOW, batch.workflow.stageId, role, 'fisa', batch.finalDecision?.outcome ?? null);
  const tiles: { label: string; value: string }[] = [
    { label: 'Enrolled', value: String(figures.enrolled) },
    { label: 'Completed', value: String(figures.completed) },
    { label: 'Absent', value: String(figures.absent) },
    { label: 'Competent', value: String(figures.competent) },
    { label: 'Not yet competent', value: String(figures.notYetCompetent) },
    { label: 'Competency rate', value: `${figures.competencyRatePercent}%` },
    { label: 'Throughput rate', value: `${figures.throughputRatePercent}%` },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Summary"
        description={`Verification code: ${batch.finalDecision?.verificationCode ?? 'issued at the final decision'}`}
        actions={<ResultsBatchStatusBadge batch={batch} />}
      />
      {batch.finalDecision && <FinalDecisionNotice decision={batch.finalDecision} />}
      <EvidenceDates requestedAt={batch.evidenceRequestedAt} receivedAt={batch.finalEvidenceReceivedAt} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoItem label="SDP">{batch.sdpName}</InfoItem>
        <InfoItem label="Skills Programme">{batch.skillsProgrammeTitle}</InfoItem>
        <InfoItem label={batch.fisaDates.length > 1 ? 'Dates of FISA' : 'Date of FISA'}>{batch.fisaDates.join(', ')}</InfoItem>
        <InfoItem label="Submitted">{batch.submittedAt?.slice(0, 10) ?? '—'}</InfoItem>
      </div>
      <div className="space-y-1.5">
        <StatTileGrid className="grid-cols-2 sm:grid-cols-4">
          {tiles.map((t) => (
            <StatTile key={t.label} label={t.label} value={t.value} />
          ))}
        </StatTileGrid>
        <p className="text-xs text-gray-500">
          Competency rate = competent ÷ completed. Throughput rate = completed ÷ enrolled ({figures.completed} of {figures.enrolled}).
        </p>
      </div>
      {batch.finalDecision && (
        <SectionCard title="Recommendations for improvements before the next FISA">
          <p className="whitespace-pre-wrap p-4 text-sm text-gray-700">{batch.recommendationsForImprovement.trim() || 'None recorded.'}</p>
        </SectionCard>
      )}
      <DeclineRecommendationsNotice recommendations={batch.declineRecommendations} cycle={batch.cycleCount} />
      {batch.workflow.stageId === 'more-evidence' && latestRequest && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-1">
          <p className="font-semibold">More evidence requested at: {stageLabel(latestRequest.stageId)}</p>
          <p>{latestRequest.reason}</p>
          <p className="text-xs text-amber-700">The SDP has been notified and can add evidence and resubmit.</p>
        </div>
      )}
      <NextStepCard step={step} onOpenTab={onOpenTab} />
    </div>
  );
}

function LearnerResultsTab({ batch }: { batch: FisaResultsBatch }) {
  return (
    <SectionCard title="Learner results">
      <div className="p-4">
        <FisaLearnerResultsList results={batch.learnerResults} />
      </div>
    </SectionCard>
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
          {batch.declaration ? `Ticked by ${batch.declaration.acceptedBy} on ${batch.declaration.acceptedAt.slice(0, 10)}` : '—'}
        </p>
      </SectionCard>
      <BatchDocumentsCard documents={documentsForPortal(FISA_BATCH_DOCUMENTS, 'internal')} downloads={fisaDownloads(batch)} />
    </div>
  );
}

// The ASD's compliance and evidence review (api.ts assertAsdReviewComplete), the recommendations
// for improvements and Section E1, then the Deputy Director's Section E2. Everything is on screen
// for every internal role at every stage; it can only be edited by the role whose stage it is.
function SectionETab({ batch }: { batch: FisaResultsBatch }) {
  const { role } = useV2Role();
  const saveChecklist = useSaveFisaComplianceChecklist();
  const saveReviewNotes = useSaveFisaComplianceReviewNotes();
  const saveEvidenceNotes = useSaveFisaEvidenceEvaluationNotes();
  const saveRecommendations = useSaveFisaRecommendations();
  const uploadEvidence = useUploadFisaReviewEvidence();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadChecked, setUploadChecked] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const editable = role === RESULTS_AD_ROLE && batch.workflow.stageId === 'ad-review';
  const e2Reached = !['ad-review', 'more-evidence'].includes(batch.workflow.stageId);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fisa-compliance-notes">Compliance Review Notes</Label>
        <Textarea
          id="fisa-compliance-notes"
          rows={3}
          value={batch.complianceReviewNotes}
          disabled={!editable}
          onChange={(e) => saveReviewNotes.mutate({ id: batch.id, notes: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fisa-evidence-notes">Evidence Evaluation Notes</Label>
        <Textarea
          id="fisa-evidence-notes"
          rows={3}
          value={batch.evidenceEvaluationNotes}
          disabled={!editable}
          onChange={(e) => saveEvidenceNotes.mutate({ id: batch.id, notes: e.target.value })}
        />
        {editable && (
          <>
            <Button type="button" size="sm" variant="outline" aria-label="Add an evidence file" onClick={() => fileInput.current?.click()}>
              Add an evidence file
            </Button>
            <input
              ref={fileInput}
              type="file"
              hidden
              tabIndex={-1}
              onChange={(e) => {
                const file = e.target.files?.[0];
                const issue = file ? fileUploadIssue(file) : null;
                setUploadError(issue);
                setUploadChecked(!!file && !issue);
                if (file && !issue) uploadEvidence.mutate({ id: batch.id, file: { fileName: file.name, fileSize: file.size, fileType: file.type || 'unknown' } });
                e.target.value = '';
              }}
            />
            <p className="text-xs text-gray-500">Added files appear on the Evidence tab.</p>
          </>
        )}
        <FileCheckError message={uploadError} />
        {uploadChecked && !uploadError && <DocumentChecked />}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fisa-recommendations">Recommendations for improvements before the next FISA</Label>
        <Textarea
          id="fisa-recommendations"
          rows={3}
          value={batch.recommendationsForImprovement}
          disabled={!editable}
          onChange={(e) => saveRecommendations.mutate({ id: batch.id, text: e.target.value })}
        />
        <p className="text-xs text-gray-500">Printed on the Outcome Letter.{!editable && ' Only the ASD can change this, and only while the batch is at the ASD stage.'}</p>
      </div>

      <FisaSectionE1 batch={batch} editable={editable} />

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Folder-by-Folder Compliance Checklist</p>
        <Checklist sections={batch.complianceChecklist} readonly={!editable} onChange={(sections) => saveChecklist.mutate({ id: batch.id, sections })} />
      </div>

      {e2Reached ? (
        <FisaSectionE2 batch={batch} editable={role === RESULTS_DD_ROLE && batch.workflow.stageId === 'dd-review'} />
      ) : (
        <SectionCard title="E2 Recommendation & Approval">
          <p className="p-4 text-sm text-gray-500">The Deputy Director completes E2 once the ASD has sent the batch on.</p>
        </SectionCard>
      )}
    </div>
  );
}

// ONE action bar, at the bottom of the Approval Chain tab, for whichever stage the batch is at.
function StageActions({ batch }: { batch: FisaResultsBatch }) {
  const { role, person } = useV2Role();
  const resultsAction = useFisaResultsAction();
  const stageId = batch.workflow.stageId;
  const run = (actionId: string, note?: string) =>
    resultsAction.mutate({ batchId: batch.id, actionId, actorRole: role, actorId: person.id, actorName: person.name, note });

  const checklistComplete = isChecklistComplete(batch.complianceChecklist, true);
  const notesComplete = batch.complianceReviewNotes.trim().length > 0 && batch.evidenceEvaluationNotes.trim().length > 0;
  const sectionEIssues = fisaSectionEIssues(batch);
  const advanceIssues: ValidationIssue[] =
    stageId === 'ad-review' && role === RESULTS_AD_ROLE
      ? [
          ...(batch.complianceReviewNotes.trim() ? [] : [{ field: 'complianceReviewNotes', message: 'Compliance review notes are required.' }]),
          ...(batch.evidenceEvaluationNotes.trim() ? [] : [{ field: 'evidenceEvaluationNotes', message: 'Evidence evaluation notes are required.' }]),
          ...getChecklistIssues(batch.complianceChecklist, true),
          ...sectionEIssues,
        ]
      : [];

  if (!['ad-review', 'dd-review', 'director-review', 'chief-director-review'].includes(stageId)) return null;
  const disabledActionIds = stageId === 'ad-review' && !(checklistComplete && notesComplete && sectionEIssues.length === 0) ? ['ad-advance'] : [];

  return (
    <div className="space-y-2 border-t pt-4">
      {stageId === 'ad-review' && <ValidationSummary issues={advanceIssues} title="Complete these (Section E tab) before advancing to the Deputy Director:" />}
      <ResultsActionBar definition={FISA_RESULTS_WORKFLOW} stageId={stageId} role={role} hiddenActionIds={['chief-director-decline']} disabledActionIds={disabledActionIds} onRun={run} />
      {canDeclineResults(role, stageId) && (
        <DeclineResultsForm
          disabled={resultsAction.isPending}
          onDecline={(irregularities, correctiveActions) =>
            resultsAction.mutate({
              batchId: batch.id,
              actionId: 'chief-director-decline',
              actorRole: role,
              actorId: person.id,
              actorName: person.name,
              irregularities,
              correctiveActions,
            })
          }
        />
      )}
    </div>
  );
}

function ApprovalChainTab({ batch }: { batch: FisaResultsBatch }) {
  const stageOrder = ['ad-review', 'dd-review', 'director-review', 'chief-director-review'];
  const currentIndex = batch.workflow.stageId === 'approved' ? stageOrder.length : stageOrder.indexOf(batch.workflow.stageId);
  const latestRequest = batch.declineHistory[batch.declineHistory.length - 1];

  return (
    <div className="space-y-4">
      <SectionCard title="Approval Chain">
        <div className="p-4 flex flex-wrap items-center gap-2 text-xs">
          {['ASD', 'Deputy Director', 'Director', 'Chief Director'].map((label, i) => (
            <span key={label} className={i <= currentIndex && batch.workflow.stageId !== 'more-evidence' ? 'font-semibold text-blue-700' : 'text-gray-400'}>
              {label}
              {i < 3 ? ' →' : ''}
            </span>
          ))}
        </div>
      </SectionCard>

      <ApprovalHistory audit={getAuditTrail(FISA_RESULTS_RECORD_TYPE, batch.id)} currentStageId={batch.workflow.stageId} declineHistory={batch.declineHistory} />

      <DeclineRecommendationsNotice recommendations={batch.declineRecommendations} cycle={batch.cycleCount} />

      {batch.workflow.stageId === 'more-evidence' && latestRequest && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-1">
          <p className="font-semibold">More evidence requested at: {stageLabel(latestRequest.stageId)}</p>
          <p>{latestRequest.reason}</p>
          <p className="text-xs text-amber-700">The SDP has been notified and can add evidence and resubmit.</p>
        </div>
      )}

      <StageActions batch={batch} />
    </div>
  );
}

// Batch N.1: Summary, Learner Results, Evidence, Section E, Approval Chain, Outcome Letter,
// Verification Report, SP Certification Recommendation (approved only), Audit Trail (tabs.ts).
// `initialTab` is for the seed check.
export function FisaResultsBatchWorkspaceContent({ batch, initialTab = 'summary' }: { batch: FisaResultsBatch; initialTab?: ResultsTabId }) {
  const [tab, setTab] = useState<ResultsTabId>(initialTab);
  return (
    <BatchTabs
      ids={fisaInternalTabIds(batch)}
      value={tab}
      onValueChange={setTab}
      render={(id) => {
        switch (id) {
          case 'summary':
            return <SummaryTab batch={batch} onOpenTab={setTab} />;
          case 'results':
            return <LearnerResultsTab batch={batch} />;
          case 'evidence':
            return <EvidenceTab batch={batch} />;
          case 'section-e':
            return <SectionETab batch={batch} />;
          case 'chain':
            return <ApprovalChainTab batch={batch} />;
          case 'letter':
            return <FisaOutcomeLetterDoc batch={batch} />;
          case 'report':
            return <FisaVerificationReportDoc batch={batch} audit={getAuditTrail(FISA_RESULTS_RECORD_TYPE, batch.id)} audience="internal" />;
          case 'recommendation':
            return <FisaRecommendationLetterDoc batch={batch} />;
          case 'audit':
            return (
              <>
                <AuditTrailCsvDownload recordType={FISA_RESULTS_RECORD_TYPE} recordId={batch.id} fileName={`Audit_Trail_FISA_${batch.id.slice(-4)}.csv`} />
                <AuditTrailView recordTypes={[FISA_RESULTS_RECORD_TYPE]} recordId={batch.id} />
              </>
            );
          case 'compliance':
          case 'checklist':
            return null;
        }
      }}
    />
  );
}

export function FisaResultsBatchWorkspace({ batchId, onClose }: { batchId: string | null; onClose: () => void }) {
  const { data: batch } = useFisaResultsBatch(batchId);
  return (
    <Modal
      open={!!batchId}
      onOpenChange={(open) => !open && onClose()}
      size="lg"
      title={batch?.skillsProgrammeTitle ?? ''}
      description={batch ? `${batch.sdpName} — FISA results` : undefined}
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      {batch && <FisaResultsBatchWorkspaceContent key={batch.id} batch={batch} />}
    </Modal>
  );
}
