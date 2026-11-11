import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { downloadCsvFile } from '../../../shared/csv/csv';
import { toIsoDate } from '../../../shared/dates/workingDays';
import { SectionCard } from '../../../shared/ui/PageSections';
import { currentQuarterRange, financialYearQuarters, slashDate, type QuarterRange } from '../trackingRegister';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "202627Q1" -> "Q1 2026/27"
function pickTitle(q: QuarterRange): string {
  return `${q.label.slice(-2)} ${q.label.slice(0, 4)}/${q.label.slice(4, 6)}`;
}

// "Apr–Jun 2026"; Q4 falls in the next calendar year, so it reads "Jan–Mar 2027".
function pickRange(q: QuarterRange): string {
  const month = (iso: string) => MONTH_NAMES[Number(iso.slice(5, 7)) - 1];
  return `${month(q.from)}–${month(q.to)} ${q.to.slice(0, 4)}`;
}

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
  const quarters = financialYearQuarters(today);
  const activePick = quarters.find((q) => q.from === from && q.to === to)?.label ?? '';
  const fromAfterTo = Boolean(from && to && from > to);
  const rangeInvalid = !from || !to || fromAfterTo;

  function download() {
    const { csv, rowCount } = build(from, to);
    downloadCsvFile(`${fileNamePrefix}_${slashDate(from).replace(/\//g, '')}-${slashDate(to).replace(/\//g, '')}.csv`, csv);
    if (rowCount === 0) toast.info('No approved batch has an approval letter in this range. The file has the headings only.');
    else toast.success(`Tracking register downloaded (${rowCount} ${rowCount === 1 ? 'row' : 'rows'}).`);
  }

  function pick(label: string) {
    // Clicking the selected pick again would clear it; keep the dates and the selection instead.
    const q = quarters.find((x) => x.label === label);
    if (!q) return;
    setFrom(q.from);
    setTo(q.to);
  }

  return (
    <SectionCard
      title={
        <>
          Tracking register
          <span className="mt-1 block text-sm font-normal tracking-normal text-muted-foreground">
            Download approved results by the date the approval letter was issued.
          </span>
        </>
      }
    >
      <div className="space-y-5 p-6">
        <div className="space-y-2">
          <Label id={`${fileNamePrefix}-quarter-label`}>Financial year quarter</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={activePick}
            onValueChange={pick}
            aria-labelledby={`${fileNamePrefix}-quarter-label`}
            className="grid grid-cols-2 justify-stretch gap-2 sm:grid-cols-4 sm:gap-0"
          >
            {quarters.map((q) => (
              <ToggleGroupItem
                key={q.label}
                value={q.label}
                className="group h-auto flex-col gap-0.5 px-3 py-2 sm:-ml-px sm:rounded-none sm:first:ml-0 sm:first:rounded-l-md sm:last:rounded-r-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground"
              >
                <span className="text-sm font-medium">{pickTitle(q)}</span>
                <span className="text-xs font-normal text-muted-foreground group-data-[state=on]:text-primary-foreground/80">{pickRange(q)}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full space-y-1.5 sm:w-44">
            <Label htmlFor={`${fileNamePrefix}-from`}>From</Label>
            <Input id={`${fileNamePrefix}-from`} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="w-full space-y-1.5 sm:w-44">
            <Label htmlFor={`${fileNamePrefix}-to`}>To</Label>
            <Input id={`${fileNamePrefix}-to`} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button type="button" className="w-full gap-2 sm:w-auto" disabled={rangeInvalid} onClick={download}>
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        </div>

        {fromAfterTo && (
          <p role="alert" className="text-sm text-destructive">
            The From date must be on or before the To date.
          </p>
        )}
      </div>
    </SectionCard>
  );
}
