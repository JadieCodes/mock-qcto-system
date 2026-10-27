import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ListScope } from '../visibility/recordVisibility';

// 09-visibility-matrix.md item 3: every internal list gets this switch, defaulting to "My
// items" (submitted by or allocated to the active person) — "All in my team" removes that
// filter and shows the whole process-stage team's queue (today's "See unit" granularity).
export function ScopeToggle({ scope, onChange }: { scope: ListScope; onChange: (scope: ListScope) => void }) {
  return (
    <div className="inline-flex rounded-lg border bg-gray-50 p-0.5">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={cn('h-7 px-3 text-xs', scope === 'mine' && 'bg-white shadow-sm font-semibold')}
        onClick={() => onChange('mine')}
      >
        My items
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={cn('h-7 px-3 text-xs', scope === 'team' && 'bg-white shadow-sm font-semibold')}
        onClick={() => onChange('team')}
      >
        All items for my role
      </Button>
    </div>
  );
}
