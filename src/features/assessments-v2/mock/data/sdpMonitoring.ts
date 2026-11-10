// Batch R1 (29.18): when Quality Assurance last monitored each SDP (one date per institution, not
// per qualification). Held as "days before today" so the demo statuses stay the same whenever it
// is opened: Khanya and Vuma are valid, Lerato's monitoring has expired and Thabo was never
// monitored. `null` = never monitored.
export const SDP_LAST_MONITORED_DAYS_AGO: Record<string, number | null> = {
  'sdp-khanya-skills-academy': 200,
  'sdp-thabo-technical-college': null,
  'sdp-vuma-trade-centre': 400,
  'sdp-lerato-training-institute': 900,
};
