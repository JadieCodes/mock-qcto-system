import { AlertCircle } from 'lucide-react';
import type { ValidationIssue } from './types';

// Row 11 (test findings B-05): forms used to just disable Submit with no explanation. This is
// the ONE summary banner every form/checklist in the domain uses instead — it lists every
// missing field/comment at the top, next to the button that's blocked.
export function ValidationSummary({
  issues,
  title = 'Before you can submit:',
}: {
  issues: ValidationIssue[];
  title?: string;
}) {
  if (issues.length === 0) return null;
  return (
    <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 space-y-1.5">
      <p className="flex items-center gap-1.5 font-medium">
        <AlertCircle className="h-4 w-4" />
        {title}
      </p>
      <ul className="list-disc pl-5 space-y-0.5">
        {issues.map((issue) => (
          <li key={issue.field}>{issue.message}</li>
        ))}
      </ul>
    </div>
  );
}

// The per-field companion to ValidationSummary — put this directly under an input so the
// message sits next to the field it's about, not just in the summary above.
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-amber-600 mt-1">{message}</p>;
}
