// Batch N2 (29.29): QCTO's "EISA QUALITY ASSURANCE VERIFICATION REPORT" for an EISA batch, in QCTO's
// section order (1, 2, 4, 5, the A-F administration list and the sign-off blocks), followed by the
// Deputy Director's letter checklist and the annexure (learner results, evidence, chain, audit
// trail). The content is built as plain data first (eisaReportSections) so the checks read the same
// figures the download prints. UI-only: a small HTML file built in the browser.
import { qpDirectoryEntryFor } from '../../mock/data/qpDirectory';
import { sdpDirectoryEntryByName } from '../../mock/data/sdpDirectory';
import type { AuditEntry } from '../../shared/audit/types';
import { batchFiguresOf, competenceRateText, throughputRateText } from './calculation';
import { annexBlocks, eisaLearnerTable, fileSafe, signOffFromAudit } from './downloads';
import { downloadDoc, type DocBlock, type DocModel } from './documentModel';
import { EISA_IRREGULARITIES_REPORTED, eisaEvidenceTagLabel, onFileChoiceText, RESULTS_AD_ROLE, RESULTS_DD_ROLE, RESULTS_DIRECTOR_ROLE } from './config';
import { eisaReviewRows } from './eisaReview';
import { ddCheckedIdsOf, ddCompletedText, ddLetterTable, DD_LETTER_CHECK_LINES } from './letterChecklist';
import { dateOf, eisaFinalEvidence, eisaResultsReceived, letterDateOf } from './trackingRegister';
import { verificationCodeOf } from './verificationCode';
import type { ResultsBatch } from './types';

// What the report needs that the batch itself does not hold: the dates of the approved Marking &
// Moderation monitoring reports for the sitting (Site Visits).
export interface EisaReportContext {
  monitoringReportDates: string[];
}

export const NO_REPORT_CONTEXT: EisaReportContext = { monitoringReportDates: [] };

export interface AdministrationRow {
  group: string;
  label: string;
  onFile: boolean;
  date: string;
  optional?: boolean;
}

function firstEvidence(batch: ResultsBatch, tag: ResultsBatch['evidenceDocuments'][number]['tag']): string | null {
  const doc = batch.evidenceDocuments.find((d) => d.tag === tag);
  return doc ? dateOf(doc.uploadedAt) : null;
}

function onFileDate(batch: ResultsBatch, matches: (id: string) => boolean): string | null {
  const docs = batch.onFileDocuments.filter((d) => matches(d.id));
  return docs.length > 0 ? dateOf(docs.map((d) => d.decidedAt).sort().at(-1) ?? '') : null;
}

function accredited(names: string[]): boolean {
  return names.length > 0 && names.every((n) => sdpDirectoryEntryByName(n)?.accreditationNumber);
}

export function sdpNamesOf(batch: ResultsBatch): string[] {
  return [...new Set(batch.sourceInfo.learners.map((l) => l.sdpName))];
}

