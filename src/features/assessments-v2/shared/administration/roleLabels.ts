import { useSyncExternalStore } from 'react';
import { ROLE_DESCRIPTORS } from '../../config/roles';
import { readStore, writeStore } from '../../mock/api/storage';
import { appendAuditEntry } from '../audit/auditLog';
import type { Role } from '../../types';

// Batch S (29.1): a role's DISPLAY name can be changed by the super admin. Role ids, workflow
// allowedRoles and rights never change — only the text people read. Every screen that shows a
// role name goes through roleLabel(), and every sentence that mentions one goes through relabel().
export const ROLE_LABELS_KEY = 'adminRoleLabels';
export const ROLE_LABEL_RECORD_TYPE = 'administration-role-label';

type Overrides = Partial<Record<Role, string>>;

const listeners = new Set<() => void>();
let version = 0;
function emit(): void {
  version++;
  listeners.forEach((l) => l());
}

function overrides(): Overrides {
  return readStore<Overrides>(ROLE_LABELS_KEY, {});
}

export function defaultRoleLabel(role: Role): string {
  return ROLE_DESCRIPTORS.find((d) => d.role === role)?.label ?? role;
}

export function roleLabel(role: Role | string): string {
  return overrides()[role as Role]?.trim() || defaultRoleLabel(role as Role);
}

export function hasRoleLabelOverride(role: Role): boolean {
  return !!overrides()[role]?.trim();
}

// The names a role goes by inside existing sentences (stage labels, notifications, letters).
// Director is matched only on its own, never inside Deputy / Domain / Chief Director or Director Office.
// Longer names also match in capitals (letter role lines such as "Recommended by: DEPUTY DIRECTOR").
const ROLE_TEXT_PATTERNS: { role: Role; source: string }[] = [
  { role: 'Sub Domain Admin', source: String.raw`\b(?:Sub Domain Admin|SUB DOMAIN ADMIN)\b` },
  { role: 'Qualifications Development', source: String.raw`\b(?:Qualifications Development|QUALIFICATIONS DEVELOPMENT)\b` },
  { role: 'Director & Team', source: String.raw`\b(?:Director Office|DIRECTOR OFFICE)\b` },
  { role: 'Deputy Director', source: String.raw`\b(?:Deputy Director|DEPUTY DIRECTOR)\b|\bDD\b` },
  { role: 'Domain Director', source: String.raw`\b(?:Domain Director|DOMAIN DIRECTOR)\b` },
  { role: 'Chief Director', source: String.raw`\b(?:Chief Director|CHIEF DIRECTOR)\b` },
  { role: 'Director', source: String.raw`(?<!Deputy |Domain |Chief )\bDirector\b(?! Office| &)` },
  { role: 'ASD', source: String.raw`\bASD\b` },
  { role: 'IAC', source: String.raw`\bIAC\b` },
  { role: 'CEO', source: String.raw`\bCEO\b` },
  { role: 'QP', source: String.raw`\bQP\b` },
  { role: 'SDP', source: String.raw`\bSDP\b` },
];
const COMBINED = new RegExp(ROLE_TEXT_PATTERNS.map((p) => `(${p.source})`).join('|'), 'g');

// One pass over the text, so a new label is never itself renamed again.
export function relabel(text: string): string {
  const current = overrides();
  if (!text || Object.values(current).every((v) => !v?.trim())) return text;
  return text.replace(COMBINED, (match, ...groups: (string | undefined)[]) => {
    const index = groups.slice(0, ROLE_TEXT_PATTERNS.length).findIndex((g) => g !== undefined);
    const role = ROLE_TEXT_PATTERNS[index]?.role;
    const label = role && current[role]?.trim();
    if (!label) return match;
    return match.length > 3 && match === match.toUpperCase() ? label.toUpperCase() : label;
  });
}

export function setRoleLabel(params: { role: Role; label: string; reason: string; actorId: string; actorName: string; actorRole: Role }): void {
  const label = params.label.trim();
  if (!label) throw new Error('Type a name, or use "Reset to default".');
  if (!params.reason.trim()) throw new Error('A reason is required.');
  const before = roleLabel(params.role);
  const next = { ...overrides() };
  if (label === defaultRoleLabel(params.role)) delete next[params.role];
  else next[params.role] = label;
  writeStore(ROLE_LABELS_KEY, next);
  appendAuditEntry({
    recordType: ROLE_LABEL_RECORD_TYPE,
    recordId: params.role,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    action: `Role name changed: "${before}" to "${label}"`,
    note: params.reason.trim(),
  });
  emit();
}

export function resetRoleLabel(params: { role: Role; reason: string; actorId: string; actorName: string; actorRole: Role }): void {
  if (!params.reason.trim()) throw new Error('A reason is required.');
  const before = roleLabel(params.role);
  const next = { ...overrides() };
  delete next[params.role];
  writeStore(ROLE_LABELS_KEY, next);
  appendAuditEntry({
    recordType: ROLE_LABEL_RECORD_TYPE,
    recordId: params.role,
    actorRole: params.actorRole,
    actorId: params.actorId,
    actorName: params.actorName,
    action: `Role name reset to default: "${before}" to "${defaultRoleLabel(params.role)}"`,
    note: params.reason.trim(),
  });
  emit();
}

// Re-renders a component when a role name changes (the switcher, headers). Other screens pick the
// new name up the next time they render.
export function useRoleLabelsVersion(): number {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
  );
}
