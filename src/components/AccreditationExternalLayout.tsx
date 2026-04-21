import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { FileText, Upload, PlusCircle } from 'lucide-react';
import { AccreditationRoleSelector } from './AccreditationRoleSelector';

interface AccreditationExternalLayoutProps {
  children?: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: 'applicant' | 'qp' | 'verifier';
  currentUserName: string;
  onRoleChange: (role: 'applicant' | 'qp' | 'verifier') => void;
}

const applicantNavItems = [
  { id: 'applications', label: 'My Applications', icon: FileText },

];

export const AccreditationExternalLayout = ({
  children,
  activeTab,
  setActiveTab,
  currentRole,
  currentUserName,
  onRoleChange,
}: AccreditationExternalLayoutProps) => {
  const isApplicant = currentRole === 'applicant';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b bg-card shrink-0">
        <div className="w-full flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold text-primary">
            Accreditation Portal
          </h1>

          <AccreditationRoleSelector
            currentRole={currentRole}
            currentUserName={currentUserName}
            onRoleChange={onRoleChange}
          />
        </div>
      </header>

      <div className="flex flex-1 w-full">
        {isApplicant && (
          <aside className="w-80 mr-8 flex flex-col bg-white rounded-r-xl shadow-lg">
            <nav className="flex-1 p-6 space-y-4 overflow-y-auto">
              {applicantNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      'w-full flex items-center gap-4 rounded-lg px-4 py-4 text-base font-medium transition-colors text-left',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        <main className="flex-1 min-w-0 overflow-auto bg-gray-50 rounded-lg p-6">
          {children}
        </main>
      </div>
    </div>
  );
};