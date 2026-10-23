// "My items" = a record the active person submitted, or that was allocated/re-routed to them —
// e.g. workflow.submittedById, allocatedAsdId, reroutedToId. Visibility filtering itself is a
// later fix (Fix 1B-ii's "My items / All in my team" switch) — this is just the shared
// predicate that switch will call, built now so every module reuses one definition.
export function isMyItem(personId: string, ...candidateIds: (string | null | undefined)[]): boolean {
  return candidateIds.some((id) => id === personId);
}
