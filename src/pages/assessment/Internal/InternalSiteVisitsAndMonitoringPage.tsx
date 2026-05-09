import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  Inbox,
  CalendarDays,
  MapPinned,
  FileText,
  CheckCircle2,
  BarChart3,
  Eye,
  Send,
  ClipboardCheck,
  CalendarClock,
  ShieldCheck,
  FolderCheck,
  PencilLine,
} from 'lucide-react';

type SiteMonitoringTab =
  | 'incomingRequests'
  | 'planningScheduling'
  | 'siteVisitExecution'
  | 'evaluationReports'
  | 'approvalsOutcomes'
  | 'monitoringDashboard';

type MonitoringProcessType = 'marked_moderated_scripts' | 'post_eisa_monitoring';

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

interface SiteMonitoringRecord {
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

  // Actual schedule and plan fields
  scheduleTitle?: string;
  scheduleDate?: string;
  scheduleTime?: string;
  scheduleVenue?: string;
  monthlyPlanMonth?: string;
  monthlyPlanSummary?: string;
  assignedOfficials?: string;
  bookingReference?: string;
}

const STORAGE_KEY = 'site_visits_monitoring_records';

const INITIAL_RECORDS: SiteMonitoringRecord[] = [
  {
    id: 'SVM-001',
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
    scheduleTitle: '',
    scheduleDate: '',
    scheduleTime: '',
    scheduleVenue: '',
    monthlyPlanMonth: '',
    monthlyPlanSummary: '',
    assignedOfficials: '',
    bookingReference: '',
  },
  {
    id: 'SVM-003',
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
    scheduleTitle: '',
    scheduleDate: '',
    scheduleTime: '',
    scheduleVenue: '',
    monthlyPlanMonth: '',
    monthlyPlanSummary: '',
    assignedOfficials: '',
    bookingReference: '',
  },
];

