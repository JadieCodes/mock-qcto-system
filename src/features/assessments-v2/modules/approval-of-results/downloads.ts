// QCTO feedback 3.14 (d): "Download approval letter" and "Download verification report" on an
// approved EISA or FISA batch. UI-only: a small HTML file built here and downloaded in the
// browser — nothing is stored or sent anywhere.
import { roleDescriptor } from '../../config/roles';
import type { AuditEntry } from '../../shared/audit/types';
import { generateLetter } from '../../shared/letters/templates';
import type { GeneratedLetter } from '../../shared/letters/types';
import { formatFileSize } from '../rpl-toolkit/toolkitFiles';
import { fisaEvidenceTagLabel, RESULTS_CHIEF_DIRECTOR_ROLE } from './config';
import { absenteeismText, batchFiguresOf, calculateLearnerResult, competenceRateText, EISA_OUTCOME_LABELS } from './calculation';
import { fisaCompetencyRatePercent, fisaCompetentCountOf, RESULTS_WORKFLOW, resultsStatusLabel } from './workflow';
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
  // FISA: Learner | Outcome. EISA (29.31): a column per component, the weighted score and the result.
  learnerTable: LearnerTable;
  evidence: ReportEvidence[];
  declineHistory: ResultsDeclineEntry[];
  audit: AuditEntry[];
}

export interface ApprovalChainStep {
  stage: string;
  actorName: string;
  actorRole: string;
  date: string;
}

// The four approvals, in order, and the stage each one closes.
const CHAIN_ACTION_IDS = ['ad-advance', 'dd-advance', 'director-advance', 'chief-director-approve'];

function stageLabel(stageId: string): string {
  return RESULTS_WORKFLOW.stages.find((s) => s.id === stageId)?.label ?? stageId;
}

function roleLabel(role: AuditEntry['actorRole']): string {
  return roleDescriptor(role)?.label ?? role;
}

