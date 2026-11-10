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

  // Batch N.1: QCTO asked for FISA results under Approval of Results; the FISA instrument stays in
  // the FISA module. These lines point the SDP from one place to the other.
  fisaSignpostInstrument:
    'FISA has two parts. Here you develop your FISA instrument and get it validated. When the FISA has taken place, submit the learner results under Approval of Results → FISA.',
  fisaSignpostInstrumentButton: 'Go to FISA results',
  fisaSignpostResults: 'Submit your FISA learner results here. Your FISA instrument is developed and validated in the FISA section.',
  fisaSignpostResultsButton: 'Back to the FISA section',
  sdpDashboardFisa: 'Develop your FISA instrument and get it validated. FISA learner results are submitted under Approval of Results → FISA.',
  sdpDashboardApprovalOfResults: 'Submit your FISA learner results here. Your FISA instrument is developed and validated in the FISA section.',

  // QCTO feedback 29.13 — shown on the propose form and the bulk-upload preview.
  eisaOnDemandHint: "On-demand (trade test): at least one month's notice. QCTO is trying this as a pilot.",

  // PM-04 — open question, placeholders until QCTO confirms the real names.
  eisaReadinessNoticePlaceholder: 'EISA Readiness Notice',
  markingModerationVisitRequestPlaceholder: 'Marking & Moderation Visit Request',
} as const;
