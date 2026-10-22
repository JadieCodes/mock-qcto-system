import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Role } from '../../../types';
import { ScopeToggle } from '../../../shared/ui/ScopeToggle';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { canActInStage } from '../../../shared/workflow/engine';
import { filterByScope, type ListScope } from '../../../shared/visibility/recordVisibility';
import { RegistrationStatusBadge } from '../components/StatusBadge';
import { useRegistrationRecords } from '../hooks';
import { REGISTRATION_WORKFLOW } from '../workflow';
import { RegistrationWorkspace } from './RegistrationWorkspace';
import type { EisaRegistrationRecord } from '../types';

// A brand-new submission nobody has personally touched yet still belongs under "My items" for
// whichever role can act on its current stage (09-visibility-matrix.md "Approved corrections").
function isUnassignedActionable(record: EisaRegistrationRecord, role: Role): boolean {
  return canActInStage(REGISTRATION_WORKFLOW, record.workflow.stageId, role);
}

// CR-019/CR-035: its own section, separate from EISA Instrument Validation. CR: category split
// into Trades / Non-Trades tabs for the Assistant Director's queue.
function RecordsTable({ records, onSelect }: { records: EisaRegistrationRecord[]; onSelect: (id: string) => void }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-medium text-gray-500">No registrations yet</p>
        <p className="text-sm text-gray-400 mt-1">Registrations submitted by an SDP will appear here.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {['SDP', 'Qualification', 'Sitting Date', 'Learners', 'Status', ''].map((h) => (
              <TableHead key={h} className="whitespace-nowrap">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelect(record.id)}>
              <TableCell className="font-semibold whitespace-nowrap">{record.sdpName}</TableCell>
              <TableCell className="max-w-[200px] truncate">{record.qualificationTitle}</TableCell>
              <TableCell className="whitespace-nowrap">{record.sittingDate}</TableCell>
              <TableCell>{record.learners.length}</TableCell>
              <TableCell>
                <RegistrationStatusBadge record={record} />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(record.id);
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
  );
}

export function InternalDashboard() {
  const { role, person } = useV2Role();
  const { data: allRecords = [] } = useRegistrationRecords();
  const [scope, setScope] = useState<ListScope>('mine');
  const records = filterByScope(allRecords, scope, person.id, (r) => [r.workflow.submittedById], (r) => isUnassignedActionable(r, role));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const trades = records.filter((r) => r.category === 'trades');
  const nonTrades = records.filter((r) => r.category === 'non-trades');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">EISA Registration — Registration Team</h2>
          <p className="text-sm text-gray-500 mt-1">A separate section from EISA Instrument Validation. Split by category.</p>
        </div>
        <ScopeToggle scope={scope} onChange={setScope} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'With SDP', value: records.filter((r) => r.workflow.stageId === 'sdp-submission').length },
          { label: 'With Assistant Director', value: records.filter((r) => r.workflow.stageId === 'ad-review').length },
          { label: 'Registered', value: records.filter((r) => r.workflow.stageId === 'registered').length },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold text-gray-900">Registrations</h3>
        </div>
        <Tabs defaultValue="trades">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="trades">Trades ({trades.length})</TabsTrigger>
            <TabsTrigger value="non-trades">Non-Trades ({nonTrades.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="trades">
            <RecordsTable records={trades} onSelect={setSelectedId} />
          </TabsContent>
          <TabsContent value="non-trades">
            <RecordsTable records={nonTrades} onSelect={setSelectedId} />
          </TabsContent>
        </Tabs>
      </div>

      <RegistrationWorkspace recordId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
