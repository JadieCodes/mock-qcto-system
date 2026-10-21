import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { Checklist } from '../../../shared/checklist/Checklist';
import { isChecklistComplete } from '../../../shared/checklist/types';
import { availableActions, canActInStage } from '../../../shared/workflow/engine';
import type { WorkflowAction } from '../../../shared/workflow/types';
import { roleDescriptor } from '../../../config/roles';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT } from '../../site-visits/config';
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
import { competencyRatePercent, RESULTS_WORKFLOW } from '../workflow';
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
  const { role } = useV2Role();
  const actorName = roleDescriptor(role)?.label ?? role;

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
          {batch.competentCount} of {batch.learnerCount} learners found competent.
        </p>
        {belowThreshold && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-2">
            <p className="text-sm text-amber-800">
              Below the {POST_EISA_MONITORING_COMPETENCY_THRESHOLD_PERCENT}% competency threshold (PM-06 — trigger and threshold
              unconfirmed with QCTO).
            </p>
            {batch.workflow.stageId === 'approved' && !batch.pemVisitId && (
              <Button size="sm" disabled={createPemVisit.isPending} onClick={() => createPemVisit.mutate({ batchId: batch.id, actorName })}>
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
            <div className="space-y-2">
              {mmVisits.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{v.venue || 'Marking & Moderation visit'}</span>
                  <span className="text-gray-500">{v.reportWorkflow.stageId}</span>
                </div>
              ))}
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
  const { role } = useV2Role();
  const actorName = roleDescriptor(role)?.label ?? role;
  const saveChecklist = useSaveComplianceChecklist();
  const saveReviewNotes = useSaveComplianceReviewNotes();
  const saveEvidenceNotes = useSaveEvidenceEvaluationNotes();
  const uploadEvidence = useUploadEvidenceDocument();
  const resultsAction = useResultsAction();

  const editable = role === 'Assistant Director' && batch.workflow.stageId === 'ad-review';
  const checklistComplete = isChecklistComplete(batch.complianceChecklist, true);
  const notesComplete = batch.complianceReviewNotes.trim().length > 0 && batch.evidenceEvaluationNotes.trim().length > 0;

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
        <ActionBar
          stageId={batch.workflow.stageId}
          role={role}
          disabledActionIds={!(checklistComplete && notesComplete) ? ['ad-advance'] : []}
          onRun={(actionId, note) => resultsAction.mutate({ batchId: batch.id, actionId, actorRole: role, actorName, note })}
        />
      )}
    </div>
  );
}

function ApprovalChainTab({ batch }: { batch: ResultsBatch }) {
  const { role } = useV2Role();
  const actorName = roleDescriptor(role)?.label ?? role;
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
          onRun={(actionId, note) => resultsAction.mutate({ batchId: batch.id, actionId, actorRole: role, actorName, note })}
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
    <Dialog open={!!batchId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        {batch && (
          <>
            <DialogHeader>
              <DialogTitle>{batch.qualificationTitle}</DialogTitle>
            </DialogHeader>
            <ResultsBatchWorkspaceContent batch={batch} />
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
