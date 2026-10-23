import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GeneratedLetter } from './types';

function RefField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

// One shared layout for every generated letter in the domain (acknowledgement, outcome,
// approval — QSA Addendum and RPL Toolkit both use this): a heading, a reference block of
// the captured fields, the body paragraph(s), and a signature area. Print-only, no editing.
export function LetterView({ letter }: { letter: GeneratedLetter }) {
  const { data, title, body } = letter;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden font-serif text-gray-800">
        <div className="px-6 py-5 border-b bg-gray-50/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">QCTO</p>
          <h3 className="text-lg font-bold text-gray-900 mt-0.5">{title}</h3>
        </div>

        <div className="px-6 py-5 border-b grid gap-3 sm:grid-cols-2">
          <RefField label="To" value={data.qpName} />
          <RefField label="Qualification" value={data.qualificationTitle} />
          {data.saqaId && <RefField label="SAQA ID" value={data.saqaId} />}
          {data.nqfLevel && <RefField label="NQF Level" value={data.nqfLevel} />}
          <RefField label="Date" value={data.date} />
        </div>

        <div className="px-6 py-5 text-sm leading-relaxed whitespace-pre-wrap">{body}</div>

        <div className="px-6 py-5 border-t bg-gray-50/60">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Signed</p>
          {data.signatoryName ? (
            <p className="text-sm font-medium text-gray-900">
              {data.signatoryName}
              {data.signatoryTitle ? `, ${data.signatoryTitle}` : ''}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Signature pending{data.signatoryTitle ? ` — ${data.signatoryTitle}` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>
    </div>
  );
}
