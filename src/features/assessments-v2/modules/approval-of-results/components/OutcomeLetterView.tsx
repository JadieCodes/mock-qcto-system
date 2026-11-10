import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadLetterModel, type LetterBlock, type LetterModel } from '../outcomeLetters';

function Block({ block }: { block: LetterBlock }) {
  switch (block.kind) {
    case 'lines':
      return (
        <p className="text-sm text-gray-700">
          {block.lines.map((line, i) => (
            <span key={`${line}-${i}`} className="block">
              {line}
            </span>
          ))}
        </p>
      );
    case 'p':
      return <p className="text-sm text-gray-700">{block.text}</p>;
    case 'heading':
      return <p className="text-sm font-semibold text-gray-900">{block.text}</p>;
    case 'table':
      return (
        <table className="w-full border-collapse text-sm">
          <tbody>
            {block.rows.map(([label, value]) => (
              <tr key={label} className="border-b">
                <th scope="row" className="w-1/2 bg-gray-50 px-3 py-1.5 text-left font-medium text-gray-600">
                  {label}
                </th>
                <td className="px-3 py-1.5 text-gray-800">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'grid':
      return (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {block.headers.map((h) => (
                <th key={h} className="border-b bg-gray-50 px-3 py-1.5 text-left font-medium text-gray-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {block.row.map((cell, i) => (
                <td key={`${block.headers[i]}-${i}`} className="px-3 py-1.5 text-gray-800">
                  {cell}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      );
    case 'list':
      return (
        <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-700">
          {block.items.map((item, i) => (
            <li key={`${item}-${i}`}>{item}</li>
          ))}
        </ol>
      );
    case 'signoff':
      return (
        <div className="space-y-2 text-sm text-gray-700">
          <p>{block.closing}</p>
          <p>
            <span className="block font-semibold text-gray-900">{block.name}</span>
            <span className="block">{block.title}</span>
            <span className="block">{block.date}</span>
          </p>
        </div>
      );
    case 'signatures':
      return (
        <table className="w-full border-collapse text-sm">
          <tbody>
            {block.entries.map((e) => (
              <tr key={e.role} className="border-b">
                <th scope="row" className="w-1/3 px-3 py-2 text-left font-medium text-gray-600">
                  {e.role}
                </th>
                <td className="px-3 py-2 text-gray-800">{e.name}</td>
                <td className="px-3 py-2 text-gray-600">Date: {e.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}

// Batch N1: an Outcome Letter or a Certification recommendation letter, on screen. A draft is
// marked "Draft" and has no signature or verification code yet.
export function OutcomeLetterView({ model }: { model: LetterModel }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">
          {model.title}
          {model.draft && <span className="ml-2 rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800">Draft</span>}
        </p>
        <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => downloadLetterModel(model)}>
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>
      <div className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
        {model.blocks.map((block, i) => (
          <Block key={`${block.kind}-${i}`} block={block} />
        ))}
      </div>
    </div>
  );
}
