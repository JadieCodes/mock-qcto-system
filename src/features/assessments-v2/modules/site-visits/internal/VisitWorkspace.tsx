import { useState } from 'react';
import { CheckCircle2, Repeat2, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { SiteVisitStatusBadge } from '../components/StatusBadge';
import { BOOKING_ROLE, PLAN_APPROVER_ROLE, PLAN_RECOMMENDER_ROLE, PLANNER_ROLE, REPORT_APPROVER_ROLE, REPORT_SUBMITTER_ROLE, SHARE_VISIT_OUTCOME_LABEL } from '../config';
import { usePlanningAction, useReportAction, useSiteVisit, useUpdateVisitDetails } from '../hooks';
import { PLANNING_WORKFLOW, REPORT_WORKFLOW } from '../workflow';
import { VISIT_TYPE_LABELS } from '../visitTypeLabels';
import type { SiteVisit } from '../types';
import type { Role } from '../../../types';

type ReportDialogAction = 'report-send-back' | 'report-reject' | null;

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
          <Label className="text-xs text-gray-400 uppercase">QP</Label>
          <Input value={visit.qpName} disabled={!canEdit} onChange={(e) => updateDetails.mutate({ id: visit.id, patch: { qpName: e.target.value } })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">Qualification</Label>
          <Input
            value={visit.qualificationTitle}
            disabled={!canEdit}
            onChange={(e) => updateDetails.mutate({ id: visit.id, patch: { qualificationTitle: e.target.value } })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400 uppercase">SDP</Label>
          <Input
            value={visit.sdpName ?? ''}
            disabled={!canEdit}
            onChange={(e) => updateDetails.mutate({ id: visit.id, patch: { sdpName: e.target.value || null } })}
          />
        </div>
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
// (toStage === stageId, e.g. the Assistant Director's "Submit Plan") OR leaves it
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
// the Assistant Director's own, which originates the plan and has nothing to send back to) gets
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
    'plan-dd-send-back': { title: 'Send back to Assistant Director', confirmLabel: 'Send back' },
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

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase">Assistant Director planning</p>
        {stage === 'ad-planning' && latestNoteFor('Send back to Assistant Director') && (
          <p className="text-xs text-amber-700">Sent back for clarification: {latestNoteFor('Send back to Assistant Director')}</p>
        )}
        <Textarea
          rows={3}
          value={stage === 'ad-planning' ? planNote : visit.planNote}
          onChange={(e) => setPlanNote(e.target.value)}
          disabled={!(role === PLANNER_ROLE && stage === 'ad-planning')}
        />
        {role === PLANNER_ROLE && stage === 'ad-planning' && (
          <Button
            size="sm"
            disabled={planningAction.isPending}
            onClick={() => planningAction.mutate({ visitId: visit.id, actionId: 'plan-submit', actorRole: role, actorId, actorName, planNote })}
          >
            Submit Plan
          </Button>
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
            <p className="text-sm text-amber-700">Sent back for clarification{latestNoteFor('Send back to Assistant Director') ? `: ${latestNoteFor('Send back to Assistant Director')}` : '.'}</p>
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
  // Item 2 (module audit): the Submit button had no completeness gate at all, letting the ASD
  // submit a report with a blank checklist (CR-011).
  const checklistComplete = isChecklistComplete(visit.checklist, true);
  const submitIssues = canExecute ? getChecklistIssues(visit.checklist, true) : [];

  const dialogCopy: Record<Exclude<ReportDialogAction, null>, { title: string; confirmLabel: string; destructive?: boolean; actionId: string }> = {
    'report-send-back': { title: 'Send back for clarification', confirmLabel: 'Send back', actionId: 'report-send-back' },
    'report-reject': { title: 'Reject report', confirmLabel: 'Reject', destructive: true, actionId: 'report-reject' },
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
          <ValidationSummary issues={submitIssues} title="Complete every checklist line before you can submit the report:" />
          <div className="flex justify-end">
            <Button
              className="gap-2"
              disabled={!checklistComplete || reportAction.isPending}
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
            Approve Report
          </Button>
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

      {/* Row 37 (Fix 4 Part 2 correction): single, role-gated action bar for every visit type —
          gated through shared/workflow's canActInStage (REPORT_WORKFLOW allows the Deputy
          Director to act from 'approved') rather than a bare role comparison. This used to be
          scoped to visit.visitType === 'post-eisa-monitoring' only, which hid the button for
          Marking & Moderation, EISA Readiness and RPL/ARPL Monitoring visits (CR-058 only ever
          meant "Post-EISA Monitoring gets extra recipients", not "only Post-EISA Monitoring
          gets a Share Visit Outcome button" — see progress.md). */}
      {stage === 'approved' && canActInStage(REPORT_WORKFLOW, stage, role) && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => reportAction.mutate({ visitId: visit.id, actionId: 'share-visit-outcome', actorRole: role, actorId, actorName })}>
            {SHARE_VISIT_OUTCOME_LABEL}
          </Button>
        </div>
      )}

      {stage === 'rejected' && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Report rejected.</div>}
      {(stage === 'approved' || stage === 'outcome-shared' || stage === 'closed') && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Report {stage === 'approved' ? 'approved' : stage === 'outcome-shared' ? 'approved — outcome shared, awaiting QP' : 'closed'}.
        </div>
      )}

      {dialogAction && (
        <ReasonDialog
          open={!!dialogAction}
          onOpenChange={(open) => !open && setDialogAction(null)}
          title={dialogCopy[dialogAction].title}
          confirmLabel={dialogCopy[dialogAction].confirmLabel}
          destructive={dialogCopy[dialogAction].destructive}
          onConfirm={(note) => {
            reportAction.mutate({ visitId: visit.id, actionId: dialogCopy[dialogAction].actionId as 'report-send-back' | 'report-reject', actorRole: role, actorId, actorName, note });
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
      title={visit ? `${VISIT_TYPE_LABELS[visit.visitType]} — ${visit.qualificationTitle}` : ''}
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      {visit && <VisitWorkspaceContent visit={visit} />}
    </Modal>
  );
}
