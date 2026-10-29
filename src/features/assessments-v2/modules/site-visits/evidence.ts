import type { SiteVisit } from './types';

export type VisitEvidenceFile = NonNullable<SiteVisit['evidence']>[number];
export type VisitEvidenceCategory = VisitEvidenceFile['category'];

// QCTO feedback 1.12: the three upload areas on the Execution & Report tab, in display order.
export const EVIDENCE_AREAS: { category: VisitEvidenceCategory; label: string; required: boolean }[] = [
  { category: 'report', label: 'Visit report', required: true },
  { category: 'attendance', label: 'Attendance registers', required: false },
  { category: 'other', label: 'Other evidence', required: false },
];

export function evidenceOf(visit: SiteVisit): VisitEvidenceFile[] {
  return visit.evidence ?? [];
}

// QCTO feedback 1.12: a report cannot be submitted without at least one "Visit report" file.
export function hasVisitReportFile(visit: SiteVisit): boolean {
  return evidenceOf(visit).some((file) => file.category === 'report');
}

export const MISSING_VISIT_REPORT_MESSAGE = 'Upload at least one visit report before submitting the report.';
