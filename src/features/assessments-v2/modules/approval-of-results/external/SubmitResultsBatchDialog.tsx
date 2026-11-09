import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import { NO_COMPONENTS_MESSAGE } from '../componentSnapshot';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { useComponentsForSitting, useSittingsAwaitingSubmission, useSubmitResultsBatch } from '../hooks';
import { markEntryIssues } from '../markEntry';
import { submissionDeadlineFor } from '../workflow';
import type { EisaConfirmationRecord } from '../../eisa-confirmation/types';
import type { EisaLearnerResult, EvidenceDocument, ResultsComponent } from '../types';

interface LearnerRow {
  absent: boolean;
  // One entry per component, in component order.
  marks: string[];
}

interface FormValues {
  learners: LearnerRow[];
}

function toLearnerResults(sitting: EisaConfirmationRecord, components: ResultsComponent[], rows: LearnerRow[]): EisaLearnerResult[] {
  return sitting.learners.map((l, i) => {
    const row = rows[i];
    const marks: Record<string, number> = {};
    if (!row.absent) {
      components.forEach((c, j) => {
        const raw = row.marks[j]?.trim() ?? '';
        if (raw !== '') marks[c.id] = Number(raw);
      });
    }
    return { learnerId: l.learnerId, fullName: l.fullName, absent: row.absent, marks };
  });
}

// The form only mounts while a sitting is selected, keyed by its id — closing (or switching
// sittings) unmounts it and discards whatever was typed, so the next open always starts fresh
// from that sitting's current values with no reset effect needed (same pattern as the EISA
// Calendar's AddEditSittingDialog).
// QCTO feedback 29.31: a mark per component for every learner, or Absent — basic checks only
// (a fuller capture screen and File 3 upload come in the next batch).
function SubmitResultsBatchForm({
  sitting,
  components,
  actorId,
  actorName,
  onDone,
}: {
  sitting: EisaConfirmationRecord;
  components: ResultsComponent[];
  actorId: string;
  actorName: string;
  onDone: () => void;
}) {
  const submitBatch = useSubmitResultsBatch();
  const [evidenceDocuments, setEvidenceDocuments] = useState<EvidenceDocument[]>([]);
  const { control, register, handleSubmit } = useForm<FormValues>({
    defaultValues: { learners: sitting.learners.map(() => ({ absent: false, marks: components.map(() => '') })) },
  });
  const rows = useWatch({ control, name: 'learners' });
  const learnerResults = toLearnerResults(sitting, components, rows);
  // Fix 2A: the shared validation-summary shape, not a silently-disabled button.
  const issues = markEntryIssues(components, learnerResults);

  const onSubmit = () => {
    if (issues.length > 0) return;
    submitBatch.mutate(
      { sittingId: sitting.sittingId, learnerResults, evidenceDocuments, submittedBy: actorName, submittedById: actorId },
      { onSuccess: onDone },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <DeadlineBadge deadline={submissionDeadlineFor(sitting.sittingDate)} />

        <div className="space-y-2">
          <Label>Learner Marks *</Label>
          <div className="overflow-x-auto rounded-xl border max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-600">
                <tr>
                  <th className="p-2 font-medium">Learner</th>
                  {components.map((c) => (
                    <th key={c.id} className="p-2 font-medium whitespace-nowrap">
                      <span className="block">{c.name}</span>
                      <span className="block font-normal text-gray-500">
                        EISA date {c.eisaDate} · out of {c.totalMarks}
                      </span>
                    </th>
                  ))}
                  <th className="p-2 font-medium">Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sitting.learners.map((learner, i) => {
                  const absent = rows[i]?.absent ?? false;
                  return (
                    <tr key={learner.learnerId}>
                      <td className="p-2 text-gray-700 whitespace-nowrap">{learner.fullName}</td>
                      {components.map((c, j) => (
                        <td key={c.id} className="p-2">
                          <Input
                            type="number"
                            min={0}
                            max={c.totalMarks}
                            step="any"
                            className="w-24"
                            disabled={absent}
                            aria-label={`${learner.fullName} — ${c.name} mark out of ${c.totalMarks}`}
                            {...register(`learners.${i}.marks.${j}`)}
                          />
                        </td>
                      ))}
                      <td className="p-2">
                        <Controller
                          control={control}
                          name={`learners.${i}.absent`}
                          render={({ field }) => (
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(checked === true)}
                              aria-label={`${learner.fullName} was absent`}
                            />
                          )}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">Enter a mark from 0 to the component's total for every learner, or tick Absent.</p>
        </div>

        <ValidationSummary issues={issues} title="Every learner needs a mark per component (or Absent) before you can submit:" />

        <div className="space-y-2">
          <Label htmlFor="results-evidence">Evidence Documents (optional)</Label>
          <Input
            id="results-evidence"
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setEvidenceDocuments((prev) => [...prev, { fileName: file.name, fileSize: file.size, uploadedAt: new Date().toISOString() }]);
            }}
          />
          {evidenceDocuments.length > 0 && (
            <ul className="text-xs text-gray-500 space-y-0.5">
              {evidenceDocuments.map((d, i) => (
                <li key={i} className="font-mono">
                  {d.fileName}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitBatch.isPending || issues.length > 0}>
          Submit
        </Button>
      </div>
    </form>
  );
}

// CR-059: the QP submits a results batch for a confirmed sitting — the learners are read from
// the EISA Confirmation record and the components from the approved QASA (29.31); the QP enters
// a mark per component or Absent and can attach evidence (UI-only file names, same pattern as
// every other upload in this domain).
export function SubmitResultsBatchDialog({ sittingId, onOpenChange }: { sittingId: string | null; onOpenChange: (open: boolean) => void }) {
  const { person } = useV2Role();
  const { data: awaiting = [] } = useSittingsAwaitingSubmission();
  const { data: components, isLoading } = useComponentsForSitting(sittingId);
  const sitting = awaiting.find((s) => s.sittingId === sittingId);

  return (
    <Modal
      open={!!sittingId}
      onOpenChange={onOpenChange}
      size="lg"
      title="Submit Results Batch"
      description={sitting ? `${sitting.qualificationTitle} — EISA date ${sitting.sittingDate}` : undefined}
    >
      {sitting && !isLoading && components && components.length === 0 && (
        <div className="space-y-4">
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{NO_COMPONENTS_MESSAGE}</p>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
      {sitting && components && components.length > 0 && (
        <SubmitResultsBatchForm
          key={sitting.id}
          sitting={sitting}
          components={components}
          actorId={person.id}
          actorName={person.name}
          onDone={() => onOpenChange(false)}
        />
      )}
    </Modal>
  );
}
