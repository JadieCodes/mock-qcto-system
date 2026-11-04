import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { roleDescriptor } from '../../../config/roles';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { canActInStage } from '../../../shared/workflow/engine';
import { CHANGE_REQUEST_RECORD_TYPE, changeRequestKindLabel, DIFFERENT_PERSON_MESSAGE, hasActedOnRequest } from '../changeRequests';
import { useChangeRequestAction, useRegisteredLearnerNames } from '../hooks';
import type { EisaSittingChangeRequest } from '../types';
import { changeRequestWorkflow, isDecisionStage, type ChangeRequestActionId } from '../workflow';
import { ChangeRequestStatusBadge } from './ChangeRequestsList';
import { letterSummary } from './letterFile';

// QCTO feedback 2.4: one request — its details, the recommendations so far, the decision, and
// (for the person whose turn it is) Recommend or Approve / Decline.
export function ChangeRequestDetailDialog({ request, onClose }: { request: EisaSittingChangeRequest | null; onClose: () => void }) {
  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        {request && <ChangeRequestDetail key={`${request.id}-${request.state.stageId}`} request={request} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function ChangeRequestDetail({ request, onClose }: { request: EisaSittingChangeRequest; onClose: () => void }) {
  const { role, person, portal } = useV2Role();
  const action = useChangeRequestAction();
  const [comment, setComment] = useState('');
  const { data: learners = [] } = useRegisteredLearnerNames(request.kind === 'postponement' ? request.sittingId : null);

  const roleCanAct = portal === 'internal' && canActInStage(changeRequestWorkflow(request.kind), request.state.stageId, role);
  const alreadyActed = roleCanAct && hasActedOnRequest(request.id, person.id);
  const canAct = roleCanAct && !alreadyActed;
  const decision = isDecisionStage(request);
  const roleLabel = (r: string) => (r === 'Deputy Director' ? 'DD' : (roleDescriptor(r)?.label ?? r));

  const act = (actionId: ChangeRequestActionId) =>
    action.mutate(
      { requestId: request.id, actionId, actorRole: role, actorId: person.id, actorName: person.name, comment },
      { onSuccess: onClose },
    );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{changeRequestKindLabel(request.kind)} request</DialogTitle>
        <DialogDescription>
          "{request.qualificationTitle}" on {request.sittingDate}
        </DialogDescription>
      </DialogHeader>

      <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-gray-500">Status</dt>
        <dd>
          <ChangeRequestStatusBadge request={request} />
        </dd>
        <dt className="text-gray-500">QP</dt>
        <dd>{request.qpName}</dd>
        {request.proposedNewDate && (
          <>
            <dt className="text-gray-500">Proposed new date</dt>
            <dd className="font-medium">{request.proposedNewDate}</dd>
          </>
        )}
        <dt className="text-gray-500">Reason</dt>
        <dd className="whitespace-pre-wrap">{request.reason}</dd>
        <dt className="text-gray-500">Formal letter</dt>
        <dd className="text-xs leading-5">{letterSummary(request.letter)}</dd>
        <dt className="text-gray-500">Raised by</dt>
        <dd>
          {request.raisedBy} ({roleLabel(request.raisedByRole)}), {new Date(request.raisedAt).toLocaleDateString('en-ZA')}
        </dd>
        {request.recommendations.map((rec) => (
          <div key={rec.personId} className="contents">
            <dt className="text-gray-500">Recommended</dt>
            <dd>
              {rec.personName} ({roleLabel(rec.role)}), {new Date(rec.at).toLocaleDateString('en-ZA')}
              {rec.comment && <span className="block text-xs text-gray-500">{rec.comment}</span>}
            </dd>
          </div>
        ))}
        {request.decision && (
          <>
            <dt className="text-gray-500">Decision</dt>
            <dd>
              {request.decision === 'approved' ? 'Approved' : 'Declined'} by {request.decidedBy}
              {request.decidedAt && `, ${new Date(request.decidedAt).toLocaleDateString('en-ZA')}`}
              {request.decisionComment && <span className="block text-xs text-gray-500">{request.decisionComment}</span>}
            </dd>
          </>
        )}
      </dl>

      {request.kind === 'postponement' && (
        <div className="space-y-1">
          <Label>Learners already registered</Label>
          {learners.length === 0 ? (
            <p className="text-xs text-gray-400">No learners are registered for this sitting.</p>
          ) : (
            <>
              <p className="text-xs text-gray-500">They stay registered for this sitting and are not moved.</p>
              <ul className="list-disc pl-5 text-xs text-gray-700">
                {learners.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {alreadyActed && <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">{DIFFERENT_PERSON_MESSAGE}</p>}

      {canAct && (
        <div className="space-y-2">
          <Label htmlFor="request-comment">{decision ? 'Comment (required to decline)' : 'Comment (optional)'}</Label>
          <Textarea id="request-comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
      )}

      <div className="space-y-1">
        <Label>History</Label>
        <AuditTrailView recordTypes={[CHANGE_REQUEST_RECORD_TYPE]} recordId={request.id} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        {canAct && !decision && (
          <Button type="button" disabled={action.isPending} onClick={() => act('request-recommend')}>
            Recommend
          </Button>
        )}
        {canAct && decision && (
          <>
            <Button type="button" variant="destructive" disabled={action.isPending || !comment.trim()} onClick={() => act('request-decline')}>
              Decline
            </Button>
            <Button type="button" disabled={action.isPending} onClick={() => act('request-approve')}>
              Approve
            </Button>
          </>
        )}
      </DialogFooter>
    </>
  );
}
