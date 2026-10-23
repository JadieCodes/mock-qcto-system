import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { Checklist } from '../../../shared/checklist/Checklist';
import { getChecklistIssues, isChecklistComplete } from '../../../shared/checklist/types';
import { availableActions, canActInStage } from '../../../shared/workflow/engine';
import type { WorkflowAction } from '../../../shared/workflow/types';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import type { ValidationIssue } from '../../../shared/validation/types';
import { POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT, visibilityScopeForRole } from '../../site-visits/config';
import { checklistCompletionSummary, overallStatusLabel, reportIsApproved } from '../../site-visits/workflow';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import {
  useCreatePemVisitForBatch,
  useMarkingModerationStatus,
  useResultsAction,
  useResultsBatch,
  useSaveComplianceChecklist,
  useSaveComplianceReviewNotes,
  useSaveEvidenceEvaluationNotes,
  useUploadEvidenceDocument,
} from '../hooks';
import { competencyRatePercent, competentCountOf, RESULTS_WORKFLOW } from '../workflow';
import type { ResultsBatch } from '../types';
import type { Role } from '../../../types';

// A single generic button that opens an inline mandatory-reason box for decline actions, and
// fires immediately for ones that don't need one. Same shape as the QSA Addendum workspace's
// ActionButton — duplicated locally rather than shared, matching this codebase's existing
// per-module convention.
function ActionButton({ action, onRun, disabled }: { action: WorkflowAction; onRun: (note?: string) => void; disabled?: boolean }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const variant = action.kind === 'reject' ? 'destructive' : 'default';

  if (!action.requiresNote) {
    return (
      <Button size="sm" variant={variant} disabled={disabled} onClick={() => onRun()}>
        {action.label}
      </Button>
    );
  }
  if (!noteOpen) {
    return (
      <Button size="sm" variant={variant} disabled={disabled} onClick={() => setNoteOpen(true)}>
        {action.label}
      </Button>
    );
  }
  return (
    <div className="space-y-2 rounded-xl border p-3 bg-gray-50 w-full">
      <p className="text-xs font-medium text-gray-600">{action.label} — a reason is required</p>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Explain why..." />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={variant}
          disabled={!note.trim() || disabled}
          onClick={() => {
            onRun(note);
            setNoteOpen(false);
            setNote('');
          }}
        >
          Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setNoteOpen(false); setNote(''); }}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ActionBar({
  stageId,
  role,
  onRun,
  disabledActionIds,
}: {
  stageId: string;
  role: Role;
  onRun: (actionId: string, note?: string) => void;
  disabledActionIds?: string[];
}) {
  if (!canActInStage(RESULTS_WORKFLOW, stageId, role)) return null;
  const actions = availableActions(RESULTS_WORKFLOW, stageId);
  if (actions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {actions.map((action) => (
        <ActionButton key={action.id} action={action} disabled={disabledActionIds?.includes(action.id)} onRun={(note) => onRun(action.id, note)} />
      ))}
    </div>
  );
}

