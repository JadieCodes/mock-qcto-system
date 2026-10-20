import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navForPortal } from '../../config/nav';
import type { Portal } from '../../types';
import { DemoBanner } from './DemoBanner';
import { RoleSwitcher } from './RoleSwitcher';

export function AssessmentsV2Layout({ portal, children }: { portal: Portal; children: ReactNode }) {
  const location = useLocation();
  const basePath = `/assessments-v2/${portal}`;
  const navItems = navForPortal(portal);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DemoBanner />
      <header className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div>
          <p className="text-sm font-bold text-gray-900">QCTO Assessments (v2)</p>
          <p className="text-xs text-gray-500">{portal === 'internal' ? 'Internal portal' : 'External portal'}</p>
        </div>
        <RoleSwitcher />
      </header>
      <div className="flex flex-1">
        <aside className="w-64 border-r bg-white px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const to = `${basePath}/${item.path}`;
            const active = location.pathname === to;
            return (
              <Link
                key={item.path}
                to={to}
                className={cn(
                  'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                {item.label}
                {item.comingInPhase && (
                  <span className="ml-2 text-[10px] font-semibold text-gray-400">Phase {item.comingInPhase}</span>
                )}
              </Link>
            );
          })}
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
