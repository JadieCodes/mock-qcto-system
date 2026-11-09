import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DocumentChecked, FileCheckError } from '../../../shared/files/FileCheckNotice';
import { formatFileSize } from '../../rpl-toolkit/toolkitFiles';
import type { OnFileDocument, OnFileDocumentChoice, OnFileDocumentId } from '../types';
import { replaceOnFileDocument } from '../workflow';

// QCTO feedback 29.25: the documents QCTO already holds, so the QP is not asked for them again.
// Each one is confirmed as it stands, or replaced with a new file (29.24: not an empty one).
export function OnFileDocumentsSection({
  documents,
  choices,
  onChange,
}: {
  documents: OnFileDocument[];
  choices: OnFileDocumentChoice[];
  onChange: (choices: OnFileDocumentChoice[]) => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<OnFileDocumentId, string | null>>>({});
  const inputs = useRef<Partial<Record<OnFileDocumentId, HTMLInputElement | null>>>({});
  const choiceOf = (id: OnFileDocumentId) => choices.find((c) => c.documentId === id);
  const setChoice = (next: OnFileDocumentChoice) => onChange([...choices.filter((c) => c.documentId !== next.documentId), next]);

  return (
    <div className="space-y-2">
      <Label>Already on file *</Label>
      <p className="text-xs text-gray-500">QCTO already holds these documents for this qualification. Confirm each one, or replace it with a new file.</p>
      <ul className="rounded-xl border divide-y">
        {documents.map((doc) => {
          const choice = choiceOf(doc.id);
          const replaceId = `replace-${doc.id}`;
          return (
            <li key={doc.id} className="space-y-1 p-2.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-gray-700">{doc.label}</p>
                  <p className="font-mono text-xs text-gray-500 truncate">
                    {choice?.replacement ? choice.replacement.fileName : doc.fileName} · {formatFileSize(choice?.replacement ? choice.replacement.fileSize : doc.fileSize)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={choice?.choice === 'confirmed' ? 'default' : 'outline'}
                    aria-pressed={choice?.choice === 'confirmed'}
                    aria-label={`Confirm ${doc.label}`}
                    onClick={() => {
                      setErrors((prev) => ({ ...prev, [doc.id]: null }));
                      setChoice({ documentId: doc.id, choice: 'confirmed', replacement: null });
                    }}
                  >
                    Confirm
                  </Button>
                  {/* Not a label around an sr-only input: that input is positioned against the modal, and focusing it scrolled the modal's hidden overflow, blanking it. */}
                  <Button type="button" size="sm" variant="outline" aria-label={`Replace ${doc.label}`} onClick={() => inputs.current[doc.id]?.click()}>
                    Replace
                  </Button>
                  <input
                    ref={(el) => {
                      inputs.current[doc.id] = el;
                    }}
                    id={replaceId}
                    type="file"
                    hidden
                    tabIndex={-1}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const result = replaceOnFileDocument(choices, doc.id, file);
                        setErrors((prev) => ({ ...prev, [doc.id]: result.error }));
                        if (!result.error) onChange(result.choices);
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
              <FileCheckError message={errors[doc.id] ?? null} />
              {choice?.choice === 'confirmed' && <p className="text-xs text-emerald-700">Confirmed.</p>}
              {choice?.choice === 'replaced' && (
                <p className="flex flex-wrap items-center gap-2 text-xs text-amber-700">
                  Replaced with a new file.
                  <DocumentChecked />
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
