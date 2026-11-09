// Cross-domain data owned by the Quality Assurance domain, simulated here per the module
// CLAUDE.md ("Data" section) until the real QA backend exists. Named after what the real
// domain would do: learner enrolment (CR-036) and SDP compliance status (CR-041).
import { ENROLLED_LEARNERS, type EnrolledLearner } from '../data/enrolledLearners';
import { SDP_DIRECTORY, type SdpDirectoryEntry } from '../data/sdpDirectory';

export async function listSdps(): Promise<SdpDirectoryEntry[]> {
  return SDP_DIRECTORY;
}

export async function getSdpComplianceStatus(sdpName: string): Promise<boolean> {
  return SDP_DIRECTORY.find((s) => s.name === sdpName)?.compliant ?? true;
}

export async function listEnrolledLearners(sdpName: string): Promise<EnrolledLearner[]> {
  return ENROLLED_LEARNERS.filter((l) => l.sdpName === sdpName);
}

// QCTO feedback 05.23/05.24: the ID numbers of the learners on a results batch.
export async function listEnrolledLearnersByIds(learnerIds: string[]): Promise<EnrolledLearner[]> {
  return ENROLLED_LEARNERS.filter((l) => learnerIds.includes(l.id));
}
