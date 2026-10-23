import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Role } from '../../../types';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { EmptyState, SectionCard, StatTile, StatTileGrid } from '../../../shared/ui/PageSections';
import { ScopeToggle } from '../../../shared/ui/ScopeToggle';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { canActInStage } from '../../../shared/workflow/engine';
import { filterByScope, type ListScope } from '../../../shared/visibility/recordVisibility';
import { InstrumentValidationStatusBadge } from '../components/StatusBadge';
import { useInstrumentValidationRecords } from '../hooks';
import type { InstrumentValidationRecord } from '../types';
import { SCHEDULING_WORKFLOW, VALIDATION_WORKFLOW } from '../workflow';
import { StatusDashboard } from './StatusDashboard';
import { ValidationWorkspace } from './ValidationWorkspace';

function myItemIds(record: InstrumentValidationRecord): (string | null | undefined)[] {
  return [record.scheduling.workflow.submittedById, record.validationWorkflow.submittedById];
}

// A brand-new submission nobody has personally touched yet still belongs under "My items" for
// whichever role can act on its current stage (09-visibility-matrix.md "Approved corrections").
function isUnassignedActionable(record: InstrumentValidationRecord, role: Role): boolean {
  return (
    canActInStage(SCHEDULING_WORKFLOW, record.scheduling.workflow.stageId, role) ||
    canActInStage(VALIDATION_WORKFLOW, record.validationWorkflow.stageId, role)
  );
}

// CR-018/CR-019: a section separate from EISA Registration. SDPs cannot see this at all —
// blocked at the route level (see shared/ui/RoleBlocked.tsx wired in index.tsx), not just
// hidden from this screen.
export function InternalDashboard() {
  const { role, person } = useV2Role();
  const { data: allRecords = [] } = useInstrumentValidationRecords();
  const [scope, setScope] = useState<ListScope>('mine');
  const records = filterByScope(allRecords, scope, person.id, myItemIds, (r) => isUnassignedActionable(r, role));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const schedulingCount = records.filter((r) => r.scheduling.workflow.stageId !== 'agreed').length;
  const withAsdCount = records.filter(
    (r) => r.scheduling.workflow.stageId === 'agreed' && r.validationWorkflow.stageId === 'asd-validation',
  ).length;
  const validatedCount = records.filter((r) => r.instrumentStatus === 'validated').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="EISA Instrument Validation — Instrument Validation Team"
        description="An ASD checks the QP's assessment instrument against the checklist before an EISA sitting — a separate section from EISA Registration; SDPs cannot see this section."
        actions={<ScopeToggle scope={scope} onChange={setScope} />}
      />

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">My Queue</TabsTrigger>
          <TabsTrigger value="status-dashboard">Status Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-6">
          <StatTileGrid className="md:grid-cols-3">
            <StatTile label="Scheduling in progress" value={schedulingCount} />
            <StatTile label="With ASD" value={withAsdCount} />
            <StatTile label="Validated" value={validatedCount} />
          </StatTileGrid>

          <SectionCard title="Validations">
            {records.length === 0 ? (
              <EmptyState title="No validations yet" description="Validations started by a QP in the external portal will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {['QP', 'Qualification Title', 'Status', ''].map((h) => (
                        <TableHead key={h} className="whitespace-nowrap">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(record.id)}>
                        <TableCell className="font-semibold whitespace-nowrap">{record.qpName}</TableCell>
                        <TableCell className="max-w-[220px] truncate">{record.qualificationTitle}</TableCell>
                        <TableCell>
                          <InstrumentValidationStatusBadge record={record} />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(record.id);
                            }}
                          >
                            Open
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="status-dashboard">
          <StatusDashboard />
        </TabsContent>
      </Tabs>

      <ValidationWorkspace recordId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
