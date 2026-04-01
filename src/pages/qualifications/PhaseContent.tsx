// components/qualifications/PhaseContent.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, AlertCircle, FileText, Users, Calendar } from "lucide-react";
import PhaseModal from '@/components/modals/PhaseModal';

interface PhaseContentProps {
  phaseId: string;
  phaseLabel: string;
}

const phaseDetails = {
  phase1: {
    description: "Overview of all development phases and their current status",
    progress: 45,
    startDate: "2024-04-01",
    endDate: "2024-04-30",
    responsiblePerson: "Dr. Sarah Johnson",
    tasks: [
      { name: "Review phase requirements", status: "completed" },
      { name: "Identify stakeholders", status: "completed" },
      { name: "Set phase timelines", status: "in-progress" },
      { name: "Allocate resources", status: "pending" },
    ]
  },
  phase2: {
    description: "Define the scope and boundaries of the qualification",
    progress: 30,
    startDate: "2024-04-15",
    endDate: "2024-05-15",
    responsiblePerson: "Prof. Michael Chen",
    tasks: [
      { name: "Define qualification purpose", status: "completed" },
      { name: "Identify target audience", status: "in-progress" },
      { name: "Determine NQF level", status: "pending" },
      { name: "Set credit values", status: "pending" },
    ]
  },
  phase3: {
    description: "Develop the qualification profile and learning outcomes",
    progress: 20,
    startDate: "2024-05-01",
    endDate: "2024-06-01",
    responsiblePerson: "Ms. Lisa Williams",
    tasks: [
      { name: "Define exit level outcomes", status: "in-progress" },
      { name: "Develop associated assessment criteria", status: "pending" },
      { name: "Map critical cross-field outcomes", status: "pending" },
    ]
  },
  phase4: {
    description: "Develop detailed curriculum specifications",
    progress: 15,
    startDate: "2024-06-01",
    endDate: "2024-07-15",
    responsiblePerson: "Dr. Emily Brown",
    tasks: [
      { name: "Design module structure", status: "in-progress" },
      { name: "Develop learning content", status: "pending" },
      { name: "Create assessment guidelines", status: "pending" },
    ]
  },
  phase5: {
    description: "Define knowledge, practice, and workplace requirements",
    progress: 10,
    startDate: "2024-07-01",
    endDate: "2024-08-15",
    responsiblePerson: "Mr. John Smith",
    tasks: [
      { name: "Identify theoretical knowledge components", status: "pending" },
      { name: "Define practical skills requirements", status: "pending" },
      { name: "Specify workplace learning needs", status: "pending" },
    ]
  },
  phase6: {
    description: "Compile the complete qualification document",
    progress: 5,
    startDate: "2024-08-01",
    endDate: "2024-09-15",
    responsiblePerson: "Dr. Sarah Johnson",
    tasks: [
      { name: "Draft qualification document", status: "pending" },
      { name: "Include all phase outputs", status: "pending" },
      { name: "Review document completeness", status: "pending" },
    ]
  },
  phase7: {
    description: "Quality Assurance System verification process",
    progress: 0,
    startDate: "2024-09-01",
    endDate: "2024-10-15",
    responsiblePerson: "Prof. Michael Chen",
    tasks: [
      { name: "Internal QAS review", status: "pending" },
      { name: "Address feedback", status: "pending" },
      { name: "Prepare for verification", status: "pending" },
    ]
  },
  phase8: {
    description: "Final verification and approval",
    progress: 0,
    startDate: "2024-10-01",
    endDate: "2024-11-30",
    responsiblePerson: "Dr. Sarah Johnson",
    tasks: [
      { name: "External verification", status: "pending" },
      { name: "Final approval", status: "pending" },
      { name: "Qualification registration", status: "pending" },
    ]
  }
};

export default function PhaseContent({ phaseId, phaseLabel }: PhaseContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const details = phaseDetails[phaseId as keyof typeof phaseDetails];

  const handleViewDetails = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{phaseLabel}</CardTitle>
              <CardDescription className="mt-1">
                {details.description}
              </CardDescription>
            </div>
            <Badge variant="outline" className="ml-2">
              {details.progress}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Phase Metadata */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Start: {details.startDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>End: {details.endDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Responsible: {details.responsiblePerson}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span className="font-medium">{details.progress}%</span>
              </div>
              <Progress value={details.progress} className="h-2" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {details.tasks.map((task, index) => (
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Assigned Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleViewDetails}>
                View Details
              </Button>
              <Button>Update Progress</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Modal */}
      <PhaseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        phaseId={phaseId}
        phaseLabel={phaseLabel}
      />
    </div>
  );
}