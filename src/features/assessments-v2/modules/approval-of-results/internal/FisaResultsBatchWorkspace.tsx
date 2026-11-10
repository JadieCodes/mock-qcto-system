import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getAuditTrail } from '../../../shared/audit/auditLog';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { Checklist } from '../../../shared/checklist/Checklist';
import { getChecklistIssues, isChecklistComplete } from '../../../shared/checklist/types';
import { fileUploadIssue } from '../../../shared/files/fileCheck';
import { DocumentChecked, FileCheckError } from '../../../shared/files/FileCheckNotice';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import type { ValidationIssue } from '../../../shared/validation/types';
import { FISA_RESULTS_RECORD_TYPE, RESULTS_AD_ROLE, RESULTS_DD_ROLE } from '../config';
import { BatchDocumentsCard } from '../components/BatchDocumentsCard';
import { AuditTrailCsvDownload } from '../components/AuditTrailCsvDownload';
import { BatchDownloads } from '../components/BatchDownloads';
import { FisaSectionE1, FisaSectionE2 } from '../components/FisaSectionEForm';
import { FisaEvidenceList, FisaLearnerResultsList } from '../components/FisaBatchLists';
import { DeclineRecommendationsNotice, DeclineResultsForm, EvidenceDates, FinalDecisionNotice } from '../components/DecisionPanels';
import { OutcomeLetterView } from '../components/OutcomeLetterView';
import { ResultsActionBar } from '../components/ResultsActionBar';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { documentsForPortal, FISA_BATCH_DOCUMENTS, type FisaBatchDocumentId } from '../batchDocuments';
import { downloadCsvFile } from '../../../shared/csv/csv';
import { fisaSectionEIssues } from '../fisaSectionE';
import { downloadFisaVerificationReport } from '../fisaVerificationReport';
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

function DetailsTab({ batch }: { batch: FisaResultsBatch }) {
  const figures = fisaFiguresOf(batch);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Status</span>
        <ResultsBatchStatusBadge batch={batch} />
      </div>
      {batch.finalDecision && <FinalDecisionNotice decision={batch.finalDecision} />}
      <EvidenceDates requestedAt={batch.evidenceRequestedAt} receivedAt={batch.finalEvidenceReceivedAt} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">SDP</Label>
          <p className="text-sm font-medium">{batch.sdpName}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Skills Programme</Label>
          <p className="text-sm font-medium">{batch.skillsProgrammeTitle}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Date of FISA</Label>
          <p className="text-sm font-medium">{batch.fisaDates.join(', ')}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Submitted</Label>
          <p className="text-sm font-medium">{batch.submittedAt?.slice(0, 10) ?? '—'}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Declaration</Label>
          <p className="text-sm font-medium">
            {batch.declaration ? `Ticked by ${batch.declaration.acceptedBy} on ${batch.declaration.acceptedAt.slice(0, 10)}` : '—'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch Competency Rate</p>
        <p className="text-2xl font-bold text-gray-900">{figures.competencyRatePercent}%</p>
        <p className="text-xs text-gray-500">
          {figures.competent} of {figures.completed} learners who completed the FISA found competent ({figures.absent} absent).
        </p>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">Throughput Rate</p>
        <p className="text-lg font-bold text-gray-900">{figures.throughputRatePercent}%</p>
        <p className="text-xs text-gray-500">Throughput rate = completed ÷ enrolled ({figures.completed} of {figures.enrolled}).</p>
        <FisaLearnerResultsList results={batch.learnerResults} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-gray-400 uppercase">Evidence</Label>
        <FisaEvidenceList files={batch.evidenceDocuments} />
      </div>
      <BatchDocumentsCard documents={documentsForPortal(FISA_BATCH_DOCUMENTS, 'internal')} downloads={fisaDownloads(batch)} />
    </div>
  );
}

// The same ASD compliance and evidence review as an EISA batch, with the same advance check
// (api.ts assertAsdReviewComplete).
function ComplianceReviewTab({ batch }: { batch: FisaResultsBatch }) {
  const { role, person } = useV2Role();
  const saveChecklist = useSaveFisaComplianceChecklist();
  const saveReviewNotes = useSaveFisaComplianceReviewNotes();
  const saveEvidenceNotes = useSaveFisaEvidenceEvaluationNotes();
  const saveRecommendations = useSaveFisaRecommendations();
  const uploadEvidence = useUploadFisaReviewEvidence();
  const resultsAction = useFisaResultsAction();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadChecked, setUploadChecked] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const editable = role === RESULTS_AD_ROLE && batch.workflow.stageId === 'ad-review';
  const checklistComplete = isChecklistComplete(batch.complianceChecklist, true);
  const notesComplete = batch.complianceReviewNotes.trim().length > 0 && batch.evidenceEvaluationNotes.trim().length > 0;
  const sectionEIssues = fisaSectionEIssues(batch);
  const advanceIssues: ValidationIssue[] = editable
    ? [
        ...(batch.complianceReviewNotes.trim() ? [] : [{ field: 'complianceReviewNotes', message: 'Compliance review notes are required.' }]),
        ...(batch.evidenceEvaluationNotes.trim() ? [] : [{ field: 'evidenceEvaluationNotes', message: 'Evidence evaluation notes are required.' }]),
        ...getChecklistIssues(batch.complianceChecklist, true),
        ...sectionEIssues,
      ]
    : [];

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
        <p className="text-xs text-gray-500">Printed on the Outcome Letter.</p>
      </div>

      <FisaSectionE1 batch={batch} editable={editable} />

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Folder-by-Folder Compliance Checklist</p>
        <Checklist sections={batch.complianceChecklist} readonly={!editable} onChange={(sections) => saveChecklist.mutate({ id: batch.id, sections })} />
      </div>

      {batch.workflow.stageId === 'ad-review' && (
        <>
          <ValidationSummary issues={advanceIssues} title="Complete these before advancing to the Deputy Director:" />
          <ResultsActionBar
            definition={FISA_RESULTS_WORKFLOW}
            stageId={batch.workflow.stageId}
            role={role}
            disabledActionIds={!(checklistComplete && notesComplete && sectionEIssues.length === 0) ? ['ad-advance'] : []}
            onRun={(actionId, note) => resultsAction.mutate({ batchId: batch.id, actionId, actorRole: role, actorId: person.id, actorName: person.name, note })}
          />
        </>
      )}
    </div>
  );
}

