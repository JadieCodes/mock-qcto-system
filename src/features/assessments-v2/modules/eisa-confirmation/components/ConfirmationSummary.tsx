import type { EisaConfirmationRecord } from '../types';

// What the QP confirmed: centres with learner counts and the dates. Shown to the ASD and, once
// submitted, to the QP.
export function ConfirmationSummary({ record }: { record: EisaConfirmationRecord }) {
  const counts = record.confirmedCentres ?? record.centres.map((centre) => ({ centre, learnerCount: record.learners.filter((l) => l.assessmentCentre === centre).length }));
  return (
    <div className="rounded-2xl border bg-gray-50 p-4 text-sm space-y-1">
      {counts.map((c) => (
        <p key={c.centre}>
          {c.centre}: {c.learnerCount} learner(s)
        </p>
      ))}
      <p className="pt-2">Marking date(s): {record.markingDates.join(', ') || 'None'}</p>
      <p>Moderation date(s): {record.moderationDates.join(', ') || 'None'}</p>
      <p>Results submission date: {record.resultsSubmissionDate ?? 'None'}</p>
    </div>
  );
}
