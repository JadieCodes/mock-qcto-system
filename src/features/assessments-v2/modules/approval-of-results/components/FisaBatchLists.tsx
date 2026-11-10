import { formatFileSize } from '../../rpl-toolkit/toolkitFiles';
import { fisaEvidenceTagLabel } from '../config';
import type { LearnerResult, TaggedEvidenceDocument } from '../types';

// Read-only lists for a FISA results batch, shown to the SDP and to QCTO.

export function FisaLearnerResultsList({ results }: { results: LearnerResult[] }) {
  if (results.length === 0) return <p className="text-xs text-gray-400">No learners on this batch yet.</p>;
  return (
    <ul className="rounded-xl border divide-y max-h-56 overflow-y-auto">
      {results.map((r) => (
        <li key={r.learnerId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <span className="truncate text-gray-700">
            {r.fullName} <span className="font-mono text-xs text-gray-500">{r.idNumber}</span>
          </span>
          <span className={r.outcome === 'competent' ? 'text-emerald-700 font-medium' : r.outcome === 'absent' ? 'text-gray-600 font-medium' : 'text-amber-700 font-medium'}>
            {r.outcome === 'competent' ? 'Competent' : r.outcome === 'absent' ? 'Absent' : 'Not yet competent'}
          </span>
        </li>
      ))}
    </ul>
  );
}

// The same list style as the Site Visits and RPL Toolkit files, plus the tag.
export function FisaEvidenceList({ files }: { files: TaggedEvidenceDocument[] }) {
  if (files.length === 0) return <p className="text-xs text-gray-400">No files uploaded.</p>;
  return (
    <ul className="space-y-1">
      {files.map((f, i) => (
        <li key={`${f.fileName}-${f.uploadedAt}-${i}`} className="text-sm text-gray-700">
          <span className="rounded-md border bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-600">{fisaEvidenceTagLabel(f.tag)}</span>{' '}
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
