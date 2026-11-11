import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fileUploadIssue } from '../../../shared/files/fileCheck';
import { EVIDENCE_ANY_FILE_HINT } from '../../../shared/files/fileKind';
import { FileTypeIcon } from '../../../shared/files/FileTypeIcon';
import { DocumentChecked, FileCheckError } from '../../../shared/files/FileCheckNotice';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import { sdpDirectoryEntryByName } from '../../../mock/data/sdpDirectory';
import { formatFileSize } from '../../rpl-toolkit/toolkitFiles';
import { FISA_EVIDENCE_TAG_OPTIONS, fisaEvidenceTagLabel, fisaOutcomeLabel, FISA_RESULT_CODES } from '../config';
import { fisaSheetBatchOf } from '../fisaLearnerSpreadsheet';
import { FisaSpreadsheetUpload } from './FisaSpreadsheetUpload';
import { FisaSubmittedView } from './FisaSubmittedView';
import { useFisaResultsBatch, useLearnersForBatch, useSaveFisaResultsDraft, useSubmitFisaResultsBatch } from '../hooks';
import { availableFisaEvidenceTags, fisaFiguresOf, fisaSubmissionIssues } from '../workflow';
import type { FisaEvidenceTag, FisaResultsBatch, LearnerResult, LearnerResultOutcome, TaggedEvidenceDocument } from '../types';

const NOT_ON_BATCH = 'not-on-batch';

const OUTCOME_OPTIONS: { value: LearnerResultOutcome | typeof NOT_ON_BATCH; label: string }[] = [
  { value: NOT_ON_BATCH, label: 'Not on this batch' },
  ...(Object.keys(FISA_RESULT_CODES) as LearnerResultOutcome[]).map((value) => ({ value, label: fisaOutcomeLabel(value) })),
];

