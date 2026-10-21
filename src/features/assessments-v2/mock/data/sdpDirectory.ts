// Simulated SDP directory, owned by the Quality Assurance domain (CR-041). Assessments only
// reads compliance status — it never sets it. One SDP is seeded non-compliant so the CR-041
// block is demoable without any setup.
export interface SdpDirectoryEntry {
  name: string;
  compliant: boolean;
}

export const SDP_DIRECTORY: SdpDirectoryEntry[] = [
  { name: 'Khanya Skills Academy', compliant: true },
  { name: 'Thabo Technical College', compliant: true },
  { name: 'Vuma Trade Centre', compliant: false },
  { name: 'Lerato Training Institute', compliant: true },
];
