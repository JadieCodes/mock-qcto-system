import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { EmptyState, SectionCard, StatTile, StatTileGrid } from '../../../shared/ui/PageSections';
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
      <PageHeader
        title="My QSA Addendum Applications"
        description="Submit and track your QSA Addendum applications."
        actions={
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />New QSA Addendum Application
          </Button>
        }
      />

      <StatTileGrid>
        <StatTile label="Total Submitted" value={applications.length} />
        <StatTile label="Under Review" value={underReviewCount} />
        <StatTile label="Corrections Requested" value={correctionsCount} />
        <StatTile label="Approved" value={approvedCount} />
      </StatTileGrid>

      <SectionCard title="Applications">
        {applications.length === 0 ? (
          <EmptyState title="No applications yet" description='Click "New QSA Addendum Application" above to submit your first one.' />
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
      </SectionCard>

      <NewApplicationForm open={isFormOpen} onOpenChange={setIsFormOpen} />
      <ApplicationDetail applicationId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
