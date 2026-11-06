import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Role } from '../../../types';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { EmptyState, SectionCard, StatTile, StatTileGrid } from '../../../shared/ui/PageSections';
import { ScopeToggle } from '../../../shared/ui/ScopeToggle';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { canActInStage } from '../../../shared/workflow/engine';
import { filterByScope, type ListScope } from '../../../shared/visibility/recordVisibility';
import { QsaStatusBadge } from '../components/StatusBadge';
import { useQsaAddendumApplications } from '../hooks';
import type { QsaAddendumApplication } from '../types';
import { EVAL_WORKFLOW, isQasaApproved, OUTCOME_WORKFLOW } from '../workflow';
import { ApplicationWorkspace } from './ApplicationWorkspace';

function myItemIds(app: QsaAddendumApplication): (string | null | undefined)[] {
  return [app.evalState.submittedById, app.outcomeState.submittedById];
}

// A brand-new submission nobody has personally touched yet still belongs under "My items" for
// whichever role can act on its current stage (09-visibility-matrix.md "Approved corrections").
function isUnassignedActionable(app: QsaAddendumApplication, role: Role): boolean {
  // An approved QASA is not "work to do" just because the DD may start a review of it (05.2).
  return (
    (app.evalState.stageId !== 'approved' && canActInStage(EVAL_WORKFLOW, app.evalState.stageId, role)) ||
    canSignOutcomeNow(app, role)
  );
}

// Every QASA is created with its feedback letter already at `ceo-signature`, so the stage alone
// doesn't mean it can be signed — the IAC must have approved first (same check as the Feedback
// Letter tab in ApplicationWorkspace).
function canSignOutcomeNow(app: QsaAddendumApplication, role: Role): boolean {
  return app.evalState.stageId === 'approved' && canActInStage(OUTCOME_WORKFLOW, app.outcomeState.stageId, role);
}

export function InternalDashboard() {
  const { role, person } = useV2Role();
  const { data: allApplications = [] } = useQsaAddendumApplications();
  const [scope, setScope] = useState<ListScope>('mine');

  // B-19: the CEO's "My items" is only the outcome letters they can sign right now;
  // "All items for my role" still shows every QASA.
  const isCeo = role === 'CEO';
  const isCeoQueue = isCeo && scope === 'mine';
  const applications = isCeo
    ? isCeoQueue
      ? allApplications.filter((a) => canSignOutcomeNow(a, role))
      : allApplications
    : filterByScope(allApplications, scope, person.id, myItemIds, (a) => isUnassignedActionable(a, role));

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const asdCount = applications.filter((a) => a.evalState.stageId === 'asd-evaluation').length;
  const ddCount = applications.filter((a) => a.evalState.stageId === 'dd-review').length;
  const directorOfficeCount = applications.filter((a) => a.evalState.stageId === 'director-office-review').length;
  const iacCount = applications.filter((a) => a.evalState.stageId === 'iac-review').length;
  const approvedCount = applications.filter(isQasaApproved).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="QAS Addendum (QASA)"
        description={
          <>
            <span className="block">
              Roles: ASD evaluates · DD moderates · Director Office quality-assures and approves for tabling · DD presents at the IAC and records the outcome · CEO signs the feedback letter.
            </span>
            {isCeoQueue
              ? 'Feedback letters you can sign now — the IAC has approved these QASAs. Your signature is the approval.'
              : 'Open one to act on it — only the actions your current role may perform are shown.'}
          </>
        }
        actions={<ScopeToggle scope={scope} onChange={setScope} />}
      />

      <StatTileGrid className="md:grid-cols-5">
        <StatTile label="With ASD" value={asdCount} />
        <StatTile label="With Deputy Director" value={ddCount} />
        <StatTile label="With Director Office" value={directorOfficeCount} />
        <StatTile label="Awaiting IAC outcome" value={iacCount} />
        <StatTile label="Approved" value={approvedCount} />
      </StatTileGrid>

      <SectionCard title={isCeoQueue ? 'Awaiting Your Signature' : 'QASA Submissions'}>
        {applications.length === 0 ? (
          isCeoQueue ? (
            <EmptyState
              title="Nothing to sign"
              description="A feedback letter appears here once the IAC has approved a QASA."
            />
          ) : (
            <EmptyState title="No submissions yet" description="QASAs submitted by a QP in the external portal will appear here." />
          )
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
      </SectionCard>

      <ApplicationWorkspace applicationId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
