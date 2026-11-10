import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import type { Role } from '../../../types';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { EmptyState, SectionCard, StatTile, StatTileGrid } from '../../../shared/ui/PageSections';
import { ScopeToggle } from '../../../shared/ui/ScopeToggle';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { canActInStage } from '../../../shared/workflow/engine';
import { filterByScope, type ListScope } from '../../../shared/visibility/recordVisibility';
import { EISA_RESULTS_RECORD_TYPE } from '../config';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { TrackingRegisterDownload } from '../components/TrackingRegisterDownload';
import { eisaRegisterCsv } from '../trackingRegister';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { useResultsBatches } from '../hooks';
import { absenteeismText, batchFiguresOf, competenceRateText, throughputRateText } from '../calculation';
import { RESULTS_WORKFLOW } from '../workflow';
import { FisaResultsTab } from './FisaResultsTab';
import { ResultsBatchWorkspace } from './ResultsBatchWorkspace';
import { SentToCertificationTab } from './SentToCertificationTab';
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
            {/* QCTO feedback 29.31/29.32: EISA date, and the rate (competent ÷ wrote) with absenteeism. */}
            {['Qualification', 'QP', 'EISA Date', 'Competency Rate', 'Absent', 'Throughput Rate', 'Status', 'Submission'].map((h) => (
              <TableHead key={h} className="whitespace-nowrap">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((b) => {
            const figures = batchFiguresOf(b);
            return (
              <TableRow key={b.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelect(b.id)}>
                <TableCell className="max-w-[200px] truncate">{b.qualificationTitle}</TableCell>
                <TableCell className="max-w-[160px] truncate">{b.qpName}</TableCell>
                <TableCell className="whitespace-nowrap">{b.sittingDate}</TableCell>
                <TableCell className="whitespace-nowrap">{competenceRateText(figures)}</TableCell>
                <TableCell className="whitespace-nowrap">{absenteeismText(figures)}</TableCell>
                <TableCell className="whitespace-nowrap">{throughputRateText(figures)}</TableCell>
                <TableCell>
                  <ResultsBatchStatusBadge batch={b} />
                </TableCell>
                <TableCell>
                  <DeadlineBadge deadline={b.submissionDeadline} submittedAt={b.submittedAt} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// The EISA tab: the QP's results batches, as before QCTO feedback 3.14.
function EisaResultsTab({ scope }: { scope: ListScope }) {
  const { role, person } = useV2Role();
  const { data: allBatches = [] } = useResultsBatches();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const batches = filterByScope(allBatches, scope, person.id, (b) => [b.workflow.submittedById], (b) => isUnassignedActionable(b, role));

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

      {/* Batch N2: the register covers every approved batch, whatever the My items / All filter shows. */}
      <TrackingRegisterDownload fileNamePrefix="Tracking_Register_EISA" build={(from, to) => eisaRegisterCsv(allBatches, from, to)} />

      <SectionCard title="All Results Batches">
        <BatchesTable batches={batches} onSelect={setSelectedId} />
      </SectionCard>

      <SectionCard title="Recent Activity">
        <div className="p-4 max-h-80 overflow-y-auto">
          <AuditTrailView recordTypes={[EISA_RESULTS_RECORD_TYPE]} />
        </div>
      </SectionCard>

      <ResultsBatchWorkspace batchId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

// CR-059/CR-060: "Approval of Results" is a brand-new module name — CR-060 is satisfied by
// construction, since this name was never used for anything else anywhere in v2's nav
// (config/nav.ts), only placeholders flagged for Phase 6 (see progress.md).
// QCTO feedback 3.14: an EISA tab and a FISA tab, both through the same internal chain.
export function InternalDashboard() {
  const [scope, setScope] = useState<ListScope>('mine');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval of Results"
        description="EISA results from the QP and FISA results from the SDP, checked through ASD → Deputy Director → Director → Chief Director."
        actions={<ScopeToggle scope={scope} onChange={setScope} />}
      />
      <Tabs defaultValue="eisa">
        <TabsList>
          <TabsTrigger value="eisa">EISA</TabsTrigger>
          <TabsTrigger value="fisa">FISA</TabsTrigger>
          <TabsTrigger value="certification">Sent to Certification</TabsTrigger>
        </TabsList>
        <TabsContent value="eisa" className="pt-4">
          <EisaResultsTab scope={scope} />
        </TabsContent>
        <TabsContent value="fisa" className="pt-4">
          <FisaResultsTab scope={scope} />
        </TabsContent>
        <TabsContent value="certification" className="pt-4">
          <SentToCertificationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
