// Cross-domain data owned by the Accreditation domain, simulated here per the module CLAUDE.md
// ("Data" section) until a real source exists: which qualifications have accredited SDPs
// (QCTO feedback 1.8).
import { ACCREDITED_QUALIFICATIONS } from '../data/accreditedQualifications';
import { ASSESSMENT_CENTRES, type AssessmentCentre } from '../data/assessmentCentres';
import { QP_DIRECTORY } from '../data/qpDirectory';

export interface QualificationWithAccreditedSdps {
  qualificationId: string;
  qualificationName: string;
  qpId: string;
  qpName: string;
  accreditedSdpIds: string[];
}

function withQpName(entry: (typeof ACCREDITED_QUALIFICATIONS)[number]): QualificationWithAccreditedSdps {
  return { ...entry, qpName: QP_DIRECTORY.find((qp) => qp.qpId === entry.qpId)?.name ?? entry.qpId };
}

export async function listQualificationsWithAccreditedSdps(): Promise<QualificationWithAccreditedSdps[]> {
  return ACCREDITED_QUALIFICATIONS.filter((q) => q.accreditedSdpIds.length > 0).map(withQpName);
}

// Synchronous lookup for display only — finds a qualification by its id or by its name.
export function findQualification(idOrName: string): QualificationWithAccreditedSdps | undefined {
  const needle = idOrName.trim().toLowerCase();
  const entry = ACCREDITED_QUALIFICATIONS.find(
    (q) => q.qualificationId.toLowerCase() === needle || q.qualificationName.toLowerCase() === needle,
  );
  return entry ? withQpName(entry) : undefined;
}

// Every qualification in the directory, for pickers (an RPL/ARPL visit chooses its qualifications from it).
export function listQualificationDirectory(): QualificationWithAccreditedSdps[] {
  return ACCREDITED_QUALIFICATIONS.map(withQpName);
}

// QCTO 29.21: the assessment centres accredited for one qualification (by its id or name), with
// province and town. A qualification nobody is accredited for has none.
export async function listAccreditedAssessmentCentres(qualificationIdOrName: string): Promise<AssessmentCentre[]> {
  const qualification = findQualification(qualificationIdOrName);
  if (!qualification) return [];
  return ASSESSMENT_CENTRES.filter((c) => qualification.accreditedSdpIds.includes(c.centreId));
}

// The centres a confirmation record names (records keep centre names), for the read-only map.
export async function listAssessmentCentresByName(names: string[]): Promise<AssessmentCentre[]> {
  return ASSESSMENT_CENTRES.filter((c) => names.includes(c.name));
}
