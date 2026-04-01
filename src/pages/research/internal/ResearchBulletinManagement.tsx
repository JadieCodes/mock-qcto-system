// screens/ResearchBulletinManagement.tsx
import React, { useState } from 'react';
import CallManagement from '../subtabs/CallManagement';
import SubmissionWorkspace from '../subtabs/SubmissionWorkspace';
import DesignLayoutWorkspace from '../subtabs/DesignLayoutWorkspace';
import ApprovalWorkspace from '../subtabs/ApprovalWorkspace';
import PublishingHandover from '../subtabs/PublishingHandover';

type TabType = 'call' | 'submission' | 'design' | 'approval' | 'publishing';

const ResearchBulletinManagement = () => {
  const [activeTab, setActiveTab] = useState<TabType>('call');

  const tabs = [
    { id: 'call', label: 'Call Management', icon: '📢', description: 'Manage bulletin calls' },
    { id: 'submission', label: 'Submission Workspace', icon: '📝', description: 'Handle submissions' },
    { id: 'design', label: 'Design & Layout', icon: '🎨', description: 'Configure layout' },
    { id: 'approval', label: 'Approval Workspace', icon: '✓', description: 'Review & approve' },
    { id: 'publishing', label: 'Publishing / Handover', icon: '🚀', description: 'Finalize & publish' },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'call':
        return <CallManagement />;
      case 'submission':
        return <SubmissionWorkspace />;
      case 'design':
        return <DesignLayoutWorkspace />;
      case 'approval':
        return <ApprovalWorkspace />;
      case 'publishing':
        return <PublishingHandover />;
      default:
        return <CallManagement />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Research Bulletin Management</h2>
        <p className="text-gray-600 mt-1">Manage the complete bulletin lifecycle from calls to publishing</p>
      </div>

      {/* Tab Cards - with icon and text inline */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`
              p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2
              ${activeTab === tab.id
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className={`text-sm font-medium ${
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

export default ResearchBulletinManagement;