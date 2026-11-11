import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fileUploadIssue } from '../../../shared/files/fileCheck';
import { EVIDENCE_ANY_FILE_HINT } from '../../../shared/files/fileKind';
import { FileTypeIcon } from '../../../shared/files/FileTypeIcon';
import { DocumentChecked, FileCheckError } from '../../../shared/files/FileCheckNotice';
import { formatFileSize } from '../../rpl-toolkit/toolkitFiles';
import { EISA_EVIDENCE_INSTRUCTION, EISA_EVIDENCE_TAG_OPTIONS, EISA_IRREGULARITIES_QUESTION, eisaEvidenceTagLabel } from '../config';
import type { EisaEvidenceTag, EvidenceDocument } from '../types';
import { availableEisaEvidenceTags } from '../workflow';

// QCTO feedback 29.23 (the same tagged-upload pattern as the FISA results) and 29.24 (an empty
// file is refused, a good one shows "Document checked"). The QP picks a tag, then the file.
// Batch Z1 (11.4): the irregularities question sits in this step; Yes makes the Irregularities report required (workflow.ts).
export function EisaEvidenceUpload({
  files,
  onChange,
  irregularitiesObserved,
  onIrregularitiesChange,
}: {
  files: EvidenceDocument[];
  onChange: (files: EvidenceDocument[]) => void;
  irregularitiesObserved: boolean | null;
  onIrregularitiesChange: (answer: boolean) => void;
}) {
  const [nextTag, setNextTag] = useState<EisaEvidenceTag | ''>('');
  const [error, setError] = useState<string | null>(null);
  const availableTags = availableEisaEvidenceTags(files);
  // A single-use tag can be taken between picking it and adding the file (the file was removed and re-added); then nothing is selected.
  const selectedTag = nextTag !== '' && availableTags.includes(nextTag) ? nextTag : '';

  return (
    <div className="space-y-2">
      <Label>Evidence *</Label>
      <p className="text-xs text-gray-500">{EISA_EVIDENCE_INSTRUCTION}</p>
      <p className="text-xs text-gray-500">{EVIDENCE_ANY_FILE_HINT}</p>
      <div className="space-y-1.5 rounded-xl border bg-gray-50 p-3">
        <Label id="eisa-irregularities-label">{EISA_IRREGULARITIES_QUESTION} *</Label>
        <RadioGroup
          aria-labelledby="eisa-irregularities-label"
          value={irregularitiesObserved === null ? '' : irregularitiesObserved ? 'yes' : 'no'}
          onValueChange={(v) => onIrregularitiesChange(v === 'yes')}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem id="eisa-irregularities-yes" value="yes" />
            <Label htmlFor="eisa-irregularities-yes" className="font-normal">
              Yes
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem id="eisa-irregularities-no" value="no" />
            <Label htmlFor="eisa-irregularities-no" className="font-normal">
              No
            </Label>
          </div>
        </RadioGroup>
        {irregularitiesObserved === true && <p className="text-xs text-amber-700">Upload the Irregularities report before you submit.</p>}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={selectedTag} onValueChange={(v) => setNextTag(v as EisaEvidenceTag)}>
          <SelectTrigger className="sm:w-56" aria-label="Tag for the file">
            <SelectValue placeholder="Choose a tag first" />
          </SelectTrigger>
          <SelectContent>
            {EISA_EVIDENCE_TAG_OPTIONS.filter((o) => availableTags.includes(o.value)).map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="file"
          aria-label="Evidence file"
          disabled={!selectedTag}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && selectedTag) {
              const issue = fileUploadIssue(file);
              setError(issue);
              if (!issue) onChange([...files, { fileName: file.name, fileSize: file.size, fileType: file.type || 'unknown', uploadedAt: new Date().toISOString(), tag: selectedTag }]);
            }
            e.target.value = '';
          }}
        />
      </div>
      <FileCheckError message={error} />
      {files.length === 0 ? (
        <p className="text-xs text-gray-400">No files uploaded.</p>
      ) : (
        <ul className="rounded-xl border divide-y">
          {files.map((doc, index) => (
            <li key={`${doc.fileName}-${doc.uploadedAt}-${index}`} className="flex flex-col gap-2 p-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-mono text-xs text-gray-700">
                  <FileTypeIcon fileName={doc.fileName} />
                  <span className="truncate">{doc.fileName}</span>
                </p>
                <p className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  {doc.fileType}, {formatFileSize(doc.fileSize)}
                  <DocumentChecked />
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm text-gray-700">{eisaEvidenceTagLabel(doc.tag)}</span>
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${doc.fileName}`} onClick={() => onChange(files.filter((_, i) => i !== index))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
