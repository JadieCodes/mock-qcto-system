import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { useResultsBatches } from '../hooks';
import { competencyRatePercent } from '../workflow';
import { ResultsBatchWorkspace } from './ResultsBatchWorkspace';
import type { ResultsBatch } from '../types';

const PENDING_STAGES = new Set(['ad-review', 'dd-review', 'director-review', 'chief-director-review']);

function BatchesTable({ batches, onSelect }: { batches: ResultsBatch[]; onSelect: (id: string) => void }) {
  if (batches.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-medium text-gray-500">No results batches</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {['Qualification', 'QP', 'Sitting Date', 'Competency Rate', 'Status', 'Submission'].map((h) => (
              <TableHead key={h} className="whitespace-nowrap">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((b) => (
            <TableRow key={b.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelect(b.id)}>
              <TableCell className="max-w-[200px] truncate">{b.qualificationTitle}</TableCell>
              <TableCell className="max-w-[160px] truncate">{b.qpName}</TableCell>
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
  );
}

// CR-059/CR-060: "Approval of Results" is a brand-new module name — CR-060 is satisfied by
// construction, since this name was never used for anything else anywhere in v2's nav
// (config/nav.ts), only placeholders flagged for Phase 6 (see progress.md).
export function InternalDashboard() {
  const { data: batches = [] } = useResultsBatches();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const pending = batches.filter((b) => PENDING_STAGES.has(b.workflow.stageId));
  const approved = batches.filter((b) => b.workflow.stageId === 'approved');
  const declined = batches.filter((b) => b.workflow.stageId === 'declined');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Approval of Results</h2>
        <p className="text-sm text-gray-500 mt-1">
          QP results-batch submissions, checked through Assistant Director → Deputy Director → Director → Chief Director (CR-059).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Batches', value: batches.length },
          { label: 'Pending Review', value: pending.length },
          { label: 'Approved', value: approved.length },
          { label: 'Declined', value: declined.length },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold text-gray-900">All Results Batches</h3>
        </div>
        <BatchesTable batches={batches} onSelect={setSelectedId} />
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          <AuditTrailView recordTypes={['results-batch']} />
        </div>
      </div>

      <ResultsBatchWorkspace batchId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
