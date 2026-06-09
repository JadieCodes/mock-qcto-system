// src/pages/assessment/External/ExternalSiteVisitsAndMonitoring.tsx

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
  X,
  Calendar,
  MapPin,
  User as UserIcon,
  Mail,
  Clock,
  Phone,
  Building2,
  CheckCircle,
  ShieldCheck,
  Paperclip,
  FileSignature,
  ThumbsUp,
  AlertCircle,
  MessageSquare,
  BarChart3,
  HardDrive,
  Tag,
  BookOpen,
  Hash,
  Award,
  Wrench,
  Layers,
  RefreshCw,
  FileCheck,
  Users,
  MapPinned,
  ClipboardCheck,
  PenLine,
  GraduationCap,
  Upload,
  Save,
} from 'lucide-react';

// ============ TYPES ============
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
type ModalTab = 'details' | 'schedule' | 'liaise' | 'validation' | 'dd_review' | 'registration' | 'evaluation_report' | 'approved_results';
type YesNo = 'yes' | 'no' | '';

// ============ QA REPORT INTERFACES ============
interface LearnerAchievementRow {
  qualificationName: string;
  enrolledLearners: string;
  candidatesAssessed: string;
  totalScriptsMarked: string;
  numModerators: string;
  numMarkers: string;
  competentLearners: string;
  nycLearners: string;
}

interface QaStandardItem {
  yes: boolean | null;
  no: boolean | null;
  explanation: string;
}

interface QAEvaluationReport {
  markingCentreName: string;
  physicalAddress: string;
  province: string;
  eisaDate: string;
  dateMarkingStarted: string;
  dateMarkingCompleted: string;
  numCandidatesAssessed: string;
  numScriptsModerated: string;
  numCandidatesAbsent: string;
  passPercentage: string;
  nycPercentage: string;
  percentageModerated: string;
  registrationStartDate: string;
  registrationEndDate: string;
  lastDateOfEnrolment: string;
  lastDateForAchievement: string;
  qctoOfficialName: string;
  qctoOfficialContact: string;
  qctoOfficialEmail: string;
  qpResponsiblePersonName: string;
  qpResponsibleContact: string;
  qpResponsibleEmail: string;
  assessorName: string;
  assessorMobile: string;
  assessorEmail: string;
  moderatorName: string;
  moderatorMobile: string;
  moderatorEmail: string;
  learnerAchievements: LearnerAchievementRow[];
  standards: Record<string, QaStandardItem>;
  qualityOfQuestionPaper: string;
  generalComments: string;
  completedBy: string;
  completedDate: string;
  reportFinalised: boolean;
}

// ============ APPROVED RESULTS QUESTIONNAIRE INTERFACES ============
interface FacilitatorQuestionnaire {
  sdpName: string;
  facilitatorName: string;
  modulesFactilitated: string;
  todaysDate: string;
  q1: string; q2: string; q3: string; q4: string; q5: string;
  q6: string; q7: string; q8: string; q9: string; q10: string;
  q11: string; q12: string; q13: string; q14: string; q15: string;
  q16: string; q17: string; q18: string; q19: string; q20: string;
  q21: string; q22: string; q23: string; q24: string; q25: string; q26: string;
}

interface LearnerQuestionnaire {
  sdpName: string;
  learnerName: string;
  durationFrom: string;
  durationUntil: string;
  dateOfEisa: string;
  todaysDate: string;
  q1: string; q2: string; q3: string; q4: string; q5: string;
  q6: string; q7: string; q8assessmentMethod: string; q8feedback: string; q8yesNo: string;
  q9: string; q10: string; q11: string; q12: string; q13: string;
  q14: string; q15: string; q16: string; q17: string; q18: string;
  q19: string; q20: string; q21: string; q22: string; q23: string; q24: string;
}

interface ApprovedResultsSubmission {
  facilitator: FacilitatorQuestionnaire;
  learner: LearnerQuestionnaire;
  submittedAt: string;
  submittedBy: string;
}

const EMPTY_FACILITATOR: FacilitatorQuestionnaire = {
  sdpName: '', facilitatorName: '', modulesFactilitated: '', todaysDate: '',
  q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '', q9: '', q10: '',
  q11: '', q12: '', q13: '', q14: '', q15: '', q16: '', q17: '', q18: '', q19: '', q20: '',
  q21: '', q22: '', q23: '', q24: '', q25: '', q26: '',
};

const EMPTY_LEARNER: LearnerQuestionnaire = {
  sdpName: '', learnerName: '', durationFrom: '', durationUntil: '',
  dateOfEisa: '', todaysDate: '',
  q1: '', q2: '', q3: '', q4: '', q5: '', q6: '',
  q7: '', q8assessmentMethod: '', q8feedback: '', q8yesNo: '',
  q9: '', q10: '', q11: '', q12: '', q13: '', q14: '',
  q15: '', q16: '', q17: '', q18: '', q19: '', q20: '',
  q21: '', q22: '', q23: '', q24: '',
};

// ============ INTERFACES ============
interface ChecklistSection { findings: string; recommendations: string; }

interface InstrumentValidationData {
  qpName: string; qpAddress: string; qpContactNumber: string; qpContactPerson: string;
  dateOfEisa: string; dateInstrumentViewed: string; instrumentOrExemplar: string;
  qualificationTitle: string; qualificationRegStatus: string; saqaId: string;
  credits: string; nqfLevel: string; completedByName: string; completedByDesignation: string;
  completedByDate: string; previousValidationDate: string; previousRecommendations: string;
  qas: { addendumDeveloped: YesNo; addendumFiled: YesNo; componentDetailsCapture: YesNo; currentTemplate: YesNo; componentDetailsMatch: YesNo; file3TemplateProvided: YesNo; calculatorProvided: YesNo; section: ChecklistSection; };
  examiner: { criteriaSpecified: YesNo; meetsCriteria: YesNo; reportCompleted: YesNo; reportOnTemplate: YesNo; reportChecked: YesNo; remediationsRequested: YesNo; section: ChecklistSection; };
  moderator: { criteriaSpecified: YesNo; meetsCriteria: YesNo; reportCompleted: YesNo; reportOnTemplate: YesNo; remediationRequested: YesNo; changesM: YesNo; changesCommunicated: YesNo; reportChecked: YesNo; section: ChecklistSection; };
  overall: { approvedByModerator: YesNo; separatedDocuments: YesNo; memoCorresponds: YesNo; frontPageCorrect: YesNo; eisaRulesStipulated: YesNo; assessmentInstructions: YesNo; instructionsClear: YesNo; grammarChecked: YesNo; spellingChecked: YesNo; questionNumbersMatch: YesNo; languageLevel: YesNo; cognitiveOrder: YesNo; section: ChecklistSection; };
  documents: { moderatorReport: boolean; examinerReport: boolean; cv: boolean; confidentialityAgreement: boolean; eisaInstrumentMemo: boolean; eisaInstrumentRubric: boolean; };
}

interface EisaOutcomeReport {
  ddRecommendations: string;
  ddChangesRequired: string;
  outcomeDecision: 'approved' | 'approved_with_conditions' | 'not_approved' | '';
  outcomeNotes: string;
  ddReviewedBy: string;
  ddReviewedAt: string;
  reportFinalised: boolean;
  reportFinalisedAt?: string;
}

interface EisaScheduleData {
  validationDate: string; startTime: string; endTime: string; venue: string;
  assessorName: string; assessorEmail: string; notes: string;
  scheduleDocumentName?: string; submittedToInternalAt?: string;
  internalStatus?: string;
  qpContactPerson?: string; qpContactNumber?: string; qpContactEmail?: string;
  validationConfirmed?: boolean; logisticsArranged?: boolean;
  internalNotes?: string; internalUpdatedBy?: string; internalUpdatedAt?: string;
  instrumentValidation?: InstrumentValidationData;
}

interface ExtendedMonitoringRecord {
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
  scheduleTitle?: string;
  scheduleDate?: string;
  scheduleTime?: string;
  scheduleVenue?: string;
  monthlyPlanMonth?: string;
  monthlyPlanSummary?: string;
  assignedOfficials?: string;
  bookingReference?: string;
  eisaRegNo?: string;
  registrationNumber?: string;
  stream?: 'trades' | 'nonTrades';
  saqaId?: string;
  nqfLevel?: string;
  credits?: string;
  leisaFile?: boolean;
  leisaFileName?: string;
  sorAndQaReports?: boolean;
  sorQaReportsFileName?: string;
  eisaRegDocument?: boolean;
  eisaRegFileName?: string;
  leisaFormData?: {
    compilerName: string; compilerEmail: string; compilerPhone: string;
    institutionPhone: string; qualificationName: string; startDate: string;
    expectedCompletionDate: string; sdpName: string; sdpAddress: string; province: string;
  };
  outcomeDecision?: string;
  outcomeReport?: EisaOutcomeReport;
  eisaSchedule?: EisaScheduleData;
  saqaQualificationDocument?: string;
  curriculumDocument?: string;
  qasAddendum?: string;
  acknowledgementLetterName?: string | null;
  finalApprovalLetterName?: string | null;
  ceoApprovalNotes?: string;
  acknowledgementStatus?: string;
  // Site visit execution fields
  siteVisitBookedAt?: string;
  siteVisitConductedAt?: string;
  qaEvaluationReport?: QAEvaluationReport;
  sentToQpAt?: string;
  sentToQpBy?: string;
  // External approved results submission
  approvedResultsSubmission?: ApprovedResultsSubmission;
  approvedResultsSubmittedAt?: string;
}

