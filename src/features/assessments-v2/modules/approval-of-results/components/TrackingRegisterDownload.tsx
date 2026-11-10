import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { downloadCsvFile } from '../../../shared/csv/csv';
import { toIsoDate } from '../../../shared/dates/workingDays';
import { currentQuarterRange, financialYearQuarters, slashDate } from '../trackingRegister';

// Batch N2 (29.28, 29.35): "Download tracking register (CSV)" on the internal dashboard. The range
// is on the approval-letter date and starts as the current QCTO quarter (financial year, April to
// March); each quarter of the financial year is a quick pick.
export function TrackingRegisterDownload({
  fileNamePrefix,
  build,
}: {
  fileNamePrefix: string;
  build: (from: string, to: string) => { csv: string; rowCount: number };
}) {
  const today = toIsoDate(new Date());
  const initial = currentQuarterRange(today);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const rangeInvalid = !from || !to || from > to;

  function download() {
    const { csv, rowCount } = build(from, to);
    downloadCsvFile(`${fileNamePrefix}_${slashDate(from).replace(/\//g, '')}-${slashDate(to).replace(/\//g, '')}.csv`, csv);
    if (rowCount === 0) toast.info('No approved batch has an approval letter in this range. The file has the headings only.');
    else toast.success(`Tracking register downloaded (${rowCount} ${rowCount === 1 ? 'row' : 'rows'}).`);
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking register (approval letter date)</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${fileNamePrefix}-from`}>From</Label>
          <Input id={`${fileNamePrefix}-from`} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${fileNamePrefix}-to`}>To</Label>
          <Input id={`${fileNamePrefix}-to`} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button type="button" size="sm" className="gap-2" disabled={rangeInvalid} onClick={download}>
          <Download className="h-4 w-4" />
          Download tracking register (CSV)
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">Quick picks:</span>
        {financialYearQuarters(today).map((q) => (
          <Button
            key={q.label}
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setFrom(q.from);
              setTo(q.to);
            }}
          >
            {q.label}
          </Button>
        ))}
      </div>
      {rangeInvalid && <p className="text-xs text-amber-700">Choose a From date that is not after the To date.</p>}
    </div>
  );
}
