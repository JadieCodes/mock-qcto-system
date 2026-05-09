// pages/qualifications/PhaseDevelopment.tsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PhaseContent from './PhaseContent';
import { getApplications } from '@/lib/applicationStorage';
import type { Application } from '@/types';
import { CheckCircle } from "lucide-react";

interface CyclePlan {
  id: number;
  title: string;
  qualificationCode: string;
  phases: Phase[];
  status: string;
}

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

export default function PhaseDevelopment() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [cyclePlan, setCyclePlan] = useState<CyclePlan | null>(null);
  const [activePhase, setActivePhase] = useState<string>('');
  const [selectedQualificationCode, setSelectedQualificationCode] = useState<string>('');
  const [availableCyclePlans, setAvailableCyclePlans] = useState<CyclePlan[]>([]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cyclePlans' && e.newValue) {
        const updatedPlans = JSON.parse(e.newValue);
        if (selectedQualificationCode) {
          const updatedCyclePlan = updatedPlans.find((p: CyclePlan) => 
            p.qualificationCode === selectedQualificationCode
          );
          if (updatedCyclePlan) {
            setCyclePlan(updatedCyclePlan);
            // Update active phase if needed
            const firstActivePhase = updatedCyclePlan.phases.find((p: Phase) => p.status !== 'completed');
            if (firstActivePhase && activePhase === firstActivePhase.name) {
              setActivePhase(prev => prev);
            }
          }
        }
        setAvailableCyclePlans(updatedPlans);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [cyclePlan, selectedQualificationCode, activePhase]);

  useEffect(() => {
    setApplications(getApplications());
    
    // Load all cycle plans from localStorage
    const savedPlans = localStorage.getItem('cyclePlans');
    if (savedPlans) {
      const plans = JSON.parse(savedPlans);
      // Get only Published cycle plans
      const publishedPlans = plans.filter((p: CyclePlan) => p.status === 'Published');
      setAvailableCyclePlans(publishedPlans);
      
      // Auto-select the first published plan if available
      if (publishedPlans.length > 0 && !selectedQualificationCode) {
        setSelectedQualificationCode(publishedPlans[0].qualificationCode);
        setCyclePlan(publishedPlans[0]);
        // Set first pending or in-progress phase as active
        const firstActivePhase = publishedPlans[0].phases.find((p: Phase) => p.status !== 'completed');
        if (firstActivePhase) {
          setActivePhase(firstActivePhase.name);
        }
      }
    }
  }, []);

  // Handle qualification selection change
  const handleQualificationChange = (qualificationCode: string) => {
    setSelectedQualificationCode(qualificationCode);
    const selected = availableCyclePlans.find(p => p.qualificationCode === qualificationCode);
    if (selected) {
      setCyclePlan(selected);
      const firstActivePhase = selected.phases.find((p: Phase) => p.status !== 'completed');
      if (firstActivePhase) {
        setActivePhase(firstActivePhase.name);
      } else if (selected.phases.length > 0) {
        setActivePhase(selected.phases[0].name);
      }
    }
  };

  const handlePhaseStatusUpdate = (phaseName: string, newStatus: 'pending' | 'in-progress' | 'completed') => {
    if (cyclePlan) {
      const updatedPhases = cyclePlan.phases.map(p =>
        p.name === phaseName ? { ...p, status: newStatus } : p
      );
      
      const updatedCyclePlan = { ...cyclePlan, phases: updatedPhases };
      
      // Update localStorage
      const allPlans = localStorage.getItem('cyclePlans');
      if (allPlans) {
        const plans = JSON.parse(allPlans);
        const updatedPlans = plans.map((p: CyclePlan) =>
          p.qualificationCode === cyclePlan.qualificationCode ? updatedCyclePlan : p
        );
        localStorage.setItem('cyclePlans', JSON.stringify(updatedPlans));
        
        // Also update internalCyclePlans
        const internalPlans = localStorage.getItem('internalCyclePlans');
        if (internalPlans) {
          const internal = JSON.parse(internalPlans);
          const updatedInternal = internal.map((plan: any) =>
            plan.qualificationCode === cyclePlan.qualificationCode 
              ? { ...plan, phases: updatedPhases }
              : plan
          );
          localStorage.setItem('internalCyclePlans', JSON.stringify(updatedInternal));
        }
        
        // Update local state
        setCyclePlan(updatedCyclePlan);
        
        // Trigger storage events
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'cyclePlans',
          newValue: JSON.stringify(updatedPlans)
        }));
      }
    }
  };

  if (availableCyclePlans.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Phase Development (Design Tool)</h3>
          <p className="text-sm text-muted-foreground">
            Manage each phase of the qualification development process
          </p>
        </div>
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <p className="text-gray-500">No published cycle plans found.</p>
          <p className="text-sm text-gray-400">Please create and publish a cycle plan first in the Cycle Plan Manager.</p>
        </div>
      </div>
    );
  }

  if (!cyclePlan) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Phase Development (Design Tool)</h3>
          <p className="text-sm text-muted-foreground">
            Manage each phase of the qualification development process
          </p>
        </div>
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <p className="text-gray-500">Select a qualification to begin.</p>
        </div>
      </div>
    );
  }

  // Use the phases directly from the cycle plan (in the order they were defined)
  const displayPhases = cyclePlan.phases;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Phase Development (Design Tool)</h3>
        <p className="text-sm text-muted-foreground">
          Manage each phase of the qualification development process
        </p>
      </div>

      {/* Qualification Selector Dropdown */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Qualification</label>
        <select
          value={selectedQualificationCode}
          onChange={(e) => handleQualificationChange(e.target.value)}
          className="w-full md:w-96 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          {availableCyclePlans.map((plan) => (
            <option key={plan.qualificationCode} value={plan.qualificationCode}>
              {plan.title} ({plan.qualificationCode})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Qualification:</strong> {cyclePlan.title} | {cyclePlan.qualificationCode}
        </p>
      </div>

      <Tabs value={activePhase} onValueChange={setActivePhase} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent">
          {displayPhases.map((phase) => (
            <TabsTrigger
              key={phase.name}
              value={phase.name}
              className={`data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                phase.status === 'completed' ? 'bg-green-100 text-green-700' :
                phase.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                phase.status === 'pending' && phase.name !== activePhase ? 'bg-gray-100 text-gray-600' :
                'bg-orange-100 text-orange-700'
              }`}
            >
              {phase.name}
              {phase.status === 'completed' && (
                <CheckCircle className="w-3 h-3 ml-1 text-green-500" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {displayPhases.map((phase) => (
          <TabsContent key={phase.name} value={phase.name} className="mt-6">
            <PhaseContent 
              key={`${phase.name}-${phase.status}-${phase.reportSubmitted}`}
              phase={phase} 
              qualificationCode={cyclePlan.qualificationCode}
              qualificationTitle={cyclePlan.title}
              isLastPhase={phase.name === 'Final Verification'}
              allPhases={displayPhases}
              onPhaseStatusUpdate={handlePhaseStatusUpdate}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}