// The approval chain of the latest cycle (after the last resubmission), read from the audit trail.
export function approvalChainFromAudit(audit: AuditEntry[]): ApprovalChainStep[] {
  const ordered = [...audit].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const resubmitLabel = RESULTS_WORKFLOW.actions.find((a) => a.id === 'batch-resubmit')?.label;
  const lastResubmit = ordered.map((e) => e.action).lastIndexOf(resubmitLabel ?? '');
  const cycle = ordered.slice(lastResubmit + 1);
  return CHAIN_ACTION_IDS.flatMap((actionId) => {
    const action = RESULTS_WORKFLOW.actions.find((a) => a.id === actionId);
    const entry = action ? cycle.find((e) => e.action === action.label) : undefined;
    if (!action || !entry) return [];
    return [{ stage: stageLabel(action.fromStage), actorName: entry.actorName, actorRole: roleLabel(entry.actorRole), date: entry.timestamp.slice(0, 10) }];
  });
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function outcomeLabel(outcome: LearnerResult['outcome']): string {
  return outcome === 'competent' ? 'Competent' : 'Not yet competent';
}

function fisaLearnerTable(results: LearnerResult[]): LearnerTable {
  return { headers: ['Learner', 'Outcome'], rows: results.map((r) => [r.fullName, outcomeLabel(r.outcome)]) };
}

// QCTO feedback 29.31/29.32: each component column names its EISA date, total and pass mark.
function eisaLearnerTable(batch: ResultsBatch): LearnerTable {
  return {
    headers: [
      'Learner',
      ...batch.components.map((c) => `${c.name} (EISA date ${c.eisaDate}; out of ${c.totalMarks}, pass ${c.passMark})`),
      'Weighted score',
      'Result',
    ],
    rows: batch.learnerResults.map((learner) => {
      const calc = calculateLearnerResult(batch.components, learner);
      return [
        learner.fullName,
        ...calc.components.map((r) => (r.mark === null ? '—' : `${r.mark} (${r.competent ? 'C' : 'NYC'})`)),
        calc.weightedScorePercent === null ? '—' : `${calc.weightedScorePercent}%`,
        EISA_OUTCOME_LABELS[calc.outcome],
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

function page(title: string, content: string): string {
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

export function letterToHtml(letter: GeneratedLetter, subjectLabel: string): string {
  const { data } = letter;
  const signed = data.signatoryName ? `${data.signatoryName}${data.signatoryTitle ? `, ${data.signatoryTitle}` : ''}` : 'Signature pending';
  return page(
    letter.title,
    `<h1>${escapeHtml(letter.title)}</h1>
${definitionList([
  { label: 'To', value: data.qpName },
  { label: subjectLabel, value: data.qualificationTitle },
  { label: 'Date', value: data.date },
])}
<h2>Letter</h2>
<div class="body">${escapeHtml(letter.body)}</div>
<h2>Signed</h2>
<p>${escapeHtml(signed)}</p>`,
  );
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
<h2>Approval chain</h2>
${table(['Stage', 'Name', 'Role', 'Date'], chain.map((s) => [s.stage, s.actorName, s.actorRole, s.date]))}
${
  input.declineHistory.length > 0
    ? `<h2>Earlier declines</h2>
${table(['Stage', 'Declined by', 'Reason', 'Date'], input.declineHistory.map((d) => [stageLabel(d.stageId), d.decidedBy, d.reason, d.decidedAt.slice(0, 10)]))}`
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

function approvedOn(batch: { recommendation: { recommendedAt: string } | null }): string {
  return (batch.recommendation?.recommendedAt ?? new Date().toISOString()).slice(0, 10);
}

// ----- EISA -----

// QCTO feedback 29.31/29.32: the EISA date and the batch figures (competency rate = competent ÷ wrote).
function eisaApprovalNotes(batch: ResultsBatch): string {
  const f = batchFiguresOf(batch);
  const absent = f.absent > 0 ? ` ${f.absent} of the ${f.registered} registered learners were absent.` : '';
  return `EISA date ${batch.sittingDate}: ${f.competent} of the ${f.wrote} learners who wrote were found competent (${f.competenceRatePercent}%).${absent} The results have been recommended to the Certification domain for certificate printing.`;
}

export function eisaApprovalLetter(batch: ResultsBatch): GeneratedLetter {
  return generateLetter(
    'approval',
    batch.id,
    {
      qpName: batch.qpName,
      qualificationTitle: batch.qualificationTitle,
      date: approvedOn(batch),
      signatoryName: batch.recommendation?.recommendedBy,
      signatoryTitle: RESULTS_CHIEF_DIRECTOR_ROLE,
      notes: eisaApprovalNotes(batch),
    },
    'Approval Letter',
    'eisa-results',
  );
}

export function downloadEisaApprovalLetter(batch: ResultsBatch): void {
  downloadHtmlFile(`Approval_Letter_EISA_${fileSafe(batch.qualificationTitle)}_${batch.sittingDate}.html`, letterToHtml(eisaApprovalLetter(batch), 'Qualification'));
}

export function downloadEisaVerificationReport(batch: ResultsBatch, audit: AuditEntry[]): void {
  const figures = batchFiguresOf(batch);
  const html = verificationReportToHtml({
    heading: 'Verification Report — EISA Results',
    details: [
      { label: 'Qualification', value: batch.qualificationTitle },
      { label: 'QP', value: batch.qpName },
      { label: 'EISA date', value: batch.sittingDate },
      { label: 'Submitted', value: batch.submittedAt.slice(0, 10) },
      { label: 'Submission deadline', value: batch.submissionDeadline },
      { label: 'Registered', value: String(figures.registered) },
      { label: 'Wrote', value: String(figures.wrote) },
      { label: 'Competent / Not yet competent', value: `${figures.competent} / ${figures.notYetCompetent}` },
      { label: 'Competency rate', value: competenceRateText(figures) },
      { label: 'Absenteeism', value: absenteeismText(figures) },
      { label: 'Status', value: resultsStatusLabel(batch) },
      { label: 'Cycle', value: String(batch.cycleCount) },
    ],
    learnerTable: eisaLearnerTable(batch),
    evidence: batch.evidenceDocuments,
    declineHistory: batch.declineHistory,
    audit,
  });
  downloadHtmlFile(`Verification_Report_EISA_${fileSafe(batch.qualificationTitle)}_${batch.sittingDate}.html`, html);
}

// ----- FISA -----

export function fisaApprovalLetter(batch: FisaResultsBatch): GeneratedLetter {
  return generateLetter(
    'approval',
    batch.id,
    {
      qpName: batch.sdpName,
      qualificationTitle: batch.skillsProgrammeTitle,
      date: (batch.approvalLetter?.generatedAt ?? new Date().toISOString()).slice(0, 10),
      signatoryName: batch.approvalLetter?.signedBy,
      signatoryTitle: RESULTS_CHIEF_DIRECTOR_ROLE,
      notes: `${fisaCompetentCountOf(batch)} of ${batch.learnerResults.length} learners assessed by ${batch.sdpName} were found competent. The results have been recommended to the Certification domain for certificate printing.`,
    },
    'Approval Letter',
    'fisa-results',
  );
}

export function downloadFisaApprovalLetter(batch: FisaResultsBatch): void {
  const date = (batch.approvalLetter?.generatedAt ?? '').slice(0, 10);
  downloadHtmlFile(`Approval_Letter_FISA_${fileSafe(batch.skillsProgrammeTitle)}_${fileSafe(batch.sdpName)}_${date}.html`, letterToHtml(fisaApprovalLetter(batch), 'Skills programme'));
}

export function downloadFisaVerificationReport(batch: FisaResultsBatch, audit: AuditEntry[]): void {
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
      { label: 'Competency rate', value: `${fisaCompetencyRatePercent(batch)}% (${fisaCompetentCountOf(batch)} of ${batch.learnerResults.length})` },
      { label: 'Status', value: resultsStatusLabel(batch) },
      { label: 'Cycle', value: String(batch.cycleCount) },
      { label: 'Approval letter', value: batch.approvalLetter ? `Sent to the SDP on ${batch.approvalLetter.sentToSdpAt.slice(0, 10)}` : '—' },
    ],
    learnerTable: fisaLearnerTable(batch.learnerResults),
    evidence: batch.evidenceDocuments.map((d) => ({ ...d, tag: fisaEvidenceTagLabel(d.tag) })),
    declineHistory: batch.declineHistory,
    audit,
  });
  downloadHtmlFile(`Verification_Report_FISA_${fileSafe(batch.skillsProgrammeTitle)}_${fileSafe(batch.sdpName)}.html`, html);
}
