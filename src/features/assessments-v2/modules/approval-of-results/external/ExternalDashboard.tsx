import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { useResultsBatches, useSittingsAwaitingSubmission } from '../hooks';
import { competencyRatePercent, submissionDeadlineFor } from '../workflow';
import { ResultsBatchDetail } from './ResultsBatchDetail';
import { SubmitResultsBatchDialog } from './SubmitResultsBatchDialog';

// CR-059: the QP submits a results batch within 21 working days of the sitting. No QP login
// exists in this build, only the role switcher, so "my own" is simulated with a local
// "viewing as" picker — the same pattern used everywhere else in this domain.
function QpResultsView() {
  const { data: awaiting = [] } = useSittingsAwaitingSubmission();
  const { data: batches = [] } = useResultsBatches();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitSittingId, setSubmitSittingId] = useState<string | null>(null);

  const qpNames = useMemo(
    () => [...new Set([...awaiting.map((a) => a.qpName), ...batches.map((b) => b.qpName)])].filter(Boolean).sort(),
    [awaiting, batches],
  );
  const [viewingAsQp, setViewingAsQp] = useState('');

  const myAwaiting = viewingAsQp ? awaiting.filter((a) => a.qpName === viewingAsQp) : [];
  const myBatches = viewingAsQp ? batches.filter((b) => b.qpName === viewingAsQp) : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Approval of Results</h2>
        <p className="text-sm text-gray-500 mt-1">Submit your exam results batch within 21 working days of the sitting (CR-059).</p>
      </div>

      <div className="space-y-2 max-w-sm">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Viewing as QP</label>
        <Select value={viewingAsQp} onValueChange={setViewingAsQp}>
          <SelectTrigger>
            <SelectValue placeholder="Select your QP name" />
          </SelectTrigger>
          <SelectContent>
            {qpNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {viewingAsQp && (
        <>
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/80">
              <h3 className="text-base font-semibold text-gray-900">Awaiting Submission</h3>
            </div>
            {myAwaiting.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">Nothing awaiting submission.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {['Qualification', 'Sitting Date', 'Learners', 'Deadline', ''].map((h) => (
                        <TableHead key={h} className="whitespace-nowrap">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myAwaiting.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="max-w-[200px] truncate">{a.qualificationTitle}</TableCell>
                        <TableCell className="whitespace-nowrap">{a.sittingDate}</TableCell>
                        <TableCell>{a.learners.length}</TableCell>
                        <TableCell>
                          <DeadlineBadge deadline={submissionDeadlineFor(a.sittingDate)} />
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => setSubmitSittingId(a.sittingId)}>
                            Submit Results
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
              <h3 className="text-base font-semibold text-gray-900">My Submitted Batches</h3>
            </div>
            {myBatches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">No batches submitted yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {['Qualification', 'Sitting Date', 'Competency Rate', 'Status', 'Submission'].map((h) => (
                        <TableHead key={h} className="whitespace-nowrap">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myBatches.map((b) => (
                      <TableRow key={b.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(b.id)}>
                        <TableCell className="max-w-[200px] truncate">{b.qualificationTitle}</TableCell>
                        <TableCell className="whitespace-nowrap">{b.sittingDate}</TableCell>
                        <TableCell>{competencyRatePercent(b)}%</TableCell>
                        <TableCell>
                          <ResultsBatchStatusBadge batch={b} />
                        </TableCell>
                        <TableCell>
                          <DeadlineBadge deadline={b.submissionDeadline} submittedAt={b.submittedAt} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </>
      )}

      <SubmitResultsBatchDialog sittingId={submitSittingId} onOpenChange={(open) => !open && setSubmitSittingId(null)} />
      <ResultsBatchDetail batchId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

// SDP is not named for this module (register's "Who's involved" list is QP, Assistant
// Director, Deputy Director, Director, Chief Director) — shown the same informational card
// pattern used by Site Visits for the roles a module doesn't involve.
function NotApplicableView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Approval of Results</h2>
      </div>
      <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
        <p className="font-semibold text-gray-900">Not applicable for this role</p>
        <p className="text-sm text-gray-500 mt-1">Only the QP submits results batches here. QCTO reviews them on the internal portal.</p>
      </div>
    </div>
  );
}

export function ExternalDashboard() {
  const { role } = useV2Role();
  return role === 'QP' ? <QpResultsView /> : <NotApplicableView />;
}
