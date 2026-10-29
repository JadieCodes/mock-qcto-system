import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import type { Role } from '../../../types';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { EmptyState, SectionCard, StatTile, StatTileGrid } from '../../../shared/ui/PageSections';
import { ScopeToggle } from '../../../shared/ui/ScopeToggle';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { canActInStage } from '../../../shared/workflow/engine';
import { filterByScope, type ListScope } from '../../../shared/visibility/recordVisibility';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { useResultsBatches } from '../hooks';
import { competencyRatePercent, RESULTS_WORKFLOW } from '../workflow';
import { ResultsBatchWorkspace } from './ResultsBatchWorkspace';
import type { ResultsBatch } from '../types';

// A brand-new submission nobody has personally touched yet still belongs under "My items" for
// whichever role can act on its current stage (09-visibility-matrix.md "Approved corrections").
function isUnassignedActionable(b: ResultsBatch, role: Role): boolean {
  return canActInStage(RESULTS_WORKFLOW, b.workflow.stageId, role);
}

const PENDING_STAGES = new Set(['ad-review', 'dd-review', 'director-review', 'chief-director-review']);

function BatchesTable({ batches, onSelect }: { batches: ResultsBatch[]; onSelect: (id: string) => void }) {
  if (batches.length === 0) {
    return <EmptyState title="No results batches" />;
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
  const { role, person } = useV2Role();
  const { data: allBatches = [] } = useResultsBatches();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scope, setScope] = useState<ListScope>('mine');
  const batches = filterByScope(allBatches, scope, person.id, (b) => [b.workflow.submittedById], (b) => isUnassignedActionable(b, role));

  const pending = batches.filter((b) => PENDING_STAGES.has(b.workflow.stageId));
  const approved = batches.filter((b) => b.workflow.stageId === 'approved');
  const declined = batches.filter((b) => b.workflow.stageId === 'declined');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval of Results"
        description="QP results-batch submissions, checked through Assistant Director → Deputy Director → Director → Chief Director."
        actions={<ScopeToggle scope={scope} onChange={setScope} />}
      />

      <StatTileGrid>
        <StatTile label="Total Batches" value={batches.length} />
        <StatTile label="Pending Review" value={pending.length} />
        <StatTile label="Approved" value={approved.length} />
        <StatTile label="Declined" value={declined.length} />
      </StatTileGrid>

      <SectionCard title="All Results Batches">
        <BatchesTable batches={batches} onSelect={setSelectedId} />
      </SectionCard>

      <SectionCard title="Recent Activity">
        <div className="p-4 max-h-80 overflow-y-auto">
          <AuditTrailView recordTypes={['results-batch']} />
        </div>
      </SectionCard>

      <ResultsBatchWorkspace batchId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
