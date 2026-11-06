import type { GeneratedLetter, LetterData, LetterKind } from './types';

// CR-005, CR-013: letters are generated from a template populated with captured data —
// no manual drafting or file upload. Digital signatures are deferred (CR-013 note).
// The date and signature are rendered by LetterView from `data` directly, in their own
// blocks, so the templates below only hold the body paragraphs.
const LETTER_TITLES: Record<LetterKind, string> = {
  acknowledgement: 'Acknowledgement Letter',
  outcome: 'Outcome Letter',
  approval: 'Approval Letter',
};

// What a letter is about. QASA is the default; the RPL Toolkit names its toolkit instead
// (Batch A3), FISA names the Skills Programme's standard (QCTO feedback 2.9), and Approval of
// Results names the EISA or FISA results (QCTO feedback 3.14).
export type LetterSubject = 'qasa' | 'rpl-toolkit' | 'fisa-standard' | 'eisa-results' | 'fisa-results';

const OUTCOME_SUBJECT: Record<LetterSubject, (title: string) => string> = {
  qasa: (title) => `the QASA for "${title}"`,
  'rpl-toolkit': (title) => `the RPL toolkit "${title}"`,
  'fisa-standard': (title) => `the FISA Standard for "${title}"`,
  'eisa-results': (title) => `the EISA results for "${title}"`,
  'fisa-results': (title) => `the FISA results for "${title}"`,
};

// The approval letter's opening line. The QASA wording is unchanged.
const APPROVAL_OPENING: Record<LetterSubject, (d: LetterData) => string> = {
  qasa: (d) => `The QASA for "${d.qualificationTitle}"${d.nqfLevel ? ` (NQF Level ${d.nqfLevel})` : ''} has been approved.`,
  'rpl-toolkit': (d) => `The RPL toolkit "${d.qualificationTitle}" has been approved.`,
  'fisa-standard': (d) => `The FISA Standard for "${d.qualificationTitle}" has been approved.`,
  'eisa-results': (d) => `The EISA results for "${d.qualificationTitle}" have been approved.`,
  'fisa-results': (d) => `The FISA results for "${d.qualificationTitle}" have been approved.`,
};

const TEMPLATES: Record<LetterKind, (data: LetterData, subject: LetterSubject) => string> = {
  acknowledgement: (d) => `
Dear ${d.qpName},

This letter acknowledges receipt of the QASA submitted for evaluation for "${d.qualificationTitle}"${d.saqaId ? ` (SAQA ID ${d.saqaId})` : ''}.

Your submission has been received and is being evaluated. We will contact you once the Assessment Standards Domain has completed its review.
`.trim(),

  outcome: (d, subject) => `
Dear ${d.qpName},

Following the Internal Assessment Committee's review, ${OUTCOME_SUBJECT[subject](d.qualificationTitle)} has reached a final outcome.

${d.notes ?? ''}
`.trim(),

  approval: (d, subject) => `
Dear ${d.qpName},

${APPROVAL_OPENING[subject](d)}

${d.notes ?? ''}
`.trim(),
};

// `title` lets a module show its own name for a shared template (QASA calls the outcome
// letter its "feedback letter", RPL Toolkit keeps "Outcome Letter"). `subject` changes the
// outcome and approval letters' body wording.
export function generateLetter(
  kind: LetterKind,
  recordId: string,
  data: LetterData,
  title: string = LETTER_TITLES[kind],
  subject: LetterSubject = 'qasa',
): GeneratedLetter {
  return {
    id: crypto.randomUUID(),
    kind,
    recordId,
    generatedAt: new Date().toISOString(),
    data,
    title,
    body: TEMPLATES[kind](data, subject),
  };
}
