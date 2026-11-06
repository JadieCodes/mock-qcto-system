import { CheckCircle2, Circle, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { qpProgressOf } from '../progress';
import type { QsaAddendumApplication } from '../types';
import { QASA_UNDER_REVIEW_LABEL } from '../workflow';

function dateText(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('en-ZA') : '';
}

// QCTO feedback 05.8: the QP's "Progress" tab — stage and status only. No names and no internal
// comments; the internal audit trail stays on the internal workspace.
export function QpProgress({ application }: { application: QsaAddendumApplication }) {
  const progress = qpProgressOf(application);

  return (
    <div className="space-y-3">
      {progress.underReviewSince && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <p className="font-semibold">{QASA_UNDER_REVIEW_LABEL}</p>
          <p className="text-xs mt-0.5">
            Review started on {dateText(progress.underReviewSince)}. Your QASA stays approved while it goes through the stages below again.
          </p>
        </div>
      )}

      <ol className="space-y-1" aria-label="QASA progress">
        {progress.steps.map((step) => {
          const remediation = step.id === 'outcome' && progress.outcome === 'remediation';
          const Icon = step.state === 'done' ? CheckCircle2 : step.state === 'current' ? CircleDot : Circle;
          return (
            <li
              key={step.id}
              aria-current={step.state === 'current' ? 'step' : undefined}
              className={cn(
                'flex items-start gap-3 rounded-xl px-3 py-2',
                step.state === 'current' && (remediation ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'),
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 mt-0.5 flex-shrink-0',
                  step.state === 'done' && 'text-emerald-600',
                  step.state === 'current' && (remediation ? 'text-amber-600' : 'text-blue-600'),
                  step.state === 'upcoming' && 'text-gray-300',
                )}
              />
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm', step.state === 'upcoming' ? 'text-gray-400' : 'font-medium text-gray-900')}>
                  {step.label}
                  {step.state === 'current' && <span className="ml-2 text-xs font-normal text-gray-500">Current stage</span>}
                </p>
                {step.enteredAt && (
                  <p className="text-xs text-gray-500">
                    {step.id === 'submitted' ? 'Submitted on' : 'Since'} {dateText(step.enteredAt)}
                  </p>
                )}
                {remediation && progress.remediationComment && (
                  <p className="mt-1 text-sm text-amber-900 whitespace-pre-wrap">{progress.remediationComment}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
