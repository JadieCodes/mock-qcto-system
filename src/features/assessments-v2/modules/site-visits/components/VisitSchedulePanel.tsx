import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toIsoDate } from '../../../shared/dates/workingDays';
import { downloadXlsxFile } from '../../../shared/files/writeXlsx';
import { SectionCard } from '../../../shared/ui/PageSections';
import { useSiteVisits } from '../hooks';
import { monthLabel, NOT_YET_APPROVED_LABEL, scheduleTitle, visitScheduleFor, type ScheduleRow } from '../schedule';
import { NO_VISITS_BOOKED_MESSAGE, scheduleFileName, scheduleWorkbook } from '../scheduleXlsx';

const HEADINGS = ['QP/SDP', 'Type of visit', 'Institution', 'Physical address', 'Province', 'Occupational qualification', 'Date of visit', 'QCTO official(s)', 'Notice', 'Report stage'];
const DATE_COLUMN = 6;
const NOTICE_COLUMN = 8;
const REPORT_STAGE_COLUMN = 9;

// Next month, counted from today (the same UTC clock as the rest of the module).
function nextMonthFromToday(): { year: number; month: number } {
  const [year, month] = toIsoDate(new Date()).split('-').map(Number);
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

function rowCells(row: ScheduleRow): string[] {
  return [
    row.qpSdp || '—',
    row.visitTypeLabel,
    row.institution || '—',
    row.address || '—',
    row.province || '—',
    row.qualifications.join('; ') || '—',
    row.dateLabel,
    row.officials.join(', ') || '—',
    row.notice,
    row.reportStage,
  ];
}

// Batch Z2 (11.9): the integrated monthly schedule of every sub-unit's visits. It always reads ALL visits:
// the My / All scope toggle does not apply. Without onSelectVisit the rows are plain text (read-only access).
export function VisitSchedulePanel({ onSelectVisit }: { onSelectVisit?: (visitId: string) => void }) {
  const { data: visits = [] } = useSiteVisits();
  const [{ year, month }, setMonth] = useState(nextMonthFromToday);
  const [includePending, setIncludePending] = useState(false);
  const groups = useMemo(() => visitScheduleFor(visits, year, month, { includePending }), [visits, year, month, includePending]);

  const step = (delta: number) =>
    setMonth(({ year: y, month: m }) => {
      const index = y * 12 + (m - 1) + delta;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });

  const download = () => downloadXlsxFile(scheduleFileName(year, month), scheduleWorkbook(groups, year, month));

  return (
    <SectionCard title="Visit schedule">
      <div className="space-y-4 p-4 dark:bg-card dark:text-card-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label="Previous month" onClick={() => step(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-36 text-center text-sm font-semibold" aria-live="polite">
              {monthLabel(year, month)}
            </span>
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label="Next month" onClick={() => step(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="schedule-include-pending" checked={includePending} onCheckedChange={setIncludePending} />
            <Label htmlFor="schedule-include-pending" className="text-sm font-normal">
              Show visits still being approved
            </Label>
          </div>
          <Button type="button" variant="outline" size="sm" className="ml-auto gap-2" onClick={download}>
            <Download className="h-4 w-4" />
            Download schedule (Excel)
          </Button>
        </div>

        {groups.map((group) => (
          <section key={group.subUnit} aria-label={scheduleTitle(group.subUnit, year, month)} className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <h4 className="text-sm font-semibold">{scheduleTitle(group.subUnit, year, month)}</h4>
              <p className="text-xs text-muted-foreground">
                {group.visitCount} {group.visitCount === 1 ? 'visit' : 'visits'} · {group.daysOut} {group.daysOut === 1 ? 'day' : 'days'} out
              </p>
            </div>
            {group.rows.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">{NO_VISITS_BOOKED_MESSAGE}</p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {HEADINGS.map((h) => (
                        <TableHead key={h} className="whitespace-nowrap">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.rows.map((row) => (
                      <TableRow
                        key={row.visitId}
                        className={cn(onSelectVisit && 'cursor-pointer hover:bg-muted/50')}
                        onClick={onSelectVisit ? () => onSelectVisit(row.visitId) : undefined}
                      >
                        {rowCells(row).map((text, i) => (
                          <TableCell key={HEADINGS[i]} className={cn('align-top', i === DATE_COLUMN || i === NOTICE_COLUMN ? 'whitespace-nowrap' : 'min-w-32')}>
                            {i === REPORT_STAGE_COLUMN && row.pending ? (
                              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                {NOT_YET_APPROVED_LABEL}
                              </span>
                            ) : (
                              text
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        ))}
      </div>
    </SectionCard>
  );
}