// QCTO's A-F "Administration completed and confirmed". A line is ticked when the system holds the
// document (an evidence tag, an "Already on file" choice, a generated letter, a held record), with
// the date where the system has one.
export function eisaAdministrationRows(batch: ResultsBatch, ctx: EisaReportContext): AdministrationRow[] {
  const decision = batch.finalDecision;
  const letter = decision ? dateOf(decision.decidedAt) : '';
  const monitoring = ctx.monitoringReportDates.slice().sort()[0] ?? null;
  const instrument = onFileDate(batch, (id) => id === 'instrument-development-report' || id === 'instrument-validation-report');
  const row = (group: string, label: string, date: string | null, extra: Partial<AdministrationRow> = {}): AdministrationRow => ({
    group,
    label,
    onFile: date !== null,
    date: date ?? '',
    ...extra,
  });
  const A = 'A. Notification of EISA';
  const B = 'B. Monitoring of EISA';
  const C = 'C. Marking and Moderation';
  const D = 'D. Learner Achievements';
  const E = 'E. QA Verification';
  const F = 'F. Proof of date final evidence received';
  return [
    row(A, 'Approved QAS Addendum', ''),
    row(A, 'Notification form', batch.sourceInfo.notifiedAt),
    row(A, 'Confidentiality agreements', onFileDate(batch, (id) => id.startsWith('confidentiality-agreement'))),
    row(A, 'QP website checklist', null),
    row(A, 'ACs accredited', accredited(batch.centres) ? '' : null),
    row(A, 'SDPs accredited', accredited(sdpNamesOf(batch)) ? '' : null),
    row(B, 'Monitoring of EISA', monitoring),
    row(C, 'QCTO monitoring report', monitoring),
    row(C, "Marker's report", firstEvidence(batch, 'marking-report')),
    row(C, "Moderator's report", firstEvidence(batch, 'moderation-report')),
    row(C, "External moderator's report", null, { optional: true }),
    row(D, 'File 3', eisaResultsReceived(batch)),
    row(D, 'Analysis of results report', null),
    row(D, 'Declaration', dateOf(batch.declaration.acceptedAt)),
    row(D, 'Copy of instrument and marking guideline', instrument),
    row(D, 'Confirmation letter', firstEvidence(batch, 'confirmation-letter')),
    row(D, 'Verification report', decision ? letter : null),
    row(E, 'QA verification report', decision ? letter : null),
    row(E, 'Learner approval letter to QP', decision ? letter : null),
    row(E, 'Certification recommendation letter', batch.recommendation ? dateOf(batch.recommendation.recommendedAt) : null),
    row(E, 'Checklist', batch.ddChecklist?.completedAt ? dateOf(batch.ddChecklist.completedAt) : null),
    row(E, 'Tracking register', decision?.outcome === 'approved' ? letter : null),
    row(F, 'Proof of date final evidence received', eisaFinalEvidence(batch)),
  ];
}

function addressOf(name: string): string {
  return sdpDirectoryEntryByName(name)?.postalAddress.join(', ') ?? '';
}

function numberedPlaces(names: string[]): string[][] {
  return names.map((name, i) => [String(i + 1), name, addressOf(name), sdpDirectoryEntryByName(name)?.accreditationNumber ?? '']);
}

export interface EisaReportDetails {
  details: [string, string][];
  componentRows: string[][];
  passMark: string;
  centreRows: string[][];
  sdpRows: string[][];
}

export function eisaReportDetails(batch: ResultsBatch): EisaReportDetails {
  const f = batchFiguresOf(batch);
  const qp = qpDirectoryEntryFor(batch.qpId);
  const rpl = batch.sourceInfo.learners.filter((l) => l.rpl).length;
  const perSdp = new Map<string, number>();
  batch.sourceInfo.learners.filter((l) => !l.rpl).forEach((l) => perSdp.set(l.sdpName, (perSdp.get(l.sdpName) ?? 0) + 1));
  const perSdpText = [...perSdp.entries()].map(([name, n]) => `${name}: ${n}`).join('; ');
  const approved = batch.finalDecision?.outcome === 'approved';
  return {
    details: [
      ['Title of Qualification', batch.qualificationTitle],
      ['SAQA ID', batch.saqaId],
      ['Level', batch.nqfLevel],
      ['Credits', batch.credits],
      ['Total Number of Candidates', String(f.registered)],
      ['Number of candidates per SDP', perSdpText ? `${f.registered - rpl} (${perSdpText})` : String(f.registered - rpl)],
      ['Number of candidates per RPL', String(rpl)],
      ['Name of QP', batch.qpName],
      ['Telephone Number of QP', qp?.telephone ?? ''],
      ['Email address of QP', qp?.email ?? ''],
      ['Contact Person at QP', qp ? `${qp.contactTitle} ${qp.name}` : batch.qpName],
      ['Number of EISA Components', String(batch.components.length)],
      ['Date Results received from QP', eisaResultsReceived(batch)],
      ['Date final outstanding evidence received from QP', eisaFinalEvidence(batch)],
      ['Date of Approval of Results', approved ? letterDateOf(batch) : ''],
    ],
    // Time (from/to) stays blank: the QASA does not hold a time of day.
    componentRows: batch.components.map((c, i) => [
      `${i + 1}. ${c.name}`,
      c.eisaDate,
      c.type === 'written' ? 'Written' : 'Practical',
      `${c.weightingPercent}%`,
      c.days === undefined ? '' : String(c.days),
      '',
      String(c.lowestMark),
    ]),
    passMark: `${batch.addendumPassPercent}%`,
    centreRows: numberedPlaces(batch.centres),
    sdpRows: numberedPlaces(sdpNamesOf(batch)),
  };
}

