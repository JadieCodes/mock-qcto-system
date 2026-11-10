import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { EmptyState, SectionCard, StatTile, StatTileGrid } from '../../../shared/ui/PageSections';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { canActInStage } from '../../../shared/workflow/engine';
import { filterByScope, type ListScope } from '../../../shared/visibility/recordVisibility';
import { FISA_RESULTS_RECORD_TYPE } from '../config';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { useFisaResultsBatches } from '../hooks';
import { FISA_RESULTS_WORKFLOW, fisaThroughputRatePercent, fisaCompetencyRatePercent } from '../workflow';
import { FisaResultsBatchWorkspace } from './FisaResultsBatchWorkspace';

const PENDING_STAGES = new Set(['ad-review', 'dd-review', 'director-review', 'chief-director-review']);

// QCTO feedback 3.14: the FISA tab — results batches submitted by SDPs. A batch the SDP has not
// submitted yet is not shown to QCTO.
export function FisaResultsTab({ scope }: { scope: ListScope }) {
  const { role, person } = useV2Role();
  const { data: allBatches = [] } = useFisaResultsBatches();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const submitted = allBatches.filter((b) => b.workflow.stageId !== 'sdp-draft');
  const batches = filterByScope(
    submitted,
    scope,
    person.id,
    (b) => [b.workflow.submittedById],
    (b) => canActInStage(FISA_RESULTS_WORKFLOW, b.workflow.stageId, role),
  );

  const pending = batches.filter((b) => PENDING_STAGES.has(b.workflow.stageId));
  const approved = batches.filter((b) => b.workflow.stageId === 'approved');
  const moreEvidence = batches.filter((b) => b.workflow.stageId === 'more-evidence');
  const declined = batches.filter((b) => b.workflow.stageId === 'declined');

  return (
    <div className="space-y-6">
      <StatTileGrid className="md:grid-cols-5">
        <StatTile label="Total Batches" value={batches.length} />
        <StatTile label="Pending Review" value={pending.length} />
        <StatTile label="Approved" value={approved.length} />
        <StatTile label="More Evidence Requested" value={moreEvidence.length} />
        <StatTile label="Declined" value={declined.length} />
      </StatTileGrid>

      <SectionCard title="All FISA Results Batches">
        {batches.length === 0 ? (
          <EmptyState title="No FISA results batches" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Skills Programme', 'SDP', 'Learners', 'Competency Rate', 'Throughput Rate', 'Status', 'Submitted'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(b.id)}>
                    <TableCell className="max-w-[220px] truncate">{b.skillsProgrammeTitle}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{b.sdpName}</TableCell>
                    <TableCell>{b.learnerResults.length}</TableCell>
                    <TableCell>{fisaCompetencyRatePercent(b)}%</TableCell>
                    <TableCell>{fisaThroughputRatePercent(b)}%</TableCell>
                    <TableCell>
                      <ResultsBatchStatusBadge batch={b} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{b.submittedAt?.slice(0, 10) ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Recent Activity">
        <div className="p-4 max-h-80 overflow-y-auto">
          <AuditTrailView recordTypes={[FISA_RESULTS_RECORD_TYPE]} />
        </div>
      </SectionCard>

      <FisaResultsBatchWorkspace batchId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
