import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { getAuditTrail } from '../../../shared/audit/auditLog';
import { Checklist } from '../../../shared/checklist/Checklist';
import { isChecklistComplete } from '../../../shared/checklist/types';
import { isLegacyFisaStandardChecklist } from '../../../mock/data/fisaStandardChecklistItems';
import { getSkillsProgrammeDetails, getSkillsProgrammeRegistrationDates } from '../../../mock/data/skillsProgrammeDetails';
import { IacMinutesFileLine, IacOutcomeForm } from '../../../shared/iac/IacOutcomeForm';
import { generateLetter } from '../../../shared/letters/templates';
import { LetterView } from '../../../shared/letters/LetterView';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { FieldError, ValidationSummary } from '../../../shared/validation/ValidationSummary';
import type { ValidationIssue } from '../../../shared/validation/types';
import { canActInStage } from '../../../shared/workflow/engine';
import { ActionBar } from '../components/ActionBar';
import { FisaStandardStatusBadge } from '../components/StatusBadge';
import {
  useFisaStandard,
  useSaveFisaStandardChecklist,
  useSaveFisaStandardEvaluationReport,
  useSaveFisaStandardIacMinutes,
  useStandardAction,
} from '../hooks';
import {
  FISA_STANDARD_WORKFLOW,
  STANDARD_APPROVE_FOR_TABLING_LABEL,
  STANDARD_IAC_OUTCOME_OPTIONS,
  STANDARD_IAC_REMEDIATION_LABEL,
  STANDARD_RETURN_TO_DD_LABEL,
} from '../workflow';
import type { FisaStandardRecord } from '../types';

const SIGN_OUTCOME_LETTER_LABEL = 'Sign outcome letter';
const IAC_OUTCOME_LABELS = FISA_STANDARD_WORKFLOW.actions
  .filter((a) => STANDARD_IAC_OUTCOME_OPTIONS.some((o) => o.actionId === a.id))
  .map((a) => a.label);

