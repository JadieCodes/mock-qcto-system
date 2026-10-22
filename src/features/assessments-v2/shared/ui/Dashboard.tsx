import { roleDescriptor } from '../../config/roles';
import { navForPortal } from '../../config/nav';
import { isModuleVisible } from '../visibility/moduleAccess';
import type { Portal } from '../../types';
import { useV2Role } from './useV2Role';

export function Dashboard({ portal }: { portal: Portal }) {
  const { role, person } = useV2Role();
  const descriptor = roleDescriptor(role);
  // 09-visibility-matrix.md item 1: tiles are filtered by the active role's teams (internal)
  // or QP/SDP ownership rules (external) — the same rule the nav and route guard use.
  const modules = navForPortal(portal).filter((item) => item.path !== 'dashboard' && isModuleVisible(portal, item.path, role));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Acting as</p>
        <p className="text-lg font-bold text-gray-900">
          {person.name} <span className="font-normal text-gray-500">— {descriptor?.label ?? role}</span>
        </p>
        {descriptor && descriptor.teams.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">Teams: {descriptor.teams.join(', ')}</p>
        )}
      </div>
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Modules</p>
        </div>
        <div className="divide-y">
          {modules.map((m) => (
            <div key={m.path} className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-700">{m.label}</span>
              <span className="text-xs font-semibold text-gray-400">
                {m.comingInPhase ? `Phase ${m.comingInPhase}` : 'Available'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
