import { useState } from 'react';
import { CheckCircle2, Repeat2, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { roleDescriptor } from '../../../config/roles';
import { ReasonDialog } from '../../../shared/ui/ReasonDialog';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ExecutionForm } from '../components/ExecutionForm';
import { SiteVisitStatusBadge } from '../components/StatusBadge';
import { BOOKING_ROLE, PLAN_APPROVER_ROLE, PLAN_RECOMMENDER_ROLE, PLANNER_ROLE, REPORT_APPROVER_ROLE, REPORT_SUBMITTER_ROLE } from '../config';
import { usePlanningAction, useReportAction, useSiteVisit, useUpdateVisitDetails } from '../hooks';
import { VISIT_TYPE_LABELS } from '../visitTypeLabels';
import type { SiteVisit } from '../types';

type ReportDialogAction = 'report-send-back' | 'report-reject' | 'report-reroute' | null;

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

function PlanningTab({ visit }: { visit: SiteVisit }) {
  const { role } = useV2Role();
  const actorName = roleDescriptor(role)?.label ?? role;
  const planningAction = usePlanningAction();
  const [planNote, setPlanNote] = useState(visit.planNote);
  const stage = visit.planningWorkflow.stageId;

  if (visit.sourceRegistrationId) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="font-semibold">Automatically created — planning chain skipped</p>
        <p className="mt-1">{visit.planNote}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Planning status</span>
        <span className="text-sm font-medium">{stage}</span>
      </div>

      {stage === 'ad-planning' && (
        <div className="space-y-2">
          <Label>Plan Note</Label>
          <Textarea rows={3} value={planNote} onChange={(e) => setPlanNote(e.target.value)} disabled={role !== PLANNER_ROLE} />
          {role === PLANNER_ROLE && (
            <Button
              size="sm"
              disabled={planningAction.isPending}
              onClick={() => planningAction.mutate({ visitId: visit.id, actionId: 'plan-submit', actorRole: role, actorName, planNote })}
            >
              Submit Plan
            </Button>
          )}
        </div>
      )}

      {stage === 'dd-recommend' && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.planNote}</p>
          {role === PLAN_RECOMMENDER_ROLE && (
            <Button size="sm" disabled={planningAction.isPending} onClick={() => planningAction.mutate({ visitId: visit.id, actionId: 'plan-recommend', actorRole: role, actorName })}>
              Recommend to Domain Director
            </Button>
          )}
        </div>
      )}

      {stage === 'domain-director-approval' && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{visit.planNote}</p>
          {role === PLAN_APPROVER_ROLE && (
            <Button size="sm" disabled={planningAction.isPending} onClick={() => planningAction.mutate({ visitId: visit.id, actionId: 'plan-approve', actorRole: role, actorName })}>
              Approve Plan
            </Button>
          )}
        </div>
      )}

      {stage === 'sda-booking' && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
          <p className="text-sm text-gray-700">Plan approved — ready to book.</p>
          {role === BOOKING_ROLE && (
            <Button size="sm" disabled={planningAction.isPending} onClick={() => planningAction.mutate({ visitId: visit.id, actionId: 'plan-book', actorRole: role, actorName })}>
              Book Visit
            </Button>
          )}
        </div>
      )}

      {stage === 'booked' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Booked — ready for execution.</div>
      )}
    </div>
  );
}

function ReportTab({ visit }: { visit: SiteVisit }) {
  const { role } = useV2Role();
  const actorName = roleDescriptor(role)?.label ?? role;
  const reportAction = useReportAction();
  const [dialogAction, setDialogAction] = useState<ReportDialogAction>(null);

  if (visit.planningWorkflow.stageId !== 'booked') {
    return <p className="text-sm text-gray-400">Not yet available — the visit must be booked first.</p>;
  }

  const stage = visit.reportWorkflow.stageId;
  const canExecute = role === REPORT_SUBMITTER_ROLE && stage === 'awaiting-execution';
  const canReview = role === REPORT_APPROVER_ROLE && stage === 'dd-report-review';

  const dialogCopy: Record<Exclude<ReportDialogAction, null>, { title: string; confirmLabel: string; destructive?: boolean; actionId: string }> = {
    'report-send-back': { title: 'Send back for clarification', confirmLabel: 'Send back', actionId: 'report-send-back' },
    'report-reject': { title: 'Reject report', confirmLabel: 'Reject', destructive: true, actionId: 'report-reject' },
    'report-reroute': { title: 'Re-route to another Deputy Director', confirmLabel: 'Re-route', actionId: 'report-reroute' },
  };

  return (
    <div className="space-y-6">
      <ExecutionForm visit={visit} readonly={!canExecute} />

      {canExecute && (
        <div className="flex justify-end">
          <Button
            className="gap-2"
            disabled={reportAction.isPending}
            onClick={() => reportAction.mutate({ visitId: visit.id, actionId: 'report-submit', actorRole: role, actorName })}
          >
            <Send className="h-4 w-4" />
            Submit Report
          </Button>
        </div>
      )}

      {canReview && (
        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
          <Button
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            disabled={reportAction.isPending}
            onClick={() => reportAction.mutate({ visitId: visit.id, actionId: 'report-approve', actorRole: role, actorName })}
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve Report
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDialogAction('report-send-back')}>
            Send back for clarification
          </Button>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setDialogAction('report-reroute')}>
            <Repeat2 className="h-4 w-4" />
            Re-route
          </Button>
          <Button size="sm" variant="destructive" className="gap-2" onClick={() => setDialogAction('report-reject')}>
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        </div>
      )}

      {stage === 'approved' && visit.visitType === 'post-eisa-monitoring' && role === REPORT_APPROVER_ROLE && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => reportAction.mutate({ visitId: visit.id, actionId: 'share-visit-outcome', actorRole: role, actorName })}>
            Share Visit Outcome
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
            reportAction.mutate({ visitId: visit.id, actionId: dialogCopy[dialogAction].actionId as 'report-send-back' | 'report-reject' | 'report-reroute', actorRole: role, actorName, note });
            setDialogAction(null);
          }}
        />
      )}
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
    <Dialog open={!!visitId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        {visit && (
          <>
            <DialogHeader>
              <DialogTitle>
                {VISIT_TYPE_LABELS[visit.visitType]} — {visit.qualificationTitle}
              </DialogTitle>
            </DialogHeader>
            <VisitWorkspaceContent visit={visit} />
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
