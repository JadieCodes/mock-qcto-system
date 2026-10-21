import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FACILITATOR_QUESTIONNAIRE_QUESTIONS, LEARNER_QUESTIONNAIRE_QUESTIONS } from '../../../mock/data/pemQuestionnaires';
import { Checklist } from '../../../shared/checklist/Checklist';
import { RESULTS_APPROVAL_IS_SIMULATED } from '../config';
import { freeTextFieldsForType } from '../freeTextFields';
import {
  useSaveChecklist,
  useSaveCompletionDetails,
  useSaveFacilitatorAnswers,
  useSaveFreeTextNotes,
  useSaveLearnerAnswers,
  useSetResultsApprovedForSitting,
} from '../hooks';
import type { SiteVisit } from '../types';

// CR-048/CR-049: one dynamic form component — the checklist, free-text sections and QP/
// qualification context all change with visit.visitType, but the shell is shared.
export function ExecutionForm({ visit, readonly }: { visit: SiteVisit; readonly: boolean }) {
  const saveChecklist = useSaveChecklist();
  const saveFreeTextNotes = useSaveFreeTextNotes();
  const saveCompletionDetails = useSaveCompletionDetails();
  const saveFacilitatorAnswers = useSaveFacilitatorAnswers();
  const saveLearnerAnswers = useSaveLearnerAnswers();
  const setResultsApproved = useSetResultsApprovedForSitting();

  const freeTextFields = freeTextFieldsForType(visit.visitType);
  const isPostEisaMonitoring = visit.visitType === 'post-eisa-monitoring';

  return (
    <div className="space-y-6">
      <Checklist sections={visit.checklist} readonly={readonly} onChange={(sections) => saveChecklist.mutate({ id: visit.id, sections })} />

      <div className="space-y-4">
        {freeTextFields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Label>{field.label}</Label>
            <Textarea
              rows={3}
              value={visit.freeTextNotes[field.id] ?? ''}
              placeholder={field.placeholder}
              disabled={readonly}
              onChange={(e) => saveFreeTextNotes.mutate({ id: visit.id, freeTextNotes: { ...visit.freeTextNotes, [field.id]: e.target.value } })}
            />
          </div>
        ))}
      </div>

      {isPostEisaMonitoring && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Facilitator &amp; Learner Questionnaires</p>
              <p className="text-xs text-gray-500">
                CR-057: only shown on Post-EISA Monitoring, and only once the related results batch is approved.
                {RESULTS_APPROVAL_IS_SIMULATED && ' Phase 6 (Approval of Results) does not exist yet — simulated here.'}
              </p>
            </div>
            {!readonly && (
              <div className="flex items-center gap-2">
                <Label htmlFor="results-approved-toggle" className="text-xs text-gray-500">
                  Simulate: results approved
                </Label>
                <Switch
                  id="results-approved-toggle"
                  checked={visit.resultsApprovedForSitting}
                  onCheckedChange={(checked) => setResultsApproved.mutate({ id: visit.id, approved: checked })}
                />
              </div>
            )}
          </div>

          {!visit.resultsApprovedForSitting ? (
            <p className="text-sm text-gray-400">Not available yet — the related results batch has not been approved.</p>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Facilitator Questionnaire</p>
                {FACILITATOR_QUESTIONNAIRE_QUESTIONS.map((q) => (
                  <div key={q.id} className="space-y-1">
                    <Label className="text-sm font-normal text-gray-700">{q.label}</Label>
                    <Textarea
                      rows={2}
                      disabled={readonly}
                      value={visit.facilitatorAnswers[q.id] ?? ''}
                      onChange={(e) =>
                        saveFacilitatorAnswers.mutate({ id: visit.id, facilitatorAnswers: { ...visit.facilitatorAnswers, [q.id]: e.target.value } })
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Learner Questionnaire</p>
                {LEARNER_QUESTIONNAIRE_QUESTIONS.map((q) => (
                  <div key={q.id} className="space-y-1">
                    <Label className="text-sm font-normal text-gray-700">{q.label}</Label>
                    <Textarea
                      rows={2}
                      disabled={readonly}
                      value={visit.learnerAnswers[q.id] ?? ''}
                      onChange={(e) => saveLearnerAnswers.mutate({ id: visit.id, learnerAnswers: { ...visit.learnerAnswers, [q.id]: e.target.value } })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Completed By (Name)</Label>
          <Input
            value={visit.completedBy}
            disabled={readonly}
            onChange={(e) => saveCompletionDetails.mutate({ id: visit.id, completedBy: e.target.value, completedDate: visit.completedDate })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Completion Date</Label>
          <Input
            type="date"
            value={visit.completedDate}
            disabled={readonly}
            onChange={(e) => saveCompletionDetails.mutate({ id: visit.id, completedBy: visit.completedBy, completedDate: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
