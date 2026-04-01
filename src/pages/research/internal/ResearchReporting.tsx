// screens/ResearchReporting.tsx
import React, { useState } from 'react';
import ResearchWorkspace from '../subtabs/ResearchWorkspace';
import SubmissionApproval from '../subtabs/SubmissionApproval';
import Publishing from '../subtabs/Publishing';

type TabType = 'workspace' | 'submission' | 'publishing';

const ResearchReporting = () => {
  const [activeTab, setActiveTab] = useState<TabType>('workspace');

  const tabs = [
    { id: 'workspace' as TabType, label: 'Research Workspace', icon: '🔬' },
    { id: 'submission' as TabType, label: 'Submission & Approval', icon: '📤' },
    { id: 'publishing' as TabType, label: 'Publishing', icon: '📢' },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'workspace':
        return <ResearchWorkspace />;
      case 'submission':
        return <SubmissionApproval />;
      case 'publishing':
        return <Publishing />;
      default:
        return <ResearchWorkspace />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Research & Reporting</h2>
        <p className="text-gray-600 mt-1">Manage research activities, submissions, and publications</p>
      </div>

      {/* Tabs as cards with inline icon and label */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              p-4 rounded-lg border-2 transition-all flex items-center gap-3
              ${activeTab === tab.id
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <span className="text-2xl">{tab.icon}</span>
            <h3 className={`font-semibold ${
              activeTab === tab.id ? 'text-primary' : 'text-gray-700'
            }`}>
              {tab.label}
            </h3>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default ResearchReporting;