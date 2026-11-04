import { readStore, writeStore } from '../../mock/api/storage';
import { appendAuditEntry, getAuditTrail } from '../../shared/audit/auditLog';
import { addNotification } from '../../shared/notifications/store';
import { performAction } from '../../shared/workflow/engine';
import type { Role } from '../../types';
import { applyApprovedSittingChange, listSittings } from './api';
import { REQUEST_RAISER_ROLES, REQUEST_RECOMMENDER_ROLE } from './config';
import { checkSittingDate } from './dateChecks';
import type { ChangeRequestKind, EisaSittingChangeRequest, RaiseChangeRequestInput } from './types';
import { changeRequestWorkflow, isChangeRequestOpen, type ChangeRequestActionId } from './workflow';

// QCTO feedback 2.4 (29 Oct 2026): a published sitting is postponed or cancelled only through a
// request. Postponement: DD recommends -> Director decides. Cancellation: DD recommends ->
// Director recommends -> CEO decides. The QP is told at every step.
export const CHANGE_REQUESTS_KEY = 'eisaCalendar:changeRequests';
export const CHANGE_REQUEST_RECORD_TYPE = 'eisa-calendar-request';

function loadRequests(): EisaSittingChangeRequest[] {
  return readStore<EisaSittingChangeRequest[]>(CHANGE_REQUESTS_KEY, []);
}
function saveRequests(requests: EisaSittingChangeRequest[]): void {
  writeStore(CHANGE_REQUESTS_KEY, requests);
}

export function changeRequestKindLabel(kind: ChangeRequestKind): string {
  return kind === 'postponement' ? 'Postponement' : 'Cancellation';
}

export async function listChangeRequests(): Promise<EisaSittingChangeRequest[]> {
  return loadRequests();
}

export async function raiseChangeRequest(input: RaiseChangeRequestInput): Promise<EisaSittingChangeRequest> {
  if (!REQUEST_RAISER_ROLES.includes(input.actorRole)) {
    throw new Error('Only the QP or the DD can raise a postponement or cancellation request.');
  }
  const sitting = (await listSittings()).find((s) => s.id === input.sittingId);
  if (!sitting) throw new Error('Sitting not found.');
  if (sitting.status !== 'published') throw new Error('A request can only be raised on a published sitting.');
  if (input.actorRole === 'QP' && input.actorQpId !== sitting.qpId) {
    throw new Error('You can only raise a request on your own sittings.');
  }
  if (loadRequests().some((r) => r.sittingId === sitting.id && isChangeRequestOpen(r))) {
    throw new Error('This sitting already has an open request.');
  }
  const reason = input.reason.trim();
  if (!reason) throw new Error('A reason is required.');
  if (!input.letter) throw new Error('Upload the formal letter.');

  let proposedNewDate: string | null = null;
  if (input.kind === 'postponement') {
    proposedNewDate = input.proposedNewDate?.trim() || null;
    if (!proposedNewDate) throw new Error('Enter the proposed new date.');
    if (proposedNewDate <= sitting.date) throw new Error('The new date must be after the current sitting date.');
    const check = checkSittingDate(proposedNewDate);
    if (!check.ok) throw new Error(`${proposedNewDate}: ${check.reasons.join(' ')}`);
  }

  const request: EisaSittingChangeRequest = {
    id: crypto.randomUUID(),
    kind: input.kind,
    sittingId: sitting.id,
    sittingDate: sitting.date,
    qualificationId: sitting.qualificationId ?? null,
    qualificationTitle: sitting.qualificationTitle,
    qpId: sitting.qpId,
    qpName: sitting.qpName,
    proposedNewDate,
    reason,
    letter: input.letter,
    raisedByRole: input.actorRole,
    raisedBy: input.actorName,
    raisedById: input.actorId,
    raisedAt: new Date().toISOString(),
    state: { stageId: 'dd-recommendation', submittedBy: input.actorName, submittedById: input.actorId },
    recommendations: [],
    decision: null,
    decisionComment: null,
    decidedBy: null,
    decidedAt: null,
  };
  saveRequests([request, ...loadRequests()]);

  const kindLabel = changeRequestKindLabel(request.kind).toLowerCase();
  const dateNote = proposedNewDate ? ` Proposed new date: ${proposedNewDate}.` : '';
  appendAuditEntry({
    recordType: CHANGE_REQUEST_RECORD_TYPE,
    recordId: request.id,
    actorRole: input.actorRole,
    actorId: input.actorId,
    actorName: input.actorName,
    action: `Raised a ${kindLabel} request (${sitting.qualificationTitle}, ${sitting.date})`,
    note: `${reason}${dateNote} Formal letter: ${input.letter.fileName}`,
  });
  addNotification({
    recipientRole: REQUEST_RECOMMENDER_ROLE,
    title: `EISA sitting ${kindLabel} request`,
    body: `A ${kindLabel} request for "${sitting.qualificationTitle}" on ${sitting.date} is waiting for your recommendation.`,
  });
  addNotification({
    recipientRole: 'QP',
    title: `EISA sitting ${kindLabel} request raised`,
    body:
      input.actorRole === 'QP'
        ? `Your ${kindLabel} request for "${sitting.qualificationTitle}" on ${sitting.date} has been received and is with the DD.`
        : `QCTO has raised a ${kindLabel} request for your sitting "${sitting.qualificationTitle}" on ${sitting.date}. It is with the DD.`,
  });

  return request;
}

