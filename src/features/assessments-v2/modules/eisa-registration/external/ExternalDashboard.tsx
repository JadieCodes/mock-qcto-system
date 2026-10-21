import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { RegistrationStatusBadge } from '../components/StatusBadge';
import { useRegistrationRecords } from '../hooks';
import { NewRegistrationDialog } from './NewRegistrationDialog';
import { RegistrationDetail } from './RegistrationDetail';

// CR-036/CR-024: the SDP builds registrations here. No CR restricts QP visibility (unlike
// CR-018's SDP block on Instrument Validation), so a QP sees the same list read-only —
// "Start Registration" is only offered to the SDP role.
export function ExternalDashboard() {
  const { role } = useV2Role();
  const { data: records = [] } = useRegistrationRecords();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">EISA Registration</h2>
          <p className="text-sm text-gray-500 mt-1">Register enrolled learners for a published EISA sitting.</p>
        </div>
        {role === 'SDP' && (
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Start Registration
          </Button>
        )}
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold text-gray-900">Registrations</h3>
        </div>
        {records.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-medium text-gray-500">No registrations yet</p>
            {role === 'SDP' && <p className="text-sm text-gray-400 mt-1">Click "Start Registration" above once a sitting is published.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification', 'SDP', 'Sitting Date', 'Category', 'Learners', 'Status', ''].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(record.id)}>
                    <TableCell className="font-medium max-w-[200px] truncate">{record.qualificationTitle}</TableCell>
                    <TableCell>{record.sdpName}</TableCell>
                    <TableCell className="whitespace-nowrap">{record.sittingDate}</TableCell>
                    <TableCell className="capitalize">{record.category}</TableCell>
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

      <NewRegistrationDialog open={isFormOpen} onOpenChange={setIsFormOpen} />
      <RegistrationDetail recordId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
