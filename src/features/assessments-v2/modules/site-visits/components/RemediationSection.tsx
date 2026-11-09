import { useRef, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fileUploadIssue } from '../../../shared/files/fileCheck';
import { FileCheckError } from '../../../shared/files/FileCheckNotice';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { SUBMIT_REMEDIATION_LABEL } from '../config';
import { useAddRemediationEvidence, useReportAction } from '../hooks';
import { MISSING_REMEDIATION_RESPONSE_MESSAGE, openRemediationRound, remediationRecordedByAsd } from '../remediation';
import type { RemediationRound, SiteVisit } from '../types';

function dayOf(timestamp: string | null): string {
  return timestamp ? timestamp.slice(0, 10) : '';
}

const DECISION_LABELS = { 'approved-final': 'Approved (final)', 'further-remediation': 'Further remediation needed' } as const;

// Batch V1 (05.14): every round of remediation, oldest first — items, response, evidence, who and
// when. Read-only; shown to the DD and ASD on the visit and to the QP on Visit Outcomes.
export function RemediationHistory({ rounds }: { rounds: RemediationRound[] }) {
  if (rounds.length === 0) return null;
  return (
    <div className="space-y-3">
      {rounds.map((r) => (
        <div key={r.id} className="rounded-2xl border bg-white p-4 shadow-sm space-y-2 text-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Remediation round {r.round}</p>
          <div className="space-y-0.5">
            <p className="text-xs text-gray-400">
              Items from {r.requestedBy} on {dayOf(r.requestedAt)}, shared with {r.sharedWith}
            </p>
            <p className="whitespace-pre-wrap text-gray-800">{r.items}</p>
          </div>
          {r.submittedAt ? (
            <div className="space-y-0.5">
              <p className="text-xs text-gray-400">
                Response {r.submittedByRole === 'ASD' ? `recorded by ${r.submittedBy} (ASD) for ${r.sharedWith}` : `from ${r.submittedBy}`} on {dayOf(r.submittedAt)}
              </p>
              <p className="whitespace-pre-wrap text-gray-800">{r.response}</p>
            </div>
          ) : (
            <p className="text-xs text-amber-700">Waiting for the response.</p>
          )}
          {r.evidence.length > 0 && (
            <ul className="space-y-0.5">
              {r.evidence.map((f, i) => (
                <li key={`${f.fileName}-${f.uploadedAt}-${i}`} className="text-xs text-gray-600">
                  <span className="font-mono">{f.fileName}</span> — {f.uploadedBy} on {dayOf(f.uploadedAt)}
                </li>
              ))}
            </ul>
          )}
          {r.review && (
            <p className="text-xs text-gray-500">
              DD review: <span className="font-medium">{DECISION_LABELS[r.review.decision]}</span> by {r.review.reviewedBy} on {dayOf(r.review.reviewedAt)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// The response form: evidence, a response, "Submit remediation". Used by the QP on Visit Outcomes
// and by the ASD on the visit when the stakeholder has no QP. File input pattern as in Batch M.1: a
// button that clicks a plain hidden input, never a label around an sr-only input, so nothing
// scrolls the modal.
export function RemediationResponseForm({ visit }: { visit: SiteVisit }) {
  const { role, person } = useV2Role();
  const round = openRemediationRound(visit);
  const addEvidence = useAddRemediationEvidence();
  const reportAction = useReportAction();
  const input = useRef<HTMLInputElement>(null);
  const [response, setResponse] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [responseError, setResponseError] = useState<string | null>(null);
  const actor = { actorRole: role, actorId: person.id, actorName: person.name };
  const stakeholder = remediationRecordedByAsd(visit) ? round?.sharedWith ?? 'the stakeholder' : 'you';

  if (!round) return null;

  const onPick = async (files: File[]) => {
    for (const file of files) {
      const issue = fileUploadIssue(file);
      if (issue) {
        setFileError(`${file.name}: ${issue}`);
        continue;
      }
      setFileError(null);
      await addEvidence.mutateAsync([visit.id, { fileName: file.name, fileSize: file.size }, actor]);
    }
  };

  const submit = () => {
    if (!response.trim()) {
      setResponseError(MISSING_REMEDIATION_RESPONSE_MESSAGE);
      return;
    }
    setResponseError(null);
    reportAction.mutate({ visitId: visit.id, actionId: 'remediation-submit', ...actor, note: response }, { onSuccess: () => setResponse('') });
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <p className="text-xs font-semibold text-amber-800 uppercase">
        {remediationRecordedByAsd(visit) ? `Record the response of ${stakeholder}` : 'Your response to the remediation items'} (round {round.round})
      </p>
      <div className="space-y-1.5">
        <Label>Evidence</Label>
        {round.evidence.length === 0 ? (
          <p className="text-xs text-gray-500">No files added.</p>
        ) : (
          <ul className="space-y-0.5">
            {round.evidence.map((f, i) => (
              <li key={`${f.fileName}-${f.uploadedAt}-${i}`} className="text-xs text-gray-700">
                <span className="font-mono">{f.fileName}</span> — {f.uploadedBy} on {dayOf(f.uploadedAt)}
              </li>
            ))}
          </ul>
        )}
        <Button type="button" size="sm" variant="outline" className="gap-2" disabled={addEvidence.isPending} onClick={() => input.current?.click()}>
          <Paperclip className="h-4 w-4" />
          Add evidence
        </Button>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          tabIndex={-1}
          aria-label="Remediation evidence"
          onChange={(e) => {
            const picked = [...(e.currentTarget.files ?? [])];
            e.currentTarget.value = '';
            void onPick(picked);
          }}
        />
        <FileCheckError message={fileError} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`remediation-response-${visit.id}`}>Response *</Label>
        <Textarea
          id={`remediation-response-${visit.id}`}
          rows={3}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Describe what was done about each item..."
        />
        {responseError && (
          <p role="alert" className="text-xs text-red-600">
            {responseError}
          </p>
        )}
      </div>
      <div className="flex justify-end">
        <Button size="sm" disabled={reportAction.isPending} onClick={submit}>
          {SUBMIT_REMEDIATION_LABEL}
        </Button>
      </div>
    </div>
  );
}
