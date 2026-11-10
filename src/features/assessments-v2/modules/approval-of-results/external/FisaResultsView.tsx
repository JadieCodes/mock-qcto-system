import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LABELS } from '../../../config/labels';
import { EmptyState, SectionCard } from '../../../shared/ui/PageSections';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterExternalRecords } from '../../../shared/visibility/recordVisibility';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { useFisaResultsBatches } from '../hooks';
import { fisaCompetencyRatePercent, fisaThroughputRatePercent } from '../workflow';
import type { FisaResultsBatch } from '../types';
import { FisaResultsBatchDetail } from './FisaResultsBatchDetail';
import { NewFisaResultsBatchDialog } from './NewFisaResultsBatchDialog';

function BatchTable({ batches, onSelect, showRate }: { batches: FisaResultsBatch[]; onSelect: (id: string) => void; showRate: boolean }) {
  const headers = ['Skills Programme', 'Learners', ...(showRate ? ['Competency Rate', 'Throughput Rate'] : []), 'Status', showRate ? 'Submitted' : 'Created'];
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h) => (
              <TableHead key={h} className="whitespace-nowrap">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((b) => (
            <TableRow key={b.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelect(b.id)}>
              <TableCell className="max-w-[240px] truncate">{b.skillsProgrammeTitle}</TableCell>
              <TableCell>{b.learnerResults.length}</TableCell>
              {showRate && <TableCell>{fisaCompetencyRatePercent(b)}%</TableCell>}
              {showRate && <TableCell>{fisaThroughputRatePercent(b)}%</TableCell>}
              <TableCell>
                <ResultsBatchStatusBadge batch={b} />
              </TableCell>
              <TableCell className="whitespace-nowrap">{(showRate ? b.submittedAt : b.createdAt)?.slice(0, 10) ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// QCTO feedback 3.14: FISA is decentralised — the SDP conducts the assessment and submits the
// results batch. The SDP sees only its own batches (sdpId).
export function FisaResultsView() {
  const { person } = useV2Role();
  const { data: allBatches = [] } = useFisaResultsBatches();
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const myBatches = filterExternalRecords(allBatches, person, { sdpIdOf: (b) => b.sdpId });
  const drafts = myBatches.filter((b) => b.workflow.stageId === 'sdp-draft');
  const submitted = myBatches.filter((b) => b.workflow.stageId !== 'sdp-draft');

  return (
    <div className="space-y-6">
      {/* Batch N.1: the matching card to the one in the FISA section. */}
      <SectionCard>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-700">{LABELS.fisaSignpostResults}</p>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link to="../fisa">{LABELS.fisaSignpostResultsButton}</Link>
          </Button>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" />
          New Results Batch
        </Button>
      </div>

      <SectionCard title="Awaiting Submission">
        {drafts.length === 0 ? (
          <EmptyState title="Nothing awaiting submission." />
        ) : (
          <BatchTable batches={drafts} onSelect={setSelectedId} showRate={false} />
        )}
      </SectionCard>

      <SectionCard title="My Submitted Batches">
        {submitted.length === 0 ? (
          <EmptyState title="No batches submitted yet." />
        ) : (
          <BatchTable batches={submitted} onSelect={setSelectedId} showRate />
        )}
      </SectionCard>

      <NewFisaResultsBatchDialog open={newOpen} onOpenChange={setNewOpen} onCreated={setSelectedId} />
      <FisaResultsBatchDetail batchId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
