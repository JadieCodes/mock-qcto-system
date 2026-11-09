import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ADDENDUM_END_MISSING_TEXT,
  ADDENDUM_START_PENDING_TEXT,
  approvedAddendumOf,
  ASSESSMENT_COMPONENT_TYPE_LABELS,
  CERTIFICATION_NOTIFIED_LABEL,
  componentsOf,
  flcText,
  normaliseComponent,
  qasaValidityText,
  sittingsPerYearText,
  totalMarksOf,
  totalWeighting,
} from '../assessmentDetails';
import { downloadControlSheet } from '../controlSheet';
import type { QsaAddendumApplication } from '../types';
import { isQasaApproved } from '../workflow';

// QCTO feedback 3.3: the QASA's assessment details on the Details tab (both portals), read-only.
// Batch L1.1: laid out like QCTO's control sheet — highest and lowest mark per component, and per
// QASA the addendum pass %, FLC, dates, number of components and total marks. `internal` adds the
// "Download control sheet (CSV)" button on an approved QASA.
export function AssessmentDetailsCard({ application, internal = false }: { application: QsaAddendumApplication; internal?: boolean }) {
  const components = componentsOf(application);
  const handoff = application.certificationHandoff;
  const addendum = approvedAddendumOf(application);
  const showDownload = internal && isQasaApproved(application) && !!handoff && handoff.components.length > 0;

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessment Details</p>
        {showDownload && (
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => downloadControlSheet(application)}>
            <Download className="h-4 w-4" />Download control sheet (CSV)
          </Button>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-400 uppercase">EISA sittings</p>
            <p className="text-sm font-medium">
              {sittingsPerYearText(application.evaluationReport.approvedEisaSittingsPerYear, application.evaluationReport.eisaSittingsOnDemand ?? false)}
            </p>
          </div>
          <div>
            {/* QCTO feedback 05.2: no number of years — valid for the qualification's lifespan. */}
            <p className="text-xs text-gray-400 uppercase">Validity</p>
            <p className="text-sm font-medium">{qasaValidityText(application)}</p>
          </div>
        </div>

        {components.length === 0 ? (
          <p className="text-sm text-gray-400">No assessment components recorded.</p>
        ) : (
          <>
            <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <dt className="text-xs text-gray-400 uppercase">Number of components</dt>
                <dd className="text-sm font-medium">{components.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 uppercase">Total marks</dt>
                <dd className="text-sm font-medium">{totalMarksOf(components)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 uppercase">Addendum pass %</dt>
                <dd className="text-sm font-medium">{application.addendumPassPercent == null ? 'Not recorded' : `${application.addendumPassPercent}%`}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 uppercase">FLC required</dt>
                <dd className="text-sm font-medium">{flcText(application.flcRequired ?? null)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 uppercase">Addendum start date</dt>
                <dd className="text-sm font-medium">{addendum.startDate ?? ADDENDUM_START_PENDING_TEXT}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 uppercase">Addendum end date</dt>
                <dd className="text-sm font-medium">{addendum.endDate ?? ADDENDUM_END_MISSING_TEXT}</dd>
              </div>
            </dl>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {['Component no', 'Component', 'Type', 'Weighting', 'Days', 'Highest mark (component total)', 'Lowest mark (competence mark)'].map((h) => (
                      <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {components.map((c, i) => (
                    <TableRow key={c.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{ASSESSMENT_COMPONENT_TYPE_LABELS[c.type]}</TableCell>
                      <TableCell>{c.weightingPercent}%</TableCell>
                      <TableCell>{c.days}</TableCell>
                      <TableCell>{c.highestMark}</TableCell>
                      <TableCell>{c.lowestMark}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-semibold" colSpan={3}>Total</TableCell>
                    <TableCell className="font-semibold">{totalWeighting(components)}%</TableCell>
                    <TableCell className="font-semibold">{components.reduce((sum, c) => sum + c.days, 0)}</TableCell>
                    <TableCell className="font-semibold">{totalMarksOf(components)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {handoff && (
          <div className="space-y-1.5">
            <p className="text-sm text-emerald-700">
              {CERTIFICATION_NOTIFIED_LABEL} on {new Date(handoff.notifiedAt).toLocaleDateString('en-ZA')} by {handoff.notifiedBy}.
            </p>
            {/* The snapshot Certification received — it can differ from the table above while a
                review (05.2) is running. */}
            {handoff.components.length > 0 && (
              <>
                <p className="text-xs text-gray-600">
                  Addendum pass % {addendum.passPercent === null ? 'not recorded' : `${addendum.passPercent}%`} · FLC required {flcText(addendum.flcRequired)} · Start date{' '}
                  {addendum.startDate ?? '—'} · End date {addendum.endDate ?? '—'} · {handoff.components.length} components, total marks{' '}
                  {totalMarksOf(handoff.components.map(normaliseComponent))}
                </p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {handoff.components.map(normaliseComponent).map((c, i) => (
                    <li key={c.id}>
                      Component {i + 1}: {c.name} ({ASSESSMENT_COMPONENT_TYPE_LABELS[c.type]}): {c.weightingPercent}%, highest mark {c.highestMark}, lowest mark {c.lowestMark}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
