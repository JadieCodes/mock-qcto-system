// Batch N2 (29.29): Section E of QCTO's FISA verification report. Sections A-D are completed by the
// SDP (the uploaded "Verification report" evidence); Section E is QCTO's. E1 is the ASD's first
// evaluation, E2 the Deputy Director's recommendation and the approval. The system fills in
// everything it knows (fisaSectionEModel); the ASD and the DD add the rest (FisaSectionE).
import { sdpDirectoryEntryByName } from '../../mock/data/sdpDirectory';
import type { AuditEntry } from '../../shared/audit/types';
import type { ValidationIssue } from '../../shared/validation/types';
import { DIRECTOR_ASSESSMENT_NAME, RESULTS_AD_ROLE, RESULTS_DD_ROLE } from './config';
import { signOffFromAudit } from './downloads';
import { dateOf, fisaFinalEvidence, fisaResultsReceived, letterDateOf, turnaroundDays } from './trackingRegister';
import { fisaFiguresOf } from './workflow';
import type { FisaResultsBatch, FisaSectionE } from './types';

export function blankSectionE(): FisaSectionE {
  return {
    qctoMonitoringDate: '',
    periodOfSkillsProgramme: '',
    learnersViaTraining: null,
    learnersViaRpl: null,
    recommendation: null,
    nonCompliance: '',
    ddCompliance: null,
    ddComment: '',
  };
}

export const SECTION_E_ASD_FIELDS = ['qctoMonitoringDate', 'periodOfSkillsProgramme', 'learnersViaTraining', 'learnersViaRpl', 'recommendation', 'nonCompliance'] as const;
export const SECTION_E_DD_FIELDS = ['ddCompliance', 'ddComment'] as const;

function isCount(value: number | null): value is number {
  return value !== null && Number.isInteger(value) && value >= 0;
}

// What the ASD must have entered before the batch goes to the Deputy Director.
export function fisaSectionEIssues(batch: Pick<FisaResultsBatch, 'sectionE' | 'learnerResults'>): ValidationIssue[] {
  const e = batch.sectionE;
  const enrolled = batch.learnerResults.length;
  const issues: ValidationIssue[] = [];
  if (!e.periodOfSkillsProgramme.trim()) issues.push({ field: 'periodOfSkillsProgramme', message: 'E1 — enter the period of the skills programme.' });
  if (!isCount(e.learnersViaTraining)) issues.push({ field: 'learnersViaTraining', message: 'E1 — enter the number of learners via training (0 or more).' });
  if (!isCount(e.learnersViaRpl)) issues.push({ field: 'learnersViaRpl', message: 'E1 — enter the number of learners via RPL (0 or more).' });
  if (isCount(e.learnersViaTraining) && isCount(e.learnersViaRpl) && e.learnersViaTraining + e.learnersViaRpl !== enrolled) {
    issues.push({ field: 'learnersVia', message: `E1 — learners via training and via RPL must add up to the ${enrolled} enrolled.` });
  }
  if (!e.recommendation) issues.push({ field: 'recommendation', message: 'E1 — choose Approval or Non-approval.' });
  if (e.recommendation === 'non-approval' && !e.nonCompliance.trim()) issues.push({ field: 'nonCompliance', message: 'E1 — list the areas of non-compliance.' });
  return issues;
}

export function assertFisaSectionEComplete(batch: Pick<FisaResultsBatch, 'sectionE' | 'learnerResults'>): void {
  const issues = fisaSectionEIssues(batch);
  if (issues.length > 0) throw new Error(`Complete Section E1 of the verification report before advancing. ${issues[0].message}`);
}

export type SectionEPair = [label: string, value: string];

export interface SectionEModel {
  e1: SectionEPair[];
  e2: SectionEPair[];
  recommendedBy: { role: string; name: string; date: string };
  approvedBy: { role: string; name: string; date: string };
}

function rateText(part: number, whole: number, percent: number): string {
  return `${percent}% (${part} of ${whole})`;
}

function recommendationText(e: FisaSectionE): string {
  if (e.recommendation === 'approval') return 'Approval';
  if (e.recommendation === 'non-approval') return 'Non-approval';
  return '';
}