interface ChangeRequestActionParams {
  requestId: string;
  actionId: ChangeRequestActionId;
  actorRole: Role;
  actorId: string;
  actorName: string;
  comment?: string;
}

// CR-053: the person who raised or recommended a request can never act on it again — in
// particular, the person who recommends cannot also decide.
export function hasActedOnRequest(requestId: string, personId: string): boolean {
  return getAuditTrail(CHANGE_REQUEST_RECORD_TYPE, requestId).some((e) => e.actorId === personId);
}

export const DIFFERENT_PERSON_MESSAGE = 'You have already acted on this request. Each step must be done by a different person.';

export async function performChangeRequestAction(params: ChangeRequestActionParams): Promise<EisaSittingChangeRequest> {
  const requests = loadRequests();
  const request = requests.find((r) => r.id === params.requestId);
  if (!request) throw new Error('Request not found.');
  if (hasActedOnRequest(request.id, params.actorId)) throw new Error(DIFFERENT_PERSON_MESSAGE);

  const comment = params.comment?.trim() || undefined;
  if (params.actionId === 'request-approve') {
    const sitting = (await listSittings()).find((s) => s.id === request.sittingId);
    if (sitting?.status !== 'published') throw new Error('This sitting is no longer published, so the request cannot be approved.');
  }

  const definition = changeRequestWorkflow(request.kind);
  const nextState = performAction({
    definition,
    record: request.state,
    actionId: params.actionId,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    note: comment,
    recordType: CHANGE_REQUEST_RECORD_TYPE,
    recordId: request.id,
  });

  const now = new Date().toISOString();
  const decided = params.actionId !== 'request-recommend';
  const updated: EisaSittingChangeRequest = {
    ...request,
    state: nextState,
    recommendations: decided
      ? request.recommendations
      : [...request.recommendations, { role: params.actorRole, personId: params.actorId, personName: params.actorName, comment: comment ?? null, at: now }],
    decision: params.actionId === 'request-approve' ? 'approved' : params.actionId === 'request-decline' ? 'declined' : null,
    decisionComment: decided ? (comment ?? null) : null,
    decidedBy: decided ? params.actorName : null,
    decidedAt: decided ? now : null,
  };
  saveRequests(requests.map((r) => (r.id === request.id ? updated : r)));

  const kindLabel = changeRequestKindLabel(request.kind).toLowerCase();
  const subject = `"${request.qualificationTitle}" on ${request.sittingDate}`;
  if (params.actionId === 'request-recommend') {
    const nextStage = definition.stages.find((s) => s.id === nextState.stageId);
    const nextRole = nextStage?.allowedRoles[0];
    if (nextRole) {
      addNotification({
        recipientRole: nextRole,
        title: `EISA sitting ${kindLabel} request`,
        body: `A ${kindLabel} request for ${subject} was recommended by the ${params.actorRole === 'Deputy Director' ? 'DD' : params.actorRole} and is waiting for you.`,
      });
    }
    addNotification({
      recipientRole: 'QP',
      title: `EISA sitting ${kindLabel} request recommended`,
      body: `The ${kindLabel} request for ${subject} was recommended. It is now ${nextStage?.label.toLowerCase() ?? 'with the next official'}.`,
    });
  }
  if (params.actionId === 'request-approve') {
    await applyApprovedSittingChange({
      sittingId: request.sittingId,
      actionId: request.kind === 'postponement' ? 'sitting-postpone' : 'sitting-cancel',
      actorRole: params.actorRole,
      actorId: params.actorId,
      actorName: params.actorName,
      reason: request.reason,
      proposedNewDate: request.proposedNewDate,
    });
    addNotification({
      recipientRole: 'QP',
      title: `EISA sitting ${kindLabel} request approved`,
      body: `The ${kindLabel} request for ${subject} was approved.${comment ? ` Comment: ${comment}` : ''}`,
    });
  }
  if (params.actionId === 'request-decline') {
    addNotification({
      recipientRole: 'QP',
      title: `EISA sitting ${kindLabel} request declined`,
      body: `The ${kindLabel} request for ${subject} was declined: ${comment ?? ''} The sitting stays as published.`,
    });
  }

  return updated;
}
