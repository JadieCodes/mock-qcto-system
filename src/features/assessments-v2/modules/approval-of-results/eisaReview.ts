// Batch N2 (29.29): the ASD's review of an EISA batch is section 2 of QCTO's "EISA Quality Assurance
// Verification Report" (mock/data/eisaVerificationLines.ts) plus the free text of sections 2 and 5.
// Where the system already knows an answer it is pre-filled with a note and the ASD can still
// change it. One place for the lines, the pre-fill, the completeness check and the report rows.
import { checklistItem, checklistSection, getChecklistIssues, type ChecklistItem, type ChecklistSection } from '../../shared/checklist/types';
import type { ValidationIssue } from '../../shared/validation/types';
import { EISA_REVIEW_LINES, EISA_REVIEW_SECTION_ID, EISA_REVIEW_SECTION_TITLE } from '../../mock/data/eisaVerificationLines';
import { sdpDirectoryEntryByName } from '../../mock/data/sdpDirectory';
import { submittedOnTime } from './workflow';
import type { EisaReview, ResultsBatch } from './types';

export const PREFILLED_NOTE = 'Pre-filled from the system';

export function isPrefilledComment(comment: string): boolean {
  return comment.startsWith(PREFILLED_NOTE);
}

const YES_NO_LINES = EISA_REVIEW_LINES.filter((l) => l.kind === 'yes-no');

export function blankEisaReview(): EisaReview {
  return {
    checklist: [checklistSection(EISA_REVIEW_SECTION_ID, EISA_REVIEW_SECTION_TITLE, YES_NO_LINES.map((l) => checklistItem(l.id, l.text)))],
    irregularitySummary: '',
    impactOnApproval: null,
    analysisSummary: '',
    sampleVerificationComment: '',
    sampleRemedialAction: '',
    recommendationFurtherAction: '',
    badPractices: '',
    goodPractices: '',
  };
}

export type PrefillSource = Pick<ResultsBatch, 'centres' | 'sourceInfo' | 'declaration' | 'submittedAt' | 'submissionDeadline'>;

function listText(values: string[]): string {
  return values.join(', ');
}

// What the system knows: j (File 3 date against the 21 working days), d and e (accreditation data)
// and l (the Batch M declaration). Everything else is left for the ASD.
export function prefilledAnswers(batch: PrefillSource): Record<string, { answer: 'yes' | 'no'; comment: string }> {
  const answers: Record<string, { answer: 'yes' | 'no'; comment: string }> = {};
  const note = (text: string) => `${PREFILLED_NOTE}: ${text}`;

  const submitted = batch.submittedAt.slice(0, 10);
  const onTime = submittedOnTime(batch.submittedAt, batch.submissionDeadline);
  answers.j = {
    answer: onTime ? 'yes' : 'no',
    comment: note(
      onTime
        ? `File 3 was submitted on ${submitted}, within the 21 working days (deadline ${batch.submissionDeadline}).`
        : `File 3 was submitted on ${submitted}, after the 21 working days (deadline ${batch.submissionDeadline}).`,
    ),
  };

  answers.l = {
    answer: 'yes',
    comment: note(`the QP declared on ${batch.declaration.acceptedAt.slice(0, 10)} (${batch.declaration.acceptedBy}) that the results and evidence are accurate and complete.`),
  };

  const sdpNames = [...new Set(batch.sourceInfo.learners.filter((l) => !l.rpl).map((l) => l.sdpName))];
  const sdps = sdpNames.map((name) => sdpDirectoryEntryByName(name));
  if (sdpNames.length > 0 && sdps.every((s) => s !== undefined)) {
    const standing = sdps.every((s) => s?.compliant);
    answers.d = {
      answer: standing ? 'yes' : 'no',
      comment: note(`${listText(sdps.map((s) => `${s?.name} (${s?.accreditationNumber})`))} ${standing ? 'are accredited and in good standing.' : 'include an SDP that is not in good standing.'}`),
    };
  }

  const centres = batch.centres.map((name) => sdpDirectoryEntryByName(name));
  if (centres.length > 0 && centres.every((c) => c !== undefined)) {
    answers.e = {
      answer: centres.every((c) => c?.compliant) ? 'yes' : 'no',
      comment: note(`assessment centres used: ${listText(centres.map((c) => `${c?.name} (${c?.accreditationNumber})`))}.`),
    };
  }
  return answers;
}

