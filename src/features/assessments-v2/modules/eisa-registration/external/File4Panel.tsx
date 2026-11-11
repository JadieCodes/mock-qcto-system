import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { downloadCsvFile, EXCEL_UPLOAD_TIP } from '../../../shared/csv/csv';
import { useApplyFile4, useDownloadFile4, usePreviewFile4 } from '../hooks';
import type { File4ParseResult } from '../file4';
import type { EisaRegistrationRecord } from '../types';

interface PendingFile {
  fileName: string;
  text: string;
  result: File4ParseResult;
}

// Batch R2 (QCTO 29.15): bulk registration in QCTO's File 4. Nothing is saved unless every row is clean.
export function File4Panel({ record, actorId, actorName }: { record: EisaRegistrationRecord; actorId: string; actorName: string }) {
  const download = useDownloadFile4();
  const preview = usePreviewFile4();
  const apply = useApplyFile4();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingFile | null>(null);

  const rows = pending?.result.ok ? pending.result.rows : [];
  const errorCount = rows.filter((r) => r.errors.length > 0).length;
  const clean = pending?.result.ok === true && pending.result.updates !== null;

  const onDownload = () =>
    download.mutate(record.id, {
      onSuccess: (file) => downloadCsvFile(file.fileName, file.content),
    });

  const onFile = async (file: File) => {
    const text = await file.text();
    preview.mutate({ registrationId: record.id, text }, { onSuccess: (result) => setPending({ fileName: file.name, text, result }) });
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Register learners in bulk (File 4)</p>
      <p className="text-sm text-gray-600">
        Download File 4, keep the rows of the learners you want to register, delete the others, fill in the readiness columns (StatementofResultsStatus to
        DateStamp) and upload it. The file is checked before anything is saved. {EXCEL_UPLOAD_TIP}
      </p>
      {record.file4 && (
        <p className="text-xs text-gray-500">
          Last File 4 uploaded: <span className="font-mono">{record.file4.fileName}</span> on {record.file4.uploadedAt.slice(0, 10)}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" className="gap-1.5" disabled={download.isPending} onClick={onDownload}>
          <Download className="h-3.5 w-3.5" />
          Download File 4 (pre-filled)
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void onFile(file);
          }}
        />
        <Button type="button" size="sm" variant="outline" className="gap-1.5" disabled={preview.isPending} onClick={() => inputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
          Upload File 4
        </Button>
      </div>

      {pending && !pending.result.ok && (
        <Alert className="border-red-400 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {pending.result.error} Nothing was changed.
          </AlertDescription>
        </Alert>
      )}

      {pending?.result.ok && (
        <div className="space-y-2">
          {clean ? (
            <Alert className="border-emerald-400 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                {pending.fileName}: {rows.length} {rows.length === 1 ? 'row' : 'rows'}, no errors. Save to add or update these learners on the registration.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-400 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {pending.fileName}: {errorCount} {errorCount === 1 ? 'row has' : 'rows have'} errors. Nothing was changed. Fix the file and upload it again.
              </AlertDescription>
            </Alert>
          )}
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Row', 'Learner', 'Checks'].map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.rowNumber}>
                    <TableCell className="whitespace-nowrap">{r.rowNumber}</TableCell>
                    <TableCell>
                      <p className="font-medium">{r.fullName || 'Unknown learner'}</p>
                      <p className="text-xs text-gray-400">
                        {r.idNumber}
                        {r.idZeroRestored ? ' (leading 0 restored)' : ''}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs space-y-0.5">
                      {r.errors.length === 0 && r.warnings.length === 0 && <p className="text-emerald-700">OK</p>}
                      {r.errors.map((e) => (
                        <p key={e} className="text-red-700">
                          {e}
                        </p>
                      ))}
                      {r.warnings.map((w) => (
                        <p key={w} className="text-amber-700">
                          Warning: {w}
                        </p>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {clean && (
            <Button
              size="sm"
              disabled={apply.isPending}
              onClick={() =>
                apply.mutate(
                  { registrationId: record.id, fileName: pending.fileName, text: pending.text, actorId, actorName },
                  { onSuccess: () => setPending(null) },
                )
              }
            >
              Save learners from File 4
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
