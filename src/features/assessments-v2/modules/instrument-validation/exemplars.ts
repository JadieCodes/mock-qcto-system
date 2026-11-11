import type { EisaSitting } from '../eisa-calendar/types';
import type {
  InstrumentValidationRecord,
  StoredInstrumentValidationRecord,
  SubmittedInstrument,
  ValidationOutcome,
} from './types';

// Batch U (29.6): the rules about instruments and the exemplar live here, as plain functions,
// so the api, the screens and the seed all use the same ones.

export const NO_EXEMPLAR_LABEL = 'No exemplar in this submission';
export const NOT_FOR_A_SITTING_LABEL = 'Not for a specific sitting';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "09 Nov 2026" from an ISO date or timestamp.
export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
}

// Assumption (progress.md, Batch U): a record stored before Batch U has one instrument. It becomes
// a one-item array proposed as the exemplar, and when the record is already validated it is also
// the confirmed exemplar, so existing validated qualifications still show an exemplar.
// Mapping a mapped record returns it unchanged.
export function mapStoredRecord(stored: StoredInstrumentValidationRecord): InstrumentValidationRecord {
  const { instrument, instruments, ...rest } = stored;
  if (instruments) return { ...rest, instruments };
  const mapped: SubmittedInstrument[] = instrument
    ? [
        {
          id: `${stored.id}-instrument-1`,
          fileName: instrument.fileName,
          fileSize: instrument.fileSize,
          uploadedAt: instrument.uploadedAt,
          sittingId: null,
          sittingDate: null,
          proposedExemplar: true,
          confirmedExemplar: stored.instrumentStatus === 'validated',
        },
      ]
    : [];
  return { ...rest, instruments: mapped };
}

export function latestOutcome(record: InstrumentValidationRecord): ValidationOutcome | undefined {
  return record.outcomeHistory[record.outcomeHistory.length - 1];
}

export interface ExemplarStanding {
  instrumentId: string;
  recordId: string;
  // null while it is the current exemplar.
  replacedAt: string | null;
}

// Every confirmed exemplar of one qualification (records share a qualification through their
// QASA), each marked current or replaced. Normally the replaced ones carry replacedAt already;
// when two are still current (records mapped from before Batch U) the one validated last wins
// and the other counts as replaced on that date.
export function exemplarStandings(records: InstrumentValidationRecord[], qsaAddendumId: string): ExemplarStanding[] {
  const confirmed = records
    .filter((r) => r.qsaAddendumId === qsaAddendumId)
    .flatMap((r) =>
      r.instruments
        .filter((i) => i.confirmedExemplar)
        .map((i) => ({ instrument: i, recordId: r.id, validatedOn: latestOutcome(r)?.decidedAt ?? i.uploadedAt })),
    );
  const stillCurrent = confirmed.filter((c) => !c.instrument.replacedAt).sort((a, b) => b.validatedOn.localeCompare(a.validatedOn));
  const winner = stillCurrent[0];
  return confirmed.map((c) => ({
    instrumentId: c.instrument.id,
    recordId: c.recordId,
    replacedAt: c.instrument.replacedAt ?? (c === winner ? null : (winner?.validatedOn ?? null)),
  }));
}

export function currentExemplarOf(records: InstrumentValidationRecord[], qsaAddendumId: string): ExemplarStanding | null {
  return exemplarStandings(records, qsaAddendumId).find((s) => s.replacedAt === null) ?? null;
}

export function hasConfirmedExemplar(records: InstrumentValidationRecord[], qsaAddendumId: string): boolean {
  return currentExemplarOf(records, qsaAddendumId) !== null;
}

// The QP's submit rule. With no confirmed exemplar yet, exactly one instrument must be marked;
// otherwise at most one (none = "No exemplar in this submission"). Returns the problem, or null.
export function checkInstrumentsForSubmit(instruments: SubmittedInstrument[], hasExemplar: boolean): string | null {
  if (instruments.length === 0) return 'Upload the instrument before submitting it for validation.';
  const marked = instruments.filter((i) => i.proposedExemplar).length;
  if (marked > 1) return 'Only one instrument can be the proposed exemplar.';
  if (!hasExemplar && marked !== 1) return 'This qualification has no confirmed exemplar yet — mark exactly one instrument as the proposed exemplar.';
  return null;
}

export function proposedExemplarId(instruments: SubmittedInstrument[]): string | null {
  return instruments.find((i) => i.proposedExemplar)?.id ?? null;
}

export function exemplarChoiceDiffers(instruments: SubmittedInstrument[], chosenId: string | null): boolean {
  return chosenId !== proposedExemplarId(instruments);
}

// The ASD's rules when recording Approved or Approved with conditions. `chosenId` is one of the
// instruments in this submission, or null for "No exemplar in this submission". Returns the
// problem, or null.
export function checkExemplarChoice(
  instruments: SubmittedInstrument[],
  chosenId: string | null | undefined,
  hasExemplar: boolean,
  note: string | undefined,
): string | null {
  if (chosenId === undefined) return 'Choose the exemplar before recording an outcome.';
  if (chosenId === null) {
    if (!hasExemplar) return `"${NO_EXEMPLAR_LABEL}" is only allowed when the qualification already has a confirmed exemplar.`;
  } else if (!instruments.some((i) => i.id === chosenId)) {
    return 'The exemplar must be one of the instruments in this submission.';
  }
  if (exemplarChoiceDiffers(instruments, chosenId) && !note?.trim()) {
    return "Explain why the exemplar differs from the QP's proposal.";
  }
  return null;
}

export function instrumentSittingLabel(instrument: Pick<SubmittedInstrument, 'sittingDate'>): string {
  return instrument.sittingDate ? formatShortDate(instrument.sittingDate) : NOT_FOR_A_SITTING_LABEL;
}

export function outcomeLabel(decision: ValidationOutcome['decision']): string {
  return decision === 'approved' ? 'Approved' : decision === 'approved-with-conditions' ? 'Approved with conditions' : 'Not approved';
}

// "12 Mar 2027 (Theory – day 1 12 Mar, Practical – day 1 13 Mar)" for the sitting select.
export function sittingOptionLabel(sitting: Pick<EisaSitting, 'date' | 'componentDates'>): string {
  const parts = (sitting.componentDates ?? []).map((c) => `${c.componentName} – day ${c.day} ${formatShortDate(c.date).slice(0, 6)}`);
  return parts.length > 1 ? `${formatShortDate(sitting.date)} (${parts.join(', ')})` : formatShortDate(sitting.date);
}
