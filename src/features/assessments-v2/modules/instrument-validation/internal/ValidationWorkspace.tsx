import { useState } from 'react';
import { Award, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checklist } from '../../../shared/checklist/Checklist';
import { getChecklistIssues, isChecklistComplete } from '../../../shared/checklist/types';
import { ReasonDialog } from '../../../shared/ui/ReasonDialog';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import type { ValidationIssue } from '../../../shared/validation/types';
import { InstrumentValidationAuditTrail } from '../components/AuditTrail';
import { PrefilledFieldsPanel } from '../components/PrefilledFieldsPanel';
import { SchedulingPanel } from '../components/SchedulingPanel';
import { InstrumentValidationStatusBadge } from '../components/StatusBadge';
import { useInstrumentValidationRecord, useSaveValidationChecklist, useValidationAction } from '../hooks';
import type { InstrumentValidationRecord } from '../types';

function ValidationWorkspaceContent({ record }: { record: InstrumentValidationRecord }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const saveChecklist = useSaveValidationChecklist();
  const validationAction = useValidationAction();
  const [notApprovedOpen, setNotApprovedOpen] = useState(false);
  const [conditionsOpen, setConditionsOpen] = useState(false);

  const canValidate = role === 'ASD' && record.validationWorkflow.stageId === 'asd-validation';
  const checklistComplete = isChecklistComplete(record.checklist, true);
  const fieldsComplete = record.prefilledFields.every((f) => f.action !== null);
  const outcomeReady = checklistComplete && fieldsComplete;
  const outcomeIssues: ValidationIssue[] = canValidate
    ? [
        ...record.prefilledFields
          .filter((f) => f.action === null)
          .map((f): ValidationIssue => ({ field: f.key, message: `${f.label} — confirm or recapture this field.` })),
        ...getChecklistIssues(record.checklist, true),
      ]
    : [];

  const runOutcome = (actionId: string, note?: string) => {
    validationAction.mutate({ recordId: record.id, actionId, actorRole: role, actorId, actorName, note });
  };

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
        <TabsTrigger value="validation">Validation</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Status</span>
          <InstrumentValidationStatusBadge record={record} />
        </div>
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">QP & Qualification</p>
          </div>
          <div className="px-4 divide-y divide-gray-50">
            <div className="flex items-start gap-3 py-2.5">
              <BookOpen className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Qualification Title</p>
                <p className="text-sm font-medium">{record.qualificationTitle}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-2.5">
              <Award className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 uppercase">Name of QP</p>
                <p className="text-sm font-medium">{record.qpName}</p>
              </div>
            </div>
          </div>
        </div>
        {record.outcomeHistory.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outcome history</p>
            <div className="space-y-2">
              {record.outcomeHistory.map((o, i) => (
                <div key={i} className="rounded-xl border bg-gray-50 px-3 py-2 text-xs">
                  <p className="font-medium text-gray-700">
                    Cycle {o.cycle} —{' '}
                    {o.decision === 'approved' ? 'Approved' : o.decision === 'approved-with-conditions' ? 'Approved with conditions' : 'Not approved'}
                  </p>
                  {o.notes && <p className="text-gray-500 mt-0.5 whitespace-pre-wrap">{o.notes}</p>}
                  <p className="text-gray-400 mt-0.5">
                    {o.decidedBy} · {new Date(o.decidedAt).toLocaleString('en-ZA')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit Trail</p>
          <InstrumentValidationAuditTrail recordId={record.id} />
        </div>
      </TabsContent>

      <TabsContent value="scheduling" className="space-y-4">
        <SchedulingPanel record={record} />
      </TabsContent>

      <TabsContent value="validation" className="space-y-6">
        {record.scheduling.workflow.stageId !== 'agreed' ? (
          <p className="text-sm text-gray-400">Not yet available — agree a validation date first.</p>
        ) : record.validationWorkflow.stageId === 'qp-instrument' ? (
          <p className="text-sm text-gray-400">
            Waiting for the QP to {record.cycleCount > 1 ? 'resubmit' : 'submit'} the instrument.
          </p>
        ) : (
          <>
            <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instrument</p>
              <p className="text-sm text-gray-700 font-mono bg-gray-50 rounded px-2 py-1 inline-block">
                {record.instrument?.fileName} ({Math.round((record.instrument?.fileSize ?? 0) / 1024)} KB)
              </p>
            </div>

            <PrefilledFieldsPanel record={record} readonly={!canValidate} />

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instrument Validation Checklist</p>
              <Checklist
                sections={record.checklist}
                readonly={!canValidate}
                onChange={(sections) => saveChecklist.mutate({ recordId: record.id, sections })}
              />
            </div>

            {canValidate && (
              <ValidationSummary issues={outcomeIssues} title="Complete these before recording an outcome:" />
            )}
            {canValidate && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  disabled={!outcomeReady || validationAction.isPending}
                  onClick={() => runOutcome('val-approve')}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approved
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!outcomeReady || validationAction.isPending}
                  onClick={() => setConditionsOpen(true)}
                >
                  Approved with conditions
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  disabled={!outcomeReady || validationAction.isPending}
                  onClick={() => setNotApprovedOpen(true)}
                >
                  <XCircle className="h-4 w-4" />
                  Not approved
                </Button>
              </div>
            )}

            {record.instrumentStatus === 'validated' && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                This instrument is marked <strong>Validated</strong> on the qualification's record. This does not create or open an
                EISA Registration.
              </div>
            )}

            <ReasonDialog
              open={notApprovedOpen}
              onOpenChange={setNotApprovedOpen}
              title="Not approved — return to QP"
              description="Explain what the QP needs to fix before resubmitting."
              confirmLabel="Record outcome"
              destructive
              onConfirm={(reason) => runOutcome('val-not-approved', reason)}
            />

            <ReasonDialog
              open={conditionsOpen}
              onOpenChange={setConditionsOpen}
              title="Approved with conditions"
              description="List the conditions the QP must meet. The QP will see this note."
              fieldLabel="Conditions *"
              placeholder="List the conditions..."
              confirmLabel="Record outcome"
              onConfirm={(reason) => runOutcome('val-approve-with-conditions', reason)}
            />
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function ValidationWorkspace({ recordId, onClose }: { recordId: string | null; onClose: () => void }) {
  return (
    <Dialog open={!!recordId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        {recordId && <ValidationWorkspaceInner key={recordId} recordId={recordId} />}
      </DialogContent>
    </Dialog>
  );
}

function ValidationWorkspaceInner({ recordId }: { recordId: string }) {
  const { data: record } = useInstrumentValidationRecord(recordId);
  if (!record) return null;
  return (
    <>
      <DialogHeader>
        <DialogTitle>{record.qualificationTitle}</DialogTitle>
      </DialogHeader>
      <ValidationWorkspaceContent record={record} />
    </>
  );
}
