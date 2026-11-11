import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toIsoDate } from '../../../shared/dates/workingDays';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { EmptyState, SectionCard } from '../../../shared/ui/PageSections';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { SiteVisitStatusBadge } from '../components/StatusBadge';
import { useSiteVisits } from '../hooks';
import { responseStatusOf, stakeholderResponseLabel, visitsForStakeholder, visitStakeholderOf } from '../stakeholderResponse';
import { qualificationLine, visitQualificationsOf } from '../visitQualifications';
import { VISIT_TYPE_LABELS } from '../visitTypeLabels';
import { VisitDetail } from './VisitDetail';
import type { SiteVisit } from '../types';

const HEADINGS = ['Type', 'Qualification(s)', 'Visit date', 'Notice', 'Status', 'Your response'];

function noticeLabel(visit: SiteVisit): string {
  if (visit.notificationFlag === 'unannounced') return 'Unannounced';
  return visit.noticeLeadTimeDays != null ? `Notified — ${visit.noticeLeadTimeDays} days` : 'Notified';
}

// CR-047 (Batch V2, QCTO 29.36): the QP and the SDP each see a list of their own visits, are told about a
// booked visit here (not by email), and accept the date or say they are not available. It lists only
// visits they know about, never a plan still in the planning chain or an unannounced visit.
function StakeholderVisitsView() {
  const { person } = useV2Role();
  const { data: visits = [] } = useSiteVisits();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const today = toIsoDate(new Date());
  const myVisits = visitsForStakeholder(visits, person);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Visits"
        description="Your visits: accept the date or say you are not available. QCTO plans, books and carries out the visits."
      />

      <SectionCard title={`My Visits — ${person.name}`}>
        {myVisits.length === 0 ? (
          <EmptyState title="No site visits for you yet." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {HEADINGS.map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {myVisits.map((v) => {
                  const mustRespond = responseStatusOf(v, today) === 'awaiting' && visitStakeholderOf(v)?.id === person.id;
                  const qualifications = visitQualificationsOf(v);
                  return (
                    <TableRow key={v.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(v.id)}>
                      <TableCell className="whitespace-nowrap">{VISIT_TYPE_LABELS[v.visitType]}</TableCell>
                      <TableCell className="min-w-[200px]">
                        {qualifications.length === 0 ? (
                          '—'
                        ) : (
                          <ul className="space-y-0.5">
                            {qualifications.map((q) => (
                              <li key={q.id} className="text-sm">
                                {qualificationLine(q, !!q.eisaDate)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{v.visitDate || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">{noticeLabel(v)}</TableCell>
                      <TableCell>
                        {v.planningWorkflow.stageId === 'booked' ? (
                          <SiteVisitStatusBadge visit={v} forQp />
                        ) : (
                          <Badge variant="outline" className="whitespace-nowrap font-medium bg-amber-50 text-amber-700 border-amber-200">
                            New date being approved
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={mustRespond ? 'whitespace-nowrap font-medium text-amber-700' : 'whitespace-nowrap'}>{stakeholderResponseLabel(v, today)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <VisitDetail visitId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

// Not involved per the register's "Who's involved" list for this hub.
function NotApplicableView() {
  return (
    <div className="space-y-6">
      <PageHeader title="Site Visits" />
      <SectionCard>
        <EmptyState title="Not applicable for this role" description="Site Visits are scheduled and run by QCTO officials. QPs and SDPs see their own visits here." />
      </SectionCard>
    </div>
  );
}

export function ExternalDashboard() {
  const { role } = useV2Role();
  return role === 'QP' || role === 'SDP' ? <StakeholderVisitsView /> : <NotApplicableView />;
}
