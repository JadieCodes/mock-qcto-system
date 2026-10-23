// Named demo QPs (09-visibility-matrix.md Section 3, approved). QP demo identity is a named
// individual (not an organisation) — confirmed assumption #10 in that doc. Stable qpId lets
// records link to "who submitted this" without relying on the free-text qpName.
export interface QpDirectoryEntry {
  qpId: string;
  name: string;
  qualifications: string[];
}

export const QP_DIRECTORY: QpDirectoryEntry[] = [
  { qpId: 'qp-nomvula-dlamini', name: 'Nomvula Dlamini', qualifications: ['Electrical Trades'] },
  { qpId: 'qp-johan-van-der-merwe', name: 'Johan van der Merwe', qualifications: ['Plumbing'] },
  { qpId: 'qp-precious-mahlangu', name: 'Precious Mahlangu', qualifications: ['Welding'] },
];