export interface EisaStatistics {
  registered: number;
  sat: number;
  passed: number;
  passRate: string;
}

// Section 4: registered (File 4), sat and passed (File 3), pass rate = passed / sat.
export function eisaStatistics(batch: ResultsBatch): EisaStatistics {
  const f = batchFiguresOf(batch);
  return { registered: f.registered, sat: f.wrote, passed: f.competent, passRate: f.wrote === 0 ? '' : `${Math.round((f.competent / f.wrote) * 1000) / 10}%` };
}

export function eisaSectionFive(batch: ResultsBatch): [string, string][] {
  const decision = batch.finalDecision;
  const review = batch.eisaReview;
  const outcomeText = !decision ? 'Not yet decided' : decision.outcome === 'approved' ? 'APPROVED' : 'NOT APPROVED';
  return [
    ['Date final evidence received', eisaFinalEvidence(batch)],
    ['QCTO has APPROVED / NOT APPROVED THE RESULTS', outcomeText],
    ['Date of approval letter', decision ? dateOf(decision.decidedAt) : ''],
    ['Verification Number', verificationCodeOf(batch)],
    ['If no, date and reason', decision?.outcome === 'declined' ? `${dateOf(decision.decidedAt)}: ${decision.irregularities.join('; ')}` : ''],
    // Batch Z1 (11.4): only when the QP answered Yes; a batch submitted earlier was never asked.
    ...(batch.irregularitiesObserved === true ? [['Irregularities reported by the QP', EISA_IRREGULARITIES_REPORTED] as [string, string]] : []),
    ['Recommendation for further action', review.recommendationFurtherAction],
    ['Bad Practices', review.badPractices],
    ['Good Practices', review.goodPractices],
  ];
}

function signOffRows(audit: AuditEntry[]): string[][] {
  const row = (label: string, role: typeof RESULTS_AD_ROLE) => {
    const s = signOffFromAudit(audit, role);
    return [label, s.name, s.date];
  };
  return [row('COMPILED BY (ASD)', RESULTS_AD_ROLE), row('CHECKED BY (Deputy Director)', RESULTS_DD_ROLE), row('RECOMMENDED BY (Director)', RESULTS_DIRECTOR_ROLE)];
}

export type DocAudience = 'internal' | 'external';

// The Approval of Results letter checklist (the Deputy Director's), internal only.
export function ddChecklistBlocks(batch: ResultsBatch): DocBlock[] {
  const ticked = new Set(ddCheckedIdsOf(batch));
  return [
    { kind: 'h2', text: 'Approval of Results letter checklist' },
    { kind: 'table', headers: ['Item', 'Detail'], rows: ddLetterTable(batch) },
    { kind: 'table', headers: ['Checked', 'Line'], rows: DD_LETTER_CHECK_LINES.map((l) => [ticked.has(l.id) ? 'Yes' : 'No', l.text]) },
    { kind: 'p', muted: true, text: `Completed by ${ddCompletedText(batch.ddChecklist)}.` },
  ];
}

export function ddLetterChecklistModel(batch: ResultsBatch): DocModel {
  return {
    pageTitle: 'Approval of Results letter checklist',
    heading: 'Approval of Results letter checklist (EISA)',
    draft: !batch.finalDecision,
    fileName: `Approval_of_Results_Letter_Checklist_EISA_${fileSafe(batch.qualificationTitle)}_${batch.sittingDate}.html`,
    blocks: ddChecklistBlocks(batch).slice(1),
  };
}

