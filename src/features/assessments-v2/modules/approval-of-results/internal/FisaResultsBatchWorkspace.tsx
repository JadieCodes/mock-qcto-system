import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getAuditTrail } from '../../../shared/audit/auditLog';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { Checklist } from '../../../shared/checklist/Checklist';
import { getChecklistIssues, isChecklistComplete } from '../../../shared/checklist/types';
import { LetterView } from '../../../shared/letters/LetterView';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import type { ValidationIssue } from '../../../shared/validation/types';
import { FISA_RESULTS_RECORD_TYPE, RESULTS_AD_ROLE } from '../config';
import { BatchDownloads } from '../components/BatchDownloads';
import { FisaEvidenceList, FisaLearnerResultsList } from '../components/FisaBatchLists';
import { ResultsActionBar } from '../components/ResultsActionBar';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { downloadFisaApprovalLetter, downloadFisaVerificationReport, fisaApprovalLetter } from '../downloads';
import {
  useFisaResultsAction,
  useFisaResultsBatch,
  useSaveFisaComplianceChecklist,
  useSaveFisaComplianceReviewNotes,
  useSaveFisaEvidenceEvaluationNotes,
  useUploadFisaReviewEvidence,
} from '../hooks';
import { FISA_RESULTS_WORKFLOW, fisaCompetencyRatePercent, fisaCompetentCountOf } from '../workflow';
import type { FisaResultsBatch } from '../types';

function stageLabel(stageId: string): string {
  return FISA_RESULTS_WORKFLOW.stages.find((s) => s.id === stageId)?.label ?? stageId;
}

function DetailsTab({ batch }: { batch: FisaResultsBatch }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Status</span>
        <ResultsBatchStatusBadge batch={batch} />
      </div>
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
        <p className="text-2xl font-bold text-gray-900">{fisaCompetencyRatePercent(batch)}%</p>
        <p className="text-xs text-gray-500">
          {fisaCompetentCountOf(batch)} of {batch.learnerResults.length} learners found competent.
        </p>
        <FisaLearnerResultsList results={batch.learnerResults} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-gray-400 uppercase">Evidence</Label>
        <FisaEvidenceList files={batch.evidenceDocuments} />
      </div>
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
  const uploadEvidence = useUploadFisaReviewEvidence();
  const resultsAction = useFisaResultsAction();

  const editable = role === RESULTS_AD_ROLE && batch.workflow.stageId === 'ad-review';
  const checklistComplete = isChecklistComplete(batch.complianceChecklist, true);
  const notesComplete = batch.complianceReviewNotes.trim().length > 0 && batch.evidenceEvaluationNotes.trim().length > 0;
  const advanceIssues: ValidationIssue[] = editable
    ? [
        ...(batch.complianceReviewNotes.trim() ? [] : [{ field: 'complianceReviewNotes', message: 'Compliance review notes are required.' }]),
        ...(batch.evidenceEvaluationNotes.trim() ? [] : [{ field: 'evidenceEvaluationNotes', message: 'Evidence evaluation notes are required.' }]),
        ...getChecklistIssues(batch.complianceChecklist, true),
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
          <input
            type="file"
            aria-label="Add an evidence file"
            className="text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadEvidence.mutate({ id: batch.id, file: { fileName: file.name, fileSize: file.size, fileType: file.type || 'unknown' } });
              e.target.value = '';
            }}
          />
        )}
      </div>

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
            disabledActionIds={!(checklistComplete && notesComplete) ? ['ad-advance'] : []}
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
  const latestDecline = batch.declineHistory[batch.declineHistory.length - 1];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Approval Chain</p>
        </div>
        <div className="p-4 flex flex-wrap items-center gap-2 text-xs">
          {['ASD', 'Deputy Director', 'Director', 'Chief Director'].map((label, i) => (
            <span key={label} className={i <= currentIndex && batch.workflow.stageId !== 'declined' ? 'font-semibold text-blue-700' : 'text-gray-400'}>
              {label}
              {i < 3 ? ' →' : ''}
            </span>
          ))}
        </div>
      </div>

      {['dd-review', 'director-review', 'chief-director-review'].includes(batch.workflow.stageId) && (
        <ResultsActionBar
          definition={FISA_RESULTS_WORKFLOW}
          stageId={batch.workflow.stageId}
          role={role}
          onRun={(actionId, note) => resultsAction.mutate({ batchId: batch.id, actionId, actorRole: role, actorId: person.id, actorName: person.name, note })}
        />
      )}

      {batch.workflow.stageId === 'declined' && latestDecline && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 space-y-1">
          <p className="font-semibold">Declined at: {stageLabel(latestDecline.stageId)}</p>
          <p>{latestDecline.reason}</p>
          <p className="text-xs text-red-600">The SDP has been notified and can resubmit.</p>
        </div>
      )}

      {batch.workflow.stageId === 'approved' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Approved by the Chief Director.
            {batch.approvalLetter && ` The approval letter was sent to the SDP on ${new Date(batch.approvalLetter.sentToSdpAt).toLocaleDateString('en-ZA')}.`}
            {batch.recommendation && ' Recommended to the Certification domain for certificate printing.'}
          </div>
          <BatchDownloads
            onDownloadLetter={() => downloadFisaApprovalLetter(batch)}
            onDownloadReport={() => downloadFisaVerificationReport(batch, getAuditTrail(FISA_RESULTS_RECORD_TYPE, batch.id))}
          />
        </div>
      )}
    </div>
  );
}

function FisaResultsBatchWorkspaceContent({ batch }: { batch: FisaResultsBatch }) {
  const approved = batch.workflow.stageId === 'approved' && !!batch.approvalLetter;
  return (
    <Tabs defaultValue="details">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="compliance">Compliance Review</TabsTrigger>
        <TabsTrigger value="chain">Approval Chain</TabsTrigger>
        {approved && <TabsTrigger value="letter">Approval Letter</TabsTrigger>}
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
      {approved && (
        <TabsContent value="letter" className="pt-4">
          <LetterView letter={fisaApprovalLetter(batch)} />
        </TabsContent>
      )}
      <TabsContent value="audit" className="pt-4">
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
