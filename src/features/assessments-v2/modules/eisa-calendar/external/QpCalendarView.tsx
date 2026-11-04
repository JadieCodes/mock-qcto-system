import { useState } from 'react';
import { FileSpreadsheet, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationBanner } from '../../../shared/notifications/NotificationBanner';
import { useNotifications } from '../../../shared/notifications/useNotifications';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterExternalRecords } from '../../../shared/visibility/recordVisibility';
import { QP_EDITABLE_BATCH_STAGES } from '../api';
import { ChangeRequestDetailDialog } from '../components/ChangeRequestDetailDialog';
import { ChangeRequestsList } from '../components/ChangeRequestsList';
import { RaiseChangeRequestDialog, type ChangeRequestTarget } from '../components/RaiseChangeRequestDialog';
import { DatesWithClosing } from '../components/RegistrationCloses';
import { SittingListView } from '../components/SittingListView';
import { SittingMonthView } from '../components/SittingMonthView';
import { UpcomingDeadlinesBanner } from '../components/UpcomingDeadlinesBanner';
import { EisaSittingStatusBadge } from '../components/StatusBadge';
import { useChangeRequests, useEisaSittingBatches, useEisaSittings } from '../hooks';
import { batchDisplayStatus, isChangeRequestOpen } from '../workflow';
import type { EisaSittingBatch } from '../types';
import { BulkUploadDatesDialog } from './BulkUploadDatesDialog';
import { ProposeDatesForm } from './ProposeDatesForm';
import { ResubmitBatchDialog, type BatchDialogMode } from './ResubmitBatchDialog';

// 09-visibility-matrix.md: "My Submissions" is filtered to this QP's own proposed batches
// (qpId). Month/List View deliberately stay unfiltered — the QP needs to see the whole
// published calendar to plan around it, the matrix's one external "See all" carve-out.
// QCTO feedback 2.4: the QP proposes dates, edits their own unpublished proposals and resubmits
// a rejected batch. They never publish, postpone or cancel; on their own published sittings
// they raise a postponement or cancellation request, tracked under "My requests".
export function QpCalendarView() {
  const { person } = useV2Role();
  const { data: allBatches = [] } = useEisaSittingBatches();
  const { data: sittings = [] } = useEisaSittings();
  const { notifications, dismiss } = useNotifications('QP');
  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [batchTarget, setBatchTarget] = useState<{ batch: EisaSittingBatch; mode: BatchDialogMode } | null>(null);
  const { data: allRequests = [] } = useChangeRequests();
  const [requestTarget, setRequestTarget] = useState<ChangeRequestTarget | null>(null);
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);

  const batches = filterExternalRecords(allBatches, person, { qpIdOf: (b) => b.qpId });
  const myRequests = filterExternalRecords(allRequests, person, { qpIdOf: (r) => r.qpId });
  const openRequestSittingIds = new Set(myRequests.filter(isChangeRequestOpen).map((r) => r.sittingId));
  const openRequest = myRequests.find((r) => r.id === openRequestId) ?? null;
  const sortedBatches = [...batches].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">EISA Calendar</h2>
          <p className="text-sm text-gray-500 mt-1">
            Propose sitting dates for a qualification with accredited SDPs. To postpone or cancel one of your published sittings,
            send a request from the List View.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setBulkOpen(true)}>
            <FileSpreadsheet className="h-4 w-4" />
            Upload dates from a spreadsheet
          </Button>
          <Button className="gap-2" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Propose Sitting Dates
          </Button>
        </div>
      </div>

      <NotificationBanner notifications={notifications} onDismiss={dismiss} />
      <UpcomingDeadlinesBanner sittings={sittings} />

      <Tabs defaultValue="submissions">
        <TabsList>
          <TabsTrigger value="submissions">My Submissions</TabsTrigger>
          <TabsTrigger value="requests">My requests</TabsTrigger>
          <TabsTrigger value="month">Month View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="pt-4">
          {sortedBatches.length === 0 ? (
            <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
              <p className="text-sm text-gray-500">No sitting date submissions yet.</p>
            </div>
          ) : (
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {['Qualification', 'Year', 'Dates', 'Status', ''].map((h) => (
                        <TableHead key={h} className="whitespace-nowrap">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedBatches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="max-w-[220px] truncate font-medium">{batch.qualificationTitle}</TableCell>
                        <TableCell>{batch.year}</TableCell>
                        <TableCell>
                          <DatesWithClosing dates={batch.dates} />
                        </TableCell>
                        <TableCell>
                          <EisaSittingStatusBadge status={batchDisplayStatus(batch)} />
                          {/* Row 21 (D-08): every past rejection stays visible, not just the latest. */}
                          {batch.rejectionHistory.map((entry, i) => (
                            <p key={i} className="mt-1 text-xs text-red-600">
                              {entry.reason}
                            </p>
                          ))}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {batch.state.stageId === 'rejected' && (
                            <Button size="sm" variant="outline" onClick={() => setBatchTarget({ batch, mode: 'resubmit' })}>
                              Correct & resubmit
                            </Button>
                          )}
                          {QP_EDITABLE_BATCH_STAGES.includes(batch.state.stageId) && (
                            <Button size="sm" variant="outline" onClick={() => setBatchTarget({ batch, mode: 'edit' })}>
                              Edit dates
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="pt-4">
          <ChangeRequestsList
            requests={myRequests}
            onOpen={(r) => setOpenRequestId(r.id)}
            emptyText="No postponement or cancellation requests yet. Raise one from the List View on one of your published sittings."
          />
        </TabsContent>

        <TabsContent value="month" className="pt-4">
          <SittingMonthView sittings={sittings} />
        </TabsContent>

        <TabsContent value="list" className="pt-4">
          <SittingListView
            sittings={sittings}
            onRequestPostponement={(s) => setRequestTarget({ sitting: s, kind: 'postponement' })}
            onRequestCancellation={(s) => setRequestTarget({ sitting: s, kind: 'cancellation' })}
            canRequest={(s) => s.qpId === person.qpId}
            openRequestSittingIds={openRequestSittingIds}
          />
        </TabsContent>
      </Tabs>

      <ProposeDatesForm open={formOpen} onOpenChange={setFormOpen} />
      <BulkUploadDatesDialog open={bulkOpen} onOpenChange={setBulkOpen} />
      <ResubmitBatchDialog batch={batchTarget?.batch ?? null} mode={batchTarget?.mode} onClose={() => setBatchTarget(null)} />
      <RaiseChangeRequestDialog target={requestTarget} onClose={() => setRequestTarget(null)} />
      <ChangeRequestDetailDialog request={openRequest} onClose={() => setOpenRequestId(null)} />
    </div>
  );
}
