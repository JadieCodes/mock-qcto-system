import { useState } from 'react';
import { CheckCircle2, Repeat2, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { getAuditTrail } from '../../../shared/audit/auditLog';
import { getChecklistIssues, isChecklistComplete } from '../../../shared/checklist/types';
import { personsForRole } from '../../../shared/people/directory';
import { Modal } from '../../../shared/ui/Modal';
import { ReasonDialog } from '../../../shared/ui/ReasonDialog';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import { canActInStage } from '../../../shared/workflow/engine';
import { ExecutionForm } from '../components/ExecutionForm';
import { QualificationList } from '../components/QualificationList';
import { RemediationHistory, RemediationResponseForm } from '../components/RemediationSection';
import { hasVisitReportFile, MISSING_VISIT_REPORT_MESSAGE } from '../evidence';
import { getScriptVerificationIssues } from '../scriptVerification';
import { SiteVisitStatusBadge } from '../components/StatusBadge';
import {
  BOOKING_ROLE,
  MISSING_VISIT_DATE_MESSAGE,
  PLAN_APPROVER_ROLE,
  PLAN_RECOMMENDER_ROLE,
  PLANNER_ROLE,
  REPORT_APPROVER_ROLE,
  APPROVED_FINAL_LABEL,
  APPROVED_WITH_REMEDIATION_LABEL,
  COMPLETE_VISIT_LABEL,
  FURTHER_REMEDIATION_LABEL,
  REPORT_SUBMITTER_ROLE,
  STAKEHOLDER_SHARE_ROLE,
} from '../config';
import { usePlanningAction, useReportAction, useSetStakeholderShare, useSiteVisit, useUpdateVisitDetails } from '../hooks';
import {
  COMPLETE_VISIT_BLOCKED_MESSAGE,
  isRemediationStage,
  remediationRecordedByAsd,
  remediationRoundsOf,
  remediationStakeholderName,
  REMEDIATION_AWAITING_STAGE,
  REMEDIATION_REVIEW_STAGE,
  visitCanHaveRemediation,
} from '../remediation';
import { isSharedWithStakeholder, SHARE_WITH_STAKEHOLDER_LABEL, shareIsLockedByRemediation, visitCanBeShared } from '../stakeholderShare';
import { isMultiQualificationVisit } from '../visitQualifications';
import { PLAN_SEND_BACK_TO_PLANNER_LABEL, PLANNING_WORKFLOW, REPORT_WORKFLOW } from '../workflow';
import { VISIT_DOMAIN_LABELS, VISIT_DOMAIN_OPTIONS, visitDomainOf } from '../visitDomains';
import {
  isPerQualificationVisit,
  VISIT_TYPE_LABELS,
  visitHasPurpose,
  visitHasQp,
  visitHasSdp,
  visitIsMeeting,
  visitSiteKindLabel,
  visitSiteName,
  visitSubject,
} from '../visitTypeLabels';
import type { SiteVisit, VisitDomain } from '../types';
import type { Role } from '../../../types';

type ReportDialogAction = 'report-send-back' | 'report-reject' | 'report-approve-remediation' | 'remediation-further' | null;

// CR-055: re-route to a named colleague holding the same role — a separate dialog from the
// plain-reason ReasonDialog (also used by send-back/reject) since this one also needs a
// person picker.
function RerouteDialog({
  open,
  onOpenChange,
  role,
  excludePersonId,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  excludePersonId: string;
  onConfirm: (targetPersonId: string, note: string) => void;
}) {
  const candidates = personsForRole(role).filter((p) => p.id !== excludePersonId);
  const [targetPersonId, setTargetPersonId] = useState('');
  const [note, setNote] = useState('');

  const close = () => {
    onOpenChange(false);
    setTargetPersonId('');
    setNote('');
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      size="sm"
      title="Re-route to a named colleague"
      footer={
        <>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={!targetPersonId || !note.trim()}
            onClick={() => {
              const target = targetPersonId;
              const reason = note.trim();
              close();
              onConfirm(target, reason);
            }}
          >
            Re-route
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Re-route to *</Label>
          <Select value={targetPersonId} onValueChange={setTargetPersonId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a colleague" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {candidates.length === 0 && <p className="text-xs text-gray-400">No other named colleague with this role exists yet.</p>}
        </div>
        <div className="space-y-2">
          <Label>Reason *</Label>
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Explain why..." />
        </div>
      </div>
    </Modal>
  );
}

function DetailsTab({ visit }: { visit: SiteVisit }) {
  const { role } = useV2Role();
  const updateDetails = useUpdateVisitDetails();
  const canEdit = role !== 'QP' && visit.reportWorkflow.stageId === 'awaiting-execution';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Status</span>
        <SiteVisitStatusBadge visit={visit} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Domain</Label>
          <Select
            value={visitDomainOf(visit)}
            onValueChange={(v) => updateDetails.mutate({ id: visit.id, patch: { domain: v as VisitDomain } })}
            disabled={!canEdit}
          >
            <SelectTrigger aria-label="Domain">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VISIT_DOMAIN_OPTIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {VISIT_DOMAIN_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {visitIsMeeting(visit.visitType) ? (
          <div className="space-y-1">
            <Label className="text-xs text-gray-400 uppercase">Meeting title</Label>
            <Input
              value={visit.meetingTitle ?? ''}
              disabled={!canEdit}
              onChange={(e) => updateDetails.mutate({ id: visit.id, patch: { meetingTitle: e.target.value } })}
            />
          </div>
        ) : visitHasQp(visit.visitType) ? (
          <div className="space-y-1">
            <Label className="text-xs text-gray-400 uppercase">QP</Label>
            <Input value={visit.qpName} disabled={!canEdit} onChange={(e) => updateDetails.mutate({ id: visit.id, patch: { qpName: e.target.value } })} />
          </div>
        ) : (
          // QCTO feedback 2.7: RPL/ARPL is held at an SDP or assessment centre — no QP.
          <div className="space-y-1">
            <Label className="text-xs text-gray-400 uppercase">{visitSiteKindLabel(visit)}</Label>
            <p className="text-sm font-medium pt-2">{visitSiteName(visit) || '—'}</p>
          </div>
        )}
        {isPerQualificationVisit(visit.visitType) && !isMultiQualificationVisit(visit.visitType) && (
          <div className="space-y-1">
            <Label className="text-xs text-gray-400 uppercase">Qualification</Label>
            <Input
              value={visit.qualificationTitle}
              disabled={!canEdit}
              onChange={(e) => updateDetails.mutate({ id: visit.id, patch: { qualificationTitle: e.target.value } })}
            />
          </div>
        )}
        {visitHasSdp(visit.visitType) && visitHasQp(visit.visitType) && (
          <div className="space-y-1">
            <Label className="text-xs text-gray-400 uppercase">SDP</Label>
            <Input
              value={visit.sdpName ?? ''}
              disabled={!canEdit}
              onChange={(e) => updateDetails.mutate({ id: visit.id, patch: { sdpName: e.target.value || null } })}
            />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Visit Date</Label>
          <Input
            type="date"
            value={visit.visitDate}
            disabled={!canEdit}
            onChange={(e) => updateDetails.mutate({ id: visit.id, patch: { visitDate: e.target.value } })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Venue</Label>
          <Input value={visit.venue} disabled={!canEdit} onChange={(e) => updateDetails.mutate({ id: visit.id, patch: { venue: e.target.value } })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Notification</Label>
          <p className="text-sm font-medium pt-2 capitalize">
            {visit.notificationFlag}
            {visit.notificationFlag === 'notified' && visit.noticeLeadTimeDays != null && ` — ${visit.noticeLeadTimeDays} day lead time`}
          </p>
        </div>
      </div>
      <QualificationList visit={visit} />
      {visitHasPurpose(visit.visitType) && (
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Purpose</Label>
          <Textarea
            rows={3}
            value={visit.purpose ?? ''}
            disabled={!canEdit}
            onChange={(e) => updateDetails.mutate({ id: visit.id, patch: { purpose: e.target.value } })}
          />
        </div>
      )}
      {visit.learnerNames.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Learners (RPL/ARPL)</Label>
          <p className="text-sm text-gray-700">{visit.learnerNames.join(', ')}</p>
        </div>
      )}
    </div>
  );
}

type PlanningDialogAction = { actionId: 'plan-dd-send-back' | 'plan-dd-reject' | 'plan-domain-director-send-back' | 'plan-domain-director-reject' | 'plan-sda-send-back' | 'plan-sda-reject'; title: string; confirmLabel: string; destructive?: boolean } | null;

const PLANNING_STAGE_ORDER = ['ad-planning', 'dd-recommend', 'domain-director-approval', 'sda-booking', 'booked'] as const;

// A stage has been "reached" once an audit entry exists for an action that enters it
// (toStage === stageId, e.g. the ASD's "Submit Plan") OR leaves it
// (fromStage === stageId, e.g. the Deputy Director's "Recommend to Domain Director"). Checking
// only the "leaves it" half (as a previous version of this function did) means a stage's own
// action bar never appears the first time it's entered, because the only audit entry that
// exists at that point is the one that got it there — the bug this comment is guarding against.
function stageReached(stageId: string, auditTrail: { action: string }[]): boolean {
  const labels = new Set(
    PLANNING_WORKFLOW.actions.filter((a) => a.fromStage === stageId || a.toStage === stageId).map((a) => a.label),
  );
  return auditTrail.some((e) => labels.has(e.action));
}

// Row 32: once a stage has been reached, its box stays visible (read-only once passed) instead
// of disappearing the moment the record moves on — every later approver can still see the plan
// and every earlier reviewer's decision. Row 33: every review stage (every stage downstream of
// the ASD's own, which originates the plan and has nothing to send back to) gets
// a Reject and a Send back action alongside its forward action.
function PlanningTab({ visit }: { visit: SiteVisit }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const planningAction = usePlanningAction();
  const [planNote, setPlanNote] = useState(visit.planNote);
  const [dialogAction, setDialogAction] = useState<PlanningDialogAction>(null);
  const stage = visit.planningWorkflow.stageId;

  if (visit.sourceRegistrationId) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="font-semibold">Automatically created — planning chain skipped</p>
        <p className="mt-1">{visit.planNote}</p>
        <div className="mt-3 text-gray-900">
          <QualificationList visit={visit} />
        </div>
      </div>
    );
  }

  const auditTrail = getAuditTrail('site-visit-planning', visit.id);
  const latestNoteFor = (actionLabel: string) => auditTrail.slice().reverse().find((e) => e.action === actionLabel)?.note;

  if (stage === 'planning-rejected') {
    const rejectReason = auditTrail.slice().reverse().find((e) => e.action.startsWith('Reject'))?.note;
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 space-y-1">
          <p className="font-semibold">Planning rejected.</p>
          {rejectReason && <p>Reason: {rejectReason}</p>}
        </div>
        {visit.planNote && (
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-400 uppercase mb-1">Plan Note</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.planNote}</p>
          </div>
        )}
      </div>
    );
  }

  const currentIdx = PLANNING_STAGE_ORDER.indexOf(stage as (typeof PLANNING_STAGE_ORDER)[number]);
  // "Reached" uses the audit trail, not the current stage index, so a stage that has already
  // been acted on stays visible even after a later stage sends it back behind that point.
  const ddReached = stageReached('dd-recommend', auditTrail);
  const domainDirectorReached = stageReached('domain-director-approval', auditTrail);
  const sdaReached = stageReached('sda-booking', auditTrail);

  const dialogCopy: Record<Exclude<PlanningDialogAction, null>['actionId'], { title: string; confirmLabel: string; destructive?: boolean }> = {
    'plan-dd-send-back': { title: PLAN_SEND_BACK_TO_PLANNER_LABEL, confirmLabel: 'Send back' },
    'plan-dd-reject': { title: 'Reject plan', confirmLabel: 'Reject', destructive: true },
    'plan-domain-director-send-back': { title: 'Send back to Deputy Director', confirmLabel: 'Send back' },
    'plan-domain-director-reject': { title: 'Reject plan', confirmLabel: 'Reject', destructive: true },
    'plan-sda-send-back': { title: 'Send back to Domain Director', confirmLabel: 'Send back' },
    'plan-sda-reject': { title: 'Reject plan', confirmLabel: 'Reject', destructive: true },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Planning status</span>
        <span className="text-sm font-medium">{stage}</span>
      </div>

      <QualificationList visit={visit} />

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase">ASD planning</p>
        {stage === 'ad-planning' && latestNoteFor(PLAN_SEND_BACK_TO_PLANNER_LABEL) && (
          <p className="text-xs text-amber-700">Sent back for clarification: {latestNoteFor(PLAN_SEND_BACK_TO_PLANNER_LABEL)}</p>
        )}
        <Textarea
          rows={3}
          value={stage === 'ad-planning' ? planNote : visit.planNote}
          onChange={(e) => setPlanNote(e.target.value)}
          disabled={!(role === PLANNER_ROLE && stage === 'ad-planning')}
        />
        {role === PLANNER_ROLE && stage === 'ad-planning' && (
          <>
            {!visit.visitDate && <p className="text-xs text-amber-700">{MISSING_VISIT_DATE_MESSAGE} Set it on the Details tab.</p>}
            <Button
              size="sm"
              disabled={planningAction.isPending || !visit.visitDate}
              onClick={() => planningAction.mutate({ visitId: visit.id, actionId: 'plan-submit', actorRole: role, actorId, actorName, planNote })}
            >
              Submit Plan
            </Button>
          </>
        )}
      </div>

      {ddReached && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">Deputy Director recommendation</p>
          {stage === 'dd-recommend' ? (
            role === PLAN_RECOMMENDER_ROLE && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={planningAction.isPending} onClick={() => planningAction.mutate({ visitId: visit.id, actionId: 'plan-recommend', actorRole: role, actorId, actorName })}>
                  Recommend to Domain Director
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDialogAction({ actionId: 'plan-dd-send-back', ...dialogCopy['plan-dd-send-back'] })}>
                  Send back for clarification
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDialogAction({ actionId: 'plan-dd-reject', ...dialogCopy['plan-dd-reject'] })}>
                  Reject
                </Button>
              </div>
            )
          ) : currentIdx > PLANNING_STAGE_ORDER.indexOf('dd-recommend') ? (
            <p className="text-sm text-emerald-700">Recommended to Domain Director.</p>
          ) : (
            <p className="text-sm text-amber-700">Sent back for clarification{latestNoteFor(PLAN_SEND_BACK_TO_PLANNER_LABEL) ? `: ${latestNoteFor(PLAN_SEND_BACK_TO_PLANNER_LABEL)}` : '.'}</p>
          )}
        </div>
      )}

      {domainDirectorReached && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">Domain Director approval</p>
          {stage === 'domain-director-approval' ? (
            role === PLAN_APPROVER_ROLE && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={planningAction.isPending} onClick={() => planningAction.mutate({ visitId: visit.id, actionId: 'plan-approve', actorRole: role, actorId, actorName })}>
                  Approve Plan
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDialogAction({ actionId: 'plan-domain-director-send-back', ...dialogCopy['plan-domain-director-send-back'] })}>
                  Send back for clarification
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDialogAction({ actionId: 'plan-domain-director-reject', ...dialogCopy['plan-domain-director-reject'] })}>
                  Reject
                </Button>
              </div>
            )
          ) : currentIdx > PLANNING_STAGE_ORDER.indexOf('domain-director-approval') ? (
            <p className="text-sm text-emerald-700">Plan approved.</p>
          ) : (
            <p className="text-sm text-amber-700">Sent back for clarification{latestNoteFor('Send back to Deputy Director') ? `: ${latestNoteFor('Send back to Deputy Director')}` : '.'}</p>
          )}
        </div>
      )}

      {sdaReached && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">Sub Domain Admin booking</p>
          {stage === 'sda-booking' ? (
            role === BOOKING_ROLE && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={planningAction.isPending} onClick={() => planningAction.mutate({ visitId: visit.id, actionId: 'plan-book', actorRole: role, actorId, actorName })}>
                  Book Visit
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDialogAction({ actionId: 'plan-sda-send-back', ...dialogCopy['plan-sda-send-back'] })}>
                  Send back for clarification
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDialogAction({ actionId: 'plan-sda-reject', ...dialogCopy['plan-sda-reject'] })}>
                  Reject
                </Button>
              </div>
            )
          ) : currentIdx > PLANNING_STAGE_ORDER.indexOf('sda-booking') ? (
            <p className="text-sm text-emerald-700">Booked.</p>
          ) : (
            <p className="text-sm text-amber-700">Sent back for clarification{latestNoteFor('Send back to Domain Director') ? `: ${latestNoteFor('Send back to Domain Director')}` : '.'}</p>
          )}
        </div>
      )}

      {stage === 'booked' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Booked — ready for execution.</div>
      )}

      {dialogAction && (
        <ReasonDialog
          open={!!dialogAction}
          onOpenChange={(open) => !open && setDialogAction(null)}
          title={dialogAction.title}
          confirmLabel={dialogAction.confirmLabel}
          destructive={dialogAction.destructive}
          onConfirm={(note) => {
            planningAction.mutate({ visitId: visit.id, actionId: dialogAction.actionId, actorRole: role, actorId, actorName, note });
            setDialogAction(null);
          }}
        />
      )}
    </div>
  );
}

