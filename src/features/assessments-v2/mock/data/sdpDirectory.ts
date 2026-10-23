// Simulated SDP directory, owned by the Quality Assurance domain (CR-041). Assessments only
// reads compliance status — it never sets it. One SDP is seeded non-compliant so the CR-041
// block is demoable without any setup. sdpId is the stable identity records link to; name stays
// for display and for mock/api/qaDomain.ts's existing name-keyed lookups (ENROLLED_LEARNERS is
// keyed by name too).
export interface SdpDirectoryEntry {
  sdpId: string;
  name: string;
  compliant: boolean;
}

export const SDP_DIRECTORY: SdpDirectoryEntry[] = [
  { sdpId: 'sdp-khanya-skills-academy', name: 'Khanya Skills Academy', compliant: true },
  { sdpId: 'sdp-thabo-technical-college', name: 'Thabo Technical College', compliant: true },
  { sdpId: 'sdp-vuma-trade-centre', name: 'Vuma Trade Centre', compliant: false },
  { sdpId: 'sdp-lerato-training-institute', name: 'Lerato Training Institute', compliant: true },
];
