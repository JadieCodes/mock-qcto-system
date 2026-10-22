import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { SiteVisitStatusBadge } from '../components/StatusBadge';
import { useReportAction, useSiteVisit } from '../hooks';
import { VISIT_TYPE_LABELS } from '../visitTypeLabels';

// CR-047: QP (view only) — their own visits. CR-058: once a Post-EISA Monitoring outcome is
// shared, the QP's only action here is to acknowledge it.
export function VisitDetail({ visitId, onClose }: { visitId: string | null; onClose: () => void }) {
  const { data: visit } = useSiteVisit(visitId);
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const reportAction = useReportAction();

  return (
    <Dialog open={!!visitId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {visit && (
          <>
            <DialogHeader>
              <DialogTitle>
                {VISIT_TYPE_LABELS[visit.visitType]} — {visit.qualificationTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <SiteVisitStatusBadge visit={visit} />
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
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
