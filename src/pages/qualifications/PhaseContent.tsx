// components/qualifications/PhaseContent.tsx
import React, { useState,useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  FileText, 
  Users, 
  Calendar,
  Send,
  Download,
  Eye,
  Clock,
  CheckSquare,
  Trash2,
  Upload,
  Lock,
  Play
} from "lucide-react";
import PhaseModal from '@/components/modals/PhaseModal';

interface Phase {
  name: string;
  startDate: string;
  endDate: string;
  responsibleRole: string;
  status: 'pending' | 'in-progress' | 'completed';
  completedDate?: string;
  approved?: boolean;
  reportSubmitted?: boolean;
  reportData?: any;
}

interface PhaseContentProps {
  phase: Phase;
  qualificationCode: string;
  qualificationTitle: string;
  isLastPhase: boolean;
  allPhases: Phase[];
  onPhaseStatusUpdate?: (phaseName: string, newStatus: 'pending' | 'in-progress' | 'completed') => void;
}

// Phase-specific content based on original design
const getPhaseDetails = (phaseName: string) => {
  const details: Record<string, { description: string; tasks: { name: string; status: string }[] }> = {
    'Scoping': {
      description: "Define the scope and boundaries of the qualification",
      tasks: [
        { name: "Define qualification purpose", status: "pending" },
        { name: "Identify target audience", status: "pending" },
        { name: "Determine NQF level", status: "pending" },
        { name: "Set credit values", status: "pending" },
      ]
    },
    'Profile': {
      description: "Develop the qualification profile and learning outcomes",
      tasks: [
        { name: "Define exit level outcomes", status: "pending" },
        { name: "Develop associated assessment criteria", status: "pending" },
        { name: "Map critical cross-field outcomes", status: "pending" },
      ]
    },
    'Curriculum Specification': {
      description: "Develop detailed curriculum specifications",
      tasks: [
        { name: "Design module structure", status: "pending" },
        { name: "Develop learning content", status: "pending" },
        { name: "Create assessment guidelines", status: "pending" },
      ]
    },
    'Knowledge & Practice': {
      description: "Define knowledge, practice, and workplace requirements",
      tasks: [
        { name: "Identify theoretical knowledge components", status: "pending" },
        { name: "Define practical skills requirements", status: "pending" },
        { name: "Specify workplace learning needs", status: "pending" },
      ]
    },
    'Qualification Document': {
      description: "Compile the complete qualification document",
      tasks: [
        { name: "Draft qualification document", status: "pending" },
        { name: "Include all phase outputs", status: "pending" },
        { name: "Review document completeness", status: "pending" },
      ]
    },
    'Final Verification': {
      description: "Final verification and approval process",
      tasks: [
        { name: "Internal verification", status: "pending" },
        { name: "External verification", status: "pending" },
        { name: "Final approval", status: "pending" },
        { name: "Qualification registration", status: "pending" },
      ]
    }
  };
  return details[phaseName] || { description: "Complete the requirements for this phase", tasks: [] };
};

export default function PhaseContent({ phase, qualificationCode, qualificationTitle, isLastPhase, allPhases, onPhaseStatusUpdate }: PhaseContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [phaseData, setPhaseData] = useState({
    objectives: phase.reportData?.objectives || '',
    findings: phase.reportData?.findings || '',
    deliverables: phase.reportData?.deliverables || [] as string[],
    documents: phase.reportData?.documents || [] as { name: string; url: string }[]
  });

  const phaseDetails = getPhaseDetails(phase.name);
  
  // Calculate if this phase can be edited (previous phase must be approved)
  const currentIndex = allPhases.findIndex(p => p.name === phase.name);
  const previousPhase = currentIndex > 0 ? allPhases[currentIndex - 1] : null;
  const canEdit = !phase.reportSubmitted && (!previousPhase || previousPhase.approved === true);
  const isLocked = (phase.reportSubmitted || phase.status === 'completed') || (!canEdit && currentIndex > 0 && !previousPhase?.approved);
  
  // Calculate progress based on tasks
  const completedTasks = phaseDetails.tasks.filter(t => t.status === 'completed').length;
  const progress = phaseDetails.tasks.length > 0 ? (completedTasks / phaseDetails.tasks.length) * 100 : 0;
  

  // In PhaseContent.tsx - add this useEffect to listen for updates
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'cyclePlans' && e.newValue) {
      const plans = JSON.parse(e.newValue);
      const updatedPlan = plans.find((p: any) => p.qualificationCode === qualificationCode);
      if (updatedPlan) {
        const updatedPhase = updatedPlan.phases.find((p: Phase) => p.name === phase.name);
        if (updatedPhase && (updatedPhase.reportSubmitted !== phase.reportSubmitted || updatedPhase.status !== phase.status)) {
          // Force refresh by reloading or updating state
          window.location.reload();
        }
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, [phase, qualificationCode]);

  const handleStartPhase = () => {
    setIsStarting(true);
    // Update local phase status
    const updatedPhase = { ...phase, status: 'in-progress' as const };
    
    // Update localStorage for cyclePlans
    const cyclePlans = localStorage.getItem('cyclePlans');
    if (cyclePlans) {
      const plans = JSON.parse(cyclePlans);
      const updatedPlans = plans.map((plan: any) => {
        if (plan.qualificationCode === qualificationCode) {
          const updatedPhases = plan.phases.map((p: Phase) => 
            p.name === phase.name ? { ...p, status: 'in-progress' } : p
          );
          return { ...plan, phases: updatedPhases };
        }
        return plan;
      });
      localStorage.setItem('cyclePlans', JSON.stringify(updatedPlans));
      
      // Also update internalCyclePlans for internal side
      const internalPlans = localStorage.getItem('internalCyclePlans');
      if (internalPlans) {
        const internal = JSON.parse(internalPlans);
        const updatedInternal = internal.map((plan: any) => {
          if (plan.qualificationCode === qualificationCode) {
            const updatedPhases = plan.phases.map((p: Phase) => 
              p.name === phase.name ? { ...p, status: 'in-progress' } : p
            );
            return { ...plan, phases: updatedPhases };
          }
          return plan;
        });
        localStorage.setItem('internalCyclePlans', JSON.stringify(updatedInternal));
      }
      
      // Dispatch storage events to notify other tabs/components
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'cyclePlans',
        newValue: JSON.stringify(updatedPlans)
      }));
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'internalCyclePlans',
        newValue: localStorage.getItem('internalCyclePlans')
      }));
    }
    
    // Call parent callback if provided
    if (onPhaseStatusUpdate) {
      onPhaseStatusUpdate(phase.name, 'in-progress');
    }
    
    setIsStarting(false);
    // Reload page to reflect changes
    window.location.reload();
  };

  const handleViewDetails = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSavePhaseData = (updatedData: any) => {
    setPhaseData(updatedData);
  };

 // In PhaseContent.tsx - update getStatusBadge
