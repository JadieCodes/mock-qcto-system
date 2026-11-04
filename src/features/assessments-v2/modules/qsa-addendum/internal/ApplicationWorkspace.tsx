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
import { generateLetter } from '../../../shared/letters/templates';
import { LetterView } from '../../../shared/letters/LetterView';
import { autoEvaluateQsaChecklist } from '../../../mock/integrations/aiValidation';
import { canActInStage, availableActions } from '../../../shared/workflow/engine';
import type { WorkflowAction, WorkflowDefinition } from '../../../shared/workflow/types';
import { Modal } from '../../../shared/ui/Modal';
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
import { APPROVAL_LETTER_SIGNER_ROLE, FEEDBACK_LETTER_TITLE, QSA_AUTO_EVALUATION_MANDATORY_ITEM_IDS } from '../config';
import {
  useAckAction,
  useApprovalLetterAction,
  useEvaluationAction,
  useOutcomeAction,
  useQsaAddendumApplication,
  useSaveApprovalLetterDraft,
  useSaveDdReviewChecklist,
  useSaveEvaluationReport,
  useSaveIacMinutes,
  useSaveIacPresentation,
  useSaveQsaChecklist,
} from '../hooks';
import {
  ACK_WORKFLOW,
  APPROVAL_LETTER_WORKFLOW,
  APPROVE_FOR_TABLING_LABEL,
  EVAL_WORKFLOW,
  IAC_OUTCOME_OPTIONS,
  IAC_REMEDIATION_LABEL,
  OUTCOME_WORKFLOW,
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

  const ackAction = useAckAction();
  const evaluationAction = useEvaluationAction();
  const outcomeAction = useOutcomeAction();
  const approvalAction = useApprovalLetterAction();
  const saveChecklist = useSaveQsaChecklist();
  const saveDdChecklist = useSaveDdReviewChecklist();
  const saveReport = useSaveEvaluationReport();
  const savePresentation = useSaveIacPresentation();
  const saveMinutes = useSaveIacMinutes();
  const saveApprovalDraft = useSaveApprovalLetterDraft();

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
  const decided = application.evalState.stageId === 'approved' || application.evalState.stageId === 'declined';
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

  // Row 10 (test finding B-08): the DD's reason for sending the acknowledgement letter back
  // must be captured and shown to the ASD, not just silently bounced.
  const latestAckSendBackNote =
    application.ackState.stageId === 'asd-preview'
      ? getAuditTrail('qsa-addendum-acknowledgement', application.id)
          .slice()
          .reverse()
          .find((entry) => entry.action === 'Send back to ASD')?.note
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

  const latestApprovalDeclineNote =
    application.approvalState?.stageId === 'asd-draft'
      ? getAuditTrail('qsa-addendum-approval-letter', application.id)
          .slice()
          .reverse()
          .find((entry) => entry.action === 'Decline')?.note
      : undefined;

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="acknowledgement">Acknowledgement</TabsTrigger>
        <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
        <TabsTrigger value="outcome">Feedback Letter</TabsTrigger>
        <TabsTrigger value="approval">Approval Letter</TabsTrigger>
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
        <DocumentsList documents={application.documents} />
      </TabsContent>

      <TabsContent value="acknowledgement" className="space-y-4">
        <LetterView
          letter={generateLetter('acknowledgement', application.id, {
            qpName: application.qpName,
            qualificationTitle: application.qualificationTitle,
            saqaId: application.saqaId,
            nqfLevel: application.nqfLevel,
            date: application.submissionDate,
          })}
        />
        {application.ackState.stageId === 'acknowledged' ? (
          <p className="text-sm text-emerald-700 font-medium">Acknowledged by {application.ackState.submittedBy}.</p>
        ) : (
          <>
            {latestAckSendBackNote && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
                  Deputy Director — reason for sending back
                </p>
                <p className="whitespace-pre-wrap">{latestAckSendBackNote}</p>
              </div>
            )}
            <ActionBar
              definition={ACK_WORKFLOW}
              stageId={application.ackState.stageId}
              role={role}
              onRun={(actionId, note) =>
                ackAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorId, actorName, note })
              }
            />
          </>
        )}
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
            {(latestDdReturnNote || latestIacRemediationNote) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-2">
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
                <p className={`text-sm font-semibold ${application.evalState.stageId === 'approved' ? 'text-emerald-700' : 'text-red-700'}`}>
                  {application.evalState.stageId === 'approved' ? 'IAC outcome: Approved' : 'IAC outcome: Declined'}
                  {iacOutcomeEntry && <span className="font-normal text-gray-500"> — recorded by {iacOutcomeEntry.actorName}</span>}
                </p>
                {iacOutcomeEntry?.note && <p className="text-sm text-gray-700 whitespace-pre-wrap">{iacOutcomeEntry.note}</p>}
              </div>
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="outcome" className="space-y-4">
        {!decided ? (
          <p className="text-sm text-gray-400">Not yet available — the IAC has not reached a decision.</p>
        ) : (
          <>
            <LetterView
              letter={generateLetter('outcome', application.id, {
                qpName: application.qpName,
                qualificationTitle: application.qualificationTitle,
                saqaId: application.saqaId,
                nqfLevel: application.nqfLevel,
                date: new Date().toISOString().split('T')[0],
                notes: application.evalState.stageId === 'approved' ? 'Outcome: Approved.' : 'Outcome: Declined.',
                signatoryName: application.outcomeState.stageId === 'signed' ? application.outcomeState.submittedBy : undefined,
                signatoryTitle: 'CEO',
              }, FEEDBACK_LETTER_TITLE)}
            />
            {application.outcomeState.stageId === 'signed' ? (
              <p className="text-sm text-emerald-700 font-medium">Signed by {application.outcomeState.submittedBy}.</p>
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

      {/* Row 13 (test findings): ASD drafts and edits -> submits to DD -> DD signs or declines
          (with a mandatory note, back to the ASD to edit and resubmit) -> once signed, the ASD
          (not the DD) is the one who sends it on to the QP — no DD -> QP shortcut. */}
      <TabsContent value="approval" className="space-y-4">
        {!application.approvalState || !application.approvalLetterDraft ? (
          <p className="text-sm text-gray-400">Not yet available — the approval letter is only ready once the feedback letter is signed and the decision was "Approved".</p>
        ) : (
          <>
            {latestApprovalDeclineNote && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Deputy Director — reason for declining</p>
                <p className="whitespace-pre-wrap">{latestApprovalDeclineNote}</p>
              </div>
            )}

            {application.approvalState.stageId === 'asd-draft' && role === 'ASD' && (
              <div className="space-y-2">
                <Label>Notes to include in the letter</Label>
                <Textarea
                  rows={3}
                  value={application.approvalLetterDraft.notes}
                  onChange={(e) =>
                    saveApprovalDraft.mutate({ applicationId: application.id, draft: { notes: e.target.value } })
                  }
                />
              </div>
            )}

            <LetterView
              letter={generateLetter('approval', application.id, {
                qpName: application.qpName,
                qualificationTitle: application.qualificationTitle,
                saqaId: application.saqaId,
                nqfLevel: application.nqfLevel,
                date: new Date().toISOString().split('T')[0],
                notes: application.approvalLetterDraft.notes,
                signatoryName: application.approvalLetterSignedBy ?? undefined,
                signatoryTitle: APPROVAL_LETTER_SIGNER_ROLE,
              })}
            />

            {application.approvalState.stageId === 'sent-to-qp' ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Signed by {application.approvalLetterSignedBy}. This QASA is now <strong>Approved</strong> and sent to the
                QP, and available to EISA Instrument Validation and the EISA Calendar.
              </div>
            ) : application.approvalState.stageId === 'signed' ? (
              <>
                <p className="text-sm text-emerald-700 font-medium">Signed by {application.approvalLetterSignedBy}. Ready to send to the QP.</p>
                <ActionBar
                  definition={APPROVAL_LETTER_WORKFLOW}
                  stageId={application.approvalState.stageId}
                  role={role}
                  onRun={(actionId) =>
                    approvalAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorId, actorName })
                  }
                />
              </>
            ) : (
              <ActionBar
                definition={APPROVAL_LETTER_WORKFLOW}
                stageId={application.approvalState.stageId}
                role={role}
                onRun={(actionId, note) =>
                  approvalAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorId, actorName, note })
                }
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
