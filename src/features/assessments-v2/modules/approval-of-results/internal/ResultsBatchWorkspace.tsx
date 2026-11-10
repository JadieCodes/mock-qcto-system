import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getAuditTrail } from '../../../shared/audit/auditLog';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { fileUploadIssue } from '../../../shared/files/fileCheck';
import { DocumentChecked, FileCheckError } from '../../../shared/files/FileCheckNotice';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import type { ValidationIssue } from '../../../shared/validation/types';
import { isModuleVisible } from '../../../shared/visibility/moduleAccess';
import { POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT, visibilityScopeForRole } from '../../site-visits/config';
import { useSiteVisit } from '../../site-visits/hooks';
import { checklistCompletionSummary, overallStatusLabel, reportIsApproved } from '../../site-visits/workflow';
import { EISA_RESULTS_RECORD_TYPE, RESULTS_AD_ROLE } from '../config';
import { BatchDocumentsCard } from '../components/BatchDocumentsCard';
import { AuditTrailCsvDownload } from '../components/AuditTrailCsvDownload';
import { BatchDownloads } from '../components/BatchDownloads';
import { DdLetterChecklistPanel } from '../components/DdLetterChecklistPanel';
import { EisaReviewForm } from '../components/EisaReviewForm';
import { DeclarationLine, EisaEvidenceList, OnFileDocumentsList } from '../components/EisaSubmissionPack';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { EisaBatchFigures } from '../components/EisaBatchFigures';
import { EisaLearnerResultsTable } from '../components/EisaLearnerResultsTable';
import { DeclineRecommendationsNotice, DeclineResultsForm, EvidenceDates, FinalDecisionNotice } from '../components/DecisionPanels';
import { OutcomeLetterView } from '../components/OutcomeLetterView';
import { ResultsActionBar } from '../components/ResultsActionBar';
import { documentsForPortal, EISA_BATCH_DOCUMENTS, type EisaBatchDocumentId } from '../batchDocuments';
import { eisaReviewIssues } from '../eisaReview';
import { downloadDdLetterChecklist, downloadEisaVerificationReport, type EisaReportContext } from '../eisaVerificationReport';
import { ddChecklistIssues } from '../letterChecklist';
import { downloadLetterModel, eisaOutcomeLetter, eisaRecommendationLetter } from '../outcomeLetters';
import { eisaRegisterCsv } from '../trackingRegister';
import { downloadCsvFile } from '../../../shared/csv/csv';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import {
  useCreatePemVisitForBatch,
  useMarkingModerationStatus,
  useResultsAction,
  useEisaReportContext,
  useResultsBatch,
  useSaveComplianceReviewNotes,
  useSaveEvidenceEvaluationNotes,
  useUploadEvidenceDocument,
} from '../hooks';
import { canDeclineResults, competencyRatePercent, isBelowPostEisaThreshold, RESULTS_WORKFLOW } from '../workflow';
import type { ResultsBatch } from '../types';

// QCTO feedback 2.8: final approval below the threshold creates the Post-EISA Monitoring visit
// automatically (approval-of-results/api.ts). The button is only a fallback for an approved
// batch that has no visit yet.
function PemVisitBanner({ batch }: { batch: ResultsBatch }) {
  const { role, person } = useV2Role();
  const createPemVisit = useCreatePemVisitForBatch();
  const { data: visit } = useSiteVisit(batch.pemVisitId);
  const rateText = `Competency rate ${competencyRatePercent(batch)}% is below the ${POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT}% threshold.`;
  const canOpenSiteVisits = isModuleVisible('internal', 'site-visits', role);

  if (batch.workflow.stageId !== 'approved') {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
        <p className="text-sm text-amber-800">
          {rateText} A Post-EISA Monitoring visit will be created automatically when the batch gets final approval.
        </p>
      </div>
    );
  }

  if (!batch.pemVisitId) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-2">
        <p className="text-sm text-amber-800">{rateText} No Post-EISA Monitoring visit exists for this batch yet.</p>
        <Button
          size="sm"
          disabled={createPemVisit.isPending}
          onClick={() => createPemVisit.mutate({ batchId: batch.id, actorRole: role, actorId: person.id, actorName: person.name })}
        >
          Create Post-EISA Monitoring Visit
        </Button>
      </div>
    );
  }

  const scheduled = !!visit?.visitDate;
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1.5">
      <p className="text-sm text-amber-800">
        {rateText}{' '}
        {scheduled
          ? `A Post-EISA Monitoring visit has been created and is scheduled for ${visit.visitDate} (${overallStatusLabel(visit)}).`
          : 'A Post-EISA Monitoring visit has been created and is waiting for a date.'}
      </p>
      {canOpenSiteVisits ? (
        <Link to={`../site-visits?visit=${batch.pemVisitId}`} className="text-sm font-medium text-blue-700 underline underline-offset-2">
          Open the visit in Site Visits &amp; Monitoring
        </Link>
      ) : (
        <p className="text-xs text-amber-700">The ASD picks the date in Site Visits &amp; Monitoring.</p>
      )}
    </div>
  );
}

