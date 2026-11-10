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
