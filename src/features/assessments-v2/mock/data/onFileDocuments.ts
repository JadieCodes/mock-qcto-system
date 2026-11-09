// QCTO feedback 29.25: the documents QCTO already holds for a qualification's validated EISA
// instrument, so the QP is not asked for them again at results submission. The validated
// instrument record (instrument-validation) only keeps the instrument file today, so these are
// clearly mock entries, all kept here. When the validation record starts holding these documents,
// read them from there instead — this file is the one place to change.
import type { OnFileDocument, OnFileDocumentId } from '../../modules/approval-of-results/types';

export const ON_FILE_DOCUMENT_LABELS: Record<OnFileDocumentId, string> = {
  'confidentiality-agreement-developer': 'Confidentiality agreement — instrument developer',
  'confidentiality-agreement-moderator': 'Confidentiality agreement — moderator',
  'cv-developer': 'CV — instrument developer',
  'cv-moderator': 'CV — moderator',
  'instrument-development-report': 'Instrument development report',
  'instrument-validation-report': 'Instrument validation report',
};

// The order they are shown in.
export const ON_FILE_DOCUMENT_IDS = Object.keys(ON_FILE_DOCUMENT_LABELS) as OnFileDocumentId[];

const MOCK_FILE_PARTS: Record<OnFileDocumentId, { name: string; size: number }> = {
  'confidentiality-agreement-developer': { name: 'Confidentiality_Agreement_Developer', size: 184_320 },
  'confidentiality-agreement-moderator': { name: 'Confidentiality_Agreement_Moderator', size: 181_248 },
  'cv-developer': { name: 'CV_Instrument_Developer', size: 262_144 },
  'cv-moderator': { name: 'CV_Moderator', size: 245_760 },
  'instrument-development-report': { name: 'Instrument_Development_Report', size: 1_048_576 },
  'instrument-validation-report': { name: 'Instrument_Validation_Report', size: 786_432 },
};

export function onFileDocumentsFor(qualificationTitle: string): OnFileDocument[] {
  const title = qualificationTitle.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return ON_FILE_DOCUMENT_IDS.map((id) => ({
    id,
    label: ON_FILE_DOCUMENT_LABELS[id],
    fileName: `${title}_${MOCK_FILE_PARTS[id].name}.pdf`,
    fileSize: MOCK_FILE_PARTS[id].size,
  }));
}
