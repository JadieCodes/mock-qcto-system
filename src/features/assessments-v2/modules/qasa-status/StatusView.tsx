import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '../../shared/ui/PageHeader';
import { EmptyState, SectionCard } from '../../shared/ui/PageSections';
import { useApprovedInstruments, useQasaStatusRows } from './hooks';

// QCTO feedback 2.2: one read-only view for every role on both portals. Status only — no row
// opens a QASA or instrument validation record, so roles without QASA access (SDPs) still
// cannot reach those records or screens from here.
export function QasaStatusView() {
  const { data: qasaRows = [] } = useQasaStatusRows();
  const { data: instrumentRows = [] } = useApprovedInstruments();

  return (
    <div className="space-y-6">
      <PageHeader
        title="QASA Status and Approved Instruments"
        description="The current status of every QASA and the EISA instruments that have been approved."
      />

      <SectionCard title="QASA status">
        {qasaRows.length === 0 ? (
          <EmptyState title="No QASAs yet" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification', 'QP', 'Status'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {qasaRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.qualificationTitle}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.qpName}</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Approved instruments">
        {instrumentRows.length === 0 ? (
          <EmptyState title="No approved instruments yet" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification', 'Validation date', 'Conditions'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {instrumentRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.qualificationTitle}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.validationDate || '—'}</TableCell>
                    <TableCell className="whitespace-pre-wrap">{row.conditions ?? 'None'}</TableCell>
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