function complianceText(e: FisaSectionE): string {
  if (e.ddCompliance === 'complied') return 'The SDP complied with the requirements.';
  if (e.ddCompliance === 'not-complied') return 'The SDP did not comply with the requirements.';
  return '';
}

export function fisaSectionEModel(batch: FisaResultsBatch, audit: AuditEntry[]): SectionEModel {
  const e = batch.sectionE;
  const f = fisaFiguresOf(batch);
  const sdp = sdpDirectoryEntryByName(batch.sdpName);
  const asd = signOffFromAudit(audit, RESULTS_AD_ROLE);
  const dd = signOffFromAudit(audit, RESULTS_DD_ROLE);
  const received = fisaResultsReceived(batch);
  const finalEvidence = fisaFinalEvidence(batch);
  const letter = letterDateOf(batch);
  const count = (n: number | null) => (n === null ? '' : String(n));

  const e1: SectionEPair[] = [
    ['Name of Evaluator', asd.name],
    ['Date Evaluated', asd.date],
    ['SDP and Valid Accreditation number', sdp ? `${batch.sdpName} (${sdp.accreditationNumber})` : batch.sdpName],
    ['Date of QCTO Monitoring', e.qctoMonitoringDate],
    ['Skills Programme name', batch.skillsProgrammeTitle],
    ['Skills Programme ID', batch.skillsProgrammeId],
    ['NQF level', batch.nqfLevel],
    ['Credits', batch.credits],
    ['Period of Skills Programme', e.periodOfSkillsProgramme],
    ['Date of 1st submission (learner enrolments)', received],
    ['Date of 2nd submission (final results, verification report and FISA instrument)', batch.finalEvidenceReceivedAt ?? ''],
    ['Date of additional learner evidence requested', batch.evidenceRequestedAt ?? ''],
    ['Date of FISA', [...new Set(batch.fisaDates)].sort().join(', ')],
    ['No. of enrolled learners', String(f.enrolled)],
    ['No. learners that completed the FISA', String(f.completed)],
    ['No. learners via training', count(e.learnersViaTraining)],
    ['No. learners via RPL', count(e.learnersViaRpl)],
    ['No. declared C', String(f.competent)],
    ['No. declared NYC', String(f.notYetCompetent)],
    ['No. absent', String(f.absent)],
    ['Recommendations for improvements before the next FISA', batch.recommendationsForImprovement],
    ['Throughput rate (completed ÷ enrolled)', rateText(f.completed, f.enrolled, f.throughputRatePercent)],
    ['Competency Rate (C ÷ completed)', rateText(f.competent, f.completed, f.competencyRatePercent)],
    ['Date of remedial action requested', batch.evidenceRequestedAt ?? ''],
    ['Date of remedial action received', batch.finalEvidenceReceivedAt ?? ''],
    ['These results are recommended for', recommendationText(e)],
    ['If not approved, areas of non-compliance', e.nonCompliance],
  ];

  const e2: SectionEPair[] = [
    ['Name of Recommender (Deputy Director)', dd.name],
    ['Complied / not complied', [complianceText(e), e.ddComment].filter(Boolean).join(' ')],
    ['Date of approval/non-approval letter', letter],
    ['Turnaround time (working days from the last evidence to the letter)', turnaroundDays(finalEvidence, letter)],
    ['Approval Code', batch.finalDecision?.verificationCode ?? ''],
  ];

  return {
    e1,
    e2,
    recommendedBy: { role: 'Recommended by: DEPUTY DIRECTOR', name: dd.name, date: dd.date },
    // Assumption (progress.md, Batch N2): the "Director: Assessment Assurance" is the same mock
    // person who signs the Certification recommendation letters (config.ts), dated at the decision.
    approvedBy: { role: 'APPROVED BY: DIRECTOR: ASSESSMENT ASSURANCE', name: batch.finalDecision ? DIRECTOR_ASSESSMENT_NAME : '', date: batch.finalDecision ? dateOf(batch.finalDecision.decidedAt) : '' },
  };
}
