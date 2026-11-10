import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { ValidationSummary } from '../../../shared/validation/ValidationSummary';
import { RESULTS_DD_ROLE } from '../config';
import { eisaAdministrationRows, type EisaReportContext } from '../eisaVerificationReport';
import { useSaveDdLetterChecklist } from '../hooks';
import { ddCheckedIdsOf, ddChecklistIssues, ddCompletedText, ddLetterTable, DD_LETTER_CHECK_LINES } from '../letterChecklist';
import type { ResultsBatch } from '../types';

// Batch N2 (29.35): QCTO's "Approval of Results letter checklist". The Deputy Director ticks it
// against the draft Outcome Letter below it and cannot send the batch on until every line is
// ticked. Read-only afterwards, with the Deputy Director's name and date.
export function DdLetterChecklistPanel({ batch, ctx }: { batch: ResultsBatch; ctx: EisaReportContext }) {
  const { role } = useV2Role();
  const save = useSaveDdLetterChecklist();
  const editable = role === RESULTS_DD_ROLE && batch.workflow.stageId === 'dd-review';
  const ticked = new Set(ddCheckedIdsOf(batch));
  const stored = batch.ddChecklist?.checkedIds ?? [];
  const issues = editable ? ddChecklistIssues(batch.ddChecklist) : [];
  // Lines the system cannot hold (the QP's website checklist, the analysis report) never tick; the
  // letters, report and register do not exist yet at this stage.
  const notHeld = eisaAdministrationRows(batch, ctx)
    .filter((r) => !r.onFile && !r.optional && !r.group.startsWith('E.') && r.label !== 'Verification report')
    .map((r) => r.label);

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Approval of Results letter checklist</p>
      </div>
      <div className="p-4 space-y-4">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
          {ddLetterTable(batch).map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 border-b border-gray-100 py-1">
              <dt className="text-gray-500">{label}</dt>
              <dd className="font-medium text-gray-800 text-right">{value || '—'}</dd>
            </div>
          ))}
        </dl>

        <ul className="space-y-2">
          {DD_LETTER_CHECK_LINES.map((line) => (
            <li key={line.id} className="flex items-start gap-2">
              <Checkbox
                id={`dd-check-${line.id}`}
                checked={ticked.has(line.id)}
                disabled={!editable || line.auto}
                onCheckedChange={(value) =>
                  save.mutate({
                    id: batch.id,
                    actorRole: role,
                    checkedIds: value === true ? [...stored, line.id] : stored.filter((c) => c !== line.id),
                  })
                }
              />
              <Label htmlFor={`dd-check-${line.id}`} className="text-sm font-normal leading-snug">
                {line.text}
                {line.auto && <span className="ml-1 text-xs text-gray-500">(ticked by the system at the final decision)</span>}
              </Label>
            </li>
          ))}
        </ul>

        {notHeld.length > 0 && <p className="text-xs text-gray-500">Not on file in the system yet: {notHeld.join(', ')}.</p>}
        <ValidationSummary issues={issues} title="Tick every line before sending the batch on:" />
        {!editable && <p className="text-xs text-gray-500">Completed by: {ddCompletedText(batch.ddChecklist)}</p>}
      </div>
    </div>
  );
}
