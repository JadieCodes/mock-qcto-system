import { useState } from 'react';
import { Award, BookOpen, Calendar, Hash, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getAuditTrail } from '../../../shared/audit/auditLog';
import { isChecklistComplete } from '../../../shared/checklist/types';
import { Checklist } from '../../../shared/checklist/Checklist';
import { LetterView } from '../../../shared/letters/LetterView';
import { autoEvaluateQsaChecklist } from '../../../mock/integrations/aiValidation';
import { canActInStage, availableActions } from '../../../shared/workflow/engine';
import type { WorkflowAction, WorkflowDefinition } from '../../../shared/workflow/types';
import { Modal } from '../../../shared/ui/Modal';
import { ReasonDialog } from '../../../shared/ui/ReasonDialog';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { FieldError, ValidationSummary } from '../../../shared/validation/ValidationSummary';
import type { ValidationIssue } from '../../../shared/validation/types';
import { Checkbox } from '@/components/ui/checkbox';
import { AssessmentDetailsCard } from '../components/AssessmentDetailsCard';
import { AssessmentDetailsEditor } from '../components/AssessmentDetailsEditor';
import { QsaAuditTrail } from '../components/AuditTrail';
import { CorrectionsPanel } from '../components/CorrectionsPanel';
import { DocumentsList } from '../components/DocumentsList';
import { QsaStatusBadge } from '../components/StatusBadge';
import { QASA_REVIEW_STARTER_ROLE, QSA_AUTO_EVALUATION_MANDATORY_ITEM_IDS } from '../config';
import {
  useEvaluationAction,
  useOutcomeAction,
  useQsaAddendumApplication,
  useSaveDdReviewChecklist,
  useSaveEvaluationReport,
  useSaveIacMinutes,
  useSaveIacPresentation,
  useSaveQsaChecklist,
} from '../hooks';
import { acknowledgementLetterOf, feedbackLetterOf } from '../letters';
import {
  APPROVE_FOR_TABLING_LABEL,
  EVAL_WORKFLOW,
  IAC_OUTCOME_OPTIONS,
  IAC_REMEDIATION_LABEL,
  isQasaApproved,
  isQasaUnderReview,
  OUTCOME_WORKFLOW,
  QASA_UNDER_REVIEW_LABEL,
  RETURN_TO_DD_LABEL,
} from '../workflow';
import { IacMinutesFileLine, IacOutcomeForm } from '../../../shared/iac/IacOutcomeForm';
import type { QsaAddendumApplication } from '../types';
import type { Role } from '../../../types';

// A single generic button that opens an inline mandatory-note box for actions that require
// one (CR-055, CR-056), and fires immediately for ones that don't.
function ActionButton({
  action,
  onRun,
  disabled,
}: {
  action: WorkflowAction;
  onRun: (note?: string) => void;
  disabled?: boolean;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const variant = action.kind === 'reject' ? 'destructive' : action.kind === 'send-back' ? 'outline' : 'default';

  if (!action.requiresNote) {
    return (
      <Button size="sm" variant={variant} disabled={disabled} onClick={() => onRun()}>
        {action.label}
      </Button>
    );
  }

  if (!noteOpen) {
    return (
      <Button size="sm" variant={variant} disabled={disabled} onClick={() => setNoteOpen(true)}>
        {action.label}
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border p-3 bg-gray-50 w-full">
      <p className="text-xs font-medium text-gray-600">{action.label} — a note is required</p>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Explain why..." />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={variant}
          disabled={!note.trim() || disabled}
          onClick={() => {
            onRun(note);
            setNoteOpen(false);
            setNote('');
          }}
        >
          Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setNoteOpen(false); setNote(''); }}>Cancel</Button>
      </div>
    </div>
  );
}

function ActionBar({
  definition,
  stageId,
  role,
  onRun,
  disabledActionIds,
}: {
  definition: WorkflowDefinition;
  stageId: string;
  role: Role;
  onRun: (actionId: string, note?: string) => void;
  disabledActionIds?: string[];
}) {
  if (!canActInStage(definition, stageId, role)) return null;
  const actions = availableActions(definition, stageId);
  if (actions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {actions.map((action) => (
        <ActionButton
          key={action.id}
          action={action}
          disabled={disabledActionIds?.includes(action.id)}
          onRun={(note) => onRun(action.id, note)}
        />
      ))}
    </div>
  );
}

