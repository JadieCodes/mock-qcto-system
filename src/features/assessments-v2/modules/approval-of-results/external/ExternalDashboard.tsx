import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { EmptyState, SectionCard } from '../../../shared/ui/PageSections';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterExternalRecords } from '../../../shared/visibility/recordVisibility';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { useResultsBatches, useSittingsAwaitingSubmission } from '../hooks';
import { competencyRatePercent, submissionDeadlineFor } from '../workflow';
import { ResultsBatchDetail } from './ResultsBatchDetail';
import { SubmitResultsBatchDialog } from './SubmitResultsBatchDialog';

// CR-059: the QP submits a results batch within 21 working days of the sitting — matched
// against the acting QP's identity.
function QpResultsView() {
  const { person } = useV2Role();
  const { data: awaiting = [] } = useSittingsAwaitingSubmission();
  const { data: batches = [] } = useResultsBatches();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitSittingId, setSubmitSittingId] = useState<string | null>(null);

  const myAwaiting = filterExternalRecords(awaiting, person, { qpIdOf: (a) => a.qpId });
  const myBatches = filterExternalRecords(batches, person, { qpIdOf: (b) => b.qpId });

  return (
    <div className="space-y-6">
      <PageHeader title="Approval of Results" description="Submit your exam results batch within 21 working days of the sitting (CR-059)." />

      <SectionCard title="Awaiting Submission">
        {myAwaiting.length === 0 ? (
          <EmptyState title="Nothing awaiting submission." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification', 'Sitting Date', 'Learners', 'Deadline', ''].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAwaiting.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="max-w-[200px] truncate">{a.qualificationTitle}</TableCell>
                    <TableCell className="whitespace-nowrap">{a.sittingDate}</TableCell>
                    <TableCell>{a.learners.length}</TableCell>
                    <TableCell>
                      <DeadlineBadge deadline={submissionDeadlineFor(a.sittingDate)} />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => setSubmitSittingId(a.sittingId)}>
                        Submit Results
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="My Submitted Batches">
        {myBatches.length === 0 ? (
          <EmptyState title="No batches submitted yet." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification', 'Sitting Date', 'Competency Rate', 'Status', 'Submission'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {myBatches.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(b.id)}>
                    <TableCell className="max-w-[200px] truncate">{b.qualificationTitle}</TableCell>
                    <TableCell className="whitespace-nowrap">{b.sittingDate}</TableCell>
                    <TableCell>{competencyRatePercent(b)}%</TableCell>
                    <TableCell>
                      <ResultsBatchStatusBadge batch={b} />
                    </TableCell>
                    <TableCell>
                      <DeadlineBadge deadline={b.submissionDeadline} submittedAt={b.submittedAt} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <SubmitResultsBatchDialog sittingId={submitSittingId} onOpenChange={(open) => !open && setSubmitSittingId(null)} />
      <ResultsBatchDetail batchId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

// SDP is not named for this module (register's "Who's involved" list is QP, Assistant
// Director, Deputy Director, Director, Chief Director) — shown the same informational card
// pattern used by Site Visits for the roles a module doesn't involve.
function NotApplicableView() {
  return (
    <div className="space-y-6">
      <PageHeader title="Approval of Results" />
      <SectionCard>
        <EmptyState
          title="Not applicable for this role"
          description="Only the QP submits results batches here. QCTO reviews them on the internal portal."
        />
      </SectionCard>
    </div>
  );
}

export function ExternalDashboard() {
  const { role } = useV2Role();
  return role === 'QP' ? <QpResultsView /> : <NotApplicableView />;
}
