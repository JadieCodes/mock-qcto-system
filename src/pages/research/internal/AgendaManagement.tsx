// screens/AgendaManagement.tsx
import React, { useState } from 'react';
import AgendaBuilder from '../subtabs/AgendaBuilder';
import ActiveAgendas from '../subtabs/ActiveAgendas';

type TabType = 'builder' | 'active';

const AgendaManagement = () => {
  const [activeTab, setActiveTab] = useState<TabType>('builder');

  const tabs = [
    { id: 'builder', label: 'Agenda Builder', icon: '📝' },
    { id: 'active', label: 'Active Agendas', icon: '📋' },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'builder':
        return <AgendaBuilder />;
      case 'active':
        return <ActiveAgendas />;
      default:
        return <AgendaBuilder />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Agenda Management</h2>
        <p className="text-gray-600 mt-1">Create and manage meeting agendas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

export default AgendaManagement;