// CR-032: both the minimum lead time and the public-holiday source are open questions — see
// "Open questions" in progress.md. Kept together in one file so either can be swapped for the
// real figures/source without touching the calendar module itself.

// Assumption: expressed in working days, using the same shared helper Phase 6 needs for its
// 21-working-day results SLA (shared/dates/workingDays.ts). Change this one constant once
// QCTO confirms the real figure.
export const MIN_LEAD_TIME_WORKING_DAYS = 21;

export interface PublicHoliday {
  date: string; // ISO yyyy-mm-dd
  name: string;
}

// South Africa's public holidays for the next two years, for demo purposes. Source: best-effort
// from the Public Holidays Act (fixed dates + Easter-based dates + the "falls on a Sunday"
// roll-forward rule) — confirm the official source with QCTO before relying on this list.
export const SA_PUBLIC_HOLIDAYS: PublicHoliday[] = [
  // 2026
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-03-21', name: 'Human Rights Day' },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-04-06', name: 'Family Day' },
  { date: '2026-04-27', name: 'Freedom Day' },
  { date: '2026-05-01', name: "Workers' Day" },
  { date: '2026-06-16', name: 'Youth Day' },
  { date: '2026-08-09', name: "National Women's Day" },
  { date: '2026-09-24', name: 'Heritage Day' },
  { date: '2026-12-16', name: 'Day of Reconciliation' },
  { date: '2026-12-25', name: 'Christmas Day' },
  { date: '2026-12-26', name: 'Day of Goodwill' },

  // 2027
  { date: '2027-01-01', name: "New Year's Day" },
  { date: '2027-03-21', name: 'Human Rights Day' },
  { date: '2027-03-26', name: 'Good Friday' },
  { date: '2027-03-29', name: 'Family Day' },
  { date: '2027-04-27', name: 'Freedom Day' },
  { date: '2027-05-01', name: "Workers' Day" },
  { date: '2027-06-16', name: 'Youth Day' },
  { date: '2027-08-09', name: "National Women's Day" },
  { date: '2027-09-24', name: 'Heritage Day' },
  { date: '2027-12-16', name: 'Day of Reconciliation' },
  { date: '2027-12-25', name: 'Christmas Day' },
  { date: '2027-12-26', name: 'Day of Goodwill' },
  { date: '2027-12-27', name: 'Day of Goodwill (observed — falls on a Sunday)' },
];

export function publicHolidayOn(dateIso: string): PublicHoliday | undefined {
  return SA_PUBLIC_HOLIDAYS.find((h) => h.date === dateIso);
}