function ApplicationWorkspaceContent({ application }: { application: QsaAddendumApplication }) {
  const { role, person } = useV2Role();
  const actorName = person.name;
  const actorId = person.id;

  const evaluationAction = useEvaluationAction();
  const outcomeAction = useOutcomeAction();
  const saveChecklist = useSaveQsaChecklist();
  const saveDdChecklist = useSaveDdReviewChecklist();
  const saveReport = useSaveEvaluationReport();
  const savePresentation = useSaveIacPresentation();
  const saveMinutes = useSaveIacMinutes();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const checklistComplete = isChecklistComplete(application.qsaChecklist, true);
  const reportIssues: ValidationIssue[] = [];
  if (!application.evaluationReport.findings.trim()) {
    reportIssues.push({ field: 'findings', message: 'Findings are required.' });
  }
  if (application.evaluationReport.recommendation === '') {
    reportIssues.push({ field: 'recommendation', message: 'Select a recommendation.' });
  }
  const sittingsOnDemand = application.evaluationReport.eisaSittingsOnDemand ?? false;
  if (application.evaluationReport.approvedEisaSittingsPerYear == null && !sittingsOnDemand) {
    reportIssues.push({ field: 'approvedEisaSittingsPerYear', message: 'Enter the approved EISA sittings per year, or tick "On demand".' });
  }
  const reportComplete = reportIssues.length === 0;
  const ddChecklistComplete = isChecklistComplete(application.ddReviewChecklist, true);
  // QCTO feedback 05.7: the IAC either approves or requests remediation — never declines.
  const decided = application.evalState.stageId === 'approved';
  const approved = isQasaApproved(application);
  const underReview = isQasaUnderReview(application);
  const canStartReview = approved && !underReview && role === QASA_REVIEW_STARTER_ROLE;
  const asdEditable = role === 'ASD' && application.evalState.stageId === 'asd-evaluation';
  const ddEditable = role === 'Deputy Director' && application.evalState.stageId === 'dd-review';

  // Row 7 (test findings): the automatic evaluation outcome — only computed once the checklist
  // and report are complete, since a "No" on an unanswered item isn't meaningful yet.
  const autoOutcome =
    checklistComplete && reportComplete
      ? autoEvaluateQsaChecklist(application.qsaChecklist, QSA_AUTO_EVALUATION_MANDATORY_ITEM_IDS)
      : null;
  const autoOutcomeActionId = autoOutcome === 'negative' ? 'eval-return-to-qp' : 'eval-send-to-dd';

  // Rows 8/9 (test findings): once the DD or IAC has touched this application, the ASD must
  // keep seeing their review (checklist + reason) even after it loops back to asd-evaluation
  // for a redo — not just while dd-review/iac-review is the current stage.
  const ddReviewTouched = application.ddReviewChecklist.some((section) => section.items.some((item) => item.answer !== null));
  const iacTouched = !!application.iacPresentationFileName || !!application.iacMinutesFile;
  const showDdBox = application.evalState.stageId === 'dd-review' || ddReviewTouched;
  const showIacBox = application.evalState.stageId === 'iac-review' || decided || iacTouched;
  const ddRecordsIacOutcome = canActInStage(EVAL_WORKFLOW, 'iac-review', role) && application.evalState.stageId === 'iac-review';

  const evalTrailNewestFirst = getAuditTrail('qsa-addendum-evaluation', application.id).slice().reverse();
  const tablingEntry = evalTrailNewestFirst.find((entry) => entry.action === APPROVE_FOR_TABLING_LABEL);
  const showDirectorOfficeBox = application.evalState.stageId === 'director-office-review' || !!tablingEntry;
  const latestDoReturnNote =
    application.evalState.stageId === 'dd-review' ? evalTrailNewestFirst.find((entry) => entry.action === RETURN_TO_DD_LABEL)?.note : undefined;
  const iacOutcomeEntry = decided
    ? evalTrailNewestFirst.find((entry) => EVAL_WORKFLOW.actions.some((a) => a.label === entry.action && IAC_OUTCOME_OPTIONS.some((o) => o.actionId === a.id)))
    : undefined;

  const latestDdReturnNote =
    application.evalState.stageId === 'asd-evaluation'
      ? getAuditTrail('qsa-addendum-evaluation', application.id)
          .slice()
          .reverse()
          .find((entry) => entry.action === 'Return to ASD')?.note
      : undefined;
  const latestIacRemediationNote =
    application.evalState.stageId === 'asd-evaluation'
      ? getAuditTrail('qsa-addendum-evaluation', application.id)
          .slice()
          .reverse()
          .find((entry) => entry.action === IAC_REMEDIATION_LABEL)?.note
      : undefined;

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="acknowledgement">Acknowledgement</TabsTrigger>
        <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
        <TabsTrigger value="outcome">Feedback Letter</TabsTrigger>
        <TabsTrigger value="audit">Audit Trail</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Status</span>
          <QsaStatusBadge application={application} />
        </div>
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">QP & Qualification</p>
          </div>
          <div className="px-4 divide-y divide-gray-50">
            <div className="flex items-start gap-3 py-2.5"><User className="h-4 w-4 text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-400 uppercase">Name of QP</p><p className="text-sm font-medium">{application.qpName}</p></div></div>
            <div className="flex items-start gap-3 py-2.5"><BookOpen className="h-4 w-4 text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-400 uppercase">Qualification Title</p><p className="text-sm font-medium">{application.qualificationTitle}</p></div></div>
            <div className="flex items-start gap-3 py-2.5"><Hash className="h-4 w-4 text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-400 uppercase">SAQA ID</p><p className="text-sm font-medium">{application.saqaId}</p></div></div>
            <div className="flex items-start gap-3 py-2.5"><Award className="h-4 w-4 text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-400 uppercase">NQF Level / Credits</p><p className="text-sm font-medium">{application.nqfLevel} · {application.credits} credits</p></div></div>
            <div className="flex items-start gap-3 py-2.5"><Calendar className="h-4 w-4 text-gray-400 mt-0.5" /><div><p className="text-xs text-gray-400 uppercase">Submission Date</p><p className="text-sm font-medium">{application.submissionDate}</p></div></div>
          </div>
        </div>
        {application.notes && (
          <div className="rounded-2xl border bg-amber-50 border-amber-200 p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">QP Notes</p>
            <p className="text-sm text-amber-900">{application.notes}</p>
          </div>
        )}
        <AssessmentDetailsCard application={application} />
        {/* QCTO feedback 05.2: an approved QASA can be reviewed at any time; it stays approved meanwhile. */}
        {underReview && application.review && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 space-y-1">
            <p className="font-semibold">{QASA_UNDER_REVIEW_LABEL}</p>
            <p className="text-xs">
              Review started by {application.review.startedBy} on {new Date(application.review.startedAt).toLocaleDateString('en-ZA')}. It goes through ASD
              evaluation, Deputy Director moderation, the Director Office, the IAC and the CEO again, and stays approved for every other module meanwhile.
            </p>
            <p className="whitespace-pre-wrap"><span className="font-medium">Reason:</span> {application.review.reason}</p>
          </div>
        )}
        {canStartReview && (
          <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Review</p>
            <p className="text-sm text-gray-600">
              Start a review if there is a need. The QASA goes back through the normal route and stays approved until the review is approved.
            </p>
            <Button size="sm" variant="outline" disabled={evaluationAction.isPending} onClick={() => setReviewDialogOpen(true)}>
              Start review
            </Button>
            <ReasonDialog
              open={reviewDialogOpen}
              title="Start review"
              description="The QASA goes back to ASD evaluation. A reason is required; it is recorded in the audit trail."
              confirmLabel="Start review"
              onOpenChange={setReviewDialogOpen}
              onConfirm={(reason) =>
                evaluationAction.mutate({ applicationId: application.id, actionId: 'eval-start-review', actorRole: role, actorId, actorName, note: reason })
              }
            />
          </div>
        )}
        <DocumentsList documents={application.documents} />
      </TabsContent>

      {/* QCTO feedback 05.5: issued automatically at submission — no ASD preview or DD review. */}
      <TabsContent value="acknowledgement" className="space-y-4">
        <LetterView letter={acknowledgementLetterOf(application)} />
        <p className="text-sm text-emerald-700 font-medium">
          Issued to the QP on submission, {new Date(application.acknowledgementIssuedAt || application.submissionDate).toLocaleDateString('en-ZA')}.
        </p>
      </TabsContent>

      <TabsContent value="evaluation" className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">QASA Preliminary Checklist (44 items)</p>
          <Checklist
            sections={application.qsaChecklist}
            readonly={!asdEditable}
            onChange={(sections) => saveChecklist.mutate({ applicationId: application.id, sections })}
          />
        </div>

        <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Evaluation Report</p>
          {asdEditable && <ValidationSummary issues={reportIssues} title="Complete the report before sending to the Deputy Director:" />}
          <div className="space-y-2">
            <Label>Findings</Label>
            <Textarea
              rows={3}
              value={application.evaluationReport.findings}
              disabled={!asdEditable}
              onChange={(e) =>
                saveReport.mutate({
                  applicationId: application.id,
                  report: { ...application.evaluationReport, findings: e.target.value },
                })
              }
            />
            {asdEditable && <FieldError message={reportIssues.find((i) => i.field === 'findings')?.message} />}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Recommendation</Label>
              <Select
                value={application.evaluationReport.recommendation}
                disabled={!asdEditable}
                onValueChange={(value) =>
                  saveReport.mutate({
                    applicationId: application.id,
                    report: { ...application.evaluationReport, recommendation: value as 'recommended' | 'not-recommended' },
                  })
                }
              >
                <SelectTrigger><SelectValue placeholder="Select a recommendation" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended for approval</SelectItem>
                  <SelectItem value="not-recommended">Not recommended</SelectItem>
                </SelectContent>
              </Select>
              {asdEditable && <FieldError message={reportIssues.find((i) => i.field === 'recommendation')?.message} />}
            </div>
            <div className="space-y-2">
              <Label>Approved EISA sittings per year</Label>
              <Input
                type="number"
                min={0}
                disabled={!asdEditable || sittingsOnDemand}
                value={application.evaluationReport.approvedEisaSittingsPerYear ?? ''}
                onChange={(e) =>
                  saveReport.mutate({
                    applicationId: application.id,
                    report: {
                      ...application.evaluationReport,
                      approvedEisaSittingsPerYear: e.target.value === '' ? null : Number(e.target.value),
                    },
                  })
                }
              />
              {/* QCTO feedback 3.3: trades can sit the EISA on demand. */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`on-demand-${application.id}`}
                  checked={sittingsOnDemand}
                  disabled={!asdEditable}
                  onCheckedChange={(checked) =>
                    saveReport.mutate({
                      applicationId: application.id,
                      report: {
                        ...application.evaluationReport,
                        eisaSittingsOnDemand: checked === true,
                        approvedEisaSittingsPerYear: checked === true ? null : application.evaluationReport.approvedEisaSittingsPerYear,
                      },
                    })
                  }
                />
                <Label htmlFor={`on-demand-${application.id}`} className="font-normal">On demand</Label>
              </div>
              {asdEditable && <FieldError message={reportIssues.find((i) => i.field === 'approvedEisaSittingsPerYear')?.message} />}
            </div>
          </div>
        </div>

        {asdEditable ? <AssessmentDetailsEditor application={application} /> : <AssessmentDetailsCard application={application} />}

        {application.evalState.stageId === 'qp-corrections' && <CorrectionsPanel application={application} />}

        {/* Rows 5/6 (test findings B-10, B-11, B-15): each stage renders exactly ONE action
            bar, shown only while that stage is the current stage — not driven off whatever the
            current stage happens to be, which is what produced the duplicate/triple buttons and
            let the ASD see the Deputy Director's checklist and button ahead of time. */}
        {application.evalState.stageId === 'asd-evaluation' && (
          <div className="space-y-2">
            {(latestDdReturnNote || latestIacRemediationNote || (underReview && application.review)) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-2">
                {underReview && application.review && (
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Deputy Director — reason for review</p>
                    <p className="whitespace-pre-wrap">{application.review.reason}</p>
                  </div>
                )}
                {latestDdReturnNote && (
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Deputy Director — reason for returning</p>
                    <p className="whitespace-pre-wrap">{latestDdReturnNote}</p>
                  </div>
                )}
                {latestIacRemediationNote && (
                  <div>
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">IAC — reason for remediation</p>
                    <p className="whitespace-pre-wrap">{latestIacRemediationNote}</p>
                  </div>
                )}
              </div>
            )}
            {/* Row 7: the outcome is generated from the checklist, not chosen by the ASD. */}
            {autoOutcome && (
              <div
                className={`rounded-xl border p-3 text-sm ${
                  autoOutcome === 'negative' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                }`}
              >
                <p className="font-semibold">Automatic evaluation outcome: {autoOutcome === 'negative' ? 'NEGATIVE' : 'POSITIVE'}</p>
                <p className="text-xs mt-0.5">
                  {autoOutcome === 'negative'
                    ? 'A mandatory checklist line was answered "No" — this report goes back to the QP. The ASD cannot override this; you may only add notes.'
                    : 'No mandatory checklist line was answered "No" — this report goes to the Deputy Director for review. The ASD cannot override this; you may only add notes.'}
                </p>
              </div>
            )}
            {canActInStage(EVAL_WORKFLOW, 'asd-evaluation', role) &&
              (() => {
                const action = EVAL_WORKFLOW.actions.find((a) => a.id === autoOutcomeActionId && a.fromStage === 'asd-evaluation');
                if (!action) return null;
                return (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <ActionButton
                      action={action}
                      disabled={!autoOutcome}
                      onRun={(note) =>
                        evaluationAction.mutate({ applicationId: application.id, actionId: action.id, actorRole: role, actorId, actorName, note })
                      }
                    />
                  </div>
                );
              })()}
          </div>
        )}

        {showDdBox && (
          <div className="space-y-2 rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deputy Director Moderation</p>
            {latestDoReturnNote && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Director Office — reason for returning</p>
                <p className="whitespace-pre-wrap">{latestDoReturnNote}</p>
              </div>
            )}
            <Checklist
              sections={application.ddReviewChecklist}
              readonly={!ddEditable}
              onChange={(sections) => saveDdChecklist.mutate({ applicationId: application.id, sections })}
            />
            {application.evalState.stageId === 'dd-review' && (
              <ActionBar
                definition={EVAL_WORKFLOW}
                stageId={application.evalState.stageId}
                role={role}
                disabledActionIds={!ddChecklistComplete ? ['eval-dd-send-to-director-office'] : []}
                onRun={(actionId, note) =>
                  evaluationAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorId, actorName, note })
                }
              />
            )}
          </div>
        )}

        {/* QCTO feedback 2.1: the Director Office quality-assures and decides which QASAs are tabled at the IAC. */}
        {showDirectorOfficeBox && (
          <div className="space-y-2 rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Director Office Quality Assurance</p>
            {application.evalState.stageId === 'director-office-review' ? (
              <>
                <p className="text-sm text-gray-600">
                  Review the ASD evaluation and the Deputy Director moderation above, then approve this QASA for tabling at the IAC or return it to the Deputy Director with a comment.
                </p>
                <ActionBar
                  definition={EVAL_WORKFLOW}
                  stageId={application.evalState.stageId}
                  role={role}
                  onRun={(actionId, note) =>
                    evaluationAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorId, actorName, note })
                  }
                />
              </>
            ) : (
              tablingEntry && <p className="text-sm text-emerald-700 font-medium">Approved for tabling by {tablingEntry.actorName}.</p>
            )}
          </div>
        )}

        {showIacBox && (
          <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">IAC Outcome</p>
            <div className="space-y-1.5">
              <Label htmlFor={ddRecordsIacOutcome ? `iac-presentation-${application.id}` : undefined}>Summary presentation (optional)</Label>
              <p className="text-sm text-gray-700">
                {application.iacPresentationFileName ? (
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{application.iacPresentationFileName}</span>
                ) : (
                  <span className="text-xs text-gray-400">No presentation uploaded.</span>
                )}
              </p>
              {ddRecordsIacOutcome && (
                <Input
                  id={`iac-presentation-${application.id}`}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) savePresentation.mutate({ applicationId: application.id, fileName: file.name });
                  }}
                />
              )}
            </div>
            {ddRecordsIacOutcome ? (
              <IacOutcomeForm
                idPrefix={`qasa-iac-${application.id}`}
                options={IAC_OUTCOME_OPTIONS}
                minutesFile={application.iacMinutesFile}
                uploaderName={actorName}
                busy={evaluationAction.isPending || saveMinutes.isPending}
                onSaveMinutes={(file) => saveMinutes.mutate({ applicationId: application.id, file })}
                onRecord={(actionId, note) =>
                  evaluationAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorId, actorName, note })
                }
              />
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">Committee minutes</p>
                <IacMinutesFileLine file={application.iacMinutesFile} />
              </div>
            )}
            {application.evalState.stageId === 'iac-review' && !ddRecordsIacOutcome && (
              <p className="text-sm text-gray-500">Approved for tabling. The Deputy Director records the IAC outcome after the meeting.</p>
            )}
            {decided && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-emerald-700">
                  IAC outcome: Approved
                  {iacOutcomeEntry && <span className="font-normal text-gray-500"> — recorded by {iacOutcomeEntry.actorName}</span>}
                </p>
                {iacOutcomeEntry?.note && <p className="text-sm text-gray-700 whitespace-pre-wrap">{iacOutcomeEntry.note}</p>}
              </div>
            )}
          </div>
        )}
      </TabsContent>

      {/* QCTO feedback 05.6/05.7: reached only when the IAC approves; the CEO-signed feedback letter is the approval. */}
      <TabsContent value="outcome" className="space-y-4">
        {!decided ? (
          <p className="text-sm text-gray-400">Not yet available — the feedback letter is only reached once the IAC has approved the QASA.</p>
        ) : (
          <>
            <LetterView letter={feedbackLetterOf(application)} />
            {application.outcomeState.stageId === 'signed' ? (
              <p className="text-sm text-emerald-700 font-medium">
                Signed by {application.outcomeState.submittedBy}. This QASA is approved and available to EISA Instrument Validation and the EISA Calendar.
              </p>
            ) : (
              <ActionBar
                definition={OUTCOME_WORKFLOW}
                stageId={application.outcomeState.stageId}
                role={role}
                onRun={(actionId) => outcomeAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorId, actorName })}
              />
            )}
          </>
        )}
      </TabsContent>

      <TabsContent value="audit" className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit Trail</p>
        <QsaAuditTrail applicationId={application.id} />
      </TabsContent>
    </Tabs>
  );
}

export function ApplicationWorkspace({ applicationId, onClose }: { applicationId: string | null; onClose: () => void }) {
  return (
    <Modal open={!!applicationId} onOpenChange={(open) => !open && onClose()} size="lg" title={<WorkspaceTitle applicationId={applicationId} />}>
      {applicationId && <ApplicationWorkspaceInner key={applicationId} applicationId={applicationId} />}
    </Modal>
  );
}

function WorkspaceTitle({ applicationId }: { applicationId: string | null }) {
  const { data: application } = useQsaAddendumApplication(applicationId);
  return application?.qualificationTitle ?? '';
}

function ApplicationWorkspaceInner({ applicationId }: { applicationId: string }) {
  const { data: application } = useQsaAddendumApplication(applicationId);
  if (!application) return null;
  return <ApplicationWorkspaceContent application={application} />;
}
