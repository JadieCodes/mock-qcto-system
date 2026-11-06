import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAuditTrail } from '../../../shared/audit/auditLog';
import { LetterView } from '../../../shared/letters/LetterView';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import { formatFileSize } from '../../rpl-toolkit/toolkitFiles';
import { FISA_EVIDENCE_TAG_OPTIONS, FISA_RESULTS_RECORD_TYPE } from '../config';
import { BatchDownloads } from '../components/BatchDownloads';
import { FisaEvidenceList, FisaLearnerResultsList } from '../components/FisaBatchLists';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { downloadFisaApprovalLetter, downloadFisaVerificationReport, fisaApprovalLetter } from '../downloads';
import { useFisaResultsAction, useFisaResultsBatch, useLearnersForSdp, useSaveFisaResultsDraft, useSubmitFisaResultsBatch } from '../hooks';
import { fisaCompetencyRatePercent, fisaCompetentCountOf, fisaSubmissionIssues } from '../workflow';
import type { FisaEvidenceTag, FisaResultsBatch, LearnerResult, LearnerResultOutcome, TaggedEvidenceDocument } from '../types';

const NOT_ON_BATCH = 'not-on-batch';

const OUTCOME_OPTIONS: { value: LearnerResultOutcome | typeof NOT_ON_BATCH; label: string }[] = [
  { value: NOT_ON_BATCH, label: 'Not on this batch' },
  { value: 'competent', label: 'Competent' },
  { value: 'not-yet-competent', label: 'Not yet competent' },
];