// Shared visit outcomes: a per-visit Yes/No, default No. Choosing Yes asks for the outcome
// summary the QP will see on their Visit Outcomes page.
function StakeholderShareCard({ visit }: { visit: SiteVisit }) {
  const { role, person } = useV2Role();
  const setShare = useSetStakeholderShare();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const shared = isSharedWithStakeholder(visit);
  const locked = shareIsLockedByRemediation(visit);
  const canDecide = role === STAKEHOLDER_SHARE_ROLE && !locked;
  const change = visit.stakeholderShare;
  const actor = { visitId: visit.id, actorRole: role, actorId: person.id, actorName: person.name };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase">{SHARE_WITH_STAKEHOLDER_LABEL}</p>
      {canDecide ? (
        <RadioGroup
          value={shared ? 'yes' : 'no'}
          onValueChange={(v) => (v === 'yes' ? setSummaryOpen(true) : setShare.mutate({ ...actor, shared: false }))}
          className="flex gap-6"
          disabled={setShare.isPending}
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem id={`share-no-${visit.id}`} value="no" />
            <Label htmlFor={`share-no-${visit.id}`} className="text-sm font-normal">
              No
            </Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem id={`share-yes-${visit.id}`} value="yes" />
            <Label htmlFor={`share-yes-${visit.id}`} className="text-sm font-normal">
              Yes — share with {visit.qpName}
            </Label>
          </div>
        </RadioGroup>
      ) : (
        <p className="text-sm text-gray-700">{shared ? `Shared with ${visit.qpName}.` : 'Not shared.'}</p>
      )}
      {locked && (
        <p className="text-xs text-amber-700">
          Shared automatically because remediation was requested. The report and the remediation items stay shared with {visit.qpName}.
        </p>
      )}
      {change && (
        <p className="text-xs text-gray-500">
          {shared ? 'Shared' : 'Sharing stopped'} by {change.changedBy} on {change.changedAt.slice(0, 10)}.
        </p>
      )}
      {shared && change?.outcomeSummary && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400 uppercase">Outcome summary</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{change.outcomeSummary}</p>
        </div>
      )}
      <ReasonDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        title={`Share the report with ${visit.qpName}`}
        description="The QP will see the visit type, date, this summary and the visit report."
        fieldLabel="Outcome summary *"
        placeholder="Summarise the outcome of the visit..."
        confirmLabel="Share"
        onConfirm={(outcomeSummary) => setShare.mutate({ ...actor, shared: true, outcomeSummary })}
      />
    </div>
  );
}

