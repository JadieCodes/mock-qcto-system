const PREFIX = 'assessmentsV2:';

export function readStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Storage unavailable (quota, private mode, etc.) — state stays in-memory for this session.
  }
}

// QCTO feedback Batch C: bump this in every change to mock/data/demoSeed/. When the stored
// version differs, demoSeed's ensureDemoSeed() clears the workflow stores once and re-seeds,
// so a browser that already used the app gets the new seed without clicking "Reset demo data".
// History: 'C1' = QASA, EISA Instrument Validation, EISA Calendar. 'C2' = Learner EISA
// Registration, EISA Confirmation, Approval of Results (plus more past sittings). 'C3' = Site
// Visits, FISA Instrument Validation, RPL Toolkit (plus two RPL/ARPL-flagged registrations).
// 'D' = Site Visits evidence files (QCTO feedback 1.12) and the QASA "feedback letter" wording.
// 'A3' = RPL/ARPL visits at the SDP with no QP or sitting (2.7); sharing an outcome completes
// the visit (2.12). 'A4' = RPL toolkit file (3.13); Post-EISA Monitoring at 45% with the
// automatic visit on the 40% Welding batch and none on the 50% Electrical batch (2.8).
// 'A5' = Batch E: QASA Director Office stage and DD-recorded IAC outcomes (2.1), plus a 13th
// QASA at the Director Office stage. 'A6' = FISA Standards on the same route (2.9), one at each
// new stage; QASA assessment components and the Certification hand-off (3.3). 'A7' = the
// "Assistant Director" role merged into the ASD (3.11): seed records, audit entries and
// notifications say "ASD", and the DD allocates FISA instruments and RPL Toolkits.
// 'A8' = Batch F (2.4): EISA Calendar postponement/cancellation requests — one at the DD, one at
// the Director, one approved (S6's postponement).
// 'A9' = Batch G: script verification on Marking & Moderation (3.7), four new visit types and the
// visit Domain (2.5), and two visits shared with the QP Nomvula Dlamini (Visit Outcomes).
// 'A9.1' = 3.10: FISA Instrument Validations on QCTO's "FISA Validation of Instrument Report"
// form, plus a sixth record (Approved with conditions, with "No" answers and findings).
// 'A10' = 3.14: FISA results batches in Approval of Results — awaiting submission, with the ASD,
// with the DD, and approved with the approval letter sent to the SDP.
// 'A11' = Batch K (QCTO 5 Nov review): no Declined QASA (Boilermaker is now Remediation
// requested), no approval-letter state, acknowledgements issued on submission, and Plumbing is
// "Approved — under review".
// 'A12' = Batch L1 (05.3, 29.31, 29.32): QASA components carry total marks and pass marks; EISA
// results batches snapshot the components, with a mark per component or Absent per learner.
// 'A13' = Batch L2 (05.23, 05.24): a second confirmed sitting awaiting results (Welding) with a
// saved capture draft; the Electrical Trades one stays empty.
// 'A13.1' = Batch L2.1: EISA and FISA results keep each learner's ID number.
// 'A13.2' = Batch L1.1: QASA components carry QCTO's highest and lowest mark, each QASA an
// addendum pass % and FLC; EISA results use QCTO's calculator with whole-number marks.
export const SEED_VERSION = 'A13.2';
const SEED_VERSION_KEY = 'seedVersion';

// The "who am I" selection (shared/ui/RoleContext.tsx) is not workflow data, so a seed
// upgrade keeps it. "Reset demo data" still clears it, as before.
const PERSON_SELECTION_PREFIXES = [`${PREFIX}activePersonId:`, `${PREFIX}currentRole:`];

export function isSeedCurrent(): boolean {
  return readStore<string | null>(SEED_VERSION_KEY, null) === SEED_VERSION;
}

export function markSeedCurrent(): void {
  writeStore(SEED_VERSION_KEY, SEED_VERSION);
}

export function clearWorkflowStores(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX) && !PERSON_SELECTION_PREFIXES.some((p) => k.startsWith(p)))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // Storage unavailable — nothing to clear.
  }
}

// CR per module CLAUDE.md: "Reset demo data" must be available — this clears every
// assessmentsV2: key (the seed version included), so the next page load re-seeds
// (mock/data/demoSeed/index.ts) and modules without a seed fall back to their defaults.
export function resetDemoData(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // Storage unavailable — nothing to clear.
  }
}
