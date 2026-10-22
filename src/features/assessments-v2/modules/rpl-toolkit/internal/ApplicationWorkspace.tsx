import { useState } from 'react';
import { Award, BookOpen, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { Checklist } from '../../../shared/checklist/Checklist';
import { isChecklistComplete } from '../../../shared/checklist/types';
import { roleDescriptor } from '../../../config/roles';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ActionBar } from '../components/ActionBar';
import { RplToolkitStatusBadge } from '../components/StatusBadge';
import {
  useRplEvaluationAction,
  useRplOutcomeAction,
  useRplToolkitApplication,
  useSaveRplEvaluationReport,
  useSaveRplToolkitChecklist,
} from '../hooks';
import { RPL_EVAL_WORKFLOW, RPL_OUTCOME_WORKFLOW } from '../workflow';
import type { RplToolkitApplication } from '../types';

function ApplicationWorkspaceContent({ application }: { application: RplToolkitApplication }) {
  const { role } = useV2Role();
  const actorName = roleDescriptor(role)?.label ?? role;
  const evaluationAction = useRplEvaluationAction();
  const outcomeAction = useRplOutcomeAction();
  const saveChecklist = useSaveRplToolkitChecklist();
  const saveReport = useSaveRplEvaluationReport();
  const [allocatedAsdName, setAllocatedAsdName] = useState('');

  const checklistComplete = isChecklistComplete(application.checklist, true);
  const reportComplete = application.evaluationReport.findings.trim().length > 0 && application.evaluationReport.recommendation !== '';
  const editableChecklist = role === 'ASD' && application.evalState.stageId === 'asd-evaluation';
  const canAllocate = role === 'Assistant Director' && application.evalState.stageId === 'ad-allocation';
  const decided = application.evalState.stageId === 'approved' || application.evalState.stageId === 'declined';

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
                <p className="text-sm font-medium">{application.toolkitType === 'new' ? 'New toolkit' : 'Updated toolkit'}</p>
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
            <Label htmlFor="rpl-allocate-asd">Allocate to ASD *</Label>
            <div className="flex gap-2">
              <Input id="rpl-allocate-asd" value={allocatedAsdName} onChange={(e) => setAllocatedAsdName(e.target.value)} placeholder="ASD name" />
              <Button
                disabled={!allocatedAsdName.trim() || evaluationAction.isPending}
                onClick={() =>
                  evaluationAction.mutate({ applicationId: application.id, actionId: 'rpl-allocate', actorRole: role, actorName, allocatedAsdName })
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
          <div className="space-y-2">
            <Label>Findings</Label>
            <Textarea
              rows={3}
              value={application.evaluationReport.findings}
              disabled={!editableChecklist}
              onChange={(e) => saveReport.mutate({ applicationId: application.id, report: { ...application.evaluationReport, findings: e.target.value } })}
            />
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
          </div>
        </div>

        <ActionBar
          definition={RPL_EVAL_WORKFLOW}
          stageId={application.evalState.stageId}
          role={role}
          disabledActionIds={
            application.evalState.stageId === 'asd-evaluation' && !(checklistComplete && reportComplete) ? ['rpl-asd-send-to-dd'] : []
          }
          onRun={(actionId, note) => evaluationAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorName, note })}
        />
        {application.evalState.stageId === 'asd-evaluation' && !(checklistComplete && reportComplete) && (
          <p className="text-xs text-amber-600">Answer every checklist line with a comment, and complete the evaluation report, before sending to the Deputy Director.</p>
        )}

        {decided && (
          <p className={`text-sm font-semibold ${application.evalState.stageId === 'approved' ? 'text-emerald-700' : 'text-red-700'}`}>
            {application.evalState.stageId === 'approved' ? 'Approved by IAC.' : 'Declined by IAC.'}
          </p>
        )}
      </TabsContent>

      <TabsContent value="outcome" className="space-y-4">
        {!decided ? (
          <p className="text-sm text-gray-400">Not yet available — the IAC has not reached a decision.</p>
        ) : application.outcomeState.stageId === 'signed' ? (
          <p className="text-sm text-emerald-700 font-medium">Signed by {application.outcomeState.submittedBy}.</p>
        ) : (
          <ActionBar
            definition={RPL_OUTCOME_WORKFLOW}
            stageId={application.outcomeState.stageId}
            role={role}
            onRun={(actionId) => outcomeAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorName })}
          />
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
