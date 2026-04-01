// components/ExternalSideMenuBar.tsx
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ExternalRoleSelector } from './ExternalRoleSelector';
import { cn } from '@/lib/utils';
import { 
  FileText,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface ExternalSideMenuBarProps {
  children?: ReactNode;  // Make children optional with ?
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// External research nav items
const externalNavItems = [
  { id: 'researchRequests', label: 'Research Requests Portal', icon: FileText },
  { id: 'bulletinSubmissions', label: 'Research Bulletin Submissions', icon: FileText },
  { id: 'externalApplications', label: 'External Research Applications', icon: FileText },
];

export const ExternalSideMenuBar = ({ children, activeTab, setActiveTab }: ExternalSideMenuBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isResearchOpen, setIsResearchOpen] = useState(true);

  const handleLogout = () => {
    navigate('/');
  };

  // Determine if we're in external path
  const isExternalPath = location.pathname.includes('/external');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b bg-card shrink-0">
        <div className="w-full flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold text-primary">
            {isExternalPath && 'External Research Portal'}
            {!isExternalPath && 'Research Portal'}
          </h1>
          {/* Add ExternalRoleSelector here */}
          <ExternalRoleSelector />
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
                  {externalNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          'w-full flex items-center gap-4 rounded-lg px-4 py-6 text-base font-medium transition-colors text-left',
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
                </div>
              )}
            </div>
          </nav>

        
        </aside>

        <main className="flex-1 min-w-0 overflow-auto bg-gray-50 rounded-lg p-6">
          {children} {/* This will render the content */}
        </main>
      </div>
    </div>
  );
};