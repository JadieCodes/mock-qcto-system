// pages/internal/DevelopmentWorkspace.tsx - Fixed
import React, { useState, useEffect, useCallback } from 'react';
import { getApplications } from '@/lib/applicationStorage';
import type { Application } from '@/types';
import ResolutionPhase from './ResolutionPhase';
import { 
  GitBranch, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Users,
  Calendar,
  MessageSquare,
  Eye,
  Edit,
  Plus,
  Download,
  Upload,
  UserCheck,
  XCircle,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  MoreVertical,
  TrendingUp
} from 'lucide-react';
import DevelopmentProjectModal from '@/components/modals/DevelopmentProjectModal';

interface Phase {
  name: string;
  startDate: string;
  endDate: string;
  responsibleRole: string;
  status: 'pending' | 'in-progress' | 'completed';
  completedDate?: string;
  approved?: boolean;
  notes?: string;
  reportSubmitted?: boolean;
  reportData?: any;
}

interface CyclePlanData {
  qualificationCode: string;
  qualificationTitle: string;
  phases: Phase[];
  startDate: string;
  endDate: string;
  publishedAt: string;
  status: string;
}

interface DevelopmentProject {
  id: string;
  qualificationTitle: string;
  currentPhase: string;
  phaseStatus: 'pending' | 'in-progress' | 'completed';
  progress: number;
  startDate: string;
  targetDate: string;
  status: 'active' | 'on-hold' | 'completed';
  documents: {
    applicationLetter: string;
    motivation: string;
    reference: string;
    acrLetter: string;
    other: string;
    resolutionDocument: string;
    approvalLetter: string;
  };
  phases: Phase[];
  applicationData?: Application;
}

