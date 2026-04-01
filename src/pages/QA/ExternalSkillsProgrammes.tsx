// External Skills Programmes
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ExternalSkillsProgrammeIntake from './subtabs/ExternalSkillsProgrammeIntake';
import ExternalMonitoringSkillsProgrammes from './subtabs/ExternalMonitoringSkillsProgrammes';

const ExternalSkillsProgrammes: React.FC = () => {
  const [activeTab, setActiveTab] = useState('intake');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Skills Programmes</h2>
        <p className="text-gray-600 mt-1">Manage skills programme intake and monitoring</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="intake">Skills Programme Intake</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring Skills Programmes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="intake" className="space-y-6 py-4">
          <ExternalSkillsProgrammeIntake />
        </TabsContent>
        
        <TabsContent value="monitoring" className="space-y-6 py-4">
          <ExternalMonitoringSkillsProgrammes />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExternalSkillsProgrammes;