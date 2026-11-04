import type { FormalLetterFile } from '../types';

// QCTO feedback 2.4: the formal letter is a UI-only upload — only the file's details are kept.
export function toLetterFile(file: File): FormalLetterFile {
  return { fileName: file.name, fileSize: file.size, fileType: file.type || 'unknown', uploadedAt: new Date().toISOString() };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function letterSummary(letter: FormalLetterFile): string {
  return `${letter.fileName} · ${formatFileSize(letter.fileSize)} · ${letter.fileType} · ${new Date(letter.uploadedAt).toLocaleDateString('en-ZA')}`;
}