function ReportTab({ visit }: { visit: SiteVisit }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const reportAction = useReportAction();
  const [dialogAction, setDialogAction] = useState<ReportDialogAction>(null);
  const [rerouteOpen, setRerouteOpen] = useState(false);

  if (visit.planningWorkflow.stageId !== 'booked') {
    return <p className="text-sm text-gray-400">Not yet available — the visit must be booked first.</p>;
  }

  const stage = visit.reportWorkflow.stageId;
  const canExecute = role === REPORT_SUBMITTER_ROLE && stage === 'awaiting-execution';
  const canReview = role === REPORT_APPROVER_ROLE && stage === 'dd-report-review';
  // Batch V1 (05.14): the DD's review of a submitted remediation.
  const canReviewRemediation = role === REPORT_APPROVER_ROLE && stage === REMEDIATION_REVIEW_STAGE;
  const canRecordResponse = role === REPORT_SUBMITTER_ROLE && stage === REMEDIATION_AWAITING_STAGE && remediationRecordedByAsd(visit);
  const rounds = remediationRoundsOf(visit);
  // Item 2 (module audit): the Submit button had no completeness gate at all, letting the ASD
  // submit a report with a blank checklist (CR-011).
  const checklistComplete = isChecklistComplete(visit.checklist, true);
  // QCTO feedback 1.12: at least one "Visit report" file before the report can be submitted.
  const reportFileUploaded = hasVisitReportFile(visit);
  // QCTO feedback 3.7: Marking & Moderation also needs its script verification sample.
  const scriptIssues = getScriptVerificationIssues(visit);
  const submitIssues = canExecute
    ? [
        ...getChecklistIssues(visit.checklist, true),
        ...(reportFileUploaded ? [] : [{ field: 'evidence-report', message: MISSING_VISIT_REPORT_MESSAGE }]),
        ...scriptIssues,
      ]
    : [];

  const dialogCopy: Record<Exclude<ReportDialogAction, null>, { title: string; confirmLabel: string; destructive?: boolean; actionId: string; description?: string; fieldLabel?: string; placeholder?: string }> = {
    'report-send-back': { title: 'Send back for clarification', confirmLabel: 'Send back', actionId: 'report-send-back' },
    'report-reject': { title: 'Reject report', confirmLabel: 'Reject', destructive: true, actionId: 'report-reject' },
    'report-approve-remediation': {
      title: APPROVED_WITH_REMEDIATION_LABEL,
      confirmLabel: APPROVED_WITH_REMEDIATION_LABEL,
      actionId: 'report-approve-remediation',
      description: `The report and these items are shared with ${remediationStakeholderName(visit)} automatically, whatever the share choice says.`,
      fieldLabel: 'Remediation items *',
      placeholder: 'List what must be fixed...',
    },
    'remediation-further': {
      title: FURTHER_REMEDIATION_LABEL,
      confirmLabel: FURTHER_REMEDIATION_LABEL,
      actionId: 'remediation-further',
      description: 'Another round: the stakeholder is asked to address these items.',
      fieldLabel: 'Remediation items *',
      placeholder: 'List what is still outstanding...',
    },
  };

  return (
    <div className="space-y-6">
      <ExecutionForm visit={visit} readonly={!canExecute} />

      {visit.reroutedToName && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Re-routed to <strong>{visit.reroutedToName}</strong>.
        </div>
      )}

      {canExecute && (
        <>
          <ValidationSummary issues={submitIssues} title="Complete these before you can submit the report:" />
          <div className="flex justify-end">
            <Button
              className="gap-2"
              disabled={!checklistComplete || !reportFileUploaded || scriptIssues.length > 0 || reportAction.isPending}
              onClick={() => reportAction.mutate({ visitId: visit.id, actionId: 'report-submit', actorRole: role, actorId, actorName })}
            >
              <Send className="h-4 w-4" />
              Submit Report
            </Button>
          </div>
        </>
      )}

      {canReview && (
        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
          <Button
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            disabled={reportAction.isPending}
            onClick={() => reportAction.mutate({ visitId: visit.id, actionId: 'report-approve', actorRole: role, actorId, actorName })}
          >
            <CheckCircle2 className="h-4 w-4" />
            {APPROVED_FINAL_LABEL}
          </Button>
          {visitCanHaveRemediation(visit) && (
            <Button size="sm" variant="outline" className="gap-2" disabled={reportAction.isPending} onClick={() => setDialogAction('report-approve-remediation')}>
              <CheckCircle2 className="h-4 w-4" />
              {APPROVED_WITH_REMEDIATION_LABEL}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setDialogAction('report-send-back')}>
            Send back for clarification
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setRerouteOpen(true)}>
            <Repeat2 className="h-4 w-4" />
            Re-route
          </Button>
          <Button size="sm" variant="destructive" className="gap-2" onClick={() => setDialogAction('report-reject')}>
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        </div>
      )}

      <RemediationHistory rounds={rounds} />

      {canRecordResponse && <RemediationResponseForm visit={visit} />}
      {isRemediationStage(stage) && !canRecordResponse && stage === REMEDIATION_AWAITING_STAGE && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Waiting for {remediationRecordedByAsd(visit) ? `the ASD to record the response of ${remediationStakeholderName(visit)}` : `${visit.qpName} to respond`}.
        </div>
      )}
      {canReviewRemediation && (
        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
          <Button
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            disabled={reportAction.isPending}
            onClick={() => reportAction.mutate({ visitId: visit.id, actionId: 'remediation-approve-final', actorRole: role, actorId, actorName })}
          >
            <CheckCircle2 className="h-4 w-4" />
            {APPROVED_FINAL_LABEL}
          </Button>
          <Button size="sm" variant="outline" disabled={reportAction.isPending} onClick={() => setDialogAction('remediation-further')}>
            {FURTHER_REMEDIATION_LABEL}
          </Button>
        </div>
      )}
      {isRemediationStage(stage) && role === REPORT_APPROVER_ROLE && <p className="text-xs text-gray-500">{COMPLETE_VISIT_BLOCKED_MESSAGE}</p>}

      {visitCanBeShared(visit) && <StakeholderShareCard visit={visit} />}

      {/* Row 37: one role-gated action for every visit type, gated through canActInStage
          (REPORT_WORKFLOW allows the Deputy Director to act from 'approved'). */}
      {stage === 'approved' && canActInStage(REPORT_WORKFLOW, stage, role) && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => reportAction.mutate({ visitId: visit.id, actionId: 'share-visit-outcome', actorRole: role, actorId, actorName })}>
            {COMPLETE_VISIT_LABEL}
          </Button>
        </div>
      )}

      {stage === 'rejected' && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Report rejected.</div>}
      {(stage === 'approved' || stage === 'outcome-shared' || stage === 'closed') && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {/* 'outcome-shared' only remains on visits stored before Batch A3. */}
          {APPROVED_FINAL_LABEL}{stage === 'approved' ? '' : ' — visit completed'}.
        </div>
      )}

      {dialogAction && (
        <ReasonDialog
          open={!!dialogAction}
          onOpenChange={(open) => !open && setDialogAction(null)}
          title={dialogCopy[dialogAction].title}
          description={dialogCopy[dialogAction].description}
          fieldLabel={dialogCopy[dialogAction].fieldLabel}
          placeholder={dialogCopy[dialogAction].placeholder}
          confirmLabel={dialogCopy[dialogAction].confirmLabel}
          destructive={dialogCopy[dialogAction].destructive}
          onConfirm={(note) => {
            reportAction.mutate({ visitId: visit.id, actionId: dialogAction, actorRole: role, actorId, actorName, note });
            setDialogAction(null);
          }}
        />
      )}

      <RerouteDialog
        open={rerouteOpen}
        onOpenChange={setRerouteOpen}
        role={role}
        excludePersonId={actorId}
        onConfirm={(targetPersonId, note) => {
          reportAction.mutate({ visitId: visit.id, actionId: 'report-reroute', actorRole: role, actorId, actorName, note, targetPersonId });
        }}
      />
    </div>
  );
}

