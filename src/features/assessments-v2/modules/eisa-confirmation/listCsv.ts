import { csvField, withExcelPrefix } from '../../shared/csv/csv';
import type { EisaConfirmationRecord } from './types';

export const LIST_CSV_HEADINGS = ['Learner', 'ID number', 'SDP', 'Pathway', 'Registration number'];

export function listCsvFileName(record: Pick<EisaConfirmationRecord, 'qualificationTitle' | 'sittingDate'>): string {
  return `EISA_Learner_List_${record.qualificationTitle.replace(/\s+/g, '_')}_${record.sittingDate}.csv`;
}

// 29.20: the consolidated learner list the QP can download (Excel on South African settings, as elsewhere).
export function buildListCsv(record: Pick<EisaConfirmationRecord, 'learners'>): string {
  const lines = [LIST_CSV_HEADINGS.map(csvField).join(',')];
  for (const l of record.learners) {
    lines.push([l.fullName, l.idNumber, l.sdpName, l.pathway, l.registrationNumber].map(csvField).join(','));
  }
  return withExcelPrefix(`${lines.join('\r\n')}\r\n`);
}
