import React, { useState } from 'react';
import { FileText, ClipboardCheck, BadgeCheck } from 'lucide-react';
import { QasaAddendumSubmission } from './QasaAddendumSubmission';
import { QasaEvaluation } from './QasaEvaluation';
import { QasaApproval } from './QasaApproval';

type QasaTab = 'submission' | 'evaluation' | 'approval';

const tabs: {
  id: QasaTab;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'submission',
    label: 'QASA Addendum Submission',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: 'evaluation',
    label: 'QASA Evaluation',
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
  {
    id: 'approval',
    label: 'QASA Approval',
    icon: <BadgeCheck className="h-4 w-4" />,
  },
];

export default function QasaManagementPage() {
  const [activeTab, setActiveTab] = useState<QasaTab>('submission');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">QASA Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage the QASA workflow through its core stages.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex flex-wrap gap-2 p-4">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'submission' && <QasaAddendumSubmission />}
            {activeTab === 'evaluation' && <QasaEvaluation />}
            {activeTab === 'approval' && <QasaApproval />}
          </div>
        </div>
      </div>
    </div>
  );
}