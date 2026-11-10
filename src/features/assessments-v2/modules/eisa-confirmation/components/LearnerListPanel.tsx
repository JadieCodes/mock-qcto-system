import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { downloadCsvFile } from '../../../shared/csv/csv';
import { buildListCsv, listCsvFileName } from '../listCsv';
import type { EisaConfirmationRecord } from '../types';

// 29.20: the consolidated learner list QCTO shared with the QP, with the CSV download.
export function LearnerListPanel({ record, showCentre }: { record: EisaConfirmationRecord; showCentre?: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Consolidated Learner List ({record.learners.length})</p>
          <p className="text-xs text-gray-500">Shared with the QP on {record.sharedAt.slice(0, 10)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => downloadCsvFile(listCsvFileName(record), buildListCsv(record))}>
          <Download className="h-4 w-4 mr-1" />
          Download CSV
        </Button>
      </div>
      <div className="rounded-xl border max-h-64 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {['Learner', 'ID number', 'SDP', 'Pathway', 'Registration number', ...(showCentre ? ['Assessment centre'] : [])].map((h) => (
                <TableHead key={h} className="whitespace-nowrap">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {record.learners.map((l) => (
              <TableRow key={l.learnerId}>
                <TableCell className="font-medium whitespace-nowrap">{l.fullName}</TableCell>
                <TableCell className="whitespace-nowrap">{l.idNumber}</TableCell>
                <TableCell className="whitespace-nowrap">{l.sdpName}</TableCell>
                <TableCell>{l.pathway}</TableCell>
                <TableCell className="whitespace-nowrap">{l.registrationNumber}</TableCell>
                {showCentre && <TableCell className="whitespace-nowrap">{l.assessmentCentre ?? 'Not allocated'}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
