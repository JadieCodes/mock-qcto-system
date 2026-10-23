import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, SectionCard } from '../../../shared/ui/PageSections';
import { teamLabel } from '../../../config/teams';
import { listApplications } from '../../qsa-addendum/api';
import { qsaOverallStatusLabel } from '../../qsa-addendum/workflow';
import { useInstrumentValidationRecords } from '../hooks';
import { overallStatusLabel } from '../workflow';

interface AgendaRow {
  id: string;
  type: 'QSA Addendum' | 'EISA Instrument Validation';
  qualificationTitle: string;
  qpName: string;
  stageLabel: string;
  ownerTeam: string;
  date: string;
}

// CR-025: "QSA agenda" is read here as the QSA Addendum queue — the same applications QCTO
// officials already work from on the QSA Addendum screen — shown alongside instrument
// validation status in one place, with stage, owner team, dates and filters. See the
// "Assumptions made" note in progress.md for this reading.
export function StatusDashboard() {
  const { data: qsaApplications = [] } = useQuery({
    queryKey: ['instrument-validation', 'status-dashboard', 'qsa-applications'],
    queryFn: listApplications,
  });
  const { data: validationRecords = [] } = useInstrumentValidationRecords();

  const [typeFilter, setTypeFilter] = useState<'all' | 'qsa' | 'validation'>('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const rows: AgendaRow[] = useMemo(() => {
    const qsaRows: AgendaRow[] = qsaApplications.map((a) => ({
      id: `qsa-${a.id}`,
      type: 'QSA Addendum',
      qualificationTitle: a.qualificationTitle,
      qpName: a.qpName,
      stageLabel: qsaOverallStatusLabel(a),
      ownerTeam: teamLabel('qsa-evaluation'),
      date: a.submissionDate,
    }));
    const validationRows: AgendaRow[] = validationRecords.map((r) => ({
      id: `val-${r.id}`,
      type: 'EISA Instrument Validation',
      qualificationTitle: r.qualificationTitle,
      qpName: r.qpName,
      stageLabel: overallStatusLabel(r),
      ownerTeam: teamLabel('instrument-validation'),
      date: r.createdAt.slice(0, 10),
    }));
    return [...qsaRows, ...validationRows].sort((a, b) => b.date.localeCompare(a.date));
  }, [qsaApplications, validationRecords]);

  const filtered = rows.filter((row) => {
    if (typeFilter === 'qsa' && row.type !== 'QSA Addendum') return false;
    if (typeFilter === 'validation' && row.type !== 'EISA Instrument Validation') return false;
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
      <div className="rounded-2xl border bg-white p-4 shadow-sm grid gap-3 md:grid-cols-4">
        <Input placeholder="Search qualification, QP or stage..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="qsa">QSA Addendum</SelectItem>
            <SelectItem value="validation">EISA Instrument Validation</SelectItem>
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
                  {['Type', 'Qualification Title', 'QP', 'Stage', 'Owner Team', 'Date'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-xs font-semibold text-gray-500">{row.type}</TableCell>
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
