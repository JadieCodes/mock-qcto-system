// Cross-domain data owned by the Quality Assurance domain, simulated here per the module
// CLAUDE.md ("Data" section) until the real QA backend exists. Named after what the real
// domain would do: learner enrolment (CR-036) and SDP compliance status (CR-041).
import { ENROLLED_LEARNERS, type EnrolledLearner } from '../data/enrolledLearners';
import { SDP_DIRECTORY, type SdpDirectoryEntry } from '../data/sdpDirectory';
import { SKILLS_PROGRAMME_ENROLMENTS } from '../data/skillsProgrammeEnrolments';

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

export interface SkillsProgrammeLearner extends EnrolledLearner {
  // YYYY-MM-DD: when the learner was enrolled for the skills programme.
  enrolledDate: string;
}

// Batch P (05.21): the learners an SDP has enrolled for one skills programme. A FISA results
// batch can only list these learners.
export async function listEnrolledLearnersForSkillsProgramme(sdpName: string, skillsProgrammeTitle: string): Promise<SkillsProgrammeLearner[]> {
  return ENROLLED_LEARNERS.flatMap((l) => {
    const enrolment = SKILLS_PROGRAMME_ENROLMENTS.find((e) => e.learnerId === l.id && e.skillsProgrammeTitle === skillsProgrammeTitle);
    return l.sdpName === sdpName && enrolment ? [{ ...l, enrolledDate: enrolment.enrolledDate }] : [];
  });
}
