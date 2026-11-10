import { Badge } from '@/components/ui/badge';
import { useV2Role } from '../ui/useV2Role';
import { overdueLabel, type OverdueSourceId } from './overdue';
import { useOverdueLookup } from './useOverdue';

// Batch S (29.2): "Overdue (n working days)" beside an item's status on the internal lists. Internal
// portal only — the QP and SDP never see it.
export function OverdueMark({ source, id }: { source: OverdueSourceId; id: string }) {
  const { portal } = useV2Role();
  const lookup = useOverdueLookup();
  const item = portal === 'internal' ? lookup.get(`${source}:${id}`) : undefined;
  if (!item) return null;
  return (
    <Badge
      variant="outline"
      className="whitespace-nowrap border-red-200 bg-red-50 font-medium text-red-700"
      title={`At "${item.stageLabel}" since ${item.enteredAt.slice(0, 10)}`}
    >
      {overdueLabel(item)}
    </Badge>
  );
}
