import type { ValidationIssue } from '../../shared/validation/types';
import type { AssessmentComponent, AssessmentComponentType, QasaCertificationHandoff, QsaAddendumApplication } from './types';

// QCTO feedback 3.3: the optional assessment details on a QASA (components, sittings per year
// or on demand, validity period) and the simulated hand-off to Certification.

export const ASSESSMENT_COMPONENT_TYPE_LABELS: Record<AssessmentComponentType, string> = {
  written: 'Written',
  practical: 'Practical',
};

export const RECOMMENDED_TO_CERTIFICATION_LABEL = 'Recommended to Certification with the QASA assessment details';

export function componentsOf(app: QsaAddendumApplication): AssessmentComponent[] {
  return app.assessmentComponents ?? [];
}

export function totalWeighting(components: AssessmentComponent[]): number {
  return components.reduce((sum, c) => sum + (Number.isFinite(c.weightingPercent) ? c.weightingPercent : 0), 0);
}

export interface AssessmentDetailsInput {
  components: AssessmentComponent[];
  validityPeriodYears: number | null;
}

// The fields are optional: an empty list and no validity period are both valid. Once any
// component is listed, every component needs its fields and the weightings must add up to 100%.
export function validateAssessmentDetails(input: AssessmentDetailsInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  input.components.forEach((c, i) => {
    const n = i + 1;
    if (!c.name.trim()) issues.push({ field: `components.${i}.name`, message: `Component ${n}: enter a name.` });
    if (!Number.isFinite(c.weightingPercent) || c.weightingPercent <= 0 || c.weightingPercent > 100) {
      issues.push({ field: `components.${i}.weightingPercent`, message: `Component ${n}: the weighting must be between 1 and 100%.` });
    }
    if (!Number.isInteger(c.days) || c.days < 1) {
      issues.push({ field: `components.${i}.days`, message: `Component ${n}: the number of days must be a whole number of at least 1.` });
    }
  });
  if (input.components.length > 0) {
    const total = totalWeighting(input.components);
    if (total !== 100) issues.push({ field: 'components', message: `The component weightings add up to ${total}%. They must add up to 100%.` });
  }
  if (input.validityPeriodYears != null && (!Number.isInteger(input.validityPeriodYears) || input.validityPeriodYears < 1)) {
    issues.push({ field: 'validityPeriodYears', message: 'The validity period must be a whole number of years, at least 1.' });
  }
  return issues;
}

// Modelled on the Approval of Results hand-off (approval-of-results/api.ts): a snapshot stored
// on the record, plus an audit entry written by the caller.
export function buildCertificationHandoff(app: QsaAddendumApplication, recommendedAt: string, recommendedBy: string): QasaCertificationHandoff {
  return {
    recommendedAt,
    recommendedBy,
    components: componentsOf(app),
    approvedEisaSittingsPerYear: app.evaluationReport.approvedEisaSittingsPerYear,
    eisaSittingsOnDemand: app.evaluationReport.eisaSittingsOnDemand ?? false,
    validityPeriodYears: app.validityPeriodYears ?? null,
  };
}

export function sittingsPerYearText(sittingsPerYear: number | null, onDemand: boolean): string {
  if (onDemand) return 'On demand';
  return sittingsPerYear == null ? 'Not recorded' : `${sittingsPerYear} per year`;
}
