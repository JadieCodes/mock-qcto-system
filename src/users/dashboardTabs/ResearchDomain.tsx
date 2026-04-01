// ResearchDomain.tsx
import React, { useState } from 'react';
import { ExternalSideMenuBar } from '@/components/ExternalSideMenuBar';
import ResearchRequestsPortal from '@/pages/research/ResearchRequestsPortal';
import ResearchBulletinSubmissions from '@/pages/research/ResearchBulletinSubmissions';
import ExternalResearchApplications from '@/pages/research/ExternalResearchApplications';

export default function ResearchDomain() {
  const [activeTab, setActiveTab] = useState('researchRequests');

  const renderContent = () => {
    switch(activeTab) {
      case 'researchRequests':
        return <ResearchRequestsPortal />;
      case 'bulletinSubmissions':
        return <ResearchBulletinSubmissions />;
      case 'externalApplications':
        return <ExternalResearchApplications />;
      default:
        return <ResearchRequestsPortal />;
    }
  };

  return (
    <ExternalSideMenuBar 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {renderContent()}
    </ExternalSideMenuBar>
  );
}