// components/qualifications/CyclePlan.tsx
import React, { useState } from 'react';
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
  X
} from "lucide-react";
import CyclePlanModal from '@/components/modals/CyclePlanModal';

interface Phase {
  name: string;
  startDate: string;
  endDate: string;
  responsibleRole: string;
  status: 'pending' | 'in-progress' | 'completed';
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
}

const cyclePlans: CyclePlan[] = [
  {
    id: 1,
    title: "National Diploma: Information Technology",
    qualificationCode: "ND-IT-2024",
    industry: "Information Technology",
    nqfLevel: "6",
    startDate: "2024-01-15",
    endDate: "2024-12-20",
    status: "In Progress",
    phases: [
      { name: "Scoping", startDate: "2024-01-15", endDate: "2024-02-15", responsibleRole: "Curriculum Developer", status: "completed" },
      { name: "Profile", startDate: "2024-02-16", endDate: "2024-03-30", responsibleRole: "Subject Matter Expert", status: "completed" },
      { name: "Curriculum Specification", startDate: "2024-04-01", endDate: "2024-06-30", responsibleRole: "Instructional Designer", status: "in-progress" },
      { name: "Knowledge & Practice", startDate: "2024-07-01", endDate: "2024-09-30", responsibleRole: "Assessment Specialist", status: "pending" },
    ]
  },
  {
    id: 2,
    title: "Bachelor of Engineering: Electrical",
    qualificationCode: "BE-ELEC-2024",
    industry: "Engineering",
    nqfLevel: "7",
    startDate: "2024-02-01",
    endDate: "2025-03-30",
    status: "Planning",
    phases: [
      { name: "Scoping", startDate: "2024-02-01", endDate: "2024-03-15", responsibleRole: "Curriculum Developer", status: "completed" },
      { name: "Profile", startDate: "2024-03-16", endDate: "2024-05-30", responsibleRole: "Subject Matter Expert", status: "pending" },
      { name: "Curriculum Specification", startDate: "2024-06-01", endDate: "2024-08-30", responsibleRole: "Instructional Designer", status: "pending" },
      { name: "Knowledge & Practice", startDate: "2024-09-01", endDate: "2024-12-20", responsibleRole: "Assessment Specialist", status: "pending" },
    ]
  },
  {
    id: 3,
    title: "Certificate: Project Management",
    qualificationCode: "CERT-PM-2024",
    industry: "Business Management",
    nqfLevel: "5",
    startDate: "2024-03-10",
    endDate: "2024-09-15",
    status: "Completed",
    phases: [
      { name: "Scoping", startDate: "2024-03-10", endDate: "2024-03-30", responsibleRole: "Curriculum Developer", status: "completed" },
      { name: "Profile", startDate: "2024-04-01", endDate: "2024-04-30", responsibleRole: "Subject Matter Expert", status: "completed" },
      { name: "Curriculum Specification", startDate: "2024-05-01", endDate: "2024-06-30", responsibleRole: "Instructional Designer", status: "completed" },
      { name: "Knowledge & Practice", startDate: "2024-07-01", endDate: "2024-08-15", responsibleRole: "Assessment Specialist", status: "completed" },
    ]
  }
];

export default function QualificationCyclePlan() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CyclePlan | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  const handleCreatePlan = () => {
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
    setSelectedPlan(plan);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  const handleSavePlan = (planData: Partial<CyclePlan>) => {
    console.log('Saving plan:', planData);
    // Here you would typically save to your backend
    handleCloseModal();
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

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Qualification Cycle Plans</h3>
          <p className="text-sm text-gray-500">Manage and track qualification development cycles</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1">
            Active Cycles: {cyclePlans.length}
          </Badge>
          <button
            onClick={handleCreatePlan}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Cycle Plan
          </button>
        </div>
      </div>

      {/* Cycle Plans Grid */}
      <div className="grid gap-4">
        {cyclePlans.map((plan) => (
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
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Edit Plan"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
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

      {/* Cycle Plan Modal */}
      <CyclePlanModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePlan}
        plan={selectedPlan}
        mode={modalMode}
      />
    </div>
  );
}