// Internal Historical Qualifications
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VerifiedAllocations from '../subtabs/VerifiedAllocations';
import MonthlyUpdates from '../subtabs/MonthlyUpdates';

const InternalHistoricalQualifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState('verifiedAllocations');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Historical Qualifications</h2>
        <p className="text-gray-600 mt-1">Manage verified allocations and monthly updates for historical qualifications</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="verifiedAllocations">Verified Allocations</TabsTrigger>
          <TabsTrigger value="monthlyUpdates">Monthly Updates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="verifiedAllocations" className="space-y-6 py-4">
          <VerifiedAllocations />
        </TabsContent>
        
        <TabsContent value="monthlyUpdates" className="space-y-6 py-4">
          <MonthlyUpdates />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InternalHistoricalQualifications;