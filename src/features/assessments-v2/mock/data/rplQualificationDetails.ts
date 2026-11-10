import { QUALIFICATION_REGISTRATION_END_DATES } from './qualificationRegistrationEndDates';

// Batch W: the header of QCTO's "QP RPL Evaluation" (title of qualification, SAQA ID, NQF level,
// credits, registration start and end date), looked up from the toolkit's title. Mock values that
// stand in for the SAQA registry until it exists. The QASA seed holds the same SAQA IDs, levels and credits.
export interface RplQualificationDetails {
  qualificationTitle: string;
  saqaId: string;
  nqfLevel: string;
  credits: string;
  registrationStartDate: string;
  registrationEndDate: string;
}

interface Entry {
  saqaId: string;
  nqfLevel: string;
  credits: string;
  registrationStartDate: string;
}

const BY_QUALIFICATION: Record<string, Entry> = {
  'Electrical Trades': { saqaId: '91761', nqfLevel: 'Level 4', credits: '360', registrationStartDate: '2020-07-01' },
  Welding: { saqaId: '91845', nqfLevel: 'Level 4', credits: '360', registrationStartDate: '2021-07-01' },
  Plumbing: { saqaId: '91802', nqfLevel: 'Level 4', credits: '360', registrationStartDate: '2020-01-01' },
  'Gas Practitioner': { saqaId: '101941', nqfLevel: 'Level 4', credits: '240', registrationStartDate: '2023-07-01' },
  Boilermaker: { saqaId: '91786', nqfLevel: 'Level 4', credits: '360', registrationStartDate: '2021-01-01' },
  Rigger: { saqaId: '98987', nqfLevel: 'Level 3', credits: '180', registrationStartDate: '2023-07-01' },
  'Lift Mechanic': { saqaId: '91821', nqfLevel: 'Level 4', credits: '360', registrationStartDate: '2022-07-01' },
  Drainlayer: { saqaId: '93626', nqfLevel: 'Level 3', credits: '240', registrationStartDate: '2022-01-01' },
  'Electrical Line Mechanic': { saqaId: '99653', nqfLevel: 'Level 4', credits: '360', registrationStartDate: '2023-07-01' },
  'Metal Fabricator': { saqaId: '97110', nqfLevel: 'Level 4', credits: '360', registrationStartDate: '2022-07-01' },
};

const FALLBACK: Entry = { saqaId: 'Pending', nqfLevel: 'Level 4', credits: '240', registrationStartDate: '2022-07-01' };
const FALLBACK_END_DATE = '2029-06-30';

// "Electrical Trades RPL Toolkit (v2)" -> "Electrical Trades".
function qualificationNameOf(toolkitTitle: string): string {
  return toolkitTitle.replace(/\s*\(v\d+\)\s*$/, '').replace(/\s*RPL Toolkit\s*$/i, '').trim();
}

export function getRplQualificationDetails(toolkitTitle: string): RplQualificationDetails {
  const name = qualificationNameOf(toolkitTitle);
  const entry = BY_QUALIFICATION[name] ?? FALLBACK;
  return {
    qualificationTitle: name,
    ...entry,
    registrationEndDate: QUALIFICATION_REGISTRATION_END_DATES[entry.saqaId] ?? FALLBACK_END_DATE,
  };
}
