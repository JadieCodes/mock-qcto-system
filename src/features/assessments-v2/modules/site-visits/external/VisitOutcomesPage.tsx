import { Fragment } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { EmptyState, SectionCard } from '../../../shared/ui/PageSections';
import { useV2Role } from '../../../shared/ui/useV2Role';
import { RemediationHistory, RemediationResponseForm } from '../components/RemediationSection';
import { useSharedVisitOutcomes, useSiteVisit } from '../hooks';
import { qualificationLine } from '../visitQualifications';
import { VISIT_TYPE_LABELS } from '../visitTypeLabels';
import type { SharedVisitOutcome } from '../api';

// The response form needs the full visit record (the api checks it is this QP's), so it reads it by id.
function RemediationPanel({ outcome }: { outcome: SharedVisitOutcome }) {
  const { data: visit } = useSiteVisit(outcome.id);
  return (
    <div className="space-y-3">
      <RemediationHistory rounds={outcome.remediationRounds} />
      {outcome.canRespond && visit && <RemediationResponseForm visit={visit} />}
    </div>
  );
}

// Shared visit outcomes: only the visits QCTO shared with this QP. It is not the old external Site
// Visits section — there is no scheduling and no acknowledgement here. Batch V1 (05.14): a visit
// approved with remediation appears here without the share choice, with its items, and the QP
// answers them (evidence, a response, "Submit remediation").
export function VisitOutcomesPage() {
  const { person } = useV2Role();
  const { data: outcomes = [] } = useSharedVisitOutcomes(person.qpId);

  return (
    <div className="space-y-6">
      <PageHeader title="Visit Outcomes" description="The outcomes of QCTO visits that have been shared with you." />

      <SectionCard title="Shared outcomes">
        {outcomes.length === 0 ? (
          <EmptyState title="No visit outcomes have been shared with you yet" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Visit type', 'Qualifications', 'Visit date', 'Status', 'Outcome summary', 'Report'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {outcomes.map((o) => (
                  <Fragment key={o.id}>
                    <TableRow>
                      <TableCell className="whitespace-nowrap font-medium">{VISIT_TYPE_LABELS[o.visitType]}</TableCell>
                      <TableCell className="min-w-[200px]">
                        {o.qualifications.length === 0 ? (
                          '—'
                        ) : (
                          <ul className="space-y-0.5">
                            {o.qualifications.map((q) => (
                              <li key={q.id} className="text-sm">
                                {qualificationLine(q, !!q.eisaDate)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{o.visitDate || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-nowrap font-medium">
                          {o.statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-pre-wrap min-w-[240px]">{o.outcomeSummary}</TableCell>
                      <TableCell>
                        {o.reportFileNames.length === 0 ? (
                          '—'
                        ) : (
                          <ul className="space-y-0.5">
                            {o.reportFileNames.map((name) => (
                              <li key={name} className="font-mono text-xs">
                                {name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </TableCell>
                    </TableRow>
                    {o.remediationRounds.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-gray-50">
                          <RemediationPanel outcome={o} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
