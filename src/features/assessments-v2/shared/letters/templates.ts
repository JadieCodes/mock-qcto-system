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

const TEMPLATES: Record<LetterKind, (data: LetterData) => string> = {
  acknowledgement: (d) => `
Dear ${d.qpName},

This letter acknowledges receipt of the QASA submitted for evaluation for "${d.qualificationTitle}"${d.saqaId ? ` (SAQA ID ${d.saqaId})` : ''}.

Your submission has been received and is being evaluated. We will contact you once the Assessment Standards Domain has completed its review.
`.trim(),

  outcome: (d) => `
Dear ${d.qpName},

Following the Internal Assessment Committee's review, the QASA for "${d.qualificationTitle}" has reached a final outcome.

${d.notes ?? ''}
`.trim(),

  approval: (d) => `
Dear ${d.qpName},

The QASA for "${d.qualificationTitle}"${d.nqfLevel ? ` (NQF Level ${d.nqfLevel})` : ''} has been approved.

${d.notes ?? ''}
`.trim(),
};

export function generateLetter(kind: LetterKind, recordId: string, data: LetterData): GeneratedLetter {
  return {
    id: crypto.randomUUID(),
    kind,
    recordId,
    generatedAt: new Date().toISOString(),
    data,
    title: LETTER_TITLES[kind],
    body: TEMPLATES[kind](data),
  };
}
