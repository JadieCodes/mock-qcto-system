// QA Internal Side Bar
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { QAInternalRoleSelector } from './QAInternalRoleSelector';
import { cn } from '@/lib/utils';
import { 
  Users,
  BookOpen,
  Award,
  History,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface QAInternalSideBarProps {
  children: ReactNode;
}

// QA Internal nav items
const qaInternalNavItems = [
  { path: '/departments/quality-assurance/learner-enrolment', label: 'Learner Enrolment', icon: Users },
  { path: '/departments/quality-assurance/curriculum-implementation', label: 'Curriculum Implementation', icon: BookOpen },
  { path: '/departments/quality-assurance/skills-programmes', label: 'Skills Programmes', icon: Award },
  { path: '/departments/quality-assurance/historical-qualifications', label: 'Historical Qualifications', icon: History },
];

export const QAInternalSideBar = ({ children }: QAInternalSideBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isQAMenuOpen, setIsQAMenuOpen] = useState(true);

  const handleLogout = () => {
    navigate('/');
  };

  // Determine if we're in QA internal path
  const isQAInternalPath = location.pathname.startsWith('/departments/quality-assurance');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b bg-card shrink-0">
        <div className="w-full flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold text-primary">
            {isQAInternalPath && 'Quality Assurance Internal Portal'}
            {!isQAInternalPath && 'Quality Assurance Portal'}
          </h1>
          {/* Add QAInternalRoleSelector here */}
          <QAInternalRoleSelector />
        </div>
      </header>

      <div className="flex flex-1 w-full">
        {/* Sidebar */}
        <aside className="w-90 mr-8 flex flex-col justify-between bg-white rounded-r-xl shadow-lg">
          <nav className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Quality Assurance Section */}
            <div className="space-y-3">
              <button
                onClick={() => setIsQAMenuOpen(!isQAMenuOpen)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <span>Quality Assurance Menu</span>
                {isQAMenuOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {isQAMenuOpen && (
                <div className="space-y-4">
                  {qaInternalNavItems.map((item) => {
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

export default QAInternalSideBar;