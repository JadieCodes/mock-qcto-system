import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { RoleSelector } from './RoleSelector';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Package, 
  Network, 
  Printer, 
  LayoutDashboard, 
  FileEdit,
  LogOut,
  UserCog,
  BookOpen,
  Building2,
  Users,
  Shield,
  Award,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

// Certification nav items
const certificationNavItems = [
  { path: '/certification', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/certification/intake', label: 'Intake', icon: FileText },
  { path: '/certification/corrections', label: 'Corrections', icon: FileEdit },
  { path: '/certification/batches', label: 'Batches', icon: Package },
  { path: '/certification/integrations', label: 'Integrations', icon: Network },
  { path: '/certification/printing', label: 'Printing', icon: Printer },
];



export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCertificationOpen, setIsCertificationOpen] = useState(true);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(true);

  const handleLogout = () => {
    navigate('/');
  };

  // Determine which section is active based on current path
  const isCertificationPath = location.pathname.startsWith('/certification');
  const isAssessmentPath = location.pathname.startsWith('/assessment');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b bg-card shrink-0">
        <div className="w-full flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-primary">
            {isCertificationPath && 'Certificate Processing'}
            {isAssessmentPath && 'Assessment Domain'}
            {!isCertificationPath && !isAssessmentPath && 'QCTO System'}
          </h1>
          <RoleSelector />
        </div>
      </header>

      <div className="flex flex-1 w-full px-4 py-6">
        <aside className="w-64 mr-6 flex flex-col justify-between">
          <nav className="p-8 space-y-6">
            {/* Certification Section */}
            <div className="space-y-2">
              <button
                onClick={() => setIsCertificationOpen(!isCertificationOpen)}
                className="flex items-center justify-between w-full px-4 py-2 text-sm font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                <span>Certification</span>
                {isCertificationOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {isCertificationOpen && (
                <div className="space-y-1">
                  {certificationNavItems.map((item) => {
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
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
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
            className="flex items-center gap-4 rounded-lg px-4 py-4 text-lg font-medium text-red-600 cursor-pointer hover:bg-red-100 hover:text-red-700 m-8"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-auto">{children}</main>
      </div>
    </div>
  );
};