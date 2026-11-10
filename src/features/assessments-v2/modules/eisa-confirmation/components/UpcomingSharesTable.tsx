import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { latestShareDateFor } from '../sharing';
import type { UpcomingShare } from '../types';

// Sittings whose learner list is not shared with the QP yet (registration still open).
export function UpcomingSharesTable({ shares }: { shares: UpcomingShare[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {['Qualification', 'QP', 'EISA Date', 'Learners', 'Learner list'].map((h) => (
              <TableHead key={h} className="whitespace-nowrap">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {shares.map((s) => (
            <TableRow key={s.sittingId}>
              <TableCell className="font-medium max-w-[220px] truncate">{s.qualificationTitle}</TableCell>
              <TableCell>{s.qpName}</TableCell>
              <TableCell className="whitespace-nowrap">{s.sittingDate}</TableCell>
              <TableCell>{s.learnerCount}</TableCell>
              <TableCell className="whitespace-nowrap text-sm text-gray-600">
                Will be shared on {s.shareDate}
                <span className="block text-xs text-gray-400">At the latest {latestShareDateFor(s.sittingDate)}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
