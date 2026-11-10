// Batch N.1: the verification reports and the Approval of Results letter checklist are built as a small
// model first. The on-screen view (components/DocumentView.tsx) and the HTML download both read the
// same model, so the screen and the download cannot differ. (Letters have their own model,
// outcomeLetters.ts.)
import { downloadHtmlFile, escapeHtml, page } from './downloads';

export type DocBlock =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string; muted?: boolean }
  | { kind: 'dl'; items: [string, string][] }
  | { kind: 'table'; headers: string[]; rows: string[][] };

export interface DocModel {
  // The browser-tab title of the download.
  pageTitle: string;
  // The big title on the document, in QCTO's wording.
  heading: string;
  // Before the final decision: a clear "Draft" banner on screen and in the download.
  draft: boolean;
  fileName: string;
  blocks: DocBlock[];
}

export const DRAFT_BANNER_TEXT = 'DRAFT — this document is not final. It is completed at the final decision.';

function blockToHtml(block: DocBlock): string {
  switch (block.kind) {
    case 'h2':
      return `<h2>${escapeHtml(block.text)}</h2>`;
    case 'h3':
      return `<h3>${escapeHtml(block.text)}</h3>`;
    case 'p':
      return `<p${block.muted ? ' class="muted"' : ''}>${escapeHtml(block.text)}</p>`;
    case 'dl':
      return `<dl>${block.items.map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join('')}</dl>`;
    case 'table': {
      if (block.rows.length === 0) return '<p class="muted">None.</p>';
      const head = block.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
      const body = block.rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('');
      return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    }
  }
}

export function docToHtml(model: DocModel): string {
  const banner = model.draft ? `<p class="draft">${escapeHtml(DRAFT_BANNER_TEXT)}</p>` : '';
  return page(model.pageTitle, `<h1>${escapeHtml(model.heading)}</h1>${banner}${model.blocks.map(blockToHtml).join('\n')}`);
}

export function downloadDoc(model: DocModel): void {
  downloadHtmlFile(model.fileName, docToHtml(model));
}
