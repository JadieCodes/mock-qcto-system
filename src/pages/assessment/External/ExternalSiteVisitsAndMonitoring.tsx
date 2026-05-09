import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  Bell,
  CalendarDays,
  FileText,
  Eye,
  Send,
  CheckCircle2,
  ClipboardList,
  CalendarClock,
  PlusCircle,
} from 'lucide-react';

type SiteVisitsTab =
  | 'notificationsSubmissions'
  | 'siteVisitSchedules'
  | 'reportsOutcomes';

type MonitoringProcessType = 'marked_moderated_scripts' | 'post_eisa_monitoring';

type ExternalStage =
  | 'submitted_to_assessment'
  | 'schedule_received'
  | 'report_outcome_available'
  | 'closed';

type SiteMonitoringStage =
  | 'incoming_request'
  | 'planning_scheduling'
  | 'site_visit_execution'
  | 'evaluation_reporting'
  | 'approval_outcome'
  | 'closed';

type SiteMonitoringSubStage =
  | 'eisa_notification_received'
  | 'approved_results_received'
  | 'plan_prepared'
  | 'competency_checked'
  | 'sdp_identified'
  | 'deputy_director_review'
  | 'domain_director_approval'
  | 'director_review'
  | 'site_visit_booked'
  | 'site_visit_conducted'
  | 'evaluation_report_compiled'
  | 'pem_report_generated'
  | 'outcome_sent_to_qp';

type WorkflowStatus = 'pending' | 'in_progress' | 'approved';

interface SharedMonitoringRecord {
  id: string;
  processType: MonitoringProcessType;
  title: string;
  sourceFrom: string;
  submittedBy: string;
  siteName: string;
  visitDate: string;
  stage: SiteMonitoringStage;
  subStage: SiteMonitoringSubStage;
  eisaNotificationSubmitted: boolean;
  approvedResultsSubmitted: boolean;
  schedulePrepared: boolean;
  monthlyPlanPrepared: boolean;
  competencyRateChecked: boolean;
  sdpIdentified: boolean;
  siteVisitBooked: boolean;
  evaluationToolCompleted: boolean;
  evaluationReportCompiled: boolean;
  pemReportGenerated: boolean;
  sentToQp: boolean;
  deputyDirectorStatus: WorkflowStatus;
  domainDirectorStatus: WorkflowStatus;
  directorStatus: WorkflowStatus;
  createdAt: string;
}

