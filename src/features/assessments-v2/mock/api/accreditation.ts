// Cross-domain data owned by the Accreditation domain, simulated here per the module CLAUDE.md
// ("Data" section) until a real source exists: which qualifications have accredited SDPs
// (QCTO feedback 1.8).
import { ACCREDITED_QUALIFICATIONS } from '../data/accreditedQualifications';
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
