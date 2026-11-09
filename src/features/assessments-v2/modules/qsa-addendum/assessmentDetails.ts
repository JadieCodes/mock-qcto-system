import { getQualificationRegistrationEndDate } from '../../mock/api/qualificationRegistry';
import type { ValidationIssue } from '../../shared/validation/types';
import type { AssessmentComponent, AssessmentComponentType, QasaCertificationHandoff, QsaAddendumApplication, StoredAssessmentComponent } from './types';

// QCTO feedback 3.3: the optional assessment details on a QASA (components, sittings per year
// or on demand) and the simulated hand-off to Certification. QCTO feedback 05.2: there is no
// validity period in years — see qasaValidityText below. Batch L1.1: the fields follow QCTO's
// "QAS Addendum Control Sheet" (see controlSheet.ts).

export const ASSESSMENT_COMPONENT_TYPE_LABELS: Record<AssessmentComponentType, string> = {
  written: 'Written',
  practical: 'Practical',
};

// QCTO feedback 05.1: at approval QCTO notifies Certification of the assessment details — it
// does not "recommend". (Approval of Results keeps its own "Recommended to the Certification
// domain" wording, which is correct there.)
export const CERTIFICATION_NOTIFIED_LABEL = 'Certification notified of the assessment details';

// Batch L1.1: the limit of QCTO's EISA Calculator (components 1 to 5).
export const MAX_ASSESSMENT_COMPONENTS = 5;

// QCTO's own wording, from the EISA Calculator.
export const WEIGHTING_TOTAL_MESSAGE = 'Total weighted percentages must be exactly 100';
export const WEIGHTING_REQUIRED_MESSAGE = 'Each Total needs a valid Weighting';

// Batch L1.1: records stored before this batch hold totalMarks / passMark.
export function normaliseComponent(c: StoredAssessmentComponent): AssessmentComponent {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    weightingPercent: c.weightingPercent,
    days: c.days,
    highestMark: c.highestMark ?? c.totalMarks ?? Number.NaN,
    lowestMark: c.lowestMark ?? c.passMark ?? Number.NaN,
  };
}

export function componentsOf(app: QsaAddendumApplication): AssessmentComponent[] {
  return (app.assessmentComponents ?? []).map(normaliseComponent);
}

export function totalWeighting(components: AssessmentComponent[]): number {
  return components.reduce((sum, c) => sum + (Number.isFinite(c.weightingPercent) ? c.weightingPercent : 0), 0);
}

// Derived for the control sheet, never typed: QCTO's example has Total Marks = the sum of the Highest Marks.
export function totalMarksOf(components: AssessmentComponent[]): number {
  return components.reduce((sum, c) => sum + (Number.isFinite(c.highestMark) ? c.highestMark : 0), 0);
}

export interface AssessmentDetailsInput {
  components: AssessmentComponent[];
  addendumPassPercent: number | null;
  flcRequired: boolean | null;
}

// The list is optional: an empty list is valid. Once any component is listed, every component
// needs its fields, the weightings must add up to exactly 100 (QCTO's calculator) and the QASA
// needs its Addendum pass % and FLC answer.
export function validateAssessmentDetails(input: AssessmentDetailsInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (input.components.length > MAX_ASSESSMENT_COMPONENTS) {
    issues.push({ field: 'components', message: `A QASA can have at most ${MAX_ASSESSMENT_COMPONENTS} components (the limit of QCTO's EISA Calculator).` });
  }
  input.components.forEach((c, i) => {
    const n = i + 1;
    if (!c.name.trim()) issues.push({ field: `components.${i}.name`, message: `Component ${n}: enter a name.` });
    if (!Number.isInteger(c.weightingPercent) || c.weightingPercent < 1 || c.weightingPercent > 100) {
      issues.push({ field: `components.${i}.weightingPercent`, message: `Component ${n}: ${WEIGHTING_REQUIRED_MESSAGE} (a whole number from 1 to 100).` });
    }
    if (!Number.isInteger(c.days) || c.days < 1) {
      issues.push({ field: `components.${i}.days`, message: `Component ${n}: the number of days must be a whole number of at least 1.` });
    }
    const highestOk = Number.isInteger(c.highestMark) && c.highestMark >= 1;
    if (!highestOk) {
      issues.push({ field: `components.${i}.highestMark`, message: `Component ${n}: the highest mark (component total) must be a whole number of at least 1.` });
    }
    if (!Number.isInteger(c.lowestMark) || c.lowestMark < 0) {
      issues.push({ field: `components.${i}.lowestMark`, message: `Component ${n}: the lowest mark (competence mark) must be a whole number of 0 or more.` });
    } else if (highestOk && c.lowestMark > c.highestMark) {
      issues.push({ field: `components.${i}.lowestMark`, message: `Component ${n}: the lowest mark (${c.lowestMark}) cannot be more than the highest mark (${c.highestMark}).` });
    }
  });
  if (input.components.length > 0) {
    const total = totalWeighting(input.components);
    if (total !== 100) issues.push({ field: 'components', message: `${WEIGHTING_TOTAL_MESSAGE}. They add up to ${total}.` });
    const pass = input.addendumPassPercent;
    if (pass === null || !Number.isInteger(pass) || pass < 1 || pass > 100) {
      issues.push({ field: 'addendumPassPercent', message: 'The addendum pass % must be a whole number from 1 to 100.' });
    }
    if (input.flcRequired === null) issues.push({ field: 'flcRequired', message: 'Answer whether FLC is required (Yes or No).' });
  }
  return issues;
}

