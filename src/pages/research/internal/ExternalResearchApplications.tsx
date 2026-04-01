// screens/ExternalResearchApplications.tsx
import React, { useState } from 'react';
import ApplicationIntakeAllocation from '../subtabs/ApplicationIntakeAllocation';
import ApplicationReviewWorkspace from '../subtabs/ApplicationReviewWorkspace';
import ImplementationWorkspace from '../subtabs/ImplementationWorkspace';

type TabType = 'intake' | 'review' | 'implementation';

const ExternalResearchApplications = () => {
  const [activeTab, setActiveTab] = useState<TabType>('intake');

  const tabs = [
    { id: 'intake' as TabType, label: 'Application Intake & Allocation', icon: '📥' },
    { id: 'review' as TabType, label: 'Application Review Workspace', icon: '🔍' },
    { id: 'implementation' as TabType, label: 'Implementation Workspace', icon: '⚙️' },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'intake':
        return <ApplicationIntakeAllocation />;
      case 'review':
        return <ApplicationReviewWorkspace />;
      case 'implementation':
        return <ImplementationWorkspace />;
      default:
        return <ApplicationIntakeAllocation />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">External Research Applications</h2>
        <p className="text-gray-600 mt-1">Manage external research applications from intake to implementation</p>
      </div>

      {/* Tab Cards - with icon and text inline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-3
              ${activeTab === tab.id
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span className={`text-base font-medium ${
              activeTab === tab.id ? 'text-primary' : 'text-gray-700'
            }`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default ExternalResearchApplications;