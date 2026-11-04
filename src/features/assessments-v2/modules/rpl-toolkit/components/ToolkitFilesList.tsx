import { formatFileSize } from '../toolkitFiles';
import type { RplToolkitFile } from '../types';

// QCTO feedback 3.13: the same list style as the Site Visits evidence files (Batch D).
export function ToolkitFilesList({ files }: { files: RplToolkitFile[] }) {
  if (files.length === 0) return <p className="text-xs text-gray-400">No files uploaded.</p>;
  return (
    <ul className="space-y-1">
      {files.map((f, i) => (
        <li key={`${f.fileName}-${f.uploadedAt}-${i}`} className="text-sm text-gray-700">
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
