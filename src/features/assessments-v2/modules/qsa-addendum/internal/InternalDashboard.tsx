import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { QsaStatusBadge } from '../components/StatusBadge';
import { useQsaAddendumApplications } from '../hooks';
import { ApplicationWorkspace } from './ApplicationWorkspace';

export function InternalDashboard() {
  const { data: applications = [] } = useQsaAddendumApplications();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const asdCount = applications.filter((a) => a.evalState.stageId === 'asd-evaluation' || a.ackState.stageId === 'asd-preview').length;
  const ddCount = applications.filter((a) => a.evalState.stageId === 'dd-review' || a.ackState.stageId === 'dd-review').length;
  const iacCount = applications.filter((a) => a.evalState.stageId === 'iac-review').length;
  const approvedCount = applications.filter((a) => a.approvalState?.stageId === 'signed').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">QSA Addendum — QSA Evaluation Team</h2>
        <p className="text-sm text-gray-500 mt-1">All applications. Open one to act on it — only the actions your current role may perform are shown.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'With ASD', value: asdCount },
          { label: 'With Deputy Director', value: ddCount },
          { label: 'With IAC', value: iacCount },
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
            <p className="text-sm text-gray-400 mt-1">Applications submitted by a QP in the external portal will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['QP', 'Qualification Title', 'SAQA ID', 'Submitted', 'Status', ''].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(app.id)}>
                    <TableCell className="font-semibold whitespace-nowrap">{app.qpName}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{app.qualificationTitle}</TableCell>
                    <TableCell className="font-mono text-xs">{app.saqaId}</TableCell>
                    <TableCell className="whitespace-nowrap">{app.submissionDate}</TableCell>
                    <TableCell><QsaStatusBadge application={app} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedId(app.id); }}>
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

      <ApplicationWorkspace applicationId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
