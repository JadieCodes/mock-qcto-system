// CR-006: "AQP" is renamed to "QP" everywhere. PM-04: readiness/visit-request names are
// placeholders pending QCTO confirmation — change here only, nowhere else, when confirmed.
export const LABELS = {
  qualityPartner: 'QP',
  qsaAddendum: 'QAS Addendum (QASA)',
  eisaInstrumentValidation: 'EISA Instrument Validation',
  fisaInstrumentValidation: 'FISA Instrument Validation',
  fisaValidationReport: 'FISA Validation Report',
  eisaConfirmation: 'EISA Confirmation',
  internalAssessmentCommittee: 'IAC',
  reportsReceived: 'Reports Received',
  approvalOfResults: 'Approval of Results',

  // PM-04 — open question, placeholders until QCTO confirms the real names.
  eisaReadinessNoticePlaceholder: 'EISA Readiness Notice',
  markingModerationVisitRequestPlaceholder: 'Marking & Moderation Visit Request',
} as const;