const getStatusBadge = () => {
  if (phase.approved) {
    return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
  }
  if (phase.reportSubmitted) {
    return <Badge className="bg-purple-100 text-purple-700">Submitted - Pending Review</Badge>;
  }
  if (phase.status === 'in-progress') {
    return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>;
  }
  if (isLocked) {
    return <Badge className="bg-gray-100 text-gray-500 flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</Badge>;
  }
  if (phase.status === 'pending' && (!previousPhase || previousPhase.approved === true)) {
    return <Badge className="bg-yellow-100 text-yellow-700">Not Started</Badge>;
  }
  return <Badge variant="outline">Not Started</Badge>;
};

  const canStart = phase.status === 'pending' && (!previousPhase || previousPhase.approved === true) && !isLocked;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{phase.name}</CardTitle>
              <CardDescription className="mt-1">
                {phaseDetails.description}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Phase Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Start: {phase.startDate || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>End: {phase.endDate || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Responsible: {phase.responsibleRole}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Phase Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Tasks Section */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Tasks
              </h3>
              <ul className="space-y-2">
                {phaseDetails.tasks.map((task, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {task.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : task.status === "in-progress" ? (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-300" />
                      )}
                      {task.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {task.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>

            {/* Assigned Team */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Assigned Team
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Lead Developer:</span>
                  <span className="font-medium">Dr. Sarah Johnson</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Subject Matter Expert:</span>
                  <span className="font-medium">Prof. Michael Chen</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Quality Assurer:</span>
                  <span className="font-medium">Ms. Lisa Williams</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              {canStart && phase.status === 'pending' && (
                <Button 
                  onClick={handleStartPhase} 
                  disabled={isStarting}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {isStarting ? 'Starting...' : 'Start Phase'}
                </Button>
              )}
              {(phase.status === 'in-progress' || phase.status === 'pending') && !phase.reportSubmitted && !phase.approved && (
                <Button variant="outline" onClick={handleViewDetails}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              )}
            </div>

            {/* Locked/Status Message */}
            {isLocked && !phase.reportSubmitted && phase.status !== 'completed' && (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-700 text-sm">
                  <Lock className="w-4 h-4" />
                  <span>This phase is locked until the previous phase is approved by the internal team.</span>
                </div>
              </div>
            )}

            {phase.reportSubmitted && !phase.approved && (
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Phase report submitted and awaiting internal approval.</span>
                </div>
              </div>
            )}

            {phase.approved && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Phase approved! {!isLastPhase && "You can now proceed to the next phase."}</span>
                </div>
              </div>
            )}

            {phase.status === 'in-progress' && !phase.reportSubmitted && !phase.approved && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 text-sm">
                  <Play className="w-4 h-4" />
                  <span>Phase is in progress. Complete the report and submit for approval when ready.</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Phase Modal */}
      <PhaseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePhaseData}
       phase={phase} 
        phaseData={phaseData}
        qualificationCode={qualificationCode}
        qualificationTitle={qualificationTitle}
        isLocked={isLocked}
        isLastPhase={isLastPhase}
      />
    </div>
  );
}