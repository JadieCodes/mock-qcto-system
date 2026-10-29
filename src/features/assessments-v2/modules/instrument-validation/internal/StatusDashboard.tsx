import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, SectionCard } from '../../../shared/ui/PageSections';
import { teamLabel } from '../../../config/teams';
import { useInstrumentValidationRecords } from '../hooks';
import { overallStatusLabel } from '../workflow';

interface StatusRow {
  id: string;
  qualificationTitle: string;
  qpName: string;
  stageLabel: string;
  ownerTeam: string;
  date: string;
}

const ALL_STATUSES = 'all';

// CR-025, QCTO feedback 1.6: EISA Instrument Validation records only. QASA is a separate
// process, not an EISA instrument type, so its submissions are not listed here.
export function StatusDashboard() {
  const { data: validationRecords = [] } = useInstrumentValidationRecords();

  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const rows: StatusRow[] = useMemo(
    () =>
      validationRecords
        .map((r) => ({
          id: r.id,
          qualificationTitle: r.qualificationTitle,
          qpName: r.qpName,
          stageLabel: overallStatusLabel(r),
          ownerTeam: teamLabel('instrument-validation'),
          date: r.createdAt.slice(0, 10),
        }))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [validationRecords],
  );

  const statusOptions = useMemo(() => [...new Set(rows.map((row) => row.stageLabel))].sort(), [rows]);

  const filtered = rows.filter((row) => {
    if (statusFilter !== ALL_STATUSES && row.stageLabel !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (
        !row.qualificationTitle.toLowerCase().includes(q) &&
        !row.qpName.toLowerCase().includes(q) &&
        !row.stageLabel.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (fromDate && row.date < fromDate) return false;
    if (toDate && row.date > toDate) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Shows the status of every EISA instrument validation.</p>

      <div className="rounded-2xl border bg-white p-4 shadow-sm grid gap-3 md:grid-cols-4">
        <Input placeholder="Search qualification, QP or stage..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
      </div>

      <SectionCard>
        {filtered.length === 0 ? (
          <EmptyState title="No records match these filters" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification Title', 'QP', 'Stage', 'Acting Roles', 'Date'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-[220px] truncate font-medium">{row.qualificationTitle}</TableCell>
                    <TableCell>{row.qpName}</TableCell>
                    <TableCell>{row.stageLabel}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-gray-500">{row.ownerTeam}</TableCell>
                    <TableCell className="whitespace-nowrap">{row.date}</TableCell>
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
