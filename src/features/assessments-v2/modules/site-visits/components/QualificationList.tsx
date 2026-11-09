import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { SiteVisit } from '../types';
import { isMultiQualificationVisit, qualificationEntriesHaveSitting, visitQualificationsOf } from '../visitQualifications';

// Batch V1 (05.13): the qualifications a Marking & Moderation or RPL/ARPL visit will check — title,
// SAQA ID and, for Marking & Moderation, the EISA date of each. Shown on the Details and Planning tabs.
export function QualificationList({ visit }: { visit: SiteVisit }) {
  if (!isMultiQualificationVisit(visit.visitType)) return null;
  const list = visitQualificationsOf(visit);
  const showEisaDate = qualificationEntriesHaveSitting(visit.visitType);
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase">Qualifications ({list.length})</p>
      {list.length === 0 ? (
        <p className="text-sm text-gray-400">No qualification recorded.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Qualification</TableHead>
              <TableHead>SAQA ID</TableHead>
              {showEisaDate && <TableHead>EISA date</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium">{q.qualificationTitle}</TableCell>
                <TableCell>{q.saqaId}</TableCell>
                {showEisaDate && <TableCell className="whitespace-nowrap">{q.eisaDate || '—'}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