// QCTO feedback 3.14 (b): the SDP's draft — a result per learner, tagged evidence, the
// declaration, and Submit. Learners and evidence save as they are changed; the declaration
// is ticked at submission.
function DraftEditor({ batch, onDone }: { batch: FisaResultsBatch; onDone: () => void }) {
  const { role, person } = useV2Role();
  const sdpId = person.sdpId ?? person.id;
  const { data: learners = [] } = useLearnersForSdp(batch.sdpName);
  const saveDraft = useSaveFisaResultsDraft();
  const submit = useSubmitFisaResultsBatch();
  const [declared, setDeclared] = useState(false);
  const [nextTag, setNextTag] = useState<FisaEvidenceTag | ''>('');

  const isOwnBatch = batch.sdpId === sdpId;
  const issues = fisaSubmissionIssues(batch, declared);

  const saveLearnerResults = (learnerResults: LearnerResult[]) => saveDraft.mutate({ id: batch.id, sdpId, patch: { learnerResults } });
  const saveEvidence = (evidenceDocuments: TaggedEvidenceDocument[]) => saveDraft.mutate({ id: batch.id, sdpId, patch: { evidenceDocuments } });

  const outcomeOf = (learnerId: string) => batch.learnerResults.find((r) => r.learnerId === learnerId)?.outcome ?? NOT_ON_BATCH;

  const setOutcome = (learnerId: string, fullName: string, value: string) => {
    const others = batch.learnerResults.filter((r) => r.learnerId !== learnerId);
    const updated = value === NOT_ON_BATCH ? others : [...others, { learnerId, fullName, outcome: value as LearnerResultOutcome }];
    const order = new Map(learners.map((l, i) => [l.id, i]));
    saveLearnerResults(updated.sort((a, b) => (order.get(a.learnerId) ?? 0) - (order.get(b.learnerId) ?? 0)));
  };

  if (!isOwnBatch) return <p className="text-sm text-gray-500">This batch belongs to another SDP.</p>;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Learner Results *</Label>
        <p className="text-xs text-gray-500">Learners enrolled at {batch.sdpName}. Give each learner you assessed a result.</p>
        {learners.length === 0 ? (
          <p className="text-sm text-gray-400">No enrolled learners found for {batch.sdpName}.</p>
        ) : (
          <div className="rounded-xl border divide-y max-h-72 overflow-y-auto">
            {learners.map((learner) => (
              <div key={learner.id} className="flex items-center justify-between gap-3 p-2.5">
                <span className="text-sm text-gray-700 truncate">{learner.fullName}</span>
                <Select value={outcomeOf(learner.id)} onValueChange={(v) => setOutcome(learner.id, learner.fullName, v)}>
                  <SelectTrigger className="w-48" aria-label={`Result for ${learner.fullName}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTCOME_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500">
          {batch.learnerResults.length} learner(s) on this batch, {fisaCompetentCountOf(batch)} competent.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Evidence *</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={nextTag} onValueChange={(v) => setNextTag(v as FisaEvidenceTag)}>
            <SelectTrigger className="sm:w-56" aria-label="Tag for the file">
              <SelectValue placeholder="Choose a tag first" />
            </SelectTrigger>
            <SelectContent>
              {FISA_EVIDENCE_TAG_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="file"
            aria-label="Evidence file"
            disabled={!nextTag}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && nextTag) {
                saveEvidence([
                  ...batch.evidenceDocuments,
                  { fileName: file.name, fileSize: file.size, fileType: file.type || 'unknown', uploadedAt: new Date().toISOString(), tag: nextTag },
                ]);
              }
              e.target.value = '';
            }}
          />
        </div>
        {batch.evidenceDocuments.length === 0 ? (
          <p className="text-xs text-gray-400">No files uploaded.</p>
        ) : (
          <ul className="rounded-xl border divide-y">
            {batch.evidenceDocuments.map((doc, index) => (
              <li key={`${doc.fileName}-${doc.uploadedAt}-${index}`} className="flex flex-col gap-2 p-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-gray-700 truncate">{doc.fileName}</p>
                  <p className="text-xs text-gray-500">
                    {doc.fileType}, {formatFileSize(doc.fileSize)}, uploaded on {doc.uploadedAt.slice(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={doc.tag}
                    onValueChange={(v) => saveEvidence(batch.evidenceDocuments.map((d, i) => (i === index ? { ...d, tag: v as FisaEvidenceTag } : d)))}
                  >
                    <SelectTrigger className="w-48" aria-label={`Tag for ${doc.fileName}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FISA_EVIDENCE_TAG_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${doc.fileName}`}
                    onClick={() => saveEvidence(batch.evidenceDocuments.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-xl border bg-gray-50 p-3">
        <Checkbox id="fisa-results-declaration" checked={declared} onCheckedChange={(v) => setDeclared(v === true)} className="mt-0.5" />
        <Label htmlFor="fisa-results-declaration" className="text-sm font-normal leading-snug text-gray-700">
          I declare that {batch.sdpName} conducted these assessments against the approved FISA Standard for "{batch.skillsProgrammeTitle}", and that
          the results and evidence submitted are true and complete.
        </Label>
      </div>

      <ValidationSummary issues={issues} title="Complete these before you can submit:" />

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onDone}>
          Close
        </Button>
        <Button
          disabled={issues.length > 0 || submit.isPending}
          onClick={() =>
            submit.mutate(
              { id: batch.id, actor: { role, id: person.id, name: person.name }, declarationAccepted: declared },
              { onSuccess: () => setDeclared(false) },
            )
          }
        >
          Submit results
        </Button>
      </div>
    </div>
  );
}

function SubmittedView({ batch }: { batch: FisaResultsBatch }) {
  const { role, person } = useV2Role();
  const resultsAction = useFisaResultsAction();
  const latestDecline = batch.declineHistory[batch.declineHistory.length - 1];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Status</span>
        <ResultsBatchStatusBadge batch={batch} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Submitted</span>
        <span className="text-sm">{batch.submittedAt?.slice(0, 10) ?? '—'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Competency Rate</span>
        <span className="text-sm font-semibold">
          {fisaCompetencyRatePercent(batch)}% ({fisaCompetentCountOf(batch)}/{batch.learnerResults.length})
        </span>
      </div>

      {batch.workflow.stageId === 'declined' && latestDecline && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-red-700 uppercase">Latest Decline Reason</p>
          <p className="text-sm text-red-800">{latestDecline.reason}</p>
          <Button
            size="sm"
            disabled={resultsAction.isPending}
            onClick={() => resultsAction.mutate({ batchId: batch.id, actionId: 'batch-resubmit', actorRole: role, actorId: person.id, actorName: person.name })}
          >
            Resubmit
          </Button>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs text-gray-400 uppercase">Learner Results</Label>
        <FisaLearnerResultsList results={batch.learnerResults} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-400 uppercase">Evidence</Label>
        <FisaEvidenceList files={batch.evidenceDocuments} />
      </div>
      {batch.declaration && (
        <p className="text-xs text-gray-500">
          Declaration ticked by {batch.declaration.acceptedBy} on {batch.declaration.acceptedAt.slice(0, 10)}.
        </p>
      )}

      {batch.workflow.stageId === 'approved' && batch.approvalLetter && (
        <div className="space-y-3 border-t pt-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Approved. The approval letter was sent to you on {new Date(batch.approvalLetter.sentToSdpAt).toLocaleDateString('en-ZA')}, and the
            results were recommended to Certification.
          </div>
          <BatchDownloads
            onDownloadLetter={() => downloadFisaApprovalLetter(batch)}
            onDownloadReport={() => downloadFisaVerificationReport(batch, getAuditTrail(FISA_RESULTS_RECORD_TYPE, batch.id))}
          />
          <LetterView letter={fisaApprovalLetter(batch)} />
        </div>
      )}
    </div>
  );
}

export function FisaResultsBatchDetail({ batchId, onClose }: { batchId: string | null; onClose: () => void }) {
  const { data: batch } = useFisaResultsBatch(batchId);
  const isDraft = batch?.workflow.stageId === 'sdp-draft';

  return (
    <Modal
      open={!!batchId}
      onOpenChange={(open) => !open && onClose()}
      size="lg"
      title={batch?.skillsProgrammeTitle ?? ''}
      description={batch ? `${batch.sdpName} — FISA results` : undefined}
      footer={isDraft ? undefined : <Button variant="outline" onClick={onClose}>Close</Button>}
    >
      {batch && (isDraft ? <DraftEditor batch={batch} onDone={onClose} /> : <SubmittedView batch={batch} />)}
    </Modal>
  );
}
