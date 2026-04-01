// Internal Learner Enrolment
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnrolmentIntakeQueue from '../subtabs/EnrolmentIntakeQueue';
import Allocations from '../subtabs/Allocations';

const InternalLearnerEnrolment: React.FC = () => {
  const [activeTab, setActiveTab] = useState('intakeQueue');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Learner Enrolment</h2>
        <p className="text-gray-600 mt-1">Manage learner enrolment intake and allocations</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="intakeQueue">Enrolment Intake Queue</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="intakeQueue" className="space-y-6 py-4">
          <EnrolmentIntakeQueue />
        </TabsContent>
        
        <TabsContent value="allocations" className="space-y-6 py-4">
          <Allocations />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InternalLearnerEnrolment;