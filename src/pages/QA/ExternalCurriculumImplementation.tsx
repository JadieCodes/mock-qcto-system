// External Curriculum Implementation
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlansReportsSubmission from './subtabs/PlansReportsSubmission';

const ExternalCurriculumImplementation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('plansReports');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Curriculum Implementation</h2>
        <p className="text-gray-600 mt-1">Submit plans and reports for curriculum implementation</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="plansReports">Plans & Reports Submission</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plansReports" className="space-y-6 py-4">
          <PlansReportsSubmission />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExternalCurriculumImplementation;