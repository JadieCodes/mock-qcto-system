// pages/internal/DevelopmentWorkspace.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getApplications } from '@/lib/applicationStorage';
import type { Application } from '@/types';
import ResolutionPhase from './ResolutionPhase';
import {
  GitBranch, FileText, CheckCircle, Clock, AlertCircle,
  Users, Calendar, Eye, RefreshCw, Search, TrendingUp
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
  phaseStatus: 'pending' | 'in-progress' | 'completed' | 'pending-review';
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

// Merge two phase arrays, taking the most complete state per phase
function mergePhases(internal: Phase[], external: Phase[]): Phase[] {
  return internal.map(iPhase => {
    const ePhase = external.find(p => p.name === iPhase.name);
    if (!ePhase) return iPhase;
    return {
      ...iPhase,
      reportSubmitted: iPhase.reportSubmitted || ePhase.reportSubmitted || false,
      approved:        iPhase.approved        || ePhase.approved        || false,
      reportData:      iPhase.reportData      || ePhase.reportData      || undefined,
      status: (iPhase.approved || ePhase.approved)
        ? ('completed' as const)
        : (iPhase.reportSubmitted || ePhase.reportSubmitted)
          ? ('completed' as const)
          : (ePhase.status === 'in-progress' || iPhase.status === 'in-progress')
            ? ('in-progress' as const)
            : iPhase.status,
    };
  });
}

// Read and merge both localStorage plan keys into one canonical list
function getMergedPlans(): CyclePlanData[] {
  const internalRaw = localStorage.getItem('internalCyclePlans');
  const externalRaw = localStorage.getItem('cyclePlans');

  const externalPlans: CyclePlanData[] = externalRaw ? JSON.parse(externalRaw) : [];
  let internalPlans: CyclePlanData[] = internalRaw ? JSON.parse(internalRaw) : [];

  // Seed: any published external plan not yet in internal gets added automatically
  externalPlans.forEach(ext => {
   if (!internalPlans.find(i => i.qualificationCode === ext.qualificationCode)) {
      internalPlans.push(ext);
    }
  });

  // Persist the seeded internal plans so they survive the next read
  if (internalPlans.length > 0) {
    localStorage.setItem('internalCyclePlans', JSON.stringify(internalPlans));
  }

  const merged: CyclePlanData[] = internalPlans.map(internal => {
    const external = externalPlans.find(e => e.qualificationCode === internal.qualificationCode);
    if (!external) return internal;
    return { ...internal, phases: mergePhases(internal.phases, external.phases) };
  });

  // Add external plans not yet in internal (shouldn't happen after seed, but safety net)
  externalPlans.forEach(ext => {
    if (!merged.find(m => m.qualificationCode === ext.qualificationCode)) {
      merged.push(ext);
    }
  });

  return merged;
}

// Build DevelopmentProject[] from merged plans + submitted reports + apps
function buildProjects(
  plans: CyclePlanData[],
  reports: any[],
  applications: Application[]
): DevelopmentProject[] {
  const resolutionRaw = localStorage.getItem('resolutionProjects');
  const resolvedCodes: string[] = resolutionRaw
    ? JSON.parse(resolutionRaw).map((r: any) => r.qualificationCode)
    : [];

  return plans
    .filter(plan => !resolvedCodes.includes(plan.qualificationCode))
    .map(plan => {
      const phasesWithReports: Phase[] = plan.phases.map(phase => {
        // Find report for this phase
        const report = reports.find(
          r => r.qualificationCode === plan.qualificationCode && r.phaseName === phase.name
        );
        
        // Determine if report is submitted (from either phase or report storage)
        const hasReportSubmitted = !!report || phase.reportSubmitted === true;
        const isApproved = report?.status === 'approved' || phase.approved === true;
        
        return {
          ...phase,
          reportSubmitted: hasReportSubmitted,
          approved: isApproved,
          reportData: report?.reportData || phase.reportData,
          status: (isApproved || hasReportSubmitted)
            ? ('completed' as const)
            : phase.status,
        };
      });

      const completedCount = phasesWithReports.filter(
        p => p.status === 'completed' || p.approved === true || p.reportSubmitted === true
      ).length;
      const progress = plan.phases.length > 0
        ? (completedCount / plan.phases.length) * 100
        : 0;

      // Find the phase that needs attention (pending review first, then in-progress)
      const pendingReviewPhase = phasesWithReports.find(p => p.reportSubmitted && !p.approved);
      const inProgressPhase = phasesWithReports.find(p => p.status === 'in-progress' && !p.reportSubmitted);
      const displayPhase = pendingReviewPhase || inProgressPhase || phasesWithReports[0];

      const app = applications.find(a => a.id === plan.qualificationCode);

      return {
        id:                 plan.qualificationCode,
        qualificationTitle: plan.qualificationTitle,
        currentPhase:       displayPhase?.name || 'Not Started',
        phaseStatus:        pendingReviewPhase ? 'pending-review' : (displayPhase?.status || 'pending') as 'pending' | 'in-progress' | 'completed',
        progress,
        startDate:          plan.startDate,
        targetDate:         plan.endDate,
        status:             'active' as const,
        documents: {
          applicationLetter:  app?.documents?.applicationLetter || '',
          motivation:         app?.documents?.motivation        || '',
          reference:          app?.documents?.reference        || '',
          acrLetter:          app?.documents?.acrLetter        || '',
          other:              app?.documents?.other            || '',
          resolutionDocument: app?.evaluationSummary?.resolutionUploaded || '',
          approvalLetter:     app?.evaluationSummary?.approvalLetter      || '',
        },
        phases:          phasesWithReports,
        applicationData: app,
      };
    });
}

export default function DevelopmentWorkspace() {
  const [activeSubTab, setActiveSubTab]       = useState<'development' | 'resolution'>('development');
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [selectedProject, setSelectedProject] = useState<DevelopmentProject | null>(null);
  const [developmentProjects, setDevelopmentProjects] = useState<DevelopmentProject[]>([]);
  const [refreshTrigger, setRefreshTrigger]   = useState(0);

  const loadRef = useRef<() => void>(() => {});

  const loadAllData = useCallback(() => {
    const apps     = getApplications();
    const plans    = getMergedPlans();
    const reports  = localStorage.getItem('submittedPhaseReports');
    const parsed   = reports ? JSON.parse(reports) : [];
    const projects = buildProjects(plans, parsed, apps);

    setDevelopmentProjects(projects);
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => { loadRef.current = loadAllData; }, [loadAllData]);
  useEffect(() => { loadAllData(); }, [loadAllData]);

  // Single unified storage listener
  useEffect(() => {
    const KEYS = new Set(['cyclePlans','internalCyclePlans','submittedPhaseReports','resolutionProjects','phaseReportSync']);
    const onStorage = (e: StorageEvent) => { if (e.key && KEYS.has(e.key)) loadRef.current(); };
    const onCustom  = () => loadRef.current();

    window.addEventListener('storage',          onStorage);
    window.addEventListener('refreshWorkspace', onCustom);
    return () => {
      window.removeEventListener('storage',          onStorage);
      window.removeEventListener('refreshWorkspace', onCustom);
    };
  }, []);

  // Polling fallback — catches same-tab writes (synthetic StorageEvents can be
  // unreliable in some browsers/bundlers)
useEffect(() => {
  const id = setInterval(() => {
    if (!isModalOpen && activeSubTab === 'development') loadRef.current();
  }, 2000);
  return () => clearInterval(id);
}, [isModalOpen, activeSubTab]);

  const handleViewProject = (project: DevelopmentProject) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

 const handleCloseModal = () => {
  setIsModalOpen(false);
  setSelectedProject(null);
  
  // Check if any project just moved to resolution and switch tab
  const resolutions = localStorage.getItem('resolutionProjects');
  if (resolutions) {
    const parsed = JSON.parse(resolutions);
    const justMoved = parsed.some((r: any) => 
      developmentProjects.some(p => p.id === r.qualificationCode)
    );
    if (justMoved) setActiveSubTab('resolution');
  }
  
  loadAllData();
};

  const getPhaseBadge = (status: string, reportSubmitted?: boolean, approved?: boolean) => {
    if (approved)        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>;
    if (reportSubmitted) return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Review</span>;
    switch (status) {
      case 'completed':   return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'in-progress': return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><RefreshCw className="w-3 h-3" /> In Progress</span>;
      default:            return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  const pendingReviewCount = developmentProjects.filter(p =>
    p.phases.some(ph => ph.reportSubmitted === true && !ph.approved)
  ).length;

  const completedPhasesCount = developmentProjects.reduce(
    (acc, p) => acc + p.phases.filter(ph => ph.status === 'completed' || ph.approved === true).length, 0
  );

  const avgProgress = Math.round(
    developmentProjects.reduce((acc, p) => acc + p.progress, 0) / (developmentProjects.length || 1)
  ) || 0;

  return (
      <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Active Projects</p><p className="text-2xl font-bold">{developmentProjects.length}</p></div>
            <div className="p-2 bg-orange-100 rounded-lg"><GitBranch className="w-5 h-5 text-orange-600" /></div>
          </div>
          <div className="mt-2 text-xs text-gray-500">{developmentProjects.filter(p => p.phaseStatus === 'in-progress').length} in progress</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Pending Review</p><p className="text-2xl font-bold">{pendingReviewCount}</p></div>
            <div className="p-2 bg-yellow-100 rounded-lg"><Eye className="w-5 h-5 text-yellow-600" /></div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Awaiting approval</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Completed Phases</p><p className="text-2xl font-bold">{completedPhasesCount}</p></div>
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
          </div>
          <div className="mt-2 text-xs text-gray-500">This cycle</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">On Track</p><p className="text-2xl font-bold">{avgProgress}%</p></div>
            <div className="p-2 bg-blue-100 rounded-lg"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Average completion</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button onClick={() => setActiveSubTab('development')} className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeSubTab === 'development' ? 'text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <div className="flex items-center gap-2"><GitBranch className="w-4 h-4" />Qualifications Development Phase ({developmentProjects.length})</div>
            {activeSubTab === 'development' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600" />}
          </button>
          <button onClick={() => setActiveSubTab('resolution')} className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeSubTab === 'resolution' ? 'text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}>
            <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4" />Resolution Phase</div>
            {activeSubTab === 'resolution' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600" />}
          </button>
        </div>
      </div>

      {/* Development tab */}
      {activeSubTab === 'development' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search projects..." className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full" />
            </div>
            <select className="border rounded-lg px-3 py-2 text-sm">
              <option value="">All Phases</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <button onClick={loadAllData} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            {developmentProjects.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No development projects yet</p>
                <p className="text-sm mt-1">Projects appear here once a cycle plan is published on the external side.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Qualification ID','Qualification Title','Current Phase','Progress','Timeline','Status','Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200" key={refreshTrigger}>
                    {developmentProjects.map(project => {
                      const pendingPhase = project.phases.find(p => p.reportSubmitted && !p.approved);
                      const inProgPhase  = project.phases.find(p => p.status === 'in-progress');
                      const displayPhase = pendingPhase || inProgPhase ||
                        project.phases.find(p => p.name === project.currentPhase) ||
                        project.phases[0];

                      return (
                        <tr key={project.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{project.id}</td>
                          <td className="px-4 py-3 text-sm">{project.qualificationTitle}</td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500">{displayPhase?.name}</p>
                              {getPhaseBadge(displayPhase?.status || 'pending', displayPhase?.reportSubmitted, displayPhase?.approved)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${project.progress}%` }} />
                              </div>
                              <span className="text-xs">{Math.round(project.progress)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-1"><Calendar className="w-3 h-3 text-gray-400" /><span>Start: {project.startDate}</span></div>
                            <div className="text-xs text-gray-500">End: {project.targetDate}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{project.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleViewProject(project)} className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'resolution' && <ResolutionPhase />}

      <DevelopmentProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        project={selectedProject}
        mode={activeSubTab}
      />
    </div>
  );
}