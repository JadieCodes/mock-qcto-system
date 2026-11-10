// Simulated SDP directory, owned by the Quality Assurance domain (CR-041). Assessments only
// reads compliance status — it never sets it. One SDP is seeded non-compliant so the CR-041
// block is demoable without any setup. sdpId is the stable identity records link to; name stays
// for display and for mock/api/qaDomain.ts's existing name-keyed lookups (ENROLLED_LEARNERS is
// keyed by name too).
export interface SdpDirectoryEntry {
  sdpId: string;
  name: string;
  compliant: boolean;
  // Batch N1: mock details for the FISA outcome letter and the assessment centre numbers on EISA letters.
  accreditationNumber: string;
  contactTitle: string;
  contactPerson: string;
  postalAddress: string[];
}

export const SDP_DIRECTORY: SdpDirectoryEntry[] = [
  { sdpId: 'sdp-khanya-skills-academy', name: 'Khanya Skills Academy', compliant: true, accreditationNumber: 'SDP-24-0117', contactTitle: 'Ms', contactPerson: 'Lerato Mokoena', postalAddress: ['22 Church Street', 'Polokwane', '0699'] },
  { sdpId: 'sdp-thabo-technical-college', name: 'Thabo Technical College', compliant: true, accreditationNumber: 'SDP-24-0242', contactTitle: 'Mr', contactPerson: 'Thabo Sithole', postalAddress: ['PO Box 903', 'Bloemfontein', '9300'] },
  { sdpId: 'sdp-vuma-trade-centre', name: 'Vuma Trade Centre', compliant: false, accreditationNumber: 'SDP-23-0388', contactTitle: 'Mrs', contactPerson: 'Anele Jacobs', postalAddress: ['5 Industrial Road', 'Gqeberha', '6001'] },
  { sdpId: 'sdp-lerato-training-institute', name: 'Lerato Training Institute', compliant: true, accreditationNumber: 'SDP-23-0451', contactTitle: 'Ms', contactPerson: 'Zinhle Nkabinde', postalAddress: ['PO Box 77', 'Pietermaritzburg', '3200'] },
];

export function sdpDirectoryEntryByName(name: string): SdpDirectoryEntry | undefined {
  return SDP_DIRECTORY.find((s) => s.name === name);
}
