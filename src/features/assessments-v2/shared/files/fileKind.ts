// Batch Z1 (11.5): evidence uploads take any file, so each file shows a small icon for its kind, worked
// out from the file extension (the browser's type is often blank for audio and video).
export type FileKind = 'document' | 'image' | 'audio' | 'video' | 'other';

export const EVIDENCE_ANY_FILE_HINT = 'Any file type: documents, spreadsheets, PDFs, photos, audio and video';

const EXTENSIONS: Record<Exclude<FileKind, 'other'>, string[]> = {
  document: ['pdf', 'doc', 'docx', 'odt', 'rtf', 'txt', 'xls', 'xlsx', 'ods', 'csv', 'ppt', 'pptx'],
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic', 'tif', 'tiff', 'svg'],
  audio: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'oga', 'wma', 'flac', 'amr'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'webm', 'm4v', '3gp', 'mpg', 'mpeg'],
};

export const FILE_KIND_LABELS: Record<FileKind, string> = {
  document: 'Document',
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
  other: 'Other file',
};

export function fileKindOf(fileName: string): FileKind {
  const dot = fileName.lastIndexOf('.');
  const extension = dot < 0 ? '' : fileName.slice(dot + 1).trim().toLowerCase();
  return (Object.keys(EXTENSIONS) as Exclude<FileKind, 'other'>[]).find((kind) => EXTENSIONS[kind].includes(extension)) ?? 'other';
}
