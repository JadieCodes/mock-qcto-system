// Batch N2 (29.29): QCTO's FISA verification report. Sections A-D are completed by the SDP (the
// uploaded "Verification report" evidence); this download is Section E, completed by QCTO (E1 first
// evaluation, E2 recommendation and approval), with the SDP's file named and the annexure after it.
import type { AuditEntry } from '../../shared/audit/types';
import { annexHtml, definitionList, downloadHtmlFile, escapeHtml, fileSafe, fisaLearnerTable, page, table } from './downloads';
import { fisaEvidenceTagLabel } from './config';
import { fisaSectionEModel } from './fisaSectionE';
import type { FisaResultsBatch } from './types';

export function sdpVerificationReportFiles(batch: FisaResultsBatch): FisaResultsBatch['evidenceDocuments'] {
  return batch.evidenceDocuments.filter((d) => d.tag === 'verification-report');
}

export function fisaVerificationReportHtml(batch: FisaResultsBatch, audit: AuditEntry[]): string {
  const model = fisaSectionEModel(batch, audit);
  const sdpFiles = sdpVerificationReportFiles(batch);
  const pair = ([label, value]: [string, string]) => ({ label, value });
  const signatures = [model.recommendedBy, model.approvedBy].map((s) => [s.role, s.name, s.date]);
  return page(
    'FISA Quality Assurance Verification Report',
    `<h1>FISA ASSESSMENT ASSURANCE VERIFICATION REPORT</h1>
<p class="muted">Generated on ${escapeHtml(new Date().toLocaleString('en-ZA'))}. Verification code: ${escapeHtml(batch.finalDecision?.verificationCode ?? 'issued at the final decision')}.</p>
<h2>Sections A to D (completed by the SDP)</h2>
<p>Sections A–D are the SDP's uploaded verification report. ${
      sdpFiles.length > 0
        ? `It is on file in the system: ${escapeHtml(sdpFiles.map((f) => `${f.fileName} (uploaded ${f.uploadedAt.slice(0, 10)})`).join('; '))}.`
        : 'No verification report has been uploaded by the SDP for this batch.'
    }</p>
<h2>Section E (completed by QCTO)</h2>
<h3>E1 First Evaluation (ASD)</h3>
${definitionList(model.e1.map(pair))}
<h3>E2 Recommendation &amp; Approval</h3>
${definitionList(model.e2.map(pair))}
${table(['', 'Name', 'Date'], signatures)}
${annexHtml({
  learnerTable: fisaLearnerTable(batch.learnerResults),
  evidence: batch.evidenceDocuments.map((d) => ({ ...d, tag: fisaEvidenceTagLabel(d.tag) })),
  declineHistory: batch.declineHistory,
  audit,
})}`,
  );
}

export function downloadFisaVerificationReport(batch: FisaResultsBatch, audit: AuditEntry[]): void {
  downloadHtmlFile(`Verification_Report_FISA_${fileSafe(batch.skillsProgrammeTitle)}_${fileSafe(batch.sdpName)}.html`, fisaVerificationReportHtml(batch, audit));
}
