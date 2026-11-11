// Simulated assessment centres (QCTO 29.21). The Accreditation domain would own this; until it
// is connected, every accredited SDP is also an accredited assessment centre in its own town
// (see accredited qualifications), so the centre list for a qualification follows its accredited SDPs.
export interface AssessmentCentre {
  centreId: string;
  name: string;
  province: string;
  town: string;
  // The town's coordinates, for the map in EISA Confirmation. Screens read them by centreId from
  // here, so no stored record carries them.
  latitude: number;
  longitude: number;
}

export const ASSESSMENT_CENTRES: AssessmentCentre[] = [
  { centreId: 'sdp-khanya-skills-academy', name: 'Khanya Skills Academy', province: 'Limpopo', town: 'Polokwane', latitude: -23.904, longitude: 29.469 },
  { centreId: 'sdp-thabo-technical-college', name: 'Thabo Technical College', province: 'Free State', town: 'Bloemfontein', latitude: -29.085, longitude: 26.159 },
  { centreId: 'sdp-vuma-trade-centre', name: 'Vuma Trade Centre', province: 'Eastern Cape', town: 'Gqeberha', latitude: -33.961, longitude: 25.602 },
  { centreId: 'sdp-lerato-training-institute', name: 'Lerato Training Institute', province: 'KwaZulu-Natal', town: 'Pietermaritzburg', latitude: -29.601, longitude: 30.379 },
];
