import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { NotificationBanner } from '../../../shared/notifications/NotificationBanner';
import { useNotifications } from '../../../shared/notifications/useNotifications';
import { ScopeToggle } from '../../../shared/ui/ScopeToggle';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterByScope, type ListScope } from '../../../shared/visibility/recordVisibility';
import { canActInStage } from '../../../shared/workflow/engine';
import { CHANGE_REQUEST_RECORD_TYPE, hasActedOnRequest } from '../changeRequests';
import { ChangeRequestDetailDialog } from '../components/ChangeRequestDetailDialog';
import { ChangeRequestsList } from '../components/ChangeRequestsList';
import { RaiseChangeRequestDialog, type ChangeRequestTarget } from '../components/RaiseChangeRequestDialog';
import { SittingListView } from '../components/SittingListView';
import { SittingMonthView } from '../components/SittingMonthView';
import { UpcomingDeadlinesBanner } from '../components/UpcomingDeadlinesBanner';
import { CALENDAR_REVIEWER_ROLE, REQUEST_RAISER_ROLES } from '../config';
import {
  useAddSitting,
  useChangeRequests,
  useDeleteSitting,
  useEditSitting,
  useEisaSittings,
  useSittingIdsWithRegistrations,
} from '../hooks';
import { changeRequestWorkflow, isChangeRequestOpen } from '../workflow';
import type { EisaSitting } from '../types';
import { AddEditSittingDialog } from './AddEditSittingDialog';
import { BatchReviewPanel } from './BatchReviewPanel';

export function InternalCalendarView() {
  const { data: sittings = [] } = useEisaSittings();
  const { data: requests = [] } = useChangeRequests();
  const { data: sittingIdsWithRegistrations = [] } = useSittingIdsWithRegistrations();
  const sittingIdsWithRegistrationsSet = new Set(sittingIdsWithRegistrations);
  const { role, person } = useV2Role();
  const { notifications, dismiss } = useNotifications(role);
  const actorId = person.id;
  const actorName = person.name;

  const addSitting = useAddSitting();
  const editSitting = useEditSitting();
  const deleteSitting = useDeleteSitting();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EisaSitting | null>(null);
  const [requestTarget, setRequestTarget] = useState<ChangeRequestTarget | null>(null);
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);
  const [requestScope, setRequestScope] = useState<ListScope>('mine');

  // QCTO feedback 2.4: the ASD adds special sittings, edits unpublished ones and reviews
  // proposals; the DD can raise a postponement or cancellation request on a published sitting.
  const canManage = role === CALENDAR_REVIEWER_ROLE;
  const canRaiseRequest = REQUEST_RAISER_ROLES.includes(role);
  const openRequestSittingIds = new Set(requests.filter(isChangeRequestOpen).map((r) => r.sittingId));

  // "My items": requests this person raised or acted on, plus open ones waiting at a stage
  // their role acts in that they have not yet acted on.
  const visibleRequests = filterByScope(
    requests,
    requestScope,
    person.id,
    (r) => [r.raisedById, ...r.recommendations.map((rec) => rec.personId)],
    (r) => canActInStage(changeRequestWorkflow(r.kind), r.state.stageId, role) && !hasActedOnRequest(r.id, person.id),
  );
  const openRequest = requests.find((r) => r.id === openRequestId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">EISA Calendar</h2>
          <p className="text-sm text-gray-500 mt-1">
            Roles: ASD reviews, approves and publishes the sitting dates QPs propose. Postponement requests: DD recommends, Director
            decides. Cancellation requests: DD and Director recommend, CEO decides.
          </p>
        </div>
        {canManage && (
          <Button
            className="gap-2"
            onClick={() => {
              setEditTarget(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Add Sitting
          </Button>
        )}
      </div>

      <NotificationBanner notifications={notifications} onDismiss={dismiss} />
      <UpcomingDeadlinesBanner sittings={sittings} />

      <Tabs defaultValue={canManage ? 'proposals' : 'requests'}>
        <TabsList>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="month">Month View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="pt-4">
          <BatchReviewPanel />
        </TabsContent>

        <TabsContent value="requests" className="pt-4 space-y-3">
          <div className="flex items-center justify-end">
            <ScopeToggle scope={requestScope} onChange={setRequestScope} />
          </div>
          <ChangeRequestsList
            requests={visibleRequests}
            onOpen={(r) => setOpenRequestId(r.id)}
            emptyText="No postponement or cancellation requests to show."
          />
        </TabsContent>

        <TabsContent value="month" className="pt-4">
          <SittingMonthView sittings={sittings} />
        </TabsContent>

        <TabsContent value="list" className="pt-4">
          <SittingListView
            sittings={sittings}
            onRequestPostponement={canRaiseRequest ? (s) => setRequestTarget({ sitting: s, kind: 'postponement' }) : undefined}
            onRequestCancellation={canRaiseRequest ? (s) => setRequestTarget({ sitting: s, kind: 'cancellation' }) : undefined}
            openRequestSittingIds={openRequestSittingIds}
            onEdit={
              canManage
                ? (s) => {
                    setEditTarget(s);
                    setDialogOpen(true);
                  }
                : undefined
            }
            onDelete={canManage ? (s) => deleteSitting.mutate({ id: s.id, actorId, actorName }) : undefined}
            sittingIdsWithRegistrations={sittingIdsWithRegistrationsSet}
          />
        </TabsContent>

        <TabsContent value="audit" className="pt-4">
          <AuditTrailView recordTypes={['eisa-calendar-batch', 'eisa-calendar-sitting', CHANGE_REQUEST_RECORD_TYPE]} />
        </TabsContent>
      </Tabs>

      <AddEditSittingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sitting={editTarget}
        onSubmit={(values) => {
          if (editTarget) {
            editSitting.mutate({ id: editTarget.id, patch: values, actorId, actorName });
          } else {
            addSitting.mutate({ ...values, createdBy: actorName, createdById: actorId });
          }
        }}
      />

      <RaiseChangeRequestDialog target={requestTarget} onClose={() => setRequestTarget(null)} />
      <ChangeRequestDetailDialog request={openRequest} onClose={() => setOpenRequestId(null)} />
    </div>
  );
}
