import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard,
  UserCog,
  BookOpen,
  Building2,
  Users,
  Shield,
  Award,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface AssessmentLayoutProps {
  children: ReactNode;
  userName?: string;
  organizationName?: string;
}

// Assessment nav items
const assessmentNavItems = [
  
  { path: '/departments/assessment/assessor-management', label: 'Assessor Management', icon: UserCog },
  { path: '/departments/assessment/standards-management', label: 'Standards Management', icon: BookOpen },
 // { path: '/departments/assessment/center-management', label: 'Center Management', icon: Building2 },
  { path: '/departments/assessment/candidate-registration', label: 'Candidate Registration', icon: Users },
  { path: '/departments/assessment/quality-assurance', label: 'Quality Assurance', icon: Shield },
  //{ path: '/departments/assessment/results-management', label: 'Results Management', icon: Award },
];

export const AssessmentLayout = ({ children, userName, organizationName }: AssessmentLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavOpen, setIsNavOpen] = useState(true);

 const handleLogout = () => {
  localStorage.removeItem('department_login_assessment');
  localStorage.removeItem('current_department');
  navigate('/departments');
};

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b bg-card shrink-0">
        <div className="w-full flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-xl font-bold text-primary">Assessment Domain</h1>
            {userName && (
              <p className="text-sm text-muted-foreground">
                {userName} {organizationName && `- ${organizationName}`}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 w-full px-4 py-6">
        <aside className={`${isNavOpen ? 'w-64' : 'w-20'} mr-6 flex flex-col justify-between transition-all duration-300`}>
          <nav className="p-8 space-y-2">
            {/* Toggle Button */}
            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="w-full flex items-center justify-end mb-4 text-gray-500 hover:text-gray-700"
            >
              {isNavOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>

            {/* Navigation Links */}
            <div className="space-y-1">
              {assessmentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
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
          </nav>

          {/* Logout Button */}
          <div
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-4 rounded-lg px-4 py-4 text-lg font-medium text-red-600 cursor-pointer hover:bg-red-100 hover:text-red-700 m-8',
              !isNavOpen && 'justify-center px-2'
            )}
            title={!isNavOpen ? "Logout" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {isNavOpen && <span>Logout</span>}
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-auto bg-gray-50 rounded-lg p-6">
          {children}
        </main>
      </div>
    </div>
  );
};