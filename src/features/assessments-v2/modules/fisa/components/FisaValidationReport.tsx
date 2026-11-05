import type { ReactNode } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FISA_VALIDATION_SECTION_2_TITLE } from '../../../mock/data/fisaInstrumentValidationChecklistItems';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { Checklist } from '../../../shared/checklist/Checklist';
import type { ChecklistSection } from '../../../shared/checklist/types';
import type { FisaValidationDecision, FisaValidationRecord } from '../types';
import { fisaValidationFormOf, type FisaValidationForm } from '../validationForm';

function decisionLabel(decision: FisaValidationDecision): string {
  return decision === 'approved' ? 'Approved' : decision === 'approved-with-conditions' ? 'Approved with conditions' : 'Not approved';
}

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('en-ZA') : '—';
}

function show(value: string): string {
  return value.trim() || '—';
}

function headerRows(form: FisaValidationForm): [string, string][] {
  const h = form.header;
  return [
    ['Name of QAP/SDP', show(h.qapSdpName)],
    ['Contact number', show(h.contactNumber)],
    ['Evaluator full names', show(h.evaluatorName)],
    ['Date completed', formatDate(h.dateCompleted)],
    ['Title of qualification/skills programme', show(h.qualificationTitle)],
    ['SP ID', show(h.spId)],
    ['NQF level', show(h.nqfLevel)],
    ['Credits', show(h.credits)],
    ['Date/period of FISA', show(h.fisaDatePeriod)],
    ['Duration', show(h.duration)],
    ['Total marks', show(h.totalMarks)],
    ['Competency/pass mark', show(h.passMark)],
  ];
}

function ReportSectionHeading({ children }: { children: ReactNode }) {
  return <p className="px-4 py-2.5 bg-gray-50 border-b text-sm font-semibold text-gray-800 print:bg-white">{children}</p>;
}

function SectionTable({ section }: { section: ChecklistSection }) {
  return (
    <div className="rounded-2xl border bg-white overflow-hidden break-inside-avoid print:rounded-none">
      <ReportSectionHeading>
        {section.id}. {section.title}
      </ReportSectionHeading>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs text-gray-500">
            <th scope="col" className="w-14 px-4 py-2 text-left font-medium">No.</th>
            <th scope="col" className="px-2 py-2 text-left font-medium">Criteria</th>
            <th scope="col" className="w-12 px-2 py-2 text-center font-medium">Yes</th>
            <th scope="col" className="w-12 px-2 py-2 text-center font-medium">No</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {section.items.map((item) => (
            <tr key={item.id} className="align-top break-inside-avoid">
              <td className="px-4 py-2 font-mono text-xs text-gray-500">{item.id}</td>
              <td className="px-2 py-2 text-gray-800">
                {item.text}
                {item.comment.trim() && <p className="mt-1 text-xs text-gray-500 whitespace-pre-wrap">Comment: {item.comment}</p>}
              </td>
              <td className="px-2 py-2 text-center font-semibold text-emerald-700">{item.answer === 'yes' ? '✓' : ''}</td>
              <td className="px-2 py-2 text-center font-semibold text-red-700">{item.answer === 'no' ? '✓' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TextBlock({ heading, text }: { heading: string; text: string }) {
  return (
    <div className="rounded-2xl border bg-white overflow-hidden break-inside-avoid print:rounded-none">
      <ReportSectionHeading>{heading}</ReportSectionHeading>
      <p className="px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">{show(text)}</p>
    </div>
  );
}

function QctoFormReport({ form }: { form: FisaValidationForm }) {
  const [firstSection, ...laterSections] = form.checklist;
  return (
    <>
      <div className="rounded-2xl border bg-white overflow-hidden break-inside-avoid print:rounded-none">
        <ReportSectionHeading>Details</ReportSectionHeading>
        <dl className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2">
          {headerRows(form).map(([label, value]) => (
            <div key={label} className="border-b px-4 py-2">
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="text-sm font-medium text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {firstSection && <SectionTable section={firstSection} />}
      <TextBlock heading={`2. ${FISA_VALIDATION_SECTION_2_TITLE}`} text={form.section2Comment} />
      {laterSections.map((section) => (
        <SectionTable key={section.id} section={section} />
      ))}
      <TextBlock heading="6. Findings and Recommendations" text={form.findings} />

      <div className="rounded-2xl border bg-white overflow-hidden break-inside-avoid print:rounded-none">
        <ReportSectionHeading>Sign-off</ReportSectionHeading>
        <dl className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2">
          {[
            ['Full names', show(form.signOff.fullNames)],
            ['Designation', show(form.signOff.designation)],
            ['Signature', form.signOff.signed ? `Signed — ${form.signOff.fullNames}` : 'Not signed'],
            ['Date', formatDate(form.signOff.date)],
          ].map(([label, value]) => (
            <div key={label} className="border-b px-4 py-2">
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="text-sm font-medium text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}

// Row 43 (test findings I-08) and QCTO feedback 3.10: the completed "FISA Validation of
// Instrument Report", read-only and printable, for the SDP and officials. A record validated
// before 3.10 shows the checklist it was validated on.
export function FisaValidationReport({ record }: { record: FisaValidationRecord }) {
  const form = fisaValidationFormOf(record);
  const latestOutcome = record.outcomeHistory[record.outcomeHistory.length - 1];

  return (
    <div className="space-y-4 print:space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-gray-900">FISA Validation of Instrument Report</p>
          <p className="text-sm text-gray-600">{record.skillsProgrammeTitle}</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden break-inside-avoid print:rounded-none">
        <ReportSectionHeading>Outcome</ReportSectionHeading>
        <dl className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3">
          <div className="px-4 py-2">
            <dt className="text-xs text-gray-500">Outcome</dt>
            <dd className="text-sm font-medium text-gray-900">{latestOutcome ? decisionLabel(latestOutcome.decision) : 'Not yet decided'}</dd>
          </div>
          <div className="px-4 py-2">
            <dt className="text-xs text-gray-500">Reviewer</dt>
            <dd className="text-sm font-medium text-gray-900">{latestOutcome?.decidedBy ?? record.allocatedAsdName ?? '—'}</dd>
          </div>
          <div className="px-4 py-2">
            <dt className="text-xs text-gray-500">Date</dt>
            <dd className="text-sm font-medium text-gray-900">{formatDate(latestOutcome?.decidedAt ?? null)}</dd>
          </div>
        </dl>
        {latestOutcome?.notes && <p className="px-4 pb-3 text-sm text-gray-700 whitespace-pre-wrap">{latestOutcome.notes}</p>}
      </div>

      {form.isQctoForm ? (
        <QctoFormReport form={form} />
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checklist</p>
          <Checklist sections={record.checklist} readonly onChange={() => {}} />
        </div>
      )}

      {record.outcomeHistory.length > 1 && (
        <div className="space-y-2 break-inside-avoid">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outcome History</p>
          {record.outcomeHistory.map((o, i) => (
            <div key={i} className="rounded-xl border bg-gray-50 px-3 py-2 text-xs print:bg-white">
              <p className="font-medium text-gray-700">
                Cycle {o.cycle} — {decisionLabel(o.decision)}
              </p>
              {o.notes && <p className="text-gray-500 mt-0.5 whitespace-pre-wrap">{o.notes}</p>}
              <p className="text-gray-400 mt-0.5">
                {o.decidedBy} · {new Date(o.decidedAt).toLocaleString('en-ZA')}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 print:hidden">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit Trail</p>
        <AuditTrailView recordTypes={['fisa-instrument-validation']} recordId={record.id} />
      </div>
    </div>
  );
}
