// Internal Curriculum Implementation
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QPAllocationManagement from '../subtabs/QPAllocationManagement';
import PlansConsolidation from '../subtabs/PlansConsolidation';
import SiteVisitManagement from '../subtabs/SiteVisitManagement';

const InternalCurriculumImplementation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('qpAllocation');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Curriculum Implementation</h2>
        <p className="text-gray-600 mt-1">Manage QP allocations, plan consolidation, and site visits</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="qpAllocation">QP Allocation Management</TabsTrigger>
          <TabsTrigger value="plansConsolidation">Plans Consolidation</TabsTrigger>
          <TabsTrigger value="siteVisit">Site Visit Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="qpAllocation" className="space-y-6 py-4">
          <QPAllocationManagement />
        </TabsContent>
        
        <TabsContent value="plansConsolidation" className="space-y-6 py-4">
          <PlansConsolidation />
        </TabsContent>
        
        <TabsContent value="siteVisit" className="space-y-6 py-4">
          <SiteVisitManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InternalCurriculumImplementation;