const STORAGE_KEY = 'site_visits_monitoring_records';

const INITIAL_SHARED_RECORDS: ExtendedMonitoringRecord[] = [
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

// ============ STAGE HELPERS ============
function toExternalStage(record: ExtendedMonitoringRecord): ExternalStage {
  if (record.sentToQp || record.stage === 'closed') return 'closed';
  if (record.evaluationReportCompiled || record.pemReportGenerated) return 'report_outcome_available';
  if (
    record.schedulePrepared &&
    record.monthlyPlanPrepared &&
    (record.domainDirectorStatus === 'approved' || record.directorStatus === 'approved')
  ) return 'schedule_received';
  return 'submitted_to_assessment';
}

// ============ QA STANDARDS DEFINITIONS (read-only display) ============
const QA_SECTIONS = [
  { id: '1', title: '1. Efficient Planning Conducted by Marking Centre', items: [
    { key: '1.1', label: 'All answer scripts have been marked' },
    { key: '1.2', label: 'Required appointments for Marking and Moderation were made timeously by the QP' },
    { key: '1.3', label: 'Moderators and Markers appointed all have the necessary subject knowledge and required experience' },
    { key: '1.4', label: 'Marking guidelines training was attended by all appointed Markers and Moderators' },
    { key: '1.5', label: 'The Attendance Register is available for the virtual Marking Guidelines' },
    { key: '1.6', label: 'Appointed Markers and Moderators who did not take part in the Marking Guidelines Discussion session were withdrawn' },
    { key: '1.7', label: 'Standardisation of the marking memorandum was determined' },
    { key: '1.8', label: 'Final Marking memorandum was received timeously by the markers to begin marking as scheduled' },
    { key: '1.9', label: 'There are measures in place to ensure that markers do not mark scripts of candidates from their own SDP' },
    { key: '1.10', label: 'Are the calculations of Marks done accurately' },
    { key: '1.11', label: 'Are all questions on the scripts marked' },
  ]},
  { id: '2', title: '2. Marking Venue is of the Required Standard', items: [
    { key: '2.1', label: 'Required furniture and ventilation were available' },
    { key: '2.2', label: 'The attendance register was completed by appointed markers' },
    { key: '2.3', label: 'Only AQP Appointed Marking officials were allowed in the Marking venue/s' },
    { key: '2.4', label: 'Were scripts Marked by AQP Appointed Marker/s and Moderator' },
  ]},
  { id: '3', title: '3. Security of Venue and Scripts is Maintained', items: [
    { key: '3.1', label: 'Scripts were received timeously from the Assessment Centres' },
    { key: '3.2', label: 'Security protocols for the receipt of scripts and return of scripts was followed at all times' },
    { key: '3.3', label: 'All scripts were marked' },
    { key: '3.4', label: 'The required percentage of scripts was moderated' },
  ]},
  { id: '4', title: '4. Standard of Marking is Consistent, and Irregularities Identified', items: [
    { key: '4.1', label: 'The Moderator and Marker adhered to the final Marking Guidelines' },
    { key: '4.2', label: 'Were any changes to marking guidelines received after the finalization of the marking guidelines?' },
    { key: '4.3', label: 'The moderator identified a marker who was applying the marking guidelines incorrectly or inconsistently and brought up to standard' },
    { key: '4.4', label: 'Feedback was provided to markers from the samples moderated by Moderator to ensure consistency of marking' },
    { key: '4.5', label: 'Major discrepancies between marker and moderator were addressed' },
    { key: '4.6', label: 'Marks awarded for each question for each script was checked for accuracy and totalling before capturing of results' },
    { key: '4.7', label: 'Irregularities were identified' },
    { key: '4.8', label: 'If applicable, explain how these irregularities were dealt with' },
  ]},
  { id: '5', title: '5. Adherence to Required Policies, Schedules and Quality of Reporting', items: [
    { key: '5.1', label: 'Marking Centre adhered strictly to QP Assessment Policy' },
    { key: '5.2', label: 'Marking and Moderation was completed according to the QP schedule' },
    { key: '5.3', label: 'Required Marker and Moderator Reports were submitted timeously to the QP' },
    { key: '5.4', label: 'The reports were read and quality assured by the AQP for accuracy and valuable input before being sent to the QCTO' },
    { key: '5.5', label: 'The QP verified the accuracy of the results received from the Moderator' },
    { key: '5.6', label: 'Marking and Moderation took place as per the QP schedule' },
    { key: '5.7', label: 'Required documents and reports will be sent to the QCTO by the due date' },
  ]},
  { id: '6', title: '6. Comment on the following', items: [
    { key: '6.1', label: 'In the case of different marks awarded by the Marker and the Moderator, which marks are captured as the final result for the EISA?' },
    { key: '6.2', label: 'More sample marking should be conducted before the marking of batches. Was this done by marker and Moderator?' },
  ]},
];

// ============ HELPER COMPONENTS ============
function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <div className="text-sm font-medium text-gray-900 mt-0.5">{value || '—'}</div>
      </div>
    </div>
  );
}

function OutcomeBadge({ decision }: { decision: string }) {
  if (!decision) return null;
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: '✓ Approved', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    approved_with_conditions: { label: '⚠ Approved with Conditions', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    not_approved: { label: '✗ Not Approved', cls: 'bg-red-100 text-red-700 border-red-200' },
  };
  const d = map[decision];
  if (!d) return null;
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${d.cls}`}>{d.label}</span>;
}

function ChecklistSummaryRow({ label, value }: { label: string; value: YesNo }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600 flex-1">{label}</span>
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${value === 'yes' ? 'bg-emerald-100 text-emerald-700' : value === 'no' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
        {value === 'yes' ? 'Yes' : value === 'no' ? 'No' : 'Not answered'}
      </span>
    </div>
  );
}

function StageBadge({ stage }: { stage: ExternalStage }) {
  const map: Record<ExternalStage, { label: string; cls: string }> = {
    submitted_to_assessment: { label: 'Submitted to Assessment', cls: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
    schedule_received:       { label: 'Schedule Received',       cls: 'bg-purple-50 text-purple-700 ring-purple-600/20' },
    report_outcome_available:{ label: 'Report Available',        cls: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
    closed:                  { label: 'Results Received',        cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  };
  const d = map[stage] ?? { label: stage, cls: 'bg-gray-50 text-gray-700 ring-gray-600/20' };
  return <span className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold ring-1 ring-inset ${d.cls}`}>{d.label}</span>;
}

function InfoCard({ title, value, icon, accent }: { title: string; value: string; icon: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`inline-flex h-10 w-10 rounded-xl items-center justify-center flex-shrink-0 ${accent || 'bg-gray-100 text-gray-600'}`}>{icon}</div>
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${active ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
    >
      {label}
    </button>
  );
}

function SectionShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
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

