import { FileText } from 'lucide-react';
import type { RequiredDocument } from '../types';

export function DocumentsList({ documents }: { documents: RequiredDocument[] }) {
  return (
    <div className="divide-y rounded-2xl border bg-white shadow-sm overflow-hidden">
      {documents.map((doc) => (
        <div key={doc.key} className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">{doc.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-mono">{doc.fileName || '—'}</span>
            <span className="text-[10px] uppercase tracking-wide text-gray-400">
              {doc.source === 'saqa-auto' ? 'Auto-attached' : 'Uploaded by QP'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
