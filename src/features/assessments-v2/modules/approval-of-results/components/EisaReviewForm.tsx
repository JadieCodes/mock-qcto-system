import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Checklist } from '../../../shared/checklist/Checklist';
import { EISA_IMPACT_LABELS } from '../../../mock/data/eisaVerificationLines';
import { useSaveEisaReview } from '../hooks';
import { isPrefilledComment, oldChecklistHasAnswers, PREFILLED_NOTE } from '../eisaReview';
import type { EisaImpactOnApproval, EisaReview, ResultsBatch } from '../types';

function TextField({
  id,
  label,
  value,
  disabled,
  rows = 3,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={rows} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// Batch N2 (29.29): section 2 of QCTO's EISA Quality Assurance Verification Report, with the free
// text of sections 2 and 5. A pre-filled line carries the note "Pre-filled from the system" in its
// comment; the ASD can change both the answer and the comment. A batch stored before N2 keeps its
// old four-folder checklist, shown read-only at the bottom.
export function EisaReviewForm({ batch, editable }: { batch: ResultsBatch; editable: boolean }) {
  const save = useSaveEisaReview();
  const review = batch.eisaReview;
  const update = (patch: Partial<EisaReview>) => save.mutate({ id: batch.id, review: { ...review, ...patch } });
  const prefilledCount = review.checklist.flatMap((s) => s.items).filter((i) => isPrefilledComment(i.comment)).length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">QCTO EISA Quality Assurance Verification Report — Section 2</p>
        {prefilledCount > 0 && (
          <p className="text-xs text-gray-500">
            {prefilledCount} line(s) were answered from what the system already knows (comment starts “{PREFILLED_NOTE}”). Change the answer or comment if it is wrong.
          </p>
        )}
        <Checklist sections={review.checklist} readonly={!editable} requireComment onChange={(checklist) => update({ checklist })} />
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Free-text lines</p>
        <TextField id="eisa-f-summary" label="f. Summary of irregularity/appeal" value={review.irregularitySummary} disabled={!editable} onChange={(v) => update({ irregularitySummary: v })} />
        <div className="space-y-1.5">
          <Label>f. Impact on approval of results</Label>
          <RadioGroup
            value={review.impactOnApproval ?? undefined}
            onValueChange={(v) => update({ impactOnApproval: v as EisaImpactOnApproval })}
            disabled={!editable}
            className="space-y-1"
          >
            {(Object.keys(EISA_IMPACT_LABELS) as EisaImpactOnApproval[]).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <RadioGroupItem id={`eisa-f-impact-${key}`} value={key} />
                <Label htmlFor={`eisa-f-impact-${key}`} className="text-sm font-normal">
                  {EISA_IMPACT_LABELS[key]}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <TextField
          id="eisa-k-summary"
          label="k. Analysis of Learner Results by the QP — short summary from the Analysis of Results Report"
          value={review.analysisSummary}
          disabled={!editable}
          onChange={(v) => update({ analysisSummary: v })}
        />
        <TextField
          id="eisa-m-comment"
          label="m. Sample verification of results by QCTO — comment"
          value={review.sampleVerificationComment}
          disabled={!editable}
          onChange={(v) => update({ sampleVerificationComment: v })}
        />
        <TextField
          id="eisa-m-remedial"
          label="m. Remedial action, if the sample was not of an acceptable standard"
          value={review.sampleRemedialAction}
          disabled={!editable}
          rows={2}
          onChange={(v) => update({ sampleRemedialAction: v })}
        />
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Section 5 — Approval of learner achievements</p>
        <TextField
          id="eisa-recommendation"
          label="Recommendation for further action"
          value={review.recommendationFurtherAction}
          disabled={!editable}
          rows={2}
          onChange={(v) => update({ recommendationFurtherAction: v })}
        />
        <TextField id="eisa-bad-practices" label="Bad practices" value={review.badPractices} disabled={!editable} rows={2} onChange={(v) => update({ badPractices: v })} />
        <TextField id="eisa-good-practices" label="Good practices" value={review.goodPractices} disabled={!editable} rows={2} onChange={(v) => update({ goodPractices: v })} />
      </div>

      {oldChecklistHasAnswers(batch.complianceChecklist) && (
        <details className="rounded-2xl border bg-gray-50 p-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">Previous checklist</summary>
          <div className="pt-4">
            <Checklist sections={batch.complianceChecklist} readonly onChange={() => undefined} />
          </div>
        </details>
      )}
    </div>
  );
}
