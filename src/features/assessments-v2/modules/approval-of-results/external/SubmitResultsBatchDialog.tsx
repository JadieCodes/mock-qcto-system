import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { saIdNumberIssue } from '../../../shared/validation/saIdNumber';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import { ASSESSMENT_COMPONENT_TYPE_LABELS } from '../../qsa-addendum/assessmentDetails';
import { calculateLearnerResult, EISA_OUTCOME_LABELS, reasonText, type EisaLearnerOutcome } from '../calculation';
import { resultsRulesIssue } from '../componentSnapshot';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { EisaBatchFigures } from '../components/EisaBatchFigures';
import { useCaptureLearners, useOnFileDocuments, useResultsDraft, useResultsRulesForSitting, useSaveResultsDraft, useSittingsAwaitingSubmission, useSubmitResultsBatch } from '../hooks';
import { markEntryIssues, markIssue } from '../markEntry';
import { eisaSubmissionIssues, submissionDeadlineFor } from '../workflow';
import type { EisaConfirmationRecord } from '../../eisa-confirmation/types';
import { EISA_DECLARATION_TEXT } from '../config';
import type { CaptureLearner, EisaLearnerResult, EvidenceDocument, OnFileDocument, OnFileDocumentChoice, ResultsComponent, ResultsDraft } from '../types';
import { EisaEvidenceUpload } from './EisaEvidenceUpload';
import { File3Upload } from './File3Upload';
import { OnFileDocumentsSection } from './OnFileDocumentsSection';

interface LearnerRow {
  absent: boolean;
  // One entry per component, in component order. Text, so a half-typed mark is kept as typed.
  marks: string[];
}

interface FormValues {
  learners: LearnerRow[];
}

const OUTCOME_CLASS: Record<EisaLearnerOutcome, string> = {
  competent: 'text-emerald-700',
  'not-yet-competent': 'text-amber-700',
  absent: 'text-gray-500',
};

function toLearnerResults(learners: CaptureLearner[], components: ResultsComponent[], rows: LearnerRow[]): EisaLearnerResult[] {
  return learners.map((l, i) => {
    const row = rows[i];
    const marks: Record<string, number> = {};
    if (!row?.absent) {
      components.forEach((c, j) => {
        const raw = row?.marks[j]?.trim() ?? '';
        if (raw !== '') marks[c.id] = Number(raw);
      });
    }
    return { learnerId: l.learnerId, fullName: l.fullName, idNumber: l.idNumber, absent: row?.absent ?? false, marks };
  });
}

function toRows(learners: CaptureLearner[], components: ResultsComponent[], results: EisaLearnerResult[] | undefined): LearnerRow[] {
  return learners.map((l) => {
    const saved = results?.find((r) => r.learnerId === l.learnerId);
    return { absent: saved?.absent ?? false, marks: components.map((c) => (saved && !saved.absent && saved.marks[c.id] !== undefined ? String(saved.marks[c.id]) : '')) };
  });
}

