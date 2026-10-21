import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InstrumentValidationStatusBadge } from '../components/StatusBadge';
import { useInstrumentValidationRecords } from '../hooks';
import { StatusDashboard } from './StatusDashboard';
import { ValidationWorkspace } from './ValidationWorkspace';

// CR-018/CR-019: a section separate from EISA Registration. SDPs cannot see this at all —
// blocked at the route level (see shared/ui/RoleBlocked.tsx wired in index.tsx), not just
// hidden from this screen.
export function InternalDashboard() {
  const { data: records = [] } = useInstrumentValidationRecords();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const schedulingCount = records.filter((r) => r.scheduling.workflow.stageId !== 'agreed').length;
  const withAsdCount = records.filter(
    (r) => r.scheduling.workflow.stageId === 'agreed' && r.validationWorkflow.stageId === 'asd-validation',
  ).length;
  const validatedCount = records.filter((r) => r.instrumentStatus === 'validated').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">EISA Instrument Validation — Instrument Validation Team</h2>
        <p className="text-sm text-gray-500 mt-1">A separate section from EISA Registration. SDPs cannot see this section.</p>
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">My Queue</TabsTrigger>
          <TabsTrigger value="status-dashboard">Status Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Scheduling in progress', value: schedulingCount },
              { label: 'With ASD', value: withAsdCount },
              { label: 'Validated', value: validatedCount },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/80">
              <h3 className="text-base font-semibold text-gray-900">Validations</h3>
            </div>
            {records.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-medium text-gray-500">No validations yet</p>
                <p className="text-sm text-gray-400 mt-1">Validations started by a QP in the external portal will appear here.</p>
              </div>
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
          </div>
        </TabsContent>

        <TabsContent value="status-dashboard">
          <StatusDashboard />
        </TabsContent>
      </Tabs>

      <ValidationWorkspace recordId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
