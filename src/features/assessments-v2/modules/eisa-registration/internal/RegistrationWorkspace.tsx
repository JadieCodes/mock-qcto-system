import { useState } from 'react';
import { AlertCircle, Flag } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ReasonDialog } from '../../../shared/ui/ReasonDialog';
import { RegistrationStatusBadge } from '../components/StatusBadge';
import { SorStatusBadge } from '../components/SorStatusBadge';
import { REGISTRATION_PROCESSOR_ROLE } from '../config';
import { useAcceptLearnerSor, useFlagLearnerSor, useMarkLearnerSorUnderReview, useRegistrationAction, useRegistrationRecord } from '../hooks';
import type { EisaRegistrationRecord } from '../types';

function RegistrationWorkspaceContent({ record }: { record: EisaRegistrationRecord }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const flagSor = useFlagLearnerSor();
  const markUnderReview = useMarkLearnerSorUnderReview();
  const acceptSor = useAcceptLearnerSor();
  const registrationAction = useRegistrationAction();
  const [flaggingLearnerId, setFlaggingLearnerId] = useState<string | null>(null);

  const canProcess = role === REGISTRATION_PROCESSOR_ROLE && record.workflow.stageId === 'ad-review';
  const hasFlagged = record.learners.some((l) => l.sorStatus === 'flagged');
  const canCreateNumber = canProcess && record.learners.length > 0 && !hasFlagged;
  const flaggingLearner = record.learners.find((l) => l.learnerId === flaggingLearnerId);

  return (
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
        <div>
          <p className="text-xs text-gray-400 uppercase">Supporting Documents</p>
          <p className="font-medium">{record.supportingDocuments.length}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Learners &amp; SORs</p>
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Learner', 'SOR', 'RPL/ARPL', 'SOR Status', ''].map((h) => (
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
                    <TableCell>{l.rplArpl ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <SorStatusBadge status={l.sorStatus} />
                      {l.sorStatus === 'flagged' && <p className="mt-1 text-xs text-red-600 max-w-[200px]">{l.sorFlagReason}</p>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap space-x-1">
                      {canProcess && l.sor && l.sorStatus !== 'flagged' && (
                        <>
                          {l.sorStatus !== 'under-review' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              disabled={markUnderReview.isPending}
                              onClick={() => markUnderReview.mutate({ registrationId: record.id, learnerId: l.learnerId, actorId, actorName })}
                            >
                              Under review
                            </Button>
                          )}
                          {l.sorStatus !== 'accepted' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-emerald-700"
                              disabled={acceptSor.isPending}
                              onClick={() => acceptSor.mutate({ registrationId: record.id, learnerId: l.learnerId, actorId, actorName })}
                            >
                              Accept
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setFlaggingLearnerId(l.learnerId)}>
                            <Flag className="h-3.5 w-3.5" />
                            Flag SOR
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {hasFlagged && canProcess && (
        <Alert className="border-amber-400 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Resolve every flagged SOR (the SDP must correct and resubmit) before creating the registration number.
          </AlertDescription>
        </Alert>
      )}

      {record.workflow.stageId === 'registered' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 space-y-1">
          <p className="font-semibold">Registered — {record.registrationNumber}</p>
          {record.nonTradesHandoff && <p>Files prepared for the QP and the SDP list shared with Quality Assurance (Non-Trades path).</p>}
          {record.rplMonitoringItemId && <p>An RPL/ARPL monitoring item was automatically created in Site Visits &amp; Monitoring.</p>}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit Trail</p>
        <AuditTrailView recordTypes={['eisa-registration']} recordId={record.id} />
      </div>

      {canCreateNumber && (
        <div className="flex justify-end">
          <Button
            disabled={registrationAction.isPending}
            onClick={() => registrationAction.mutate({ registrationId: record.id, actionId: 'reg-create-number', actorRole: role, actorId, actorName })}
          >
            Create Registration Number
          </Button>
        </div>
      )}

      <ReasonDialog
        open={!!flaggingLearnerId}
        onOpenChange={(open) => !open && setFlaggingLearnerId(null)}
        title={`Flag ${flaggingLearner?.fullName ?? 'learner'}'s SOR`}
        description="Explain what the SDP needs to correct before resubmitting."
        confirmLabel="Flag SOR"
        destructive
        onConfirm={(reason) => {
          if (!flaggingLearnerId) return;
          flagSor.mutate({ registrationId: record.id, learnerId: flaggingLearnerId, reason, actorId, actorName });
          setFlaggingLearnerId(null);
        }}
      />
    </div>
  );
}

export function RegistrationWorkspace({ recordId, onClose }: { recordId: string | null; onClose: () => void }) {
  const { data: record } = useRegistrationRecord(recordId);
  return (
    <Dialog open={!!recordId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        {record && (
          <>
            <DialogHeader>
              <DialogTitle>{record.qualificationTitle}</DialogTitle>
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
