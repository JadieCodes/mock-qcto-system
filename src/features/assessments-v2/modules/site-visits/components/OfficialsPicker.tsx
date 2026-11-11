import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { personsForPortal } from '../../../shared/people/directory';

// Batch Z2 (11.9): the QCTO officials going on a visit, picked from the internal staff. The planner is
// always on the visit, so that row is ticked and cannot be cleared. The Super Admin does no visits.
const OFFICIALS = personsForPortal('internal').filter((p) => p.role !== 'Super Admin');

export function OfficialsPicker({
  idPrefix,
  value,
  onChange,
  lockedId,
  disabled,
}: {
  idPrefix: string;
  value: string[];
  onChange: (ids: string[]) => void;
  lockedId?: string;
  disabled?: boolean;
}) {
  const toggle = (id: string, checked: boolean) => onChange(checked ? [...value, id] : value.filter((v) => v !== id));
  return (
    <div role="group" aria-label="QCTO officials" className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1.5">
      {OFFICIALS.map((p) => {
        const id = `${idPrefix}-${p.id}`;
        return (
          <div key={p.id} className="flex items-center gap-2">
            <Checkbox
              id={id}
              checked={value.includes(p.id)}
              disabled={disabled || p.id === lockedId}
              onCheckedChange={(checked) => toggle(p.id, checked === true)}
            />
            <Label htmlFor={id} className="text-sm font-normal">
              {p.name} <span className="text-xs text-muted-foreground">({p.role}){p.id === lockedId ? ' — planner' : ''}</span>
            </Label>
          </div>
        );
      })}
    </div>
  );
}
