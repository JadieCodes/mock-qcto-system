import { useState } from 'react';
import { Download, FileCheck2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { downloadCsvFile, EXCEL_UPLOAD_TIP } from '../../../shared/csv/csv';
import { fileUploadIssue } from '../../../shared/files/fileCheck';
import { DocumentChecked } from '../../../shared/files/FileCheckNotice';
import { ID_ZERO_RESTORED_NOTE } from '../../../shared/validation/saIdNumber';
import { FISA_RESULT_CODE_LIST } from '../config';
import {
  buildFisaSpreadsheetCsv,
  fisaSheetFileName,
  parseFisaSpreadsheet,
  type FisaSheetBatch,
  type FisaSheetLearner,
  type FisaSheetParseResult,
} from '../fisaLearnerSpreadsheet';
import type { LearnerResult } from '../types';

// Batch P (05.21): QCTO's Learner Data & Achievement sheet — download it for this batch, fill in
// DATE OF FISA and FINAL FISA RESULT, upload it as CSV and see a preview with an error per row.
// Only a clean file fills the outcomes and is attached as the "Learner spreadsheet" evidence
// (onClean); the SDP can still edit the outcomes afterwards.
export function FisaSpreadsheetUpload({
  batch,
  onBatch,
  enrolled,
  hasSpreadsheet,
  onClean,
}: {
  batch: FisaSheetBatch;
  onBatch: LearnerResult[];
  enrolled: FisaSheetLearner[];
  hasSpreadsheet: boolean;
  onClean: (learnerResults: LearnerResult[], file: { name: string; size: number; type: string }) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<FisaSheetParseResult, { ok: true }> | null>(null);

  const onPickFile = async (file: File | undefined) => {
    setResult(null);
    setFileError(null);
    setFileName(file?.name ?? null);
    if (!file) return;
    const emptyIssue = fileUploadIssue(file);
    if (emptyIssue) {
      setFileError(emptyIssue);
      return;
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFileError('Only CSV files can be uploaded. In your spreadsheet program, choose "Save as" and pick CSV.');
      return;
    }
    const parsed = parseFisaSpreadsheet(await file.text(), batch, onBatch, enrolled);
    if (!parsed.ok) {
      setFileError(parsed.error);
      return;
    }
    setResult(parsed);
    if (parsed.learnerResults) onClean(parsed.learnerResults, { name: file.name, size: file.size, type: file.type || 'text/csv' });
  };

  const rowsWithErrors = result ? result.rows.filter((r) => r.errors.length > 0).length : 0;
  const missingCount = result ? result.missingLearners.length : 0;
  const problems = [
    rowsWithErrors > 0 ? `${rowsWithErrors} row${rowsWithErrors > 1 ? 's' : ''} with errors` : null,
    missingCount > 0 ? `${missingCount} learner${missingCount > 1 ? 's' : ''} missing from the file` : null,
  ].filter((p) => p !== null);

  return (
    <div className="space-y-3 rounded-xl border bg-gray-50/60 p-3">
      <div>
        <p className="text-sm font-medium">Learner spreadsheet (CSV)</p>
        <p className="text-xs text-gray-500">
          QCTO&apos;s Learner Data &amp; Achievement sheet. Download it for the learners on this batch, fill in DATE OF FISA (YYYYMMDD) and FINAL FISA RESULT
          ({FISA_RESULT_CODE_LIST}) for each learner, and upload it. A clean file fills the results below and is added to the evidence as the Learner spreadsheet
          {hasSpreadsheet ? ' (it replaces the one already added)' : ''}.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={onBatch.length === 0}
          onClick={() => downloadCsvFile(fisaSheetFileName(batch), buildFisaSpreadsheetCsv(batch, onBatch, enrolled))}
        >
          <Download className="mr-1.5 h-4 w-4" />
          Download learner spreadsheet (CSV)
        </Button>
        <label
          htmlFor="fisa-sheet-upload"
          className="inline-flex h-9 cursor-pointer items-center rounded-md border bg-white px-3 text-sm font-medium hover:bg-gray-50 has-[:focus-visible]:ring-2"
        >
          <Upload className="mr-1.5 h-4 w-4" />
          Upload learner spreadsheet (CSV)
          <input
            id="fisa-sheet-upload"
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              void onPickFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        {fileName && <span className="font-mono text-xs text-gray-500">{fileName}</span>}
        {fileName && !fileError && <DocumentChecked />}
      </div>
      {onBatch.length === 0 && <p className="text-xs text-gray-500">Add the learners to this batch first; the download has one row for each of them.</p>}
      <p className="text-xs text-gray-500">{EXCEL_UPLOAD_TIP}</p>

      {fileError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {fileError}
        </p>
      )}

      {result && (
        <div className="space-y-2">
          {result.learnerResults ? (
            <p role="status" className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-800">
              <FileCheck2 className="h-4 w-4 shrink-0" />
              The file is clean. The results are now in the list below and the file is added to the evidence as the Learner spreadsheet. You can still edit the
              results before you submit.
            </p>
          ) : (
            <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
              Nothing was changed. Fix {problems.join(' and ')} and upload the file again.
            </p>
          )}
          <div className="max-h-64 overflow-auto rounded-lg border bg-white">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="p-2 font-medium">Row</th>
                  <th className="p-2 font-medium whitespace-nowrap">ID number</th>
                  <th className="p-2 font-medium">Learner</th>
                  <th className="p-2 font-medium whitespace-nowrap">DATE OF FISA</th>
                  <th className="p-2 font-medium whitespace-nowrap">FINAL FISA RESULT</th>
                  <th className="p-2 font-medium">Check</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.rows.map((row) => (
                  <tr key={row.rowNumber} className={cn(row.errors.length > 0 && 'bg-red-50/60')}>
                    <td className="p-2">{row.rowNumber}</td>
                    <td className="p-2 font-mono whitespace-nowrap">
                      {row.idNumber}
                      {row.idZeroRestored && <span className="block font-sans text-[11px] text-gray-500">{ID_ZERO_RESTORED_NOTE}</span>}
                    </td>
                    <td className="p-2 whitespace-nowrap">{row.fullName}</td>
                    <td className="p-2 font-mono">{row.dateText}</td>
                    <td className="p-2 font-mono">{row.resultText}</td>
                    <td className="p-2 min-w-[14rem]">
                      {row.errors.length === 0 ? (
                        <span className="text-emerald-700">OK</span>
                      ) : (
                        <ul className="list-disc space-y-0.5 pl-4 text-red-700">
                          {row.errors.map((e) => (
                            <li key={e}>{e}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
                {result.missingLearners.map((l) => (
                  <tr key={l.learnerId} className="bg-red-50/60">
                    <td className="p-2">—</td>
                    <td className="p-2 font-mono whitespace-nowrap">{l.idNumber}</td>
                    <td className="p-2 whitespace-nowrap">{l.fullName}</td>
                    <td className="p-2" colSpan={2} />
                    <td className="p-2 text-red-700">Learner is on the batch but missing from the file.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