function StandardWorkspaceContent({ record }: { record: FisaStandardRecord }) {
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const standardAction = useStandardAction();
  const saveChecklist = useSaveFisaStandardChecklist();
  const saveReport = useSaveFisaStandardEvaluationReport();
  const saveMinutes = useSaveFisaStandardIacMinutes();
  const run = (actionId: string, note?: string) =>
    standardAction.mutate({ standardId: record.id, actionId, actorRole: role, actorId, actorName, note });

  const stageId = record.workflow.stageId;
  const checklistComplete = isChecklistComplete(record.checklist, true);
  const reportIssues: ValidationIssue[] = [];
  if (!record.evaluationReport.findings.trim()) reportIssues.push({ field: 'findings', message: 'Evaluation Findings are required.' });
  if (!record.evaluationReport.recommendationText?.trim()) reportIssues.push({ field: 'recommendation', message: 'The Recommendation is required.' });
  const details = getSkillsProgrammeDetails(record.skillsProgrammeTitle);
  const registrationDates = getSkillsProgrammeRegistrationDates(record.skillsProgrammeTitle);
  const reportHeader: [string, string][] = [
    ['Skills Programme Title', record.skillsProgrammeTitle],
    ['Skills Programme Title ID', details.skillsProgrammeId],
    ['NQF Level', details.nqfLevel],
    ['Credits', details.credits],
    ['Registration Start Date', registrationDates.start],
    ['Registration End Date', registrationDates.end],
  ];
  // A record past the ASD keeps its answers from the previous checklist, read-only.
  const legacyChecklist = isLegacyFisaStandardChecklist(record.checklist);
  const todayIso = new Date().toISOString().slice(0, 10);
  const reportComplete = reportIssues.length === 0;
  const editable = role === 'ASD' && stageId === 'asd-evaluation';

  const trailNewestFirst = [...getAuditTrail('fisa-standard', record.id)].reverse();
  // The only action from this stage belongs to Qualifications Development — shown on Details,
  // next to the source documents they actually supplied, not buried in the Evaluation tab.
  const atQdSubmission = stageId === 'qd-submission';
  const lastSendBack = atQdSubmission
    ? trailNewestFirst.find((e) => e.action === 'Send back for clarification' || e.action === STANDARD_IAC_REMEDIATION_LABEL)
    : undefined;
  const latestDoReturnNote = stageId === 'dd-review' ? trailNewestFirst.find((e) => e.action === STANDARD_RETURN_TO_DD_LABEL)?.note : undefined;
  const tablingEntry = trailNewestFirst.find((e) => e.action === STANDARD_APPROVE_FOR_TABLING_LABEL);
  const iacOutcomeEntry = trailNewestFirst.find((e) => IAC_OUTCOME_LABELS.includes(e.action));
  const signEntry = trailNewestFirst.find((e) => e.action === SIGN_OUTCOME_LETTER_LABEL);

  const showDirectorOfficeBox = stageId === 'director-office-review' || !!tablingEntry;
  const ddRecordsIacOutcome = stageId === 'iac-review' && canActInStage(FISA_STANDARD_WORKFLOW, stageId, role);
  const showIacBox = stageId === 'iac-review' || !!iacOutcomeEntry || !!record.iacMinutesFile;

  // QCTO feedback 2.9: the outcome letter exists once the IAC approved or declined. An ASD or DD
  // "Reject" also ends in Declined, but never reached the IAC, so it has no letter.
  const letterOutcome: 'Approved' | 'Declined' | null =
    stageId === 'ceo-signature' || stageId === 'approved'
      ? 'Approved'
      : stageId === 'ceo-signature-declined' || (stageId === 'declined' && !!signEntry)
        ? 'Declined'
        : null;
  const letterSigned = stageId === 'approved' || stageId === 'declined';
  const signatoryName = letterSigned ? (signEntry?.actorName ?? record.workflow.submittedBy) : undefined;

  return (
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
        <TabsTrigger value="outcome">Outcome Letter</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Status</span>
          <FisaStandardStatusBadge record={record} />
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source Documents</p>
          {record.sourceDocuments.length === 0 ? (
            <p className="text-sm text-gray-400">No source documents.</p>
          ) : (
            <ul className="space-y-1">
              {record.sourceDocuments.map((d, i) => (
                <li key={i} className="text-xs font-mono bg-gray-50 rounded px-2 py-1 inline-block mr-2">
                  {d.fileName} ({Math.round(d.fileSize / 1024)} KB)
                </li>
              ))}
            </ul>
          )}
        </div>

        {record.notes && (
          <div className="rounded-2xl border bg-amber-50 border-amber-200 p-4">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-amber-900">{record.notes}</p>
          </div>
        )}

        {atQdSubmission && (lastSendBack || role === 'Qualifications Development') && (
          <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2">
            {lastSendBack && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
                  {lastSendBack.action === STANDARD_IAC_REMEDIATION_LABEL ? 'The IAC requested remediation' : 'Sent back for clarification'}
                </p>
                <p className="text-sm text-amber-900 whitespace-pre-wrap">{lastSendBack.note}</p>
              </div>
            )}
            {role === 'Qualifications Development' && (
              <>
                <p className="text-sm text-gray-600">
                  {lastSendBack ? 'Make the changes above, then send it to the ASD again.' : 'Send this Skills Programme to the ASD for evaluation.'}
                </p>
                <ActionBar definition={FISA_STANDARD_WORKFLOW} stageId={stageId} role={role} onRun={run} />
              </>
            )}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit Trail</p>
          <AuditTrailView recordTypes={['fisa-standard']} recordId={record.id} />
        </div>
      </TabsContent>

      <TabsContent value="evaluation" className="space-y-6">
        {/* Batch W: QCTO's "Assessment Standards Evaluation Report". The header comes from the record. */}
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessment Standards Evaluation Report</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 p-4 text-sm">
            {reportHeader.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-400 uppercase">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {record.previousChecklist && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Answered on the previous checklist</p>
            <Checklist sections={record.previousChecklist} readonly onChange={() => undefined} />
          </div>
        )}

        <div className="space-y-2">
          {legacyChecklist && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Answered on the previous checklist</p>}
          <Checklist sections={record.checklist} readonly={!editable || legacyChecklist} onChange={(sections) => saveChecklist.mutate({ standardId: record.id, sections })} />
        </div>

        <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Evaluation</p>
          {editable && <ValidationSummary issues={reportIssues} title="Complete the report before sending to the Deputy Director:" />}
          <div className="space-y-2">
            <Label>Evaluation Findings</Label>
            <Textarea
              rows={3}
              value={record.evaluationReport.findings}
              disabled={!editable}
              onChange={(e) => saveReport.mutate({ standardId: record.id, report: { ...record.evaluationReport, findings: e.target.value } })}
            />
            {editable && <FieldError message={reportIssues.find((i) => i.field === 'findings')?.message} />}
          </div>
          <div className="space-y-2">
            <Label>Recommendation</Label>
            <Textarea
              rows={3}
              value={record.evaluationReport.recommendationText ?? ''}
              disabled={!editable}
              onChange={(e) => saveReport.mutate({ standardId: record.id, report: { ...record.evaluationReport, recommendationText: e.target.value } })}
            />
            {editable && <FieldError message={reportIssues.find((i) => i.field === 'recommendation')?.message} />}
          </div>
          <p className="text-sm text-gray-600">
            <span className="text-xs text-gray-400 uppercase mr-2">Evaluator</span>
            {record.evaluationReport.evaluatorName
              ? `${record.evaluationReport.evaluatorName}, ${record.evaluationReport.evaluatedOn ?? ''}`
              : editable
                ? `${actorName}, ${todayIso} (recorded when you send it to the Deputy Director)`
                : '—'}
          </p>
        </div>

        {latestDoReturnNote && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Director Office — reason for returning</p>
            <p className="whitespace-pre-wrap">{latestDoReturnNote}</p>
          </div>
        )}

        {(stageId === 'asd-evaluation' || stageId === 'dd-review') && (
          <ActionBar
            definition={FISA_STANDARD_WORKFLOW}
            stageId={stageId}
            role={role}
            disabledActionIds={stageId === 'asd-evaluation' && !(checklistComplete && reportComplete) ? ['standard-asd-send-to-dd'] : []}
            onRun={run}
          />
        )}

        {/* QCTO feedback 2.9: same Director Office and IAC outcome steps as the QASA. */}
        {showDirectorOfficeBox && (
          <div className="space-y-2 rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Director Office Quality Assurance</p>
            {stageId === 'director-office-review' ? (
              <>
                <p className="text-sm text-gray-600">
                  Review the ASD evaluation and the Deputy Director moderation, then approve this FISA Standard for tabling at the IAC or return it to the Deputy Director with a comment.
                </p>
                <ActionBar definition={FISA_STANDARD_WORKFLOW} stageId={stageId} role={role} onRun={run} />
              </>
            ) : (
              tablingEntry && <p className="text-sm text-emerald-700 font-medium">Approved for tabling by {tablingEntry.actorName}.</p>
            )}
          </div>
        )}

        {showIacBox && (
          <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">IAC Outcome</p>
            {ddRecordsIacOutcome ? (
              <IacOutcomeForm
                idPrefix={`fisa-iac-${record.id}`}
                options={STANDARD_IAC_OUTCOME_OPTIONS}
                minutesFile={record.iacMinutesFile}
                uploaderName={actorName}
                busy={standardAction.isPending || saveMinutes.isPending}
                onSaveMinutes={(file) => saveMinutes.mutate({ standardId: record.id, file })}
                onRecord={run}
              />
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">Committee minutes</p>
                <IacMinutesFileLine file={record.iacMinutesFile} />
              </div>
            )}
            {stageId === 'iac-review' && !ddRecordsIacOutcome && (
              <p className="text-sm text-gray-500">Approved for tabling. The Deputy Director records the IAC outcome after the meeting.</p>
            )}
            {iacOutcomeEntry && stageId !== 'iac-review' && (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-800">
                  {iacOutcomeEntry.action.replace('Record IAC outcome: ', 'IAC outcome: ')}
                  <span className="font-normal text-gray-500"> — recorded by {iacOutcomeEntry.actorName}</span>
                </p>
                {iacOutcomeEntry.note && <p className="text-sm text-gray-700 whitespace-pre-wrap">{iacOutcomeEntry.note}</p>}
              </div>
            )}
          </div>
        )}

        {stageId === 'approved' && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Approved. The CEO has signed the outcome letter, and this Skills Programme is now available for instrument development.
          </div>
        )}
        {stageId === 'declined' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Declined.</div>
        )}
      </TabsContent>

      <TabsContent value="outcome" className="space-y-4">
        {!letterOutcome ? (
          <p className="text-sm text-gray-400">Not yet available — the IAC has not reached a decision.</p>
        ) : (
          <>
            <LetterView
              letter={generateLetter(
                'outcome',
                record.id,
                {
                  qpName: record.createdBy,
                  qualificationTitle: record.skillsProgrammeTitle,
                  date: new Date().toISOString().split('T')[0],
                  notes: `Outcome: ${letterOutcome}.`,
                  signatoryName,
                  signatoryTitle: 'CEO',
                },
                undefined,
                'fisa-standard',
              )}
            />
            {letterSigned ? (
              <p className="text-sm text-emerald-700 font-medium">Signed by {signatoryName}.</p>
            ) : (
              <ActionBar definition={FISA_STANDARD_WORKFLOW} stageId={stageId} role={role} onRun={run} />
            )}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}

export function StandardWorkspace({ recordId, onClose }: { recordId: string | null; onClose: () => void }) {
  return (
    <Dialog open={!!recordId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        {recordId && <StandardWorkspaceInner key={recordId} recordId={recordId} />}
      </DialogContent>
    </Dialog>
  );
}

function StandardWorkspaceInner({ recordId }: { recordId: string }) {
  const { data: record } = useFisaStandard(recordId);
  if (!record) return null;
  return (
    <>
      <DialogHeader>
        <DialogTitle>{record.skillsProgrammeTitle}</DialogTitle>
      </DialogHeader>
      <StandardWorkspaceContent record={record} />
    </>
  );
}
