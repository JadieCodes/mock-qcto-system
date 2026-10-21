import { useRef, useState } from 'react';
import { AlertCircle, Plus, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { roleDescriptor } from '../../../config/roles';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { RegistrationStatusBadge } from '../components/StatusBadge';
import {
  useAddLearner,
  useEnrollableLearners,
  useRegistrationAction,
  useRegistrationRecord,
  useSetLearnerRplArpl,
  useUploadLearnerSor,
  useUploadSupportingDocument,
} from '../hooks';
import type { EisaRegistrationRecord } from '../types';

function LearnerSorCell({ record, learnerId, canAct }: { record: EisaRegistrationRecord; learnerId: string; canAct: boolean }) {
  const learner = record.learners.find((l) => l.learnerId === learnerId);
  const uploadSor = useUploadLearnerSor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  if (!learner) return null;

  // CR-038: re-upload is allowed while the SDP is still building, or to correct a flag raised
  // during AD review — but only for the SDP role, never the Assistant Director.
  const canUpload = canAct && (record.workflow.stageId === 'sdp-submission' || learner.sorStatus === 'flagged');

  return (
    <div className="space-y-1">
      {learner.sor ? (
        <p className="text-xs font-mono bg-gray-50 rounded px-2 py-1 inline-block">
          {learner.sor.fileName} ({Math.round(learner.sor.fileSize / 1024)} KB)
        </p>
      ) : (
        <p className="text-xs text-gray-400">No SOR uploaded</p>
      )}
      {canUpload && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadSor.mutate({ registrationId: record.id, learnerId, file: { fileName: file.name, fileSize: file.size } });
            }}
          />
          <Button type="button" size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" />
            {learner.sor ? 'Replace SOR' : 'Upload SOR'}
          </Button>
        </div>
      )}
    </div>
  );
}

function AddLearnerPanel({ record }: { record: EisaRegistrationRecord }) {
  const { data: enrollable = [] } = useEnrollableLearners(record.sdpName);
  const addLearner = useAddLearner();
  const [error, setError] = useState<string | null>(null);

  const addedIds = new Set(record.learners.map((l) => l.learnerId));
  const available = enrollable.filter((l) => !addedIds.has(l.id));

  return (
    <div className="space-y-2">
      {error && (
        <Alert className="border-red-400 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      {available.length === 0 ? (
        <p className="text-xs text-gray-400">
          {enrollable.length === 0 ? `No learners enrolled with "${record.sdpName}" yet.` : 'Every enrolled learner has been added.'}
        </p>
      ) : (
        <div className="rounded-xl border divide-y">
          {available.map((l) => (
            <div key={l.id} className="flex items-center justify-between px-3 py-2">
              <div>
                <p className="text-sm font-medium">{l.fullName}</p>
                <p className="text-xs text-gray-400">{l.idNumber}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                disabled={addLearner.isPending}
                onClick={() => {
                  setError(null);
                  addLearner.mutate(
                    { registrationId: record.id, learnerId: l.id },
                    { onError: (e: Error) => setError(e.message) },
                  );
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RegistrationDetail({ recordId, onClose }: { recordId: string | null; onClose: () => void }) {
  const { data: record } = useRegistrationRecord(recordId);
  const { role } = useV2Role();
  const actorName = roleDescriptor(role)?.label ?? role;
  const setRplArpl = useSetLearnerRplArpl();
  const uploadSupportingDocument = useUploadSupportingDocument();
  const registrationAction = useRegistrationAction();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!record) {
    return (
      <Dialog open={!!recordId} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl" />
      </Dialog>
    );
  }

  const isBuilding = record.workflow.stageId === 'sdp-submission';
  // CR: registration is an SDP-only process on the external side — a QP visiting this screen
  // (no CR forbids it, unlike CR-018's SDP block on Instrument Validation) sees it read-only.
  const canAct = role === 'SDP';
  const canSubmit = canAct && isBuilding && record.learners.length > 0 && record.learners.every((l) => !!l.sor);
  const flaggedLearners = record.learners.filter((l) => l.sorStatus === 'flagged');

  return (
    <Dialog open={!!recordId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record.qualificationTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Status</span>
            <RegistrationStatusBadge record={record} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase">SDP</p>
              <p className="font-medium">{record.sdpName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Sitting Date</p>
              <p className="font-medium">{record.sittingDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Category</p>
              <p className="font-medium capitalize">{record.category}</p>
            </div>
          </div>

          {flaggedLearners.length > 0 && (
            <Alert className="border-amber-400 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {flaggedLearners.length} learner(s) have an SOR flagged by the Assistant Director — correct and re-upload below.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Learners</p>
            {record.learners.length === 0 ? (
              <p className="text-sm text-gray-400">No learners added yet.</p>
            ) : (
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {['Learner', 'SOR', 'RPL/ARPL', ''].map((h) => (
                          <TableHead key={h} className="whitespace-nowrap">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {record.learners.map((l) => (
                        <TableRow key={l.learnerId}>
                          <TableCell>
                            <p className="font-medium">{l.fullName}</p>
                            <p className="text-xs text-gray-400">{l.idNumber}</p>
                          </TableCell>
                          <TableCell>
                            <LearnerSorCell record={record} learnerId={l.learnerId} canAct={canAct} />
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={l.rplArpl}
                              disabled={!canAct || !isBuilding}
                              onCheckedChange={(checked) => setRplArpl.mutate({ registrationId: record.id, learnerId: l.learnerId, rplArpl: checked })}
                            />
                          </TableCell>
                          <TableCell>
                            {l.sorStatus === 'flagged' && (
                              <p className="text-xs text-red-600 max-w-[180px]">Flagged: {l.sorFlagReason}</p>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {canAct && isBuilding && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add an Enrolled Learner</p>
              <AddLearnerPanel record={record} />
            </div>
          )}

          <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Supporting Documents</p>
            {record.supportingDocuments.length === 0 ? (
              <p className="text-sm text-gray-400">No supporting documents uploaded.</p>
            ) : (
              <ul className="space-y-1">
                {record.supportingDocuments.map((d, i) => (
                  <li key={i} className="text-xs font-mono bg-gray-50 rounded px-2 py-1 inline-block">
                    {d.fileName} ({Math.round(d.fileSize / 1024)} KB)
                  </li>
                ))}
              </ul>
            )}
            {canAct && isBuilding && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadSupportingDocument.mutate({ registrationId: record.id, file: { fileName: file.name, fileSize: file.size } });
                  }}
                />
                <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" />
                  Upload QA Report
                </Button>
              </div>
            )}
          </div>

          {record.workflow.stageId === 'registered' && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">Registered — {record.registrationNumber}</p>
              {record.nonTradesHandoff && <p className="mt-1">Files prepared for the QP and the SDP list shared with Quality Assurance.</p>}
              {record.rplMonitoringItemId && <p className="mt-1">An RPL/ARPL monitoring item was automatically created.</p>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {canAct && isBuilding && (
            <Button
              disabled={!canSubmit || registrationAction.isPending}
              onClick={() => registrationAction.mutate({ registrationId: record.id, actionId: 'reg-submit', actorRole: role, actorName })}
            >
              Submit to Assistant Director
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
