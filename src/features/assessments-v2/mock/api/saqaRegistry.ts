// CR-004: the SAQA gate check only decides where supporting documents come from — it never
// decides EISA vs FISA. Cross-domain data (per module CLAUDE.md, "Data" section): the real
// SAQA registry lookup belongs to an external system, so it is simulated here in mock/api
// behind a function named after what the real integration would do.
export interface SaqaRegistryDocument {
  label: string;
  fileName: string;
}

export interface SaqaRegistryResult {
  registered: boolean;
  documents: SaqaRegistryDocument[];
}

const AUTO_ATTACHED_DOCUMENTS: SaqaRegistryDocument[] = [
  { label: 'SAQA Qualification Document', fileName: 'SAQA_Qualification_Document_AUTO.pdf' },
  { label: 'Curriculum Document', fileName: 'Curriculum_Document_AUTO.pdf' },
  { label: 'QASA', fileName: 'QASA_AUTO.pdf' },
];

// There is no real SAQA API to call yet, so the QP simulates the outcome they want to test —
// the same approach the old build used for this gate check.
export function checkSaqaRegistration(simulateAs: 'registered' | 'not-registered'): Promise<SaqaRegistryResult> {
  if (simulateAs === 'registered') {
    return Promise.resolve({ registered: true, documents: AUTO_ATTACHED_DOCUMENTS });
  }
  return Promise.resolve({ registered: false, documents: [] });
}
