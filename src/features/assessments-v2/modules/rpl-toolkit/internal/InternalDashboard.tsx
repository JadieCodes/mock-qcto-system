import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScopeToggle } from '../../../shared/ui/ScopeToggle';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterByScope, type ListScope } from '../../../shared/visibility/recordVisibility';
import { RplToolkitStatusBadge } from '../components/StatusBadge';
import { useRplToolkitApplications } from '../hooks';
import type { RplToolkitApplication } from '../types';
import { ApplicationWorkspace } from './ApplicationWorkspace';

function myItemIds(app: RplToolkitApplication): (string | null | undefined)[] {
  return [app.evalState.submittedById, app.outcomeState.submittedById, app.allocatedAsdId];
}

// PM-09: RPL Toolkit Team. Self-contained — no inbound or outbound links to the other maps.
export function InternalDashboard() {
  const { role, person } = useV2Role();
  const { data: allApplications = [] } = useRplToolkitApplications();
  const [scope, setScope] = useState<ListScope>('mine');

  // B-19-style fix, same as QSA Addendum: the CEO only ever sees the signature queue.
  const isCeo = role === 'CEO';
  const applications = isCeo
    ? allApplications.filter((a) => a.outcomeState.stageId === 'ceo-signature')
    : filterByScope(allApplications, scope, person.id, myItemIds);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const adCount = applications.filter((a) => a.evalState.stageId === 'ad-allocation').length;
  const asdCount = applications.filter((a) => a.evalState.stageId === 'asd-evaluation').length;
  const ddCount = applications.filter((a) => a.evalState.stageId === 'dd-review').length;
  const directorTeamCount = applications.filter((a) => a.evalState.stageId === 'director-team-review').length;
  const iacCount = applications.filter((a) => a.evalState.stageId === 'iac-review').length;
  const approvedCount = applications.filter((a) => a.evalState.stageId === 'approved').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">RPL Toolkit Evaluation — RPL Toolkit Team</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isCeo
              ? 'Applications awaiting your outcome-letter signature only.'
              : 'PM-09 — not in the change request register yet. Open one to act on it — only the actions your current role may perform are shown.'}
          </p>
        </div>
        {!isCeo && <ScopeToggle scope={scope} onChange={setScope} />}
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'With Assistant Director', value: adCount },
          { label: 'With ASD', value: asdCount },
          { label: 'With Deputy Director', value: ddCount },
          { label: 'With Director & Team', value: directorTeamCount },
          { label: 'With IAC', value: iacCount },
          { label: 'Approved', value: approvedCount },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold text-gray-900">Submissions</h3>
        </div>
        {applications.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-medium text-gray-500">No submissions yet</p>
            <p className="text-sm text-gray-400 mt-1">Submissions made by a QP in the external portal will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['QP', 'Toolkit Title', 'Type', 'Submitted', 'Status', ''].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(app.id)}>
                    <TableCell className="font-semibold whitespace-nowrap">{app.qpName}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{app.toolkitTitle}</TableCell>
                    <TableCell className="capitalize">{app.toolkitType}</TableCell>
                    <TableCell className="whitespace-nowrap">{app.submissionDate}</TableCell>
                    <TableCell>
                      <RplToolkitStatusBadge application={app} />
                    </TableCell>
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