interface ExternalMonitoringRecord {
  id: string;
  processType: MonitoringProcessType;
  title: string;
  submittedBy: string;
  siteName: string;
  visitDate: string;
  stage: ExternalStage;
  eisaNotificationSubmitted: boolean;
  approvedResultsSubmitted: boolean;
  scheduleReceived: boolean;
  monthlyPlanReceived: boolean;
  evaluationOutcomeAvailable: boolean;
  pemOutcomeAvailable: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'site_visits_monitoring_records';

const INITIAL_SHARED_RECORDS: SharedMonitoringRecord[] = [
  {
    id: 'EXT-001',
    processType: 'marked_moderated_scripts',
    title: 'Marked & Moderated Scripts - Gauteng Centre A',
    sourceFrom: 'Quality Partner',
    submittedBy: 'Quality Partner',
    siteName: 'Gauteng Centre A',
    visitDate: '2026-05-12',
    stage: 'incoming_request',
    subStage: 'eisa_notification_received',
    eisaNotificationSubmitted: true,
    approvedResultsSubmitted: false,
    schedulePrepared: false,
    monthlyPlanPrepared: false,
    competencyRateChecked: false,
    sdpIdentified: false,
    siteVisitBooked: false,
    evaluationToolCompleted: false,
    evaluationReportCompiled: false,
    pemReportGenerated: false,
    sentToQp: false,
    deputyDirectorStatus: 'pending',
    domainDirectorStatus: 'pending',
    directorStatus: 'pending',
    createdAt: '2026-04-22',
  },
  {
    id: 'EXT-003',
    processType: 'post_eisa_monitoring',
    title: 'Post EISA Monitoring - Durban Centre C',
    sourceFrom: 'Quality Partner',
    submittedBy: 'Quality Partner',
    siteName: 'Durban Centre C',
    visitDate: '2026-05-20',
    stage: 'incoming_request',
    subStage: 'approved_results_received',
    eisaNotificationSubmitted: false,
    approvedResultsSubmitted: true,
    schedulePrepared: false,
    monthlyPlanPrepared: false,
    competencyRateChecked: false,
    sdpIdentified: false,
    siteVisitBooked: false,
    evaluationToolCompleted: false,
    evaluationReportCompiled: false,
    pemReportGenerated: false,
    sentToQp: false,
    deputyDirectorStatus: 'pending',
    domainDirectorStatus: 'pending',
    directorStatus: 'pending',
    createdAt: '2026-04-22',
  },
];

function toExternalRecord(record: SharedMonitoringRecord): ExternalMonitoringRecord {
  let stage: ExternalStage = 'submitted_to_assessment';

  if (
    record.schedulePrepared &&
    record.monthlyPlanPrepared &&
    (record.domainDirectorStatus === 'approved' || record.directorStatus === 'approved')
  ) {
    stage = 'schedule_received';
  }

  if (record.evaluationReportCompiled || record.pemReportGenerated || record.sentToQp) {
    stage = 'report_outcome_available';
  }

  if (record.stage === 'closed') {
    stage = 'closed';
  }

  return {
    id: record.id,
    processType: record.processType,
    title: record.title,
    submittedBy: record.submittedBy,
    siteName: record.siteName,
    visitDate: record.visitDate,
    stage,
    eisaNotificationSubmitted: record.eisaNotificationSubmitted,
    approvedResultsSubmitted: record.approvedResultsSubmitted,
    scheduleReceived:
      record.schedulePrepared &&
      record.monthlyPlanPrepared &&
      (record.domainDirectorStatus === 'approved' || record.directorStatus === 'approved'),
    monthlyPlanReceived:
      record.schedulePrepared &&
      record.monthlyPlanPrepared &&
      (record.domainDirectorStatus === 'approved' || record.directorStatus === 'approved'),
    evaluationOutcomeAvailable: record.evaluationReportCompiled,
    pemOutcomeAvailable: record.pemReportGenerated || record.sentToQp,
    createdAt: record.createdAt,
  };
}

export default function ExternalSiteVisitsAndMonitoring() {
  const [activeTab, setActiveTab] = useState<SiteVisitsTab>('notificationsSubmissions');
  const [records, setRecords] = useState<SharedMonitoringRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ExternalMonitoringRecord | null>(null);
  const { currentRole } = useApp();

  useEffect(() => {
    loadRecords();

    const handleStorage = (e?: StorageEvent) => {
      if (!e || e.key === STORAGE_KEY) loadRecords();
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const loadRecords = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SHARED_RECORDS));
      setRecords(INITIAL_SHARED_RECORDS);
      return;
    }

    setRecords(JSON.parse(stored));
  };

  const saveRecords = (updated: SharedMonitoringRecord[]) => {
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  };

  const externalRecords = useMemo(() => records.map(toExternalRecord), [records]);

  const submissionRecords = useMemo(
    () => externalRecords.filter((record) => record.stage === 'submitted_to_assessment'),
    [externalRecords]
  );

  const scheduleRecords = useMemo(
    () => externalRecords.filter((record) => record.stage === 'schedule_received'),
    [externalRecords]
  );

  const outcomeRecords = useMemo(
    () =>
      externalRecords.filter(
        (record) => record.stage === 'report_outcome_available' || record.stage === 'closed'
      ),
    [externalRecords]
  );

