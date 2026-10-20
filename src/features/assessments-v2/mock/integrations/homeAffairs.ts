import { notImplemented, type BackendStubResult } from './types';

// CR-039: live Home Affairs G2G API check at QA-domain learner enrolment — ID verification
// and "double dipping" (same learner enrolled at multiple SDPs) detection. Assessments'
// EISA Registration relies on this once it exists; no screen here.
export function verifyLearnerIdentity(idNumber: string): Promise<BackendStubResult> {
  return notImplemented('CR-039', `No live Home Affairs API check for ID "${idNumber}" yet.`);
}
