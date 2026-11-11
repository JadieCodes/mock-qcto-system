import { useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { CalendarDays, CalendarX2, ChevronLeft, ChevronRight, Download, List } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { publicHolidayOn } from '../../../config/holidays';
import { toIsoDate } from '../../../shared/dates/workingDays';
import { downloadXlsxFile } from '../../../shared/files/writeXlsx';
import { SectionCard } from '../../../shared/ui/PageSections';
import { useSiteVisits } from '../hooks';
import { monthLabel, NOT_YET_APPROVED_LABEL, visitScheduleFor, type ScheduleRow, type SubUnitSchedule } from '../schedule';
import { NO_VISITS_BOOKED_MESSAGE, scheduleFileName, scheduleWorkbook } from '../scheduleXlsx';
import { calendarWeeks, dateBlockOf, dayNumber, initialsOf, monthShort,shortVisitType, summaryFiguresOf, weekdayShort, type CalendarDay, type DayChip } from '../scheduleView';
import { SUB_UNIT_COLOURS, SUB_UNIT_LABELS, type SubUnit } from '../subUnits';

type ViewMode = 'calendar' | 'list';

const WEEKDAY_HEADINGS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_CHIPS_PER_DAY = 3;
const MAX_AVATARS = 3;
const MAX_QUALIFICATION_CHIPS = 3;
const MAX_NAMES_IN_TEXT = 2;
// A short label that always sits beside a chip's colour.
const SUB_UNIT_SHORT: Record<SubUnit, string> = {
  'assessment-standards': 'AS',
  'eisa-registrations': 'EISA',
  'approval-of-results': 'AoR',
  other: 'Other',
};

// Next month, counted from today (the same UTC clock as the rest of the module).
function nextMonthFromToday(): { year: number; month: number } {
  const [year, month] = toIsoDate(new Date()).split('-').map(Number);
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

const MD_QUERY = '(min-width: 768px)';

function subscribeToMd(onChange: () => void): () => void {
  const mql = window.matchMedia(MD_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function useIsMd(): boolean {
  return useSyncExternalStore(
    subscribeToMd,
    () => window.matchMedia(MD_QUERY).matches,
    () => true,
  );
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function splitQualification(text: string): { title: string; saqaId: string | null } {
  const match = /^(.*) \(SAQA ID (.+)\)$/.exec(text);
  return match ? { title: match[1], saqaId: match[2] } : { title: text, saqaId: null };
}

// "Amanda Nkosi" -> "A. Nkosi"; a single word stays as it is.
function shortName(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  return words.length < 2 ? name : `${words[0][0].toUpperCase()}. ${words.slice(1).join(' ')}`;
}

function visitAriaLabel(row: ScheduleRow, subUnit: SubUnit): string {
  return `${shortVisitType(row)}, ${row.institution || 'no institution'}, ${row.dateLabel}, ${SUB_UNIT_LABELS[subUnit]}${row.pending ? ', not yet approved' : ''}`;
}

function VisitTooltipBody({ row, subUnit }: { row: ScheduleRow; subUnit: SubUnit }) {
  return (
    <div className="max-w-64 space-y-1 text-xs">
      {row.qpSdp && <p>QP/SDP: {row.qpSdp}</p>}
      <p className="font-semibold">{row.visitTypeLabel}</p>
      <p>{row.institution || '—'}</p>
      {row.address && <p>Address: {row.address}</p>}
      <p className="text-muted-foreground">
        {SUB_UNIT_LABELS[subUnit]}
        {row.province ? ` · ${row.province}` : ''}
      </p>
      {row.qualifications.length > 0 && <p>{row.qualifications.join('; ')}</p>}
      <p>{row.dateLabel}</p>
      <p>{row.officials.length > 0 ? `Officials: ${row.officials.join(', ')}` : 'No officials named'}</p>
      <p className="text-muted-foreground">
        {row.notice} · {row.pending ? NOT_YET_APPROVED_LABEL : row.reportStage}
      </p>
    </div>
  );
}

function VisitChip({ chip, onSelectVisit }: { chip: DayChip; onSelectVisit?: (visitId: string) => void }) {
  const { row, subUnit } = chip;
  const colours = SUB_UNIT_COLOURS[subUnit];
  const className = cn(
    'block w-full min-w-0 rounded border border-l-4 px-1.5 py-1 text-left text-[11px] leading-tight',
    colours.tint,
    colours.edge,
    colours.leftBorder,
    colours.text,
    row.pending && 'border-dashed',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  );
  const body = (
    <>
      <span className="block truncate font-semibold">
        <span className="mr-1 text-[9px] font-bold uppercase opacity-70">{SUB_UNIT_SHORT[subUnit]}</span>
        {shortVisitType(row)}
      </span>
      <span className="block truncate">{row.institution || '—'}</span>
      {chip.dayCount > 1 && (
        <span className="block truncate opacity-80">
          day {chip.dayIndex} of {chip.dayCount}
        </span>
      )}
    </>
  );
  const label = `${visitAriaLabel(row, subUnit)}${chip.dayCount > 1 ? `, day ${chip.dayIndex} of ${chip.dayCount}` : ''}`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {onSelectVisit ? (
          <button type="button" className={cn(className, 'hover:brightness-95 dark:hover:brightness-125')} aria-label={label} onClick={() => onSelectVisit(row.visitId)}>
            {body}
          </button>
        ) : (
          <div tabIndex={0} role="group" className={className} aria-label={label}>
            {body}
          </div>
        )}
      </TooltipTrigger>
      <TooltipContent>
        <VisitTooltipBody row={row} subUnit={subUnit} />
      </TooltipContent>
    </Tooltip>
  );
}

function CalendarCell({ day, onSelectVisit }: { day: CalendarDay; onSelectVisit?: (visitId: string) => void }) {
  const holiday = publicHolidayOn(day.iso);
  const shown = day.chips.slice(0, MAX_CHIPS_PER_DAY);
  const hidden = day.chips.length - shown.length;
  if (day.weekend) {
    return (
      <div className={cn('min-h-24 border-l bg-muted/60 p-1 text-center text-[10px] text-muted-foreground', !day.inMonth && 'opacity-50')}>
        <span>{dayNumber(day.iso)}</span>
        {day.chips.length > 0 && (
          <span className="mt-1 block font-semibold text-foreground" aria-label={plural(day.chips.length, 'visit', 'visits')}>
            {day.chips.length}
          </span>
        )}
      </div>
    );
  }
  return (
    <div className={cn('min-h-24 min-w-0 space-y-1 border-l p-1', !day.inMonth && 'bg-muted/30 opacity-50')}>
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-xs font-medium">{dayNumber(day.iso)}</span>
        {holiday && (
          <span className="truncate rounded bg-rose-100 px-1 text-[9px] font-medium text-rose-800 dark:bg-rose-950 dark:text-rose-200" title={holiday.name}>
            {holiday.name}
          </span>
        )}
      </div>
      {shown.map((chip) => (
        <VisitChip key={chip.row.visitId} chip={chip} onSelectVisit={onSelectVisit} />
      ))}
      {hidden > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="w-full rounded px-1 py-0.5 text-left text-[11px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${hidden} more visits on ${day.iso}`}>
              +{hidden} more
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-1.5 p-2">
            <p className="text-xs font-semibold">
              {weekdayShort(day.iso)} {dayNumber(day.iso)} {monthShort(day.iso)}: {plural(day.chips.length, 'visit', 'visits')}
            </p>
            {day.chips.map((chip) => (
              <VisitChip key={chip.row.visitId} chip={chip} onSelectVisit={onSelectVisit} />
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function CalendarView({ year, month, groups, onSelectVisit }: { year: number; month: number; groups: SubUnitSchedule[]; onSelectVisit?: (visitId: string) => void }) {
  const weeks = useMemo(() => calendarWeeks(year, month, groups), [year, month, groups]);
  const columns = 'grid grid-cols-[repeat(5,minmax(0,1fr))_2.5rem_2.5rem]';
  return (
    <div className="overflow-hidden rounded-lg border" role="group" aria-label={`Calendar for ${monthLabel(year, month)}`}>
      <div className={cn(columns, 'bg-muted/60 text-center text-xs font-medium text-muted-foreground')}>
        {WEEKDAY_HEADINGS.map((h, i) => (
          <div key={h} className={cn('py-1.5', i >= 5 && 'border-l text-[10px]')}>
            {h}
          </div>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0].iso} className={cn(columns, 'border-t')}>
          {week.map((day) => (
            <CalendarCell key={day.iso} day={day} onSelectVisit={onSelectVisit} />
          ))}
        </div>
      ))}
    </div>
  );
}

function OfficialsAvatars({ names }: { names: string[] }) {
  if (names.length === 0) return <span className="text-xs text-muted-foreground">No officials named</span>;
  const shown = names.slice(0, MAX_AVATARS);
  const extra = names.length - shown.length;
  const textNames = names.slice(0, MAX_NAMES_IN_TEXT).map(shortName).join(', ');
  const textExtra = names.length - MAX_NAMES_IN_TEXT;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="relative z-10 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:justify-end" aria-label={`QCTO officials: ${names.join(', ')}`}>
          <span className="flex items-center -space-x-2">
          {shown.map((name) => (
            <Avatar key={name} className="h-7 w-7 ring-2 ring-card">
              <AvatarFallback className="bg-muted text-[10px] font-semibold text-foreground">{initialsOf(name)}</AvatarFallback>
            </Avatar>
          ))}
          {extra > 0 && (
            <Avatar className="h-7 w-7 ring-2 ring-card">
              <AvatarFallback className="bg-muted text-[10px] font-semibold text-foreground">+{extra}</AvatarFallback>
            </Avatar>
          )}
          </span>
          <span className="min-w-0 text-xs">
            {textNames}
            {textExtra > 0 && ` +${textExtra}`}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <ul className="text-xs">
          {names.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

function QualificationChips({ qualifications }: { qualifications: string[] }) {
  if (qualifications.length === 0) return null;
  const shown = qualifications.slice(0, MAX_QUALIFICATION_CHIPS);
  const extra = qualifications.length - shown.length;
  return (
    <div className="relative z-10 flex flex-wrap gap-1">
      {shown.map((text) => {
        const { title, saqaId } = splitQualification(text);
        return (
          <Tooltip key={text}>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="max-w-56 truncate rounded-full border bg-muted/50 px-2 py-0.5 text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {title}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-64 text-xs">
                {title}
                <br />
                {saqaId ? `SAQA ID ${saqaId}` : 'No SAQA ID'}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}
      {extra > 0 && <span className="rounded-full border bg-muted/50 px-2 py-0.5 text-[11px]">+{extra} more</span>}
    </div>
  );
}

function VisitCard({ row, subUnit, onSelectVisit }: { row: ScheduleRow; subUnit: SubUnit; onSelectVisit?: (visitId: string) => void }) {
  const colours = SUB_UNIT_COLOURS[subUnit];
  const block = dateBlockOf(row.startDate, row.endDate);
  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 rounded-lg border border-l-4 bg-card p-3 text-card-foreground shadow-sm transition-all sm:flex-row sm:items-start',
        colours.leftBorder,
        row.pending && 'border-dashed',
        onSelectVisit && 'hover:-translate-y-0.5 hover:shadow-md',
      )}
    >
      {onSelectVisit && (
        <button type="button" className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Open visit: ${visitAriaLabel(row, subUnit)}`} onClick={() => onSelectVisit(row.visitId)} />
      )}
      <div className={cn('flex w-full shrink-0 items-baseline gap-2 rounded-md px-2 py-1.5 sm:w-20 sm:flex-col sm:items-center sm:gap-0 sm:text-center', colours.tint, colours.text)}>
        <span className={cn('font-bold leading-none', block.big.length > 2 ? 'text-xl' : 'text-2xl')}>{block.big}</span>
        <span className="text-[11px] font-medium">{block.small}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-bold">{row.visitTypeLabel}</p>
        <p className="text-sm">
          {row.institution || '—'}
          {row.province ? ` · ${row.province}` : ''}
        </p>
        <QualificationChips qualifications={row.qualifications} />
        {row.qpSdp && <p className="text-xs text-muted-foreground">QP/SDP: {row.qpSdp}</p>}
        {row.address && <p className="text-xs text-muted-foreground">Address: {row.address}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:max-w-56 sm:flex-col sm:items-end">
        <OfficialsAvatars names={row.officials} />
        <div className="flex flex-wrap gap-1 sm:justify-end">
          <Badge variant="outline" className={cn(row.notice === 'Unannounced' && 'border-orange-300 text-orange-800 dark:border-orange-700 dark:text-orange-300')}>
            {row.notice}
          </Badge>
          {row.pending ? (
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">{NOT_YET_APPROVED_LABEL}</span>
          ) : (
            <Badge variant="secondary" className="font-normal">
              {row.reportStage}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function ListView({ groups, onSelectVisit }: { groups: SubUnitSchedule[]; onSelectVisit?: (visitId: string) => void }) {
  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const colours = SUB_UNIT_COLOURS[group.subUnit];
        return (
          <section key={group.subUnit} aria-label={SUB_UNIT_LABELS[group.subUnit]} className="space-y-2">
            <div className={cn('flex flex-wrap items-center justify-between gap-x-4 rounded-md px-3 py-1.5', colours.bar)}>
              <h5 className="flex items-center gap-2 text-sm font-semibold">
                <span className={cn('h-2.5 w-2.5 rounded-full', colours.dot)} aria-hidden="true" />
                {SUB_UNIT_LABELS[group.subUnit]}
              </h5>
              <p className="text-xs">{plural(group.visitCount, 'visit', 'visits')}</p>
            </div>
            {group.rows.length === 0 ? (
              <p className="px-3 text-sm text-muted-foreground">{NO_VISITS_BOOKED_MESSAGE}</p>
            ) : (
              group.rows.map((row) => <VisitCard key={row.visitId} row={row} subUnit={group.subUnit} onSelectVisit={onSelectVisit} />)
            )}
          </section>
        );
      })}
    </div>
  );
}

function SummaryTile({ group, selected, onToggle, slim }: { group: SubUnitSchedule; selected: boolean; onToggle: () => void; slim?: boolean }) {
  const colours = SUB_UNIT_COLOURS[group.subUnit];
  const figures = summaryFiguresOf(group);
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        'w-full min-w-0 rounded-xl border border-l-4 bg-card text-left text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        colours.leftBorder,
        slim ? 'px-3 py-2' : 'p-4',
        selected && colours.ring,
      )}
    >
      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', colours.dot)} aria-hidden="true" />
        <span className="truncate">{SUB_UNIT_LABELS[group.subUnit]}</span>
      </span>
      <span className={cn('block font-bold tracking-tight', slim ? 'text-lg' : 'mt-1 text-3xl')}>{group.visitCount}</span>
      <span className="block text-xs text-muted-foreground">
        {plural(group.daysOut, 'day', 'days')} out · {plural(figures.provinces, 'province', 'provinces')} · {plural(figures.officials, 'official', 'officials')}
      </span>
    </button>
  );
}

function EmptyMonth({ title }: { title: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-12 text-center">
      <CalendarX2 className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">Switch on “Show visits still being approved” to also see visits that are not booked yet.</p>
    </div>
  );
}

// Batch Z2 (11.9): the integrated monthly schedule of every sub-unit's visits. It always reads ALL visits:
// the My / All scope toggle does not apply. Without onSelectVisit nothing is clickable (read-only access).
// Batch Z3: look only. The data comes from visitScheduleFor and the Excel from scheduleWorkbook, both unchanged.
export function VisitSchedulePanel({ onSelectVisit }: { onSelectVisit?: (visitId: string) => void }) {
  const { data: visits = [] } = useSiteVisits();
  const [{ year, month }, setMonth] = useState(nextMonthFromToday);
  const [includePending, setIncludePending] = useState(false);
  const [view, setView] = useState<ViewMode>('calendar');
  const [selected, setSelected] = useState<SubUnit | null>(null);
  const isMd = useIsMd();
  const groups = useMemo(() => visitScheduleFor(visits, year, month, { includePending }), [visits, year, month, includePending]);

  const tileGroups = useMemo(() => groups.filter((g) => g.subUnit !== 'other' || g.visitCount > 0), [groups]);
  const activeFilter = selected && tileGroups.some((g) => g.subUnit === selected) ? selected : null;
  const shownGroups = useMemo(() => (activeFilter ? tileGroups.filter((g) => g.subUnit === activeFilter) : tileGroups), [tileGroups, activeFilter]);
  const totalVisits = groups.reduce((sum, g) => sum + g.visitCount, 0);
  const effectiveView: ViewMode = isMd ? view : 'list';
  const title = monthLabel(year, month);

  const step = (delta: number) =>
    setMonth(({ year: y, month: m }) => {
      const index = y * 12 + (m - 1) + delta;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });

  const download = () => downloadXlsxFile(scheduleFileName(year, month), scheduleWorkbook(groups, year, month));

  return (
    <SectionCard title="Visit schedule">
      <TooltipProvider delayDuration={200}>
        <div className="space-y-4 p-4 dark:bg-card dark:text-card-foreground">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <h4 className="text-2xl font-semibold tracking-tight" aria-live="polite">
                {title}
              </h4>
              <div className="flex items-center gap-1">
                <Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label="Previous month" onClick={() => step(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" className="h-8 w-8" aria-label="Next month" onClick={() => step(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setMonth(nextMonthFromToday())}>
                Today&rsquo;s month
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch id="schedule-include-pending" checked={includePending} onCheckedChange={setIncludePending} />
                <Label htmlFor="schedule-include-pending" className="text-sm font-normal">
                  Show visits still being approved
                </Label>
              </div>
              <ToggleGroup type="single" variant="outline" size="sm" value={effectiveView} onValueChange={(v) => v && setView(v as ViewMode)} className="hidden md:flex" aria-label="View">
                <ToggleGroupItem value="calendar" aria-label="Calendar view" className="gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Calendar
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view" className="gap-1.5">
                  <List className="h-4 w-4" />
                  List
                </ToggleGroupItem>
              </ToggleGroup>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={download}>
                <Download className="h-4 w-4" />
                Download schedule (Excel)
              </Button>
            </div>
          </div>

          {totalVisits === 0 ? (
            <EmptyMonth title={`No visits booked for ${title}`} />
          ) : (
            <>
              <div className="space-y-2">
                <div className="grid gap-3 sm:grid-cols-3">
                  {tileGroups
                    .filter((g) => g.subUnit !== 'other')
                    .map((g) => (
                      <SummaryTile key={g.subUnit} group={g} selected={activeFilter === g.subUnit} onToggle={() => setSelected(activeFilter === g.subUnit ? null : g.subUnit)} />
                    ))}
                </div>
                {tileGroups
                  .filter((g) => g.subUnit === 'other')
                  .map((g) => (
                    <SummaryTile key={g.subUnit} group={g} slim selected={activeFilter === g.subUnit} onToggle={() => setSelected(activeFilter === g.subUnit ? null : g.subUnit)} />
                  ))}
              </div>
              {effectiveView === 'calendar' ? <CalendarView year={year} month={month} groups={shownGroups} onSelectVisit={onSelectVisit} /> : <ListView groups={shownGroups} onSelectVisit={onSelectVisit} />}
            </>
          )}
        </div>
      </TooltipProvider>
    </SectionCard>
  );
}