  const createExternalSubmission = (processType: MonitoringProcessType) => {
    const id = `EXT-${Date.now()}`;
    const sharedRecord: SharedMonitoringRecord = {
      id,
      processType,
      title:
        processType === 'marked_moderated_scripts'
          ? `Marked & Moderated Scripts - New Site ${String(Date.now()).slice(-3)}`
          : `Post EISA Monitoring - New Site ${String(Date.now()).slice(-3)}`,
      sourceFrom: 'Quality Partner',
      submittedBy: 'Quality Partner',
      siteName:
        processType === 'marked_moderated_scripts'
          ? 'New Marked & Moderated Site'
          : 'New Post EISA Site',
      visitDate: '2026-06-15',
      stage: 'incoming_request',
      subStage:
        processType === 'marked_moderated_scripts'
          ? 'eisa_notification_received'
          : 'approved_results_received',
      eisaNotificationSubmitted: processType === 'marked_moderated_scripts',
      approvedResultsSubmitted: processType === 'post_eisa_monitoring',
      schedulePrepared: false,
      monthlyPlanPrepared: false,
      competencyRateChecked: false,
      sdpIdentified: false,
      siteVisitBooked: false,
      evaluationToolCompleted: false,
      evaluationReportCompiled: false,
      pemReportGenerated: false,
      sentToQp: false,
      deputyDirectorStatus: 'pending',
      domainDirectorStatus: 'pending',
      directorStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    saveRecords([sharedRecord, ...records]);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Site Visits & Monitoring</h1>
            <p className="mt-2 text-sm text-gray-600">
              Track external submissions, site visit schedules, and monitoring outcomes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentRole === 'Quality Partner' && (
              <>
                <button
                  type="button"
                  onClick={() => createExternalSubmission('marked_moderated_scripts')}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <PlusCircle className="h-4 w-4" />
                  New EISA Notification
                </button>
                <button
                  type="button"
                  onClick={() => createExternalSubmission('post_eisa_monitoring')}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <PlusCircle className="h-4 w-4" />
                  New Approved Results
                </button>
              </>
            )}

            <div className="inline-flex w-fit items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Current role
              </span>
              <span className="ml-3 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm">
                {currentRole || 'Quality Partner'}
              </span>
            </div>
          </div>
        </div>
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
          {activeTab === 'notificationsSubmissions' && (
            <SectionShell
              title="Notifications & Submissions"
              description="Quality Partner submits EISA Notifications for Marked & Moderated Scripts and Approved Results for Post EISA Monitoring."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard title="Notifications" value={String(submissionRecords.length)} icon={<Bell className="h-5 w-5" />} />
                <InfoCard
                  title="Marked & Moderated"
                  value={String(
                    submissionRecords.filter((r) => r.processType === 'marked_moderated_scripts').length
                  )}
                  icon={<ClipboardList className="h-5 w-5" />}
                />
                <InfoCard
                  title="Post EISA Monitoring"
                  value={String(
                    submissionRecords.filter((r) => r.processType === 'post_eisa_monitoring').length
                  )}
                  icon={<FileText className="h-5 w-5" />}
                />
              </div>

              <ExternalRecordsTable
                records={submissionRecords}
                actionRenderer={(record) => (
                  <ActionButton
                    variant="secondary"
                    icon={<Eye className="h-4 w-4" />}
                    onClick={() => setSelectedRecord(record)}
                  >
                    View
                  </ActionButton>
                )}
              />
            </SectionShell>
          )}

          {activeTab === 'siteVisitSchedules' && (
            <SectionShell
              title="Site Visit Schedules"
              description="View approved Site Visit Schedules and Monthly Plans sent back from the Assessment Domain."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard title="Scheduled Visits" value={String(scheduleRecords.length)} icon={<CalendarDays className="h-5 w-5" />} />
                <InfoCard
                  title="Schedules Received"
                  value={String(scheduleRecords.filter((r) => r.scheduleReceived).length)}
                  icon={<CalendarClock className="h-5 w-5" />}
                />
                <InfoCard
                  title="Monthly Plans Received"
                  value={String(scheduleRecords.filter((r) => r.monthlyPlanReceived).length)}
                  icon={<CalendarDays className="h-5 w-5" />}
                />
              </div>

              <ExternalRecordsTable
                records={scheduleRecords}
                actionRenderer={(record) => (
                  <ActionButton
                    variant="secondary"
                    icon={<Eye className="h-4 w-4" />}
                    onClick={() => setSelectedRecord(record)}
                  >
                    View
                  </ActionButton>
                )}
              />
            </SectionShell>
          )}

          {activeTab === 'reportsOutcomes' && (
            <SectionShell
              title="Reports & Outcomes"
              description="View Evaluation Report outcomes for Marked & Moderated Scripts and PEM outcomes for Post EISA Monitoring."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard title="Reports Available" value={String(outcomeRecords.length)} icon={<FileText className="h-5 w-5" />} />
                <InfoCard
                  title="Evaluation Outcomes"
                  value={String(outcomeRecords.filter((r) => r.evaluationOutcomeAvailable).length)}
                  icon={<CheckCircle2 className="h-5 w-5" />}
                />
                <InfoCard
                  title="PEM Outcomes"
                  value={String(outcomeRecords.filter((r) => r.pemOutcomeAvailable).length)}
                  icon={<CheckCircle2 className="h-5 w-5" />}
                />
              </div>

              <ExternalRecordsTable
                records={outcomeRecords}
                actionRenderer={(record) => (
                  <ActionButton
                    variant="secondary"
                    icon={<Eye className="h-4 w-4" />}
                    onClick={() => setSelectedRecord(record)}
                  >
                    View
                  </ActionButton>
                )}
              />
            </SectionShell>
          )}
        </div>
      </div>

      {selectedRecord && (
        <ExternalMonitoringDetailsModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}

function ExternalRecordsTable({
  records,
  actionRenderer,
}: {
  records: ExternalMonitoringRecord[];
  actionRenderer: (record: ExternalMonitoringRecord) => React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white">
            <tr className="border-b border-gray-200">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Process
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Site
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Visit Date
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Stage
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-500">
                  No records available in this tab.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70"
                >
                  <td className="px-5 py-4 align-top">
                    <div className="font-semibold text-gray-900">{getProcessLabel(record.processType)}</div>
                    <div className="mt-1 text-sm text-gray-600">{record.title}</div>
                  </td>

                  <td className="px-5 py-4 align-top text-sm text-gray-700">{record.siteName}</td>

                  <td className="px-5 py-4 align-top text-sm text-gray-700">{record.visitDate}</td>

                  <td className="px-5 py-4 align-top">
                    <StageBadge stage={record.stage} />
                  </td>

                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap items-center gap-2">{actionRenderer(record)}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExternalMonitoringDetailsModal({
  record,
  onClose,
}: {
  record: ExternalMonitoringRecord;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{record.title}</h3>
            <p className="mt-1 text-sm text-gray-600">External site visits and monitoring record details</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DetailStat title="Process" value={getProcessLabel(record.processType)} icon={<ClipboardList className="h-5 w-5" />} />
            <DetailStat title="Stage" value={getExternalStageLabel(record.stage)} icon={<CalendarDays className="h-5 w-5" />} />
            <DetailStat title="Visit Date" value={record.visitDate} icon={<CalendarClock className="h-5 w-5" />} />
            <DetailStat title="Submitted By" value={record.submittedBy} icon={<Send className="h-5 w-5" />} />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <h4 className="text-sm font-semibold text-gray-900">Submission & Outcome Status</h4>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ChecklistBadge label="EISA Notification Submitted" checked={record.eisaNotificationSubmitted} />
              <ChecklistBadge label="Approved Results Submitted" checked={record.approvedResultsSubmitted} />
              <ChecklistBadge label="Schedule Received" checked={record.scheduleReceived} />
              <ChecklistBadge label="Monthly Plan Received" checked={record.monthlyPlanReceived} />
              <ChecklistBadge label="Evaluation Outcome Available" checked={record.evaluationOutcomeAvailable} />
              <ChecklistBadge label="PEM Outcome Available" checked={record.pemOutcomeAvailable} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getProcessLabel(processType: MonitoringProcessType) {
  return processType === 'marked_moderated_scripts'
    ? 'Marked & Moderated Scripts'
    : 'Post EISA Monitoring';
}

function getExternalStageLabel(stage: ExternalStage) {
  switch (stage) {
    case 'submitted_to_assessment':
      return 'Submitted to Assessment';
    case 'schedule_received':
      return 'Schedule Received';
    case 'report_outcome_available':
      return 'Report Outcome Available';
    case 'closed':
      return 'Closed';
    default:
      return stage;
  }
}

function StageBadge({ stage }: { stage: ExternalStage }) {
  const styles =
    stage === 'closed'
      ? 'bg-green-50 text-green-700 ring-green-600/20'
      : stage === 'report_outcome_available'
      ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
      : stage === 'schedule_received'
      ? 'bg-purple-50 text-purple-700 ring-purple-600/20'
      : 'bg-amber-50 text-amber-700 ring-amber-600/20';

  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles}`}
    >
      {getExternalStageLabel(stage)}
    </span>
  );
}

function SectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
      {children}
    </div>
  );
}

function ActionButton({
  children,
  icon,
  onClick,
  variant = 'primary',
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}) {
  const styles =
    variant === 'secondary'
      ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
      : 'bg-red-600 text-white hover:bg-red-700';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition ${styles}`}
    >
      {icon}
      {children}
    </button>
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

function DetailStat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-gray-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-gray-100 p-3 text-gray-600">{icon}</div>
      </div>
    </div>
  );
}

function ChecklistBadge({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 text-sm font-medium ${
        checked
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-gray-200 bg-white text-gray-600'
      }`}
    >
      {label}
    </div>
  );
}