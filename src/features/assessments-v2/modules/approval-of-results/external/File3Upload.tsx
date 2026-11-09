import { useState } from 'react';
import { Download, FileCheck2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { downloadCsvFile } from '../../../shared/csv/csv';
import { buildFile3TemplateCsv, file3TemplateFileName, parseFile3, type File3ParseResult } from '../file3';
import type { CaptureLearner, EisaLearnerResult, ResultsComponent } from '../types';

// QCTO feedback 05.24: File 3 — download the template for this batch, upload it as CSV, see a
// preview with an error per row. Only a clean file fills the capture grid (onFill); the QP can
// still edit the grid before submitting.
export function File3Upload({
  sittingDate,
  components,
  learners,
  onFill,
}: {
  sittingDate: string;
  components: ResultsComponent[];
  learners: CaptureLearner[];
  onFill: (results: EisaLearnerResult[]) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<File3ParseResult, { ok: true }> | null>(null);

  const onPickFile = async (file: File | undefined) => {
    setResult(null);
    setFileError(null);
    setFileName(file?.name ?? null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setFileError('Only CSV files can be uploaded. In your spreadsheet program, choose "Save as" and pick CSV.');
      return;
    }
    const parsed = parseFile3(await file.text(), components, learners);
    if (!parsed.ok) {
      setFileError(parsed.error);
      return;
    }
    setResult(parsed);
    if (parsed.learnerResults) onFill(parsed.learnerResults);
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
        <p className="text-sm font-medium">File 3 (CSV)</p>
        <p className="text-xs text-gray-500">
          Capture on screen, or download the template, fill in the marks and upload it. Columns: Learner ID number, Learner name, one column per component, Absent (Y/N).
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => downloadCsvFile(file3TemplateFileName(sittingDate), buildFile3TemplateCsv(components, learners))}
        >
          <Download className="mr-1.5 h-4 w-4" />
          Download template (CSV)
        </Button>
        <label
          htmlFor="file3-upload"
          className="inline-flex h-9 cursor-pointer items-center rounded-md border bg-white px-3 text-sm font-medium hover:bg-gray-50 has-[:focus-visible]:ring-2"
        >
          <Upload className="mr-1.5 h-4 w-4" />
          Upload File 3 (CSV)
          <input
            id="file3-upload"
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
      </div>

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
              The file is clean and the marks are now in the grid below. You can still edit them before you submit.
            </p>
          ) : (
            <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800">
              The grid was not changed. Fix {problems.join(' and ')} and upload the file again.
            </p>
          )}
          <div className="max-h-64 overflow-auto rounded-lg border bg-white">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="p-2 font-medium">Row</th>
                  <th className="p-2 font-medium whitespace-nowrap">ID number</th>
                  <th className="p-2 font-medium">Learner</th>
                  {components.map((c) => (
                    <th key={c.id} className="p-2 font-medium whitespace-nowrap">
                      {c.name}
                    </th>
                  ))}
                  <th className="p-2 font-medium">Absent</th>
                  <th className="p-2 font-medium">Check</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {result.rows.map((row) => (
                  <tr key={row.rowNumber} className={cn(row.errors.length > 0 && 'bg-red-50/60')}>
                    <td className="p-2">{row.rowNumber}</td>
                    <td className="p-2 font-mono whitespace-nowrap">{row.idNumber}</td>
                    <td className="p-2 whitespace-nowrap">{row.fullName}</td>
                    {components.map((c) => (
                      <td key={c.id} className="p-2">
                        {row.markTexts[c.id]}
                      </td>
                    ))}
                    <td className="p-2">{row.absent ? 'Y' : 'N'}</td>
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
                    <td className="p-2" colSpan={components.length + 1} />
                    <td className="p-2 text-red-700">Learner missing from the file.</td>
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
