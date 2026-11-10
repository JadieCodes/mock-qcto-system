// Demo seed (Batch W) — a quieter overdue list. The seed used to leave about 50 items overdue, which
// floods every list in a demo. This pass runs last, over the finished seed, and moves the audit entry
// that put each open item into its current stage (the "stage-entered" time the overdue list reads):
//   - a few items stay overdue on purpose (STAYS_OVERDUE), in different modules;
//   - every other open item entered its stage within the last SEED_RECENT_WORKING_DAYS working days.
// The escalation rule (ESCALATION_WORKING_DAYS) is not touched. Nothing else about a record changes:
// its stage, figures, letters and codes stay as they were; only when it got to the stage moves, together
// with the later audit entries and the notice written at the same moment, so the trail still reads in order.
import { buildCandidates, stageEntryOf, toItem, type CandidateSources, type TrailReader } from '../../../shared/administration/overdue';
import { isWorkingDay, subtractWorkingDays, toIsoDate } from '../../../shared/dates/workingDays';
import type { AuditEntry } from '../../../shared/audit/types';
import { todayIso, type SeedLog } from './helpers';

export const SEED_RECENT_WORKING_DAYS = 2;

// The items left overdue: six, in four modules. The three EISA results batches at the ASD are measured
// from their submission date, which cannot move (each was submitted within its own deadline); the other
// three are long waits at an internal stage in the Site Visits, RPL Toolkit and QASA modules.
const STAYS_OVERDUE: { source: string; stageId: string; labelStartsWith?: string }[] = [
  { source: 'results', stageId: 'ad-review' },
  { source: 'visit-planning', stageId: 'ad-planning', labelStartsWith: 'Welding ()' },
  { source: 'rpl', stageId: 'iac-review' },
  { source: 'qasa', stageId: 'asd-evaluation', labelStartsWith: 'Water and Wastewater' },
];

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

// Today, or the last working day if today is a weekend or public holiday, then `workingDaysBack` earlier.
function recentWorkingDate(workingDaysBack: number): string {
  let d = todayIso();
  while (!isWorkingDay(d)) d = toIsoDate(new Date(Date.parse(`${d}T00:00:00Z`) - DAY_MS));
  return workingDaysBack === 0 ? d : subtractWorkingDays(d, workingDaysBack);
}

function moveEntry(log: SeedLog, entry: AuditEntry, targetDate: string): void {
  const oldMs = Date.parse(entry.timestamp);
  const nowMs = Date.now();
  // Same time of day as before, but never later than a few minutes ago.
  const timeOfDay = oldMs % DAY_MS;
  const newMs = Math.min(Date.parse(`${targetDate}T00:00:00Z`) + timeOfDay, nowMs - 5 * MINUTE_MS);
  const delta = newMs - oldMs;
  if (delta <= 0) return;

  for (const other of log.audit) {
    if (other === entry || other.recordId !== entry.recordId || Date.parse(other.timestamp) <= oldMs) continue;
    other.timestamp = new Date(Math.min(Date.parse(other.timestamp) + delta, nowMs - MINUTE_MS)).toISOString();
    if (Date.parse(other.timestamp) <= newMs) other.timestamp = new Date(newMs + MINUTE_MS).toISOString();
  }
  for (const note of log.notifications) {
    if (note.createdAt !== entry.timestamp) continue;
    note.createdAt = new Date(newMs).toISOString();
    note.read = false;
  }
  entry.timestamp = new Date(newMs).toISOString();
}

export function quietenSeededWaits(log: SeedLog, sources: CandidateSources): void {
  const today = todayIso();
  const trailOf: TrailReader = (recordType, recordId) => log.audit.filter((e) => e.recordType === recordType && e.recordId === recordId);
  const waits = buildCandidates(sources).flatMap((candidate) => {
    const item = toItem(candidate, today, trailOf);
    return item ? [{ candidate, item }] : [];
  });
  // The oldest first, so the days they are spread over do not depend on the order the modules are listed.
  waits.sort((a, b) => b.item.workingDays - a.item.workingDays || a.item.key.localeCompare(b.item.key));

  let n = 0;
  for (const { candidate, item } of waits) {
    const stays = STAYS_OVERDUE.some((s) => s.source === item.source && s.stageId === item.stageId && (!s.labelStartsWith || item.itemLabel.startsWith(s.labelStartsWith)));
    if (stays || item.workingDays <= SEED_RECENT_WORKING_DAYS) continue;
    // A wait measured from the record's own date (not an audit entry) is set in that module's seed.
    const { entry } = stageEntryOf(candidate, trailOf);
    if (!entry) continue;
    moveEntry(log, entry, recentWorkingDate(n++ % (SEED_RECENT_WORKING_DAYS + 1)));
  }
}
