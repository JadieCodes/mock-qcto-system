import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { canActInStage } from '../../../shared/workflow/engine';
import { ReasonDialog } from '../../../shared/ui/ReasonDialog';
import { roleDescriptor } from '../../../config/roles';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { SittingListView } from '../components/SittingListView';
import { SittingMonthView } from '../components/SittingMonthView';
import { UpcomingDeadlinesBanner } from '../components/UpcomingDeadlinesBanner';
import { useAddSitting, useDeleteSitting, useEditSitting, useEisaSittings, useSittingLifecycleAction } from '../hooks';
import { SITTING_LIFECYCLE_WORKFLOW } from '../workflow';
import type { EisaSitting } from '../types';
import { AddEditSittingDialog } from './AddEditSittingDialog';
import { BatchReviewPanel } from './BatchReviewPanel';

export function InternalCalendarView() {
  const { data: sittings = [] } = useEisaSittings();
  const { role } = useV2Role();
  const actorName = roleDescriptor(role)?.label ?? role;

  const addSitting = useAddSitting();
  const editSitting = useEditSitting();
  const deleteSitting = useDeleteSitting();
  const lifecycleAction = useSittingLifecycleAction();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EisaSitting | null>(null);
  const [reasonTarget, setReasonTarget] = useState<{ sitting: EisaSitting; actionId: 'sitting-postpone' | 'sitting-cancel' } | null>(
    null,
  );

  const canManage = canActInStage(SITTING_LIFECYCLE_WORKFLOW, 'published', role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">EISA Calendar — EISA Calendar Team</h2>
          <p className="text-sm text-gray-500 mt-1">Review proposed sitting dates, publish approved ones, and manage the calendar directly.</p>
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

      <UpcomingDeadlinesBanner sittings={sittings} />

      <Tabs defaultValue="proposals">
        <TabsList>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="month">Month View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="pt-4">
          <BatchReviewPanel />
        </TabsContent>

        <TabsContent value="month" className="pt-4">
          <SittingMonthView sittings={sittings} />
        </TabsContent>

        <TabsContent value="list" className="pt-4">
          <SittingListView
            sittings={sittings}
            onPostpone={canManage ? (s) => setReasonTarget({ sitting: s, actionId: 'sitting-postpone' }) : undefined}
            onCancel={canManage ? (s) => setReasonTarget({ sitting: s, actionId: 'sitting-cancel' }) : undefined}
            onEdit={
              canManage
                ? (s) => {
                    setEditTarget(s);
                    setDialogOpen(true);
                  }
                : undefined
            }
            onDelete={canManage ? (s) => deleteSitting.mutate({ id: s.id, actorName }) : undefined}
          />
        </TabsContent>

        <TabsContent value="audit" className="pt-4">
          <AuditTrailView recordTypes={['eisa-calendar-batch', 'eisa-calendar-sitting']} />
        </TabsContent>
      </Tabs>

      <AddEditSittingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sitting={editTarget}
        onSubmit={(values) => {
          if (editTarget) {
            editSitting.mutate({ id: editTarget.id, patch: values, actorName });
          } else {
            addSitting.mutate({ ...values, createdBy: actorName });
          }
        }}
      />

      <ReasonDialog
        open={!!reasonTarget}
        title={reasonTarget?.actionId === 'sitting-postpone' ? 'Postpone this sitting' : 'Cancel this sitting'}
        description={
          reasonTarget ? `"${reasonTarget.sitting.qualificationTitle}" on ${reasonTarget.sitting.date} — the affected SDPs will be notified.` : undefined
        }
        confirmLabel={reasonTarget?.actionId === 'sitting-postpone' ? 'Postpone' : 'Cancel sitting'}
        destructive={reasonTarget?.actionId === 'sitting-cancel'}
        onOpenChange={(open) => !open && setReasonTarget(null)}
        onConfirm={(reason) => {
          if (!reasonTarget) return;
          lifecycleAction.mutate({
            sittingId: reasonTarget.sitting.id,
            actionId: reasonTarget.actionId,
            actorRole: role,
            actorName,
            reason,
          });
        }}
      />
    </div>
  );
}
