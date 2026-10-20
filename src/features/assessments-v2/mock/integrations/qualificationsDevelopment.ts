import { notImplemented, type BackendStubResult } from './types';

// CR-001: Qualifications Development's database structures don't exist yet — Assessments
// currently mocks the documents this would supply (SAQA Qualification Document, Curriculum
// Document). Call site is typed now so a real integration can replace the stub later.
export function getQualificationRecord(qualificationId: string): Promise<BackendStubResult> {
  return notImplemented('CR-001', `No real Qualifications Development record for "${qualificationId}" yet.`);
}
