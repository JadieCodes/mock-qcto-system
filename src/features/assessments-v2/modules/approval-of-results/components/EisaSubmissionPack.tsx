import { formatFileSize } from '../../rpl-toolkit/toolkitFiles';
import { eisaEvidenceTagLabel, onFileChoiceText } from '../config';
import type { EvidenceDocument, OnFileDocumentRecord, ResultsDeclaration } from '../types';

// Read-only views of what the QP sent with an EISA batch, shown to QCTO (QCTO feedback 29.23,
// 29.25, 29.26) and to the QP.

// The same list style as the FISA evidence list, with the EISA tag.
export function EisaEvidenceList({ files }: { files: EvidenceDocument[] }) {
  if (files.length === 0) return <p className="text-xs text-gray-400">No files uploaded.</p>;
  return (
    <ul className="space-y-1">
      {files.map((f, i) => (
        <li key={`${f.fileName}-${f.uploadedAt}-${i}`} className="text-sm text-gray-700">
          <span className="rounded-md border bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-600">{eisaEvidenceTagLabel(f.tag)}</span>{' '}
          <span className="font-mono text-xs">{f.fileName}</span>
          <span className="text-xs text-gray-500">
            {' '}
            — {f.fileType}, {formatFileSize(f.fileSize)}, uploaded on {f.uploadedAt.slice(0, 10)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function OnFileDocumentsList({ documents }: { documents: OnFileDocumentRecord[] }) {
  if (documents.length === 0) return <p className="text-xs text-gray-400">None recorded.</p>;
  return (
    <ul className="rounded-xl border divide-y">
      {documents.map((d) => (
        <li key={d.id} className="flex flex-col gap-0.5 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-gray-700">
            {d.label} <span className="font-mono text-xs text-gray-500">{d.fileName}</span>
          </span>
          <span className={d.choice === 'replaced' ? 'text-xs font-medium text-amber-700' : 'text-xs font-medium text-emerald-700'}>
            {onFileChoiceText(d)} by {d.decidedBy} on {d.decidedAt.slice(0, 10)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DeclarationLine({ declaration }: { declaration: ResultsDeclaration }) {
  return (
    <p className="text-sm text-gray-700">
      Declaration made by {declaration.acceptedBy} on {declaration.acceptedAt.slice(0, 10)}
    </p>
  );
}
