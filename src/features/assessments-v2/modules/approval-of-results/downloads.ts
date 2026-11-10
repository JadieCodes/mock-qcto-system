// QCTO feedback 3.14 (d): HTML downloads on an EISA or FISA batch. UI-only: a small HTML file built
// here and downloaded in the browser — nothing is stored or sent anywhere. Batch N2: the two
// verification reports now follow QCTO's own layouts (eisaVerificationReport.ts,
// fisaVerificationReport.ts); this file keeps the page shell, the approval chain read from the audit
// trail and the annexure (learner results, evidence, chain, audit trail) both reports end with.
import { roleDescriptor } from '../../config/roles';
import type { AuditEntry } from '../../shared/audit/types';
import { formatFileSize } from '../rpl-toolkit/toolkitFiles';
import type { DocBlock } from './documentModel';
import type { Role } from '../../types';
import {
  fisaOutcomeLabel,
  RESULTS_AD_ROLE,
  RESULTS_CHIEF_DIRECTOR_ROLE,
  RESULTS_DD_ROLE,
  RESULTS_DIRECTOR_ROLE,
} from './config';
import { calculateLearnerResult, EISA_OUTCOME_LABELS, reasonText } from './calculation';
import { RESULTS_WORKFLOW } from './workflow';
import type { LearnerResult, ResultsBatch, ResultsDeclineEntry } from './types';

interface ReportEvidence {
  fileName: string;
  fileSize: number;
  fileType?: string;
  tag?: string;
  uploadedAt: string;
}

export interface LearnerTable {
  headers: string[];
  rows: string[][];
}

export interface AnnexInput {
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

export function stageLabel(stageId: string): string {
  return RESULTS_WORKFLOW.stages.find((s) => s.id === stageId)?.label ?? stageId;
}

export function roleLabel(role: AuditEntry['actorRole']): string {
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

// Batch P (05.21): the FISA result shows QCTO's code next to the outcome, e.g. "Competent (555)".
function outcomeLabel(outcome: LearnerResult['outcome']): string {
  return fisaOutcomeLabel(outcome);
}

export function fisaLearnerTable(results: LearnerResult[]): LearnerTable {
  return { headers: ['Learner', 'ID number', 'Outcome'], rows: results.map((r) => [r.fullName, r.idNumber, outcomeLabel(r.outcome)]) };
}

// QCTO feedback 29.31/29.32, Batch L1.1: each component column names its EISA date, highest and
// lowest mark and weighting; each cell has the mark (EISA Component Achievement Value), the
// component % and C/NYC.
export function eisaLearnerTable(batch: ResultsBatch): LearnerTable {
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
th { background: #f9fafb; } .draft { border: 2px solid #d97706; background: #fffbeb; color: #92400e; padding: 8px 12px; font-weight: bold; } dl { display: grid; grid-template-columns: 200px 1fr; gap: 4px 12px; font-size: 14px; } dt { color: #6b7280; }
.body { white-space: pre-wrap; font-size: 14px; }
</style>
</head>
<body>
<p class="org">QCTO</p>
${content}
</body>
</html>`;
}

// Batch N.1: who acted at each approval stage in the deciding cycle, with their comment (the
// Approval Chain tab).
export interface ApprovalHistoryStep {
  stageId: string;
  stage: string;
  actorName: string;
  actorRole: string;
  date: string;
  comment: string;
}

export function approvalHistoryFromAudit(audit: AuditEntry[]): ApprovalHistoryStep[] {
  return chainEntriesFromAudit(audit).map(({ stageId, entry }) => ({
    stageId,
    stage: stageLabel(stageId),
    actorName: entry.actorName,
    actorRole: roleLabel(entry.actorRole),
    date: entry.timestamp.slice(0, 10),
    comment: entry.note ?? '',
  }));
}

// The annexure both verification reports end with. The QP and the SDP get annexures A and B only:
// the approval chain and the audit trail carry QCTO's internal comments.
export function annexBlocks(input: AnnexInput, audience: 'internal' | 'external'): DocBlock[] {
  const blocks: DocBlock[] = [
    { kind: 'h2', text: 'Annexure A: learner results' },
    { kind: 'table', headers: input.learnerTable.headers, rows: input.learnerTable.rows },
    { kind: 'h2', text: 'Annexure B: evidence' },
    {
      kind: 'table',
      headers: ['File', 'Tag', 'Type', 'Size', 'Uploaded'],
      rows: input.evidence.map((d) => [d.fileName, d.tag ?? '—', d.fileType ?? '—', formatFileSize(d.fileSize), d.uploadedAt.slice(0, 10)]),
    },
  ];
  if (input.onFile && input.onFile.length > 0) {
    blocks.push(
      { kind: 'h3', text: 'Already on file' },
      { kind: 'table', headers: ['Document', 'File', 'QP choice'], rows: input.onFile.map((d) => [d.label, d.fileName, d.choice]) },
    );
  }
  if (audience === 'external') return blocks;
  const chain = approvalChainFromAudit(input.audit);
  const audit = [...input.audit].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  blocks.push(
    { kind: 'h2', text: 'Annexure C: approval chain' },
    { kind: 'table', headers: ['Stage', 'Name', 'Role', 'Date'], rows: chain.map((s) => [s.stage, s.actorName, s.actorRole, s.date]) },
  );
  if (input.declineHistory.length > 0) {
    blocks.push(
      { kind: 'h3', text: 'Earlier requests for more evidence' },
      {
        kind: 'table',
        headers: ['Stage', 'Requested by', 'Reason', 'Date'],
        rows: input.declineHistory.map((d) => [stageLabel(d.stageId), d.decidedBy, d.reason, d.decidedAt.slice(0, 10)]),
      },
    );
  }
  blocks.push(
    { kind: 'h2', text: 'Annexure D: audit trail' },
    {
      kind: 'table',
      headers: ['Date and time', 'Action', 'Name', 'Role', 'Note'],
      rows: audit.map((e) => [new Date(e.timestamp).toLocaleString('en-ZA'), e.action, e.actorName, roleLabel(e.actorRole), e.note ?? '']),
    },
  );
  return blocks;
}

// Batch N2: the name and date of the person who took the given role's step in the deciding cycle
// (the sign-off blocks of both verification reports). Blank until that role has acted.
export function signOffFromAudit(audit: AuditEntry[], role: Role): { name: string; date: string } {
  const entry = chainEntriesFromAudit(audit).find((c) => c.role === role)?.entry;
  return { name: entry?.actorName ?? '', date: entry ? entry.timestamp.slice(0, 10) : '' };
}

export function downloadHtmlFile(fileName: string, html: string): void {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function fileSafe(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

