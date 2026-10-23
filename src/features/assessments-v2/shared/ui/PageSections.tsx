import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Shared spacing/shape for the three pieces every module dashboard already repeated by hand:
// the stat-tile row, the card-with-header-and-table shell, and the "nothing here yet" empty
// state. Pulled out once so new modules match without copy-pasting the same divs again.

export function StatTileGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid gap-4 md:grid-cols-4', className)}>{children}</div>;
}

export function StatTile({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-3xl font-bold tracking-tight text-gray-900">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 mt-1">{label}</p>
    </div>
  );
}

export function SectionCard({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border bg-white shadow-sm overflow-hidden', className)}>
      {title && (
        <div className="px-6 py-4 border-b bg-gray-50/80">
          <h3 className="text-base font-semibold tracking-tight text-gray-900">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

export function EmptyState({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <div className="text-center py-14">
      <p className="font-medium text-gray-600">{title}</p>
      {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
    </div>
  );
}
