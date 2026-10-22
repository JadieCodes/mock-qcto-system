import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterExternalRecords } from '../../../shared/visibility/recordVisibility';
import { InstrumentValidationStatusBadge } from '../components/StatusBadge';
import { useInstrumentValidationRecords } from '../hooks';
import { NewValidationDialog } from './NewValidationDialog';
import { ValidationDetail } from './ValidationDetail';

// CR-018: this is the QP's own screen. The SDP role never reaches this component at all —
// it is blocked at the route level (see shared/ui/RoleBlocked.tsx wired in index.tsx).
// 09-visibility-matrix.md: further filtered to only this QP's own records (qpId).
export function ExternalDashboard() {
  const { person } = useV2Role();
  const { data: allRecords = [] } = useInstrumentValidationRecords();
  const records = filterExternalRecords(allRecords, person, { qpIdOf: (r) => r.qpId });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const schedulingCount = records.filter((r) => r.scheduling.workflow.stageId !== 'agreed').length;
  const underValidationCount = records.filter(
    (r) => r.scheduling.workflow.stageId === 'agreed' && r.validationWorkflow.stageId === 'asd-validation',
  ).length;
  const validatedCount = records.filter((r) => r.instrumentStatus === 'validated').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My EISA Instrument Validations</h2>
          <p className="text-sm text-gray-500 mt-1">Schedule, upload and track your EISA instrument validations.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Start Validation
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Scheduling in progress', value: schedulingCount },
          { label: 'Under ASD validation', value: underValidationCount },
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
            <p className="text-sm text-gray-400 mt-1">Click "Start Validation" above once a QSA Addendum is Approved.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification Title', 'QP', 'Status', ''].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(record.id)}>
                    <TableCell className="font-medium max-w-[220px] truncate">{record.qualificationTitle}</TableCell>
                    <TableCell>{record.qpName}</TableCell>
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
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <NewValidationDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
      <ValidationDetail recordId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
