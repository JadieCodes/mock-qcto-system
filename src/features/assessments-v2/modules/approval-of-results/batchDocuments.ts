// QCTO feedback 05.17: EISA and FISA batches have different document sets. Each tab lists its own;
// nothing from the EISA list may appear on FISA (and the 7-weekday check proves it).
//
// A document with a download shows a link; one without shows "Generated at final approval".
// Hooks for the next batch: build the outcome letter, the recommendation letters and the
// audit-trail download, then put their download function against the document's id in the
// `downloads` map where the card is rendered (BatchDocumentsCard). Nothing else needs to change.
export type EisaBatchDocumentId =
  | 'eisa-outcome-letter'
  | 'eisa-verification-report'
  | 'eisa-tracking-register'
  | 'eisa-file-3'
  | 'eisa-recommendation-letter'
  | 'eisa-learner-submission-format';

export type FisaBatchDocumentId =
  | 'fisa-outcome-letter'
  | 'fisa-verification-report'
  | 'fisa-learner-enrolment-spreadsheet'
  | 'fisa-recommendation-letter'
  | 'fisa-data-load-specification';

export interface BatchDocumentDefinition<Id extends string> {
  id: Id;
  name: string;
}

export const EISA_BATCH_DOCUMENTS: BatchDocumentDefinition<EisaBatchDocumentId>[] = [
  { id: 'eisa-outcome-letter', name: 'Outcome letter' },
  { id: 'eisa-verification-report', name: 'Assessment Assurance Verification Report (EISA)' },
  { id: 'eisa-tracking-register', name: 'Tracking register (audit trail)' },
  { id: 'eisa-file-3', name: 'File 3 (learner results)' },
  { id: 'eisa-recommendation-letter', name: 'Certification recommendation letter' },
  { id: 'eisa-learner-submission-format', name: 'Learner EISA submission format' },
];

export const FISA_BATCH_DOCUMENTS: BatchDocumentDefinition<FisaBatchDocumentId>[] = [
  { id: 'fisa-outcome-letter', name: 'Outcome letter' },
  { id: 'fisa-verification-report', name: 'FISA Assessment Assurance Verification Report' },
  { id: 'fisa-learner-enrolment-spreadsheet', name: 'Learner enrolment spreadsheet (skills programme)' },
  { id: 'fisa-recommendation-letter', name: 'SP certification recommendation letter' },
  { id: 'fisa-data-load-specification', name: 'Data load specification (skills programme)' },
];
