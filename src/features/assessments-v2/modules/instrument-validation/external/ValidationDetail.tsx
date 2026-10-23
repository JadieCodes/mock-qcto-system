import { useRef } from 'react';
import { Award, BookOpen, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InstrumentValidationAuditTrail } from '../components/AuditTrail';
import { PrefilledFieldsPanel } from '../components/PrefilledFieldsPanel';
import { SchedulingPanel } from '../components/SchedulingPanel';
import { InstrumentValidationStatusBadge } from '../components/StatusBadge';
import { useInstrumentValidationRecord, useUploadInstrument, useValidationAction } from '../hooks';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import type { InstrumentValidationRecord } from '../types';

// Row 18 (C-06, C-07): the QP side gets the same tabbed shape as the internal workspace —
// Details / Scheduling / Instrument / Validation outcome / Audit trail — instead of one
// long scrolling dialog.
function ValidationDetailContent({ record }: { record: InstrumentValidationRecord }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const uploadInstrument = useUploadInstrument();
  const validationAction = useValidationAction();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const latestOutcome = record.outcomeHistory[record.outcomeHistory.length - 1];
  const canUpload = record.validationWorkflow.stageId === 'qp-instrument' && record.scheduling.workflow.stageId === 'agreed';
  const canSubmit = canUpload && !!record.instrument;

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
        <TabsTrigger value="instrument">Instrument</TabsTrigger>
        <TabsTrigger value="outcome">Validation outcome</TabsTrigger>
        <TabsTrigger value="audit">Audit trail</TabsTrigger>
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
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pre-filled Details</p>
          <PrefilledFieldsPanel record={record} readonly />
        </div>
      </TabsContent>

      <TabsContent value="scheduling" className="space-y-4">
        <SchedulingPanel record={record} />
      </TabsContent>

      <TabsContent value="instrument" className="space-y-4">
        {latestOutcome?.decision === 'not-approved' && record.validationWorkflow.stageId === 'qp-instrument' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-1">
            <p className="text-sm font-semibold text-amber-800">Changes requested by the ASD</p>
            <p className="text-sm text-amber-900 whitespace-pre-wrap">{latestOutcome.notes}</p>
          </div>
        )}

        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instrument</p>
          {!record.scheduling.agreedSlot ? (
            <p className="text-sm text-gray-400">Agree a validation date with the ASD before uploading the instrument.</p>
          ) : (
            <>
              {record.instrument ? (
                <p className="text-sm text-gray-700 font-mono bg-gray-50 rounded px-2 py-1 inline-block">
                  {record.instrument.fileName} ({Math.round(record.instrument.fileSize / 1024)} KB)
                </p>
              ) : (
                <p className="text-sm text-gray-400">No instrument uploaded yet.</p>
              )}
              {canUpload && (
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadInstrument.mutate({ recordId: record.id, file: { fileName: file.name, fileSize: file.size } });
                    }}
                  />
                  <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    {record.instrument ? 'Replace instrument' : 'Upload instrument'}
                  </Button>
                  <Button
                    size="sm"
                    disabled={!canSubmit || validationAction.isPending}
                    onClick={() => validationAction.mutate({ recordId: record.id, actionId: 'val-submit', actorRole: role, actorId, actorName })}
                  >
                    {record.cycleCount > 1 ? 'Resubmit to ASD' : 'Submit for validation'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </TabsContent>

      <TabsContent value="outcome" className="space-y-3">
        {record.outcomeHistory.length === 0 ? (
          <p className="text-sm text-gray-400">No outcome has been recorded yet.</p>
        ) : (
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
        )}
        {record.instrumentStatus === 'validated' && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            This instrument is marked <strong>Validated</strong> on the qualification's record.
          </div>
        )}
      </TabsContent>

      <TabsContent value="audit" className="space-y-2">
        <InstrumentValidationAuditTrail recordId={record.id} />
      </TabsContent>
    </Tabs>
  );
}

export function ValidationDetail({ recordId, onClose }: { recordId: string | null; onClose: () => void }) {
  return (
    <Modal open={!!recordId} onOpenChange={(open) => !open && onClose()} size="md" title={<ValidationDetailTitle recordId={recordId} />}>
      {recordId && <ValidationDetailInner key={recordId} recordId={recordId} />}
    </Modal>
  );
}

function ValidationDetailTitle({ recordId }: { recordId: string | null }) {
  const { data: record } = useInstrumentValidationRecord(recordId);
  return record?.qualificationTitle ?? '';
}

function ValidationDetailInner({ recordId }: { recordId: string }) {
  const { data: record } = useInstrumentValidationRecord(recordId);
  if (!record) return null;
  return <ValidationDetailContent record={record} />;
}