// The form only mounts while a sitting is selected and its learners and draft have loaded, keyed
// by the sitting's id — closing (or switching sittings) unmounts it and discards whatever was
// typed and not saved, so the next open starts fresh from the saved draft with no reset effect.
// QCTO feedback 05.24: one row per learner, a mark per component and an Absent tick, checked as
// the QP types with the same rules the api uses (markEntry.ts), with the live result per row
// (calculation.ts) and live batch figures. Batch L1.1: marks are whole numbers; each row shows
// the component % and C/NYC per mark and the EISA Percentage Obtained against the pass %. "Save draft" keeps unfinished marks; "Submit results"
// stays disabled until every row passes. File 3 (CSV) fills the same grid.
function ResultsCaptureForm({
  sitting,
  components,
  addendumPassPercent,
  learners,
  onFile,
  draft,
  actorId,
  actorName,
  onDone,
}: {
  sitting: EisaConfirmationRecord;
  components: ResultsComponent[];
  addendumPassPercent: number;
  learners: CaptureLearner[];
  onFile: OnFileDocument[];
  draft: ResultsDraft | null | undefined;
  actorId: string;
  actorName: string;
  onDone: () => void;
}) {
  const submitBatch = useSubmitResultsBatch();
  const saveDraft = useSaveResultsDraft();
  const [evidenceDocuments, setEvidenceDocuments] = useState<EvidenceDocument[]>([]);
  const [onFileChoices, setOnFileChoices] = useState<OnFileDocumentChoice[]>([]);
  const [declared, setDeclared] = useState(false);
  const { control, register, handleSubmit, reset, setValue } = useForm<FormValues>({
    defaultValues: { learners: toRows(learners, components, draft?.learnerResults) },
  });
  const rows = useWatch({ control, name: 'learners' });
  const learnerResults = toLearnerResults(learners, components, rows);
  const issues = markEntryIssues(components, learnerResults);
  const documentIssues = eisaSubmissionIssues(evidenceDocuments, onFile, onFileChoices, declared);

  // A row is complete when it is Absent or every mark passes the shared check.
  const isComplete = (r: EisaLearnerResult) => r.absent || components.every((c) => markIssue(c, r.marks[c.id]) === null);
  const completeResults = learnerResults.filter(isComplete);
  const incompleteCount = learnerResults.length - completeResults.length;

  const onSubmit = () => {
    if (issues.length > 0 || documentIssues.length > 0) return;
    submitBatch.mutate(
      { sittingId: sitting.sittingId, learnerResults, evidenceDocuments, onFileChoices, declarationAccepted: declared, submittedBy: actorName, submittedById: actorId },
      { onSuccess: onDone },
    );
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <DeadlineBadge deadline={submissionDeadlineFor(sitting.sittingDate)} />
        {draft && (
          <p className="text-xs text-gray-500">
            Draft last saved {new Date(draft.savedAt).toLocaleString('en-ZA')} by {draft.savedBy}.
          </p>
        )}

        <File3Upload
          sittingDate={sitting.sittingDate}
          components={components}
          learners={learners}
          onFill={(results) => reset({ learners: toRows(learners, components, results) })}
        />

        <div className="space-y-2">
          <Label>Learner Marks *</Label>
          <div className="overflow-x-auto rounded-xl border max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs text-gray-600">
                <tr>
                  <th className="sticky left-0 z-20 bg-gray-50 p-2 font-medium whitespace-nowrap">Learner</th>
                  {components.map((c) => (
                    <th key={c.id} className="p-2 font-medium whitespace-nowrap align-bottom">
                      <span className="block">{c.name}</span>
                      <span className="block font-normal text-gray-500">{ASSESSMENT_COMPONENT_TYPE_LABELS[c.type]}</span>
                      <span className="block font-normal text-gray-500">EISA date {c.eisaDate}</span>
                      <span className="block font-normal text-gray-500">
                        Highest {c.highestMark} · lowest {c.lowestMark} · {c.weightingPercent}%
                      </span>
                    </th>
                  ))}
                  <th className="p-2 font-medium align-bottom">Absent</th>
                  <th className="p-2 font-medium align-bottom whitespace-nowrap">
                    EISA % obtained
                    <span className="block font-normal text-gray-500">decimal / final</span>
                  </th>
                  <th className="p-2 font-medium align-bottom whitespace-nowrap">Pass %</th>
                  <th className="p-2 font-medium align-bottom">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {learners.map((learner, i) => {
                  const result = learnerResults[i];
                  const absent = result.absent;
                  const complete = isComplete(result);
                  const calc = complete ? calculateLearnerResult(components, result, addendumPassPercent) : null;
                  const idIssue = saIdNumberIssue(learner.idNumber);
                  return (
                    <tr key={learner.learnerId} className="align-top">
                      <td className="sticky left-0 z-[5] bg-white p-2 whitespace-nowrap">
                        <span className="block font-medium text-gray-800">{learner.fullName}</span>
                        <span className="block font-mono text-xs text-gray-500">{learner.idNumber || 'No ID number'}</span>
                        {idIssue && <span className="block max-w-[14rem] whitespace-normal text-xs text-amber-700">{idIssue}. Ask the SDP to correct the learner record.</span>}
                      </td>
                      {components.map((c, j) => {
                        const raw = rows[i]?.marks[j]?.trim() ?? '';
                        // Blank is not an error until Submit — only a typed mark is judged live.
                        const message = absent || raw === '' ? null : markIssue(c, result.marks[c.id]);
                        const errorId = `mark-error-${learner.learnerId}-${c.id}`;
                        return (
                          <td key={c.id} className="p-2">
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={c.highestMark}
                              step={1}
                              className={cn('w-24', message && 'border-red-400')}
                              disabled={absent}
                              aria-label={`${learner.fullName} — ${c.name} mark out of ${c.highestMark}`}
                              aria-invalid={message ? true : undefined}
                              aria-describedby={message ? errorId : undefined}
                              {...register(`learners.${i}.marks.${j}`)}
                            />
                            {message && (
                              <p id={errorId} className="mt-1 max-w-[7rem] text-xs text-red-600">
                                {message}
                              </p>
                            )}
                            {!message && !absent && raw !== '' && (
                              <p className={cn('mt-1 whitespace-nowrap text-xs', result.marks[c.id] >= c.lowestMark ? 'text-emerald-700' : 'text-amber-700')}>
                                {Math.round((result.marks[c.id] / c.highestMark) * 10000) / 100}% · {result.marks[c.id] >= c.lowestMark ? 'C' : 'NYC'}
                              </p>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-2">
                        <Controller
                          control={control}
                          name={`learners.${i}.absent`}
                          render={({ field }) => (
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked === true);
                                // Absent clears the learner's marks (the inputs are locked while ticked).
                                if (checked === true) setValue(`learners.${i}.marks`, components.map(() => ''));
                              }}
                              aria-label={`${learner.fullName} was absent`}
                            />
                          )}
                        />
                      </td>
                      <td className="p-2 whitespace-nowrap text-gray-700">
                        {calc && calc.eisaPercentDecimal !== null ? `${calc.eisaPercentDecimal}% / ${calc.eisaPercentFinal}%` : '—'}
                      </td>
                      <td className="p-2 whitespace-nowrap text-gray-700">{addendumPassPercent}%</td>
                      <td className={cn('p-2 font-medium', calc ? OUTCOME_CLASS[calc.outcome] : 'text-gray-400')}>
                        <span className="whitespace-nowrap">{calc ? EISA_OUTCOME_LABELS[calc.outcome] : 'Incomplete'}</span>
                        {calc && calc.reasons.length > 0 && <span className="block max-w-[12rem] text-xs font-normal">{reasonText(calc)}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            Enter a whole-number mark from 0 to the component's highest mark for every learner, or tick Absent. Under each mark: the component % and C = competent in that
            component (mark at least the lowest mark) or NYC = not yet competent. A learner is Competent when the final EISA % is at least the pass % ({addendumPassPercent}%) and
            the learner is competent in every component.
          </p>
        </div>

        <div className="space-y-1.5">
          <EisaBatchFigures batch={{ components, addendumPassPercent, learnerResults: completeResults }} />
          {incompleteCount > 0 && (
            <p className="text-xs text-amber-700">
              These figures count the {completeResults.length} of {learnerResults.length} learners whose rows are complete so far.
            </p>
          )}
        </div>

        <ValidationSummary issues={issues} title="Every learner needs a mark per component (or Absent) before you can submit:" />

        <EisaEvidenceUpload files={evidenceDocuments} onChange={setEvidenceDocuments} />

        <OnFileDocumentsSection documents={onFile} choices={onFileChoices} onChange={setOnFileChoices} />

        <div className="flex items-start gap-2 rounded-xl border bg-gray-50 p-3">
          <Checkbox id="eisa-results-declaration" checked={declared} onCheckedChange={(v) => setDeclared(v === true)} className="mt-0.5" />
          <Label htmlFor="eisa-results-declaration" className="text-sm font-normal leading-snug text-gray-700">
            {EISA_DECLARATION_TEXT}
          </Label>
        </div>

        <ValidationSummary issues={documentIssues} title="Complete these before you can submit:" />
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-4 mt-4 border-t">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={saveDraft.isPending || submitBatch.isPending}
          onClick={() => saveDraft.mutate({ sittingId: sitting.sittingId, learnerResults, savedBy: actorName })}
        >
          Save draft
        </Button>
        <Button type="submit" disabled={submitBatch.isPending || issues.length > 0 || documentIssues.length > 0}>
          Submit results
        </Button>
      </div>
    </form>
  );
}

// CR-059: the QP submits a results batch for a confirmed sitting — the learners are read from
// the EISA Confirmation record and the components from the approved QASA (29.31); the QP
// captures marks on screen or from a File 3 CSV (05.24) and can attach evidence (UI-only file
// names, same pattern as every other upload in this domain).
export function SubmitResultsBatchDialog({ sittingId, onOpenChange }: { sittingId: string | null; onOpenChange: (open: boolean) => void }) {
  const { person } = useV2Role();
  const { data: awaiting = [] } = useSittingsAwaitingSubmission();
  const { data: rules, isLoading } = useResultsRulesForSitting(sittingId);
  const { data: learners } = useCaptureLearners(sittingId);
  const { data: onFile } = useOnFileDocuments(sittingId);
  const { data: draft, isFetched: draftFetched } = useResultsDraft(sittingId);
  const sitting = awaiting.find((s) => s.sittingId === sittingId);
  const blockedMessage = rules ? resultsRulesIssue(rules) : null;

  return (
    <Modal
      open={!!sittingId}
      onOpenChange={onOpenChange}
      size="lg"
      title="Submit Results Batch"
      description={sitting ? `${sitting.qualificationTitle} — EISA date ${sitting.sittingDate}` : undefined}
    >
      {sitting && !isLoading && rules && blockedMessage && (
        <div className="space-y-4">
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{blockedMessage}</p>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
      {sitting && rules && rules.addendumPassPercent !== null && !blockedMessage && learners && onFile && draftFetched && (
        <ResultsCaptureForm
          key={sitting.id}
          sitting={sitting}
          components={rules.components}
          addendumPassPercent={rules.addendumPassPercent}
          learners={learners}
          onFile={onFile}
          draft={draft}
          actorId={person.id}
          actorName={person.name}
          onDone={() => onOpenChange(false)}
        />
      )}
    </Modal>
  );
}
