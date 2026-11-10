import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { EmptyState, SectionCard } from '../../../shared/ui/PageSections';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { APPROVAL_OF_RESULTS_EXTERNAL_TABS } from '../../../shared/visibility/config';
import { filterExternalRecords } from '../../../shared/visibility/recordVisibility';
import type { ResultsTrack } from '../types';
import { FisaResultsView } from './FisaResultsView';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { ResultsBatchStatusBadge } from '../components/StatusBadge';
import { useResultsBatches, useResultsDrafts, useSittingsAwaitingSubmission } from '../hooks';
import { absenteeismText, batchFiguresOf, competenceRateText, throughputRateText } from '../calculation';
import { submissionDeadlineFor } from '../workflow';
import { ResultsBatchDetail } from './ResultsBatchDetail';
import { SubmitResultsBatchDialog } from './SubmitResultsBatchDialog';

// CR-059: the QP submits a results batch within 21 working days of the EISA date (29.32) — matched
// against the acting QP's identity.
function QpResultsView() {
  const { person } = useV2Role();
  const { data: awaiting = [] } = useSittingsAwaitingSubmission();
  const { data: batches = [] } = useResultsBatches();
  const { data: drafts = [] } = useResultsDrafts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitSittingId, setSubmitSittingId] = useState<string | null>(null);

  const myAwaiting = filterExternalRecords(awaiting, person, { qpIdOf: (a) => a.qpId });
  const myBatches = filterExternalRecords(batches, person, { qpIdOf: (b) => b.qpId });

  return (
    <div className="space-y-6">
      <SectionCard title="Awaiting Submission">
        {myAwaiting.length === 0 ? (
          <EmptyState title="Nothing awaiting submission." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification', 'EISA Date', 'Learners', 'Deadline', ''].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAwaiting.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="max-w-[200px] truncate">
                      {a.qualificationTitle}
                      {drafts.some((d) => d.sittingId === a.sittingId) && (
                        <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">Draft saved</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{a.sittingDate}</TableCell>
                    <TableCell>{a.learners.length}</TableCell>
                    <TableCell>
                      <DeadlineBadge deadline={submissionDeadlineFor(a.sittingDate)} />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => setSubmitSittingId(a.sittingId)}>
                        {drafts.some((d) => d.sittingId === a.sittingId) ? 'Continue' : 'Submit Results'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="My Submitted Batches">
        {myBatches.length === 0 ? (
          <EmptyState title="No batches submitted yet." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Qualification', 'EISA Date', 'Competency Rate', 'Absent', 'Throughput Rate', 'Status', 'Submission'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {myBatches.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedId(b.id)}>
                    <TableCell className="max-w-[200px] truncate">{b.qualificationTitle}</TableCell>
                    <TableCell className="whitespace-nowrap">{b.sittingDate}</TableCell>
                    <TableCell className="whitespace-nowrap">{competenceRateText(batchFiguresOf(b))}</TableCell>
                    <TableCell className="whitespace-nowrap">{absenteeismText(batchFiguresOf(b))}</TableCell>
                    <TableCell className="whitespace-nowrap">{throughputRateText(batchFiguresOf(b))}</TableCell>
                    <TableCell>
                      <ResultsBatchStatusBadge batch={b} />
                    </TableCell>
                    <TableCell>
                      <DeadlineBadge deadline={b.submissionDeadline} submittedAt={b.submittedAt} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <SubmitResultsBatchDialog sittingId={submitSittingId} onOpenChange={(open) => !open && setSubmitSittingId(null)} />
      <ResultsBatchDetail batchId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

// Shown to an external role with no Approval of Results tab (none today: the QP has EISA, the
// SDP has FISA).
function NotApplicableView() {
  return (
    <div className="space-y-6">
      <PageHeader title="Approval of Results" />
      <SectionCard>
        <EmptyState
          title="Not applicable for this role"
          description="The QP submits EISA results and the SDP submits FISA results here. QCTO reviews them on the internal portal."
        />
      </SectionCard>
    </div>
  );
}

const HEADER_DESCRIPTION: Record<ResultsTrack, string> = {
  eisa: 'Submit your EISA results batch — a mark per component for every learner — within 21 working days of the EISA date.',
  fisa: 'Submit the results of the FISA assessments you conducted, for an approved skills programme.',
};

// QCTO feedback 3.14: an EISA tab (the QP's screen, as before) and a FISA tab (the SDP's).
// Which tabs a role sees is set in shared/visibility/config.ts.
export function ExternalDashboard() {
  const { role } = useV2Role();
  const tabs = APPROVAL_OF_RESULTS_EXTERNAL_TABS[role] ?? [];
  if (tabs.length === 0) return <NotApplicableView />;

  return (
    <div className="space-y-6">
      <PageHeader title="Approval of Results" description={HEADER_DESCRIPTION[tabs[0]]} />
      <Tabs defaultValue={tabs[0]}>
        <TabsList>
          {tabs.includes('eisa') && <TabsTrigger value="eisa">EISA</TabsTrigger>}
          {tabs.includes('fisa') && <TabsTrigger value="fisa">FISA</TabsTrigger>}
        </TabsList>
        {tabs.includes('eisa') && (
          <TabsContent value="eisa" className="pt-4">
            <QpResultsView />
          </TabsContent>
        )}
        {tabs.includes('fisa') && (
          <TabsContent value="fisa" className="pt-4">
            <FisaResultsView />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