// QCTO feedback 3.14 (b): the SDP's draft — a result per learner, tagged evidence, the
// declaration, and Submit. Learners and evidence save as they are changed; the declaration
// is ticked at submission.
function DraftEditor({ batch, onDone }: { batch: FisaResultsBatch; onDone: () => void }) {
  const { role, person } = useV2Role();
  const sdpId = person.sdpId ?? person.id;
  const { data: learners = [] } = useLearnersForBatch(batch.sdpName, batch.skillsProgrammeTitle);
  const saveDraft = useSaveFisaResultsDraft();
  const submit = useSubmitFisaResultsBatch();
  const [declared, setDeclared] = useState(false);
  const [nextTag, setNextTag] = useState<FisaEvidenceTag | ''>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isOwnBatch = batch.sdpId === sdpId;
  const issues = fisaSubmissionIssues(batch, declared);

  const saveLearnerResults = (learnerResults: LearnerResult[]) => saveDraft.mutate({ id: batch.id, sdpId, patch: { learnerResults } });
  const saveEvidence = (evidenceDocuments: TaggedEvidenceDocument[]) => saveDraft.mutate({ id: batch.id, sdpId, patch: { evidenceDocuments } });

  const availableTags = availableFisaEvidenceTags(batch.evidenceDocuments);
  // A single-use tag can be taken between picking it and adding the file; then nothing is selected.
  const selectedTag = nextTag !== '' && availableTags.includes(nextTag) ? nextTag : '';
  const sheetBatch = fisaSheetBatchOf(batch, sdpDirectoryEntryByName(batch.sdpName)?.accreditationNumber ?? '');
  const sheetLearners = learners.map((l) => ({ learnerId: l.id, fullName: l.fullName, idNumber: l.idNumber, enrolledDate: l.enrolledDate }));

  // A clean learner spreadsheet fills the results and becomes the Learner spreadsheet evidence (in one save).
  const attachSpreadsheet = (learnerResults: LearnerResult[], file: { name: string; size: number; type: string }) =>
    saveDraft.mutate({
      id: batch.id,
      sdpId,
      patch: {
        learnerResults,
        evidenceDocuments: [
          ...batch.evidenceDocuments.filter((d) => d.tag !== 'learner-spreadsheet'),
          { fileName: file.name, fileSize: file.size, fileType: file.type, uploadedAt: new Date().toISOString(), tag: 'learner-spreadsheet' },
        ],
      },
    });

  const outcomeOf = (learnerId: string) => batch.learnerResults.find((r) => r.learnerId === learnerId)?.outcome ?? NOT_ON_BATCH;

  const setOutcome = (learnerId: string, fullName: string, idNumber: string, value: string) => {
    const others = batch.learnerResults.filter((r) => r.learnerId !== learnerId);
    const updated = value === NOT_ON_BATCH ? others : [...others, { learnerId, fullName, idNumber, outcome: value as LearnerResultOutcome }];
    const order = new Map(learners.map((l, i) => [l.id, i]));
    saveLearnerResults(updated.sort((a, b) => (order.get(a.learnerId) ?? 0) - (order.get(b.learnerId) ?? 0)));
  };

  if (!isOwnBatch) return <p className="text-sm text-gray-500">This batch belongs to another SDP.</p>;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Learner Results *</Label>
        <p className="text-xs text-gray-500">
          Only learners {batch.sdpName} has enrolled for this skills programme can be on the batch. Record the result for each learner you assessed (QCTO&apos;s
          code is shown in brackets); nothing is calculated.
        </p>
        {learners.length === 0 ? (
          <p className="text-sm text-gray-400">No learners are enrolled with {batch.sdpName} for this skills programme.</p>
        ) : (
          <div className="rounded-xl border divide-y max-h-72 overflow-y-auto">
            {learners.map((learner) => (
              <div key={learner.id} className="flex items-center justify-between gap-3 p-2.5">
                <span className="truncate text-sm text-gray-700">
                  {learner.fullName} <span className="font-mono text-xs text-gray-500">{learner.idNumber}</span>
                </span>
                <Select value={outcomeOf(learner.id)} onValueChange={(v) => setOutcome(learner.id, learner.fullName, learner.idNumber, v)}>
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
          {batch.learnerResults.length} learner(s) on this batch, {fisaFiguresOf(batch).competent} competent, {fisaFiguresOf(batch).absent} absent.
        </p>
      </div>

      <FisaSpreadsheetUpload
        batch={sheetBatch}
        onBatch={batch.learnerResults}
        enrolled={sheetLearners}
        hasSpreadsheet={batch.evidenceDocuments.some((d) => d.tag === 'learner-spreadsheet')}
        onClean={attachSpreadsheet}
      />

      <div className="space-y-2">
        <Label>Evidence *</Label>
        <p className="text-xs text-gray-500">
          Required before you can submit: a learner spreadsheet, a verification report and an assessment instrument. The learner spreadsheet and the verification
          report can each be added once. The tag cannot be changed once the file is added.
        </p>
        <p className="text-xs text-gray-500">{EVIDENCE_ANY_FILE_HINT}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={selectedTag} onValueChange={(v) => setNextTag(v as FisaEvidenceTag)}>
            <SelectTrigger className="sm:w-56" aria-label="Tag for the file">
              <SelectValue placeholder="Choose a tag first" />
            </SelectTrigger>
            <SelectContent>
              {FISA_EVIDENCE_TAG_OPTIONS.filter((o) => availableTags.includes(o.value)).map((o) => (
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
              const issue = file ? fileUploadIssue(file) : null;
              setUploadError(issue);
              if (file && selectedTag && !issue) {
                saveEvidence([
                  ...batch.evidenceDocuments,
                  { fileName: file.name, fileSize: file.size, fileType: file.type || 'unknown', uploadedAt: new Date().toISOString(), tag: selectedTag },
                ]);
              }
              e.target.value = '';
            }}
          />
        </div>
        {selectedTag && <p className="text-xs text-gray-500">{FISA_EVIDENCE_TAG_OPTIONS.find((o) => o.value === selectedTag)?.hint}</p>}
        <FileCheckError message={uploadError} />
        {batch.evidenceDocuments.length === 0 ? (
          <p className="text-xs text-gray-400">No files uploaded.</p>
        ) : (
          <ul className="rounded-xl border divide-y">
            {batch.evidenceDocuments.map((doc, index) => (
              <li key={`${doc.fileName}-${doc.uploadedAt}-${index}`} className="flex flex-col gap-2 p-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-mono text-xs text-gray-700">
                    <FileTypeIcon fileName={doc.fileName} />
                    <span className="truncate">{doc.fileName}</span>
                  </p>
                  <p className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {doc.fileType}, {formatFileSize(doc.fileSize)}, uploaded on {doc.uploadedAt.slice(0, 10)}
                    <DocumentChecked />
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-48 text-sm text-gray-700">{fisaEvidenceTagLabel(doc.tag)}</span>
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
      {batch && (isDraft ? <DraftEditor batch={batch} onDone={onClose} /> : <FisaSubmittedView key={batch.id} batch={batch} />)}
    </Modal>
  );
}
