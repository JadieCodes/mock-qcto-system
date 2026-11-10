// Named demo QPs (09-visibility-matrix.md Section 3, approved). QP demo identity is a named
// individual (not an organisation) — confirmed assumption #10 in that doc. Stable qpId lets
// records link to "who submitted this" without relying on the free-text qpName.
// Batch N1: the contact, organisation, postal address and QP code are mock details for the
// outcome letters and the Certification recommendation letter (progress.md, Batch N1).
export interface QpDirectoryEntry {
  qpId: string;
  name: string;
  qualifications: string[];
  qpCode: string;
  contactTitle: string;
  contactSurname: string;
  organisation: string;
  postalAddress: string[];
  // Batch N2: mock contact details for the EISA verification report.
  telephone: string;
  email: string;
}

export const QP_DIRECTORY: QpDirectoryEntry[] = [
  {
    qpId: 'qp-nomvula-dlamini',
    name: 'Nomvula Dlamini',
    qualifications: ['Electrical Trades'],
    qpCode: 'QP0101',
    contactTitle: 'Ms',
    contactSurname: 'Dlamini',
    organisation: 'Highveld Trades Assessment Partners',
    postalAddress: ['PO Box 4410', 'Midrand', '1685'],
    telephone: '011 555 0101',
    email: 'nomvula.dlamini@highveld-trades.example',
  },
  {
    qpId: 'qp-johan-van-der-merwe',
    name: 'Johan van der Merwe',
    qualifications: ['Plumbing'],
    qpCode: 'QP0102',
    contactTitle: 'Mr',
    contactSurname: 'van der Merwe',
    organisation: 'Cape Plumbing Quality Partners',
    postalAddress: ['12 Voortrekker Road', 'Bellville', '7530'],
    telephone: '021 555 0102',
    email: 'johan.vandermerwe@cape-plumbing.example',
  },
  {
    qpId: 'qp-precious-mahlangu',
    name: 'Precious Mahlangu',
    qualifications: ['Welding'],
    qpCode: 'QP0103',
    contactTitle: 'Ms',
    contactSurname: 'Mahlangu',
    organisation: 'Mpumalanga Welding Assessors',
    postalAddress: ['PO Box 218', 'Witbank', '1035'],
    telephone: '013 555 0103',
    email: 'precious.mahlangu@mpumalanga-welding.example',
  },
];

export function qpDirectoryEntryFor(qpId: string): QpDirectoryEntry | undefined {
  return QP_DIRECTORY.find((q) => q.qpId === qpId);
}
