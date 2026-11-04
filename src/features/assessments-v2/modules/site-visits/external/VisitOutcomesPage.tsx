import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { EmptyState, SectionCard } from '../../../shared/ui/PageSections';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { useSharedVisitOutcomes } from '../hooks';
import { VISIT_TYPE_LABELS } from '../visitTypeLabels';

// Shared visit outcomes: read-only, and only the visits QCTO chose to share with this QP. It is
// not the old external Site Visits section — there is no scheduling and no acknowledgement here.
export function VisitOutcomesPage() {
  const { person } = useV2Role();
  const { data: outcomes = [] } = useSharedVisitOutcomes(person.qpId);

  return (
    <div className="space-y-6">
      <PageHeader title="Visit Outcomes" description="The outcomes of QCTO visits that have been shared with you." />

      <SectionCard title="Shared outcomes">
        {outcomes.length === 0 ? (
          <EmptyState title="No visit outcomes have been shared with you yet" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Visit type', 'Visit date', 'Outcome summary', 'Report'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {outcomes.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="whitespace-nowrap font-medium">{VISIT_TYPE_LABELS[o.visitType]}</TableCell>
                    <TableCell className="whitespace-nowrap">{o.visitDate || '—'}</TableCell>
                    <TableCell className="whitespace-pre-wrap min-w-[240px]">{o.outcomeSummary}</TableCell>
                    <TableCell>
                      {o.reportFileNames.length === 0 ? (
                        '—'
                      ) : (
                        <ul className="space-y-0.5">
                          {o.reportFileNames.map((name) => (
                            <li key={name} className="font-mono text-xs">
                              {name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
