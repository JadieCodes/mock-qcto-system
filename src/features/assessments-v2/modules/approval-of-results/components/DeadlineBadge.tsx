import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { deadlineState, submittedOnTime, workingDaysRemaining, type DeadlineState } from '../workflow';

const TONE_CLASSES: Record<DeadlineState, string> = {
  'on-track': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'due-soon': 'bg-amber-50 text-amber-700 border-amber-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
};

// CR-059: the 21-working-day deadline, shown as a countdown ("due soon"/"overdue") before a
// batch is submitted, and as an on-time/late indicator once it has been.
export function DeadlineBadge({ deadline, submittedAt }: { deadline: string; submittedAt?: string | null }) {
  if (submittedAt) {
    const onTime = submittedOnTime(submittedAt, deadline);
    return (
      <Badge variant="outline" className={cn('whitespace-nowrap font-medium', onTime ? TONE_CLASSES['on-track'] : TONE_CLASSES.overdue)}>
        {onTime ? 'Submitted on time' : 'Submitted — late'}
      </Badge>
    );
  }

  const state = deadlineState(deadline);
  const remaining = workingDaysRemaining(deadline);
  const label =
    state === 'overdue'
      ? `Overdue by ${Math.abs(remaining)} working day${Math.abs(remaining) === 1 ? '' : 's'}`
      : `${remaining} working day${remaining === 1 ? '' : 's'} left — due ${deadline}`;

  return <Badge variant="outline" className={cn('whitespace-nowrap font-medium', TONE_CLASSES[state])}>{label}</Badge>;
}
