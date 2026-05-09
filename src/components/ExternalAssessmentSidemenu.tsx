import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AssessmentRoleSelector } from '@/components/AssessmentRoleSelector';
import {
  FileCheck,
  ShieldCheck,
  ClipboardList,
  MapPinned,
  LogOut,
} from 'lucide-react';

interface ExternalAssessmentSidemenuProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  userName?: string;
  organizationName?: string;
}

const externalAssessmentNavItems = [
  {
    id: 'qasaAddendumSubmission',
    label: 'QASA Addendum Submission',
    icon: FileCheck,
  },
  {
    id: 'validationOfFisa',
    label: 'Validation of FISA',
    icon: ShieldCheck,
  },
  {
    id: 'eisaRegistration',
    label: 'EISA Registration',
    icon: ClipboardList,
  },
  {
    id: 'siteVisitsAndMonitoring',
    label: 'Site Visits & Monitoring',
    icon: MapPinned,
  },
];

export const ExternalAssessmentSidemenu = ({
  children,
  activeTab,
  setActiveTab,
  userName,
  organizationName,
}: ExternalAssessmentSidemenuProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('department_login_assessment');
    localStorage.removeItem('current_department');
    navigate('/departments');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="shrink-0 border-b bg-card">
        <div className="flex h-16 w-full items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold text-primary">Assessment Domain</h1>
            {userName && (
              <p className="text-sm text-muted-foreground">
                {userName} {organizationName && `- ${organizationName}`}
              </p>
            )}
          </div>

          <AssessmentRoleSelector />
        </div>
      </header>

      <div className="flex w-full flex-1 px-4 py-6">
        <aside className="mr-6 flex w-64 flex-col justify-between">
          <nav className="space-y-2 p-6">
            <div className="space-y-1">
              {externalAssessmentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div
            onClick={handleLogout}
            className="m-6 flex cursor-pointer items-center gap-4 rounded-lg px-4 py-4 text-lg font-medium text-red-600 hover:bg-red-100 hover:text-red-700"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Logout</span>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-auto rounded-lg bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};