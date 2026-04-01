// components/InternalSideMenuBar.tsx
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ResearchRoleSelector } from './ResearchRoleSelector';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Calendar,
  BarChart3,
  ClipboardList,
  ExternalLink,
  LogOut,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Archive,
  History 
} from 'lucide-react';
import { useState } from 'react';

interface InternalSideMenuBarProps {
  children: ReactNode;
}

// Research domain nav items
const researchNavItems = [
  { path: '/departments/research/dashboard', label: 'Dashboard Research', icon: LayoutDashboard },
  //{ path: '/departments/research/requests', label: 'Research Request Management', icon: FileText },
 // { path: '/departments/research/appointments', label: 'Service Provider Appointment', icon: Calendar },
 // { path: '/departments/research/reporting', label: 'Research & Reporting', icon: BarChart3 },
 // { path: '/departments/research/bulletin', label: 'Research Bulletin Management', icon: ClipboardList },
 // { path: '/departments/research/external', label: 'External Research Applications', icon: ExternalLink },
  { path: '/departments/research/agenda-management', label: 'Agenda Management', icon: Calendar },
  { path: '/departments/research/project-archive', label: 'Project Archive', icon: Archive },
   { path: '/departments/research/audit-trail', label: 'Research Audit Trail', icon: History },
];

export const InternalSideMenuBar = ({ children }: InternalSideMenuBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isResearchOpen, setIsResearchOpen] = useState(true);

  const handleLogout = () => {
    navigate('/');
  };

  // Determine if we're in research path
  const isResearchPath = location.pathname.startsWith('/departments/research');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b bg-card shrink-0">
        <div className="w-full flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold text-primary">
            {isResearchPath && 'Research Domain'}
            {!isResearchPath && 'QCTO System'}
          </h1>
          {/* Add ResearchRoleSelector here */}
          <ResearchRoleSelector />
        </div>
      </header>

      <div className="flex flex-1 w-full">
        {/* Sidebar */}
        <aside className="w-90 mr-8 flex flex-col justify-between bg-white rounded-r-xl shadow-lg">
          <nav className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Research Section */}
            <div className="space-y-3">
              <button
                onClick={() => setIsResearchOpen(!isResearchOpen)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <span>Research Menu</span>
                {isResearchOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {isResearchOpen && (
                <div className="space-y-4">
                  {researchNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          'flex items-center gap-4 rounded-lg px-4 py-8 text-lg font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Logout Button */}
          <div
            onClick={handleLogout}
            className="flex items-center gap-4 rounded-lg px-4 py-4 text-lg font-medium text-red-600 cursor-pointer hover:bg-red-100 hover:text-red-700 mx-6 mb-6"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Logout</span>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-auto bg-gray-50 rounded-lg p-6">{children}</main>
      </div>
    </div>
  );
};