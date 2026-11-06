// QCTO feedback 05.2 (Batch K): an approved QASA is valid for the lifespan of its qualification,
// so the screens need the qualification's SAQA registration end date. The real date belongs to
// the SAQA registry; until that exists, this one list stands in for it, keyed by SAQA ID.
export const QUALIFICATION_REGISTRATION_END_DATES: Record<string, string> = {
  '91761': '2029-06-30', // Electrical Trades
  '91845': '2029-06-30', // Welding
  '91802': '2028-12-31', // Plumbing
  '101941': '2030-06-30', // Gas Practitioner
  '91890': '2029-06-30', // Millwright
  '91786': '2028-12-31', // Boilermaker
  '98987': '2030-06-30', // Rigger
  '91821': '2029-06-30', // Lift Mechanic
  '93626': '2029-12-31', // Drainlayer
  '99653': '2030-06-30', // Electrical Line Mechanic
  '99509': '2030-12-31', // Water and Wastewater Process Controller
  '91794': '2029-06-30', // Refrigeration and Air Conditioning Mechanic
};
