import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BatchDocumentDefinition } from '../batchDocuments';

// QCTO feedback 05.17: the documents that belong to this batch's track. A document with a
// download function links to it; the others are generated at final approval (later batches).
export function BatchDocumentsCard<Id extends string>({
  documents,
  downloads,
}: {
  documents: BatchDocumentDefinition<Id>[];
  downloads: Partial<Record<Id, () => void>>;
}) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents for this batch</p>
      </div>
      <ul className="divide-y">
        {documents.map((doc) => {
          const download = downloads[doc.id];
          return (
            <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="text-gray-700">{doc.name}</span>
              {download ? (
                <Button type="button" size="sm" variant="outline" className="gap-2" onClick={download} aria-label={`Download ${doc.name}`}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              ) : (
                <span className="text-xs text-gray-500">Generated at final approval</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
