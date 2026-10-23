import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScopeToggle } from '../../../shared/ui/ScopeToggle';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterByScope, type ListScope } from '../../../shared/visibility/recordVisibility';
import { ConfirmationStatusBadge } from '../components/StatusBadge';
import { useConfirmationRecords, useGenerateConfirmation, useSittingsReadyToConfirm } from '../hooks';

// CR-043: triggered once registration for a sitting is complete. Not auto-started — a QCTO
// official (here, the Assistant Director — see config.ts) generates it explicitly.
export function InternalDashboard() {
  const { person } = useV2Role();
  const actorName = person.name;
  const { data: ready = [] } = useSittingsReadyToConfirm();
  const { data: allRecords = [] } = useConfirmationRecords();
  const generate = useGenerateConfirmation();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [scope, setScope] = useState<ListScope>('mine');
  const records = filterByScope(allRecords, scope, person.id, (r) => [r.generatedById]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">EISA Confirmation</h2>
          <p className="text-sm text-gray-500 mt-1">
            After registration is complete the QP confirms centres, learner counts and marking/moderation dates. RPL monitoring items in Site
            Visits come from the registration, not from Confirmation.
          </p>
        </div>
        <ScopeToggle scope={scope} onChange={setScope} />
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold text-gray-900">Ready to Confirm</h3>
        </div>
        {ready.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-gray-400">No sittings are ready yet — registration must be complete first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification', 'QP', 'Sitting Date', ''].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ready.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium max-w-[220px] truncate">{s.qualificationTitle}</TableCell>
                    <TableCell>{s.qpName}</TableCell>
                    <TableCell className="whitespace-nowrap">{s.date}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={generate.isPending && generatingId === s.id}
                        onClick={() => {
                          setGeneratingId(s.id);
                          generate.mutate(
                            { sittingId: s.id, generatedBy: actorName, generatedById: person.id },
                            { onSettled: () => setGeneratingId(null) },
                          );
                        }}
                      >
                        Generate EISA Confirmation
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold text-gray-900">All Confirmations</h3>
        </div>
        {records.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-medium text-gray-500">No confirmations generated yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification', 'QP', 'Sitting Date', 'Learners', 'Status'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium max-w-[220px] truncate">{r.qualificationTitle}</TableCell>
                    <TableCell>{r.qpName}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.sittingDate}</TableCell>
                    <TableCell>{r.learners.length}</TableCell>
                    <TableCell>
                      <ConfirmationStatusBadge record={r} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
