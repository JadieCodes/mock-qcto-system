import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { Checklist } from '../../../shared/checklist/Checklist';
import { isChecklistComplete } from '../../../shared/checklist/types';
import { ReasonDialog } from '../../../shared/ui/ReasonDialog';
import { roleDescriptor } from '../../../config/roles';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { FisaValidationStatusBadge } from '../components/StatusBadge';
import { useFisaValidation, useFisaValidationAction, useSaveFisaValidationChecklist } from '../hooks';
import type { FisaValidationRecord } from '../types';

function ValidationWorkspaceContent({ record }: { record: FisaValidationRecord }) {
  const { role } = useV2Role();
  const actorName = roleDescriptor(role)?.label ?? role;
  const saveChecklist = useSaveFisaValidationChecklist();
  const validationAction = useFisaValidationAction();
  const [notApprovedOpen, setNotApprovedOpen] = useState(false);
  const [allocatedAsdName, setAllocatedAsdName] = useState('');

  const canAllocate = role === 'Assistant Director' && record.workflow.stageId === 'awaiting-allocation';
  const canValidate = role === 'ASD' && record.workflow.stageId === 'asd-validation';
  const checklistComplete = isChecklistComplete(record.checklist, true);

  const runOutcome = (actionId: string, note?: string) => {
    validationAction.mutate({ recordId: record.id, actionId, actorRole: role, actorName, note });
  };

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="validation">FISA Validation Report</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Status</span>
          <FisaValidationStatusBadge record={record} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase">Skills Programme</p>
            <p className="font-medium">{record.skillsProgrammeTitle}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">SDP</p>
            <p className="font-medium">{record.sdpName}</p>
          </div>
        </div>

        {record.outcomeHistory.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outcome history</p>
            <div className="space-y-2">
              {record.outcomeHistory.map((o, i) => (
                <div key={i} className="rounded-xl border bg-gray-50 px-3 py-2 text-xs">
                  <p className="font-medium text-gray-700">
                    Cycle {o.cycle} — {o.decision === 'approved' ? 'Approved' : o.decision === 'approved-with-conditions' ? 'Approved with conditions' : 'Not approved'}
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
          <AuditTrailView recordTypes={['fisa-instrument-validation']} recordId={record.id} />
        </div>
      </TabsContent>

      <TabsContent value="validation" className="space-y-6">
        {record.workflow.stageId === 'sdp-instrument' ? (
          <p className="text-sm text-gray-400">Waiting for the SDP to {record.cycleCount > 1 ? 'resubmit' : 'submit'} the instrument.</p>
        ) : (
          <>
            <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instrument</p>
              <p className="text-sm text-gray-700 font-mono bg-gray-50 rounded px-2 py-1 inline-block">
                {record.instrument?.fileName} ({Math.round((record.instrument?.fileSize ?? 0) / 1024)} KB)
              </p>
            </div>

            {canAllocate && (
              <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
                <Label htmlFor="allocate-asd-name">Allocate to ASD *</Label>
                <div className="flex gap-2">
                  <Input id="allocate-asd-name" value={allocatedAsdName} onChange={(e) => setAllocatedAsdName(e.target.value)} placeholder="ASD name" />
                  <Button
                    disabled={!allocatedAsdName.trim() || validationAction.isPending}
                    onClick={() =>
                      validationAction.mutate({ recordId: record.id, actionId: 'fval-allocate', actorRole: role, actorName, allocatedAsdName })
                    }
                  >
                    Allocate
                  </Button>
                </div>
              </div>
            )}

            {record.workflow.stageId === 'awaiting-allocation' && !canAllocate && (
              <p className="text-sm text-gray-400">Awaiting Assistant Director allocation.</p>
            )}

            {record.allocatedAsdName && (
              <p className="text-xs text-gray-500">Allocated to: {record.allocatedAsdName}</p>
            )}

            {record.workflow.stageId === 'asd-validation' && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">FISA Instrument Validation Checklist</p>
                <Checklist sections={record.checklist} readonly={!canValidate} onChange={(sections) => saveChecklist.mutate({ recordId: record.id, sections })} />
              </div>
            )}

            {canValidate && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={!checklistComplete || validationAction.isPending} onClick={() => runOutcome('fval-approve')}>
                  <CheckCircle2 className="h-4 w-4" />
                  Approved
                </Button>
                <Button size="sm" variant="outline" disabled={!checklistComplete || validationAction.isPending} onClick={() => runOutcome('fval-approve-with-conditions')}>
                  Approved with conditions
                </Button>
                <Button size="sm" variant="destructive" className="gap-2" disabled={!checklistComplete || validationAction.isPending} onClick={() => setNotApprovedOpen(true)}>
                  <XCircle className="h-4 w-4" />
                  Not approved
                </Button>
              </div>
            )}
            {!checklistComplete && canValidate && (
              <p className="text-xs text-amber-600">Answer every checklist line with a comment before recording an outcome.</p>
            )}

            {record.instrumentStatus === 'validated' && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                This instrument is marked <strong>Validated</strong> on the FISA Validation Report. The outcome went straight back to
                the SDP — no Deputy Director step.
              </div>
            )}

            <ReasonDialog
              open={notApprovedOpen}
              onOpenChange={setNotApprovedOpen}
              title="Not approved — return to SDP"
              description="Explain what the SDP needs to fix before resubmitting."
              confirmLabel="Record outcome"
              destructive
              onConfirm={(reason) => runOutcome('fval-not-approved', reason)}
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
  const { data: record } = useFisaValidation(recordId);
  if (!record) return null;
  return (
    <>
      <DialogHeader>
        <DialogTitle>{record.skillsProgrammeTitle}</DialogTitle>
      </DialogHeader>
      <ValidationWorkspaceContent record={record} />
    </>
  );
}
