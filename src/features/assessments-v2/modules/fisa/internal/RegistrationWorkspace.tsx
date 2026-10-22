import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { FisaRegistrationStatusBadge } from '../components/StatusBadge';
import { useFisaRegistration, useFisaRegistrationAction } from '../hooks';
import type { FisaRegistrationRecord } from '../types';

function RegistrationWorkspaceContent({ record }: { record: FisaRegistrationRecord }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const registrationAction = useFisaRegistrationAction();

  const canProcess = role === 'Assistant Director' && record.workflow.stageId === 'ad-review';

  return (
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
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Learners &amp; SORs</p>
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
                      {l.sor ? (
                        <p className="text-xs font-mono bg-gray-50 rounded px-2 py-1 inline-block">
                          {l.sor.fileName} ({Math.round(l.sor.fileSize / 1024)} KB)
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">No SOR</p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {record.workflow.stageId === 'registered' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-semibold">Registered — {record.registrationNumber}</p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit Trail</p>
        <AuditTrailView recordTypes={['fisa-registration']} recordId={record.id} />
      </div>

      {canProcess && (
        <div className="flex justify-end">
          <Button
            disabled={record.learners.length === 0 || registrationAction.isPending}
            onClick={() => registrationAction.mutate({ registrationId: record.id, actionId: 'freg-create-number', actorRole: role, actorId, actorName })}
          >
            Create Registration Number
          </Button>
        </div>
      )}
    </div>
  );
}

export function RegistrationWorkspace({ recordId, onClose }: { recordId: string | null; onClose: () => void }) {
  const { data: record } = useFisaRegistration(recordId);
  return (
    <Dialog open={!!recordId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        {record && (
          <>
            <DialogHeader>
              <DialogTitle>{record.skillsProgrammeTitle}</DialogTitle>
            </DialogHeader>
            <RegistrationWorkspaceContent record={record} />
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
