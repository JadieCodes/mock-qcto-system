import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { QP_DIRECTORY } from '../../../mock/data/qpDirectory';
import { FACILITATOR_QUESTIONNAIRE_QUESTIONS, LEARNER_QUESTIONNAIRE_QUESTIONS } from '../../../mock/data/pemQuestionnaires';
import { Checklist } from '../../../shared/checklist/Checklist';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { EVIDENCE_AREAS, evidenceOf, type VisitEvidenceCategory } from '../evidence';
import { freeTextFieldsForType } from '../freeTextFields';
import {
  useSaveChecklist,
  useSaveCompletionDetails,
  useSaveFacilitatorAnswers,
  useSaveFreeTextNotes,
  useSaveLearnerAnswers,
  useSetResultsApprovedForSitting,
  useUpdateVisitDetails,
  useUploadEvidence,
} from '../hooks';
import type { SiteVisit } from '../types';
import { isPerQualificationVisit, visitHasQp, visitSiteKindLabel, visitSiteName } from '../visitTypeLabels';

// CR-049: the full set of qualifications known to the QP directory — used to restrict the QP
// choice below to QPs linked to the chosen qualification. If a visit's existing qualification
// isn't one of these (e.g. typed freely when the visit was planned), it's added as an extra
// option so the selector never silently drops existing data.
const KNOWN_QUALIFICATIONS = [...new Set(QP_DIRECTORY.flatMap((q) => q.qualifications))].sort();

function qpsForQualification(qualificationTitle: string) {
  return QP_DIRECTORY.filter((q) => q.qualifications.includes(qualificationTitle));
}

// Row 34 (CR-049): QP and qualification selectors at the top of the execution form. Selecting
// a qualification restricts the QP choice to QPs of that qualification; both are already
// pre-filled from the visit (itself pre-filled from the linked sitting at creation time, if any).
function QpAndQualificationSelectors({ visit, readonly }: { visit: SiteVisit; readonly: boolean }) {
  const updateVisitDetails = useUpdateVisitDetails();
  const perQualification = isPerQualificationVisit(visit.visitType);
  // QCTO feedback 2.7: RPL/ARPL has no QP; the SDP or assessment centre is shown instead.
  const hasQp = visitHasQp(visit.visitType);

  const qualificationOptions =
    visit.qualificationTitle && !KNOWN_QUALIFICATIONS.includes(visit.qualificationTitle)
      ? [visit.qualificationTitle, ...KNOWN_QUALIFICATIONS]
      : KNOWN_QUALIFICATIONS;
  // QCTO feedback 2.6: EISA Readiness has no qualification, so every QP can be chosen.
  const qpOptionsForCurrentQualification = perQualification ? qpsForQualification(visit.qualificationTitle) : QP_DIRECTORY;
  const currentQpStillValid = qpOptionsForCurrentQualification.some((q) => q.qpId === visit.qpId);
  const qpOptions = currentQpStillValid || !visit.qpId
    ? qpOptionsForCurrentQualification
    : [{ qpId: visit.qpId, name: visit.qpName, qualifications: [] }, ...qpOptionsForCurrentQualification];

  const onQualificationChange = (qualificationTitle: string) => {
    if (!hasQp) {
      updateVisitDetails.mutate({ id: visit.id, patch: { qualificationTitle } });
      return;
    }
    const qpsForNewQualification = qpsForQualification(qualificationTitle);
    const stillValid = qpsForNewQualification.some((q) => q.qpId === visit.qpId);
    if (stillValid) {
      updateVisitDetails.mutate({ id: visit.id, patch: { qualificationTitle } });
    } else {
      const first = qpsForNewQualification[0];
      updateVisitDetails.mutate({ id: visit.id, patch: { qualificationTitle, qpId: first?.qpId ?? '', qpName: first?.name ?? '' } });
    }
  };

  const onQpChange = (qpId: string) => {
    const qp = QP_DIRECTORY.find((q) => q.qpId === qpId);
    updateVisitDetails.mutate({ id: visit.id, patch: { qpId, qpName: qp?.name ?? visit.qpName } });
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase">
        {!hasQp ? `${visitSiteKindLabel(visit)} & Qualification` : perQualification ? 'QP & Qualification' : 'QP'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {perQualification && (
          <div className="space-y-1.5">
            <Label>Qualification *</Label>
            <Select value={visit.qualificationTitle} onValueChange={onQualificationChange} disabled={readonly}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {qualificationOptions.map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {hasQp ? (
          <div className="space-y-1.5">
            <Label>QP *</Label>
            <Select value={visit.qpId} onValueChange={onQpChange} disabled={readonly}>
              <SelectTrigger>
                <SelectValue placeholder="Select a QP" />
              </SelectTrigger>
              <SelectContent>
                {qpOptions.map((q) => (
                  <SelectItem key={q.qpId} value={q.qpId}>
                    {q.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>{visitSiteKindLabel(visit)}</Label>
            <p className="text-sm font-medium pt-2">{visitSiteName(visit) || '—'}</p>
          </div>
        )}
      </div>
      {perQualification && hasQp && <p className="text-xs text-gray-400">Choosing a qualification restricts the QP list to QPs linked to it.</p>}
    </div>
  );
}

// QCTO feedback 1.12: supporting evidence. UI-only file pick (name and size), the same
// pattern as the other uploads in v2. Files stay listed in every later stage; the pickers only
// show while the form itself is editable.
function EvidenceUploads({ visit, readonly }: { visit: SiteVisit; readonly: boolean }) {
  const { person } = useV2Role();
  const uploadEvidence = useUploadEvidence();
  const files = evidenceOf(visit);

  const onPick = async (category: VisitEvidenceCategory, input: HTMLInputElement) => {
    const picked = [...(input.files ?? [])];
    input.value = '';
    for (const file of picked) {
      await uploadEvidence.mutateAsync({ id: visit.id, file: { fileName: file.name, fileSize: file.size, category }, uploadedBy: person.name });
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-4">
      <p className="text-xs font-semibold text-gray-500 uppercase">Supporting Evidence</p>
      {EVIDENCE_AREAS.map((area) => {
        const areaFiles = files.filter((f) => f.category === area.category);
        const inputId = `evidence-${visit.id}-${area.category}`;
        return (
          <div key={area.category} className="space-y-1.5">
            <Label htmlFor={readonly ? undefined : inputId}>
              {area.label}
              {area.required && ' *'}
            </Label>
            {areaFiles.length === 0 ? (
              <p className="text-xs text-gray-400">No files uploaded.</p>
            ) : (
              <ul className="space-y-1">
                {areaFiles.map((f, i) => (
                  <li key={`${f.fileName}-${f.uploadedAt}-${i}`} className="text-sm text-gray-700">
                    <span className="font-mono text-xs">{f.fileName}</span>
                    <span className="text-xs text-gray-500"> — uploaded by {f.uploadedBy} on {f.uploadedAt.slice(0, 10)}</span>
                  </li>
                ))}
              </ul>
            )}
            {!readonly && (
              <input
                id={inputId}
                type="file"
                multiple
                className="text-sm"
                disabled={uploadEvidence.isPending}
                onChange={(e) => void onPick(area.category, e.currentTarget)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

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
      <QpAndQualificationSelectors visit={visit} readonly={readonly} />

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
                Only shown once the related results batch is approved.
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

      <EvidenceUploads visit={visit} readonly={readonly} />

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