function VisitWorkspaceContent({ visit }: { visit: SiteVisit }) {
  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="planning">Planning</TabsTrigger>
        <TabsTrigger value="report">Execution &amp; Report</TabsTrigger>
        <TabsTrigger value="audit">Audit Trail</TabsTrigger>
      </TabsList>
      <TabsContent value="details" className="pt-4">
        <DetailsTab visit={visit} />
      </TabsContent>
      <TabsContent value="planning" className="pt-4">
        <PlanningTab visit={visit} />
      </TabsContent>
      <TabsContent value="report" className="pt-4">
        <ReportTab visit={visit} />
      </TabsContent>
      <TabsContent value="audit" className="pt-4">
        <AuditTrailView recordTypes={['site-visit-planning', 'site-visit-report']} recordId={visit.id} />
      </TabsContent>
    </Tabs>
  );
}

export function VisitWorkspace({ visitId, onClose }: { visitId: string | null; onClose: () => void }) {
  const { data: visit } = useSiteVisit(visitId);
  return (
    <Modal
      open={!!visitId}
      onOpenChange={(open) => !open && onClose()}
      size="lg"
      title={visit ? `${VISIT_TYPE_LABELS[visit.visitType]} — ${visitSubject(visit)}` : ''}
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      {visit && <VisitWorkspaceContent visit={visit} />}
    </Modal>
  );
}