// QCTO feedback 05.17: only the documents that already have a download are linked; the others
// show "Generated at final approval" until the batch that builds them adds them here.
// Batch N1 (05.16): on any batch with a final decision — the Outcome Letter (approval or decline),
// the verification report and, on an approved batch only, the Certification recommendation letter.
// Batch N2: the verification report follows QCTO's layout; the approved batch also has its tracking
// register line and the letter checklist.
function eisaDownloads(batch: ResultsBatch, ctx: EisaReportContext): Partial<Record<EisaBatchDocumentId, () => void>> {
  if (!batch.finalDecision) return {};
  const recommendation = eisaRecommendationLetter(batch);
  return {
    'eisa-outcome-letter': () => downloadLetterModel(eisaOutcomeLetter(batch, false)),
    'eisa-verification-report': () => downloadEisaVerificationReport(batch, getAuditTrail(EISA_RESULTS_RECORD_TYPE, batch.id), ctx),
    'eisa-letter-checklist': () => downloadDdLetterChecklist(batch),
    ...(recommendation
      ? {
          'eisa-recommendation-letter': () => downloadLetterModel(recommendation),
          'eisa-tracking-register': () => downloadCsvFile(`Tracking_Register_Entry_EISA_${batch.sittingDate}_${batch.id.slice(-4)}.csv`, eisaRegisterCsv([batch], '', '').csv),
        }
      : {}),
  };
}

