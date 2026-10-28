import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { navForPortal } from '../../config/nav';
import { resetDemoData } from '../../mock/api/storage';
import { isModuleVisible } from '../visibility/moduleAccess';
import type { Portal } from '../../types';
import { DemoBanner } from './DemoBanner';
import { RoleSwitcher } from './RoleSwitcher';
import { clearStoredPerson, useV2Role } from './useV2Role';

// Cosmetic only — which icon represents each module in the side nav. Every icon here is
// already used elsewhere in the app's other domain side menus (old assessment/QA/accreditation).
const NAV_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  'qsa-addendum': FileCheck,
  'instrument-validation': CheckCircle2,
  'qasa-status': ListChecks,
  'eisa-calendar': Calendar,
  'eisa-registration': ClipboardList,
  'eisa-confirmation': FileText,
  'site-visits': MapPin,
  'approval-of-results': BarChart3,
  fisa: BookOpen,
  'rpl-toolkit': Award,
};

const NAV_LINK_CLASSES =
  'flex items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm font-medium transition-colors justify-center md:justify-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

// Cosmetic only — gives each portal its own accent so the two feel distinct at a glance.
// Internal keeps the app's existing blue; External gets teal, a colour not already used by
// any status-badge tone in this domain (amber/blue/emerald/red/indigo/purple), so it never
// reads as a status.
const PORTAL_ACCENT = {
  internal: {
    badge: 'bg-blue-50 text-blue-700',
    headerRule: 'border-b-2 border-blue-500',
    navHeaderRule: 'border-b border-blue-100',
    active: 'border-l-blue-600 bg-blue-50 text-blue-700',
  },
  external: {
    badge: 'bg-teal-50 text-teal-700',
    headerRule: 'border-b-2 border-teal-500',
    navHeaderRule: 'border-b border-teal-100',
    active: 'border-l-teal-600 bg-teal-50 text-teal-700',
  },
} as const;

export function AssessmentsV2Layout({ portal, children }: { portal: Portal; children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useV2Role();
  const basePath = `/assessments-v2/${portal}`;
  const accent = PORTAL_ACCENT[portal];
  // 09-visibility-matrix.md Tables A/B, enforced in one place: shared/visibility/moduleAccess.ts.
  const navItems = navForPortal(portal).filter((item) => isModuleVisible(portal, item.path, role));

  const handleResetDemoData = () => {
    resetDemoData();
    window.location.reload();
  };

  const handleLogout = () => {
    // Forget the active person for both portals so whichever one is picked next starts on
    // its default person. Never calls resetDemoData() — no record data is touched.
    clearStoredPerson('internal');
    clearStoredPerson('external');
    navigate('/assessments-v2');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DemoBanner />
      <header className={cn('bg-white px-4 py-3 sm:px-6', accent.headerRule)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-gray-900">QCTO Assessments (v2)</p>
            <p className="text-xs text-gray-500">{portal === 'internal' ? 'Internal portal' : 'External portal'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RoleSwitcher />
            <Button variant="outline" size="sm" onClick={handleResetDemoData}>
              Reset demo data
            </Button>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="flex w-16 shrink-0 flex-col border-r bg-white md:w-64">
          <div className={cn('flex items-center gap-3 px-3 py-4 md:px-4', accent.navHeaderRule)}>
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold', accent.badge)}>
              {portal === 'internal' ? 'IN' : 'EX'}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-900">
                {portal === 'internal' ? 'Internal Portal' : 'External Portal'}
              </p>
              <p className="text-xs text-gray-500">QCTO Assessments</p>
            </div>
          </div>
          <nav aria-label="Primary" className="flex-1 space-y-1.5 overflow-y-auto px-2 py-4 md:px-3">
            {navItems.map((item) => {
              const to = `${basePath}/${item.path}`;
              const active = location.pathname === to;
              const Icon = NAV_ICONS[item.path] ?? FileText;
              return (
                <Link
                  key={item.path}
                  to={to}
                  title={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={cn(NAV_LINK_CLASSES, active ? accent.active : 'text-gray-600 hover:bg-gray-100')}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden truncate md:inline">{item.label}</span>
                  {item.comingInPhase && (
                    <span className="ml-auto hidden text-[10px] font-semibold text-gray-400 md:inline">
                      Phase {item.comingInPhase}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="border-t px-2 py-3 md:px-3">
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className={cn(NAV_LINK_CLASSES, 'w-full text-red-600 hover:bg-red-50')}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </aside>
        <main className="flex-1 min-w-0 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
