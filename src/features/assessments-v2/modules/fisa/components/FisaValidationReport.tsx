import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuditTrailView } from '../../../shared/audit/AuditTrailView';
import { Checklist } from '../../../shared/checklist/Checklist';
import type { FisaValidationRecord } from '../types';

// Row 43 (test findings I-08): the SDP and officials could not see the full completed FISA
// Validation Report after validation finished. Read-only, printable — every checklist section
// with its answers and comments, the outcome, the reviewer and date, and the audit trail.
export function FisaValidationReport({ record }: { record: FisaValidationRecord }) {
  const latestOutcome = record.outcomeHistory[record.outcomeHistory.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">FISA Validation Report</p>
          <p className="text-sm font-medium text-gray-900">{record.skillsProgrammeTitle}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</p>
        </div>
        <div className="px-4 divide-y divide-gray-50">
          <div className="py-2.5">
            <p className="text-xs text-gray-400 uppercase">SDP</p>
            <p className="text-sm font-medium">{record.sdpName}</p>
          </div>
          <div className="py-2.5">
            <p className="text-xs text-gray-400 uppercase">Reviewer</p>
            <p className="text-sm font-medium">{record.allocatedAsdName ?? '—'}</p>
          </div>
          <div className="py-2.5">
            <p className="text-xs text-gray-400 uppercase">Outcome</p>
            <p className="text-sm font-medium">
              {latestOutcome
                ? latestOutcome.decision === 'approved'
                  ? 'Approved'
                  : latestOutcome.decision === 'approved-with-conditions'
                    ? 'Approved with conditions'
                    : 'Not approved'
                : 'Not yet decided'}
            </p>
          </div>
          <div className="py-2.5">
            <p className="text-xs text-gray-400 uppercase">Date</p>
            <p className="text-sm font-medium">{latestOutcome ? new Date(latestOutcome.decidedAt).toLocaleString('en-ZA') : '—'}</p>
          </div>
        </div>
      </div>

      {record.outcomeHistory.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outcome History</p>
          <div className="space-y-2">
            {record.outcomeHistory.map((o, i) => (
              <div key={i} className="rounded-xl border bg-gray-50 px-3 py-2 text-xs">
                <p className="font-medium text-gray-700">
                  Cycle {o.cycle} —{' '}
                  {o.decision === 'approved' ? 'Approved' : o.decision === 'approved-with-conditions' ? 'Approved with conditions' : 'Not approved'}
                </p>
                {o.notes && <p className="text-gray-500 mt-0.5 whitespace-pre-wrap">{o.notes}</p>}
                <p className="text-gray-400 mt-0.5">
                  {o.decidedBy} · {new Date(o.decidedAt).toLocaleString('en-ZA')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checklist</p>
        <Checklist sections={record.checklist} readonly onChange={() => {}} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Audit Trail</p>
        <AuditTrailView recordTypes={['fisa-instrument-validation']} recordId={record.id} />
      </div>
    </div>
  );
}
