// QCTO feedback 05.17: EISA and FISA batches have different document sets. Each tab lists its own;
// nothing from the EISA list may appear on FISA (and the 7-weekday check proves it).
//
// A document with a download shows a link; one without shows "Generated at final approval".
// Batch N1: the Outcome Letter and the Certification recommendation letter now have downloads (the
// recommendation letter is internal only; the QP and the SDP never see it).
export type EisaBatchDocumentId =
  | 'eisa-outcome-letter'
  | 'eisa-verification-report'
  | 'eisa-tracking-register'
  | 'eisa-file-3'
  | 'eisa-recommendation-letter'
  | 'eisa-letter-checklist'
  | 'eisa-learner-submission-format';

export type FisaBatchDocumentId =
  | 'fisa-outcome-letter'
  | 'fisa-verification-report'
  | 'fisa-learner-enrolment-spreadsheet'
  | 'fisa-recommendation-letter'
  | 'fisa-tracking-register'
  | 'fisa-data-load-specification';

export interface BatchDocumentDefinition<Id extends string> {
  id: Id;
  name: string;
  // Batch N1: not shown to the QP or the SDP.
  internalOnly?: boolean;
}

export function documentsForPortal<Id extends string>(documents: BatchDocumentDefinition<Id>[], portal: 'internal' | 'external'): BatchDocumentDefinition<Id>[] {
  return documents.filter((d) => portal === 'internal' || !d.internalOnly);
}

export const EISA_BATCH_DOCUMENTS: BatchDocumentDefinition<EisaBatchDocumentId>[] = [
  { id: 'eisa-outcome-letter', name: 'Outcome Letter' },
  { id: 'eisa-verification-report', name: 'Assessment Assurance Verification Report (EISA)' },
  // Batch N2: this batch's line of the tracking register, as a CSV (the audit trail CSV is on the Audit Trail tab).
  { id: 'eisa-tracking-register', name: 'Tracking register entry (CSV)', internalOnly: true },
  { id: 'eisa-letter-checklist', name: 'Approval of Results letter checklist', internalOnly: true },
  { id: 'eisa-file-3', name: 'File 3 (learner results)' },
  { id: 'eisa-recommendation-letter', name: 'Certification recommendation letter', internalOnly: true },
  { id: 'eisa-learner-submission-format', name: 'Learner EISA submission format' },
];

export const FISA_BATCH_DOCUMENTS: BatchDocumentDefinition<FisaBatchDocumentId>[] = [
  { id: 'fisa-outcome-letter', name: 'Outcome Letter' },
  { id: 'fisa-verification-report', name: 'FISA Assessment Assurance Verification Report' },
  { id: 'fisa-learner-enrolment-spreadsheet', name: 'Learner enrolment spreadsheet (skills programme)' },
  { id: 'fisa-recommendation-letter', name: 'SP certification recommendation letter', internalOnly: true },
  { id: 'fisa-tracking-register', name: 'Tracking register entry (CSV)', internalOnly: true },
  { id: 'fisa-data-load-specification', name: 'Data load specification (skills programme)' },
];
