import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterByVisibilityScope } from '../../../shared/visibility/recordVisibility';
import { SiteVisitStatusBadge } from '../components/StatusBadge';
import { visibilityScopeForRole } from '../config';
import { useSiteVisits } from '../hooks';
import { VISIT_TYPE_LABELS } from '../visitTypeLabels';
import { VisitDetail } from './VisitDetail';

// CR-047/CR-054: QPs only see their own visits and schedules, driven by the same
// REPORT_VISIBILITY_RULES table (config.ts) the internal side reads — matched against the
// acting QP's identity rather than a qualification proxy (G-05/G-19) or a manual picker.
function QpVisitsView() {
  const { role, person } = useV2Role();
  const { data: visits = [] } = useSiteVisits();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const myVisits = filterByVisibilityScope(visits, visibilityScopeForRole(role), person, (v) => v.qpId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Site Visits &amp; Monitoring</h2>
        <p className="text-sm text-gray-500 mt-1">
          View your own visits and their status — scheduling and execution are managed by QCTO. An RPL/ARPL monitoring item here comes
          automatically from your registration, not from EISA Confirmation.
        </p>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold text-gray-900">My Visits — {person.name}</h3>
        </div>
        {myVisits.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">No visits for "{person.name}" yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Type', 'Qualification', 'Visit Date', 'Status'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {myVisits.map((v) => (
                  <TableRow key={v.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(v.id)}>
                    <TableCell className="whitespace-nowrap">{VISIT_TYPE_LABELS[v.visitType]}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{v.qualificationTitle}</TableCell>
                    <TableCell className="whitespace-nowrap">{v.visitDate}</TableCell>
                    <TableCell>
                      <SiteVisitStatusBadge visit={v} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <VisitDetail visitId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

// Not involved per the register's "Who's involved" list for this hub (only QP is listed,
// view-only) — shown a simple informational card rather than the QP's filtered view.
function NotApplicableView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Site Visits &amp; Monitoring</h2>
      </div>
      <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
        <p className="font-semibold text-gray-900">Not applicable for this role</p>
        <p className="text-sm text-gray-500 mt-1">Site Visits &amp; Monitoring is scheduled and run by QCTO officials. Only QPs can view their own visits here.</p>
      </div>
    </div>
  );
}

export function ExternalDashboard() {
  const { role } = useV2Role();
  return role === 'QP' ? <QpVisitsView /> : <NotApplicableView />;
}
