import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '../../shared/ui/PageHeader';
import { EmptyState, SectionCard } from '../../shared/ui/PageSections';
import { useFisaStandardStatusRows } from './hooks';

// QCTO feedback 3.8: read-only for the Qualifications Development role (granted in
// shared/visibility/config.ts). Status only — no actions, no documents, no row opens a record.
export function FisaStatusView() {
  const { data: rows = [] } = useFisaStandardStatusRows();

  return (
    <div className="space-y-6">
      <PageHeader title="FISA Standards Status" description="The current stage and status of every FISA Standard." />

      <SectionCard title="FISA Standards">
        {rows.length === 0 ? (
          <EmptyState title="No FISA Standards yet" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Skills Programme', 'Current stage', 'Status'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.skillsProgrammeTitle}</TableCell>
                    <TableCell>{row.stage}</TableCell>
                    <TableCell>{row.status}</TableCell>
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
