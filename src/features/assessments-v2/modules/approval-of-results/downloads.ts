// QCTO feedback 3.14 (d): "Download outcome letter" and "Download verification report" on an
// approved EISA or FISA batch. UI-only: a small HTML file built here and downloaded in the
// browser — nothing is stored or sent anywhere.
import { roleDescriptor } from '../../config/roles';
import type { AuditEntry } from '../../shared/audit/types';
import { formatFileSize } from '../rpl-toolkit/toolkitFiles';
import type { Role } from '../../types';
import {
  eisaEvidenceTagLabel,
  fisaEvidenceTagLabel,
  onFileChoiceText,
  RESULTS_AD_ROLE,
  RESULTS_CHIEF_DIRECTOR_ROLE,
  RESULTS_DD_ROLE,
  RESULTS_DIRECTOR_ROLE,
} from './config';
import { absenteeismText, batchFiguresOf, calculateLearnerResult, competenceRateText, EISA_OUTCOME_LABELS, reasonText, throughputRateText } from './calculation';
import { fisaFiguresOf, RESULTS_WORKFLOW, resultsStatusLabel } from './workflow';
import type { FisaResultsBatch, LearnerResult, ResultsBatch, ResultsDeclineEntry } from './types';

interface ReportEvidence {
  fileName: string;
  fileSize: number;
  fileType?: string;
  tag?: string;
  uploadedAt: string;
}

interface LearnerTable {
  headers: string[];
  rows: string[][];
}

interface VerificationReportInput {
  heading: string;
  details: { label: string; value: string }[];
  // FISA: Learner | ID number | Outcome. EISA (29.31, L1.1): a column per component, the EISA percentage, the pass % and the result with its reason.
  learnerTable: LearnerTable;
  evidence: ReportEvidence[];
  // QCTO feedback 29.25: EISA only — the documents QCTO already held and what the QP chose.
  onFile?: { label: string; fileName: string; choice: string }[];
  declineHistory: ResultsDeclineEntry[];
  audit: AuditEntry[];
}

export interface ApprovalChainStep {
  stage: string;
  actorName: string;
  actorRole: string;
  date: string;
}

// The four approvals, in order: the role that acts and the actions that close the stage. Batch N1:
// the Deputy Director and the Director may "Recommend decline" instead of sending the batch on, and
// the Chief Director may decline. The role is checked as well, because both recommend-decline
// actions share one label.
const CHAIN_STEPS: { role: Role; actionIds: string[] }[] = [
  { role: RESULTS_AD_ROLE, actionIds: ['ad-advance'] },
  { role: RESULTS_DD_ROLE, actionIds: ['dd-advance', 'dd-recommend-decline'] },
  { role: RESULTS_DIRECTOR_ROLE, actionIds: ['director-advance', 'director-recommend-decline'] },
  { role: RESULTS_CHIEF_DIRECTOR_ROLE, actionIds: ['chief-director-approve', 'chief-director-decline'] },
];

function stageLabel(stageId: string): string {
  return RESULTS_WORKFLOW.stages.find((s) => s.id === stageId)?.label ?? stageId;
}

function roleLabel(role: AuditEntry['actorRole']): string {
  return roleDescriptor(role)?.label ?? role;
}

interface ChainEntry {
  role: Role;
  stageId: string;
  entry: AuditEntry;
}

// The latest cycle (after the last resubmission), read from the audit trail.
function chainEntriesFromAudit(audit: AuditEntry[]): ChainEntry[] {
  const ordered = [...audit].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const resubmitLabel = RESULTS_WORKFLOW.actions.find((a) => a.id === 'batch-resubmit')?.label;
  const lastResubmit = ordered.map((e) => e.action).lastIndexOf(resubmitLabel ?? '');
  const cycle = ordered.slice(lastResubmit + 1);
  return CHAIN_STEPS.flatMap((step) => {
    const actions = RESULTS_WORKFLOW.actions.filter((a) => step.actionIds.includes(a.id));
    const entry = cycle.find((e) => e.actorRole === step.role && actions.some((a) => a.label === e.action));
    return entry && actions[0] ? [{ role: step.role, stageId: actions[0].fromStage, entry }] : [];
  });
}

export function approvalChainFromAudit(audit: AuditEntry[]): ApprovalChainStep[] {
  return chainEntriesFromAudit(audit).map(({ stageId, entry }) => ({
    stage: stageLabel(stageId),
    actorName: entry.actorName,
    actorRole: roleLabel(entry.actorRole),
    date: entry.timestamp.slice(0, 10),
  }));
}

