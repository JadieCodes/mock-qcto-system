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

// CR per module CLAUDE.md: "Reset demo data" must be available — this clears every
// assessmentsV2: key so the next read falls back to seed data.
export function resetDemoData(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // Storage unavailable — nothing to clear.
  }
}
