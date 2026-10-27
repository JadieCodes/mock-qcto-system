import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { LABELS } from '../../../config/labels';
import type { Role } from '../../../types';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { EmptyState, SectionCard, StatTile, StatTileGrid } from '../../../shared/ui/PageSections';
import { ScopeToggle } from '../../../shared/ui/ScopeToggle';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { canActInStage } from '../../../shared/workflow/engine';
import { filterByScope, type ListScope } from '../../../shared/visibility/recordVisibility';
import { SiteVisitStatusBadge } from '../components/StatusBadge';
import { useSiteVisits } from '../hooks';
import { VISIT_TYPE_LABELS, VISIT_TYPE_OPTIONS } from '../visitTypeLabels';
import { PLANNING_WORKFLOW, REPORT_WORKFLOW } from '../workflow';
import { NewVisitDialog } from './NewVisitDialog';
import { VisitWorkspace } from './VisitWorkspace';
import type { SiteVisit } from '../types';

function myItemIds(v: SiteVisit): (string | null | undefined)[] {
  return [v.planningWorkflow.submittedById, v.reportWorkflow.submittedById, v.reroutedToId];
}

// A brand-new plan/report nobody has personally touched yet still belongs under "My items" for
// whichever role can act on its current stage (09-visibility-matrix.md "Approved corrections").
// CR-055: a report re-routed to a specific Deputy Director belongs to that person only — it
// must not also show as an unassigned item for every other Deputy Director.
function isUnassignedActionable(v: SiteVisit, role: Role, personId: string): boolean {
  if (canActInStage(PLANNING_WORKFLOW, v.planningWorkflow.stageId, role)) return true;
  if (canActInStage(REPORT_WORKFLOW, v.reportWorkflow.stageId, role)) {
    return !v.reroutedToId || v.reroutedToId === personId;
  }
  return false;
}

const REPORT_RECEIVED_STAGES = new Set(['approved', 'outcome-shared', 'closed']);
const PLANNING_PENDING_STAGES = new Set(['ad-planning', 'dd-recommend', 'domain-director-approval', 'sda-booking']);

function VisitsTable({ visits, onSelect }: { visits: SiteVisit[]; onSelect: (id: string) => void }) {
  if (visits.length === 0) {
    return <EmptyState title="No visits" />;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {['Type', 'Qualification', 'QP', 'Visit Date', 'Status', ''].map((h) => (
              <TableHead key={h} className="whitespace-nowrap">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visits.map((v) => (
            <TableRow key={v.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelect(v.id)}>
              <TableCell className="whitespace-nowrap">{VISIT_TYPE_LABELS[v.visitType]}</TableCell>
              <TableCell className="max-w-[200px] truncate">{v.qualificationTitle}</TableCell>
              <TableCell className="max-w-[160px] truncate">{v.qpName}</TableCell>
              <TableCell className="whitespace-nowrap">{v.visitDate}</TableCell>
              <TableCell>
                <SiteVisitStatusBadge visit={v} />
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onSelect(v.id); }}>
                  Open
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function InternalDashboard() {
  const { role, person } = useV2Role();
  const { data: allVisits = [] } = useSiteVisits();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [scope, setScope] = useState<ListScope>('mine');
  const visits = filterByScope(allVisits, scope, person.id, myItemIds, (v) => isUnassignedActionable(v, role, person.id));

  const pendingPlanning = visits.filter((v) => PLANNING_PENDING_STAGES.has(v.planningWorkflow.stageId));
  // CR-045: "Reports Received" replaces "Results Received"; there is no "Schedules Received" metric.
  const reportsReceived = visits.filter((v) => REPORT_RECEIVED_STAGES.has(v.reportWorkflow.stageId));
  const awaitingReport = visits.filter((v) => v.planningWorkflow.stageId === 'booked' && !REPORT_RECEIVED_STAGES.has(v.reportWorkflow.stageId) && v.reportWorkflow.stageId !== 'rejected');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Visits & Monitoring"
        description="A standalone hub for EISA Readiness, Marking & Moderation, RPL/ARPL Monitoring and Post-EISA Monitoring visits — an RPL/ARPL monitoring item is created automatically from a registration, never from EISA Confirmation."
        actions={
          <>
            <ScopeToggle scope={scope} onChange={setScope} />
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Plan a New Visit
            </Button>
          </>
        }
      />

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="visits">All Visits</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 pt-4">
          <StatTileGrid>
            <StatTile label="Total Visits" value={visits.length} />
            <StatTile label="Pending Planning" value={pendingPlanning.length} />
            <StatTile label="Awaiting Report" value={awaitingReport.length} />
            <StatTile label={LABELS.reportsReceived} value={reportsReceived.length} />
          </StatTileGrid>
          <SectionCard title="Recent Activity">
            <div className="p-4 max-h-80 overflow-y-auto">
              <AuditTrailView recordTypes={['site-visit-planning', 'site-visit-report']} />
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="scheduling" className="pt-4">
          <SectionCard title="Scheduling — visits still in the planning chain">
            <VisitsTable visits={pendingPlanning} onSelect={setSelectedId} />
          </SectionCard>
        </TabsContent>

        <TabsContent value="visits" className="pt-4">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              {VISIT_TYPE_OPTIONS.map((o) => (
                <TabsTrigger key={o.value} value={o.value}>
                  {o.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="all" className="pt-4">
              <VisitsTable visits={visits} onSelect={setSelectedId} />
            </TabsContent>
            {VISIT_TYPE_OPTIONS.map((o) => (
              <TabsContent key={o.value} value={o.value} className="pt-4">
                <VisitsTable visits={visits.filter((v) => v.visitType === o.value)} onSelect={setSelectedId} />
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      </Tabs>

      <NewVisitDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
      <VisitWorkspace visitId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
