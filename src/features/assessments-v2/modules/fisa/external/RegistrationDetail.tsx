import { useRef, useState } from 'react';
import { AlertCircle, Plus, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { roleDescriptor } from '../../../config/roles';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { FisaRegistrationStatusBadge } from '../components/StatusBadge';
import { useAddFisaRegistrationLearner, useFisaEnrollableLearners, useFisaRegistration, useFisaRegistrationAction, useUploadFisaLearnerSor } from '../hooks';
import type { FisaRegistrationRecord } from '../types';

function LearnerSorCell({ record, learnerId }: { record: FisaRegistrationRecord; learnerId: string }) {
  const learner = record.learners.find((l) => l.learnerId === learnerId);
  const uploadSor = useUploadFisaLearnerSor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  if (!learner) return null;

  return (
    <div className="space-y-1">
      {learner.sor ? (
        <p className="text-xs font-mono bg-gray-50 rounded px-2 py-1 inline-block">
          {learner.sor.fileName} ({Math.round(learner.sor.fileSize / 1024)} KB)
        </p>
      ) : (
        <p className="text-xs text-gray-400">No SOR uploaded</p>
      )}
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
    </div>
  );
}

function AddLearnerPanel({ record }: { record: FisaRegistrationRecord }) {
  const { data: enrollable = [] } = useFisaEnrollableLearners(record.sdpName);
  const addLearner = useAddFisaRegistrationLearner();
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
                  addLearner.mutate({ registrationId: record.id, learnerId: l.id }, { onError: (e: Error) => setError(e.message) });
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
  const { data: record } = useFisaRegistration(recordId);
  const { role } = useV2Role();
  const actorName = roleDescriptor(role)?.label ?? role;
  const registrationAction = useFisaRegistrationAction();

  if (!record) {
    return (
      <Dialog open={!!recordId} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl" />
      </Dialog>
    );
  }

  const isBuilding = record.workflow.stageId === 'sdp-submission';
  const canSubmit = isBuilding && record.learners.length > 0 && record.learners.every((l) => !!l.sor);

  return (
    <Dialog open={!!recordId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record.skillsProgrammeTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Status</span>
            <FisaRegistrationStatusBadge record={record} />
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
          </div>

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
                        {['Learner', 'SOR'].map((h) => (
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
                            <LearnerSorCell record={record} learnerId={l.learnerId} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {isBuilding && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add an Enrolled Learner</p>
              <AddLearnerPanel record={record} />
            </div>
          )}

          {record.workflow.stageId === 'registered' && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">Registered — {record.registrationNumber}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {isBuilding && (
            <Button
              disabled={!canSubmit || registrationAction.isPending}
              onClick={() => registrationAction.mutate({ registrationId: record.id, actionId: 'freg-submit', actorRole: role, actorName })}
            >
              Submit to Assistant Director
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
