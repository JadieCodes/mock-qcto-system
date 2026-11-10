// Batch N1 (29.27, 05.20): the Outcome Letter and the Certification recommendation letter for EISA
// and FISA results batches. The wording and structure follow QCTO's own templates ("Approval
// Letter – EISA", "Decline Letter – EISA", "SP Approval Letter", "QA Certification Letter", "SP
// Certification recommendation letter"); the people, organisations and addresses are our mock ones
// (mock/data/qpDirectory.ts, sdpDirectory.ts). Each letter is built as a small model first, so the
// screen, the download and the checks all read the same content. UI-only: the download is a small
// HTML file built in the browser (downloads.ts downloadHtmlFile).
import { qpDirectoryEntryFor } from '../../mock/data/qpDirectory';
import { sdpDirectoryEntryByName, type SdpDirectoryEntry } from '../../mock/data/sdpDirectory';
import { batchFiguresOf } from './calculation';
import {
  CERTIFICATION_ADDRESSEE,
  CHIEF_DIRECTOR_LETTER_TITLE,
  DIRECTOR_ASSESSMENT_NAME,
  EISA_APPEALS_EMAIL,
  eisaCertificationFileName,
} from './config';
import { downloadHtmlFile, escapeHtml, page } from './downloads';
import { fisaFiguresOf } from './workflow';
import { firstDateOf, lastDateOf } from './verificationCode';
import type { FisaResultsBatch, ResultsBatch } from './types';

export type LetterBlock =
  | { kind: 'lines'; lines: string[] }
  | { kind: 'p'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'table'; rows: [string, string][] }
  | { kind: 'grid'; headers: string[]; row: string[] }
  | { kind: 'list'; items: string[] }
  | { kind: 'signoff'; closing: string; name: string; title: string; date: string }
  | { kind: 'signatures'; entries: { role: string; name: string; date: string }[] };

export interface LetterModel {
  title: string;
  draft: boolean;
  fileName: string;
  blocks: LetterBlock[];
}

export const DRAFT_SIGNATURE_NAME = 'Chief Director (to sign at the final decision)';
export const DRAFT_CODE_TEXT = 'issued at the final decision';

