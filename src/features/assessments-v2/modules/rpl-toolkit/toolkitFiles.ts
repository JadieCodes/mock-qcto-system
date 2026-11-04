import type { RplToolkitApplication, RplToolkitFile } from './types';

export function toolkitFilesOf(application: RplToolkitApplication): RplToolkitFile[] {
  return application.toolkitFiles ?? [];
}

// QCTO feedback 3.13: the file picker keeps only the file's details (UI-only upload).
export function toToolkitFile(file: File): RplToolkitFile {
  return { fileName: file.name, fileSize: file.size, fileType: file.type || 'unknown', uploadedAt: new Date().toISOString() };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