// QCTO's EISA report. The QP gets the report without the ASD's compliance review (section 2), the
// "E. QA Verification" lines (the recommendation letter, the checklist, the tracking register), the
// Deputy Director's letter checklist and the approval chain and audit trail (Batch N.1).
export function eisaVerificationReportModel(
  batch: ResultsBatch,
  audit: AuditEntry[],
  ctx: EisaReportContext = NO_REPORT_CONTEXT,
  audience: DocAudience = 'internal',
): DocModel {
  const internal = audience === 'internal';
  const d = eisaReportDetails(batch);
  const s = eisaStatistics(batch);
  const f = batchFiguresOf(batch);
  const admin = eisaAdministrationRows(batch, ctx).filter((r) => internal || !r.group.startsWith('E.'));
  const placeHeaders = ['No.', 'Name', 'Address', 'Accreditation Number'];
  const blocks: DocBlock[] = [
    { kind: 'p', muted: true, text: `Verification code: ${verificationCodeOf(batch) || 'issued when the batch reaches the ASD'}.` },
    { kind: 'h2', text: '1. DETAILS OF EXTERNAL INTEGRATED SUMMATIVE ASSESSMENT' },
    { kind: 'dl', items: d.details },
    {
      kind: 'table',
      headers: ['Component', 'Dates', 'Type of assessment', 'Weighting', 'Duration (days)', 'Time (from/to)', 'Required pass mark'],
      rows: d.componentRows,
    },
    { kind: 'p', text: `Overall Pass Mark or Competency Rating: ${d.passMark}` },
    { kind: 'h3', text: 'Assessment Centres/Sites used' },
    { kind: 'table', headers: placeHeaders, rows: d.centreRows },
    { kind: 'h3', text: 'Skills Development Providers that took part in this EISA' },
    { kind: 'table', headers: placeHeaders, rows: d.sdpRows },
  ];
  if (internal) {
    blocks.push(
      { kind: 'h2', text: '2. COMPLIANCE REVIEW' },
      { kind: 'table', headers: ['Ref', 'Requirement', 'Answer', 'Comment'], rows: eisaReviewRows(batch.eisaReview).map((r) => [r.id, r.text, r.answer, r.comment]) },
    );
  }
  blocks.push(
    { kind: 'h2', text: '4. STATISTICS' },
    {
      kind: 'dl',
      items: [
        ['Number of candidates that registered for the EISA (File 4)', String(s.registered)],
        ['Number of candidates that sat for the EISA (File 3)', String(s.sat)],
        ['Number of candidates that passed the EISA (File 3)', String(s.passed)],
        ['% Pass Rate (passed ÷ sat)', s.passRate],
        ['Competency rate', competenceRateText(f)],
        ['Throughput rate', throughputRateText(f)],
      ],
    },
    { kind: 'h2', text: '5. APPROVAL OF LEARNER ACHIEVEMENTS' },
    { kind: 'dl', items: eisaSectionFive(batch).filter(([label]) => internal || !['Recommendation for further action', 'Bad Practices', 'Good Practices'].includes(label)) },
    { kind: 'h2', text: 'Administration completed and confirmed' },
    { kind: 'p', muted: true, text: 'A line is ticked when the document is on file in the system.' },
    {
      kind: 'table',
      headers: ['Group', 'Document', 'On file in the system', 'Date'],
      rows: admin.map((r) => [r.group, r.optional ? `${r.label} (optional)` : r.label, r.onFile ? 'Yes' : 'No', r.date]),
    },
    { kind: 'h2', text: 'Sign-off' },
    { kind: 'table', headers: ['', 'Name', 'Date'], rows: signOffRows(audit) },
  );
  if (internal) blocks.push(...ddChecklistBlocks(batch));
  blocks.push(
    ...annexBlocks(
      {
        learnerTable: eisaLearnerTable(batch),
        evidence: batch.evidenceDocuments.map((doc) => ({ ...doc, tag: eisaEvidenceTagLabel(doc.tag) })),
        onFile: batch.onFileDocuments.map((doc) => ({ label: doc.label, fileName: doc.replacement?.fileName ?? doc.fileName, choice: onFileChoiceText(doc) })),
        declineHistory: batch.declineHistory,
        audit,
      },
      audience,
    ),
  );
  return {
    pageTitle: 'EISA Quality Assurance Verification Report',
    heading: 'EISA QUALITY ASSURANCE VERIFICATION REPORT',
    draft: !batch.finalDecision,
    fileName: `Verification_Report_EISA_${fileSafe(batch.qualificationTitle)}_${batch.sittingDate}.html`,
    blocks,
  };
}

export function downloadEisaVerificationReport(batch: ResultsBatch, audit: AuditEntry[], ctx: EisaReportContext = NO_REPORT_CONTEXT, audience: DocAudience = 'internal'): void {
  downloadDoc(eisaVerificationReportModel(batch, audit, ctx, audience));
}

export function downloadDdLetterChecklist(batch: ResultsBatch): void {
  downloadDoc(ddLetterChecklistModel(batch));
}