function DetailsTab({ batch }: { batch: ResultsBatch }) {
  const { data: mmVisits = [] } = useMarkingModerationStatus(batch.sittingId);
  const createPemVisit = useCreatePemVisitForBatch();
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  // Rows 36/38: who can see the report itself (not just the status) is driven by the same
  // CR-054 REPORT_VISIBILITY_RULES table the Site Visits hub reads from, not a separate rule
  // invented for this screen.
  const canSeeReportDetails = visibilityScopeForRole(role) === 'all';

  const rate = competencyRatePercent(batch);
  const belowThreshold = rate < POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Status</span>
        <ResultsBatchStatusBadge batch={batch} />
      </div>
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
          <Label className="text-xs text-gray-400 uppercase">Sitting Date</Label>
          <p className="text-sm font-medium">{batch.sittingDate}</p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Submission</Label>
          <DeadlineBadge deadline={batch.submissionDeadline} submittedAt={batch.submittedAt} />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch Competency Rate</p>
        <p className="text-2xl font-bold text-gray-900">{rate}%</p>
        <p className="text-xs text-gray-500">
          {competentCountOf(batch)} of {batch.learnerCount} learners found competent.
        </p>
        {/* Row 40: the rate above is calculated from these per-learner results, not typed in by
            hand (H-05/H-11/H-12/G-24) — shown here so the number is traceable. */}
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer select-none text-gray-600">View per-learner results</summary>
          <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {batch.learnerResults.map((r) => (
              <li key={r.learnerId} className="flex items-center justify-between gap-3 border-b last:border-b-0 py-1">
                <span className="truncate">{r.fullName}</span>
                <span className={r.outcome === 'competent' ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                  {r.outcome === 'competent' ? 'Competent' : 'Not yet competent'}
                </span>
              </li>
            ))}
          </ul>
        </details>
        {belowThreshold && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-2">
            <p className="text-sm text-amber-800">
              Below the {POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT}% competency threshold (PM-06 — trigger and threshold
              unconfirmed with QCTO).
            </p>
            {batch.workflow.stageId === 'approved' && !batch.pemVisitId && (
              <Button size="sm" disabled={createPemVisit.isPending} onClick={() => createPemVisit.mutate({ batchId: batch.id, actorId, actorName })}>
                Create Post-EISA Monitoring Visit
              </Button>
            )}
            {batch.pemVisitId && <p className="text-xs text-emerald-700 font-medium">A Post-EISA Monitoring visit has been created.</p>}
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Marking &amp; Moderation Monitoring Status (CR-052)</p>
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
                      <p className="text-xs text-gray-400">Report details are restricted for your role (CR-054 — still open with QCTO).</p>
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

      {batch.evidenceDocuments.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Evidence Documents</Label>
          <ul className="text-sm text-gray-700 space-y-0.5">
            {batch.evidenceDocuments.map((d, i) => (
              <li key={i} className="font-mono text-xs">
                {d.fileName}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ComplianceReviewTab({ batch }: { batch: ResultsBatch }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const saveChecklist = useSaveComplianceChecklist();
  const saveReviewNotes = useSaveComplianceReviewNotes();
  const saveEvidenceNotes = useSaveEvidenceEvaluationNotes();
  const uploadEvidence = useUploadEvidenceDocument();
  const resultsAction = useResultsAction();

  const editable = role === 'Assistant Director' && batch.workflow.stageId === 'ad-review';
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
          <input
            type="file"
            className="text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadEvidence.mutate({ id: batch.id, file: { fileName: file.name, fileSize: file.size } });
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
          <ActionBar
            stageId={batch.workflow.stageId}
            role={role}
            disabledActionIds={!(checklistComplete && notesComplete) ? ['ad-advance'] : []}
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

  const stageOrder = ['ad-review', 'dd-review', 'director-review', 'chief-director-review'];
  const currentIndex = stageOrder.indexOf(batch.workflow.stageId);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Approval Chain</p>
        </div>
        <div className="p-4 flex flex-wrap items-center gap-2 text-xs">
          {['Assistant Director', 'Deputy Director', 'Director', 'Chief Director'].map((label, i) => (
            <span key={label} className={i <= currentIndex && batch.workflow.stageId !== 'declined' ? 'font-semibold text-blue-700' : 'text-gray-400'}>
              {label}
              {i < 3 ? ' →' : ''}
            </span>
          ))}
        </div>
      </div>

      {batch.workflow.stageId !== 'ad-review' && batch.workflow.stageId !== 'declined' && batch.workflow.stageId !== 'approved' && (
        <ActionBar
          stageId={batch.workflow.stageId}
          role={role}
          onRun={(actionId, note) => resultsAction.mutate({ batchId: batch.id, actionId, actorRole: role, actorId, actorName, note })}
        />
      )}

      {batch.workflow.stageId === 'declined' && batch.declineHistory.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 space-y-1">
          <p className="font-semibold">Declined at: {batch.declineHistory[batch.declineHistory.length - 1].stageId}</p>
          <p>{batch.declineHistory[batch.declineHistory.length - 1].reason}</p>
          <p className="text-xs text-red-600">The QP has been notified and can resubmit.</p>
        </div>
      )}

      {batch.workflow.stageId === 'approved' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Approved by the Chief Director.
          {batch.recommendation && ' Recommended to the Certification domain for certificate printing.'}
        </div>
      )}
    </div>
  );
}

function ResultsBatchWorkspaceContent({ batch }: { batch: ResultsBatch }) {
  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="compliance">Compliance Review</TabsTrigger>
        <TabsTrigger value="chain">Approval Chain</TabsTrigger>
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
      <TabsContent value="audit" className="pt-4">
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