export function addendumPassPercentOf(app: QsaAddendumApplication): number | null {
  return app.addendumPassPercent ?? null;
}

export function flcRequiredOf(app: QsaAddendumApplication): boolean | null {
  return app.flcRequired ?? null;
}

// Modelled on the Approval of Results hand-off (approval-of-results/api.ts): a snapshot stored
// on the record, plus an audit entry written by the caller. Batch L1.1: the addendum start date
// is the day the CEO signs the feedback letter (this is called at that moment).
export function buildCertificationHandoff(app: QsaAddendumApplication, notifiedAt: string, notifiedBy: string): QasaCertificationHandoff {
  return {
    notifiedAt,
    notifiedBy,
    components: componentsOf(app),
    approvedEisaSittingsPerYear: app.evaluationReport.approvedEisaSittingsPerYear,
    eisaSittingsOnDemand: app.evaluationReport.eisaSittingsOnDemand ?? false,
    addendumPassPercent: addendumPassPercentOf(app),
    flcRequired: flcRequiredOf(app),
    addendumStartDate: notifiedAt.slice(0, 10),
    addendumEndDate: getQualificationRegistrationEndDate(app.saqaId),
  };
}

// QCTO feedback 29.31: the components Approval of Results snapshots onto a results batch — the
// ones Certification was notified of at approval, so a running review (05.2) changes nothing
// until it is approved.
export function approvedComponentsOf(app: QsaAddendumApplication): AssessmentComponent[] {
  return app.certificationHandoff ? app.certificationHandoff.components.map(normaliseComponent) : componentsOf(app);
}

export interface ApprovedAddendum {
  passPercent: number | null;
  flcRequired: boolean | null;
  // Null until the CEO signs the feedback letter.
  startDate: string | null;
  endDate: string | null;
}

// Batch L1.1: the Addendum pass %, FLC and dates Certification was notified of; before the
// hand-off, the values currently on the QASA (start date not set yet).
export function approvedAddendumOf(app: QsaAddendumApplication): ApprovedAddendum {
  const h = app.certificationHandoff;
  if (h) {
    return {
      passPercent: h.addendumPassPercent ?? null,
      flcRequired: h.flcRequired ?? null,
      startDate: h.addendumStartDate ?? h.notifiedAt.slice(0, 10),
      endDate: h.addendumEndDate ?? getQualificationRegistrationEndDate(app.saqaId),
    };
  }
  return { passPercent: addendumPassPercentOf(app), flcRequired: flcRequiredOf(app), startDate: null, endDate: getQualificationRegistrationEndDate(app.saqaId) };
}

// The sittings other modules (the EISA Calendar) must use: the ones Certification was notified
// of at approval. QCTO feedback 05.2: while a review is running the ASD may change the
// evaluation report, but the approved values stay in force until the review is approved.
export function approvedSittingsOf(app: QsaAddendumApplication): { sittingsPerYear: number | null; onDemand: boolean } {
  const source = app.certificationHandoff;
  if (source) return { sittingsPerYear: source.approvedEisaSittingsPerYear, onDemand: source.eisaSittingsOnDemand };
  return { sittingsPerYear: app.evaluationReport.approvedEisaSittingsPerYear, onDemand: app.evaluationReport.eisaSittingsOnDemand ?? false };
}

export const ADDENDUM_START_PENDING_TEXT = 'set when the CEO signs the feedback letter';
export const ADDENDUM_END_MISSING_TEXT = 'registration end date not recorded';

// QCTO feedback 05.2 / Batch L1.1: an approved QASA is valid for the lifespan of the
// qualification, from the CEO's signature to the qualification's registration end date, and can
// be reviewed at any time.
export function qasaValidityText(app: QsaAddendumApplication): string {
  const { startDate, endDate } = approvedAddendumOf(app);
  return `Valid for the lifespan of the qualification: ${startDate ?? ADDENDUM_START_PENDING_TEXT} to ${endDate ?? ADDENDUM_END_MISSING_TEXT}`;
}

export function sittingsPerYearText(sittingsPerYear: number | null, onDemand: boolean): string {
  if (onDemand) return 'On demand';
  return sittingsPerYear == null ? 'Not recorded' : `${sittingsPerYear} per year`;
}

export function flcText(flcRequired: boolean | null): string {
  if (flcRequired === null) return 'Not recorded';
  return flcRequired ? 'Yes' : 'No';
}
