import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toIsoDate } from '../../../shared/dates/workingDays';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { PLANNER_ROLE } from '../config';
import { usePlanningAction } from '../hooks';
import { responseStatusOf, responseSummaryOf, visitStakeholderOf } from '../stakeholderResponse';
import type { SiteVisit, VisitDateMove, VisitStakeholderResponse } from '../types';
import { PLAN_MOVE_VISIT_LABEL } from '../workflow';
import { RespondToNotice } from './RespondToNotice';

function dayOf(timestamp: string): string {
  return timestamp.slice(0, 10);
}

const STAKEHOLDER_KIND_LABELS = { QP: 'QP', SDP: 'SDP', 'assessment-centre': 'assessment centre' } as const;

export function ResponseLine({ response }: { response: VisitStakeholderResponse }) {
  const by = response.respondedByRole === 'ASD' ? `recorded by ${response.respondedBy} (ASD)` : `by ${response.respondedBy}`;
  return (
    <div className="space-y-0.5 text-sm text-gray-700">
      <p>
        <span className="font-medium">{response.answer === 'accepted' ? 'Accepted the date' : 'Not available'}</span>{' '}
        <span className="text-xs text-gray-500">
          {by} on {dayOf(response.respondedAt)}
        </span>
      </p>
      {response.reason && <p className="whitespace-pre-wrap">Reason: {response.reason}</p>}
      {response.suggestedDate && <p>Suggested date: {response.suggestedDate}</p>}
    </div>
  );
}

export function MoveHistory({ moves }: { moves: VisitDateMove[] }) {
  if (moves.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase">Date history</p>
      {moves.map((m) => (
        <div key={m.id} className="rounded-xl border bg-white p-3 text-sm space-y-1">
          <p>
            <span className="font-medium">
              {m.fromDate} → {m.toDate}
            </span>{' '}
            <span className="text-xs text-gray-500">
              moved by {m.movedBy} on {dayOf(m.movedAt)}
            </span>
          </p>
          <p className="text-gray-700 whitespace-pre-wrap">
            {m.reasonSource === 'stakeholder-not-available' ? 'Stakeholder not available: ' : 'QCTO decision: '}
            {m.reason}
          </p>
          {m.previousResponse ? (
            <div className="border-t pt-1">
              <p className="text-xs text-gray-400">Their answer about {m.fromDate}</p>
              <ResponseLine response={m.previousResponse} />
            </div>
          ) : (
            <p className="text-xs text-gray-400">No answer was given about {m.fromDate} (reminded {m.previousReminders} {m.previousReminders === 1 ? 'time' : 'times'}).</p>
          )}
        </div>
      ))}
    </div>
  );
}

