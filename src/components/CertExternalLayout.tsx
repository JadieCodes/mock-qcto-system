import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CerExternalRoleSelector } from './CerExternalRoleSelector';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCcw, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CertExternalLayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const externalNavItems = [
  { id: 'submissions', label: 'Submissions', icon: FileText },
  { id: 'corrections', label: 'Corrections', icon: RefreshCcw },
];

export const CertExternalLayout = ({
  children,
  activeTab,
  setActiveTab,
}: CertExternalLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isExternalPath = location.pathname.includes('/external');

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b bg-card shrink-0">
        <div className="w-full flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold text-primary">
            {isExternalPath ? 'External Certification Portal' : 'Certification Portal'}
          </h1>

          
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-72 border-r bg-white p-4">
          <nav className="space-y-2">
            {externalNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-left transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};