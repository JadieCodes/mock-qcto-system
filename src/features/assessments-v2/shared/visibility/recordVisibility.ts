import { isMyItem } from '../people/myItems';
import type { Person } from '../people/types';

// CR-054-style visibility scopes. "all" = every team role sees every record (today's default
// for most modules); "own-qp-visits"/"own-sdp-records" = only records tagged with that
// person's qpId/sdpId. A module keeps its own role->scope table (e.g. site-visits/config.ts's
// REPORT_VISIBILITY_RULES) and calls filterByVisibilityScope with it — this is the one place
// the actual filtering logic lives.
export type VisibilityScope = 'all' | 'own-qp-visits' | 'own-sdp-records';

export function filterByVisibilityScope<T>(
  records: T[],
  scope: VisibilityScope | null,
  person: Person,
  qpIdOf: (record: T) => string | null | undefined,
  sdpIdOf?: (record: T) => string | null | undefined,
): T[] {
  if (scope === null || scope === 'all') return records;
  if (scope === 'own-qp-visits') return records.filter((r) => qpIdOf(r) === person.qpId);
  if (scope === 'own-sdp-records') return records.filter((r) => (sdpIdOf ? sdpIdOf(r) === person.sdpId : false));
  return records;
}

// External portal: a QP only ever sees records tagged with their own qpId, an SDP only their
// own sdpId (09-visibility-matrix.md Section 1/Section 5 gap #5 — "picked by qualification,
// not identity"). Pass only the id accessor that applies to the current person's role.
export function filterExternalRecords<T>(
  records: T[],
  person: Person,
  options: { qpIdOf?: (record: T) => string | null | undefined; sdpIdOf?: (record: T) => string | null | undefined },
): T[] {
  if (person.role === 'QP' && options.qpIdOf) return records.filter((r) => options.qpIdOf!(r) === person.qpId);
  if (person.role === 'SDP' && options.sdpIdOf) return records.filter((r) => options.sdpIdOf!(r) === person.sdpId);
  return records;
}

// Internal lists: "My items" (default) vs "All in my team" (09-visibility-matrix.md Section 1
// note — the matrix has no subdivision smaller than "whole team" yet, so "All in my team" is
// simply the unfiltered, already-team-gated list). idsOf should return every id the record
// could be personally associated with (submittedById on each workflow state, allocatedAsdId,
// reroutedToId, etc.) — isMyItem matches if the active person's id is any one of them.
export type ListScope = 'mine' | 'team';

export function filterByScope<T>(records: T[], scope: ListScope, personId: string, idsOf: (record: T) => (string | null | undefined)[]): T[] {
  if (scope === 'team') return records;
  return records.filter((r) => isMyItem(personId, ...idsOf(r)));
}
