// components/AssessmentLayout.tsx

import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  UserCog,
  BookOpen,
  Users,
  Shield,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileCheck,
  ClipboardList,
  MapPin,
  Building2,
  Award,
  Calendar,
  FileText,
  CheckCircle,
  BarChart,
  FileSignature,
} from 'lucide-react';
import { useState } from 'react';
import { AssessmentInternalRoleSelector } from './AssessmentInternalRoleSelector';

interface AssessmentLayoutProps {
  children: ReactNode;
  userName?: string;
  organizationName?: string;
}

// Assessment nav items with submenus
const assessmentNavItems = [
  {
    path: '/departments/assessment/qasa-management',
    label: 'QASA Management',
    icon: FileCheck,
  },
 

  {
    label: 'FISA',
    icon: ClipboardList,
    isSubmenu: true,
    subItems: [
      {
        path: '/departments/assessment/fisa/standards',
        label: 'FISA Standards',
        icon: BookOpen,
      },
      {
        path: '/departments/assessment/fisa/validation',
        label: 'Validation of FISA',
        icon: CheckCircle,
      },
    ],
  },
  {
    label: 'EISA',
    icon: Award,
    isSubmenu: true,
    subItems: [
      {
        path: '/departments/assessment/eisa/trades',
        label: 'EISA Trades',
        icon: Users,
      },
      {
        path: '/departments/assessment/eisa/non-trades',
        label: 'EISA Non Trades',
        icon: FileText,
      },
    ],
  },
  {
    label: 'Site Visits & Monitoring',
    icon: MapPin,
    isSubmenu: true,
    subItems: [
      {
        path: '/departments/assessment/site-visits/incoming-requests',
        label: 'Incoming Requests',
        icon: FileText,
      },
      {
        path: '/departments/assessment/site-visits/planning-scheduling',
        label: 'Planning & Scheduling',
        icon: Calendar,
      },
      {
        path: '/departments/assessment/site-visits/execution',
        label: 'Site Visit Execution',
        icon: MapPin,
      },
      {
        path: '/departments/assessment/site-visits/evaluation-reports',
        label: 'Evaluation & Reports',
        icon: FileCheck,
      },
      {
        path: '/departments/assessment/site-visits/approvals-outcomes',
        label: 'Approvals & Outcomes',
        icon: CheckCircle,
      },
      {
        path: '/departments/assessment/site-visits/monitoring-dashboard',
        label: 'Monitoring Dashboard',
        icon: BarChart,
      },
    ],
  },
];

export const AssessmentLayout = ({
  children,
  userName,
  organizationName,
}: AssessmentLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    'FISA': true,
    'EISA': true,
    'Site Visits & Monitoring': true,
  });

  const handleLogout = () => {
    localStorage.removeItem('department_login_assessment');
    localStorage.removeItem('current_department');
    navigate('/departments');
  };

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isSubmenuItemActive = (subItems: any[]) => {
    return subItems.some(item => location.pathname === item.path);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b bg-card shrink-0">
        <div className="w-full flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold text-primary">Assessment Domain</h1>
            {userName && (
              <p className="text-sm text-muted-foreground">
                {userName} {organizationName && `- ${organizationName}`}
              </p>
            )}
          </div>
          <AssessmentInternalRoleSelector />
        </div>
      </header>

      {/* REMOVED px-4 py-6 from this div - this was the problem! */}
      <div className="flex flex-1 w-full">
        <aside
          className={`${
            isNavOpen ? 'w-80' : 'w-20'
          } flex-shrink-0 bg-white border-r shadow-lg transition-all duration-300`}
        >
          <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-73px)]">
            {/* Toggle Button */}
            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="w-full flex items-center justify-end mb-4 text-gray-500 hover:text-gray-700"
            >
              {isNavOpen ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>

            {/* Navigation Links */}
            <div className="space-y-1">
              {assessmentNavItems.map((item) => {
                if (item.isSubmenu) {
                  const isOpen = openSubmenus[item.label];
                  const isActive = isSubmenuItemActive(item.subItems!);
                  
                  return (
                    <div key={item.label} className="space-y-1">
                      <button
                        onClick={() => toggleSubmenu(item.label)}
                        className={cn(
                          'w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                          !isNavOpen && 'justify-center px-2'
                        )}
                        title={!isNavOpen ? item.label : undefined}
                      >
                        <div className="flex items-center gap-4">
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {isNavOpen && <span>{item.label}</span>}
                        </div>
                        {isNavOpen && (
                          isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )
                        )}
                      </button>
                      
                      {isNavOpen && isOpen && (
                        <div className="ml-8 space-y-1">
                          {item.subItems!.map((subItem) => {
                            const Icon = subItem.icon;
                            const isSubActive = location.pathname === subItem.path;
                            return (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                className={cn(
                                  'flex items-center gap-4 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                                  isSubActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                              >
                                <Icon className="h-4 w-4 flex-shrink-0" />
                                <span>{subItem.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                
                const Icon = item.icon!;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path!}
                    className={cn(
                      'flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      !isNavOpen && 'justify-center px-2'
                    )}
                    title={!isNavOpen ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {isNavOpen && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Logout Button */}
            <div
              onClick={handleLogout}
              className={cn(
                'flex items-center gap-4 rounded-lg px-4 py-4 text-lg font-medium text-red-600 cursor-pointer hover:bg-red-100 hover:text-red-700 mt-8',
                !isNavOpen && 'justify-center px-2'
              )}
              title={!isNavOpen ? 'Logout' : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {isNavOpen && <span>Logout</span>}
            </div>
          </nav>
        </aside>

        <main className="flex-1 min-w-0 overflow-auto bg-gray-50">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};