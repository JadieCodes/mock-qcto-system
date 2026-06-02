// components/qualifications/QualificationCyclePlan.tsx
import React, { useState, useEffect } from 'react';
import { getApplications, updateApplication } from '@/lib/applicationStorage';
import type { Application } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Edit,
  Eye,
  Save,
  Upload,
  FileText
} from "lucide-react";
import CyclePlanModal from '@/components/modals/CyclePlanModal';

interface Phase {
  name: string;
  startDate: string;
  endDate: string;
  responsibleRole: string;
  status: 'pending' | 'in-progress' | 'completed';
  completedDate?: string;
  submittedForReview?: boolean;
  approved?: boolean;
  required?: boolean;
}

interface CyclePlan {
  id: number;
  title: string;
  qualificationCode: string;
  industry: string;
  nqfLevel: string;
  startDate: string;
  endDate: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'Published';
  phases: Phase[];
  // applicationData stores the full Application object at the time of cycle plan creation,
  // including evaluationSummary, acknowledgementLetter, and outcomeLetter so that
  // the CyclePlanModal can display the Evaluation Outcome tab for DEVELOP applications.
  applicationData?: Application;
  publishedAt?: string;
}

export default function QualificationCyclePlan() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CyclePlan | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedCyclePlans, setSavedCyclePlans] = useState<CyclePlan[]>([]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cyclePlans' && e.newValue) {
        setSavedCyclePlans(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const apps = getApplications();
    setApplications(apps);
    const savedPlans = localStorage.getItem('cyclePlans');
    if (savedPlans) {
      try {
        setSavedCyclePlans(JSON.parse(savedPlans));
      } catch {
        setSavedCyclePlans([]);
      }
    }
  }, []);

  // Only DEVELOP applications that have been approved belong here
  const developmentWorkspaceApps = applications.filter(
    (app) => app.status === 'development_workspace'
  );

  // Plans that match a development_workspace application
  const existingCyclePlans = savedCyclePlans.filter(plan =>
    developmentWorkspaceApps.some(app => app.id === plan.qualificationCode)
  );

  // Development workspace apps that don't yet have a cycle plan
  const qualificationsWithoutPlan = developmentWorkspaceApps.filter(app =>
    !existingCyclePlans.some(plan => plan.qualificationCode === app.id)
  );

  // ── Helpers to resolve the Application object for a plan ──────────────────
  // When the cycle plan was saved, we stored applicationData on it. We also
  // refresh from live storage so the latest evaluation letters are always shown.
  const resolveApplicationForPlan = (plan: CyclePlan): Application | null => {
    // Try live storage first (most up-to-date)
    const liveApp = applications.find(a => a.id === plan.qualificationCode);
    if (liveApp) return liveApp;
    // Fall back to snapshot stored on the plan itself
    return (plan.applicationData as Application) ?? null;
  };

  // ── Modal open handlers ───────────────────────────────────────────────────

  const handleCreatePlanForQualification = (app: Application) => {
    setSelectedApplication(app);
    setSelectedPlan(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleViewPlan = (plan: CyclePlan) => {
    setSelectedPlan(plan);
    // Pass the resolved application so the Evaluation Outcome tab is populated
    setSelectedApplication(resolveApplicationForPlan(plan));
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditPlan = (plan: CyclePlan) => {
    if (plan.status === 'Published') {
      alert('Published cycle plans cannot be edited.');
      return;
    }
    setSelectedPlan(plan);
    setSelectedApplication(resolveApplicationForPlan(plan));
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
    setSelectedApplication(null);
    // Refresh applications in case evaluation data was updated externally
    setApplications(getApplications());
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSavePlan = (planData: Partial<CyclePlan>) => {
    let updatedPlans: CyclePlan[];

    if (modalMode === 'create') {
      // Snapshot the full application object (including all evaluation letters) onto the plan
      const appSnapshot = selectedApplication ?? undefined;
      const newPlan: CyclePlan = {
        id: Date.now(),
        title: planData.title || selectedApplication?.qualification || '',
        qualificationCode: planData.qualificationCode || selectedApplication?.id || '',
        industry: planData.industry || '',
        nqfLevel: planData.nqfLevel || '',
        startDate: planData.startDate || '',
        endDate: planData.endDate || '',
        status: planData.status || 'Planning',
        phases: planData.phases || [],
        applicationData: appSnapshot
      };
      updatedPlans = [...savedCyclePlans, newPlan];
      if (planData.status === 'Published') updateInternalWorkspace(newPlan);
    } else if (modalMode === 'edit' && selectedPlan) {
      // Keep existing applicationData snapshot; it already has the evaluation letters
      const updatedPlan: CyclePlan = {
        ...selectedPlan,
        ...planData,
        applicationData: selectedPlan.applicationData
      };
      updatedPlans = savedCyclePlans.map(p => p.id === selectedPlan.id ? updatedPlan : p);
      if (planData.status === 'Published') updateInternalWorkspace(updatedPlan);
    } else {
      updatedPlans = savedCyclePlans;
    }

    setSavedCyclePlans(updatedPlans);
    localStorage.setItem('cyclePlans', JSON.stringify(updatedPlans));
    handleCloseModal();
  };

  const updateInternalWorkspace = (plan: CyclePlan) => {
    const raw = localStorage.getItem('internalCyclePlans') || '[]';
    const parsed = JSON.parse(raw);
    const idx = parsed.findIndex((p: any) => p.qualificationCode === plan.qualificationCode);
    const entry = {
      qualificationCode: plan.qualificationCode,
      qualificationTitle: plan.title,
      phases: plan.phases,
      startDate: plan.startDate,
      endDate: plan.endDate,
      publishedAt: new Date().toISOString(),
      status: 'active',
      applicationId: plan.applicationData?.id
    };
    if (idx >= 0) { parsed[idx] = entry; } else { parsed.push(entry); }
    localStorage.setItem('internalCyclePlans', JSON.stringify(parsed));
    window.dispatchEvent(new StorageEvent('storage', { key: 'internalCyclePlans', newValue: JSON.stringify(parsed) }));
  };

  const handlePhaseComplete = (planId: number, phaseIndex: number, phaseData: Partial<Phase>) => {
    const updatedPlans = savedCyclePlans.map(plan => {
      if (plan.id === planId) {
        const updatedPhases = [...plan.phases];
        updatedPhases[phaseIndex] = { ...updatedPhases[phaseIndex], ...phaseData };
        const allCompleted = updatedPhases.every(p => p.status === 'completed');
        const newStatus = allCompleted ? 'Completed' : plan.status;
        updateInternalWorkspace({ ...plan, phases: updatedPhases, status: newStatus });
        return { ...plan, phases: updatedPhases, status: newStatus };
      }
      return plan;
    });
    setSavedCyclePlans(updatedPlans);
    localStorage.setItem('cyclePlans', JSON.stringify(updatedPlans));
  };

  // ── Display helpers ───────────────────────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':   return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Planning':    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Published':   return 'bg-purple-100 text-purple-800 border-purple-200';
      default:            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPhaseStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':  return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-500" />;
      default:           return <Circle className="h-4 w-4 text-gray-300" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Qualification Development Plan</h3>
          <p className="text-sm text-gray-500">Manage and track qualification development cycles</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1">
            Active Cycles: {existingCyclePlans.length}
          </Badge>
        </div>
      </div>

      {/* Qualifications ready to get a cycle plan */}
      {qualificationsWithoutPlan.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">Qualifications Ready for Cycle Plan</h4>
          <div className="grid gap-3">
            {qualificationsWithoutPlan.map((app) => {
              const hasEval = !!(app as any).evaluationSummary?.evaluationApplications;
              const hasOutcome = !!(app as any).outcomeLetter?.sent;
              return (
                <Card key={app.id} className="hover:shadow-md transition-shadow border-dashed border-2 border-blue-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{app.qualification}</CardTitle>
                          <span className="text-xs text-gray-500">({app.id})</span>
                          {hasEval && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                              Evaluation Complete
                            </span>
                          )}
                          {hasOutcome && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              Approval Letter Sent
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 flex-wrap">
                          <p className="text-sm text-gray-500">Submitted: {app.submissionDate}</p>
                          <p className="text-sm text-gray-500">Type: {app.qualificationType} / {app.actionType}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCreatePlanForQualification(app)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        Create Cycle Plan
                      </button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Existing cycle plans */}
      {existingCyclePlans.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">Active Qualification Development Plans</h4>
          <div className="grid gap-4">
            {existingCyclePlans.map((plan) => {
              const resolvedApp = resolveApplicationForPlan(plan);
              const hasEvalData = !!(resolvedApp as any)?.evaluationSummary?.evaluationApplications;
              return (
                <Card key={plan.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{plan.title}</CardTitle>
                          <span className="text-xs text-gray-500">({plan.qualificationCode})</span>
                          {hasEvalData && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                              Eval Data Available
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-gray-500">Industry: {plan.industry}</p>
                          <p className="text-sm text-gray-500">NQF Level: {plan.nqfLevel}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(plan.status)} border`}>{plan.status}</Badge>
                        <button onClick={() => handleViewPlan(plan)} className="p-1 hover:bg-gray-100 rounded" title="View Details">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        {plan.status !== 'Published' && (
                          <button onClick={() => handleEditPlan(plan)} className="p-1 hover:bg-gray-100 rounded" title="Edit Plan">
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /><span>Start: {plan.startDate}</span></div>
                      <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>End: {plan.endDate}</span></div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Development Phases:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {plan.phases.map((phase, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            {getPhaseStatusIcon(phase.status)}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{phase.name}</p>
                              <p className="text-xs text-gray-500">{phase.responsibleRole}</p>
                            </div>
                            <span className="text-xs text-gray-400">{phase.endDate}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Progress:</span>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${plan.phases.length > 0 ? (plan.phases.filter(p => p.status === 'completed').length / plan.phases.length) * 100 : 0}%` }}
                          />
                        </div>
                        <span>{plan.phases.filter(p => p.status === 'completed').length}/{plan.phases.length} phases</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {developmentWorkspaceApps.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No qualifications available for cycle planning.</p>
          <p className="text-sm text-gray-400">Qualifications will appear here once a DEVELOP application has been approved.</p>
        </div>
      )}

      <CyclePlanModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePlan}
        onPhaseComplete={handlePhaseComplete}
        plan={selectedPlan}
        application={selectedApplication}
        mode={modalMode}
      />
    </div>
  );
}