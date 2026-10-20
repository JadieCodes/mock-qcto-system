import { FlaskConical } from 'lucide-react';

// Reviewer requirement: /assessments-v2 is reachable directly by URL, outside the
// department login gate the old /departments/assessment/* route sits behind.
export function DemoBanner() {
  return (
    <div className="flex items-center gap-2 bg-amber-100 px-4 py-1.5 text-xs font-medium text-amber-800">
      <FlaskConical className="h-3.5 w-3.5" />
      Demo — mock data only. Nothing here is saved to a real backend.
    </div>
  );
}
