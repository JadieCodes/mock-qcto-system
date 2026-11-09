import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { VISIT_DOMAIN_LABELS, VISIT_DOMAIN_OPTIONS, visitDomainOf } from '../visitDomains';
import { REMEDIATION_AWAITING_STAGE } from '../remediation';
import { qualificationDisplay, VISIT_TYPE_LABELS, VISIT_TYPE_OPTIONS, visitHasQp, visitIsMeeting, visitPartyName, visitSubject } from '../visitTypeLabels';
import { PLANNING_WORKFLOW, REPORT_WORKFLOW } from '../workflow';
import { NewVisitDialog } from './NewVisitDialog';
import { VisitWorkspace } from './VisitWorkspace';
import type { SiteVisit, VisitDomain } from '../types';

const ALL_DOMAINS = 'all';

function myItemIds(v: SiteVisit): (string | null | undefined)[] {
  return [v.planningWorkflow.submittedById, v.reportWorkflow.submittedById, v.reroutedToId];
}

// A brand-new plan/report nobody has personally touched yet still belongs under "My items" for
// whichever role can act on its current stage (09-visibility-matrix.md "Approved corrections").
// CR-055: a report re-routed to a specific Deputy Director belongs to that person only — it
// must not also show as an unassigned item for every other Deputy Director.
// Every visit is created with its report at `awaiting-execution`, so the report stage only
// counts once the visit is booked (the Execution & Report tab is closed until then).
function isUnassignedActionable(v: SiteVisit, role: Role, personId: string): boolean {
  if (canActInStage(PLANNING_WORKFLOW, v.planningWorkflow.stageId, role)) return true;
  // Batch V1: only the ASD of a visit without a QP records the remediation response; the QP does it themselves.
  if (v.planningWorkflow.stageId === 'booked' && v.reportWorkflow.stageId === REMEDIATION_AWAITING_STAGE) {
    return role === 'ASD' && !visitHasQp(v.visitType);
  }
  if (v.planningWorkflow.stageId === 'booked' && canActInStage(REPORT_WORKFLOW, v.reportWorkflow.stageId, role)) {
    return !v.reroutedToId || v.reroutedToId === personId;
  }
  return false;
}

const REPORT_RECEIVED_STAGES = new Set(['approved', 'remediation-awaiting', 'remediation-review', 'outcome-shared', 'closed']);
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
            {['Type', 'Domain', 'Qualification', 'QP / SDP or Centre', 'Visit Date', 'Status', ''].map((h) => (
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
              <TableCell className="whitespace-nowrap">{VISIT_DOMAIN_LABELS[visitDomainOf(v)]}</TableCell>
              <TableCell className="max-w-[200px] truncate">{visitIsMeeting(v.visitType) ? visitSubject(v) : qualificationDisplay(v)}</TableCell>
              <TableCell className="max-w-[160px] truncate">{visitPartyName(v)}</TableCell>
              <TableCell className="whitespace-nowrap">{v.visitDate || 'To be scheduled'}</TableCell>
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
  // QCTO feedback 2.8: Approval of Results links straight to a visit with ?visit=<id>.
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('visit'));
  const closeVisit = () => {
    setSelectedId(null);
    if (searchParams.has('visit')) setSearchParams({}, { replace: true });
  };
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [scope, setScope] = useState<ListScope>('mine');
  const [domainFilter, setDomainFilter] = useState<VisitDomain | typeof ALL_DOMAINS>(ALL_DOMAINS);
  const visits = filterByScope(allVisits, scope, person.id, myItemIds, (v) => isUnassignedActionable(v, role, person.id));
  const listedVisits = domainFilter === ALL_DOMAINS ? visits : visits.filter((v) => visitDomainOf(v) === domainFilter);

  const pendingPlanning = visits.filter((v) => PLANNING_PENDING_STAGES.has(v.planningWorkflow.stageId));
  // CR-045: "Reports Received" replaces "Results Received"; there is no "Schedules Received" metric.
  const reportsReceived = visits.filter((v) => REPORT_RECEIVED_STAGES.has(v.reportWorkflow.stageId));
  const awaitingReport = visits.filter((v) => v.planningWorkflow.stageId === 'booked' && !REPORT_RECEIVED_STAGES.has(v.reportWorkflow.stageId) && v.reportWorkflow.stageId !== 'rejected');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Visits & Monitoring"
        description="Plan, conduct and report on site visits and meetings, for every visit type and domain."
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

        <TabsContent value="visits" className="pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="visit-domain-filter" className="text-sm text-gray-600 whitespace-nowrap">
              Domain
            </Label>
            <Select value={domainFilter} onValueChange={(v) => setDomainFilter(v as VisitDomain | typeof ALL_DOMAINS)}>
              <SelectTrigger id="visit-domain-filter" className="w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_DOMAINS}>All domains</SelectItem>
                {VISIT_DOMAIN_OPTIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {VISIT_DOMAIN_LABELS[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Tabs defaultValue="all">
            <TabsList className="h-auto flex-wrap justify-start">
              <TabsTrigger value="all">All</TabsTrigger>
              {VISIT_TYPE_OPTIONS.map((o) => (
                <TabsTrigger key={o.value} value={o.value}>
                  {o.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="all" className="pt-4">
              <VisitsTable visits={listedVisits} onSelect={setSelectedId} />
            </TabsContent>
            {VISIT_TYPE_OPTIONS.map((o) => (
              <TabsContent key={o.value} value={o.value} className="pt-4">
                <VisitsTable visits={listedVisits.filter((v) => v.visitType === o.value)} onSelect={setSelectedId} />
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>
      </Tabs>

      <NewVisitDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
      <VisitWorkspace visitId={selectedId} onClose={closeVisit} />
    </div>
  );
}
