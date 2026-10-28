import { useState } from 'react';
import { Award, BookOpen, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { Checklist } from '../../../shared/checklist/Checklist';
import { isChecklistComplete } from '../../../shared/checklist/types';
import { generateLetter } from '../../../shared/letters/templates';
import { LetterView } from '../../../shared/letters/LetterView';
import { personsForRole } from '../../../shared/people/directory';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ValidationSummary, FieldError } from '../../../shared/validation/ValidationSummary';
import type { ValidationIssue } from '../../../shared/validation/types';
import { ActionBar } from '../components/ActionBar';
import { RplToolkitStatusBadge } from '../components/StatusBadge';
import {
  useRplEvaluationAction,
  useRplOutcomeAction,
  useRplToolkitApplication,
  useSaveRplEvaluationReport,
  useSaveRplIacEndorsementNote,
  useSaveRplModerationChecklist,
  useSaveRplToolkitChecklist,
} from '../hooks';
import { RPL_EVAL_WORKFLOW, RPL_OUTCOME_WORKFLOW } from '../workflow';
import type { RplToolkitApplication } from '../types';

function ApplicationWorkspaceContent({ application }: { application: RplToolkitApplication }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const evaluationAction = useRplEvaluationAction();
  const outcomeAction = useRplOutcomeAction();
  const saveChecklist = useSaveRplToolkitChecklist();
  const saveReport = useSaveRplEvaluationReport();
  const saveModerationChecklist = useSaveRplModerationChecklist();
  const saveIacEndorsementNote = useSaveRplIacEndorsementNote();
  const [allocatedAsdId, setAllocatedAsdId] = useState('');
  const asdOptions = personsForRole('ASD');

  const checklistComplete = isChecklistComplete(application.checklist, true);
  const reportIssues: ValidationIssue[] = [];
  if (!application.evaluationReport.findings.trim()) reportIssues.push({ field: 'findings', message: 'Findings are required.' });
  if (application.evaluationReport.recommendation === '') reportIssues.push({ field: 'recommendation', message: 'Select a recommendation.' });
  const reportComplete = reportIssues.length === 0;
  const editableChecklist = role === 'ASD' && application.evalState.stageId === 'asd-evaluation';
  const canAllocate = role === 'Assistant Director' && application.evalState.stageId === 'ad-allocation';
  const decided = application.evalState.stageId === 'approved' || application.evalState.stageId === 'declined';

  // Row 46: Director & Team moderation (a checklist, comment on every line) sits before the
  // IAC, who then reviews and endorses the report with its own note — the IAC does not tick
  // the evaluation checklist, it endorses on top of it.
  const moderationEditable = role === 'Director & Team' && application.evalState.stageId === 'director-team-review';
  const moderationComplete = isChecklistComplete(application.moderationChecklist, true);
  const iacNoteEditable = role === 'IAC' && application.evalState.stageId === 'iac-review';
  // Once a box's stage is reached, it stays visible read-only to every later-stage viewer (the
  // IAC needs to see the moderation checklist it's endorsing; anyone reviewing a decided record
  // still needs to see the IAC's note) — same rule Fix 2A applied to the QSA Addendum's DD/IAC
  // boxes. Gating on the exact current stage only (as this was before) hid the moderation
  // checklist from the IAC the moment it reached iac-review, and hid the IAC's endorsement note
  // entirely once the record was approved/declined.
  const moderationTouched = application.moderationChecklist.some((section) => section.items.some((item) => item.answer !== null));
  const iacTouched = !!application.iacEndorsementNote.trim();
  const showModerationBox = application.evalState.stageId === 'director-team-review' || moderationTouched;
  const showIacBox = application.evalState.stageId === 'iac-review' || decided || iacTouched;
  const { data: linkedToolkit } = useRplToolkitApplication(application.updatesToolkitId);

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
        <TabsTrigger value="outcome">Outcome Letter</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Status</span>
          <RplToolkitStatusBadge application={application} />
        </div>
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">QP & Toolkit</p>
          </div>
          <div className="px-4 divide-y divide-gray-50">
            <div className="flex items-start gap-3 py-2.5">
              <BookOpen className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Name of QP</p>
                <p className="text-sm font-medium">{application.qpName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-2.5">
              <Award className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Submission Type</p>
                <p className="text-sm font-medium">
                  {application.toolkitType === 'new' ? 'New toolkit' : 'Updated toolkit'} — version {application.version}
                  {linkedToolkit && ` (updates "${linkedToolkit.toolkitTitle}" v${linkedToolkit.version})`}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-2.5">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Submission Date</p>
                <p className="text-sm font-medium">{application.submissionDate}</p>
              </div>
            </div>
          </div>
        </div>

        {application.description && (
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.description}</p>
          </div>
        )}

        {canAllocate && (
          <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
            <Label>Allocate to ASD *</Label>
            <div className="flex gap-2">
              <Select value={allocatedAsdId} onValueChange={setAllocatedAsdId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an ASD" />
                </SelectTrigger>
                <SelectContent>
                  {asdOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                disabled={!allocatedAsdId || evaluationAction.isPending}
                onClick={() =>
                  evaluationAction.mutate({ applicationId: application.id, actionId: 'rpl-allocate', actorRole: role, actorId, actorName, allocatedAsdId })
                }
              >
                Allocate
              </Button>
            </div>
          </div>
        )}
        {application.allocatedAsdName && <p className="text-xs text-gray-500">Allocated to: {application.allocatedAsdName}</p>}

        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit Trail</p>
          <AuditTrailView recordTypes={['rpl-toolkit-evaluation', 'rpl-toolkit-outcome']} recordId={application.id} />
        </div>
      </TabsContent>

      <TabsContent value="evaluation" className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">RPL Toolkit Evaluation Checklist</p>
          <Checklist
            sections={application.checklist}
            readonly={!editableChecklist}
            onChange={(sections) => saveChecklist.mutate({ applicationId: application.id, sections })}
          />
        </div>

        <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Evaluation Report</p>
          {editableChecklist && <ValidationSummary issues={reportIssues} title="Complete the report before sending to the Deputy Director:" />}
          <div className="space-y-2">
            <Label>Findings</Label>
            <Textarea
              rows={3}
              value={application.evaluationReport.findings}
              disabled={!editableChecklist}
              onChange={(e) => saveReport.mutate({ applicationId: application.id, report: { ...application.evaluationReport, findings: e.target.value } })}
            />
            {editableChecklist && <FieldError message={reportIssues.find((i) => i.field === 'findings')?.message} />}
          </div>
          <div className="space-y-2">
            <Label>Recommendation</Label>
            <Select
              value={application.evaluationReport.recommendation}
              disabled={!editableChecklist}
              onValueChange={(value) =>
                saveReport.mutate({
                  applicationId: application.id,
                  report: { ...application.evaluationReport, recommendation: value as 'recommended' | 'not-recommended' },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a recommendation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended for approval</SelectItem>
                <SelectItem value="not-recommended">Not recommended</SelectItem>
              </SelectContent>
            </Select>
            {editableChecklist && <FieldError message={reportIssues.find((i) => i.field === 'recommendation')?.message} />}
          </div>
        </div>

        {showModerationBox && (
          <div className="space-y-2 rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Director Office Moderation</p>
            <p className="text-xs text-gray-400">Director Office moderation before the IAC.</p>
            <Checklist
              sections={application.moderationChecklist}
              readonly={!moderationEditable}
              onChange={(sections) => saveModerationChecklist.mutate({ applicationId: application.id, sections })}
            />
          </div>
        )}

        {showIacBox && (
          <div className="space-y-2 rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">IAC Review & Endorsement</p>
            <Label>Endorsement note</Label>
            <Textarea
              rows={3}
              value={application.iacEndorsementNote}
              disabled={!iacNoteEditable}
              placeholder="Record the IAC's review of the moderated report before endorsing it..."
              onChange={(e) => saveIacEndorsementNote.mutate({ applicationId: application.id, note: e.target.value })}
            />
          </div>
        )}

        <ActionBar
          definition={RPL_EVAL_WORKFLOW}
          stageId={application.evalState.stageId}
          role={role}
          disabledActionIds={[
            ...(application.evalState.stageId === 'asd-evaluation' && !(checklistComplete && reportComplete) ? ['rpl-asd-send-to-dd'] : []),
            ...(application.evalState.stageId === 'director-team-review' && !moderationComplete ? ['rpl-director-team-send-to-iac'] : []),
            ...(application.evalState.stageId === 'iac-review' && !application.iacEndorsementNote.trim()
              ? ['rpl-iac-approve', 'rpl-iac-decline', 'rpl-iac-remediation']
              : []),
          ]}
          onRun={(actionId, note) => evaluationAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorId, actorName, note })}
        />

        {decided && (
          <p className={`text-sm font-semibold ${application.evalState.stageId === 'approved' ? 'text-emerald-700' : 'text-red-700'}`}>
            {application.evalState.stageId === 'approved' ? 'Approved by IAC.' : 'Declined by IAC.'}
          </p>
        )}
      </TabsContent>

      <TabsContent value="outcome" className="space-y-4">
        {!decided ? (
          <p className="text-sm text-gray-400">Not yet available — the IAC has not reached a decision.</p>
        ) : (
          <>
            {/* Row 45 (test findings J-04/K-08): the outcome letter is generated from the same
                shared template system as the QSA Addendum — the CEO signs it, no checklist. */}
            <LetterView
              letter={generateLetter('outcome', application.id, {
                qpName: application.qpName,
                qualificationTitle: application.toolkitTitle,
                date: new Date().toISOString().split('T')[0],
                notes: application.evalState.stageId === 'approved' ? 'Outcome: Approved.' : 'Outcome: Declined.',
                signatoryName: application.outcomeState.stageId === 'signed' ? application.outcomeState.submittedBy : undefined,
                signatoryTitle: 'CEO',
              }, undefined, 'rpl-toolkit')}
            />
            {application.outcomeState.stageId === 'signed' ? (
              <p className="text-sm text-emerald-700 font-medium">Signed by {application.outcomeState.submittedBy}.</p>
            ) : (
              <ActionBar
                definition={RPL_OUTCOME_WORKFLOW}
                stageId={application.outcomeState.stageId}
                role={role}
                onRun={(actionId) => outcomeAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorId, actorName })}
              />
            )}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function ApplicationWorkspace({ applicationId, onClose }: { applicationId: string | null; onClose: () => void }) {
  return (
    <Dialog open={!!applicationId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        {applicationId && <ApplicationWorkspaceInner key={applicationId} applicationId={applicationId} />}
      </DialogContent>
    </Dialog>
  );
}

function ApplicationWorkspaceInner({ applicationId }: { applicationId: string }) {
  const { data: application } = useRplToolkitApplication(applicationId);
  if (!application) return null;
  return (
    <>
      <DialogHeader>
        <DialogTitle>{application.toolkitTitle}</DialogTitle>
      </DialogHeader>
      <ApplicationWorkspaceContent application={application} />
    </>
  );
}