// Batch V2 (QCTO 29.36): "Move the visit" with a new date and a reason, from the stakeholder's "not
// available" (their reason and suggested date are filled in) or QCTO's own decision. The visit goes back
// to Deputy Director recommendation and through approval and booking again.
function MoveVisitDialog({ visit, open, onOpenChange }: { visit: SiteVisit; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { role, person } = useV2Role();
  const planning = usePlanningAction();
  const response = visit.stakeholderResponse;
  const stakeholderSaidNo = response?.answer === 'not-available';
  const [source, setSource] = useState<'stakeholder-not-available' | 'qcto'>(stakeholderSaidNo ? 'stakeholder-not-available' : 'qcto');
  const [newDate, setNewDate] = useState(stakeholderSaidNo ? response.suggestedDate : '');
  const [reason, setReason] = useState(stakeholderSaidNo ? response.reason : '');

  const chooseSource = (value: 'stakeholder-not-available' | 'qcto') => {
    setSource(value);
    if (value === 'stakeholder-not-available' && response) {
      setReason(response.reason);
      if (response.suggestedDate) setNewDate(response.suggestedDate);
    }
  };

  const submit = () => {
    planning.mutate(
      { visitId: visit.id, actionId: 'plan-move', actorRole: role, actorId: person.id, actorName: person.name, note: reason, newDate, moveReasonSource: source },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={PLAN_MOVE_VISIT_LABEL}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={planning.isPending || !newDate || !reason.trim()} onClick={submit}>
            {PLAN_MOVE_VISIT_LABEL}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          The visit goes back to Deputy Director recommendation with the new date, then Domain Director approval and Sub Domain Admin booking. The old date ({visit.visitDate}), the
          reason and the answer given so far stay in the history.
        </p>
        {stakeholderSaidNo && (
          <RadioGroup value={source} onValueChange={(v) => chooseSource(v as 'stakeholder-not-available' | 'qcto')} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <RadioGroupItem id={`move-source-stakeholder-${visit.id}`} value="stakeholder-not-available" />
              <Label htmlFor={`move-source-stakeholder-${visit.id}`} className="text-sm font-normal">
                Because the stakeholder said they are not available
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id={`move-source-qcto-${visit.id}`} value="qcto" />
              <Label htmlFor={`move-source-qcto-${visit.id}`} className="text-sm font-normal">
                QCTO&apos;s own decision
              </Label>
            </div>
          </RadioGroup>
        )}
        <div className="space-y-1.5">
          <Label htmlFor={`move-date-${visit.id}`}>New visit date *</Label>
          <Input id={`move-date-${visit.id}`} type="date" min={toIsoDate(new Date())} value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-48" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`move-reason-${visit.id}`}>Reason *</Label>
          <Textarea id={`move-reason-${visit.id}`} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is the visit being moved?" />
        </div>
      </div>
    </Modal>
  );
}

// The ASD's and DD's view of the notice, the stakeholder's answer, the reminders and the date history.
export function StakeholderResponseCard({ visit }: { visit: SiteVisit }) {
  const { role } = useV2Role();
  const [moveOpen, setMoveOpen] = useState(false);
  const stakeholder = visitStakeholderOf(visit);
  const today = toIsoDate(new Date());
  const moves = visit.dateMoves ?? [];
  if (!stakeholder) return null;

  const status = responseStatusOf(visit, today);
  const summary = responseSummaryOf(visit, today);
  const kindLabel = STAKEHOLDER_KIND_LABELS[stakeholder.kind];
  const canMove = role === PLANNER_ROLE && visit.planningWorkflow.stageId === 'booked' && visit.reportWorkflow.stageId === 'awaiting-execution' && !!visit.visitDate;
  const canRecordForCentre = role === PLANNER_ROLE && stakeholder.kind === 'assessment-centre' && status === 'awaiting';

  if (visit.notificationFlag === 'unannounced') {
    return (
      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase">Notice and response</p>
        <p className="text-sm text-gray-700">Unannounced visit: {stakeholder.name} gets no notice and does not respond.</p>
      </div>
    );
  }

  if (!visit.stakeholderNotice && moves.length === 0 && visit.planningWorkflow.stageId !== 'booked') return null;

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase">Notice and response</p>

      {visit.stakeholderNotice ? (
        <p className="text-sm text-gray-700">
          Notice for {visit.visitDate} sent to {visit.stakeholderNotice.sentToName} ({kindLabel}) on {dayOf(visit.stakeholderNotice.sentAt)}.
        </p>
      ) : visit.planningWorkflow.stageId === 'booked' ? (
        <p className="text-sm text-gray-500">{visit.visitDate ? 'No notice was sent for this visit.' : 'The notice goes to the stakeholder once the visit has a date.'}</p>
      ) : (
        <p className="text-sm text-gray-500">The new date is not booked yet. {stakeholder.name} is asked to respond again once it is.</p>
      )}

      {summary && (
        <p className={status === 'accepted' ? 'text-sm font-medium text-emerald-700' : 'text-sm font-medium text-amber-700'}>
          {summary}
        </p>
      )}
      {visit.stakeholderResponse && <ResponseLine response={visit.stakeholderResponse} />}
      {(visit.reminders ?? []).length > 0 && (
        <ul className="text-xs text-gray-500 space-y-0.5">
          {(visit.reminders ?? []).map((r) => (
            <li key={r.number}>
              Reminder {r.number} sent on {dayOf(r.sentAt)}
            </li>
          ))}
        </ul>
      )}

      {canRecordForCentre && <RespondToNotice visit={visit} onBehalfOf={stakeholder.name} />}

      {canMove && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setMoveOpen(true)}>
            <CalendarClock className="h-4 w-4" />
            {PLAN_MOVE_VISIT_LABEL}
          </Button>
        </div>
      )}

      <MoveHistory moves={moves} />

      {moveOpen && <MoveVisitDialog key={visit.dateMoves?.length ?? 0} visit={visit} open={moveOpen} onOpenChange={setMoveOpen} />}
    </div>
  );
}
