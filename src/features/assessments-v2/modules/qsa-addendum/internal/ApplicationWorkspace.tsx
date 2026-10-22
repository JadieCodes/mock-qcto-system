import { useState } from 'react';
import { Award, BookOpen, Calendar, Hash, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { canActInStage, availableActions } from '../../../shared/workflow/engine';
import type { WorkflowAction, WorkflowDefinition } from '../../../shared/workflow/types';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { CorrectionsPanel } from '../components/CorrectionsPanel';
import { DocumentsList } from '../components/DocumentsList';
import { QsaStatusBadge } from '../components/StatusBadge';
import { APPROVAL_LETTER_SIGNER_ROLE } from '../config';
import {
  useAckAction,
  useApprovalLetterAction,
  useEvaluationAction,
  useOutcomeAction,
  useQsaAddendumApplication,
  useSaveDdReviewChecklist,
  useSaveEvaluationReport,
  useSaveIacPresentation,
  useSaveQsaChecklist,
} from '../hooks';
import { ACK_WORKFLOW, APPROVAL_LETTER_WORKFLOW, EVAL_WORKFLOW, OUTCOME_WORKFLOW } from '../workflow';
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

function AuditTrail({ applicationId }: { applicationId: string }) {
  const entries = [
    ...getAuditTrail('qsa-addendum-acknowledgement', applicationId),
    ...getAuditTrail('qsa-addendum-evaluation', applicationId),
    ...getAuditTrail('qsa-addendum-outcome-letter', applicationId),
    ...getAuditTrail('qsa-addendum-approval-letter', applicationId),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  if (entries.length === 0) return <p className="text-xs text-gray-400">No actions recorded yet.</p>;

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-xl border bg-gray-50 px-3 py-2 text-xs">
          <p className="font-medium text-gray-700">
            {entry.action} — <span className="text-gray-500">{entry.actorName} ({entry.actorRole})</span>
          </p>
          {entry.note && <p className="text-gray-500 mt-0.5 whitespace-pre-wrap">{entry.note}</p>}
          <p className="text-gray-400 mt-0.5">{new Date(entry.timestamp).toLocaleString('en-ZA')}</p>
        </div>
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

  const checklistComplete = isChecklistComplete(application.qsaChecklist, true);
  const reportComplete =
    application.evaluationReport.findings.trim().length > 0 &&
    application.evaluationReport.recommendation !== '' &&
    application.evaluationReport.approvedEisaSittingsPerYear != null;
  const ddChecklistComplete = isChecklistComplete(application.ddReviewChecklist, true);
  const decided = application.evalState.stageId === 'approved' || application.evalState.stageId === 'declined';

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="acknowledgement">Acknowledgement</TabsTrigger>
        <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
        <TabsTrigger value="outcome">Outcome Letter</TabsTrigger>
        <TabsTrigger value="approval">Approval Letter</TabsTrigger>
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
        <DocumentsList documents={application.documents} />
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit Trail</p>
          <AuditTrail applicationId={application.id} />
        </div>
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
          <ActionBar
            definition={ACK_WORKFLOW}
            stageId={application.ackState.stageId}
            role={role}
            onRun={(actionId, note) =>
              ackAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorId, actorName, note })
            }
          />
        )}
      </TabsContent>

      <TabsContent value="evaluation" className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">QSA Addendum Preliminary Checklist (44 items)</p>
          <Checklist
            sections={application.qsaChecklist}
            readonly={!(role === 'ASD' && application.evalState.stageId === 'asd-evaluation')}
            onChange={(sections) => saveChecklist.mutate({ applicationId: application.id, sections })}
          />
        </div>

        <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Evaluation Report</p>
          {(() => {
            const editable = role === 'ASD' && application.evalState.stageId === 'asd-evaluation';
            return (
              <>
                <div className="space-y-2">
                  <Label>Findings</Label>
                  <Textarea
                    rows={3}
                    value={application.evaluationReport.findings}
                    disabled={!editable}
                    onChange={(e) =>
                      saveReport.mutate({
                        applicationId: application.id,
                        report: { ...application.evaluationReport, findings: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Recommendation</Label>
                    <Select
                      value={application.evaluationReport.recommendation}
                      disabled={!editable}
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
                  </div>
                  <div className="space-y-2">
                    <Label>Approved EISA sittings per year</Label>
                    <Input
                      type="number"
                      min={0}
                      disabled={!editable}
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
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {application.evalState.stageId === 'qp-corrections' && <CorrectionsPanel application={application} />}

        <ActionBar
          definition={EVAL_WORKFLOW}
          stageId={application.evalState.stageId}
          role={role}
          disabledActionIds={!(checklistComplete && reportComplete) ? ['eval-send-to-dd'] : []}
          onRun={(actionId, note) =>
            evaluationAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorId, actorName, note })
          }
        />

        <div className="space-y-2 rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deputy Director Review</p>
          <Checklist
            sections={application.ddReviewChecklist}
            readonly={!(role === 'Deputy Director' && application.evalState.stageId === 'dd-review')}
            onChange={(sections) => saveDdChecklist.mutate({ applicationId: application.id, sections })}
          />
          <ActionBar
            definition={EVAL_WORKFLOW}
            stageId={application.evalState.stageId}
            role={role}
            disabledActionIds={!ddChecklistComplete ? ['eval-dd-send-to-iac'] : []}
            onRun={(actionId, note) =>
              evaluationAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorId, actorName, note })
            }
          />
        </div>

        <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">IAC Summary Presentation</p>
          {role === 'IAC' && application.evalState.stageId === 'iac-review' ? (
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) savePresentation.mutate({ applicationId: application.id, fileName: file.name });
              }}
            />
          ) : null}
          <p className="text-sm text-gray-700">
            {application.iacPresentationFileName ? (
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{application.iacPresentationFileName}</span>
            ) : (
              <span className="text-gray-400">No presentation uploaded yet.</span>
            )}
          </p>
          {application.evalState.stageId === 'iac-review' && (
            <ActionBar
              definition={EVAL_WORKFLOW}
              stageId={application.evalState.stageId}
              role={role}
              disabledActionIds={!application.iacPresentationFileName ? ['eval-iac-approve', 'eval-iac-decline', 'eval-iac-remediation'] : []}
              onRun={(actionId, note) =>
                evaluationAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorId, actorName, note })
              }
            />
          )}
          {decided && (
            <p className={`text-sm font-semibold ${application.evalState.stageId === 'approved' ? 'text-emerald-700' : 'text-red-700'}`}>
              {application.evalState.stageId === 'approved' ? 'Approved by IAC.' : 'Declined by IAC.'}
            </p>
          )}
        </div>
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
              })}
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

      <TabsContent value="approval" className="space-y-4">
        {!application.approvalState ? (
          <p className="text-sm text-gray-400">Not yet available — the approval letter is only ready once the outcome letter is signed and the decision was "Approved".</p>
        ) : (
          <>
            <LetterView
              letter={generateLetter('approval', application.id, {
                qpName: application.qpName,
                qualificationTitle: application.qualificationTitle,
                saqaId: application.saqaId,
                nqfLevel: application.nqfLevel,
                date: new Date().toISOString().split('T')[0],
                signatoryName: application.approvalState.stageId === 'signed' ? application.approvalState.submittedBy : undefined,
                signatoryTitle: APPROVAL_LETTER_SIGNER_ROLE,
              })}
            />
            {application.approvalState.stageId === 'signed' ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Signed by {application.approvalState.submittedBy}. This QSA Addendum is now <strong>Approved</strong> and available to
                EISA Instrument Validation and the EISA Calendar.
              </div>
            ) : (
              <ActionBar
                definition={APPROVAL_LETTER_WORKFLOW}
                stageId={application.approvalState.stageId}
                role={role}
                onRun={(actionId) => approvalAction.mutate({ applicationId: application.id, actionId, actorRole: role, actorId, actorName })}
              />
            )}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function ApplicationWorkspace({ applicationId, onClose }: { applicationId: string | null; onClose: () => void }) {
  return (
    <Dialog open={!!applicationId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        {applicationId && <ApplicationWorkspaceInner key={applicationId} applicationId={applicationId} />}
      </DialogContent>
    </Dialog>
  );
}

function ApplicationWorkspaceInner({ applicationId }: { applicationId: string }) {
  const { data: application } = useQsaAddendumApplication(applicationId);
  if (!application) return null;
  return (
    <>
      <DialogHeader>
        <DialogTitle>{application.qualificationTitle}</DialogTitle>
      </DialogHeader>
      <ApplicationWorkspaceContent application={application} />
    </>
  );
}