export default function DevelopmentWorkspace() {
  const [activeSubTab, setActiveSubTab] = useState<'development' | 'resolution'>('development');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<DevelopmentProject | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [cyclePlans, setCyclePlans] = useState<CyclePlanData[]>([]);
  const [developmentProjects, setDevelopmentProjects] = useState<DevelopmentProject[]>([]);
  const [submittedReports, setSubmittedReports] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to build development projects from cycle plans and reports
 const buildDevelopmentProjects = useCallback((plans: CyclePlanData[], reports: any[]): DevelopmentProject[] => {
  // Get qualifications that are already in resolution phase
  const resolutionProjects = localStorage.getItem('resolutionProjects');
  const resolvedQualificationCodes = resolutionProjects ? JSON.parse(resolutionProjects).map((r: any) => r.qualificationCode) : [];
  
  console.log('Resolved qualification codes:', resolvedQualificationCodes);
  console.log('Total plans before filter:', plans.length);
  
  const filteredPlans = plans.filter(plan => !resolvedQualificationCodes.includes(plan.qualificationCode));
  console.log('Plans after filter:', filteredPlans.length);
  
  return filteredPlans.map(plan => {
        const completedPhases = plan.phases.filter(p => p.status === 'completed' || p.approved === true).length;
        const progress = plan.phases.length > 0 ? (completedPhases / plan.phases.length) * 100 : 0;
        const currentPhase = plan.phases.find(p => p.status === 'in-progress') || plan.phases[0];
        
        // Get submitted report data for each phase
        const phasesWithReports = plan.phases.map(phase => {
          const report = reports.find(r => 
            r.qualificationCode === plan.qualificationCode && 
            r.phaseName === phase.name
          );
          return {
            ...phase,
            reportSubmitted: !!report || phase.reportSubmitted === true,
            reportData: report?.reportData || phase.reportData,
            status: (report || phase.reportSubmitted) && !phase.approved ? 'completed' : phase.status
          };
        });
        
        // Get documents from the application
        const app = applications.find(a => a.id === plan.qualificationCode);
        
        return {
          id: plan.qualificationCode,
          qualificationTitle: plan.qualificationTitle,
          currentPhase: currentPhase?.name || 'Not Started',
          phaseStatus: (currentPhase?.status || 'pending') as 'pending' | 'in-progress' | 'completed',
          progress,
          startDate: plan.startDate,
          targetDate: plan.endDate,
          status: 'active' as const,
          documents: {
            applicationLetter: app?.documents?.applicationLetter || '',
            motivation: app?.documents?.motivation || '',
            reference: app?.documents?.reference || '',
            acrLetter: app?.documents?.acrLetter || '',
            other: app?.documents?.other || '',
            resolutionDocument: app?.evaluationSummary?.resolutionUploaded || '',
            approvalLetter: app?.evaluationSummary?.approvalLetter || ''
          },
          phases: phasesWithReports,
          applicationData: app
        };
      });
  }, [applications]);

  // Function to load all data from localStorage
  const loadAllData = () => {
    setApplications(getApplications());
    
    // Load internal cycle plans
    const storedCyclePlans = localStorage.getItem('internalCyclePlans');
    if (storedCyclePlans) {
      const plans = JSON.parse(storedCyclePlans);
      setCyclePlans(plans);
    }
    
    // Load submitted reports
    const reports = localStorage.getItem('submittedPhaseReports');
    const submitted = reports ? JSON.parse(reports) : [];
    setSubmittedReports(submitted);
    
    // Load cycle plans and rebuild projects
    const finalPlans = storedCyclePlans ? JSON.parse(storedCyclePlans) : [];
    const projects = buildDevelopmentProjects(finalPlans, submitted);
    setDevelopmentProjects(projects);
    setRefreshTrigger(prev => prev + 1);
    
    // Also force resolution phase to refresh if it's mounted
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'resolutionProjects',
      newValue: localStorage.getItem('resolutionProjects')
    }));
  };

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    const handleResolutionChange = (e: StorageEvent) => {
      if (e.key === 'resolutionProjects' && e.newValue) {
        loadAllData();
      }
    };
    
    window.addEventListener('storage', handleResolutionChange);
    return () => window.removeEventListener('storage', handleResolutionChange);
  }, []);

  // Listen for storage events from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'internalCyclePlans' || e.key === 'cyclePlans' || e.key === 'submittedPhaseReports') {
        console.log(`Storage event detected: ${e.key}`);
        loadAllData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    const handleCustomEvent = () => {
      loadAllData();
    };
    window.addEventListener('refreshWorkspace', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('refreshWorkspace', handleCustomEvent);
    };
  }, []);

  // In DevelopmentWorkspace.tsx - Add resolutionProjects to the storage event listener
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'internalCyclePlans' || e.key === 'cyclePlans' || e.key === 'submittedPhaseReports' || e.key === 'resolutionProjects') {
      console.log(`Storage event detected: ${e.key}`);
      loadAllData();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  const handleCustomEvent = () => {
    loadAllData();
  };
  window.addEventListener('refreshWorkspace', handleCustomEvent);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('refreshWorkspace', handleCustomEvent);
  };
}, []);

  // Rebuild projects when dependencies change
  useEffect(() => {
    if (cyclePlans.length > 0 || submittedReports.length > 0) {
      const projects = buildDevelopmentProjects(cyclePlans, submittedReports);
      setDevelopmentProjects(projects);
    }
  }, [cyclePlans, submittedReports, buildDevelopmentProjects]);

  const handleViewProject = (project: DevelopmentProject) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
    loadAllData();
  };

  const getPhaseBadge = (status: string, reportSubmitted?: boolean, approved?: boolean) => {
    if (approved) {
      return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>;
    }
    if (reportSubmitted) {
      return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Review</span>;
    }
    switch(status) {
      case 'completed':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'in-progress':
        return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><RefreshCw className="w-3 h-3" /> In Progress</span>;
      default:
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  return (
    <div className="space-y-6" key={refreshTrigger}>
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Projects</p>
              <p className="text-2xl font-bold">{developmentProjects.length}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <GitBranch className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {developmentProjects.filter(p => p.phaseStatus === 'in-progress').length} in progress
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold">
                {developmentProjects.filter(p => p.phases.some(ph => ph.reportSubmitted === true && !ph.approved)).length}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Eye className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Awaiting approval</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed Phases</p>
              <p className="text-2xl font-bold">
                {developmentProjects.reduce((acc, p) => acc + p.phases.filter(ph => ph.status === 'completed' || ph.approved === true).length, 0)}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">This cycle</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">On Track</p>
              <p className="text-2xl font-bold">
                {Math.round((developmentProjects.reduce((acc, p) => acc + p.progress, 0) / (developmentProjects.length || 1)) || 0)}%
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Average completion</div>
        </div>
      </div>

      {/* Subtabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveSubTab('development')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeSubTab === 'development' 
                ? 'text-orange-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Qualifications Development Phase ({developmentProjects.length})
            </div>
            {activeSubTab === 'development' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('resolution')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeSubTab === 'resolution' 
                ? 'text-orange-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Resolution Phase
            </div>
            {activeSubTab === 'resolution' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* Qualifications Development Phase Tab */}
      {activeSubTab === 'development' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full"
              />
            </div>
            <select className="border rounded-lg px-3 py-2 text-sm">
              <option value="">All Phases</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <button 
              onClick={loadAllData}
              className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Phase</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timeline</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {developmentProjects.map((project) => {
                    const currentPhaseObj = project.phases.find(p => p.name === project.currentPhase) || project.phases[0];
                    return (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{project.id}</td>
                        <td className="px-4 py-3 text-sm">{project.qualificationTitle}</td>
                        <td className="px-4 py-3">
                          {getPhaseBadge(
                            currentPhaseObj?.status || 'pending', 
                            currentPhaseObj?.reportSubmitted, 
                            currentPhaseObj?.approved
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-600 h-2 rounded-full" 
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-xs">{Math.round(project.progress)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>Start: {project.startDate}</span>
                          </div>
                          <div className="text-xs text-gray-500">End: {project.targetDate}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleViewProject(project)}
                              className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Phase Tab */}
      {activeSubTab === 'resolution' && (
        <ResolutionPhase />
      )}

      {/* Development Project Modal */}
      <DevelopmentProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        project={selectedProject}
        mode={activeSubTab}
      />
    </div>
  );
}