function ApprovalChainTab({ batch }: { batch: FisaResultsBatch }) {
  const { role, person } = useV2Role();
  const resultsAction = useFisaResultsAction();

  const stageOrder = ['ad-review', 'dd-review', 'director-review', 'chief-director-review'];
  const currentIndex = batch.workflow.stageId === 'approved' ? stageOrder.length : stageOrder.indexOf(batch.workflow.stageId);
  const latestRequest = batch.declineHistory[batch.declineHistory.length - 1];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Approval Chain</p>
        </div>
        <div className="p-4 flex flex-wrap items-center gap-2 text-xs">
          {['ASD', 'Deputy Director', 'Director', 'Chief Director'].map((label, i) => (
            <span key={label} className={i <= currentIndex && batch.workflow.stageId !== 'more-evidence' ? 'font-semibold text-blue-700' : 'text-gray-400'}>
              {label}
              {i < 3 ? ' →' : ''}
            </span>
          ))}
        </div>
      </div>

      <DeclineRecommendationsNotice recommendations={batch.declineRecommendations} cycle={batch.cycleCount} />

      {!['ad-review', 'more-evidence'].includes(batch.workflow.stageId) && (
        <FisaSectionE2 batch={batch} editable={role === RESULTS_DD_ROLE && batch.workflow.stageId === 'dd-review'} />
      )}

      {['dd-review', 'director-review', 'chief-director-review'].includes(batch.workflow.stageId) && (
        <div className="space-y-2">
          <ResultsActionBar
            definition={FISA_RESULTS_WORKFLOW}
            stageId={batch.workflow.stageId}
            role={role}
            hiddenActionIds={['chief-director-decline']}
            onRun={(actionId, note) => resultsAction.mutate({ batchId: batch.id, actionId, actorRole: role, actorId: person.id, actorName: person.name, note })}
          />
          {canDeclineResults(role, batch.workflow.stageId) && (
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
      )}

      {batch.workflow.stageId === 'more-evidence' && latestRequest && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-1">
          <p className="font-semibold">More evidence requested at: {stageLabel(latestRequest.stageId)}</p>
          <p>{latestRequest.reason}</p>
          <p className="text-xs text-amber-700">The SDP has been notified and can add evidence and resubmit.</p>
        </div>
      )}

      {batch.finalDecision && (
        <div className="space-y-3">
          <FinalDecisionNotice decision={batch.finalDecision} />
          <BatchDownloads
            onDownloadLetter={() => downloadLetterModel(fisaOutcomeLetter(batch, false))}
            onDownloadReport={() => downloadFisaVerificationReport(batch, getAuditTrail(FISA_RESULTS_RECORD_TYPE, batch.id))}
          />
        </div>
      )}
    </div>
  );
}

// Batch N1: the Outcome Letter is a draft from the Deputy Director stage onwards and final once the
// batch is decided; the SP certification recommendation letter exists on an approved batch only.
function FisaResultsBatchWorkspaceContent({ batch }: { batch: FisaResultsBatch }) {
  const showLetter = !!batch.finalDecision || ['dd-review', 'director-review', 'chief-director-review'].includes(batch.workflow.stageId);
  const recommendation = fisaRecommendationLetter(batch);
  return (
    <Tabs defaultValue="details">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="compliance">Compliance Review</TabsTrigger>
        <TabsTrigger value="chain">Approval Chain</TabsTrigger>
        {showLetter && <TabsTrigger value="letter">Outcome Letter</TabsTrigger>}
        {recommendation && <TabsTrigger value="recommendation">Certification Recommendation</TabsTrigger>}
        <TabsTrigger value="audit">Audit Trail</TabsTrigger>
      </TabsList>
      <TabsContent value="details" className="pt-4">
        <DetailsTab batch={batch} />
      </TabsContent>
      <TabsContent value="compliance" className="pt-4">
        <ComplianceReviewTab batch={batch} />
      </TabsContent>
      <TabsContent value="chain" className="pt-4">
        <ApprovalChainTab batch={batch} />
      </TabsContent>
      {showLetter && (
        <TabsContent value="letter" className="pt-4">
          <OutcomeLetterView model={fisaOutcomeLetter(batch, !batch.finalDecision)} />
        </TabsContent>
      )}
      {recommendation && (
        <TabsContent value="recommendation" className="pt-4">
          <OutcomeLetterView model={recommendation} />
        </TabsContent>
      )}
      <TabsContent value="audit" className="pt-4">
        <AuditTrailCsvDownload recordType={FISA_RESULTS_RECORD_TYPE} recordId={batch.id} fileName={`Audit_Trail_FISA_${batch.id.slice(-4)}.csv`} />
        <AuditTrailView recordTypes={[FISA_RESULTS_RECORD_TYPE]} recordId={batch.id} />
      </TabsContent>
    </Tabs>
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
      {batch && <FisaResultsBatchWorkspaceContent batch={batch} />}
    </Modal>
  );
}
