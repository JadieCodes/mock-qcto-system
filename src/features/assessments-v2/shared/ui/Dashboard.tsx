import { cn } from '@/lib/utils';
import { roleDescriptor } from '../../config/roles';
import { LABELS } from '../../config/labels';
import { navForPortal } from '../../config/nav';
import { isModuleVisible } from '../visibility/moduleAccess';
import type { Portal } from '../../types';
import { useV2Role } from './useV2Role';

// Cosmetic only — matches the accent each portal already gets in AssessmentsV2Layout.tsx, so
// the "Acting as" card reads as part of the same portal rather than a neutral grey box.
const PORTAL_ACCENT: Record<Portal, string> = {
  internal: 'border-l-4 border-l-blue-500',
  external: 'border-l-4 border-l-teal-500',
};

// Batch N.1: one line under a module the SDP could mix up (FISA instrument vs FISA results).
const SDP_MODULE_DESCRIPTIONS: Record<string, string> = {
  fisa: LABELS.sdpDashboardFisa,
  'approval-of-results': LABELS.sdpDashboardApprovalOfResults,
};

export function Dashboard({ portal }: { portal: Portal }) {
  const { role, person } = useV2Role();
  const descriptor = roleDescriptor(role);
  // 09-visibility-matrix.md item 1: tiles are filtered by the active role's teams (internal)
  // or QP/SDP ownership rules (external) — the same rule the nav and route guard use.
  const modules = navForPortal(portal).filter((item) => item.path !== 'dashboard' && isModuleVisible(portal, item.path, role));

  return (
    <div className="space-y-6">
      <div className={cn('rounded-2xl border bg-white p-6 shadow-sm', PORTAL_ACCENT[portal])}>
        <p className="text-sm font-medium text-gray-500">Acting as</p>
        <p className="text-lg font-bold text-gray-900">
          {person.name} <span className="font-medium text-gray-500">— {descriptor?.label ?? role}</span>
        </p>
      </div>
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50/80 border-b">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Modules</p>
        </div>
        <div className="divide-y">
          {modules.map((m) => (
            <div key={m.path} className="px-4 py-3 flex items-center justify-between transition-colors hover:bg-gray-50">
              <div className="min-w-0">
                <span className="text-sm font-medium text-gray-700">{m.label}</span>
                {role === 'SDP' && SDP_MODULE_DESCRIPTIONS[m.path] && <p className="text-xs text-gray-500 mt-0.5">{SDP_MODULE_DESCRIPTIONS[m.path]}</p>}
              </div>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  m.comingInPhase ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700',
                )}
              >
                {m.comingInPhase ? `Phase ${m.comingInPhase}` : 'Available'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
