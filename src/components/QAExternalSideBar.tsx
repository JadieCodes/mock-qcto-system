// QA External Side Bar
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QAExternalRoleSelector } from './QAExternalRoleSelector';
import { cn } from '@/lib/utils';
import { 
  FileText,
  LogOut,
  ChevronDown,
  ChevronRight,
  Users,
  BookOpen,
  Award,
  History
} from 'lucide-react';

interface QAExternalSideBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

// QA External nav items
const qaExternalNavItems = [
  { id: 'learnerEnrolment', label: 'Learner Enrolment', icon: Users },
  { id: 'curriculumImplementation', label: 'Curriculum Implementation', icon: BookOpen },
  { id: 'skillsProgrammes', label: 'Skills Programmes', icon: Award },
  { id: 'historicalQualifications', label: 'Historical Qualifications', icon: History },
];

export const QAExternalSideBar: React.FC<QAExternalSideBarProps> = ({ 
  activeTab, 
  setActiveTab, 
  children 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isQAMenuOpen, setIsQAMenuOpen] = useState(true);

  const handleLogout = () => {
    navigate('/');
  };

  // Determine if we're in QA external path
  const isQAExternalPath = location.pathname.includes('/quality-assurance');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b bg-card shrink-0">
        <div className="w-full flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold text-primary">
            {isQAExternalPath && 'Quality Assurance External Portal'}
            {!isQAExternalPath && 'Quality Assurance Portal'}
          </h1>
          {/* Add QAExternalRoleSelector here */}
          <QAExternalRoleSelector />
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
                  {qaExternalNavItems.map((item) => {
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

          {/* Logout Button */}
          <div className="p-6 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 w-full px-4 py-3 text-base font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-auto bg-gray-50 rounded-lg p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default QAExternalSideBar;