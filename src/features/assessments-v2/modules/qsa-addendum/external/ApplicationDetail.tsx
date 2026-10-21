import { type ComponentType, type ReactNode } from 'react';
import { Award, BookOpen, Calendar, Hash, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateLetter } from '../../../shared/letters/templates';
import { LetterView } from '../../../shared/letters/LetterView';
import { CorrectionsPanel } from '../components/CorrectionsPanel';
import { DocumentsList } from '../components/DocumentsList';
import { QsaStatusBadge } from '../components/StatusBadge';
import { useQsaAddendumApplication } from '../hooks';

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
  const { data: application } = useQsaAddendumApplication(applicationId);

  return (
    <Dialog open={!!applicationId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {application && (
          <>
            <DialogHeader>
              <DialogTitle>{application.qualificationTitle}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <QsaStatusBadge application={application} />
              </div>

              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">QP & Qualification</p>
                </div>
                <div className="px-4 divide-y divide-gray-50">
                  <DetailRow icon={User} label="Name of QP" value={application.qpName} />
                  <DetailRow icon={BookOpen} label="Qualification Title" value={application.qualificationTitle} />
                  <DetailRow icon={Hash} label="SAQA ID" value={application.saqaId} />
                  <DetailRow icon={Award} label="NQF Level" value={application.nqfLevel} />
                  <DetailRow icon={Hash} label="Credits" value={application.credits} />
                  <DetailRow icon={Calendar} label="Submission Date" value={application.submissionDate} />
                </div>
              </div>

              <DocumentsList documents={application.documents} />

              {application.evalState.stageId === 'qp-corrections' && <CorrectionsPanel application={application} />}

              {application.ackState.stageId === 'acknowledged' && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Acknowledgement Letter</p>
                  <LetterView
                    letter={generateLetter('acknowledgement', application.id, {
                      qpName: application.qpName,
                      qualificationTitle: application.qualificationTitle,
                      saqaId: application.saqaId,
                      nqfLevel: application.nqfLevel,
                      date: application.submissionDate,
                    })}
                  />
                </div>
              )}

              {(application.evalState.stageId === 'approved' || application.evalState.stageId === 'declined') && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outcome Letter</p>
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
                </div>
              )}

              {application.approvalState?.stageId === 'signed' && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Approval Letter</p>
                  <LetterView
                    letter={generateLetter('approval', application.id, {
                      qpName: application.qpName,
                      qualificationTitle: application.qualificationTitle,
                      saqaId: application.saqaId,
                      nqfLevel: application.nqfLevel,
                      date: new Date().toISOString().split('T')[0],
                      signatoryName: application.approvalState.submittedBy,
                      signatoryTitle: 'Deputy Director',
                    })}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
