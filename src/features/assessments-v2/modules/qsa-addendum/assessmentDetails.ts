import { getQualificationRegistrationEndDate } from '../../mock/api/qualificationRegistry';
import type { ValidationIssue } from '../../shared/validation/types';
import type { AssessmentComponent, AssessmentComponentType, QasaCertificationHandoff, QsaAddendumApplication } from './types';

// QCTO feedback 3.3: the optional assessment details on a QASA (components, sittings per year
// or on demand) and the simulated hand-off to Certification. QCTO feedback 05.2: there is no
// validity period in years — see qasaValidityText below.

export const ASSESSMENT_COMPONENT_TYPE_LABELS: Record<AssessmentComponentType, string> = {
  written: 'Written',
  practical: 'Practical',
};

// QCTO feedback 05.1: at approval QCTO notifies Certification of the assessment details — it
// does not "recommend". (Approval of Results keeps its own "Recommended to the Certification
// domain" wording, which is correct there.)
export const CERTIFICATION_NOTIFIED_LABEL = 'Certification notified of the assessment details';

export function componentsOf(app: QsaAddendumApplication): AssessmentComponent[] {
  return app.assessmentComponents ?? [];
}

export function totalWeighting(components: AssessmentComponent[]): number {
  return components.reduce((sum, c) => sum + (Number.isFinite(c.weightingPercent) ? c.weightingPercent : 0), 0);
}

export interface AssessmentDetailsInput {
  components: AssessmentComponent[];
}

// The list is optional: an empty list is valid. Once any component is listed, every component needs its fields and the weightings must add up to 100%.
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
  return issues;
}

// Modelled on the Approval of Results hand-off (approval-of-results/api.ts): a snapshot stored
// on the record, plus an audit entry written by the caller.
export function buildCertificationHandoff(app: QsaAddendumApplication, notifiedAt: string, notifiedBy: string): QasaCertificationHandoff {
  return {
    notifiedAt,
    notifiedBy,
    components: componentsOf(app),
    approvedEisaSittingsPerYear: app.evaluationReport.approvedEisaSittingsPerYear,
    eisaSittingsOnDemand: app.evaluationReport.eisaSittingsOnDemand ?? false,
  };
}

// The sittings other modules (the EISA Calendar) must use: the ones Certification was notified
// of at approval. QCTO feedback 05.2: while a review is running the ASD may change the
// evaluation report, but the approved values stay in force until the review is approved.
export function approvedSittingsOf(app: QsaAddendumApplication): { sittingsPerYear: number | null; onDemand: boolean } {
  const source = app.certificationHandoff;
  if (source) return { sittingsPerYear: source.approvedEisaSittingsPerYear, onDemand: source.eisaSittingsOnDemand };
  return { sittingsPerYear: app.evaluationReport.approvedEisaSittingsPerYear, onDemand: app.evaluationReport.eisaSittingsOnDemand ?? false };
}

// QCTO feedback 05.2: an approved QASA is valid for the lifespan of the qualification and can
// be reviewed at any time.
export function qasaValidityText(app: QsaAddendumApplication): string {
  const endDate = getQualificationRegistrationEndDate(app.saqaId);
  return endDate
    ? `Valid for the lifespan of the qualification (until ${endDate})`
    : 'Valid for the lifespan of the qualification (registration end date not recorded)';
}

export function sittingsPerYearText(sittingsPerYear: number | null, onDemand: boolean): string {
  if (onDemand) return 'On demand';
  return sittingsPerYear == null ? 'Not recorded' : `${sittingsPerYear} per year`;
}
