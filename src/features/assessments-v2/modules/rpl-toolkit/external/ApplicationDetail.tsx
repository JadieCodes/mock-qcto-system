import { type ComponentType, type ReactNode } from 'react';
import { Award, BookOpen, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { RplToolkitStatusBadge } from '../components/StatusBadge';
import { useRplEvaluationAction, useRplToolkitApplication } from '../hooks';

function DetailRow({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <div className="text-sm font-medium text-gray-900 mt-0.5">{value || '—'}</div>
      </div>
    </div>
  );
}

export function ApplicationDetail({ applicationId, onClose }: { applicationId: string | null; onClose: () => void }) {
  const { data: application } = useRplToolkitApplication(applicationId);
  const { role, person } = useV2Role();
  const actorId = person.id;
  const actorName = person.name;
  const evaluationAction = useRplEvaluationAction();

  return (
    <Dialog open={!!applicationId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {application && (
          <>
            <DialogHeader>
              <DialogTitle>{application.toolkitTitle}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <RplToolkitStatusBadge application={application} />
              </div>

              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">QP & Toolkit</p>
                </div>
                <div className="px-4 divide-y divide-gray-50">
                  <DetailRow icon={BookOpen} label="Name of QP" value={application.qpName} />
                  <DetailRow icon={FileText} label="Toolkit Title" value={application.toolkitTitle} />
                  <DetailRow icon={Award} label="Submission Type" value={application.toolkitType === 'new' ? 'New toolkit' : 'Updated toolkit'} />
                  <DetailRow icon={Calendar} label="Submission Date" value={application.submissionDate} />
                </div>
              </div>

              {application.description && (
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{application.description}</p>
                </div>
              )}

              {application.evalState.stageId === 'qp-corrections' && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
                  <p className="text-sm font-semibold text-amber-800">Corrections requested by the ASD</p>
                  <Button
                    size="sm"
                    onClick={() =>
                      evaluationAction.mutate({ applicationId: application.id, actionId: 'rpl-qp-resubmit', actorRole: role, actorId, actorName })
                    }
                  >
                    Resubmit to ASD
                  </Button>
                </div>
              )}

              {(application.evalState.stageId === 'approved' || application.evalState.stageId === 'declined') && (
                <div className={`rounded-2xl border p-4 text-sm ${application.evalState.stageId === 'approved' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                  <p className="font-semibold">{application.evalState.stageId === 'approved' ? 'Approved' : 'Declined'}</p>
                  {application.outcomeState.stageId === 'signed' ? (
                    <p className="mt-1">Outcome letter signed by {application.outcomeState.submittedBy}.</p>
                  ) : (
                    <p className="mt-1">Outcome letter pending CEO signature.</p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
