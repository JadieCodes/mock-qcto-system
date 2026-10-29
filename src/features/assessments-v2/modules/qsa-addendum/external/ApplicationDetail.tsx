import { type ComponentType, type ReactNode } from 'react';
import { Award, BookOpen, Calendar, Hash, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateLetter } from '../../../shared/letters/templates';
import { LetterView } from '../../../shared/letters/LetterView';
import { Modal } from '../../../shared/ui/Modal';
import { QsaAuditTrail } from '../components/AuditTrail';
import { CorrectionsPanel } from '../components/CorrectionsPanel';
import { DocumentsList } from '../components/DocumentsList';
import { QsaStatusBadge } from '../components/StatusBadge';
import { FEEDBACK_LETTER_TITLE } from '../config';
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

// Row 14 (test findings): on the QP view, each letter (acknowledgement, outcome, approval)
// gets its own tab, and the audit trail moves out of the Details tab into its own tab too —
// same pattern as the internal workspace.
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
              </TabsContent>

              <TabsContent value="acknowledgement" className="space-y-2">
                {application.ackState.stageId === 'acknowledged' ? (
                  <LetterView
                    letter={generateLetter('acknowledgement', application.id, {
                      qpName: application.qpName,
                      qualificationTitle: application.qualificationTitle,
                      saqaId: application.saqaId,
                      nqfLevel: application.nqfLevel,
                      date: application.submissionDate,
                    })}
                  />
                ) : (
                  <p className="text-sm text-gray-400">Not yet available — the acknowledgement letter is still being reviewed internally.</p>
                )}
              </TabsContent>

              <TabsContent value="outcome" className="space-y-2">
                {application.evalState.stageId === 'approved' || application.evalState.stageId === 'declined' ? (
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
                ) : (
                  <p className="text-sm text-gray-400">Not yet available — the IAC has not reached a decision.</p>
                )}
              </TabsContent>

              <TabsContent value="approval" className="space-y-2">
                {/* Row 13: the QP only ever sees this once the ASD has sent the signed letter —
                    the drafting/signing steps happen internally first. */}
                {application.approvalState?.stageId === 'sent-to-qp' ? (
                  <LetterView
                    letter={generateLetter('approval', application.id, {
                      qpName: application.qpName,
                      qualificationTitle: application.qualificationTitle,
                      saqaId: application.saqaId,
                      nqfLevel: application.nqfLevel,
                      date: new Date().toISOString().split('T')[0],
                      notes: application.approvalLetterDraft?.notes,
                      signatoryName: application.approvalLetterSignedBy ?? undefined,
                      signatoryTitle: 'Deputy Director',
                    })}
                  />
                ) : (
                  <p className="text-sm text-gray-400">Not yet available — the approval letter is still being drafted and signed internally.</p>
                )}
              </TabsContent>

              <TabsContent value="audit" className="space-y-2">
                <QsaAuditTrail applicationId={application.id} />
              </TabsContent>
            </Tabs>
        )}
    </Modal>
  );
}