// Batch N1: the ASD, Deputy Director and Director who acted in the deciding cycle (for the
// Certification recommendation letter's signature lines).
export function reviewersFromAudit(audit: AuditEntry[]): { asdName: string; ddName: string; directorName: string } {
  const chain = chainEntriesFromAudit(audit);
  const nameOf = (role: Role) => chain.find((c) => c.role === role)?.entry.actorName ?? '';
  return { asdName: nameOf(RESULTS_AD_ROLE), ddName: nameOf(RESULTS_DD_ROLE), directorName: nameOf(RESULTS_DIRECTOR_ROLE) };
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function outcomeLabel(outcome: LearnerResult['outcome']): string {
  if (outcome === 'absent') return 'Absent';
  return outcome === 'competent' ? 'Competent' : 'Not yet competent';
}

function fisaLearnerTable(results: LearnerResult[]): LearnerTable {
  return { headers: ['Learner', 'ID number', 'Outcome'], rows: results.map((r) => [r.fullName, r.idNumber, outcomeLabel(r.outcome)]) };
}

// QCTO feedback 29.31/29.32, Batch L1.1: each component column names its EISA date, highest and
// lowest mark and weighting; each cell has the mark (EISA Component Achievement Value), the
// component % and C/NYC.
function eisaLearnerTable(batch: ResultsBatch): LearnerTable {
  return {
    headers: [
      'Learner',
      'ID number',
      ...batch.components.map((c) => `${c.name} (EISA date ${c.eisaDate}; highest ${c.highestMark}, lowest ${c.lowestMark}, weighting ${c.weightingPercent}%)`),
      'EISA Percentage Obtained (decimal)',
      'EISA Percentage Obtained (final)',
      'Pass %',
      'Result',
    ],
    rows: batch.learnerResults.map((learner) => {
      const calc = calculateLearnerResult(batch.components, learner, batch.addendumPassPercent);
      return [
        learner.fullName,
        learner.idNumber,
        ...calc.components.map((r) => (r.mark === null ? '—' : `${r.mark} (${r.percent}%, ${r.competent ? 'C' : 'NYC'})`)),
        calc.eisaPercentDecimal === null ? '—' : `${calc.eisaPercentDecimal}%`,
        calc.eisaPercentFinal === null ? '—' : `${calc.eisaPercentFinal}%`,
        `${calc.passPercent}%`,
        calc.reasons.length > 0 ? `${EISA_OUTCOME_LABELS[calc.outcome]} (${reasonText(calc)})` : EISA_OUTCOME_LABELS[calc.outcome],
      ];
    }),
  };
}

function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return '<p class="muted">None.</p>';
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function page(title: string, content: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
body { font-family: Georgia, serif; color: #1f2937; max-width: 820px; margin: 32px auto; padding: 0 16px; line-height: 1.5; }
h1 { font-size: 22px; margin: 4px 0 16px; } h2 { font-size: 16px; margin: 28px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
.org { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; }
.muted { color: #6b7280; font-size: 13px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; } th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
th { background: #f9fafb; } dl { display: grid; grid-template-columns: 200px 1fr; gap: 4px 12px; font-size: 14px; } dt { color: #6b7280; }
.body { white-space: pre-wrap; font-size: 14px; }
</style>
</head>
<body>
<p class="org">QCTO</p>
${content}
</body>
</html>`;
}

function definitionList(items: { label: string; value: string }[]): string {
  return `<dl>${items.map((i) => `<dt>${escapeHtml(i.label)}</dt><dd>${escapeHtml(i.value)}</dd>`).join('')}</dl>`;
}

export function verificationReportToHtml(input: VerificationReportInput): string {
  const chain = approvalChainFromAudit(input.audit);
  const audit = [...input.audit].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return page(
    input.heading,
    `<h1>${escapeHtml(input.heading)}</h1>
<p class="muted">Generated on ${escapeHtml(new Date().toLocaleString('en-ZA'))}.</p>
<h2>Batch details</h2>
${definitionList(input.details)}
<h2>Learner results</h2>
${table(input.learnerTable.headers, input.learnerTable.rows)}
<h2>Evidence</h2>
${table(
  ['File', 'Tag', 'Type', 'Size', 'Uploaded'],
  input.evidence.map((d) => [d.fileName, d.tag ?? '—', d.fileType ?? '—', formatFileSize(d.fileSize), d.uploadedAt.slice(0, 10)]),
)}
${
  input.onFile && input.onFile.length > 0
    ? `<h2>Already on file</h2>
${table(['Document', 'File', 'QP choice'], input.onFile.map((d) => [d.label, d.fileName, d.choice]))}`
    : ''
}
<h2>Approval chain</h2>
${table(['Stage', 'Name', 'Role', 'Date'], chain.map((s) => [s.stage, s.actorName, s.actorRole, s.date]))}
${
  input.declineHistory.length > 0
    ? `<h2>Earlier requests for more evidence</h2>
${table(['Stage', 'Requested by', 'Reason', 'Date'], input.declineHistory.map((d) => [stageLabel(d.stageId), d.decidedBy, d.reason, d.decidedAt.slice(0, 10)]))}`
    : ''
}
<h2>Audit trail</h2>
${table(
  ['Date and time', 'Action', 'Name', 'Role', 'Note'],
  audit.map((e) => [new Date(e.timestamp).toLocaleString('en-ZA'), e.action, e.actorName, roleLabel(e.actorRole), e.note ?? '']),
)}`,
  );
}

export function downloadHtmlFile(fileName: string, html: string): void {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function fileSafe(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// ----- EISA -----

export function downloadEisaVerificationReport(batch: ResultsBatch, audit: AuditEntry[]): void {
  const figures = batchFiguresOf(batch);
  const html = verificationReportToHtml({
    heading: 'Verification Report — EISA Results',
    details: [
      { label: 'Qualification', value: batch.qualificationTitle },
      { label: 'QP', value: batch.qpName },
      { label: 'EISA date', value: batch.sittingDate },
      { label: 'Submitted', value: batch.submittedAt.slice(0, 10) },
      { label: 'Declaration', value: `Made by ${batch.declaration.acceptedBy} on ${batch.declaration.acceptedAt.slice(0, 10)}` },
      { label: 'Submission deadline', value: batch.submissionDeadline },
      { label: 'Addendum pass %', value: `${batch.addendumPassPercent}%` },
      { label: 'Registered', value: String(figures.registered) },
      { label: 'Wrote', value: String(figures.wrote) },
      { label: 'Competent / Not yet competent', value: `${figures.competent} / ${figures.notYetCompetent}` },
      { label: 'Competency rate', value: competenceRateText(figures) },
      { label: 'Absenteeism', value: absenteeismText(figures) },
      { label: 'Throughput rate', value: throughputRateText(figures) },
      { label: 'Verification code', value: batch.finalDecision?.verificationCode ?? '—' },
      { label: 'Status', value: resultsStatusLabel(batch) },
      { label: 'Cycle', value: String(batch.cycleCount) },
    ],
    learnerTable: eisaLearnerTable(batch),
    evidence: batch.evidenceDocuments.map((d) => ({ ...d, tag: eisaEvidenceTagLabel(d.tag) })),
    onFile: batch.onFileDocuments.map((d) => ({ label: d.label, fileName: d.replacement?.fileName ?? d.fileName, choice: onFileChoiceText(d) })),
    declineHistory: batch.declineHistory,
    audit,
  });
  downloadHtmlFile(`Verification_Report_EISA_${fileSafe(batch.qualificationTitle)}_${batch.sittingDate}.html`, html);
}

// ----- FISA -----

export function downloadFisaVerificationReport(batch: FisaResultsBatch, audit: AuditEntry[]): void {
  const figures = fisaFiguresOf(batch);
  const html = verificationReportToHtml({
    heading: 'Verification Report — FISA Results',
    details: [
      { label: 'Skills programme', value: batch.skillsProgrammeTitle },
      { label: 'SDP', value: batch.sdpName },
      { label: 'Submitted', value: batch.submittedAt?.slice(0, 10) ?? '—' },
      {
        label: 'Declaration',
        value: batch.declaration ? `Ticked by ${batch.declaration.acceptedBy} on ${batch.declaration.acceptedAt.slice(0, 10)}` : '—',
      },
      { label: 'Date of FISA', value: batch.fisaDates.join(', ') },
      { label: 'Competency rate', value: `${figures.competencyRatePercent}% (${figures.competent} of ${figures.completed} completed)` },
      { label: 'Throughput rate', value: `${figures.throughputRatePercent}% (${figures.completed} of ${figures.enrolled} enrolled)` },
      { label: 'Verification code', value: batch.finalDecision?.verificationCode ?? '—' },
      { label: 'Status', value: resultsStatusLabel(batch) },
      { label: 'Cycle', value: String(batch.cycleCount) },
      { label: 'Outcome letter', value: batch.approvalLetter ? `Sent to the SDP on ${batch.approvalLetter.sentToSdpAt.slice(0, 10)}` : '—' },
    ],
    learnerTable: fisaLearnerTable(batch.learnerResults),
    evidence: batch.evidenceDocuments.map((d) => ({ ...d, tag: fisaEvidenceTagLabel(d.tag) })),
    declineHistory: batch.declineHistory,
    audit,
  });
  downloadHtmlFile(`Verification_Report_FISA_${fileSafe(batch.skillsProgrammeTitle)}_${fileSafe(batch.sdpName)}.html`, html);
}