function ActionButton({ children, icon, onClick, variant = 'primary' }: { children: React.ReactNode; icon?: React.ReactNode; onClick: () => void; variant?: 'primary' | 'secondary' }) {
  const styles = variant === 'secondary'
    ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
    : 'bg-red-600 text-white hover:bg-red-700';
  return (
    <button type="button" onClick={onClick} className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${styles}`}>
      {icon}{children}
    </button>
  );
}

function formatDate(d?: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('en-ZA'); }
  catch { return d ?? '-'; }
}

function formatDateTime(d?: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleString('en-ZA'); }
  catch { return d ?? '-'; }
}

function getProcessLabel(processType: MonitoringProcessType) {
  return processType === 'marked_moderated_scripts' ? 'Marked & Moderated Scripts' : 'Post EISA Monitoring';
}

// ============ QA EVALUATION REPORT VIEWER (Read-only) ============
function QAEvaluationReportViewer({ report }: { report: QAEvaluationReport }) {
  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <FileCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-800">QA Evaluation Report — Finalised</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            Compiled by {report.completedBy || 'QCTO Official'} on {report.completedDate ? formatDate(report.completedDate) : '—'} · Sent from Assessment Domain
          </p>
        </div>
      </div>

      {/* Assessor / Moderator */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Assessor & Moderator</p>
        </div>
        <div className="p-5 grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Assessor / Marker</p><p className="font-medium">{report.assessorName || '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Assessor Mobile</p><p className="font-medium">{report.assessorMobile || '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Assessor Email</p><p className="font-medium">{report.assessorEmail || '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Moderator</p><p className="font-medium">{report.moderatorName || '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Moderator Mobile</p><p className="font-medium">{report.moderatorMobile || '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Moderator Email</p><p className="font-medium">{report.moderatorEmail || '—'}</p></div>
        </div>
      </div>

      {/* Marking Centre Details */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">1.1 Marking Centre Details</p>
        </div>
        <div className="p-5 grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div className="md:col-span-2"><p className="text-xs text-gray-400 uppercase tracking-wide">Marking Centre</p><p className="font-medium">{report.markingCentreName || '—'}</p></div>
          <div className="md:col-span-2"><p className="text-xs text-gray-400 uppercase tracking-wide">Physical Address</p><p className="font-medium">{report.physicalAddress || '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Province</p><p className="font-medium">{report.province || '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">EISA Date</p><p className="font-medium">{formatDate(report.eisaDate)}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Marking Started</p><p className="font-medium">{formatDate(report.dateMarkingStarted)}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Marking Completed</p><p className="font-medium">{formatDate(report.dateMarkingCompleted)}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Candidates Assessed</p><p className="font-semibold text-lg">{report.numCandidatesAssessed || '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Scripts Moderated</p><p className="font-semibold text-lg">{report.numScriptsModerated || '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Candidates Absent</p><p className="font-semibold text-lg">{report.numCandidatesAbsent || '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Pass %</p><p className="font-semibold text-lg text-emerald-700">{report.passPercentage ? `${report.passPercentage}%` : '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">NYC %</p><p className="font-semibold text-lg text-red-600">{report.nycPercentage ? `${report.nycPercentage}%` : '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">% Moderated</p><p className="font-semibold text-lg">{report.percentageModerated ? `${report.percentageModerated}%` : '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Registration Start</p><p className="font-medium">{formatDate(report.registrationStartDate)}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Registration End</p><p className="font-medium">{formatDate(report.registrationEndDate)}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Last Date of Enrolment</p><p className="font-medium">{formatDate(report.lastDateOfEnrolment)}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">Last Date for Achievement</p><p className="font-medium">{formatDate(report.lastDateForAchievement)}</p></div>
          {/* QCTO Official */}
          <div className="md:col-span-2 rounded-xl bg-blue-50 border border-blue-100 p-3">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">QCTO Official</p>
            <div className="grid md:grid-cols-3 gap-2 text-sm">
              <div><span className="text-xs text-gray-400">Name:</span><p className="font-medium">{report.qctoOfficialName}</p></div>
              <div><span className="text-xs text-gray-400">Contact:</span><p className="font-medium">{report.qctoOfficialContact}</p></div>
              <div><span className="text-xs text-gray-400">Email:</span><p className="font-medium text-xs">{report.qctoOfficialEmail}</p></div>
            </div>
          </div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">QP Responsible Person</p><p className="font-medium">{report.qpResponsiblePersonName || '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase tracking-wide">QP Contact</p><p className="font-medium">{report.qpResponsibleContact || '—'}</p></div>
          <div className="md:col-span-2"><p className="text-xs text-gray-400 uppercase tracking-wide">QP Email</p><p className="font-medium">{report.qpResponsibleEmail || '—'}</p></div>
        </div>
      </div>

      {/* Learner Achievements */}
      {report.learnerAchievements?.length > 0 && (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">2. Learner Achievements</p>
          </div>
          <div className="p-5 overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {['Qualification', 'Enrolled', 'Assessed', 'Scripts Marked', 'Moderators', 'Markers', 'Competent', 'NYC'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.learnerAchievements.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-2 text-sm font-medium text-gray-800">{row.qualificationName || '—'}</td>
                    <td className="px-3 py-2 text-center font-semibold">{row.enrolledLearners || '—'}</td>
                    <td className="px-3 py-2 text-center font-semibold">{row.candidatesAssessed || '—'}</td>
                    <td className="px-3 py-2 text-center">{row.totalScriptsMarked || '—'}</td>
                    <td className="px-3 py-2 text-center">{row.numModerators || '—'}</td>
                    <td className="px-3 py-2 text-center">{row.numMarkers || '—'}</td>
                    <td className="px-3 py-2 text-center font-semibold text-emerald-700">{row.competentLearners || '—'}</td>
                    <td className="px-3 py-2 text-center font-semibold text-red-600">{row.nycLearners || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QA Standards — summary view */}
      {QA_SECTIONS.map((section) => (
        <div key={section.id} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{section.title}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 w-10">No.</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Standard</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-emerald-600 w-16">Yes</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-red-500 w-16">No</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Explanation</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item) => {
                  const std = report.standards?.[item.key] || { yes: null, no: null, explanation: '' };
                  return (
                    <tr key={item.key} className="border-b last:border-0 hover:bg-gray-50/40">
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">{item.key}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.label}</td>
                      <td className="px-4 py-3 text-center">
                        {std.yes ? <span className="inline-flex h-5 w-5 rounded-full bg-emerald-500 items-center justify-center text-white text-xs font-bold">✓</span> : <span className="inline-block h-5 w-5 rounded-full border-2 border-gray-200" />}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {std.no ? <span className="inline-flex h-5 w-5 rounded-full bg-red-500 items-center justify-center text-white text-xs font-bold">✗</span> : <span className="inline-block h-5 w-5 rounded-full border-2 border-gray-200" />}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{std.explanation || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Sections 7 & 8 */}
      {(report.qualityOfQuestionPaper || report.generalComments) && (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">7 & 8. Quality of Question Paper & General Comments</p>
          </div>
          <div className="p-5 space-y-4">
            {report.qualityOfQuestionPaper && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">7. Quality of Question Paper</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100 whitespace-pre-wrap">{report.qualityOfQuestionPaper}</p>
              </div>
            )}
            {report.generalComments && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">8. General Comments</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100 whitespace-pre-wrap">{report.generalComments}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ FACILITATOR QUESTIONNAIRE FORM ============
function FacilitatorQuestionnaireForm({
  data,
  onChange,
  readonly,
}: {
  data: FacilitatorQuestionnaire;
  onChange: (d: FacilitatorQuestionnaire) => void;
  readonly: boolean;
}) {
  const u = (field: keyof FacilitatorQuestionnaire, val: string) => onChange({ ...data, [field]: val });
  const inputCls = `w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 resize-y ${readonly ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`;
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

  const QUESTIONS: { key: keyof FacilitatorQuestionnaire; label: string; long?: boolean }[] = [
    { key: 'q1', label: '1. An orientation session / staff meeting was held with academic staff prior to the training starting:', long: true },
    { key: 'q2', label: '2. Who is the AQP (Assessment Quality Partner) for this qualification?' },
    { key: 'q3', label: '3. Did you consult the Qualification document prior to starting with the training of the learners?', long: true },
    { key: 'q4', label: '4. Did you consult the Curriculum document prior to starting with the training of the learners?', long: true },
    { key: 'q5', label: '5. To whom do the facilitators report to? (e.g. Head of Department / Academic Manager / Head of Institution)' },
    { key: 'q6', label: '6. Was an information session held with facilitators and learners as to what is expected of them? Explain what happened during this session:', long: true },
    { key: 'q7', label: '7. Was the learning material received timeously in order for you to prepare your lessons/sessions?' },
    { key: 'q8', label: '8. Provide your opinion on the learning material used? (Was it useful; did it cover all modules; was it pitched at the correct level?) Provide detailed comments:', long: true },
    { key: 'q9', label: '9. What did you do in addition to using the learning material to make your lessons more interesting for the learners?', long: true },
    { key: 'q10', label: '10. Were attendance registers taken for each class?' },
    { key: 'q11', label: '11. What is the difference between facilitating the legacy qualification and facilitating the new Occupational Qualification, if any?', long: true },
    { key: 'q12', label: '12. What is the most important objective (end result) for a learner who does an Occupational Qualification?' },
    { key: 'q13', label: '13. What additional support was provided and/or types of meetings held with management to ensure successful facilitation?', long: true },
    { key: 'q14', label: '14. Were formal internal summative assessments completed at the end of each module?' },
    { key: 'q15', label: '15. What format/methods were used for these summative assessments?' },
    { key: 'q16', label: '16. Who recorded these formal results?' },
    { key: 'q17', label: '17. Where were these results recorded?' },
    { key: 'q18', label: '18. Did you provide feedback to the learners after each assessment? If so, how?', long: true },
    { key: 'q19', label: '19. Did you re-assess learners found Not Yet Competent in a module?' },
    { key: 'q20', label: '20. How were learners that were Not Yet Competent in a module re-assessed?', long: true },
    { key: 'q21', label: '21. Where did the learners do their workplace component?' },
    { key: 'q22', label: '22. Was the workplace monitored by you or the SDP whilst the learners were there?' },
    { key: 'q23', label: '23. What is your understanding of the External Integrated Summative Assessment (EISA)?', long: true },
    { key: 'q24', label: '24. Did you receive the exemplar of the EISA beforehand and work through it with the learners in preparation?', long: true },
    { key: 'q25', label: '25. Why do you think the learners performed so poorly during the EISA?', long: true },
    { key: 'q26', label: '26. Are there any other matters you would like to bring to the attention of QCTO?', long: true },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Facilitator Questionnaire</p>
            <p className="text-xs text-gray-500">Kindly complete by providing accurate and detailed information. All information will be treated with strict confidentiality.</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className={labelCls}>Name of SDP (Institution)</label><input className={inputCls} value={data.sdpName} onChange={e => u('sdpName', e.target.value)} disabled={readonly} placeholder="Institution name" /></div>
          <div><label className={labelCls}>Name of Facilitator</label><input className={inputCls} value={data.facilitatorName} onChange={e => u('facilitatorName', e.target.value)} disabled={readonly} placeholder="Full name" /></div>
          <div className="md:col-span-2"><label className={labelCls}>Modules Facilitated</label><input className={inputCls} value={data.modulesFactilitated} onChange={e => u('modulesFactilitated', e.target.value)} disabled={readonly} placeholder="List modules separated by commas" /></div>
          <div><label className={labelCls}>Today's Date</label><input type="date" className={inputCls} value={data.todaysDate} onChange={e => u('todaysDate', e.target.value)} disabled={readonly} /></div>
        </div>
      </div>
      <div className="space-y-4">
        {QUESTIONS.map(({ key, label, long }) => (
          <div key={key} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <label className="block text-sm text-gray-700 font-medium mb-2">{label}</label>
            <textarea
              className={`${inputCls} min-h-[${long ? '80' : '52'}px]`}
              style={{ minHeight: long ? '80px' : '52px' }}
              value={data[key] as string}
              onChange={e => u(key, e.target.value)}
              disabled={readonly}
              placeholder="Your answer..."
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ LEARNER QUESTIONNAIRE FORM ============
function LearnerQuestionnaireForm({
  data,
  onChange,
  readonly,
}: {
  data: LearnerQuestionnaire;
  onChange: (d: LearnerQuestionnaire) => void;
  readonly: boolean;
}) {
  const u = (field: keyof LearnerQuestionnaire, val: string) => onChange({ ...data, [field]: val });
  const inputCls = `w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 resize-y ${readonly ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`;
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

  const QUESTIONS: { key: keyof LearnerQuestionnaire; label: string; long?: boolean }[] = [
    { key: 'q1', label: '1. An orientation session was held with all learners prior to the training starting:' },
    { key: 'q2', label: '2. Did you receive enough information regarding your qualification at the beginning? Were you provided with information on the different components you will be completing?', long: true },
    { key: 'q3', label: '3. Did you read the Qualification and Curriculum document prior to starting with the training?' },
    { key: 'q4', label: '4. Where did you complete your Workplace Component?' },
    { key: 'q5', label: '5. Did you have a supervisor or mentor that signed off your workplace competencies as you completed them?' },
    { key: 'q6', label: '6. Did the provider or facilitator monitor you at any time while you were at the workplace?' },
    { key: 'q9', label: '9. Was the learning material received at the beginning of training?' },
    { key: 'q10', label: '10. What did you think of the learning material used? (Was it useful; did it cover all the modules; was it easy to understand?) Provide detailed comments:', long: true },
    { key: 'q11', label: '11. Were you given any additional materials to assist with the learning besides the learning material?', long: true },
    { key: 'q12', label: '12. Was an attendance register completed for each class?' },
    { key: 'q13', label: '13. What did you enjoy most about this programme?', long: true },
    { key: 'q14', label: '14. What can be done to improve the quality of your training?', long: true },
    { key: 'q15', label: '15. Were you informed at the beginning of the programme that you would be completing an EISA conducted by an AQP?' },
    { key: 'q16', label: '16. Who is the AQP (Assessment Quality Partner) for this qualification?' },
    { key: 'q17', label: '17. Were you given an opportunity to provide feedback on your facilitators to the Provider? If yes, how?', long: true },
    { key: 'q18', label: '18. What is your understanding of the EISA (External Integrated Summative Assessment)?', long: true },
    { key: 'q19', label: '19. Did you have an opportunity to revise for the EISA by doing the Exemplar with your facilitator, and was feedback provided?', long: true },
    { key: 'q20', label: '20. Were you well-prepared for the final assessment (EISA)? Provide a reason for your answer.', long: true },
    { key: 'q21', label: '21. What more could have been done to improve your performance in the EISA?', long: true },
    { key: 'q22', label: '22. Why do you think learners performed so poorly in the EISA?', long: true },
    { key: 'q23', label: '23. Are there any other matters that prevented you from receiving quality training?', long: true },
    { key: 'q24', label: '24. What would you like to do once you have achieved this qualification?' },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Learner Questionnaire</p>
            <p className="text-xs text-gray-500">Kindly complete by providing accurate and detailed information. All information will be treated with strict confidentiality.</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className={labelCls}>Name of SDP (Institution)</label><input className={inputCls} value={data.sdpName} onChange={e => u('sdpName', e.target.value)} disabled={readonly} placeholder="Institution name" /></div>
          <div><label className={labelCls}>Name of Learner</label><input className={inputCls} value={data.learnerName} onChange={e => u('learnerName', e.target.value)} disabled={readonly} placeholder="Full name" /></div>
          <div><label className={labelCls}>Duration From</label><input type="date" className={inputCls} value={data.durationFrom} onChange={e => u('durationFrom', e.target.value)} disabled={readonly} /></div>
          <div><label className={labelCls}>Duration Until</label><input type="date" className={inputCls} value={data.durationUntil} onChange={e => u('durationUntil', e.target.value)} disabled={readonly} /></div>
          <div><label className={labelCls}>Date of EISA</label><input type="date" className={inputCls} value={data.dateOfEisa} onChange={e => u('dateOfEisa', e.target.value)} disabled={readonly} /></div>
          <div><label className={labelCls}>Today's Date</label><input type="date" className={inputCls} value={data.todaysDate} onChange={e => u('todaysDate', e.target.value)} disabled={readonly} /></div>
        </div>
      </div>

      {/* Question 7 — special 4-column layout */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <label className="block text-sm text-gray-700 font-medium mb-3">7. Did you do a formal assessment after each knowledge and practical module?</label>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Yes / No</label>
            <select className={inputCls} value={data.q8yesNo} onChange={e => u('q8yesNo', e.target.value)} disabled={readonly}>
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>How were you assessed?</label>
            <textarea style={{ minHeight: '52px' }} className={inputCls} value={data.q8assessmentMethod} onChange={e => u('q8assessmentMethod', e.target.value)} disabled={readonly} placeholder="What did you do?" />
          </div>
          <div>
            <label className={labelCls}>Did facilitator provide feedback?</label>
            <select className={inputCls} value={data.q8feedback} onChange={e => u('q8feedback', e.target.value)} disabled={readonly}>
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Sometimes">Sometimes</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-700 font-medium mb-2">8. If you failed these assessments, were you given an opportunity to be re-assessed until you were found to be Competent in all modules?</label>
        <textarea style={{ minHeight: '52px' }} className={inputCls} value={data.q7} onChange={e => u('q7', e.target.value)} disabled={readonly} placeholder="Your answer..." />
      </div>

      <div className="space-y-4">
        {QUESTIONS.map(({ key, label, long }) => (
          <div key={key} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <label className="block text-sm text-gray-700 font-medium mb-2">{label}</label>
            <textarea
              style={{ minHeight: long ? '80px' : '52px' }}
              className={inputCls}
              value={data[key] as string}
              onChange={e => u(key, e.target.value)}
              disabled={readonly}
              placeholder="Your answer..."
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ APPROVED RESULTS TAB ============
function ApprovedResultsTab({
  record,
  onSubmit,
  currentRole,
}: {
  record: ExtendedMonitoringRecord;
  onSubmit: (facilitator: FacilitatorQuestionnaire, learner: LearnerQuestionnaire) => void;
  currentRole: string;
}) {
  const [activeForm, setActiveForm] = useState<'facilitator' | 'learner'>('facilitator');
  const [facilitator, setFacilitator] = useState<FacilitatorQuestionnaire>(
    record.approvedResultsSubmission?.facilitator ?? { ...EMPTY_FACILITATOR }
  );
  const [learner, setLearner] = useState<LearnerQuestionnaire>(
    record.approvedResultsSubmission?.learner ?? { ...EMPTY_LEARNER }
  );
  const [submitting, setSubmitting] = useState(false);

  const isSubmitted = !!record.approvedResultsSubmittedAt;
  const readonly = isSubmitted;

  const handleSubmit = () => {
    if (!facilitator.facilitatorName || !learner.learnerName) {
      const el = document.createElement('div');
      el.className = 'fixed bottom-6 right-6 bg-red-700 text-white text-sm px-5 py-3 rounded-xl shadow-2xl z-[200]';
      el.textContent = 'Please fill in at least the Facilitator Name and Learner Name before submitting.';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3500);
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      onSubmit(facilitator, learner);
      setSubmitting(false);
    }, 400);
  };

  return (
    <div className="space-y-5">
      {/* Status banner */}
      {isSubmitted ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800">Approved Results Submitted Successfully</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Submitted on {formatDate(record.approvedResultsSubmittedAt)} by {record.approvedResultsSubmission?.submittedBy || 'Quality Partner'} · Waiting for the Assessment Domain to process and respond.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 flex items-start gap-3">
          <PenLine className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Submit Approved Results — Facilitator & Learner Questionnaires</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Complete both the Facilitator and Learner Questionnaires below, then submit. Once submitted, the Assessment Domain will be notified and the application will remain here while awaiting their response.
            </p>
          </div>
        </div>
      )}

      {/* Form switcher tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-gray-100">
        <button
          type="button"
          onClick={() => setActiveForm('facilitator')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${activeForm === 'facilitator' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <GraduationCap className="h-4 w-4" />
          Facilitator Questionnaire
          {facilitator.facilitatorName && <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />}
        </button>
        <button
          type="button"
          onClick={() => setActiveForm('learner')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${activeForm === 'learner' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Users className="h-4 w-4" />
          Learner Questionnaire
          {learner.learnerName && <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />}
        </button>
      </div>

      {/* Forms */}
      {activeForm === 'facilitator' && (
        <FacilitatorQuestionnaireForm data={facilitator} onChange={setFacilitator} readonly={readonly} />
      )}
      {activeForm === 'learner' && (
        <LearnerQuestionnaireForm data={learner} onChange={setLearner} readonly={readonly} />
      )}

      {/* Submit button */}
      {!isSubmitted && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">Complete both questionnaires before submitting.</p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit Approved Results to Assessment Domain'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============ RECORDS TABLE ============
function RecordsTable({
  records,
  actionRenderer,
}: {
  records: ExtendedMonitoringRecord[];
  actionRenderer: (record: ExtendedMonitoringRecord) => React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/60">
              {['#', 'Registration', 'Qualification', 'Site / SDP', 'Visit Date', 'Stage', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500">No records available.</td></tr>
            ) : (
              records.map((record, idx) => (
                <tr key={record.id} className="border-b border-gray-100 last:border-b-0 hover:bg-red-50/30 group transition-colors">
                  <td className="px-5 py-4 align-top text-xs font-mono text-gray-400">{String(idx + 1).padStart(2, '0')}</td>
                  <td className="px-5 py-4 align-top">
                    <div className="font-semibold text-gray-900">{record.eisaRegNo || record.id}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{formatDate(record.visitDate)}</div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="text-sm text-gray-700 truncate max-w-[180px]" title={record.title}>{record.title}</div>
                    {record.saqaId && <div className="text-xs text-gray-400 font-mono mt-0.5">SAQA: {record.saqaId}</div>}
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-gray-700">{record.siteName}</td>
                  <td className="px-5 py-4 align-top text-sm text-gray-700">{formatDate(record.visitDate)}</td>
                  <td className="px-5 py-4 align-top"><StageBadge stage={toExternalStage(record)} /></td>
                  <td className="px-5 py-4 align-top"><div className="flex items-center gap-2">{actionRenderer(record)}</div></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ MAIN COMPONENT ============
export default function ExternalSiteVisitsAndMonitoring() {
  const [activeTab, setActiveTab] = useState<SiteVisitsTab>('notificationsSubmissions');
  const [records, setRecords] = useState<ExtendedMonitoringRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ExtendedMonitoringRecord | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>('details');
  const { currentRole } = useApp();

  useEffect(() => {
    loadRecords();
    const handleStorage = (e?: StorageEvent) => {
      if (!e || e.key === STORAGE_KEY) loadRecords();
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(loadRecords, 3000);
    return () => { window.removeEventListener('storage', handleStorage); clearInterval(interval); };
  }, []);

const loadRecords = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SHARED_RECORDS));
    setRecords(INITIAL_SHARED_RECORDS);
    return;
  }

  const parsed: ExtendedMonitoringRecord[] = JSON.parse(stored);

  // Ensure seed records are always present but never duplicate them
  const ids = new Set(parsed.map((r: any) => r.id));
  const missing = INITIAL_SHARED_RECORDS.filter(r => !ids.has(r.id));
  if (missing.length > 0) {
    const merged = [...parsed, ...missing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    setRecords(merged);
  } else {
    setRecords(parsed);
  }
};

  const saveRecords = (updated: ExtendedMonitoringRecord[]) => {
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  };

  const createExternalSubmission = (processType: MonitoringProcessType) => {
    const id = `EXT-${Date.now()}`;
    const record: ExtendedMonitoringRecord = {
      id,
      processType,
      title: processType === 'marked_moderated_scripts'
        ? `Marked & Moderated Scripts - Site ${String(Date.now()).slice(-3)}`
        : `Post EISA Monitoring - Site ${String(Date.now()).slice(-3)}`,
      sourceFrom: 'Quality Partner',
      submittedBy: 'Quality Partner',
      siteName: processType === 'marked_moderated_scripts' ? 'New Marked & Moderated Site' : 'New Post EISA Site',
      visitDate: '2026-06-15',
      stage: 'incoming_request',
      subStage: processType === 'marked_moderated_scripts' ? 'eisa_notification_received' : 'approved_results_received',
      eisaNotificationSubmitted: processType === 'marked_moderated_scripts',
      approvedResultsSubmitted: processType === 'post_eisa_monitoring',
      schedulePrepared: false, monthlyPlanPrepared: false, competencyRateChecked: false,
      sdpIdentified: false, siteVisitBooked: false, evaluationToolCompleted: false,
      evaluationReportCompiled: false, pemReportGenerated: false, sentToQp: false,
      deputyDirectorStatus: 'pending', domainDirectorStatus: 'pending', directorStatus: 'pending',
      createdAt: new Date().toISOString(),
    };
    saveRecords([record, ...records]);
    showToast('Submission sent to Assessment Domain');
  };

  const openModal = (record: ExtendedMonitoringRecord, tab: ModalTab = 'details') => {
    setSelectedRecord(record);
    setActiveModalTab(tab);
  };

  const showToast = (msg: string) => {
    const el = document.createElement('div');
    el.className = 'fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-2xl z-[200] flex items-center gap-2';
    el.innerHTML = `<span style="color:#34d399">✓</span> ${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const handleSubmitApprovedResults = (
    recordId: string,
    facilitator: FacilitatorQuestionnaire,
    learner: LearnerQuestionnaire
  ) => {
    const submission: ApprovedResultsSubmission = {
      facilitator,
      learner,
      submittedAt: new Date().toISOString(),
      submittedBy: currentRole || 'Quality Partner',
    };
    const updated = records.map(r =>
      r.id === recordId
        ? { ...r, approvedResultsSubmission: submission, approvedResultsSubmittedAt: new Date().toISOString() }
        : r
    );
    // Update localStorage so internal side sees it immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    setRecords(updated);
    // Refresh selectedRecord
    const updatedRecord = updated.find(r => r.id === recordId);
    if (updatedRecord) setSelectedRecord(updatedRecord);
    showToast('Approved Results submitted to the Assessment Domain successfully!');
  };

  // Filtered record sets
  const submissionRecords = useMemo(() => records.filter(r => toExternalStage(r) === 'submitted_to_assessment'), [records]);
  const scheduleRecords = useMemo(() => records.filter(r => toExternalStage(r) === 'schedule_received'), [records]);
  const outcomeRecords = useMemo(() => records.filter(r => {
    const s = toExternalStage(r);
    return s === 'report_outcome_available' || s === 'closed';
  }), [records]);

  // Derived modal state
  const hasSchedule = !!(selectedRecord?.eisaSchedule);
  const hasOutcome = !!(selectedRecord?.outcomeReport?.reportFinalised);
  const hasInstrumentValidation = !!(selectedRecord?.eisaSchedule?.instrumentValidation);
  const hasLiaiseDetails = !!(selectedRecord?.eisaSchedule?.qpContactPerson);
  const hasQAReport = !!(selectedRecord?.qaEvaluationReport?.reportFinalised);
  const showApprovedResultsTab = !!(selectedRecord?.qaEvaluationReport?.reportFinalised);

  const stats = useMemo(() => ({
    submitted: submissionRecords.length,
    scheduled: scheduleRecords.length,
    outcomes: outcomeRecords.length,
    total: records.length,
  }), [records, submissionRecords, scheduleRecords, outcomeRecords]);

  return (
    <div className="space-y-6">

      {/* ── Gradient Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs text-red-200 font-medium uppercase tracking-widest mb-1">External Portal</p>
            <h1 className="text-2xl font-bold">Site Visits & Monitoring</h1>
            <p className="mt-1 text-sm text-red-100">Track submissions, site visit schedules, and monitoring outcomes from the Assessment Domain</p>
          </div>
          <div className="flex items-center gap-3">
            {currentRole === 'Quality Partner' && (
              <>
                <button
                  type="button"
                  onClick={() => createExternalSubmission('marked_moderated_scripts')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 border border-white/30 px-3 py-2 text-sm font-medium text-white hover:bg-white/30 transition"
                >
                  <PlusCircle className="h-4 w-4" /> New EISA Notification
                </button>
                <button
                  type="button"
                  onClick={() => createExternalSubmission('post_eisa_monitoring')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition"
                >
                  <PlusCircle className="h-4 w-4" /> New Approved Results
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => { loadRecords(); showToast('Refreshed'); }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 border border-white/30 px-3 py-2 text-sm font-medium text-white hover:bg-white/30 transition"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <div className="inline-flex w-fit items-center rounded-xl bg-white/20 backdrop-blur px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-red-200">Role</span>
              <span className="ml-3 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm">{currentRole || 'Quality Partner'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid gap-4 md:grid-cols-4">
        <InfoCard title="Total Records" value={String(stats.total)} icon={<ClipboardList className="h-5 w-5" />} accent="bg-gradient-to-br from-red-500 to-rose-600 text-white" />
        <InfoCard title="Pending Assessment" value={String(stats.submitted)} icon={<Bell className="h-5 w-5" />} accent="bg-gradient-to-br from-amber-500 to-orange-600 text-white" />
        <InfoCard title="Schedules Received" value={String(stats.scheduled)} icon={<CalendarDays className="h-5 w-5" />} accent="bg-gradient-to-br from-purple-500 to-violet-600 text-white" />
        <InfoCard title="Results Received" value={String(stats.outcomes)} icon={<CheckCircle2 className="h-5 w-5" />} accent="bg-gradient-to-br from-emerald-500 to-green-600 text-white" />
      </div>

      {/* ── Tab card ── */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50/80 px-6 py-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <TabButton label="Notifications & Submissions" active={activeTab === 'notificationsSubmissions'} onClick={() => setActiveTab('notificationsSubmissions')} />
            <TabButton label="Site Visit Schedules" active={activeTab === 'siteVisitSchedules'} onClick={() => setActiveTab('siteVisitSchedules')} />
            <TabButton
              label={`Reports & Outcomes${outcomeRecords.length > 0 ? ` (${outcomeRecords.length})` : ''}`}
              active={activeTab === 'reportsOutcomes'}
              onClick={() => setActiveTab('reportsOutcomes')}
            />
          </div>
        </div>

        <div className="p-6">

          {/* ── Notifications & Submissions ── */}
          {activeTab === 'notificationsSubmissions' && (
            <SectionShell
              title="Notifications & Submissions"
              description="Submit EISA Notifications for Marked & Moderated Scripts and Approved Results for Post EISA Monitoring to the Assessment Domain."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard title="Notifications" value={String(submissionRecords.length)} icon={<Bell className="h-5 w-5" />} accent="bg-gradient-to-br from-red-500 to-rose-600 text-white" />
                <InfoCard title="Marked & Moderated" value={String(submissionRecords.filter(r => r.processType === 'marked_moderated_scripts').length)} icon={<ClipboardList className="h-5 w-5" />} accent="bg-gradient-to-br from-blue-500 to-indigo-600 text-white" />
                <InfoCard title="Post EISA Monitoring" value={String(submissionRecords.filter(r => r.processType === 'post_eisa_monitoring').length)} icon={<FileText className="h-5 w-5" />} accent="bg-gradient-to-br from-violet-500 to-purple-600 text-white" />
              </div>
              {submissionRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16">
                  <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <Bell className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-500">No pending submissions</p>
                  <p className="text-sm text-gray-400 mt-1">All submissions have progressed to the next stage.</p>
                </div>
              ) : (
                <RecordsTable
                  records={submissionRecords}
                  actionRenderer={(record) => (
                    <ActionButton variant="secondary" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => openModal(record, 'details')}>View</ActionButton>
                  )}
                />
              )}
            </SectionShell>
          )}

          {/* ── Site Visit Schedules ── */}
          {activeTab === 'siteVisitSchedules' && (
            <SectionShell
              title="Site Visit Schedules"
              description="View approved Site Visit Schedules and Monthly Plans from the Assessment Domain."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard title="Scheduled Visits" value={String(scheduleRecords.length)} icon={<CalendarDays className="h-5 w-5" />} accent="bg-gradient-to-br from-purple-500 to-violet-600 text-white" />
                <InfoCard title="Plans Received" value={String(scheduleRecords.filter(r => r.monthlyPlanPrepared).length)} icon={<CalendarClock className="h-5 w-5" />} accent="bg-gradient-to-br from-blue-500 to-indigo-600 text-white" />
                <InfoCard title="Visits Booked" value={String(scheduleRecords.filter(r => r.siteVisitBooked).length)} icon={<MapPinned className="h-5 w-5" />} accent="bg-gradient-to-br from-emerald-500 to-green-600 text-white" />
              </div>
              {scheduleRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16">
                  <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <CalendarDays className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-500">No schedules received yet</p>
                  <p className="text-sm text-gray-400 mt-1">Schedules appear here once approved by the Assessment Domain.</p>
                </div>
              ) : (
                <RecordsTable
                  records={scheduleRecords}
                  actionRenderer={(record) => (
                    <ActionButton variant="secondary" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => openModal(record, 'details')}>View</ActionButton>
                  )}
                />
              )}
            </SectionShell>
          )}

          {/* ── Reports & Outcomes ── */}
          {activeTab === 'reportsOutcomes' && (
            <SectionShell
              title="Reports & Outcomes"
              description="View QA Evaluation Reports and outcomes sent from the Assessment Domain."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard title="Reports Available" value={String(outcomeRecords.length)} icon={<FileText className="h-5 w-5" />} accent="bg-gradient-to-br from-blue-500 to-indigo-600 text-white" />
                <InfoCard title="QA Reports" value={String(outcomeRecords.filter(r => r.qaEvaluationReport?.reportFinalised).length)} icon={<FileCheck className="h-5 w-5" />} accent="bg-gradient-to-br from-emerald-500 to-green-600 text-white" />
                <InfoCard title="Results Sent" value={String(outcomeRecords.filter(r => r.sentToQp).length)} icon={<CheckCircle2 className="h-5 w-5" />} accent="bg-gradient-to-br from-red-500 to-rose-600 text-white" />
              </div>
              {outcomeRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16">
                  <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-500">No reports received yet</p>
                  <p className="text-sm text-gray-400 mt-1">Reports appear here once the site visit has been conducted and results sent by the Assessment Domain.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b bg-gray-50/60 px-6 py-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Received Reports</p>
                    <span className="text-xs text-gray-400">{outcomeRecords.length} record{outcomeRecords.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50/60">
                          {['#', 'Registration', 'Qualification', 'Site / SDP', 'Sent On', 'QA Report', 'Stage', 'Actions'].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {outcomeRecords.map((record, idx) => (
                          <tr key={record.id} className="border-b border-gray-100 last:border-0 hover:bg-red-50/30 group transition-colors">
                            <td className="px-5 py-4 align-top text-xs font-mono text-gray-400">{String(idx + 1).padStart(2, '0')}</td>
                            <td className="px-5 py-4 align-top">
                              <div className="font-semibold text-gray-900">{record.eisaRegNo || record.id}</div>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="text-sm text-gray-700 truncate max-w-[180px]" title={record.title}>{record.title}</div>
                              {record.saqaId && <div className="text-xs text-gray-400 font-mono mt-0.5">SAQA: {record.saqaId}</div>}
                            </td>
                            <td className="px-5 py-4 align-top text-sm text-gray-700">{record.siteName}</td>
                            <td className="px-5 py-4 align-top text-sm text-gray-500">{formatDate(record.sentToQpAt || record.siteVisitConductedAt)}</td>
                            <td className="px-5 py-4 align-top">
                              {record.qaEvaluationReport?.reportFinalised
                                ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Available</span>
                                : <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">Not yet</span>
                              }
                            </td>
                            <td className="px-5 py-4 align-top"><StageBadge stage={toExternalStage(record)} /></td>
                            <td className="px-5 py-4 align-top">
                              <div className="flex items-center gap-2">
                                {record.qaEvaluationReport?.reportFinalised && (
                                  <button
                                    type="button"
                                    onClick={() => openModal(record, 'evaluation_report')}
                                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3 text-xs font-semibold text-white transition"
                                  >
                                    <FileCheck className="h-3.5 w-3.5" /> View Report
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openModal(record, 'details')}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-100 text-red-600"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </SectionShell>
          )}
        </div>
      </div>

      {/* ── FULL DETAIL MODAL ── */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">

            {/* Sticky header + tabs */}
            <div className="sticky top-0 z-10 bg-white border-b px-6 pt-5 flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {selectedRecord.stream === 'trades'
                      ? <Wrench className="h-5 w-5 text-blue-600" />
                      : <Layers className="h-5 w-5 text-violet-600" />}
                    {selectedRecord.eisaRegNo || selectedRecord.id}
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500">{selectedRecord.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StageBadge stage={toExternalStage(selectedRecord)} />
                  <button type="button" onClick={() => setSelectedRecord(null)} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="flex gap-1 overflow-x-auto pb-px">
                {([
                  { id: 'details',           label: 'Application Details',     emoji: '📄', show: true },
                  { id: 'schedule',          label: 'Validation Schedule',      emoji: '📅', show: hasSchedule },
                  { id: 'liaise',            label: 'Liaise with QP',           emoji: '📞', show: hasLiaiseDetails },
                  { id: 'validation',        label: 'Instrument Validation',    emoji: '✅', show: hasInstrumentValidation },
                  { id: 'dd_review',         label: 'DD Review & Outcome',      emoji: '🔍', show: hasOutcome },
                  { id: 'registration',      label: 'Registration Docs',        emoji: '📋', show: true },
                  { id: 'evaluation_report', label: 'QA Evaluation Report',     emoji: '📊', show: hasQAReport },
                  { id: 'approved_results',  label: 'Submit Approved Results',  emoji: '📤', show: showApprovedResultsTab },
                ] as { id: ModalTab; label: string; emoji: string; show: boolean }[]).filter(t => t.show).map((tab) => (
                  <button key={tab.id} type="button" onClick={() => setActiveModalTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 whitespace-nowrap flex-shrink-0 transition-all ${
                      activeModalTab === tab.id
                        ? 'border-red-500 text-red-700 bg-red-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}>
                    <span>{tab.emoji}</span> {tab.label}
                    {tab.id === 'evaluation_report' && hasQAReport && <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500 inline-block" />}
                    {tab.id === 'approved_results' && selectedRecord?.approvedResultsSubmittedAt && <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500 inline-block" />}
                    {tab.id === 'approved_results' && !selectedRecord?.approvedResultsSubmittedAt && showApprovedResultsTab && <span className="ml-1 h-2 w-2 rounded-full bg-amber-400 inline-block animate-pulse" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* ── Application Details ── */}
              {activeModalTab === 'details' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AQP & Qualification</p></div>
                      <div className="px-4 divide-y divide-gray-50">
                        <DetailRow icon={BookOpen} label="Qualification Title" value={selectedRecord.title} />
                        <DetailRow icon={Hash} label="SAQA ID" value={<span className="font-mono">{selectedRecord.saqaId}</span>} />
                        <DetailRow icon={Award} label="NQF Level" value={selectedRecord.nqfLevel} />
                        <DetailRow icon={Hash} label="Credits" value={selectedRecord.credits} />
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Registration Details</p></div>
                      <div className="px-4 divide-y divide-gray-50">
                        <DetailRow icon={Calendar} label="Proposed EISA Date" value={formatDate(selectedRecord.visitDate)} />
                        <DetailRow icon={CalendarClock} label="Submitted" value={formatDate(selectedRecord.createdAt)} />
                        <DetailRow icon={Tag} label="Stream" value={
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${selectedRecord.stream === 'trades' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                            {selectedRecord.stream === 'trades' ? <Wrench className="h-3 w-3" /> : <Layers className="h-3 w-3" />}
                            {selectedRecord.stream === 'trades' ? 'Trades' : 'Non-Trades'}
                          </span>
                        } />
                        {selectedRecord.registrationNumber && (
                          <DetailRow icon={CheckCircle2} label="Registration Number" value={<span className="font-mono font-bold text-emerald-700">{selectedRecord.registrationNumber}</span>} />
                        )}
                        {selectedRecord.eisaRegNo && (
                          <DetailRow icon={ClipboardList} label="EISA Reg No" value={<span className="font-mono">{selectedRecord.eisaRegNo}</span>} />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents from QAS Addendum</p></div>
                    <div className="divide-y">
                      {[
                        { label: 'SAQA Qualification Document', val: selectedRecord.saqaQualificationDocument },
                        { label: 'Curriculum Document', val: selectedRecord.curriculumDocument },
                        { label: 'QAS Addendum', val: selectedRecord.qasAddendum },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center"><FileText className="h-3.5 w-3.5 text-blue-600" /></div>
                            <span className="text-sm font-medium text-gray-700">{label}</span>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-mono">{val || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedRecord.acknowledgementStatus === 'sent_to_quality_partner' && selectedRecord.acknowledgementLetterName && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 overflow-hidden">
                      <div className="px-4 py-3 bg-emerald-100 border-b border-emerald-200 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /><p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Acknowledgement Letter — Received</p></div>
                      <div className="p-4"><div className="flex items-center gap-3 bg-white rounded-xl border border-emerald-200 p-3"><div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0"><Paperclip className="h-5 w-5 text-white" /></div><div><p className="text-sm font-semibold text-gray-900">{selectedRecord.acknowledgementLetterName}</p><p className="text-xs text-gray-500">Approved by CEO</p></div></div></div>
                    </div>
                  )}
                  {selectedRecord.finalApprovalLetterName && (
                    <div className="rounded-2xl border border-purple-200 bg-purple-50/50 overflow-hidden">
                      <div className="px-4 py-3 bg-purple-100 border-b border-purple-200 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-purple-600" /><p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Signed Approval Letter — Received from QCTO</p></div>
                      <div className="p-4"><div className="flex items-center gap-3 bg-white rounded-xl border border-purple-200 p-3"><div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0"><FileSignature className="h-5 w-5 text-white" /></div><div><p className="text-sm font-semibold text-gray-900">{selectedRecord.finalApprovalLetterName}</p><p className="text-xs text-gray-500">Signed by CEO</p></div></div></div>
                    </div>
                  )}
                  {selectedRecord.outcomeReport?.reportFinalised && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-emerald-600" />
                      <div><p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">EISA Validation Outcome</p><div className="mt-1"><OutcomeBadge decision={selectedRecord.outcomeReport.outcomeDecision} /></div></div>
                    </div>
                  )}
                  {/* QA Report available notice */}
                  {hasQAReport && (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <FileCheck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-blue-800">QA Evaluation Report Available</p>
                          <p className="text-xs text-blue-600 mt-0.5">The Assessment Domain has sent the QA Evaluation Report for this site visit.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveModalTab('evaluation_report')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition flex-shrink-0"
                      >
                        View Report
                      </button>
                    </div>
                  )}
                  {/* Submit approved results prompt */}
                  {showApprovedResultsTab && (
                    <div className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${selectedRecord?.approvedResultsSubmittedAt ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                      <div className="flex items-center gap-3">
                        <Upload className={`h-5 w-5 flex-shrink-0 ${selectedRecord?.approvedResultsSubmittedAt ? 'text-emerald-600' : 'text-amber-600'}`} />
                        <div>
                          <p className={`text-sm font-semibold ${selectedRecord?.approvedResultsSubmittedAt ? 'text-emerald-800' : 'text-amber-800'}`}>
                            {selectedRecord?.approvedResultsSubmittedAt ? 'Approved Results Submitted' : 'Action Required: Submit Approved Results'}
                          </p>
                          <p className={`text-xs mt-0.5 ${selectedRecord?.approvedResultsSubmittedAt ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {selectedRecord?.approvedResultsSubmittedAt
                              ? `Submitted on ${formatDate(selectedRecord.approvedResultsSubmittedAt)} — waiting for Assessment Domain response.`
                              : 'Please complete and submit the Facilitator & Learner Questionnaires to the Assessment Domain.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveModalTab('approved_results')}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition flex-shrink-0 ${selectedRecord?.approvedResultsSubmittedAt ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                      >
                        {selectedRecord?.approvedResultsSubmittedAt ? 'View Submission' : 'Complete & Submit'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Validation Schedule ── */}
              {activeModalTab === 'schedule' && selectedRecord.eisaSchedule && (
                <div className="space-y-6">
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-2"><CalendarClock className="h-4 w-4 text-blue-600" /><p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">EISA Validation Schedule</p></div>
                    <div className="p-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Date:</span><span className="text-sm text-gray-700">{formatDate(selectedRecord.eisaSchedule.validationDate)}</span></div>
                          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Time:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.startTime || '-'} – {selectedRecord.eisaSchedule.endTime || '-'}</span></div>
                          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Venue:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.venue || '-'}</span></div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Assessor:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.assessorName || '-'}</span></div>
                          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Email:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.assessorEmail || '-'}</span></div>
                        </div>
                      </div>
                      {selectedRecord.eisaSchedule.notes && (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200"><p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Notes</p><p className="text-sm text-gray-700">{selectedRecord.eisaSchedule.notes}</p></div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Liaise with QP ── */}
              {activeModalTab === 'liaise' && selectedRecord.eisaSchedule && (
                <div className="space-y-5">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
                    <Phone className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div><p className="text-sm font-semibold text-emerald-800">Quality Partner Liaison Details</p><p className="text-xs text-emerald-700 mt-0.5">Captured during the validation process.</p></div>
                  </div>
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">QP Contact Details</p></div>
                    <div className="p-4 grid gap-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div><p className="text-xs text-gray-400 uppercase tracking-wide">QP Contact Person</p><p className="text-sm font-medium text-gray-900">{selectedRecord.eisaSchedule.qpContactPerson || '—'}</p></div>
                        <div><p className="text-xs text-gray-400 uppercase tracking-wide">Contact Number</p><p className="text-sm font-medium text-gray-900">{selectedRecord.eisaSchedule.qpContactNumber || '—'}</p></div>
                      </div>
                      <div><p className="text-xs text-gray-400 uppercase tracking-wide">Contact Email</p><p className="text-sm font-medium text-gray-900">{selectedRecord.eisaSchedule.qpContactEmail || '—'}</p></div>
                      <div><p className="text-xs text-gray-400 uppercase tracking-wide">Notes</p><p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-200">{selectedRecord.eisaSchedule.internalNotes || '—'}</p></div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Instrument Validation ── */}
              {activeModalTab === 'validation' && selectedRecord.eisaSchedule?.instrumentValidation && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/50 overflow-hidden">
                    <div className="px-4 py-3 bg-blue-100 border-b border-blue-200 flex items-center gap-2"><ClipboardList className="h-4 w-4 text-blue-700" /><p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">QA Validation Checklist (Read-only)</p></div>
                  </div>
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-violet-50 border-b"><p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Documents Received</p></div>
                    <div className="p-4 grid grid-cols-2 gap-2">
                      {[{ key: 'moderatorReport', label: 'Moderator Report' }, { key: 'examinerReport', label: 'Examiner Report' }, { key: 'cv', label: 'CV' }, { key: 'confidentialityAgreement', label: 'Confidentiality Agreement' }, { key: 'eisaInstrumentMemo', label: 'EISA Instrument Memo' }, { key: 'eisaInstrumentRubric', label: 'EISA Instrument Rubric' }].map(({ key, label }) => {
                        const iv = selectedRecord.eisaSchedule!.instrumentValidation!;
                        const checked = iv.documents[key as keyof typeof iv.documents];
                        return <div key={key} className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium ${checked ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}><span>{checked ? '✓' : '○'}</span>{label}</div>;
                      })}
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Section Summaries</p></div>
                    <div className="p-4 space-y-4">
                      <div><p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Section 1 — QAS Addendum</p><ChecklistSummaryRow label="Addendum developed?" value={selectedRecord.eisaSchedule.instrumentValidation.qas.addendumDeveloped} /></div>
                      <div><p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Section 2 — Examiner</p><ChecklistSummaryRow label="Criteria specified?" value={selectedRecord.eisaSchedule.instrumentValidation.examiner.criteriaSpecified} /></div>
                      <div><p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Section 3 — Moderator</p><ChecklistSummaryRow label="Criteria specified?" value={selectedRecord.eisaSchedule.instrumentValidation.moderator.criteriaSpecified} /></div>
                      <div><p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Section 4 — Overall</p><ChecklistSummaryRow label="Approved by Moderator?" value={selectedRecord.eisaSchedule.instrumentValidation.overall.approvedByModerator} /></div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DD Review & Outcome ── */}
              {activeModalTab === 'dd_review' && selectedRecord.outcomeReport?.reportFinalised && (
                <div className="space-y-6">
                  <div className={`rounded-2xl border-2 p-6 text-center ${selectedRecord.outcomeReport.outcomeDecision === 'approved' ? 'border-emerald-300 bg-emerald-50' : selectedRecord.outcomeReport.outcomeDecision === 'approved_with_conditions' ? 'border-amber-300 bg-amber-50' : 'border-red-300 bg-red-50'}`}>
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${selectedRecord.outcomeReport.outcomeDecision === 'approved' ? 'bg-emerald-500' : selectedRecord.outcomeReport.outcomeDecision === 'approved_with_conditions' ? 'bg-amber-500' : 'bg-red-500'}`}>
                      {selectedRecord.outcomeReport.outcomeDecision === 'approved' ? <ThumbsUp className="h-7 w-7 text-white" /> : selectedRecord.outcomeReport.outcomeDecision === 'approved_with_conditions' ? <AlertCircle className="h-7 w-7 text-white" /> : <X className="h-7 w-7 text-white" />}
                    </div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">EISA Validation Outcome</p>
                    <OutcomeBadge decision={selectedRecord.outcomeReport.outcomeDecision} />
                    <p className="text-xs text-gray-500 mt-3">Finalised by {selectedRecord.outcomeReport.ddReviewedBy} on {formatDateTime(selectedRecord.outcomeReport.reportFinalisedAt)}</p>
                  </div>
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-purple-50 border-b"><p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Deputy Director Recommendations</p></div>
                    <div className="p-4"><p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRecord.outcomeReport.ddRecommendations || '—'}</p></div>
                  </div>
                  {selectedRecord.outcomeReport.outcomeNotes && (
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-blue-50 border-b"><p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Outcome Notes</p></div>
                      <div className="p-4"><p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRecord.outcomeReport.outcomeNotes}</p></div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Registration Docs ── */}
              {activeModalTab === 'registration' && (
                <div className="space-y-5">
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2"><HardDrive className="h-4 w-4 text-gray-600" /><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted Documents</p></div>
                    <div className="p-4 space-y-2">
                      {[
                        { label: 'EISA Reg Document', checked: selectedRecord.eisaRegDocument || false, name: selectedRecord.eisaRegFileName },
                        { label: 'LEISA File', checked: selectedRecord.leisaFile || false, name: selectedRecord.leisaFileName },
                        { label: 'SOR & QA Reports', checked: selectedRecord.sorAndQaReports || false, name: selectedRecord.sorQaReportsFileName },
                      ].map(({ label, checked, name }) => (
                        <div key={label} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${checked ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${checked ? 'text-emerald-600' : 'text-gray-400'}`}>{checked ? '✓' : '○'}</span>
                            <span className={`text-sm font-medium ${checked ? 'text-emerald-800' : 'text-gray-600'}`}>{label}</span>
                          </div>
                          {name && <span className="text-xs text-gray-400 truncate max-w-[160px]">{name}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedRecord.registrationNumber && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <div><p className="text-xs text-emerald-600 font-medium">Registration Number</p><p className="text-lg font-bold text-emerald-800">{selectedRecord.registrationNumber}</p></div>
                    </div>
                  )}
                </div>
              )}

              {/* ── QA Evaluation Report (new tab) ── */}
              {activeModalTab === 'evaluation_report' && selectedRecord.qaEvaluationReport?.reportFinalised && (
                <QAEvaluationReportViewer report={selectedRecord.qaEvaluationReport} />
              )}

              {/* ── Submit Approved Results ── */}
              {activeModalTab === 'approved_results' && (
                <ApprovedResultsTab
                  record={selectedRecord}
                  currentRole={currentRole}
                  onSubmit={(facilitator, learner) => handleSubmitApprovedResults(selectedRecord.id, facilitator, learner)}
                />
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div className="text-xs text-gray-500">
                {selectedRecord.sentToQpAt
                  ? `Results received: ${formatDate(selectedRecord.sentToQpAt)}`
                  : `Submitted: ${formatDate(selectedRecord.createdAt)}`}
              </div>
              <button type="button" onClick={() => setSelectedRecord(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}