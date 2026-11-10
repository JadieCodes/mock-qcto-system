// CR register names "Assistant Director" explicitly for registration processing — no open
// question here, unlike the EISA Calendar's reviewer role. QCTO feedback 3.11: that is the ASD.
export const REGISTRATION_PROCESSOR_ROLE = 'ASD' as const;

export const REGISTRATION_NUMBER_PREFIX = 'EISA-REG';

// Batch R1 (29.18): how long a QA monitoring of an SDP stays valid. ASSUMPTION: two years, as
// QCTO said on 29 Oct (2:14:11 to 2:16:29); change it here.
export const MONITORING_VALID_YEARS = 2;