const APPEALS_EISA = `Should there be any appeals; the Assessment Quality Partner's formal appeals process should be followed. Kindly quote the Verification Code when requesting the certification of any successful appeals in this cohort of learners by sending the request to ${EISA_APPEALS_EMAIL}`;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function fileSafe(value: string): string {
  return value.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function eisaDatesOf(batch: Pick<ResultsBatch, 'components' | 'sittingDate'>): string[] {
  const dates = batch.components.map((c) => c.eisaDate).filter(Boolean);
  return dates.length > 0 ? dates : [batch.sittingDate];
}

export function lastEisaDateOf(batch: Pick<ResultsBatch, 'components' | 'sittingDate'>): string {
  return lastDateOf(eisaDatesOf(batch));
}

export function lastFisaDateOf(batch: Pick<FisaResultsBatch, 'fisaDates'>): string {
  return lastDateOf(batch.fisaDates);
}

function datesText(dates: string[]): string {
  const unique = [...new Set(dates)].sort();
  return unique.join(', ');
}

// The assessment centres' accreditation numbers (EISA): each centre on the Confirmation is an SDP.
export function centreAccreditationNumbers(centres: string[]): string {
  return centres.map((c) => sdpDirectoryEntryByName(c)?.accreditationNumber ?? c).join(', ');
}

function addressee(contactLine: string, organisation: string, address: string[]): string[] {
  return [contactLine, organisation, ...address];
}

function sdpContactLine(sdp: SdpDirectoryEntry | undefined): string {
  return sdp ? `${sdp.contactTitle} ${sdp.contactPerson}` : 'The Skills Development Provider';
}

function codeText(code: string | undefined, draft: boolean): string {
  return draft || !code ? DRAFT_CODE_TEXT : code;
}

const DECLINE_INTRO = 'The submission of results did not meet the minimum requirements for learners to be certificated due to the following irregularities.';

// ---------------------------------------------------------------------------
// Outcome Letter (EISA)
// ---------------------------------------------------------------------------

export function eisaOutcomeLetter(batch: ResultsBatch, draft: boolean): LetterModel {
  const decision = batch.finalDecision;
  const declined = decision ? decision.outcome === 'declined' : false;
  const qp = qpDirectoryEntryFor(batch.qpId);
  const dates = eisaDatesOf(batch);
  const first = firstDateOf(dates);
  const last = lastDateOf(dates);
  const f = batchFiguresOf(batch);
  const date = decision && !draft ? decision.decidedAt.slice(0, 10) : today();
  const qualification = batch.qualificationTitle.toUpperCase();
  const subject = `${declined ? 'DECLINE' : 'APPROVAL'} OF LEARNER ACHIEVEMENTS FOR THE EXTERNAL INTEGRATED SUMMATIVE ASSESSMENT (EISA) CONDUCTED FOR THE OC: ${qualification} (SAQA ID: ${batch.saqaId}) FOR THE PERIOD ${first} TO ${last}`;
  const code = codeText(decision?.verificationCode, draft);

  const tableRows: [string, string][] = [
    ['Name of Qualification', batch.qualificationTitle],
    ['SAQA ID', batch.saqaId],
    ['NQF Level', batch.nqfLevel],
    ['Credits', batch.credits],
    ['Date of final EISA', last],
    ['No. of registered candidates for the EISA', String(f.registered)],
    ['No. of candidates that wrote the EISA', String(f.wrote)],
    ...(declined
      ? []
      : ([
          ['No. of candidates declared Competent', String(f.competent)],
          ['No. of candidates declared Not Yet Competent', String(f.notYetCompetent)],
          ['No. of candidates who comply with all requirements for certification', String(f.competent)],
        ] as [string, string][])),
    ['Assessment Centre Accreditation Number', centreAccreditationNumbers(batch.centres)],
  ];

  const signer = draft || !decision ? DRAFT_SIGNATURE_NAME : decision.decidedBy;
  const blocks: LetterBlock[] = [
    { kind: 'lines', lines: [date] },
    { kind: 'lines', lines: addressee(qp ? `${qp.contactTitle} ${qp.name}` : batch.qpName, qp?.organisation ?? '', qp?.postalAddress ?? []).filter(Boolean) },
    { kind: 'p', text: `Dear ${qp ? `${qp.contactTitle} ${qp.contactSurname}` : batch.qpName}` },
    { kind: 'heading', text: subject },
    {
      kind: 'p',
      text: declined
        ? 'Thank you for the submission of documentation and the learner results for the final External Integrated Summative Assessment (EISA) that was conducted:'
        : 'Thank you for the submission of all required documentation and the learner results for the final External Integrated Summative Assessment (EISA) that was conducted:',
    },
    { kind: 'table', rows: tableRows },
  ];
  if (declined) {
    blocks.push(
      { kind: 'heading', text: `Decline of Learner Achievements: (Verification Code: ${code})` },
      { kind: 'p', text: DECLINE_INTRO },
      { kind: 'list', items: decision?.irregularities ?? [] },
      {
        kind: 'p',
        text: `Based on the above, the QCTO declines the results and ${qp?.organisation ?? batch.qpName} is requested to notify the SDPs regarding the outcome. It is hereby recommended that ${qp?.organisation ?? batch.qpName} implement the following corrective actions so that the learners can rewrite in the upcoming EISA:`,
      },
      { kind: 'list', items: decision?.correctiveActions ?? [] },
    );
  } else {
    blocks.push(
      { kind: 'heading', text: `Approval of Learner Achievements: (Verification Code: ${code})` },
      {
        kind: 'p',
        text: 'The QCTO is satisfied that all quality assurance standards have been met for the learner achievements submitted, and hereby confirm that these learners may be certificated. A "Statement of Achievement" may be issued to each qualifying learner.',
      },
    );
  }
  blocks.push({ kind: 'p', text: APPEALS_EISA }, { kind: 'signoff', closing: 'Yours faithfully', name: signer, title: CHIEF_DIRECTOR_LETTER_TITLE, date });
  return {
    title: declined ? 'Outcome Letter — Decline (EISA)' : 'Outcome Letter (EISA)',
    draft,
    fileName: `Outcome_Letter_EISA_${fileSafe(batch.qualificationTitle)}_${batch.sittingDate}${draft ? '_DRAFT' : ''}.html`,
    blocks,
  };
}

// ---------------------------------------------------------------------------
// Outcome Letter (FISA)
// ---------------------------------------------------------------------------

export function fisaOutcomeLetter(batch: FisaResultsBatch, draft: boolean): LetterModel {
  const decision = batch.finalDecision;
  const declined = decision ? decision.outcome === 'declined' : false;
  const sdp = sdpDirectoryEntryByName(batch.sdpName);
  const f = fisaFiguresOf(batch);
  const date = decision && !draft ? decision.decidedAt.slice(0, 10) : today();
  const dates = datesText(batch.fisaDates);
  const code = codeText(decision?.verificationCode, draft);
  const subject = `${declined ? 'DECLINE' : 'APPROVAL'} OF LEARNER RESULTS FOR THE FISA (FINAL INTEGRATED SUPERVISED ASSESSMENT) CONDUCTED FOR THE SKILLS PROGRAMME: ${batch.skillsProgrammeTitle.toUpperCase()}, (SKILLS ID ${batch.skillsProgrammeId}) ON ${dates}`;

  const tableRows: [string, string][] = [
    ['SDP Accreditation Number', sdp?.accreditationNumber ?? '—'],
    ['Name of Skills Programme', batch.skillsProgrammeTitle],
    ['Skills Programme ID', batch.skillsProgrammeId],
    ['NQF Level', batch.nqfLevel],
    ['Credits', batch.credits],
    ['Date of FISA', dates],
    ['No. of learners enrolled for FISA', String(f.enrolled)],
    ['No. learners that completed the FISA', String(f.completed)],
    ...(declined
      ? []
      : ([
          ['No. declared Competent (C)', String(f.competent)],
          ['No. declared Not Yet Competent (NYC)', String(f.notYetCompetent)],
          ['No. Learners Absent', String(f.absent)],
          ['Recommendations for improvements to be in place before the next FISA', batch.recommendationsForImprovement.trim() || 'None recorded.'],
        ] as [string, string][])),
  ];

  const signer = draft || !decision ? DRAFT_SIGNATURE_NAME : decision.decidedBy;
  const blocks: LetterBlock[] = [
    { kind: 'lines', lines: [date] },
    { kind: 'lines', lines: addressee(sdpContactLine(sdp), batch.sdpName, sdp?.postalAddress ?? []) },
    { kind: 'p', text: `Dear ${sdp ? `${sdp.contactTitle} ${sdp.contactPerson.split(' ').at(-1)}` : batch.sdpName}` },
    { kind: 'heading', text: subject },
    {
      kind: 'p',
      text: declined
        ? 'Thank you for the submission of documentation of the learner results for the Final Integrated Supervised Assessment (FISA) that was conducted.'
        : 'Thank you for the submission of all required documentation of the learner results for the Final Integrated Supervised Assessment (FISA) that was conducted.',
    },
    { kind: 'table', rows: tableRows },
  ];
  if (declined) {
    blocks.push(
      { kind: 'heading', text: `Decline of Learner Results: (Verification Code: ${code})` },
      { kind: 'p', text: DECLINE_INTRO },
      { kind: 'list', items: decision?.irregularities ?? [] },
      {
        kind: 'p',
        text: `Based on the above, the QCTO declines the results and ${batch.sdpName} is requested to notify the learners regarding the outcome. It is hereby recommended that ${batch.sdpName} implement the following corrective actions so that the learners can rewrite in the next FISA:`,
      },
      { kind: 'list', items: decision?.correctiveActions ?? [] },
      { kind: 'p', text: `Should there be any appeals; the SDP's formal appeals process should be followed. Kindly quote the Verification Code for enquiries (${code}).` },
    );
  } else {
    blocks.push(
      { kind: 'heading', text: `Approval of Learner Results: (Verification Code: ${code})` },
      {
        kind: 'p',
        text: 'The QCTO is satisfied that all quality assurance standards have been met and would hereby like to confirm that the results have been approved as submitted by the SDP to the QCTO.',
      },
      { kind: 'p', text: `Should there be any appeals; the SDP's formal appeals process should be followed. Kindly quote the Verification Code for enquiries, or when requesting certificates (${code}).` },
    );
  }
  blocks.push({ kind: 'signoff', closing: 'Yours faithfully', name: signer, title: CHIEF_DIRECTOR_LETTER_TITLE, date });
  return {
    title: declined ? 'Outcome Letter — Decline (FISA)' : 'Outcome Letter (FISA)',
    draft,
    fileName: `Outcome_Letter_FISA_${fileSafe(batch.skillsProgrammeTitle)}_${fileSafe(batch.sdpName)}${draft ? '_DRAFT' : ''}.html`,
    blocks,
  };
}

// ---------------------------------------------------------------------------
// Certification recommendation letters (approved batches only, internal only)
// ---------------------------------------------------------------------------

export function eisaRecommendationLetter(batch: ResultsBatch): LetterModel | null {
  const decision = batch.finalDecision;
  if (!decision || decision.outcome !== 'approved') return null;
  const qp = qpDirectoryEntryFor(batch.qpId);
  const f = batchFiguresOf(batch);
  const dates = eisaDatesOf(batch);
  const date = decision.decidedAt.slice(0, 10);
  const fileName = eisaCertificationFileName(qp?.qpCode ?? 'QP0000', batch.saqaId, lastDateOf(dates));
  return {
    title: 'Certification Recommendation Letter (EISA)',
    draft: false,
    fileName: `Certification_Recommendation_EISA_${fileSafe(batch.qualificationTitle)}_${batch.sittingDate}.html`,
    blocks: [
      { kind: 'lines', lines: [date] },
      { kind: 'lines', lines: CERTIFICATION_ADDRESSEE },
      { kind: 'heading', text: 'DECLARATION / RECOMMENDATION BY OQA: ASSESSMENT FOR ISSUING OF OCCUPATIONAL CERTIFICATES' },
      { kind: 'p', text: `FILE NAME: ${fileName}` },
      {
        kind: 'p',
        text: `The OQM unit hereby recommends that the following ${f.competent} candidates who enrolled and were assessed on ${datesText(dates)} in the EISA for the following Occupational Qualification: ${batch.qualificationTitle}; NQF Qualification ID ${batch.saqaId} be considered for certification as included in the file name above.`,
      },
      {
        kind: 'grid',
        headers: ['Registered', 'Wrote', 'Competent', 'Not yet competent', 'Comply with all requirements'],
        row: [String(f.registered), String(f.wrote), String(f.competent), String(f.notYetCompetent), String(f.competent)],
      },
      { kind: 'heading', text: 'Learner certification recommendation' },
      {
        kind: 'table',
        rows: [
          ['Total number of learners Passed/Competent', String(f.competent)],
          ['Total number of learners Failed/NYC/Absent', String(f.notYetCompetent + f.absent)],
          ['Total number of learners on the file', String(f.registered)],
        ],
      },
      { kind: 'p', text: 'It is confirmed that:' },
      {
        kind: 'list',
        items: [
          'QCTO verification for approval of learner results as registered for the respective SDP have been concluded',
          'Learner biographical information is available',
          'The SORs for all learners submitted in this file have been issued by the SDP or AC (ARPL)',
        ],
      },
      {
        kind: 'p',
        text: 'I, the undersigned, hereby declare that the request for certification have been duly checked and approved and recommend for certification in terms of Sections 26 D (1 – 3) of the Skills Development Act, 1998 (Act no 97 of 1998) (SDA).',
      },
      { kind: 'p', text: 'The approval of results letter is attached.' },
      {
        kind: 'signatures',
        entries: [
          { role: 'Deputy Director: Assessment', name: decision.ddName, date },
          { role: 'Director: Cluster', name: decision.directorName, date },
          { role: 'Director: Assessment', name: DIRECTOR_ASSESSMENT_NAME, date },
        ],
      },
    ],
  };
}

export function fisaRecommendationLetter(batch: FisaResultsBatch): LetterModel | null {
  const decision = batch.finalDecision;
  if (!decision || decision.outcome !== 'approved') return null;
  const sdp = sdpDirectoryEntryByName(batch.sdpName);
  const f = fisaFiguresOf(batch);
  const date = decision.decidedAt.slice(0, 10);
  return {
    title: 'SP Certification Recommendation Letter (FISA)',
    draft: false,
    fileName: `SP_Certification_Recommendation_FISA_${fileSafe(batch.skillsProgrammeTitle)}_${fileSafe(batch.sdpName)}.html`,
    blocks: [
      { kind: 'lines', lines: [date] },
      { kind: 'lines', lines: CERTIFICATION_ADDRESSEE },
      { kind: 'heading', text: 'DECLARATION / RECOMMENDATION BY OQM: ASSESSMENT FOR ISSUING OF SKILLS PROGRAMME CERTIFICATES' },
      { kind: 'p', text: `File Name: ${lastFisaDateOf(batch)} – ${batch.skillsProgrammeTitle} – ${sdp?.accreditationNumber ?? batch.sdpName}` },
      {
        kind: 'p',
        text: `The OQM unit hereby recommends that the attached ${f.competent} candidates who enrolled and were assessed on ${datesText(batch.fisaDates)} in the FISA for the following Skills Programme: ${batch.skillsProgrammeTitle} NQF ${batch.nqfLevel.replace(/^Level\s*/i, '')} Skills Programme ID ${batch.skillsProgrammeId} be considered for certification as included in the file name above.`,
      },
      {
        kind: 'table',
        rows: [
          ['Total number of learners on the file', String(f.enrolled)],
          ['Competent', String(f.competent)],
          ['NYC', String(f.notYetCompetent)],
          ['Absent', String(f.absent)],
        ],
      },
      { kind: 'p', text: 'It is confirmed that:' },
      {
        kind: 'list',
        items: [
          'QCTO verification for learners as registered for the respective SDP have been concluded the following:',
          'Learner biographical information recorded on mentioned File as per agreed upon load specifications',
          'Learner FISA results recorded on the mentioned File as per agreed upon load specifications',
        ],
      },
      { kind: 'p', text: 'We, the undersigned, hereby declare that the request for certification have been duly checked and approved and recommend for certification of these learners.' },
      { kind: 'p', text: 'The approval of the results letter, and final learner results file are attached.' },
      {
        kind: 'signatures',
        entries: [
          { role: 'ASD: Assessment', name: decision.asdName, date },
          { role: 'Deputy Director: Assessment', name: decision.ddName, date },
          { role: 'Director: Assessment', name: DIRECTOR_ASSESSMENT_NAME, date },
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// HTML download (no new libraries — the same approach as downloads.ts)
// ---------------------------------------------------------------------------

function blockToHtml(block: LetterBlock): string {
  switch (block.kind) {
    case 'lines':
      return `<p>${block.lines.map(escapeHtml).join('<br>')}</p>`;
    case 'p':
      return `<p>${escapeHtml(block.text)}</p>`;
    case 'heading':
      return `<p><strong>${escapeHtml(block.text)}</strong></p>`;
    case 'table':
      return `<table>${block.rows.map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join('')}</table>`;
    case 'grid':
      return `<table><tr>${block.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr><tr>${block.row.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr></table>`;
    case 'list':
      return `<ol>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ol>`;
    case 'signoff':
      return `<p>${escapeHtml(block.closing)}</p><p><strong>${escapeHtml(block.name)}</strong><br>${escapeHtml(block.title)}<br>${escapeHtml(block.date)}</p>`;
    case 'signatures':
      return `<table>${block.entries
        .map((e) => `<tr><th>${escapeHtml(e.role)}</th><td>${escapeHtml(e.name)}</td><td>Date: ${escapeHtml(e.date)}</td></tr>`)
        .join('')}</table>`;
  }
}

export function letterModelToHtml(model: LetterModel): string {
  const draft = model.draft ? '<p class="muted"><strong>DRAFT</strong> — preview only. The signed letter is issued at the final decision.</p>' : '';
  return page(model.title, `<h1>${escapeHtml(model.title)}${model.draft ? ' (Draft)' : ''}</h1>${draft}${model.blocks.map(blockToHtml).join('\n')}`);
}

export function downloadLetterModel(model: LetterModel): void {
  downloadHtmlFile(model.fileName, letterModelToHtml(model));
}
