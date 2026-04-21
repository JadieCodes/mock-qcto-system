import React, { useState } from 'react';
import { Bell, CalendarDays, FileText } from 'lucide-react';

type SiteVisitsTab =
  | 'notificationsSubmissions'
  | 'siteVisitSchedules'
  | 'reportsOutcomes';

export default function ExternalSiteVisitsAndMonitoring() {
  const [activeTab, setActiveTab] = useState<SiteVisitsTab>('notificationsSubmissions');

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Site Visits & Monitoring</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track external submissions, site visit schedules, and monitoring outcomes.
        </p>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('notificationsSubmissions')}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === 'notificationsSubmissions'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Notifications & Submissions
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('siteVisitSchedules')}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === 'siteVisitSchedules'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Site Visit Schedules
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reportsOutcomes')}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                activeTab === 'reportsOutcomes'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Reports & Outcomes
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'notificationsSubmissions' && <NotificationsAndSubmissionsTab />}
          {activeTab === 'siteVisitSchedules' && <SiteVisitSchedulesTab />}
          {activeTab === 'reportsOutcomes' && <ReportsAndOutcomesTab />}
        </div>
      </div>
    </div>
  );
}

function NotificationsAndSubmissionsTab() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Notifications & Submissions"
        description="This section will later contain EISA notifications, approved results submissions, and external submission tracking."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Notifications" value="0" icon={<Bell className="h-5 w-5" />} />
        <InfoCard title="Pending Submissions" value="0" icon={<FileText className="h-5 w-5" />} />
        <InfoCard title="Returned Items" value="0" icon={<FileText className="h-5 w-5" />} />
      </div>

      <PlaceholderPanel
        title="Notifications & Submissions Workspace"
        text="This area will later contain notification forms, approved results submissions, and submission history."
      />
    </div>
  );
}

function SiteVisitSchedulesTab() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Site Visit Schedules"
        description="This section will later contain site visit plans, monthly schedules, and visit status tracking."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Scheduled Visits" value="0" icon={<CalendarDays className="h-5 w-5" />} />
        <InfoCard title="Pending Confirmations" value="0" icon={<CalendarDays className="h-5 w-5" />} />
        <InfoCard title="Completed Visits" value="0" icon={<CalendarDays className="h-5 w-5" />} />
      </div>

      <PlaceholderPanel
        title="Site Visit Scheduling Workspace"
        text="This area will later contain visit schedules, monthly plans, and schedule confirmations."
      />
    </div>
  );
}

function ReportsAndOutcomesTab() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reports & Outcomes"
        description="This section will later contain site visit reports, monitoring outcomes, and external feedback."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Reports Available" value="0" icon={<FileText className="h-5 w-5" />} />
        <InfoCard title="Pending Outcomes" value="0" icon={<FileText className="h-5 w-5" />} />
        <InfoCard title="Completed Outcomes" value="0" icon={<FileText className="h-5 w-5" />} />
      </div>

      <PlaceholderPanel
        title="Reports & Outcomes Workspace"
        text="This area will later contain marked and moderated reports, PEM reports, and outcomes sent to external users."
      />
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
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