export function prefillEisaReview(batch: PrefillSource): EisaReview {
  const answers = prefilledAnswers(batch);
  const review = blankEisaReview();
  return {
    ...review,
    checklist: review.checklist.map((section) => ({
      ...section,
      items: section.items.map((item) => (answers[item.id] ? { ...item, ...answers[item.id] } : item)),
    })),
  };
}

export function reviewItems(review: EisaReview): ChecklistItem[] {
  return review.checklist.flatMap((s) => s.items);
}

// Batch N2: the Yes/No lines and the free text a complete section 2 needs before the batch goes to
// the Deputy Director. Section 5's practices and recommendation are optional.
export function eisaReviewIssues(review: EisaReview): ValidationIssue[] {
  return [
    ...getChecklistIssues(review.checklist, true),
    ...(review.irregularitySummary.trim() ? [] : [{ field: 'irregularitySummary', message: 'f — enter the summary of irregularity/appeal (write "None" if there was none).' }]),
    ...(review.analysisSummary.trim() ? [] : [{ field: 'analysisSummary', message: "k — enter the short summary from the QP's Analysis of Results Report." }]),
    ...(review.sampleVerificationComment.trim() ? [] : [{ field: 'sampleVerificationComment', message: 'm — enter the comment on the sample verification of results.' }]),
  ];
}

export function assertEisaReviewComplete(batch: Pick<ResultsBatch, 'complianceReviewNotes' | 'evidenceEvaluationNotes' | 'eisaReview'>): void {
  if (!batch.complianceReviewNotes.trim()) throw new Error('Complete the compliance review notes before advancing.');
  if (!batch.evidenceEvaluationNotes.trim()) throw new Error('Complete the evidence evaluation notes before advancing.');
  const issues = eisaReviewIssues(batch.eisaReview);
  if (issues.length > 0) throw new Error(`Complete section 2 of the verification report before advancing. ${issues[0].message}`);
}

export interface EisaReviewRow {
  id: string;
  text: string;
  answer: string;
  comment: string;
}

const IMPACT_TEXT: Record<'negative' | 'sorted', string> = {
  negative: 'Negative impact – results cannot be approved',
  sorted: 'Irregularity sorted and does not impact approval',
};

// Section 2 in QCTO's order, for the report: line f carries its two free-text fields and k and m
// show their text (they have no Yes/No).
export function eisaReviewRows(review: EisaReview): EisaReviewRow[] {
  const items = reviewItems(review);
  const rows: EisaReviewRow[] = [];
  for (const line of EISA_REVIEW_LINES) {
    if (line.kind === 'free-text') {
      const text = line.id === 'k' ? review.analysisSummary : [review.sampleVerificationComment, review.sampleRemedialAction && `Remedial action: ${review.sampleRemedialAction}`].filter(Boolean).join(' — ');
      rows.push({ id: line.id, text: line.text, answer: '—', comment: text });
      continue;
    }
    const item = items.find((i) => i.id === line.id);
    rows.push({ id: line.id, text: line.text, answer: item?.answer === 'yes' ? 'Yes' : item?.answer === 'no' ? 'No' : '', comment: item?.comment ?? '' });
    if (line.id === 'f') {
      rows.push({ id: 'f', text: 'Summary of irregularity/appeal', answer: '—', comment: review.irregularitySummary });
      rows.push({ id: 'f', text: 'Impact on approval of results', answer: '—', comment: review.impactOnApproval ? IMPACT_TEXT[review.impactOnApproval] : '' });
    }
  }
  return rows;
}

// A batch stored before N2 holds no review: it gets a blank one (idempotent — api.ts loadAll()).
export function withEisaReview<T extends { eisaReview?: EisaReview }>(batch: T): T & { eisaReview: EisaReview } {
  return { ...batch, eisaReview: batch.eisaReview ?? blankEisaReview() };
}

export function oldChecklistHasAnswers(sections: ChecklistSection[]): boolean {
  return sections.some((s) => s.items.some((i) => i.answer !== null));
}
