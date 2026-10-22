import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { LABELS } from '../../../config/labels';
import { ScopeToggle } from '../../../shared/ui/ScopeToggle';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterByScope, type ListScope } from '../../../shared/visibility/recordVisibility';
import { SiteVisitStatusBadge } from '../components/StatusBadge';
import { useSiteVisits } from '../hooks';
import { VISIT_TYPE_LABELS, VISIT_TYPE_OPTIONS } from '../visitTypeLabels';
import { NewVisitDialog } from './NewVisitDialog';
import { VisitWorkspace } from './VisitWorkspace';
import type { SiteVisit } from '../types';

function myItemIds(v: SiteVisit): (string | null | undefined)[] {
  return [v.planningWorkflow.submittedById, v.reportWorkflow.submittedById, v.reroutedToId];
}

const REPORT_RECEIVED_STAGES = new Set(['approved', 'outcome-shared', 'closed']);
const PLANNING_PENDING_STAGES = new Set(['ad-planning', 'dd-recommend', 'domain-director-approval', 'sda-booking']);

function VisitsTable({ visits, onSelect }: { visits: SiteVisit[]; onSelect: (id: string) => void }) {
  if (visits.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-medium text-gray-500">No visits</p>
      </div>
    );
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
  const { person } = useV2Role();
  const { data: allVisits = [] } = useSiteVisits();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [scope, setScope] = useState<ListScope>('mine');
  const visits = filterByScope(allVisits, scope, person.id, myItemIds);

  const pendingPlanning = visits.filter((v) => PLANNING_PENDING_STAGES.has(v.planningWorkflow.stageId));
  // CR-045: "Reports Received" replaces "Results Received"; there is no "Schedules Received" metric.
  const reportsReceived = visits.filter((v) => REPORT_RECEIVED_STAGES.has(v.reportWorkflow.stageId));
  const awaitingReport = visits.filter((v) => v.planningWorkflow.stageId === 'booked' && !REPORT_RECEIVED_STAGES.has(v.reportWorkflow.stageId) && v.reportWorkflow.stageId !== 'rejected');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Site Visits &amp; Monitoring</h2>
          <p className="text-sm text-gray-500 mt-1">
            A standalone hub (CR-044) — every visit type is scheduled here, independently of the registration pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ScopeToggle scope={scope} onChange={setScope} />
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Plan a New Visit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="visits">All Visits</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 pt-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: 'Total Visits', value: visits.length },
              { label: 'Pending Planning', value: pendingPlanning.length },
              { label: 'Awaiting Report', value: awaitingReport.length },
              { label: LABELS.reportsReceived, value: reportsReceived.length },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/80">
              <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto">
              <AuditTrailView recordTypes={['site-visit-planning', 'site-visit-report']} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scheduling" className="pt-4">
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/80">
              <h3 className="text-base font-semibold text-gray-900">Scheduling — visits still in the planning chain</h3>
            </div>
            <VisitsTable visits={pendingPlanning} onSelect={setSelectedId} />
          </div>
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
