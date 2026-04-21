import React, { useState } from 'react';
import { ClipboardList, Users, FileText } from 'lucide-react';

type EisaRegistrationTab = 'trades' | 'nonTrades';

export default function ExternalEisaRegistration() {
  const [activeTab, setActiveTab] = useState<EisaRegistrationTab>('trades');

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">EISA Registration</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage EISA registration submissions for trades and non-trades.
        </p>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('trades')}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === 'trades'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              EISA Trades
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('nonTrades')}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === 'nonTrades'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              EISA Non Trades
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'trades' && <EisaTradesTab />}
          {activeTab === 'nonTrades' && <EisaNonTradesTab />}
        </div>
      </div>
    </div>
  );
}

function EisaTradesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">EISA Trades</h2>
        <p className="mt-1 text-sm text-gray-600">
          Submit and track trade-based EISA registrations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Trade Registrations" value="0" icon={<ClipboardList className="h-5 w-5" />} />
        <InfoCard title="Registered Candidates" value="0" icon={<Users className="h-5 w-5" />} />
        <InfoCard title="Uploaded Files" value="0" icon={<FileText className="h-5 w-5" />} />
      </div>

      <PlaceholderPanel
        title="Trades Registration Workspace"
        text="This section will later contain the trades registration form, learner lists, supporting documents, and registration tracking."
      />
    </div>
  );
}

function EisaNonTradesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">EISA Non Trades</h2>
        <p className="mt-1 text-sm text-gray-600">
          Submit and track non-trade EISA registrations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Non-Trade Registrations" value="0" icon={<ClipboardList className="h-5 w-5" />} />
        <InfoCard title="Registered Candidates" value="0" icon={<Users className="h-5 w-5" />} />
        <InfoCard title="Uploaded Files" value="0" icon={<FileText className="h-5 w-5" />} />
      </div>

      <PlaceholderPanel
        title="Non-Trades Registration Workspace"
        text="This section will later contain the non-trades registration form, required files, and submission tracking."
      />
    </div>
  );
}

function InfoCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-gray-50 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="rounded-full bg-white p-3 text-gray-600">{icon}</div>
      </div>
    </div>
  );
}

function PlaceholderPanel({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{text}</p>
    </div>
  );
}