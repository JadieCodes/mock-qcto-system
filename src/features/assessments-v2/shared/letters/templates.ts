import type { GeneratedLetter, LetterData, LetterKind } from './types';

// CR-005, CR-013: letters are generated from a template populated with captured data —
// no manual drafting or file upload. Digital signatures are deferred (CR-013 note).
const TEMPLATES: Record<LetterKind, (data: LetterData) => string> = {
  acknowledgement: (d) => `
Dear ${d.qpName},

This letter acknowledges receipt of the QSA Addendum application for "${d.qualificationTitle}"${d.saqaId ? ` (SAQA ID ${d.saqaId})` : ''}.

Your submission has been received and is being evaluated. We will contact you once the Assessment Standards Domain has completed its review.

Date: ${d.date}
`.trim(),

  outcome: (d) => `
Dear ${d.qpName},

Following the Internal Assessment Committee's review, the QSA Addendum for "${d.qualificationTitle}" has reached a final outcome.

${d.notes ?? ''}

Date: ${d.date}
Signed: ${d.signatoryName ?? '[CEO signature pending]'}${d.signatoryTitle ? `, ${d.signatoryTitle}` : ''}
`.trim(),

  approval: (d) => `
Dear ${d.qpName},

The QSA Addendum for "${d.qualificationTitle}"${d.nqfLevel ? ` (NQF Level ${d.nqfLevel})` : ''} has been approved.

${d.notes ?? ''}

Date: ${d.date}
Signed: ${d.signatoryName ?? '[signature pending]'}${d.signatoryTitle ? `, ${d.signatoryTitle}` : ''}
`.trim(),
};

export function generateLetter(kind: LetterKind, recordId: string, data: LetterData): GeneratedLetter {
  return {
    id: crypto.randomUUID(),
    kind,
    recordId,
    generatedAt: new Date().toISOString(),
    data,
    body: TEMPLATES[kind](data),
  };
}
