// Simulated assessment centres (QCTO 29.21). The Accreditation domain would own this; until it
// is connected, every accredited SDP is also an accredited assessment centre in its own town
// (see accredited qualifications), so the centre list for a qualification follows its accredited SDPs.
export interface AssessmentCentre {
  centreId: string;
  name: string;
  province: string;
  town: string;
}

export const ASSESSMENT_CENTRES: AssessmentCentre[] = [
  { centreId: 'sdp-khanya-skills-academy', name: 'Khanya Skills Academy', province: 'Limpopo', town: 'Polokwane' },
  { centreId: 'sdp-thabo-technical-college', name: 'Thabo Technical College', province: 'Free State', town: 'Bloemfontein' },
  { centreId: 'sdp-vuma-trade-centre', name: 'Vuma Trade Centre', province: 'Eastern Cape', town: 'Gqeberha' },
  { centreId: 'sdp-lerato-training-institute', name: 'Lerato Training Institute', province: 'KwaZulu-Natal', town: 'Pietermaritzburg' },
];
