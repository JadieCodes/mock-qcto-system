// Internal Skills Programmes
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SkillsProgrammeIntake from '../subtabs/SkillsProgrammeIntake';
import ReviewedSkillsProgrammes from '../subtabs/ReviewedSkillsProgrammes';
import MonitoringSkillsProgrammes from '../subtabs/MonitoringSkillsProgrammes';

const InternalSkillsProgrammes: React.FC = () => {
  const [activeTab, setActiveTab] = useState('intake');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Skills Programmes</h2>
        <p className="text-gray-600 mt-1">Manage skills programme intake, reviews, and monitoring</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="intake">Skills Programme Intake</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed Skills Programmes</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring Skills Programmes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="intake" className="space-y-6 py-4">
          <SkillsProgrammeIntake />
        </TabsContent>
        
        <TabsContent value="reviewed" className="space-y-6 py-4">
          <ReviewedSkillsProgrammes />
        </TabsContent>
        
        <TabsContent value="monitoring" className="space-y-6 py-4">
          <MonitoringSkillsProgrammes />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InternalSkillsProgrammes;