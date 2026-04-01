// screens/ServiceProviderAppointment.tsx
import React, { useState } from 'react';
import TORDevelopment from '../subtabs/TORDevelopment';
import SLAPreparation from '../subtabs/SLAPreparation';
import ReviewRecommendation from '../subtabs/ReviewRecommendation';

type TabType = 'tor' | 'sla' | 'review';

const ServiceProviderAppointment = () => {
  const [activeTab, setActiveTab] = useState<TabType>('tor');

  const tabs = [
    { id: 'tor', label: 'TOR Development', icon: '📋' },
    { id: 'sla', label: 'SLA Preparation', icon: '📄' },
    { id: 'review', label: 'Review & Recommendation', icon: '⭐' },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'tor':
        return <TORDevelopment />;
      case 'sla':
        return <SLAPreparation />;
      case 'review':
        return <ReviewRecommendation />;
      default:
        return <TORDevelopment />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Service Provider Appointment</h2>
        <p className="text-gray-600 mt-1">Manage the appointment process for service providers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
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

      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default ServiceProviderAppointment;