import { useState } from 'react';
import { Calendar, CheckCircle2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { canActInStage } from '../../../shared/workflow/engine';
import { useSchedulingAction } from '../hooks';
import type { InstrumentValidationRecord } from '../types';
import { SCHEDULING_WORKFLOW } from '../workflow';

function proposeActionId(stageId: string): string {
  if (stageId === 'awaiting-qp-proposal') return 'sched-qp-propose';
  if (stageId === 'awaiting-asd-response') return 'sched-asd-counter';
  return 'sched-qp-counter';
}

function acceptActionId(stageId: string): string | null {
  if (stageId === 'awaiting-asd-response') return 'sched-asd-accept';
  if (stageId === 'awaiting-qp-response') return 'sched-qp-accept';
  return null;
}

// CR-017: shared by both the QP (external) and ASD (internal) screens — whichever side's
// turn it is sees the propose/accept/counter-propose controls, the other side sees read-only
// history. Same shape as a joint availability negotiation, re-implemented here rather than
// imported (the QA module's scheduling code is read-only reference, not a shared import).
export function SchedulingPanel({ record }: { record: InstrumentValidationRecord }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const schedulingAction = useSchedulingAction();
  const stageId = record.scheduling.workflow.stageId;
  const canAct = canActInStage(SCHEDULING_WORKFLOW, stageId, role);
  const acceptId = acceptActionId(stageId);
  const latest = record.scheduling.proposals[record.scheduling.proposals.length - 1];

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');

  const runPropose = () => {
    if (!date || !time || !venue) return;
    schedulingAction.mutate(
      { recordId: record.id, actionId: proposeActionId(stageId), actorRole: role, actorId, actorName, slot: { date, time, venue } },
      {
        onSuccess: () => {
          setDate('');
          setTime('');
          setVenue('');
        },
      },
    );
  };

  const runAccept = () => {
    if (!acceptId) return;
    schedulingAction.mutate({ recordId: record.id, actionId: acceptId, actorRole: role, actorId, actorName });
  };

  return (
    <div className="space-y-4">
      {record.scheduling.agreedSlot ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Validation date agreed</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              {record.scheduling.agreedSlot.date} at {record.scheduling.agreedSlot.time} — {record.scheduling.agreedSlot.venue}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          {stageId === 'awaiting-qp-proposal'
            ? 'Waiting for the QP to propose a date, time and venue.'
            : stageId === 'awaiting-asd-response'
              ? 'Waiting for the ASD to accept or counter-propose.'
              : 'Waiting for the QP to accept or counter-propose.'}
        </p>
      )}

      {record.scheduling.proposals.length > 0 && (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Proposal history</p>
          </div>
          <div className="divide-y">
            {record.scheduling.proposals
              .slice()
              .reverse()
              .map((p) => (
                <div key={p.id} className="px-4 py-3 flex items-start gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {p.date} at {p.time}
                    </p>
                    <p className="text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {p.venue}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    Proposed by {p.proposedByName} ({p.proposedBy})
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {canAct && !record.scheduling.agreedSlot && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          {acceptId && latest && (
            <Button size="sm" onClick={runAccept} disabled={schedulingAction.isPending} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Accept {latest.date} at {latest.time} — {latest.venue}
            </Button>
          )}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{acceptId ? 'Or counter-propose' : 'Propose a slot'}</p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="sched-date">Date</Label>
                <Input id="sched-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sched-time">Time</Label>
                <Input id="sched-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sched-venue">Venue</Label>
                <Input id="sched-venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Enter venue" />
              </div>
            </div>
            <Button size="sm" variant="outline" disabled={!date || !time || !venue || schedulingAction.isPending} onClick={runPropose}>
              {acceptId ? 'Counter-propose' : 'Propose'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
