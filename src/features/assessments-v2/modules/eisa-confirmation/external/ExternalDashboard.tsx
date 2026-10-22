import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterExternalRecords } from '../../../shared/visibility/recordVisibility';
import { ConfirmationStatusBadge } from '../components/StatusBadge';
import { useConfirmationRecords } from '../hooks';
import { ConfirmationDetail } from './ConfirmationDetail';

// CR-043: the QP views, acknowledges and confirms. SDP is now nav/route-hidden from this
// module entirely (09-visibility-matrix.md). The QP sees only their own confirmations (qpId).
export function ExternalDashboard() {
  const { person } = useV2Role();
  const { data: allRecords = [] } = useConfirmationRecords();
  const records = filterExternalRecords(allRecords, person, { qpIdOf: (r) => r.qpId });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">EISA Confirmation</h2>
        <p className="text-sm text-gray-500 mt-1">
          After registration is complete you confirm centres, learner counts and marking/moderation dates here. RPL monitoring items in Site
          Visits come from the registration, not from Confirmation.
        </p>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold text-gray-900">Confirmations</h3>
        </div>
        {records.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-medium text-gray-500">No confirmations yet</p>
            <p className="text-sm text-gray-400 mt-1">They appear here once QCTO generates one for a completed registration.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification', 'Sitting Date', 'Learners', 'Status', ''].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(r.id)}>
                    <TableCell className="font-medium max-w-[220px] truncate">{r.qualificationTitle}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.sittingDate}</TableCell>
                    <TableCell>{r.learners.length}</TableCell>
                    <TableCell>
                      <ConfirmationStatusBadge record={r} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(r.id);
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

      <ConfirmationDetail recordId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
