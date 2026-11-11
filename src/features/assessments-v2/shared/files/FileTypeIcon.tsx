import { File, FileAudio, FileImage, FileText, FileVideo } from 'lucide-react';
import { FILE_KIND_LABELS, fileKindOf, type FileKind } from './fileKind';

const ICONS: Record<FileKind, typeof File> = {
  document: FileText,
  image: FileImage,
  audio: FileAudio,
  video: FileVideo,
  other: File,
};

// Batch Z1 (11.5): a small icon for the kind of file, from its name.
export function FileTypeIcon({ fileName }: { fileName: string }) {
  const kind = fileKindOf(fileName);
  const Icon = ICONS[kind];
  return <Icon className="h-4 w-4 shrink-0 text-gray-500" role="img" aria-label={FILE_KIND_LABELS[kind]} />;
}
