import { Button } from '@/components/ui/button';
import { Modal } from '../../../shared/ui/Modal';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { SiteVisitStatusBadge } from '../components/StatusBadge';
import { useReportAction, useSiteVisit } from '../hooks';
import type { SiteVisit } from '../types';
import { VISIT_TYPE_LABELS } from '../visitTypeLabels';
import { checklistCompletionSummary } from '../workflow';

// Row 37/G-26 (Fix 4 Part 2 correction): once the outcome is shared, the QP sees a read-only
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

// CR-047: QP (view only) — their own visits. CR-058: once the outcome is shared (any visit
// type, Fix 4 Part 2 correction), the QP sees a read-only report summary and can acknowledge it.
export function VisitDetail({ visitId, onClose }: { visitId: string | null; onClose: () => void }) {
  const { data: visit } = useSiteVisit(visitId);
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const reportAction = useReportAction();

  return (
    <Modal
      open={!!visitId}
      onOpenChange={(open) => !open && onClose()}
      size="md"
      title={visit ? `${VISIT_TYPE_LABELS[visit.visitType]} — ${visit.qualificationTitle}` : ''}
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      {visit && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Status</span>
            <SiteVisitStatusBadge visit={visit} forQp />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase">Visit Date</p>
              <p className="font-medium">{visit.visitDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Venue</p>
              <p className="font-medium">{visit.venue || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase">Notification</p>
              <p className="font-medium capitalize">{visit.notificationFlag}</p>
            </div>
          </div>

          {(visit.reportWorkflow.stageId === 'outcome-shared' || visit.reportWorkflow.stageId === 'closed') && (
            <ReportSummary visit={visit} />
          )}

          {visit.reportWorkflow.stageId === 'outcome-shared' && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-2">
              <p className="text-sm text-blue-800">The visit outcome has been shared with you.</p>
              <Button
                size="sm"
                disabled={reportAction.isPending}
                onClick={() => reportAction.mutate({ visitId: visit.id, actionId: 'qp-acknowledge-outcome', actorRole: role, actorId, actorName })}
              >
                Acknowledge Outcome
              </Button>
            </div>
          )}

          {visit.reportWorkflow.stageId === 'closed' && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Acknowledged — closed.</div>
          )}
        </div>
      )}
    </Modal>
  );
}
