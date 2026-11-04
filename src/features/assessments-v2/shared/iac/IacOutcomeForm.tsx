import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { IacMinutesFile, IacOutcomeOption } from './types';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function IacMinutesFileLine({ file }: { file: IacMinutesFile | null | undefined }) {
  if (!file) return <p className="text-xs text-gray-400">No committee minutes uploaded.</p>;
  return (
    <p className="text-sm text-gray-700">
      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{file.fileName}</span>
      <span className="text-xs text-gray-500">
        {' '}
        — {formatSize(file.fileSize)}, {file.fileType}, uploaded by {file.uploadedBy} on {file.uploadedAt.slice(0, 10)}
      </span>
    </p>
  );
}

// QCTO feedback 2.1 / 2.9: after presenting at the IAC, the DD records the committee's outcome
// as a status change, with a comment (required for some outcomes) and optional minutes.
export function IacOutcomeForm({
  idPrefix,
  options,
  minutesFile,
  uploaderName,
  busy,
  onSaveMinutes,
  onRecord,
}: {
  idPrefix: string;
  options: IacOutcomeOption[];
  minutesFile: IacMinutesFile | null | undefined;
  uploaderName: string;
  busy?: boolean;
  onSaveMinutes: (file: IacMinutesFile | null) => void;
  onRecord: (actionId: string, comment?: string) => void;
}) {
  const [actionId, setActionId] = useState('');
  const [comment, setComment] = useState('');
  const option = options.find((o) => o.actionId === actionId);
  const commentMissing = !!option?.commentRequired && !comment.trim();

  const onPick = (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    onSaveMinutes({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'Unknown type',
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploaderName,
    });
  };

  return (
    <div className="space-y-3 rounded-xl border bg-gray-50 p-3">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Record the IAC outcome</p>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-outcome`}>Outcome</Label>
        <Select value={actionId} onValueChange={setActionId}>
          <SelectTrigger id={`${idPrefix}-outcome`}><SelectValue placeholder="Select the IAC outcome" /></SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.actionId} value={o.actionId}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-comment`}>Comment{option?.commentRequired ? ' *' : ''}</Label>
        <Textarea id={`${idPrefix}-comment`} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
        {commentMissing && <p className="text-xs text-red-600">A comment is required for this outcome.</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-minutes`}>Committee minutes (optional)</Label>
        <IacMinutesFileLine file={minutesFile} />
        <div className="flex flex-wrap items-center gap-2">
          <input id={`${idPrefix}-minutes`} type="file" className="text-sm" disabled={busy} onChange={(e) => onPick(e.currentTarget)} />
          {minutesFile && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => onSaveMinutes(null)}>Remove</Button>
          )}
        </div>
      </div>
      <Button
        size="sm"
        disabled={!option || commentMissing || busy}
        onClick={() => onRecord(actionId, comment.trim() || undefined)}
      >
        Record outcome
      </Button>
    </div>
  );
}
