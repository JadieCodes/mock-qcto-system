// Batch N1: mock Skills Programme ID, NQF level and credits for the FISA outcome letter, keyed by
// the Skills Programme title on the FISA Standard. The FISA Standard record itself holds only the
// title, so these stand in until a SAQA lookup exists (named after what the real one would do).
export interface SkillsProgrammeDetails {
  skillsProgrammeId: string;
  nqfLevel: string;
  credits: string;
}

const DETAILS: Record<string, SkillsProgrammeDetails> = {
  'Electrical Installation Skills Programme': { skillsProgrammeId: 'SP-91110', nqfLevel: 'Level 4', credits: '48' },
  'Plumbing Fundamentals Skills Programme': { skillsProgrammeId: 'SP-91122', nqfLevel: 'Level 3', credits: '36' },
};

const UNKNOWN: SkillsProgrammeDetails = { skillsProgrammeId: 'Pending', nqfLevel: 'Level 4', credits: '40' };

export function getSkillsProgrammeDetails(title: string): SkillsProgrammeDetails {
  return DETAILS[title] ?? UNKNOWN;
}

// Batch W: the registration dates in the header of QCTO's Assessment Standards Evaluation
// Report. Kept apart from SkillsProgrammeDetails, which is copied into stored results batches.
const REGISTRATION_DATES: Record<string, { start: string; end: string }> = {
  'Electrical Installation Skills Programme': { start: '2024-07-01', end: '2029-06-30' },
  'Plumbing Fundamentals Skills Programme': { start: '2024-01-01', end: '2028-12-31' },
};

const UNKNOWN_REGISTRATION_DATES = { start: '2024-07-01', end: '2029-06-30' };

export function getSkillsProgrammeRegistrationDates(title: string): { start: string; end: string } {
  return REGISTRATION_DATES[title] ?? UNKNOWN_REGISTRATION_DATES;
}
