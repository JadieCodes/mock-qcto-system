import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { FisaStandardStatusBadge } from '../components/StatusBadge';
import { useFisaStandard, useSaveFisaStandardChecklist, useSaveFisaStandardEvaluationReport, useStandardAction } from '../hooks';
import { FISA_STANDARD_WORKFLOW } from '../workflow';
import type { FisaStandardRecord } from '../types';

function StandardWorkspaceContent({ record }: { record: FisaStandardRecord }) {
  const { role } = useV2Role();
  const actorName = roleDescriptor(role)?.label ?? role;
  const standardAction = useStandardAction();
  const saveChecklist = useSaveFisaStandardChecklist();
  const saveReport = useSaveFisaStandardEvaluationReport();

  const checklistComplete = isChecklistComplete(record.checklist, true);
  const reportComplete = record.evaluationReport.findings.trim().length > 0 && record.evaluationReport.recommendation !== '';
  const editable = role === 'ASD' && record.workflow.stageId === 'asd-evaluation';

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Status</span>
          <FisaStandardStatusBadge record={record} />
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source Documents</p>
          {record.sourceDocuments.length === 0 ? (
            <p className="text-sm text-gray-400">No source documents.</p>
          ) : (
            <ul className="space-y-1">
              {record.sourceDocuments.map((d, i) => (
                <li key={i} className="text-xs font-mono bg-gray-50 rounded px-2 py-1 inline-block mr-2">
                  {d.fileName} ({Math.round(d.fileSize / 1024)} KB)
                </li>
              ))}
            </ul>
          )}
        </div>

        {record.notes && (
          <div className="rounded-2xl border bg-amber-50 border-amber-200 p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-amber-900">{record.notes}</p>
          </div>
        )}

        <ActionBar
          definition={FISA_STANDARD_WORKFLOW}
          stageId={record.workflow.stageId}
          role={role}
          onRun={(actionId, note) => standardAction.mutate({ standardId: record.id, actionId, actorRole: role, actorName, note })}
        />

        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit Trail</p>
          <AuditTrailView recordTypes={['fisa-standard']} recordId={record.id} />
        </div>
      </TabsContent>

      <TabsContent value="evaluation" className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">FISA Standards Evaluation Checklist</p>
          <Checklist sections={record.checklist} readonly={!editable} onChange={(sections) => saveChecklist.mutate({ standardId: record.id, sections })} />
        </div>

        <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Evaluation Report</p>
          <div className="space-y-2">
            <Label>Findings</Label>
            <Textarea
              rows={3}
              value={record.evaluationReport.findings}
              disabled={!editable}
              onChange={(e) => saveReport.mutate({ standardId: record.id, report: { ...record.evaluationReport, findings: e.target.value } })}
            />
          </div>
          <div className="space-y-2">
            <Label>Recommendation</Label>
            <Select
              value={record.evaluationReport.recommendation}
              disabled={!editable}
              onValueChange={(value) =>
                saveReport.mutate({ standardId: record.id, report: { ...record.evaluationReport, recommendation: value as 'recommended' | 'not-recommended' } })
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
          definition={FISA_STANDARD_WORKFLOW}
          stageId={record.workflow.stageId}
          role={role}
          disabledActionIds={record.workflow.stageId === 'asd-evaluation' && !(checklistComplete && reportComplete) ? ['standard-asd-send-to-dd'] : []}
          onRun={(actionId, note) => standardAction.mutate({ standardId: record.id, actionId, actorRole: role, actorName, note })}
        />
        {record.workflow.stageId === 'asd-evaluation' && !(checklistComplete && reportComplete) && (
          <p className="text-xs text-amber-600">Answer every checklist line with a comment, and complete the evaluation report, before sending to the Deputy Director.</p>
        )}

        {record.workflow.stageId === 'approved' && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Approved by Qualifications Development. This Skills Programme is now available for instrument development.
          </div>
        )}
        {record.workflow.stageId === 'declined' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Declined.</div>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function StandardWorkspace({ recordId, onClose }: { recordId: string | null; onClose: () => void }) {
  return (
    <Dialog open={!!recordId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        {recordId && <StandardWorkspaceInner key={recordId} recordId={recordId} />}
      </DialogContent>
    </Dialog>
  );
}

function StandardWorkspaceInner({ recordId }: { recordId: string }) {
  const { data: record } = useFisaStandard(recordId);
  if (!record) return null;
  return (
    <>
      <DialogHeader>
        <DialogTitle>{record.skillsProgrammeTitle}</DialogTitle>
      </DialogHeader>
      <StandardWorkspaceContent record={record} />
    </>
  );
}
