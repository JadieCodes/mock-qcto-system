import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ASSESSMENT_COMPONENT_TYPE_LABELS, CERTIFICATION_NOTIFIED_LABEL, componentsOf, qasaValidityText, sittingsPerYearText, totalWeighting } from '../assessmentDetails';
import type { QsaAddendumApplication } from '../types';

// QCTO feedback 3.3: the QASA's assessment details on the Details tab (both portals), read-only.
// QCTO feedback 05.3: with the total marks and pass mark of each component.
export function AssessmentDetailsCard({ application }: { application: QsaAddendumApplication }) {
  const components = componentsOf(application);
  const handoff = application.certificationHandoff;

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessment Details</p>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Component', 'Type', 'Weighting', 'Days', 'Total marks', 'Pass mark'].map((h) => (
                    <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{ASSESSMENT_COMPONENT_TYPE_LABELS[c.type]}</TableCell>
                    <TableCell>{c.weightingPercent}%</TableCell>
                    <TableCell>{c.days}</TableCell>
                    <TableCell>{c.totalMarks}</TableCell>
                    <TableCell>{c.passMark}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-semibold" colSpan={2}>Total</TableCell>
                  <TableCell className="font-semibold">{totalWeighting(components)}%</TableCell>
                  <TableCell className="font-semibold">{components.reduce((sum, c) => sum + c.days, 0)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {handoff && (
          <div className="space-y-1.5">
            <p className="text-sm text-emerald-700">
              {CERTIFICATION_NOTIFIED_LABEL} on {new Date(handoff.notifiedAt).toLocaleDateString('en-ZA')} by {handoff.notifiedBy}.
            </p>
            {/* The snapshot Certification received — it can differ from the table above while a
                review (05.2) is running. */}
            {handoff.components.length > 0 && (
              <ul className="text-xs text-gray-600 space-y-0.5">
                {handoff.components.map((c) => (
                  <li key={c.id}>
                    {c.name} ({ASSESSMENT_COMPONENT_TYPE_LABELS[c.type]}): {c.weightingPercent}%, {c.totalMarks} marks, pass mark {c.passMark}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
