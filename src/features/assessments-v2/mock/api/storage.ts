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
// History: 'C1' = QASA, EISA Instrument Validation, EISA Calendar.
export const SEED_VERSION = 'C1';
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
