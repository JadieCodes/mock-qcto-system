import { type ComponentType, type ReactNode } from 'react';
import { Award, BookOpen, Calendar, Hash, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LetterView } from '../../../shared/letters/LetterView';
import { Modal } from '../../../shared/ui/Modal';
import { AssessmentDetailsCard } from '../components/AssessmentDetailsCard';
import { CorrectionsPanel } from '../components/CorrectionsPanel';
import { DocumentsList } from '../components/DocumentsList';
import { QpProgress } from '../components/QpProgress';
import { QsaStatusBadge } from '../components/StatusBadge';
import { useQsaAddendumApplication } from '../hooks';
import { acknowledgementLetterOf, feedbackLetterOf } from '../letters';

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

// Row 14 (test findings): on the QP view, each letter gets its own tab. QCTO feedback 05.6:
// only two letters (acknowledgement and the CEO-signed feedback letter). 05.8: the QP gets a
// Progress tab (stage and status) instead of the audit trail.
export function ApplicationDetail({ applicationId, onClose }: { applicationId: string | null; onClose: () => void }) {
  const { data: application } = useQsaAddendumApplication(applicationId);

  return (
    <Modal
      open={!!applicationId}
      onOpenChange={(open) => !open && onClose()}
      size="md"
      title={application?.qualificationTitle ?? ''}
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
        {application && (
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="acknowledgement">Acknowledgement</TabsTrigger>
                <TabsTrigger value="outcome">Feedback Letter</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
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
                    <DetailRow icon={User} label="Name of QP" value={application.qpName} />
                    <DetailRow icon={BookOpen} label="Qualification Title" value={application.qualificationTitle} />
                    <DetailRow icon={Hash} label="SAQA ID" value={application.saqaId} />
                    <DetailRow icon={Award} label="NQF Level" value={application.nqfLevel} />
                    <DetailRow icon={Hash} label="Credits" value={application.credits} />
                    <DetailRow icon={Calendar} label="Submission Date" value={application.submissionDate} />
                  </div>
                </div>

                <AssessmentDetailsCard application={application} />
                <DocumentsList documents={application.documents} />

                {application.evalState.stageId === 'qp-corrections' && <CorrectionsPanel application={application} />}
              </TabsContent>

              {/* QCTO feedback 05.5: issued at submission, so it is always there. */}
              <TabsContent value="acknowledgement" className="space-y-2">
                <LetterView letter={acknowledgementLetterOf(application)} />
              </TabsContent>

              {/* QCTO feedback 05.6: the QP sees the feedback letter once the CEO has signed it — it is the approval. */}
              <TabsContent value="outcome" className="space-y-2">
                {application.evalState.stageId === 'approved' && application.outcomeState.stageId === 'signed' ? (
                  <LetterView letter={feedbackLetterOf(application)} />
                ) : (
                  <p className="text-sm text-gray-400">Not yet available — the feedback letter is issued once the IAC has approved the QASA and the CEO has signed it.</p>
                )}
              </TabsContent>

              <TabsContent value="progress" className="space-y-2">
                <QpProgress application={application} />
              </TabsContent>
            </Tabs>
        )}
    </Modal>
  );
}
