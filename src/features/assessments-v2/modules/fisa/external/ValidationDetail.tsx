import { useRef } from 'react';
import { BookOpen, Building2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { roleDescriptor } from '../../../config/roles';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { FisaValidationStatusBadge } from '../components/StatusBadge';
import { useFisaValidation, useFisaValidationAction, useUploadFisaInstrument } from '../hooks';

export function ValidationDetail({ recordId, onClose }: { recordId: string | null; onClose: () => void }) {
  const { data: record } = useFisaValidation(recordId);
  const { role } = useV2Role();
  const actorName = roleDescriptor(role)?.label ?? role;
  const uploadInstrument = useUploadFisaInstrument();
  const validationAction = useFisaValidationAction();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const latestOutcome = record?.outcomeHistory[record.outcomeHistory.length - 1];
  const canUpload = !!record && record.workflow.stageId === 'sdp-instrument';
  const canSubmit = canUpload && !!record?.instrument;

  return (
    <Dialog open={!!recordId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {record && (
          <>
            <DialogHeader>
              <DialogTitle>{record.skillsProgrammeTitle}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <FisaValidationStatusBadge record={record} />
              </div>

              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Skills Programme & SDP</p>
                </div>
                <div className="px-4 divide-y divide-gray-50">
                  <div className="flex items-start gap-3 py-2.5">
                    <BookOpen className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Skills Programme</p>
                      <p className="text-sm font-medium">{record.skillsProgrammeTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-2.5">
                    <Building2 className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase">SDP</p>
                      <p className="text-sm font-medium">{record.sdpName}</p>
                    </div>
                  </div>
                </div>
              </div>

              {latestOutcome?.decision === 'not-approved' && record.workflow.stageId === 'sdp-instrument' && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-1">
                  <p className="text-sm font-semibold text-amber-800">Changes requested by the ASD</p>
                  <p className="text-sm text-amber-900 whitespace-pre-wrap">{latestOutcome.notes}</p>
                </div>
              )}

              <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instrument</p>
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
                      onClick={() =>
                        validationAction.mutate({ recordId: record.id, actionId: 'fval-submit', actorRole: role, actorName })
                      }
                    >
                      {record.cycleCount > 1 ? 'Resubmit' : 'Notify QCTO'}
                    </Button>
                  </div>
                )}
              </div>

              {record.instrumentStatus === 'validated' && latestOutcome && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <p className="font-semibold">FISA Validation Report — {latestOutcome.decision === 'approved' ? 'Approved' : 'Approved with conditions'}</p>
                  {latestOutcome.notes && <p className="mt-1 whitespace-pre-wrap">{latestOutcome.notes}</p>}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
