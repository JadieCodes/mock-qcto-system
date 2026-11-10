import { useQuery } from '@tanstack/react-query';
import { listOverdueItems, type OverdueItem } from './overdue';

export const OVERDUE_QUERY_KEY = ['administration', 'overdue'] as const;

export function useOverdueItems() {
  return useQuery({ queryKey: OVERDUE_QUERY_KEY, queryFn: () => listOverdueItems() });
}

export function useOverdueLookup(): Map<string, OverdueItem> {
  const { data = [] } = useOverdueItems();
  return new Map(data.map((item) => [item.key, item]));
}
