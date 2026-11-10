import { Button } from '@/components/ui/button';
import { SectionCard } from '../../../shared/ui/PageSections';
import type { NextStep } from '../nextStep';
import type { ResultsTabId } from '../tabs';

export function NextStepCard({ step, onOpenTab }: { step: NextStep; onOpenTab: (tab: ResultsTabId) => void }) {
  const tab = step.tab;
  return (
    <SectionCard title="Next step">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">{step.text}</p>
        {tab && (
          <Button type="button" size="sm" className="shrink-0" onClick={() => onOpenTab(tab)}>
            {step.buttonLabel}
          </Button>
        )}
      </div>
    </SectionCard>
  );
}
