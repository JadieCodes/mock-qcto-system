import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DRAFT_BANNER_TEXT, downloadDoc, type DocBlock, type DocModel } from '../documentModel';

export function DraftBanner() {
  return (
    <div role="status" className="rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900">
      {DRAFT_BANNER_TEXT}
    </div>
  );
}

function Block({ block }: { block: DocBlock }) {
  switch (block.kind) {
    case 'h2':
      return <h3 className="border-b border-gray-300 pb-1 pt-3 text-sm font-bold uppercase tracking-wide text-gray-900">{block.text}</h3>;
    case 'h3':
      return <h4 className="pt-1 text-sm font-semibold text-gray-800">{block.text}</h4>;
    case 'p':
      return <p className={block.muted ? 'text-xs text-gray-500' : 'text-sm text-gray-800'}>{block.text}</p>;
    case 'dl':
      return (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <tbody>
            {block.items.map(([label, value], i) => (
              <tr key={`${label}-${i}`}>
                <th scope="row" className="w-2/5 border border-gray-300 bg-gray-50 px-3 py-1.5 text-left align-top font-medium text-gray-700">
                  {label}
                </th>
                <td className="whitespace-pre-wrap border border-gray-300 px-3 py-1.5 align-top text-gray-900">{value || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'table':
      if (block.rows.length === 0) return <p className="text-xs text-gray-500">None.</p>;
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={`${h}-${i}`} className="border border-gray-300 bg-gray-50 px-3 py-1.5 text-left font-medium text-gray-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className="border border-gray-300 px-3 py-1.5 align-top text-gray-900">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

// Batch N.1: a verification report or a checklist on screen, in the same layout as its download
// (both read the same DocModel). The Download button sits at the top; a document without a final
// decision carries the Draft banner.
export function DocumentView({ model }: { model: DocModel }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">{model.pageTitle}</p>
        <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => downloadDoc(model)}>
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>
      {model.draft && <DraftBanner />}
      <article className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">{model.heading}</h2>
        {model.blocks.map((block, i) => (
          <Block key={`${block.kind}-${i}`} block={block} />
        ))}
      </article>
    </div>
  );
}
