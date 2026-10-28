import { findQualification } from '../../mock/api/accreditation';
import type { EisaSitting, EisaSittingBatch } from './types';

const NOT_RECORDED = '—';

// QCTO feedback 2.3: sittings stored before qualificationId existed (or added for a
// qualification outside the directory) look the id up by name, and never show a blank.
export function qualificationIdOf(record: Pick<EisaSitting | EisaSittingBatch, 'qualificationId' | 'qualificationTitle'>): string {
  return record.qualificationId || findQualification(record.qualificationTitle)?.qualificationId || NOT_RECORDED;
}

export function displayOrDash(value: string | null | undefined): string {
  return value?.trim() ? value : NOT_RECORDED;
}
