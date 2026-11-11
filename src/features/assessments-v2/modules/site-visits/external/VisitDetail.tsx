import { Button } from '@/components/ui/button';
import { toIsoDate } from '../../../shared/dates/workingDays';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { MoveHistory, ResponseLine } from '../components/StakeholderResponseCard';
import { RemediationHistory, RemediationResponseForm } from '../components/RemediationSection';
import { RespondToNotice } from '../components/RespondToNotice';
import { SiteVisitStatusBadge } from '../components/StatusBadge';
import { evidenceOf } from '../evidence';
import { useReportAction, useSiteVisit } from '../hooks';
import { remediationRoundsOf, REMEDIATION_AWAITING_STAGE, remediationResponderOf } from '../remediation';
import { reminderCountOf, responseStatusOf, visitStakeholderOf } from '../stakeholderResponse';
import { isSharedWithStakeholder } from '../stakeholderShare';
import type { SiteVisit } from '../types';
import { qualificationLine, visitQualificationsOf } from '../visitQualifications';
import { VISIT_TYPE_LABELS, visitSubject } from '../visitTypeLabels';
import { checklistCompletionSummary } from '../workflow';

// Row 37/G-26 (Fix 4 Part 2 correction): once the outcome is shared, the stakeholder sees a read-only
// summary of the actual report — checklist completion, who completed it and when, and any
// free-text notes — not just a "shared" message with nothing behind it.
function ReportSummary({ visit }: { visit: SiteVisit }) {
  const summary = checklistCompletionSummary(visit);
  const notes = Object.values(visit.freeTextNotes).filter((n) => n.trim().length > 0);
  return (
    <div className="rounded-2xl border bg-gray-50 p-4 space-y-1.5 text-sm text-gray-700">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Report Summary</p>
      <p>
        Checklist: {summary.answered} of {summary.total} lines completed.
      </p>
      {visit.completedBy && (
        <p>
          Completed by {visit.completedBy}
          {visit.completedDate && ` on ${visit.completedDate}`}.
        </p>
      )}
      {notes.length > 0 && <p className="whitespace-pre-wrap">{notes.join(' — ')}</p>}
    </div>
  );
}

// The report QCTO shared (Batch V1/V2): the outcome summary, the visit report file(s) and any
// remediation, which the QP or SDP answers here.
function SharedReport({ visit }: { visit: SiteVisit }) {
  const reportFiles = evidenceOf(visit).filter((f) => f.category === 'report');
  const rounds = remediationRoundsOf(visit);
  const { role } = useV2Role();
  const canRespond = visit.reportWorkflow.stageId === REMEDIATION_AWAITING_STAGE && remediationResponderOf(visit) === role;
  return (
    <div className="space-y-3">
      <ReportSummary visit={visit} />
      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-2 text-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase">Shared outcome</p>
        <p className="whitespace-pre-wrap text-gray-800">{visit.stakeholderShare?.outcomeSummary}</p>
        {reportFiles.length > 0 && (
          <ul className="space-y-0.5">
            {reportFiles.map((f) => (
              <li key={`${f.fileName}-${f.uploadedAt}`} className="font-mono text-xs">
                {f.fileName}
              </li>
            ))}
          </ul>
        )}
      </div>
      <RemediationHistory rounds={rounds} />
      {canRespond && <RemediationResponseForm visit={visit} />}
    </div>
  );
}

// CR-047: a QP or SDP sees their own visits. Batch V2 (QCTO 29.36): they accept the date or say they
// are not available, with a reason that stays on the visit and its audit trail.
export function VisitDetail({ visitId, onClose }: { visitId: string | null; onClose: () => void }) {
  const { data: visit } = useSiteVisit(visitId);
  const { role, person } = useV2Role();
  const reportAction = useReportAction();
  const today = toIsoDate(new Date());
  const stakeholder = visit ? visitStakeholderOf(visit) : null;
  const iAmTheStakeholder = !!stakeholder && stakeholder.id === person.id;
  const status = visit ? responseStatusOf(visit, today) : 'none';
  const moved = (visit?.dateMoves ?? []).length > 0;
  const notBooked = !!visit && visit.planningWorkflow.stageId !== 'booked';

  return (
    <Modal
      open={!!visitId}
      onOpenChange={(open) => !open && onClose()}
      size="md"
      title={visit ? `${VISIT_TYPE_LABELS[visit.visitType]} — ${visitSubject(visit)}` : ''}
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      {visit && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Status</span>
            {notBooked ? <span className="text-sm font-medium text-amber-700">New date being approved by QCTO</span> : <SiteVisitStatusBadge visit={visit} forQp />}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase">Visit Date</p>
              <p className="font-medium">{visit.visitDate || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Venue</p>
              <p className="font-medium">{visit.venue || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Notice</p>
              <p className="font-medium capitalize">
                {visit.notificationFlag}
                {visit.notificationFlag === 'notified' && visit.noticeLeadTimeDays != null && ` — ${visit.noticeLeadTimeDays} days`}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Qualification(s)</p>
              <ul className="space-y-0.5">
                {visitQualificationsOf(visit).map((q) => (
                  <li key={q.id} className="font-medium">
                    {qualificationLine(q, !!q.eisaDate)}
                  </li>
                ))}
                {visitQualificationsOf(visit).length === 0 && <li className="font-medium">—</li>}
              </ul>
            </div>
          </div>

          {notBooked && moved && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              QCTO moved this visit and the new date ({visit.visitDate || 'to be set'}) is going through approval. You will be asked to respond once it is booked.
            </div>
          )}

          {iAmTheStakeholder && status === 'awaiting' && <RespondToNotice visit={visit} />}
          {visit.stakeholderResponse && (
            <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase">Your response</p>
              <ResponseLine response={visit.stakeholderResponse} />
              {visit.stakeholderResponse.answer === 'not-available' && <p className="text-xs text-gray-500">QCTO has been told. If the visit is moved, the new date goes through approval and you are asked to respond again.</p>}
            </div>
          )}
          {status === 'lapsed' && <p className="text-sm text-amber-700">The visit date passed without a response.</p>}
          {status === 'awaiting' && reminderCountOf(visit) > 0 && <p className="text-xs text-gray-500">Reminders sent: {reminderCountOf(visit)}.</p>}

          <MoveHistory moves={visit.dateMoves ?? []} />

          {isSharedWithStakeholder(visit) && <SharedReport visit={visit} />}

          {role === 'QP' && !isSharedWithStakeholder(visit) && (visit.reportWorkflow.stageId === 'outcome-shared' || visit.reportWorkflow.stageId === 'closed') && <ReportSummary visit={visit} />}

          {role === 'QP' && visit.reportWorkflow.stageId === 'outcome-shared' && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-2">
              <p className="text-sm text-blue-800">The visit outcome has been shared with you.</p>
              <Button
                size="sm"
                disabled={reportAction.isPending}
                onClick={() => reportAction.mutate({ visitId: visit.id, actionId: 'qp-acknowledge-outcome', actorRole: role, actorId: person.id, actorName: person.name })}
              >
                Acknowledge Outcome
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
