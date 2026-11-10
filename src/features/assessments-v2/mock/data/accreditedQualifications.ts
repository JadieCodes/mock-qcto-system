// Simulated link between qualifications, their QP and the SDPs accredited to offer them
// (QCTO feedback 1.8). The QP and SDP directories do not record which SDP is accredited for
// which qualification, so this small list stands in for that until the real accreditation
// data exists. qpId and sdpIds match mock/data/qpDirectory.ts and mock/data/sdpDirectory.ts.
export interface AccreditedQualificationEntry {
  qualificationId: string;
  qualificationName: string;
  qpId: string;
  accreditedSdpIds: string[];
}

export const ACCREDITED_QUALIFICATIONS: AccreditedQualificationEntry[] = [
  {
    qualificationId: '91761',
    qualificationName: 'Electrical Trades',
    qpId: 'qp-nomvula-dlamini',
    accreditedSdpIds: ['sdp-khanya-skills-academy', 'sdp-thabo-technical-college'],
  },
  {
    qualificationId: '91802',
    qualificationName: 'Plumbing',
    qpId: 'qp-johan-van-der-merwe',
    accreditedSdpIds: ['sdp-lerato-training-institute'],
  },
  {
    qualificationId: '91845',
    qualificationName: 'Welding',
    qpId: 'qp-precious-mahlangu',
    accreditedSdpIds: ['sdp-vuma-trade-centre', 'sdp-khanya-skills-academy'],
  },
  // Batch Q1 (QCTO 29.13): the Gas Practitioner QASA is on demand, so it needs an accredited SDP
  // for the on-demand calendar rules to be demoable. The id is the SAQA id in the QASA seed.
  {
    qualificationId: '101941',
    qualificationName: 'Gas Practitioner',
    qpId: 'qp-johan-van-der-merwe',
    accreditedSdpIds: ['sdp-lerato-training-institute'],
  },
  // No accredited SDPs yet, so no EISA date can be proposed for it.
  {
    qualificationId: '91890',
    qualificationName: 'Millwright',
    qpId: 'qp-nomvula-dlamini',
    accreditedSdpIds: [],
  },
];
