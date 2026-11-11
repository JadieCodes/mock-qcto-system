import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatShortDate } from '../instrument-validation/exemplars';
import { useV2Role } from '../../shared/ui/useV2Role';
import { PageHeader } from '../../shared/ui/PageHeader';
import { EmptyState, SectionCard } from '../../shared/ui/PageSections';
import { useApprovedInstruments, useQasaStatusRows } from './hooks';

// QCTO feedback 2.2: one read-only view for every role on both portals. Status only — no row
// opens a QASA or instrument validation record, so roles without QASA access (SDPs) still
// cannot reach those records or screens from here.
export function QasaStatusView() {
  const { data: qasaRows = [] } = useQasaStatusRows();
  const { portal } = useV2Role();
  const { data: approved } = useApprovedInstruments(portal);

  return (
    <div className="space-y-6">
      <PageHeader
        title="QASA Status and Approved Instruments"
        description="The current status of every QASA and the exemplar of each qualification's EISA instrument."
      />

      <SectionCard title="QASA status">
        {qasaRows.length === 0 ? (
          <EmptyState title="No QASAs yet" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification', 'SAQA ID', 'QP', 'Status'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {qasaRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.qualificationTitle}</TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{row.saqaId}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.qpName}</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {approved?.portal === 'internal' ? (
        <SectionCard title="Validated instruments">
          {approved.groups.length === 0 ? (
            <EmptyState title="No validated instruments yet" />
          ) : (
            <div className="space-y-5">
              {approved.groups.map((group) => (
                <div key={`${group.qualificationTitle}-${group.saqaId}`} className="space-y-2">
                  <p className="text-sm font-semibold">
                    {group.qualificationTitle} <span className="font-mono text-xs font-normal text-gray-500">{group.saqaId || '—'}</span>
                    <span className="text-xs font-normal text-gray-500"> · {group.qpName}</span>
                  </p>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {['File name', 'EISA sitting', 'Validation date', 'Outcome', ''].map((h) => (
                            <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.instruments.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-mono text-xs">{row.fileName}</TableCell>
                            <TableCell className="whitespace-nowrap">{row.sittingLabel}</TableCell>
                            <TableCell className="whitespace-nowrap">{row.validationDate ? formatShortDate(row.validationDate) : '—'}</TableCell>
                            <TableCell className="whitespace-nowrap">{row.outcome}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {row.isCurrentExemplar && <Badge>Exemplar</Badge>}
                              {row.replacedAt && <Badge variant="outline">Former exemplar (replaced {formatShortDate(row.replacedAt)})</Badge>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      ) : (
        <SectionCard title="Exemplars">
          {!approved || approved.exemplars.length === 0 ? (
            <EmptyState title="No exemplars yet" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {['Qualification', 'Qualification ID (SAQA)', 'QP', 'Exemplar validated on', 'Conditions'].map((h) => (
                      <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approved.exemplars.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.qualificationTitle}</TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">{row.saqaId || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">{row.qpName}</TableCell>
                      <TableCell className="whitespace-nowrap">{row.validationDate ? formatShortDate(row.validationDate) : '—'}</TableCell>
                      <TableCell className="whitespace-pre-wrap">{row.conditions ?? 'None'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
