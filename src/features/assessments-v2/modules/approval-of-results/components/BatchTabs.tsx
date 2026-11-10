import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RESULTS_TAB_LABELS, type ResultsTabId } from '../tabs';

// Batch N.1: the tab bar of a results batch. It scrolls sideways on a narrow screen instead of
// wrapping onto several lines. Only the tabs passed in are shown.
export function BatchTabs({
  ids,
  value,
  onValueChange,
  render,
}: {
  ids: ResultsTabId[];
  value: ResultsTabId;
  onValueChange: (tab: ResultsTabId) => void;
  render: (tab: ResultsTabId) => ReactNode;
}) {
  const active = ids.includes(value) ? value : ids[0];
  return (
    <Tabs value={active} onValueChange={(v) => onValueChange(v as ResultsTabId)}>
      <div className="overflow-x-auto pb-1">
        <TabsList className="h-auto w-max min-w-full justify-start">
          {ids.map((id) => (
            <TabsTrigger key={id} value={id} className="shrink-0">
              {RESULTS_TAB_LABELS[id]}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {ids.map((id) => (
        <TabsContent key={id} value={id} className="pt-4">
          {render(id)}
        </TabsContent>
      ))}
    </Tabs>
  );
}
