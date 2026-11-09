import { useState } from 'react';
import { AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { downloadCsvFile, EXCEL_UPLOAD_TIP } from '../../../shared/csv/csv';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { filterExternalRecords } from '../../../shared/visibility/recordVisibility';
import { BULK_COLUMNS, BULK_TEMPLATE_FILE_NAME, buildTemplateCsv, parseBulkFile, toBatchInputs, type BulkRow } from '../bulkUpload';
import { useEisaSittings, useEligibleQualifications, useProposeBulkSittingBatches } from '../hooks';

// QCTO feedback 3.4: the QP downloads the template, fills in the dates, uploads it as CSV, checks
// the preview, and submits. Every row must pass before anything is submitted.
export function BulkUploadDatesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">{open && <BulkUploadForm onClose={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  );
}

function BulkUploadForm({ onClose }: { onClose: () => void }) {
  const { person } = useV2Role();
  const { data: allEligible = [] } = useEligibleQualifications();
  const { data: sittings = [] } = useEisaSittings();
  const submit = useProposeBulkSittingBatches();
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [rows, setRows] = useState<BulkRow[]>([]);

  const ownQualifications = filterExternalRecords(allEligible, person, { qpIdOf: (q) => q.qpId });
  const rowsWithErrors = rows.filter((r) => r.errors.length > 0).length;
  const canSubmit = rows.length > 0 && rowsWithErrors === 0 && !fileError;

  const onPickFile = async (file: File | undefined) => {
    setRows([]);
    setFileError(null);
    setFileName(file?.name ?? null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFileError('Only CSV files can be uploaded. In your spreadsheet program, choose "Save as" and pick CSV.');
      return;
    }
    const result = parseBulkFile(await file.text(), ownQualifications, sittings);
    if (result.ok) setRows(result.rows);
    else setFileError(result.error);
  };

  const onSubmit = () => {
    if (!canSubmit) return;
    submit.mutate(toBatchInputs(rows, person.name, person.id), { onSuccess: onClose });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload dates from a spreadsheet</DialogTitle>
        <DialogDescription>
          Add many EISA dates at once. Each qualification and year in the file is submitted as one proposal for QCTO review.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label>1. Download the template</Label>
          <p className="text-xs text-gray-500">
            It lists your qualifications with accredited SDPs, one row per required sitting. Fill in the EISA date on each row (YYYY-MM-DD).
            Columns: {Object.values(BULK_COLUMNS).join(', ')}.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={ownQualifications.length === 0}
            onClick={() => downloadCsvFile(BULK_TEMPLATE_FILE_NAME, buildTemplateCsv(ownQualifications))}
          >
            <Download className="h-4 w-4" />
            Download template (CSV)
          </Button>
          {ownQualifications.length === 0 && <p className="text-xs text-gray-400">No qualifications with accredited SDPs under your ambit yet.</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bulk-dates-file">2. Choose your file</Label>
          <p className="text-xs text-gray-500">{EXCEL_UPLOAD_TIP}</p>
          <input id="bulk-dates-file" type="file" accept=".csv,text/csv" className="block text-sm"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              // Cleared so choosing the same file again (after fixing it) is read again.
              e.currentTarget.value = '';
              void onPickFile(file);
            }}
          />
          {fileName && !fileError && rows.length > 0 && <p className="text-xs text-gray-500">{fileName}</p>}
        </div>

        {fileError && (
          <Alert className="border-red-300 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{fileError}</AlertDescription>
          </Alert>
        )}

        {rows.length > 0 && (
          <div className="space-y-2">
            <Label>3. Check the preview</Label>
            {rowsWithErrors > 0 ? (
              <Alert className="border-amber-500 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  {rowsWithErrors} of {rows.length} row{rows.length === 1 ? '' : 's'} need fixing. Correct them in your spreadsheet, save it as CSV
                  again and choose the file again.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-emerald-300 bg-emerald-50">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800">All {rows.length} rows are ready to submit.</AlertDescription>
              </Alert>
            )}
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {['Row', 'Qualification title', 'Qualification ID', 'NQF level', 'Credits', 'EISA date', 'Registration closes', 'QP', 'Checks'].map((h) => (
                        <TableHead key={h} className="whitespace-nowrap">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.rowNumber} className={cn(r.errors.length > 0 && 'bg-red-50/50')}>
                        <TableCell className="text-xs text-gray-500">{r.rowNumber}</TableCell>
                        <TableCell className="max-w-[180px] truncate">{r.qualificationTitle || '—'}</TableCell>
                        <TableCell className="font-mono text-xs">{r.qualificationId || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.nqfLevel || '—'}</TableCell>
                        <TableCell>{r.credits || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.date ?? (r.dateText || '—')}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.registrationCloses ?? '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">{person.name}</TableCell>
                        <TableCell className="min-w-[240px]">
                          {r.errors.length === 0 ? (
                            <span className="text-xs text-emerald-700">OK</span>
                          ) : (
                            <ul className="space-y-0.5 text-xs text-red-700">
                              {r.errors.map((e) => (
                                <li key={e}>{e}</li>
                              ))}
                            </ul>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" disabled={!canSubmit || submit.isPending} onClick={onSubmit}>
          Submit for QCTO Review
        </Button>
      </DialogFooter>
    </>
  );
}
