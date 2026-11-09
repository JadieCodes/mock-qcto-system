// QCTO feedback 29.24: the one check every upload goes through. Only an empty (0-byte) file is
// refused for now. Whether a document's content is correct (by rules or AI) is for the build —
// QCTO still has to say what makes each document correct (progress.md, Batch M).
export const EMPTY_FILE_MESSAGE = 'The file is empty.';
export const DOCUMENT_CHECKED_LABEL = 'Document checked';

// null when the file may be added, otherwise the message to show next to the upload.
export function fileUploadIssue(file: { size: number }): string | null {
  return file.size > 0 ? null : EMPTY_FILE_MESSAGE;
}

// The api-side guard for the same rule, so a screen that forgets the check still cannot add an
// empty file.
export function assertFileNotEmpty(file: { fileName: string; fileSize: number }): void {
  if (file.fileSize <= 0) throw new Error(`${file.fileName}: ${EMPTY_FILE_MESSAGE}`);
}
