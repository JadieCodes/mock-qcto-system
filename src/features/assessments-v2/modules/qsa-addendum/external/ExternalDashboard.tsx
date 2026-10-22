import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterExternalRecords } from '../../../shared/visibility/recordVisibility';
import { QsaStatusBadge } from '../components/StatusBadge';
import { useQsaAddendumApplications } from '../hooks';
import { isApprovalLetterFinal } from '../workflow';
import { ApplicationDetail } from './ApplicationDetail';
import { NewApplicationForm } from './NewApplicationForm';

// 09-visibility-matrix.md: a QP sees only their own applications, matched by qpId now that
// named QP identity exists (Fix 1B-i) — this used to show every QP's applications.
export function ExternalDashboard() {
  const { person } = useV2Role();
  const { data: allApplications = [] } = useQsaAddendumApplications();
  const applications = filterExternalRecords(allApplications, person, { qpIdOf: (a) => a.qpId });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const correctionsCount = applications.filter((a) => a.evalState.stageId === 'qp-corrections').length;
  const underReviewCount = applications.filter((a) =>
    ['asd-evaluation', 'dd-review', 'iac-review'].includes(a.evalState.stageId),
  ).length;
  const approvedCount = applications.filter((a) => isApprovalLetterFinal(a.approvalState)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My QSA Addendum Applications</h2>
          <p className="text-sm text-gray-500 mt-1">Submit and track your QSA Addendum applications.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />New QSA Addendum Application
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Submitted', value: applications.length },
          { label: 'Under Review', value: underReviewCount },
          { label: 'Corrections Requested', value: correctionsCount },
          { label: 'Approved', value: approvedCount },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold text-gray-900">Applications</h3>
        </div>
        {applications.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-medium text-gray-500">No applications yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">Click "New QSA Addendum Application" above to submit your first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification Title', 'SAQA ID', 'NQF Level', 'Credits', 'Submitted', 'Status', ''].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(app.id)}>
                    <TableCell className="font-medium max-w-[220px] truncate">{app.qualificationTitle}</TableCell>
                    <TableCell className="font-mono text-xs">{app.saqaId}</TableCell>
                    <TableCell>{app.nqfLevel}</TableCell>
                    <TableCell>{app.credits}</TableCell>
                    <TableCell className="whitespace-nowrap">{app.submissionDate}</TableCell>
                    <TableCell><QsaStatusBadge application={app} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedId(app.id); }}>
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

      <NewApplicationForm open={isFormOpen} onOpenChange={setIsFormOpen} />
      <ApplicationDetail applicationId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