export default function InternalSiteVisitsAndMonitoringPage() {
  const [activeTab, setActiveTab] = useState<SiteMonitoringTab>('incomingRequests');
  const [records, setRecords] = useState<SiteMonitoringRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SiteMonitoringRecord | null>(null);
  const [planModalRecord, setPlanModalRecord] = useState<SiteMonitoringRecord | null>(null);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleVenue, setScheduleVenue] = useState('');
  const [monthlyPlanMonth, setMonthlyPlanMonth] = useState('');
  const [monthlyPlanSummary, setMonthlyPlanSummary] = useState('');
  const [assignedOfficials, setAssignedOfficials] = useState('');
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
      setRecords(INITIAL_RECORDS);
      return;
    }

    setRecords(JSON.parse(stored));
  };

  const saveRecords = (updated: SiteMonitoringRecord[]) => {
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  };

  const updateRecord = (
    recordId: string,
    updater: (record: SiteMonitoringRecord) => SiteMonitoringRecord
  ) => {
    const updated = records.map((record) =>
      record.id === recordId ? updater(record) : record
    );
    saveRecords(updated);
  };

  const incomingRecords = useMemo(
    () => records.filter((record) => record.stage === 'incoming_request'),
    [records]
  );

  const planningRecords = useMemo(
    () => records.filter((record) => record.stage === 'planning_scheduling'),
    [records]
  );

  const executionRecords = useMemo(
    () => records.filter((record) => record.stage === 'site_visit_execution'),
    [records]
  );

  const evaluationRecords = useMemo(
    () => records.filter((record) => record.stage === 'evaluation_reporting'),
    [records]
  );

  const approvalRecords = useMemo(
    () => records.filter(
      (record) => record.stage === 'approval_outcome' || record.stage === 'closed'
    ),
    [records]
  );

  const openPlanModal = (record: SiteMonitoringRecord) => {
    setPlanModalRecord(record);
    setScheduleTitle(record.scheduleTitle || '');
    setScheduleDate(record.scheduleDate || record.visitDate || '');
    setScheduleTime(record.scheduleTime || '');
    setScheduleVenue(record.scheduleVenue || '');
    setMonthlyPlanMonth(record.monthlyPlanMonth || '');
    setMonthlyPlanSummary(record.monthlyPlanSummary || '');
    setAssignedOfficials(record.assignedOfficials || '');
  };

  const closePlanModal = () => {
    setPlanModalRecord(null);
    setScheduleTitle('');
    setScheduleDate('');
    setScheduleTime('');
    setScheduleVenue('');
    setMonthlyPlanMonth('');
    setMonthlyPlanSummary('');
    setAssignedOfficials('');
  };

  const handleSavePlan = () => {
    if (!planModalRecord) return;

    updateRecord(planModalRecord.id, (record) => ({
      ...record,
      stage: 'planning_scheduling',
      subStage: 'deputy_director_review',
      schedulePrepared: true,
      monthlyPlanPrepared: true,
      competencyRateChecked:
        record.processType === 'post_eisa_monitoring' ? true : record.competencyRateChecked,
      sdpIdentified:
        record.processType === 'post_eisa_monitoring' ? true : record.sdpIdentified,
      submittedBy: 'Assistant Director',
      deputyDirectorStatus: 'in_progress',
      scheduleTitle,
      scheduleDate,
      visitDate: scheduleDate || record.visitDate,
      scheduleTime,
      scheduleVenue,
      monthlyPlanMonth,
      monthlyPlanSummary,
      assignedOfficials,
    }));

    closePlanModal();
  };

  const handleDeputyDirectorRecommendMarkedModerated = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      deputyDirectorStatus: 'approved',
      subStage: 'domain_director_approval',
      domainDirectorStatus: 'in_progress',
    }));
  };

  const handleDomainDirectorApproveMarkedModerated = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      domainDirectorStatus: 'approved',
      stage: 'site_visit_execution',
      subStage: 'site_visit_booked',
    }));
  };

  const handleDeputyDirectorRecommendPostEisa = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      deputyDirectorStatus: 'approved',
      subStage: 'director_review',
      directorStatus: 'in_progress',
    }));
  };

  const handleDirectorApprovePostEisa = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      directorStatus: 'approved',
      stage: 'site_visit_execution',
      subStage: 'site_visit_conducted',
    }));
  };

  const handleBookSiteVisit = (recordId: string) => {
    const bookingReference = `BOOK-${recordId}-${Date.now().toString().slice(-4)}`;

    updateRecord(recordId, (record) => ({
      ...record,
      siteVisitBooked: true,
      subStage: 'site_visit_conducted',
      submittedBy: 'Sub Domain Admin',
      bookingReference,
    }));
  };

  const handleCompileEvaluationReport = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      stage: 'evaluation_reporting',
      subStage: 'evaluation_report_compiled',
      evaluationToolCompleted: true,
      evaluationReportCompiled: true,
      submittedBy: 'Deputy& Assistant Director',
    }));
  };

  const handleGeneratePemReport = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      stage: 'evaluation_reporting',
      subStage: 'pem_report_generated',
      evaluationToolCompleted: true,
      pemReportGenerated: true,
      submittedBy: 'Assistant Director',
      deputyDirectorStatus: 'in_progress',
    }));
  };

  const handleSendMarkedModeratedToQp = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      stage: 'closed',
      subStage: 'outcome_sent_to_qp',
      sentToQp: true,
      submittedBy: 'Deputy Director',
    }));
  };

  const handleApprovePemAndUpdateQp = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      deputyDirectorStatus: 'approved',
      stage: 'closed',
      subStage: 'outcome_sent_to_qp',
      sentToQp: true,
      submittedBy: 'Deputy Director',
    }));
  };

  const dashboardCards = useMemo(() => {
    const totalIncoming = records.filter((r) => r.stage === 'incoming_request').length;
    const totalPlanning = records.filter((r) => r.stage === 'planning_scheduling').length;
    const totalExecution = records.filter((r) => r.stage === 'site_visit_execution').length;
    const totalReports = records.filter((r) => r.stage === 'evaluation_reporting').length;
    const totalClosed = records.filter((r) => r.stage === 'closed').length;
    const sentToQp = records.filter((r) => r.sentToQp).length;

    return {
      totalIncoming,
      totalPlanning,
      totalExecution,
      totalReports,
      totalClosed,
      sentToQp,
    };
  }, [records]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Site Visits & Monitoring</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage requests, planning, execution, reporting, approvals, and monitoring.
        </p>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="flex flex-wrap gap-2">
            <TabButton
              label="Incoming Requests"
              active={activeTab === 'incomingRequests'}
              onClick={() => setActiveTab('incomingRequests')}
            />
            <TabButton
              label="Planning & Scheduling"
              active={activeTab === 'planningScheduling'}
              onClick={() => setActiveTab('planningScheduling')}
            />
            <TabButton
              label="Site Visit Execution"
              active={activeTab === 'siteVisitExecution'}
              onClick={() => setActiveTab('siteVisitExecution')}
            />
            <TabButton
              label="Evaluation & Reports"
              active={activeTab === 'evaluationReports'}
              onClick={() => setActiveTab('evaluationReports')}
            />
            <TabButton
              label="Approvals & Outcomes"
              active={activeTab === 'approvalsOutcomes'}
              onClick={() => setActiveTab('approvalsOutcomes')}
            />
            <TabButton
              label="Monitoring Dashboard"
              active={activeTab === 'monitoringDashboard'}
              onClick={() => setActiveTab('monitoringDashboard')}
            />
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'incomingRequests' && (
            <SectionShell
              title="Incoming Requests"
              description="Receive EISA notifications for Marked & Moderated Scripts and Approved Results for Post EISA Monitoring."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard title="New Requests" value={String(incomingRecords.length)} icon={<Inbox className="h-5 w-5" />} />
                <InfoCard
                  title="Marked & Moderated"
                  value={String(
                    incomingRecords.filter((r) => r.processType === 'marked_moderated_scripts').length
                  )}
                  icon={<FileText className="h-5 w-5" />}
                />
                <InfoCard
                  title="Post EISA Monitoring"
                  value={String(
                    incomingRecords.filter((r) => r.processType === 'post_eisa_monitoring').length
                  )}
                  icon={<FileText className="h-5 w-5" />}
                />
              </div>

              <RecordsTable
                records={incomingRecords}
                actionRenderer={(record) => (
                  <>
                    <ActionButton
                      variant="secondary"
                      icon={<Eye className="h-4 w-4" />}
                      onClick={() => setSelectedRecord(record)}
                    >
                      View
                    </ActionButton>

                    {currentRole === 'Assistant Director' &&
                      record.stage === 'incoming_request' && (
                        <ActionButton
                          icon={<PencilLine className="h-4 w-4" />}
                          onClick={() => openPlanModal(record)}
                        >
                          Create Schedule & Plan
                        </ActionButton>
                      )}
                  </>
                )}
              />
            </SectionShell>
          )}

          {activeTab === 'planningScheduling' && (
            <SectionShell
              title="Planning & Scheduling"
              description="Prepare schedules and monthly plans, then send through the correct review chain."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard title="Plans Drafted" value={String(planningRecords.length)} icon={<CalendarDays className="h-5 w-5" />} />
                <InfoCard
                  title="Awaiting Review"
                  value={String(
                    planningRecords.filter(
                      (r) =>
                        r.deputyDirectorStatus === 'in_progress' ||
                        r.domainDirectorStatus === 'in_progress' ||
                        r.directorStatus === 'in_progress'
                    ).length
                  )}
                  icon={<CalendarClock className="h-5 w-5" />}
                />
                <InfoCard
                  title="Schedules Ready"
                  value={String(
                    planningRecords.filter((r) => r.schedulePrepared && r.monthlyPlanPrepared).length
                  )}
                  icon={<FolderCheck className="h-5 w-5" />}
                />
              </div>

              <RecordsTable
                records={planningRecords}
                actionRenderer={(record) => (
                  <>
                    <ActionButton
                      variant="secondary"
                      icon={<Eye className="h-4 w-4" />}
                      onClick={() => setSelectedRecord(record)}
                    >
                      View
                    </ActionButton>

                    {currentRole === 'Assistant Director' && (
                      <ActionButton
                        icon={<PencilLine className="h-4 w-4" />}
                        onClick={() => openPlanModal(record)}
                        variant="secondary"
                      >
                        Edit Plan
                      </ActionButton>
                    )}

                    {currentRole === 'Deputy Director' &&
                      record.processType === 'marked_moderated_scripts' &&
                      record.subStage === 'deputy_director_review' && (
                        <ActionButton
                          icon={<ClipboardCheck className="h-4 w-4" />}
                          onClick={() => handleDeputyDirectorRecommendMarkedModerated(record.id)}
                        >
                          Recommend to Domain Director
                        </ActionButton>
                      )}

                    {currentRole === 'Domain Director' &&
                      record.processType === 'marked_moderated_scripts' &&
                      record.subStage === 'domain_director_approval' && (
                        <ActionButton
                          icon={<CheckCircle2 className="h-4 w-4" />}
                          onClick={() => handleDomainDirectorApproveMarkedModerated(record.id)}
                        >
                          Approve Plan
                        </ActionButton>
                      )}

                    {currentRole === 'Deputy Director' &&
                      record.processType === 'post_eisa_monitoring' &&
                      record.subStage === 'deputy_director_review' && (
                        <ActionButton
                          icon={<ClipboardCheck className="h-4 w-4" />}
                          onClick={() => handleDeputyDirectorRecommendPostEisa(record.id)}
                        >
                          Recommend to Director
                        </ActionButton>
                      )}

                    {currentRole === 'Director' &&
                      record.processType === 'post_eisa_monitoring' &&
                      record.subStage === 'director_review' && (
                        <ActionButton
                          icon={<CheckCircle2 className="h-4 w-4" />}
                          onClick={() => handleDirectorApprovePostEisa(record.id)}
                        >
                          Approve Plan
                        </ActionButton>
                      )}
                  </>
                )}
              />
            </SectionShell>
          )}

          {activeTab === 'siteVisitExecution' && (
            <SectionShell
              title="Site Visit Execution"
              description="Book and conduct site visits according to the approved plans."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard
                  title="Booked Visits"
                  value={String(executionRecords.filter((r) => r.siteVisitBooked).length)}
                  icon={<MapPinned className="h-5 w-5" />}
                />
                <InfoCard
                  title="Upcoming Visits"
                  value={String(executionRecords.length)}
                  icon={<MapPinned className="h-5 w-5" />}
                />
                <InfoCard
                  title="Execution Records"
                  value={String(executionRecords.length)}
                  icon={<MapPinned className="h-5 w-5" />}
                />
              </div>

              <RecordsTable
                records={executionRecords}
                actionRenderer={(record) => (
                  <>
                    <ActionButton
                      variant="secondary"
                      icon={<Eye className="h-4 w-4" />}
                      onClick={() => setSelectedRecord(record)}
                    >
                      View
                    </ActionButton>

                    {currentRole === 'Sub Domain Admin' &&
                      record.processType === 'marked_moderated_scripts' &&
                      !record.siteVisitBooked && (
                        <ActionButton
                          icon={<CalendarDays className="h-4 w-4" />}
                          onClick={() => handleBookSiteVisit(record.id)}
                        >
                          Book Site Visit
                        </ActionButton>
                      )}

                    {currentRole === 'Deputy & Assistant Director' &&
                      record.processType === 'marked_moderated_scripts' &&
                      record.subStage === 'site_visit_conducted' && (
                        <ActionButton
                          icon={<FileText className="h-4 w-4" />}
                          onClick={() => handleCompileEvaluationReport(record.id)}
                        >
                          Compile Evaluation Report
                        </ActionButton>
                      )}

                    {currentRole === 'Assistant Director' &&
                      record.processType === 'post_eisa_monitoring' &&
                      record.subStage === 'site_visit_conducted' && (
                        <ActionButton
                          icon={<FileText className="h-4 w-4" />}
                          onClick={() => handleGeneratePemReport(record.id)}
                        >
                          Generate PEM Report
                        </ActionButton>
                      )}
                  </>
                )}
              />
            </SectionShell>
          )}

          {activeTab === 'evaluationReports' && (
            <SectionShell
              title="Evaluation & Reports"
              description="Compile Evaluation Reports for Marked & Moderated Scripts and PEM Reports for Post EISA Monitoring."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard title="Draft Reports" value={String(evaluationRecords.length)} icon={<FileText className="h-5 w-5" />} />
                <InfoCard
                  title="Evaluation Reports"
                  value={String(evaluationRecords.filter((r) => r.evaluationReportCompiled).length)}
                  icon={<FileText className="h-5 w-5" />}
                />
                <InfoCard
                  title="PEM Reports"
                  value={String(evaluationRecords.filter((r) => r.pemReportGenerated).length)}
                  icon={<FileText className="h-5 w-5" />}
                />
              </div>

              <RecordsTable
                records={evaluationRecords}
                actionRenderer={(record) => (
                  <>
                    <ActionButton
                      variant="secondary"
                      icon={<Eye className="h-4 w-4" />}
                      onClick={() => setSelectedRecord(record)}
                    >
                      View
                    </ActionButton>

                    {record.processType === 'marked_moderated_scripts' &&
                      record.evaluationReportCompiled &&
                      currentRole === 'Deputy Director' && (
                        <ActionButton
                          icon={<Send className="h-4 w-4" />}
                          onClick={() => handleSendMarkedModeratedToQp(record.id)}
                        >
                          Send Outcome to QP
                        </ActionButton>
                      )}

                    {record.processType === 'post_eisa_monitoring' &&
                      record.pemReportGenerated &&
                      currentRole === 'Deputy Director' && (
                        <ActionButton
                          icon={<ClipboardCheck className="h-4 w-4" />}
                          onClick={() => handleApprovePemAndUpdateQp(record.id)}
                        >
                          Approve PEM & Update QP
                        </ActionButton>
                      )}
                  </>
                )}
              />
            </SectionShell>
          )}

          {activeTab === 'approvalsOutcomes' && (
            <SectionShell
              title="Approvals & Outcomes"
              description="Track final approvals and outcomes sent back to Quality Partner."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard
                  title="Awaiting Approval"
                  value={String(records.filter((r) => r.stage === 'approval_outcome').length)}
                  icon={<CheckCircle2 className="h-5 w-5" />}
                />
                <InfoCard
                  title="Sent to QP"
                  value={String(records.filter((r) => r.sentToQp).length)}
                  icon={<CheckCircle2 className="h-5 w-5" />}
                />
                <InfoCard
                  title="Closed Records"
                  value={String(records.filter((r) => r.stage === 'closed').length)}
                  icon={<CheckCircle2 className="h-5 w-5" />}
                />
              </div>

              <RecordsTable
                records={approvalRecords}
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

          {activeTab === 'monitoringDashboard' && (
            <SectionShell
              title="Monitoring Dashboard"
              description="Track site visit activity, reports, and outcomes across both process flows."
            >
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <InfoCard title="Incoming" value={String(dashboardCards.totalIncoming)} icon={<Inbox className="h-5 w-5" />} />
                <InfoCard title="Planning" value={String(dashboardCards.totalPlanning)} icon={<CalendarDays className="h-5 w-5" />} />
                <InfoCard title="Execution" value={String(dashboardCards.totalExecution)} icon={<MapPinned className="h-5 w-5" />} />
                <InfoCard title="Reports" value={String(dashboardCards.totalReports)} icon={<FileText className="h-5 w-5" />} />
                <InfoCard title="Closed" value={String(dashboardCards.totalClosed)} icon={<CheckCircle2 className="h-5 w-5" />} />
                <InfoCard title="Updated QP" value={String(dashboardCards.sentToQp)} icon={<BarChart3 className="h-5 w-5" />} />
              </div>

              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8">
                <h3 className="text-base font-semibold text-gray-900">Monitoring Summary</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                  This dashboard tracks Marked & Moderated Scripts and Post EISA Monitoring across intake,
                  planning, execution, reporting, approvals, and outcomes sent back to Quality Partner.
                </p>
              </div>
            </SectionShell>
          )}
        </div>
      </div>

      {selectedRecord && (
        <InternalMonitoringDetailsModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {planModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Create Site Visit Schedule & Monthly Plan
                </h3>
                <p className="mt-1 text-sm text-gray-600">{planModalRecord.title}</p>
              </div>

              <button
                type="button"
                onClick={closePlanModal}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Schedule Title
                </label>
                <input
                  type="text"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400"
                  placeholder="Enter schedule title"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Schedule Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Schedule Time
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Venue / Site
                </label>
                <input
                  type="text"
                  value={scheduleVenue}
                  onChange={(e) => setScheduleVenue(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400"
                  placeholder="Enter venue"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Monthly Plan Month
                </label>
                <input
                  type="text"
                  value={monthlyPlanMonth}
                  onChange={(e) => setMonthlyPlanMonth(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400"
                  placeholder="Example: May 2026"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Assigned Officials
                </label>
                <input
                  type="text"
                  value={assignedOfficials}
                  onChange={(e) => setAssignedOfficials(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400"
                  placeholder="Example: Assistant Director, Deputy Director"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Monthly Plan Summary
                </label>
                <textarea
                  value={monthlyPlanSummary}
                  onChange={(e) => setMonthlyPlanSummary(e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400"
                  placeholder="Enter the detailed site visit monthly plan..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={closePlanModal}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePlan}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Save Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordsTable({
  records,
  actionRenderer,
}: {
  records: SiteMonitoringRecord[];
  actionRenderer: (record: SiteMonitoringRecord) => React.ReactNode;
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
                Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">
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
                    <StageBadge stage={record.stage} subStage={record.subStage} />
                  </td>

                  <td className="px-5 py-4 align-top">
                    <StatusBadge
                      status={
                        record.stage === 'closed'
                          ? 'approved'
                          : record.deputyDirectorStatus === 'in_progress' ||
                            record.domainDirectorStatus === 'in_progress' ||
                            record.directorStatus === 'in_progress'
                          ? 'in_progress'
                          : 'pending'
                      }
                      approvedLabel="Completed"
                      pendingLabel="Pending"
                    />
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

function InternalMonitoringDetailsModal({
  record,
  onClose,
}: {
  record: SiteMonitoringRecord;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{record.title}</h3>
            <p className="mt-1 text-sm text-gray-600">Site visits and monitoring record details</p>
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
            <DetailStat title="Process" value={getProcessLabel(record.processType)} icon={<Inbox className="h-5 w-5" />} />
            <DetailStat title="Stage" value={getSubStageLabel(record.subStage)} icon={<CalendarDays className="h-5 w-5" />} />
            <DetailStat title="Visit Date" value={record.visitDate} icon={<MapPinned className="h-5 w-5" />} />
            <DetailStat title="Sent to QP" value={record.sentToQp ? 'Yes' : 'No'} icon={<Send className="h-5 w-5" />} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h4 className="text-sm font-semibold text-gray-900">Workflow Details</h4>
              <div className="mt-4 space-y-3">
                <DetailRow label="Source From" value={record.sourceFrom} />
                <DetailRow label="Submitted By" value={record.submittedBy} />
                <DetailRow label="Site Name" value={record.siteName} />
                <DetailRow label="Created At" value={record.createdAt} />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h4 className="text-sm font-semibold text-gray-900">Checklist</h4>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ChecklistBadge label="EISA Notification Submitted" checked={record.eisaNotificationSubmitted} />
                <ChecklistBadge label="Approved Results Submitted" checked={record.approvedResultsSubmitted} />
                <ChecklistBadge label="Schedule Prepared" checked={record.schedulePrepared} />
                <ChecklistBadge label="Monthly Plan Prepared" checked={record.monthlyPlanPrepared} />
                <ChecklistBadge label="Competency Checked" checked={record.competencyRateChecked} />
                <ChecklistBadge label="SDP Identified" checked={record.sdpIdentified} />
                <ChecklistBadge label="Site Visit Booked" checked={record.siteVisitBooked} />
                <ChecklistBadge label="Evaluation Tool Completed" checked={record.evaluationToolCompleted} />
                <ChecklistBadge label="Evaluation Report Compiled" checked={record.evaluationReportCompiled} />
                <ChecklistBadge label="PEM Report Generated" checked={record.pemReportGenerated} />
              </div>
            </div>
          </div>

          {(record.scheduleTitle ||
            record.scheduleDate ||
            record.scheduleVenue ||
            record.monthlyPlanSummary) && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h4 className="text-sm font-semibold text-gray-900">Schedule & Monthly Plan</h4>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <DetailRow label="Schedule Title" value={record.scheduleTitle || '-'} />
                <DetailRow label="Schedule Date" value={record.scheduleDate || '-'} />
                <DetailRow label="Schedule Time" value={record.scheduleTime || '-'} />
                <DetailRow label="Venue / Site" value={record.scheduleVenue || '-'} />
                <DetailRow label="Monthly Plan Month" value={record.monthlyPlanMonth || '-'} />
                <DetailRow label="Assigned Officials" value={record.assignedOfficials || '-'} />
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                  Monthly Plan Summary
                </p>
                <p className="mt-1 text-sm text-gray-800">
                  {record.monthlyPlanSummary || '-'}
                </p>
              </div>
              {record.bookingReference && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                    Booking Reference
                  </p>
                  <p className="mt-1 text-sm text-gray-800">{record.bookingReference}</p>
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h4 className="text-sm font-semibold text-gray-900">Approvals</h4>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <ApprovalCard title="Deputy Director" status={record.deputyDirectorStatus} />
              <ApprovalCard title="Domain Director" status={record.domainDirectorStatus} />
              <ApprovalCard title="Director" status={record.directorStatus} />
            </div>
          </div>
        </div>
      </div>
    </div>
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
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
      {children}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium ${
        active ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

function getProcessLabel(processType: MonitoringProcessType) {
  return processType === 'marked_moderated_scripts'
    ? 'Marked & Moderated Scripts'
    : 'Post EISA Monitoring';
}

function getSubStageLabel(subStage: SiteMonitoringSubStage) {
  switch (subStage) {
    case 'eisa_notification_received':
      return 'EISA Notification Received';
    case 'approved_results_received':
      return 'Approved Results Received';
    case 'plan_prepared':
      return 'Plan Prepared';
    case 'competency_checked':
      return 'Competency Checked';
    case 'sdp_identified':
      return 'SDP Identified';
    case 'deputy_director_review':
      return 'Deputy Director Review';
    case 'domain_director_approval':
      return 'Domain Director Approval';
    case 'director_review':
      return 'Director Review';
    case 'site_visit_booked':
      return 'Site Visit Booked';
    case 'site_visit_conducted':
      return 'Site Visit Conducted';
    case 'evaluation_report_compiled':
      return 'Evaluation Report Compiled';
    case 'pem_report_generated':
      return 'PEM Report Generated';
    case 'outcome_sent_to_qp':
      return 'Outcome Sent to QP';
    default:
      return subStage;
  }
}

function StageBadge({
  stage,
  subStage,
}: {
  stage: SiteMonitoringStage;
  subStage: SiteMonitoringSubStage;
}) {
  const styles =
    stage === 'closed'
      ? 'bg-green-50 text-green-700 ring-green-600/20'
      : stage === 'evaluation_reporting'
      ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
      : stage === 'site_visit_execution'
      ? 'bg-purple-50 text-purple-700 ring-purple-600/20'
      : 'bg-amber-50 text-amber-700 ring-amber-600/20';

  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles}`}
    >
      {getSubStageLabel(subStage)}
    </span>
  );
}

function StatusBadge({
  status,
  approvedLabel = 'Approved',
  pendingLabel = 'Pending',
}: {
  status: 'pending' | 'in_progress' | 'approved';
  approvedLabel?: string;
  pendingLabel?: string;
}) {
  if (status === 'approved') {
    return (
      <span className="inline-flex h-8 items-center rounded-full bg-green-50 px-3 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
        {approvedLabel}
      </span>
    );
  }

  if (status === 'in_progress') {
    return (
      <span className="inline-flex h-8 items-center rounded-full bg-blue-50 px-3 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
        In Progress
      </span>
    );
  }

  return (
    <span className="inline-flex h-8 items-center rounded-full bg-gray-100 px-3 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">
      {pendingLabel}
    </span>
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-800">{value}</p>
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

function ApprovalCard({
  title,
  status,
}: {
  title: string;
  status: WorkflowStatus;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <div className="mt-3">
        <StatusBadge status={status} />
      </div>
    </div>
  );
}