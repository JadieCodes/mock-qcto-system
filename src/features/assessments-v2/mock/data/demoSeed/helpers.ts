// Shared helpers for the demo seed (QCTO feedback Batch C). No records here — only:
// - relative dates (every seeded date is computed from today, so lead-time, registration-closing
//   and working-day rules hold whenever the seed runs),
// - stable seed ids in the same UUID format the real api functions use,
// - `step()`, which moves a workflow state the way shared/workflow/engine.ts performAction()
//   does (same checks, same audit entry shape) but with a past timestamp,
// - a log that collects the audit entries and notifications a stage implies.
import { isWorkingDay, toIsoDate } from '../../../shared/dates/workingDays';
import type { AuditEntry } from '../../../shared/audit/types';
import type { ChecklistSection } from '../../../shared/checklist/types';
import type { AppNotification } from '../../../shared/notifications/types';
import { getPerson } from '../../../shared/people/directory';
import type { Person } from '../../../shared/people/types';
import { canActInStage } from '../../../shared/workflow/engine';
import type { WorkflowDefinition, WorkflowRecordState } from '../../../shared/workflow/types';
import type { Role } from '../../../types';

// Notifications older than this are seeded as already read, so the banner is not a wall of
// months-old messages.
const READ_AFTER_DAYS = 7;
// South Africa is UTC+2 all year.
const SAST_OFFSET_HOURS = 2;

export interface SeedLog {
  audit: AuditEntry[];
  notifications: AppNotification[];
}

export function createSeedLog(): SeedLog {
  return { audit: [], notifications: [] };
}

export function seedPerson(id: string): Person {
  const person = getPerson(id);
  if (!person) throw new Error(`Demo seed: no person "${id}" in mock/data/users.ts or the QP/SDP directories.`);
  return person;
}

// Fixed ids in UUID format (8-4-4-4-12 hex, version 4) so later seed phases can link to them.
export function seedId(group: number, n: number): string {
  return `5eed${group.toString(16).padStart(4, '0')}-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

function shiftDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

function previousWorkingDay(iso: string): string {
  let d = iso;
  while (!isWorkingDay(d)) d = shiftDays(d, -1);
  return d;
}

export function nextWorkingDay(iso: string): string {
  let d = iso;
  while (!isWorkingDay(d)) d = shiftDays(d, 1);
  return d;
}

// A past working day, `daysAgo` calendar days back (moved back further if that is a weekend
// or public holiday).
export function workingDateAgo(daysAgo: number): string {
  return previousWorkingDay(shiftDays(todayIso(), -daysAgo));
}

// A future (or past, for a negative offset) working day, `offsetDays` from today (moved
// forward if that is a weekend or public holiday).
export function workingDateFromToday(offsetDays: number): string {
  return nextWorkingDay(shiftDays(todayIso(), offsetDays));
}

export function yearOf(iso: string): number {
  return Number(iso.slice(0, 4));
}

// Evenly spread `count` working days between `fromIso` and `toIso`, shifted by `shiftDays`.
export function spreadWorkingDates(fromIso: string, toIso: string, count: number, shift = 0): string[] {
  const from = new Date(`${fromIso}T00:00:00Z`).getTime();
  const span = new Date(`${toIso}T00:00:00Z`).getTime() - from;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(from + (span * (i + 0.5)) / count);
    return nextWorkingDay(shiftDays(toIsoDate(d), shift));
  });
}

// A per-record clock: timestamps on working days at a SAST office hour, always later than the
// previous one, so a record's audit trail reads in the order its steps happened.
export interface SeedClock {
  at: (daysAgo: number, hour?: number) => string;
}

export function createClock(): SeedClock {
  let last = 0;
  return {
    at(daysAgo, hour = 9) {
      const [y, m, d] = workingDateAgo(daysAgo).split('-').map(Number);
      let ms = Date.UTC(y, m - 1, d, hour - SAST_OFFSET_HOURS, 0);
      if (ms <= last) ms = last + 20 * 60 * 1000;
      last = ms;
      return new Date(ms).toISOString();
    },
  };
}

export function dateOf(timestamp: string): string {
  return timestamp.slice(0, 10);
}

export interface SeedStepParams {
  definition: WorkflowDefinition;
  state: WorkflowRecordState;
  actionId: string;
  actor: Person;
  at: string;
  recordType: string;
  recordId: string;
  note?: string;
}

// Mirrors shared/workflow/engine.ts performAction(): same stage/role/different-actor/note
// checks and the same audit entry, but with the seeded timestamp. A seed mistake throws here
// instead of quietly writing a record no real action could have produced.
export function step(log: SeedLog, params: SeedStepParams): WorkflowRecordState {
  const { definition, state, actionId, actor, at, recordType, recordId, note } = params;
  const action = definition.actions.find((a) => a.id === actionId && a.fromStage === state.stageId);
  if (!action) throw new Error(`Demo seed: "${actionId}" is not available from "${state.stageId}" (${definition.id}).`);
  if (!canActInStage(definition, state.stageId, actor.role)) {
    throw new Error(`Demo seed: ${actor.role} may not act in "${state.stageId}" (${definition.id}).`);
  }
  if (action.requiresDifferentActor && state.submittedById === actor.id) {
    throw new Error(`Demo seed: ${actor.name} cannot approve their own submission (${definition.id}).`);
  }
  if (action.requiresNote && !note?.trim()) {
    throw new Error(`Demo seed: "${action.label}" needs a note (${definition.id}).`);
  }
  log.audit.push({
    id: crypto.randomUUID(),
    recordType,
    recordId,
    actorRole: actor.role,
    actorId: actor.id,
    actorName: actor.name,
    action: action.label,
    note,
    timestamp: at,
  });
  return { ...state, stageId: action.toStage, submittedBy: actor.name, submittedById: actor.id };
}

// For the few api functions that write an audit entry directly (appendAuditEntry) rather than
// through a workflow action, e.g. adding a sitting straight to the EISA Calendar.
export function audit(log: SeedLog, entry: Omit<AuditEntry, 'id' | 'actorId' | 'actorName' | 'actorRole'> & { actor: Person; actorRole?: Role }): void {
  const { actor, actorRole, ...rest } = entry;
  log.audit.push({ id: crypto.randomUUID(), actorRole: actorRole ?? actor.role, actorId: actor.id, actorName: actor.name, ...rest });
}

export function notify(log: SeedLog, at: string, notification: Pick<AppNotification, 'recipientRole' | 'title' | 'body'>): void {
  const ageDays = (Date.now() - new Date(at).getTime()) / (24 * 60 * 60 * 1000);
  log.notifications.push({ ...notification, id: crypto.randomUUID(), read: ageDays > READ_AFTER_DAYS, createdAt: at });
}

// Answers every line of a freshly built checklist (CR-011: every line has a comment).
// `overrides` sets a specific answer/comment on chosen item ids; `onlySectionIds` leaves every
// other section unanswered, for a checklist that is still being worked on.
export function answerChecklist(
  sections: ChecklistSection[],
  defaultComment: string,
  options: { overrides?: Record<string, { answer: 'yes' | 'no'; comment: string }>; onlySectionIds?: string[] } = {},
): ChecklistSection[] {
  return sections.map((section) => {
    if (options.onlySectionIds && !options.onlySectionIds.includes(section.id)) return section;
    return {
      ...section,
      items: section.items.map((item) => {
        const override = options.overrides?.[item.id];
        return override ? { ...item, ...override } : { ...item, answer: 'yes' as const, comment: defaultComment };
      }),
    };
  });
}
