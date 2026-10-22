import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ConfirmationStatusBadge } from '../components/StatusBadge';
import { useAcknowledgeConfirmation, useConfirmDetails, useConfirmationRecord } from '../hooks';
import type { EisaConfirmationRecord } from '../types';

function ConfirmForm({ record, canAct }: { record: EisaConfirmationRecord; canAct: boolean }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const confirmDetails = useConfirmDetails();
  const [error, setError] = useState<string | null>(null);

  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(record.centres.map((c) => [c, record.learners.filter((l) => l.assessmentCentre === c).length])),
  );
  const [markingDate, setMarkingDate] = useState(record.sittingDate);
  const [moderationDate, setModerationDate] = useState(record.sittingDate);

  const onSubmit = () => {
    setError(null);
    confirmDetails.mutate(
      {
        recordId: record.id,
        centres: record.centres.map((c) => ({ centre: c, learnerCount: counts[c] ?? 0 })),
        markingDate,
        moderationDate,
        actorRole: role,
        actorId,
        actorName,
      },
      { onError: (e: Error) => setError(e.message) },
    );
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert className="border-red-400 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirm Assessment Centres &amp; Learner Counts</p>
        {record.centres.map((c) => (
          <div key={c} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
            <Label htmlFor={`centre-${c}`} className="text-sm font-normal">
              {c}
            </Label>
            <Input
              id={`centre-${c}`}
              type="number"
              min={1}
              className="w-24"
              value={counts[c] ?? 0}
              disabled={!canAct}
              onChange={(e) => setCounts((prev) => ({ ...prev, [c]: Number(e.target.value) }))}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Marking Date *</Label>
          <Input type="date" min={record.sittingDate} value={markingDate} disabled={!canAct} onChange={(e) => setMarkingDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Moderation Date *</Label>
          <Input
            type="date"
            min={markingDate}
            value={moderationDate}
            disabled={!canAct}
            onChange={(e) => setModerationDate(e.target.value)}
          />
        </div>
      </div>
      {canAct && (
        <div className="flex justify-end">
          <Button disabled={confirmDetails.isPending} onClick={onSubmit}>
            Confirm Centres, Counts &amp; Dates
          </Button>
        </div>
      )}
    </div>
  );
}

export function ConfirmationDetail({ recordId, onClose }: { recordId: string | null; onClose: () => void }) {
  const { data: record } = useConfirmationRecord(recordId);
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const acknowledge = useAcknowledgeConfirmation();

  if (!record) {
    return (
      <Dialog open={!!recordId} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl" />
      </Dialog>
    );
  }

  const canAct = role === 'QP';

  return (
    <Dialog open={!!recordId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{record.qualificationTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Status</span>
            <ConfirmationStatusBadge record={record} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase">QP</p>
              <p className="font-medium">{record.qpName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Sitting Date</p>
              <p className="font-medium">{record.sittingDate}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Consolidated Learner List ({record.learners.length})
            </p>
            <div className="rounded-xl border divide-y max-h-56 overflow-y-auto">
              {record.centres.map((centre) => (
                <div key={centre} className="px-3 py-2">
                  <p className="text-xs font-semibold text-gray-600">{centre}</p>
                  {record.learners
                    .filter((l) => l.assessmentCentre === centre)
                    .map((l) => (
                      <p key={l.learnerId} className="text-sm text-gray-700 pl-2">
                        {l.fullName}
                      </p>
                    ))}
                </div>
              ))}
            </div>
          </div>

          {record.workflow.stageId === 'awaiting-qp-ack' && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-3">
              <p className="text-sm text-blue-800">Review the consolidated learner list above, then acknowledge it to continue.</p>
              {canAct && (
                <Button
                  disabled={acknowledge.isPending}
                  onClick={() => acknowledge.mutate({ recordId: record.id, actorId, actorName })}
                >
                  Acknowledge Learner List
                </Button>
              )}
            </div>
          )}

          {record.workflow.stageId === 'awaiting-qp-confirmation' && <ConfirmForm record={record} canAct={canAct} />}

          {record.workflow.stageId === 'confirmed' && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 space-y-1">
              <p className="font-semibold">Confirmed</p>
              <p>Marking date: {record.markingDate} · Moderation date: {record.moderationDate}</p>
              {record.confirmedCentres?.map((c) => (
                <p key={c.centre}>
                  {c.centre}: {c.learnerCount} learner(s)
                </p>
              ))}
              <p className="text-emerald-700">This step does not create a site visit.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