function DetailsTab({ batch }: { batch: ResultsBatch }) {
  const { data: mmVisits = [] } = useMarkingModerationStatus(batch.sittingId);
  const { role } = useV2Role();
  const reportContext = useEisaReportContext(batch.sittingId);
  // Rows 36/38: who can see the report itself (not just the status) is driven by the same
  // CR-054 REPORT_VISIBILITY_RULES table the Site Visits hub reads from, not a separate rule
  // invented for this screen.
  const canSeeReportDetails = visibilityScopeForRole(role) === 'all';

  const belowThreshold = isBelowPostEisaThreshold(batch);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Status</span>
        <ResultsBatchStatusBadge batch={batch} />
      </div>
      {batch.finalDecision && <FinalDecisionNotice decision={batch.finalDecision} />}
      <EvidenceDates requestedAt={batch.evidenceRequestedAt} receivedAt={batch.finalEvidenceReceivedAt} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">QP</Label>
          <p className="text-sm font-medium">{batch.qpName}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Qualification</Label>
          <p className="text-sm font-medium">{batch.qualificationTitle}</p>
        </div>
        <div className="space-y-1">
          {/* QCTO feedback 29.32: "EISA date", not "Sitting date". */}
          <Label className="text-xs text-gray-400 uppercase">EISA Date</Label>
          <p className="text-sm font-medium">{batch.sittingDate}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Submission</Label>
          <DeadlineBadge deadline={batch.submissionDeadline} submittedAt={batch.submittedAt} />
        </div>
      </div>

      {/* QCTO feedback 29.31: the batch figures and every learner's marks per component, the
          result per component, the weighted score and the final result (calculation.ts). */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch Results</p>
        <EisaBatchFigures batch={batch} />
        <EisaLearnerResultsTable batch={batch} />
        {belowThreshold && <PemVisitBanner batch={batch} />}
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Marking &amp; Moderation Monitoring Status</p>
        </div>
        <div className="p-4">
          {mmVisits.length === 0 ? (
            <p className="text-sm text-gray-400">No linked Marking &amp; Moderation visit for this sitting.</p>
          ) : (
            <div className="space-y-3">
              {mmVisits.map((v) => {
                const summary = checklistCompletionSummary(v);
                const notes = Object.values(v.freeTextNotes).filter((n) => n.trim().length > 0);
                return (
                  <div key={v.id} className="rounded-xl border p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{v.venue || 'Marking & Moderation visit'}</span>
                      <span className="text-gray-500">{overallStatusLabel(v)}</span>
                    </div>
                    {/* Row 38 (G-26): show the report itself, not just its status, once it's
                        been approved — gated by the same visibility rule checked above. */}
                    {!canSeeReportDetails ? (
                      <p className="text-xs text-gray-400">Report details are restricted for your role.</p>
                    ) : !reportIsApproved(v) ? (
                      <p className="text-xs text-gray-400">Report not yet approved.</p>
                    ) : (
                      <div className="text-xs text-gray-600 space-y-1 pt-1.5 border-t">
                        <p>
                          Checklist: {summary.answered} of {summary.total} lines completed.
                        </p>
                        {v.completedBy && (
                          <p>
                            Completed by {v.completedBy}
                            {v.completedDate && ` on ${v.completedDate}`}.
                          </p>
                        )}
                        {notes.length > 0 && <p className="whitespace-pre-wrap">{notes.join(' — ')}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-gray-400 uppercase">Evidence Documents</Label>
        <EisaEvidenceList files={batch.evidenceDocuments} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-400 uppercase">Already on File</Label>
        <OnFileDocumentsList documents={batch.onFileDocuments} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-gray-400 uppercase">Declaration</Label>
        <DeclarationLine declaration={batch.declaration} />
      </div>
      <BatchDocumentsCard documents={documentsForPortal(EISA_BATCH_DOCUMENTS, 'internal')} downloads={eisaDownloads(batch, reportContext)} />
    </div>
  );
}

function ComplianceReviewTab({ batch }: { batch: ResultsBatch }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const saveReviewNotes = useSaveComplianceReviewNotes();
  const saveEvidenceNotes = useSaveEvidenceEvaluationNotes();
  const uploadEvidence = useUploadEvidenceDocument();
  const resultsAction = useResultsAction();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadChecked, setUploadChecked] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const editable = role === RESULTS_AD_ROLE && batch.workflow.stageId === 'ad-review';
  const reviewIssues = eisaReviewIssues(batch.eisaReview);
  const notesComplete = batch.complianceReviewNotes.trim().length > 0 && batch.evidenceEvaluationNotes.trim().length > 0;
  const advanceIssues: ValidationIssue[] = editable
    ? [
        ...(batch.complianceReviewNotes.trim() ? [] : [{ field: 'complianceReviewNotes', message: 'Compliance review notes are required.' }]),
        ...(batch.evidenceEvaluationNotes.trim() ? [] : [{ field: 'evidenceEvaluationNotes', message: 'Evidence evaluation notes are required.' }]),
        ...reviewIssues,
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Compliance Review Notes</Label>
        <Textarea
          rows={3}
          value={batch.complianceReviewNotes}
          disabled={!editable}
          onChange={(e) => saveReviewNotes.mutate({ id: batch.id, notes: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Evidence Evaluation Notes</Label>
        <Textarea
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
        <div className="space-y-1.5 pt-2">
          <Label className="text-xs text-gray-400 uppercase">Evidence Documents</Label>
          <EisaEvidenceList files={batch.evidenceDocuments} />
        </div>
        <div className="space-y-1.5 pt-2">
          <Label className="text-xs text-gray-400 uppercase">Already on File</Label>
          <OnFileDocumentsList documents={batch.onFileDocuments} />
        </div>
      </div>

      <EisaReviewForm batch={batch} editable={editable} />

      {batch.workflow.stageId === 'ad-review' && (
        <>
          <ValidationSummary issues={advanceIssues} title="Complete these before advancing to the Deputy Director:" />
          <ResultsActionBar
            definition={RESULTS_WORKFLOW}
            stageId={batch.workflow.stageId}
            role={role}
            disabledActionIds={!(reviewIssues.length === 0 && notesComplete) ? ['ad-advance'] : []}
            onRun={(actionId, note) => resultsAction.mutate({ batchId: batch.id, actionId, actorRole: role, actorId, actorName, note })}
          />
        </>
      )}
    </div>
  );
}

function ApprovalChainTab({ batch }: { batch: ResultsBatch }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const resultsAction = useResultsAction();
  const reportContext = useEisaReportContext(batch.sittingId);
  const ddIssues = batch.workflow.stageId === 'dd-review' ? ddChecklistIssues(batch.ddChecklist) : [];

  const stageOrder = ['ad-review', 'dd-review', 'director-review', 'chief-director-review'];
  const currentIndex = stageOrder.indexOf(batch.workflow.stageId);

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

      {['dd-review', 'director-review', 'chief-director-review'].includes(batch.workflow.stageId) && (
        <div className="space-y-2">
          {ddIssues.length > 0 && (
            <p className="text-xs text-amber-700">
              Tick every line of the Approval of Results letter checklist (Outcome Letter tab) before sending the batch on. {ddIssues.length} line(s) left.
            </p>
          )}
          <ResultsActionBar
            definition={RESULTS_WORKFLOW}
            stageId={batch.workflow.stageId}
            role={role}
            hiddenActionIds={['chief-director-decline']}
            disabledActionIds={ddIssues.length > 0 ? ['dd-advance', 'dd-recommend-decline'] : []}
            onRun={(actionId, note) => resultsAction.mutate({ batchId: batch.id, actionId, actorRole: role, actorId, actorName, note })}
          />
          {canDeclineResults(role, batch.workflow.stageId) && (
            <DeclineResultsForm
              disabled={resultsAction.isPending}
              onDecline={(irregularities, correctiveActions) =>
                resultsAction.mutate({ batchId: batch.id, actionId: 'chief-director-decline', actorRole: role, actorId, actorName, irregularities, correctiveActions })
              }
            />
          )}
        </div>
      )}

      {batch.workflow.stageId === 'more-evidence' && batch.declineHistory.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-1">
          <p className="font-semibold">More evidence requested at: {RESULTS_WORKFLOW.stages.find((s) => s.id === batch.declineHistory[batch.declineHistory.length - 1].stageId)?.label}</p>
          <p>{batch.declineHistory[batch.declineHistory.length - 1].reason}</p>
          <p className="text-xs text-amber-700">The QP has been notified and can add evidence and resubmit.</p>
        </div>
      )}

      {batch.finalDecision && (
        <>
          <FinalDecisionNotice decision={batch.finalDecision} />
          <BatchDownloads
            onDownloadLetter={() => downloadLetterModel(eisaOutcomeLetter(batch, false))}
            onDownloadReport={() => downloadEisaVerificationReport(batch, getAuditTrail(EISA_RESULTS_RECORD_TYPE, batch.id), reportContext)}
          />
        </>
      )}
    </div>
  );
}

// Batch N1: the Outcome Letter is a draft from the Deputy Director stage onwards and final once the
// batch is decided. The Certification recommendation letter exists on an approved batch only.
const DRAFT_LETTER_STAGES = ['dd-review', 'director-review', 'chief-director-review'];

// Batch N2: the Deputy Director checks QCTO's letter checklist against this letter.
function OutcomeLetterTab({ batch }: { batch: ResultsBatch }) {
  const reportContext = useEisaReportContext(batch.sittingId);
  return (
    <div className="space-y-4">
      <DdLetterChecklistPanel batch={batch} ctx={reportContext} />
      <OutcomeLetterView model={eisaOutcomeLetter(batch, !batch.finalDecision)} />
    </div>
  );
}

function RecommendationLetterTab({ batch }: { batch: ResultsBatch }) {
  const letter = eisaRecommendationLetter(batch);
  return letter ? <OutcomeLetterView model={letter} /> : null;
}

function ResultsBatchWorkspaceContent({ batch }: { batch: ResultsBatch }) {
  const showLetter = !!batch.finalDecision || DRAFT_LETTER_STAGES.includes(batch.workflow.stageId);
  const showRecommendation = batch.finalDecision?.outcome === 'approved';
  return (
    <Tabs defaultValue="details">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="compliance">Compliance Review</TabsTrigger>
        <TabsTrigger value="chain">Approval Chain</TabsTrigger>
        {showLetter && <TabsTrigger value="letter">Outcome Letter</TabsTrigger>}
        {showRecommendation && <TabsTrigger value="recommendation">Certification Recommendation</TabsTrigger>}
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
          <OutcomeLetterTab batch={batch} />
        </TabsContent>
      )}
      {showRecommendation && (
        <TabsContent value="recommendation" className="pt-4">
          <RecommendationLetterTab batch={batch} />
        </TabsContent>
      )}
      <TabsContent value="audit" className="pt-4">
        <AuditTrailCsvDownload recordType={EISA_RESULTS_RECORD_TYPE} recordId={batch.id} fileName={`Audit_Trail_EISA_${batch.sittingDate}_${batch.id.slice(-4)}.csv`} />
        <AuditTrailView recordTypes={['results-batch']} recordId={batch.id} />
      </TabsContent>
    </Tabs>
  );
}

export function ResultsBatchWorkspace({ batchId, onClose }: { batchId: string | null; onClose: () => void }) {
  const { data: batch } = useResultsBatch(batchId);
  return (
    <Modal
      open={!!batchId}
      onOpenChange={(open) => !open && onClose()}
      size="lg"
      title={batch?.qualificationTitle ?? ''}
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      {batch && <ResultsBatchWorkspaceContent batch={batch} />}
    </Modal>
  );
}
