// components/qualifications/CyclePlan.tsx
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
  Trash2,
  Eye,
  Save,
  Upload,
  X,
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


  // In QualificationCyclePlan.tsx, add an effect to listen for storage changes
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'cyclePlans' && e.newValue) {
      const updatedPlans = JSON.parse(e.newValue);
      setSavedCyclePlans(updatedPlans);
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
  useEffect(() => {
    setApplications(getApplications());
    // Load saved cycle plans from localStorage
    const savedPlans = localStorage.getItem('cyclePlans');
    if (savedPlans) {
      setSavedCyclePlans(JSON.parse(savedPlans));
    }
  }, []);

  const developmentWorkspaceApps = applications.filter(
    (app) => app.status === 'development_workspace'
  );

  // Get existing cycle plans for qualifications (excluding dynamic ones)
  const existingCyclePlans = savedCyclePlans.filter(plan => 
    developmentWorkspaceApps.some(app => app.id === plan.qualificationCode)
  );

  // Get qualifications that don't have a cycle plan yet
  const qualificationsWithoutPlan = developmentWorkspaceApps.filter(app => 
    !existingCyclePlans.some(plan => plan.qualificationCode === app.id)
  );

  const handleCreatePlanForQualification = (app: Application) => {
    setSelectedApplication(app);
    setSelectedPlan(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleViewPlan = (plan: CyclePlan) => {
    setSelectedPlan(plan);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditPlan = (plan: CyclePlan) => {
    // Only allow editing if not published
    if (plan.status === 'Published') {
      alert('Published cycle plans cannot be edited.');
      return;
    }
    setSelectedPlan(plan);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
    setSelectedApplication(null);
  };

  const handleSavePlan = (planData: Partial<CyclePlan>) => {
    let updatedPlans: CyclePlan[];
    
    if (modalMode === 'create') {
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
        applicationData: selectedApplication || planData.applicationData
      };
      updatedPlans = [...savedCyclePlans, newPlan];
      
      // If publishing immediately, update internal workspace
      if (planData.status === 'Published') {
        updateInternalWorkspace(newPlan);
      }
    } else if (modalMode === 'edit' && selectedPlan) {
      const updatedPlan = { ...selectedPlan, ...planData };
      updatedPlans = savedCyclePlans.map(p => 
        p.id === selectedPlan.id ? updatedPlan : p
      );
      
      // If publishing, update internal workspace
      if (planData.status === 'Published') {
        updateInternalWorkspace(updatedPlan);
      }
    } else {
      updatedPlans = savedCyclePlans;
    }
    
    setSavedCyclePlans(updatedPlans);
    localStorage.setItem('cyclePlans', JSON.stringify(updatedPlans));
    
    handleCloseModal();
  };

  // In CyclePlan.tsx - Update the updateInternalWorkspace function
const updateInternalWorkspace = (plan: CyclePlan) => {
  // Store the cycle plan data for internal side to read
  const internalCyclePlans = localStorage.getItem('internalCyclePlans') || '[]';
  const parsed = JSON.parse(internalCyclePlans);
  const existingIndex = parsed.findIndex((p: any) => p.qualificationCode === plan.qualificationCode);
  
  // Preserve all phases exactly as defined in the cycle plan
  const planForInternal = {
    qualificationCode: plan.qualificationCode,
    qualificationTitle: plan.title,
    phases: plan.phases, // This preserves all custom phases including Final Verification
    startDate: plan.startDate,
    endDate: plan.endDate,
    publishedAt: new Date().toISOString(),
    status: 'active',
    applicationId: plan.applicationData?.id
  };
  
  if (existingIndex >= 0) {
    parsed[existingIndex] = planForInternal;
  } else {
    parsed.push(planForInternal);
  }
  
  localStorage.setItem('internalCyclePlans', JSON.stringify(parsed));
  
  // Trigger a storage event to notify internal side
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'internalCyclePlans',
    newValue: JSON.stringify(parsed)
  }));
};

  const handlePhaseComplete = (planId: number, phaseIndex: number, phaseData: Partial<Phase>) => {
    const updatedPlans = savedCyclePlans.map(plan => {
      if (plan.id === planId) {
        const updatedPhases = [...plan.phases];
        updatedPhases[phaseIndex] = { ...updatedPhases[phaseIndex], ...phaseData };
        
        // Check if all phases are completed
        const allCompleted = updatedPhases.every(p => p.status === 'completed');
        const newStatus = allCompleted ? 'Completed' : plan.status;
        
        // Update internal side
        updateInternalWorkspace({ ...plan, phases: updatedPhases, status: newStatus });
        
        return { ...plan, phases: updatedPhases, status: newStatus };
      }
      return plan;
    });
    
    setSavedCyclePlans(updatedPlans);
    localStorage.setItem('cyclePlans', JSON.stringify(updatedPlans));
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Planning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Published':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPhaseStatusIcon = (status: string) => {
    switch(status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-300" />;
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

      {/* Qualifications Without Cycle Plans - Show create button for each */}
      {qualificationsWithoutPlan.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">Qualifications Ready for Cycle Plan</h4>
          <div className="grid gap-3">
            {qualificationsWithoutPlan.map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow border-dashed border-2 border-blue-200">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{app.qualification}</CardTitle>
                        <span className="text-xs text-gray-500">({app.id})</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-gray-500">Submitted: {app.submissionDate}</p>
                        <p className="text-sm text-gray-500">Status: {app.status}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCreatePlanForQualification(app)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create Cycle Plan
                    </button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Existing Cycle Plans */}
      {existingCyclePlans.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">Active Qualification Development Plan</h4>
          <div className="grid gap-4">
            {existingCyclePlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{plan.title}</CardTitle>
                        <span className="text-xs text-gray-500">({plan.qualificationCode})</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-gray-500">Industry: {plan.industry}</p>
                        <p className="text-sm text-gray-500">NQF Level: {plan.nqfLevel}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(plan.status)} border`}>
                        {plan.status}
                      </Badge>
                      <button
                        onClick={() => handleViewPlan(plan)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      {plan.status !== 'Published' && (
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Edit Plan"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Dates */}
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      <span>Start: {plan.startDate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>End: {plan.endDate}</span>
                    </div>
                  </div>
                  
                  {/* Phases Progress */}
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

                  {/* Phase Timeline Preview */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Timeline:</span>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full"
                          style={{ 
                            width: `${(plan.phases.filter(p => p.status === 'completed').length / plan.phases.length) * 100}%` 
                          }}
                        />
                      </div>
                      <span>{plan.phases.filter(p => p.status === 'completed').length}/{plan.phases.length} phases</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No qualifications message */}
      {developmentWorkspaceApps.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No qualifications available for cycle planning.</p>
          <p className="text-sm text-gray-400">Qualifications will appear here once they are approved for development.</p>
        </div>
      )}

      {/* Cycle Plan Modal */}
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