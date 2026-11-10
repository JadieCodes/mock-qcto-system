// Batch N2 (29.29): QCTO's FISA verification report. Sections A-D are completed by the SDP (the
// uploaded "Verification report" evidence); this report is Section E, completed by QCTO (E1 first
// evaluation, E2 recommendation and approval), with the SDP's file named and the annexure after it.
// Batch N.1: built as a model (documentModel.ts) shared by the screen and the download. The SDP's
// copy has no Section E (it is QCTO's internal evaluation), only the outcome and annexures A and B.
import type { AuditEntry } from '../../shared/audit/types';
import { annexBlocks, fileSafe, fisaLearnerTable } from './downloads';
import { downloadDoc, type DocBlock, type DocModel } from './documentModel';
import { fisaEvidenceTagLabel } from './config';
import { fisaSectionEModel } from './fisaSectionE';
import { verificationCodeOf } from './verificationCode';
import type { FisaResultsBatch } from './types';

export function sdpVerificationReportFiles(batch: FisaResultsBatch): FisaResultsBatch['evidenceDocuments'] {
  return batch.evidenceDocuments.filter((d) => d.tag === 'verification-report');
}

export function fisaVerificationReportModel(batch: FisaResultsBatch, audit: AuditEntry[], audience: 'internal' | 'external' = 'internal'): DocModel {
  const internal = audience === 'internal';
  const sdpFiles = sdpVerificationReportFiles(batch);
  const decision = batch.finalDecision;
  const blocks: DocBlock[] = [
    { kind: 'p', muted: true, text: `Verification code: ${verificationCodeOf(batch) || 'issued when the batch reaches the ASD'}.` },
    { kind: 'h2', text: 'Sections A to D (completed by the SDP)' },
    {
      kind: 'p',
      text: `Sections A–D are the SDP's uploaded verification report. ${
        sdpFiles.length > 0
          ? `It is on file in the system: ${sdpFiles.map((f) => `${f.fileName} (uploaded ${f.uploadedAt.slice(0, 10)})`).join('; ')}.`
          : 'No verification report has been uploaded by the SDP for this batch.'
      }`,
    },
  ];
  if (internal) {
    const model = fisaSectionEModel(batch, audit);
    blocks.push(
      { kind: 'h2', text: 'Section E (completed by QCTO)' },
      { kind: 'h3', text: 'E1 First Evaluation (ASD)' },
      { kind: 'dl', items: model.e1 },
      { kind: 'h3', text: 'E2 Recommendation & Approval' },
      { kind: 'dl', items: model.e2 },
      { kind: 'table', headers: ['', 'Name', 'Date'], rows: [model.recommendedBy, model.approvedBy].map((s) => [s.role, s.name, s.date]) },
    );
  } else {
    blocks.push(
      { kind: 'h2', text: 'Outcome' },
      {
        kind: 'dl',
        items: [
          ['QCTO has APPROVED / NOT APPROVED THE RESULTS', !decision ? 'Not yet decided' : decision.outcome === 'approved' ? 'APPROVED' : 'NOT APPROVED'],
          ['Date of the Outcome Letter', decision ? decision.decidedAt.slice(0, 10) : ''],
          ['Verification Number', verificationCodeOf(batch)],
        ],
      },
    );
  }
  blocks.push(
    ...annexBlocks(
      {
        learnerTable: fisaLearnerTable(batch.learnerResults),
        evidence: batch.evidenceDocuments.map((d) => ({ ...d, tag: fisaEvidenceTagLabel(d.tag) })),
        declineHistory: batch.declineHistory,
        audit,
      },
      audience,
    ),
  );
  return {
    pageTitle: 'FISA Assessment Assurance Verification Report',
    heading: 'FISA ASSESSMENT ASSURANCE VERIFICATION REPORT – FOR SKILLS PROGRAMMES',
    draft: !decision,
    fileName: `Verification_Report_FISA_${fileSafe(batch.skillsProgrammeTitle)}_${fileSafe(batch.sdpName)}.html`,
    blocks,
  };
}

export function downloadFisaVerificationReport(batch: FisaResultsBatch, audit: AuditEntry[], audience: 'internal' | 'external' = 'internal'): void {
  downloadDoc(fisaVerificationReportModel(batch, audit, audience));
}
