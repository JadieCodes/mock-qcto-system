import { FileTypeIcon } from '../../../shared/files/FileTypeIcon';
import { formatFileSize } from '../../rpl-toolkit/toolkitFiles';
import {
  EISA_IRREGULARITIES_NOT_ASKED,
  EISA_IRREGULARITIES_QUESTION,
  EISA_IRREGULARITIES_REPORTED,
  eisaEvidenceTagLabel,
  onFileChoiceText,
} from '../config';
import type { EvidenceDocument, OnFileDocumentRecord, ResultsBatch, ResultsDeclaration } from '../types';

// Read-only views of what the QP sent with an EISA batch, shown to QCTO (QCTO feedback 29.23,
// 29.25, 29.26) and to the QP.

// The same list style as the FISA evidence list, with the EISA tag.
export function EisaEvidenceList({ files }: { files: EvidenceDocument[] }) {
  if (files.length === 0) return <p className="text-xs text-gray-400">No files uploaded.</p>;
  return (
    <ul className="space-y-1">
      {files.map((f, i) => (
        <li key={`${f.fileName}-${f.uploadedAt}-${i}`} className="flex flex-wrap items-center gap-x-1 text-sm text-gray-700">
          <FileTypeIcon fileName={f.fileName} />
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

// Batch Z1 (11.4): the QP's answer to the irregularities question. A batch submitted before 11 Nov 2026
// was never asked.
export function IrregularitiesAnswer({ batch }: { batch: Pick<ResultsBatch, 'irregularitiesObserved'> }) {
  const answer = batch.irregularitiesObserved;
  return (
    <div className="space-y-0.5 text-sm text-gray-700">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{EISA_IRREGULARITIES_QUESTION}</p>
      {typeof answer !== 'boolean' ? (
        <p className="text-gray-500">{EISA_IRREGULARITIES_NOT_ASKED}</p>
      ) : answer ? (
        <p className="font-medium text-amber-700">Yes. {EISA_IRREGULARITIES_REPORTED}</p>
      ) : (
        <p>No</p>
      )}
    </div>
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
