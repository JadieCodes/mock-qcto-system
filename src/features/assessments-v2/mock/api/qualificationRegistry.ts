import { QUALIFICATION_REGISTRATION_END_DATES } from '../data/qualificationRegistrationEndDates';

// QCTO feedback 05.2: simulated SAQA registry lookup, named after what the real integration
// would do. Null when the qualification (or its end date) is not known, e.g. a SAQA ID of "Pending".
export function getQualificationRegistrationEndDate(saqaId: string): string | null {
  return QUALIFICATION_REGISTRATION_END_DATES[saqaId.trim()] ?? null;
}
