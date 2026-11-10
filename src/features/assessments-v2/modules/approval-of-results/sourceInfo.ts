// Batch N2: the per-learner SDP and RPL/ARPL flag a batch keeps (types.ts ResultsSourceInfo), read
// from the sitting's EISA Confirmation and its registrations when the batch is created.
import type { EisaConfirmationRecord } from '../eisa-confirmation/types';
import type { EisaRegistrationRecord } from '../eisa-registration/types';
import type { ResultsSourceInfo } from './types';

export function sourceInfoOf(confirmation: EisaConfirmationRecord, registrations: EisaRegistrationRecord[]): ResultsSourceInfo {
  const rplIds = new Set(registrations.flatMap((r) => r.learners.filter((l) => l.rplArpl).map((l) => l.learnerId)));
  return {
    notifiedAt: confirmation.sharedAt.slice(0, 10),
    learners: confirmation.learners.map((l) => ({ learnerId: l.learnerId, sdpName: l.sdpName, rpl: rplIds.has(l.learnerId) })),
  };
}

export function blankSourceInfo(): ResultsSourceInfo {
  return { notifiedAt: '', learners: [] };
}
