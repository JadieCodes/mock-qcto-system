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
  X,
  Calendar,
  MapPin,
  User as UserIcon,
  Mail,
  Clock,
  Phone,
  Building2,
  CheckCircle,
  Paperclip,
  FileSignature,
  ThumbsUp,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  HardDrive,
  Tag,
  BookOpen,
  Hash,
  Award,
  Wrench,
  Layers,
  Bell,
  Save,
  ClipboardList,
  Users,
  FileCheck,
  ExternalLink,
  ChevronRight,
  ListChecks,
  RefreshCw,
  GraduationCap,
  Upload,
  ClipboardCheck as ClipboardCheckIcon,
  PenLine,
  FileSearch,
  ThumbsDown,
  
} from 'lucide-react';

// ============ TYPE DEFINITIONS ============
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
type YesNo = 'yes' | 'no' | '';
type ModalTab = 'details' | 'schedule' | 'liaise' | 'validation' | 'dd_review' | 'registration' | 'planning' | 'siteVisitExecution' | 'pem_report' | 'external_submissions';

type AssessmentType = 'eisa' | 'fisa';

// ============ PEM REPORT INTERFACES ============
interface PemAttendee { name: string; institution: string; }
interface PemCurrentLearner { ocName: string; startDate: string; endDate: string; }
interface PemEvidenceNotAvailable { item: string; reason: string; }
interface PemFacilitatorRow { name: string; highestQual: string; modulesName: string; hasRelevantQual: string; contractDates: string; }
interface PemCheckItem { yes: boolean | null; no: boolean | null; comments: string; }

interface PEMReport {
  // Cover
  sdpName: string;
  address: string;
  contactPerson: string;
  contactNumber: string;
  dateOfVisit: string;
  isAccreditedProvider: string;
  providerAccreditationNumber: string;
  providerAccreditationValidity: string;
  isAccreditedAssessmentCentre: string;
  acAccreditationNumber: string;
  acAccreditationValidity: string;
  attendees: PemAttendee[];
  // Head of Institution
  headFullNames: string;
  headIdNumber: string;
  headProfessionalBody: string;
  headHighestQualification: string;
  headIndustryExperience: string;
  headMobileNumber: string;
  headEmail: string;
  // Qualification info
  aqpName: string;
  qualificationTitle: string;
  saqaId: string;
  nqfLevel: string;
  credits: string;
  dateOfEisa: string;
  duration: string;
  numComponents: string;
  requiredPassMark: string;
  // Learner stats
  learnersRegistered: string;
  programDuration: string;
  learnersSatForEisa: string;
  learnersAbsent: string;
  learnersCompetent: string;
  learnersNyc: string;
  overallPassRate: string;
  currentLearners: PemCurrentLearner[];
  // Evidence checklist (a-n)
  evidenceA: string; evidenceB: string; evidenceC: string; evidenceD: string;
  evidenceE: string; evidenceF: string; evidenceG: string; evidenceH: string;
  evidenceI: string; evidenceJ: string; evidenceK: string; evidenceL: string;
  evidenceM: string; evidenceN: string;
  // Evidence not available
  evidenceNotAvailable: PemEvidenceNotAvailable[];
  // Section A — Facilitators
  facilitators: PemFacilitatorRow[];
  sectionA6: string;
  sectionA7: string;
  sectionA8: string;
  // Section B
  sectionB: Record<string, PemCheckItem>;
  // Section C
  sectionC: Record<string, PemCheckItem>;
  // Section D
  sectionD: Record<string, PemCheckItem>;
  // Section E
  sectionE: Record<string, PemCheckItem>;
  // Summary
  bestPractice: string;
  recommendedImprovements: string;
  // Meta
  compiledBy: string;
  compiledDate: string;
  reportFinalised: boolean;
  finalisedAt?: string;
  // DD Review
  ddRecommendation?: string;
  ddReviewedBy?: string;
  ddReviewedAt?: string;
  ddRecommended?: boolean;
}

// External submission types (mirrored from external page)
interface FacilitatorQuestionnaire {
  sdpName: string; facilitatorName: string; modulesFactilitated: string; todaysDate: string;
  q1: string; q2: string; q3: string; q4: string; q5: string; q6: string; q7: string; q8: string;
  q9: string; q10: string; q11: string; q12: string; q13: string; q14: string; q15: string;
  q16: string; q17: string; q18: string; q19: string; q20: string; q21: string; q22: string;
  q23: string; q24: string; q25: string; q26: string;
}
interface LearnerQuestionnaire {
  sdpName: string; learnerName: string; durationFrom: string; durationUntil: string;
  dateOfEisa: string; todaysDate: string;
  q1: string; q2: string; q3: string; q4: string; q5: string; q6: string;
  q7: string; q8assessmentMethod: string; q8feedback: string; q8yesNo: string;
  q9: string; q10: string; q11: string; q12: string; q13: string; q14: string;
  q15: string; q16: string; q17: string; q18: string; q19: string; q20: string;
  q21: string; q22: string; q23: string; q24: string;
}
interface ApprovedResultsSubmission {
  facilitator: FacilitatorQuestionnaire;
  learner: LearnerQuestionnaire;
  submittedAt: string;
  submittedBy: string;
}

const DEFAULT_PEM_CHECK = (): PemCheckItem => ({ yes: null, no: null, comments: '' });

const DEFAULT_PEM_REPORT = (): PEMReport => ({
  sdpName: '', address: '', contactPerson: '', contactNumber: '', dateOfVisit: '',
  isAccreditedProvider: '', providerAccreditationNumber: '', providerAccreditationValidity: '',
  isAccreditedAssessmentCentre: '', acAccreditationNumber: '', acAccreditationValidity: '',
  attendees: [{ name: '', institution: '' }, { name: '', institution: '' }, { name: '', institution: '' }],
  headFullNames: '', headIdNumber: '', headProfessionalBody: '', headHighestQualification: '',
  headIndustryExperience: '', headMobileNumber: '', headEmail: '',
  aqpName: '', qualificationTitle: '', saqaId: '', nqfLevel: '', credits: '',
  dateOfEisa: '', duration: '', numComponents: '', requiredPassMark: '',
  learnersRegistered: '', programDuration: '', learnersSatForEisa: '', learnersAbsent: '',
  learnersCompetent: '', learnersNyc: '', overallPassRate: '',
  currentLearners: [{ ocName: '', startDate: '', endDate: '' }],
  evidenceA: '', evidenceB: '', evidenceC: '', evidenceD: '', evidenceE: '', evidenceF: '',
  evidenceG: '', evidenceH: '', evidenceI: '', evidenceJ: '', evidenceK: '', evidenceL: '',
  evidenceM: '', evidenceN: '',
  evidenceNotAvailable: [{ item: '', reason: '' }],
  facilitators: [
    { name: '', highestQual: '', modulesName: '', hasRelevantQual: '', contractDates: '' },
    { name: '', highestQual: '', modulesName: '', hasRelevantQual: '', contractDates: '' },
    { name: '', highestQual: '', modulesName: '', hasRelevantQual: '', contractDates: '' },
  ],
  sectionA6: '', sectionA7: '', sectionA8: '',
  sectionB: Object.fromEntries(['B1','B2','B3','B4','B5','B6','B7','B8','B9','B10','B11','B12','B13','B14','B15'].map(k => [k, DEFAULT_PEM_CHECK()])),
  sectionC: Object.fromEntries(['C1','C2','C2.1','C2.2','C3','C3.1','C4','C4.1','C5'].map(k => [k, DEFAULT_PEM_CHECK()])),
  sectionD: Object.fromEntries(['D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11'].map(k => [k, DEFAULT_PEM_CHECK()])),
  sectionE: Object.fromEntries(['E1','E2','E3','E4','E5','E6','E7'].map(k => [k, DEFAULT_PEM_CHECK()])),
  bestPractice: '', recommendedImprovements: '',
  compiledBy: '', compiledDate: '', reportFinalised: false,
});

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
  // General Info - 1.1 Marking Centre Details
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
  // Assessor / Moderator
  assessorName: string;
  assessorMobile: string;
  assessorEmail: string;
  moderatorName: string;
  moderatorMobile: string;
  moderatorEmail: string;
  // Learner Achievements
  learnerAchievements: LearnerAchievementRow[];
  // QA Standards (sections 1-5 + 6)
  standards: Record<string, QaStandardItem>;
  // Section 7 & 8
  qualityOfQuestionPaper: string;
  generalComments: string;
  // Meta
  completedBy: string;
  completedDate: string;
  reportFinalised: boolean;
}

// ============ INTERFACES ============
interface ChecklistSection {
  findings: string;
  recommendations: string;
}

interface InstrumentValidationData {
  qpName: string;
  qpAddress: string;
  qpContactNumber: string;
  qpContactPerson: string;
  dateOfEisa: string;
  dateInstrumentViewed: string;
  instrumentOrExemplar: string;
  qualificationTitle: string;
  qualificationRegStatus: string;
  saqaId: string;
  credits: string;
  nqfLevel: string;
  completedByName: string;
  completedByDesignation: string;
  completedByDate: string;
  previousValidationDate: string;
  previousRecommendations: string;
  qas: {
    addendumDeveloped: YesNo;
    addendumFiled: YesNo;
    componentDetailsCapture: YesNo;
    currentTemplate: YesNo;
    componentDetailsMatch: YesNo;
    file3TemplateProvided: YesNo;
    calculatorProvided: YesNo;
    section: ChecklistSection;
  };
  examiner: {
    criteriaSpecified: YesNo;
    meetsCriteria: YesNo;
    reportCompleted: YesNo;
    reportOnTemplate: YesNo;
    reportChecked: YesNo;
    remediationsRequested: YesNo;
    section: ChecklistSection;
  };
  moderator: {
    criteriaSpecified: YesNo;
    meetsCriteria: YesNo;
    reportCompleted: YesNo;
    reportOnTemplate: YesNo;
    remediationRequested: YesNo;
    changesM: YesNo;
    changesCommunicated: YesNo;
    reportChecked: YesNo;
    section: ChecklistSection;
  };
  overall: {
    approvedByModerator: YesNo;
    separatedDocuments: YesNo;
    memoCorresponds: YesNo;
    frontPageCorrect: YesNo;
    eisaRulesStipulated: YesNo;
    assessmentInstructions: YesNo;
    instructionsClear: YesNo;
    grammarChecked: YesNo;
    spellingChecked: YesNo;
    questionNumbersMatch: YesNo;
    languageLevel: YesNo;
    cognitiveOrder: YesNo;
    section: ChecklistSection;
  };
  documents: {
    moderatorReport: boolean;
    examinerReport: boolean;
    cv: boolean;
    confidentialityAgreement: boolean;
    eisaInstrumentMemo: boolean;
    eisaInstrumentRubric: boolean;
  };
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
  validationDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  assessorName: string;
  assessorEmail: string;
  notes: string;
  scheduleDocumentName?: string;
  submittedToInternalAt?: string;
  internalStatus?: string;
  qpContactPerson?: string;
  qpContactNumber?: string;
  qpContactEmail?: string;
  validationConfirmed?: boolean;
  logisticsArranged?: boolean;
  internalNotes?: string;
  internalUpdatedBy?: string;
  internalUpdatedAt?: string;
  instrumentValidation?: InstrumentValidationData;
}

interface ExtendedSiteMonitoringRecord {
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
  eisaRegDocument?: boolean;
  eisaRegFileName?: string;
  leisaFile?: boolean;
  leisaFileName?: string;
  sorAndQaReports?: boolean;
  sorQaReportsFileName?: string;
  leisaFormData?: {
    compilerName: string;
    compilerEmail: string;
    compilerPhone: string;
    institutionPhone: string;
    qualificationName: string;
    startDate: string;
    expectedCompletionDate: string;
    sdpName: string;
    sdpAddress: string;
    province: string;
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
  sourceEisaRegId?: string;
  // Site Visit Execution specific
  siteVisitBookedAt?: string;
  siteVisitConductedAt?: string;
  qaEvaluationReport?: QAEvaluationReport;
  sentToQpAt?: string;
  sentToQpBy?: string;
  // PEM Report (Post EISA)
  pemReport?: PEMReport;
  pemSubmittedByAdAt?: string;
  pemRecommendedByDdAt?: string;
  // External approved results
  approvedResultsSubmission?: ApprovedResultsSubmission;
  approvedResultsSubmittedAt?: string;
   assessmentType?: AssessmentType;
}

const STORAGE_KEY = 'site_visits_monitoring_records';

const DEFAULT_STANDARDS: Record<string, QaStandardItem> = {
  '1.1': { yes: null, no: null, explanation: '' },
  '1.2': { yes: null, no: null, explanation: '' },
  '1.3': { yes: null, no: null, explanation: '' },
  '1.4': { yes: null, no: null, explanation: '' },
  '1.5': { yes: null, no: null, explanation: '' },
  '1.6': { yes: null, no: null, explanation: '' },
  '1.7': { yes: null, no: null, explanation: '' },
  '1.8': { yes: null, no: null, explanation: '' },
  '1.9': { yes: null, no: null, explanation: '' },
  '1.10': { yes: null, no: null, explanation: '' },
  '1.11': { yes: null, no: null, explanation: '' },
  '2.1': { yes: null, no: null, explanation: '' },
  '2.2': { yes: null, no: null, explanation: '' },
  '2.3': { yes: null, no: null, explanation: '' },
  '2.4': { yes: null, no: null, explanation: '' },
  '3.1': { yes: null, no: null, explanation: '' },
  '3.2': { yes: null, no: null, explanation: '' },
  '3.3': { yes: null, no: null, explanation: '' },
  '3.4': { yes: null, no: null, explanation: '' },
  '4.1': { yes: null, no: null, explanation: '' },
  '4.2': { yes: null, no: null, explanation: '' },
  '4.3': { yes: null, no: null, explanation: '' },
  '4.4': { yes: null, no: null, explanation: '' },
  '4.5': { yes: null, no: null, explanation: '' },
  '4.6': { yes: null, no: null, explanation: '' },
  '4.7': { yes: null, no: null, explanation: '' },
  '4.8': { yes: null, no: null, explanation: '' },
  '5.1': { yes: null, no: null, explanation: '' },
  '5.2': { yes: null, no: null, explanation: '' },
  '5.3': { yes: null, no: null, explanation: '' },
  '5.4': { yes: null, no: null, explanation: '' },
  '5.5': { yes: null, no: null, explanation: '' },
  '5.6': { yes: null, no: null, explanation: '' },
  '5.7': { yes: null, no: null, explanation: '' },
  '6.1': { yes: null, no: null, explanation: '' },
  '6.2': { yes: null, no: null, explanation: '' },
};

const DEFAULT_QA_REPORT: QAEvaluationReport = {
  markingCentreName: '',
  physicalAddress: '',
  province: '',
  eisaDate: '',
  dateMarkingStarted: '',
  dateMarkingCompleted: '',
  numCandidatesAssessed: '',
  numScriptsModerated: '',
  numCandidatesAbsent: '',
  passPercentage: '',
  nycPercentage: '',
  percentageModerated: '',
  registrationStartDate: '',
  registrationEndDate: '',
  lastDateOfEnrolment: '',
  lastDateForAchievement: '',
  qctoOfficialName: 'Nazia Rafir-Munsaur',
  qctoOfficialContact: '0829009471',
  qctoOfficialEmail: 'rafir-munsaur.n@qcto.org.za',
  qpResponsiblePersonName: '',
  qpResponsibleContact: '',
  qpResponsibleEmail: '',
  assessorName: '',
  assessorMobile: '',
  assessorEmail: '',
  moderatorName: '',
  moderatorMobile: '',
  moderatorEmail: '',
  learnerAchievements: [
    { qualificationName: '', enrolledLearners: '', candidatesAssessed: '', totalScriptsMarked: '', numModerators: '', numMarkers: '', competentLearners: '', nycLearners: '' },
  ],
  standards: { ...DEFAULT_STANDARDS },
  qualityOfQuestionPaper: '',
  generalComments: '',
  completedBy: '',
  completedDate: '',
  reportFinalised: false,
};

const INITIAL_RECORDS: ExtendedSiteMonitoringRecord[] = [
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

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
        active ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
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

function OutcomeBadge({ decision }: { decision: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approved: { label: '✓ Approved', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    approved_with_conditions: { label: '⚠ Approved with Conditions', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    not_approved: { label: '✗ Not Approved', cls: 'bg-red-100 text-red-700 border-red-200' },
  };
  const d = map[decision];
  return d ? <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${d.cls}`}>{d.label}</span> : null;
}

function StageBadge({ stage, subStage }: { stage: SiteMonitoringStage; subStage: SiteMonitoringSubStage }) {
  const styles =
    stage === 'closed'
      ? 'bg-green-50 text-green-700 ring-green-600/20'
      : stage === 'evaluation_reporting'
      ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
      : stage === 'site_visit_execution'
      ? 'bg-purple-50 text-purple-700 ring-purple-600/20'
      : 'bg-amber-50 text-amber-700 ring-amber-600/20';
  return <span className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles}`}>{getSubStageLabel(subStage)}</span>;
}

function StatusBadge({ status, approvedLabel = 'Approved', pendingLabel = 'Pending' }: { status: 'pending' | 'in_progress' | 'approved'; approvedLabel?: string; pendingLabel?: string }) {
  if (status === 'approved') return <span className="inline-flex h-8 items-center rounded-full bg-green-50 px-3 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">{approvedLabel}</span>;
  if (status === 'in_progress') return <span className="inline-flex h-8 items-center rounded-full bg-blue-50 px-3 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">In Progress</span>;
  return <span className="inline-flex h-8 items-center rounded-full bg-gray-100 px-3 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">{pendingLabel}</span>;
}

function ActionButton({ children, icon, onClick, variant = 'primary', disabled = false }: { children: React.ReactNode; icon?: React.ReactNode; onClick: () => void; variant?: 'primary' | 'secondary'; disabled?: boolean }) {
  const styles = variant === 'secondary'
    ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
    : 'bg-red-600 text-white hover:bg-red-700';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition ${styles} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {icon}{children}
    </button>
  );
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

function StepCard({ step, done, label, description, children }: { step: number; done: boolean; label: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${done ? 'border-emerald-300 bg-emerald-50/40' : 'border-gray-200 bg-white'}`}>
      <div className={`px-4 py-3 flex items-center gap-3 ${done ? 'bg-emerald-100/60' : 'bg-gray-50'}`}>
        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
          {done ? '✓' : step}
        </div>
        <div>
          <p className={`text-sm font-semibold ${done ? 'text-emerald-800' : 'text-gray-700'}`}>{label}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {children && <div className="p-4">{children}</div>}
    </div>
  );
}

function getSubStageLabel(subStage: SiteMonitoringSubStage) {
  const labels: Record<SiteMonitoringSubStage, string> = {
    eisa_notification_received: 'EISA Notification Received',
    approved_results_received: 'Approved Results Received',
    plan_prepared: 'Plan Prepared',
    competency_checked: 'Competency Checked',
    sdp_identified: 'SDP Identified',
    deputy_director_review: 'Deputy Director Review',
    domain_director_approval: 'Domain Director Approval',
    director_review: 'Director Review',
    site_visit_booked: 'Site Visit Booked',
    site_visit_conducted: 'Site Visit Conducted',
    evaluation_report_compiled: 'Evaluation Report Compiled',
    pem_report_generated: 'PEM Report Generated',
    outcome_sent_to_qp: 'Outcome Sent to QP',
  };
  return labels[subStage] || subStage;
}

// ============ QA STANDARDS DEFINITIONS ============
const QA_SECTIONS = [
  {
    id: '1',
    title: '1. Efficient Planning Conducted by Marking Centre',
    items: [
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
    ],
  },
  {
    id: '2',
    title: '2. Marking Venue is of the Required Standard',
    items: [
      { key: '2.1', label: 'Required furniture and ventilation were available' },
      { key: '2.2', label: 'The attendance register was completed by appointed markers' },
      { key: '2.3', label: 'Only AQP Appointed Marking officials were allowed in the Marking venue/s' },
      { key: '2.4', label: 'Were scripts Marked by AQP Appointed Marker/s and Moderator' },
    ],
  },
  {
    id: '3',
    title: '3. Security of Venue and Scripts is Maintained',
    items: [
      { key: '3.1', label: 'Scripts were received timeously from the Assessment Centres' },
      { key: '3.2', label: 'Security protocols for the receipt of scripts and return of scripts was followed at all times' },
      { key: '3.3', label: 'All scripts were marked' },
      { key: '3.4', label: 'The required percentage of scripts was moderated' },
    ],
  },
  {
    id: '4',
    title: '4. Standard of Marking is Consistent, and Irregularities Identified',
    items: [
      { key: '4.1', label: 'The Moderator and Marker adhered to the final Marking Guidelines' },
      { key: '4.2', label: 'Were any changes to marking guidelines received after the finalization of the marking guidelines?' },
      { key: '4.3', label: 'The moderator identified a marker who was applying the marking guidelines incorrectly or inconsistently and brought up to standard' },
      { key: '4.4', label: 'Feedback was provided to markers from the samples moderated by Moderator to ensure consistency of marking' },
      { key: '4.5', label: 'Major discrepancies between marker and moderator were addressed' },
      { key: '4.6', label: 'Marks awarded for each question for each script was checked for accuracy and totalling before capturing of results' },
      { key: '4.7', label: 'Irregularities were identified' },
      { key: '4.8', label: 'If applicable, explain how these irregularities were dealt with' },
    ],
  },
  {
    id: '5',
    title: '5. Adherence to Required Policies, Schedules and Quality of Reporting',
    items: [
      { key: '5.1', label: 'Marking Centre adhered strictly to QP Assessment Policy' },
      { key: '5.2', label: 'Marking and Moderation was completed according to the QP schedule' },
      { key: '5.3', label: 'Required Marker and Moderator Reports were submitted timeously to the QP' },
      { key: '5.4', label: 'The reports were read and quality assured by the AQP for accuracy and valuable input before being sent to the QCTO' },
      { key: '5.5', label: 'The QP verified the accuracy of the results received from the Moderator' },
      { key: '5.6', label: 'Marking and Moderation took place as per the QP schedule' },
      { key: '5.7', label: 'Required documents and reports will be sent to the QCTO by the due date' },
    ],
  },
  {
    id: '6',
    title: '6. Comment on the following',
    items: [
      { key: '6.1', label: 'In the case of different marks awarded by the Marker and the Moderator, which marks are captured as the final result for the EISA?' },
      { key: '6.2', label: 'More sample marking should be conducted before the marking of batches. Was this done by marker and Moderator?' },
    ],
  },
];

// ============ QA EVALUATION REPORT FORM ============
function QAEvaluationReportForm({
  report,
  onChange,
  onSave,
  onFinalise,
  readonly,
}: {
  report: QAEvaluationReport;
  onChange: (updated: QAEvaluationReport) => void;
  onSave: () => void;
  onFinalise: () => void;
  readonly: boolean;
}) {
  const update = (field: keyof QAEvaluationReport, value: any) => onChange({ ...report, [field]: value });

  const updateStandard = (key: string, field: 'yes' | 'no' | 'explanation', value: any) => {
    const updated = { ...report.standards };
    if (field === 'yes') {
      updated[key] = { ...updated[key], yes: value ? true : null, no: value ? null : updated[key].no };
    } else if (field === 'no') {
      updated[key] = { ...updated[key], no: value ? true : null, yes: value ? null : updated[key].yes };
    } else {
      updated[key] = { ...updated[key], explanation: value };
    }
    onChange({ ...report, standards: updated });
  };

  const updateLearnerRow = (idx: number, field: keyof LearnerAchievementRow, value: string) => {
    const rows = [...report.learnerAchievements];
    rows[idx] = { ...rows[idx], [field]: value };
    onChange({ ...report, learnerAchievements: rows });
  };

  const inputCls = `w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 ${readonly ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`;
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

  return (
    <div className="space-y-8">
      {/* Cover Info */}
      <div className="rounded-2xl border border-red-100 bg-red-50/30 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center">
            <FileCheck className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Quality Assurance Report</p>
            <p className="text-xs text-gray-500">QCTO Occupational Qualifications Marking Sessions</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Assessor / Marker Name</label>
            <input className={inputCls} value={report.assessorName} onChange={(e) => update('assessorName', e.target.value)} disabled={readonly} placeholder="Full name" />
          </div>
          <div>
            <label className={labelCls}>Assessor Mobile</label>
            <input className={inputCls} value={report.assessorMobile} onChange={(e) => update('assessorMobile', e.target.value)} disabled={readonly} placeholder="0XX XXX XXXX" />
          </div>
          <div>
            <label className={labelCls}>Assessor Email</label>
            <input className={inputCls} value={report.assessorEmail} onChange={(e) => update('assessorEmail', e.target.value)} disabled={readonly} placeholder="email@example.com" />
          </div>
          <div>
            <label className={labelCls}>Moderator Name</label>
            <input className={inputCls} value={report.moderatorName} onChange={(e) => update('moderatorName', e.target.value)} disabled={readonly} placeholder="Full name" />
          </div>
          <div>
            <label className={labelCls}>Moderator Mobile</label>
            <input className={inputCls} value={report.moderatorMobile} onChange={(e) => update('moderatorMobile', e.target.value)} disabled={readonly} placeholder="0XX XXX XXXX" />
          </div>
          <div>
            <label className={labelCls}>Moderator Email</label>
            <input className={inputCls} value={report.moderatorEmail} onChange={(e) => update('moderatorEmail', e.target.value)} disabled={readonly} placeholder="email@example.com" />
          </div>
        </div>
      </div>

      {/* Section 1.1 — Marking Centre Details */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">1.1 Marking Centre Details</p>
        </div>
        <div className="p-5 grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>Name of Marking Centre</label>
            <input className={inputCls} value={report.markingCentreName} onChange={(e) => update('markingCentreName', e.target.value)} disabled={readonly} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Physical Address</label>
            <input className={inputCls} value={report.physicalAddress} onChange={(e) => update('physicalAddress', e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Province</label>
            <input className={inputCls} value={report.province} onChange={(e) => update('province', e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>EISA Date</label>
            <input type="date" className={inputCls} value={report.eisaDate} onChange={(e) => update('eisaDate', e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Date Marking Started</label>
            <input type="date" className={inputCls} value={report.dateMarkingStarted} onChange={(e) => update('dateMarkingStarted', e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Date Marking Completed</label>
            <input type="date" className={inputCls} value={report.dateMarkingCompleted} onChange={(e) => update('dateMarkingCompleted', e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>No. of Candidates Assessed</label>
            <input className={inputCls} value={report.numCandidatesAssessed} onChange={(e) => update('numCandidatesAssessed', e.target.value)} disabled={readonly} type="number" />
          </div>
          <div>
            <label className={labelCls}>No. of Scripts Moderated</label>
            <input className={inputCls} value={report.numScriptsModerated} onChange={(e) => update('numScriptsModerated', e.target.value)} disabled={readonly} type="number" />
          </div>
          <div>
            <label className={labelCls}>No. of Candidates Absent</label>
            <input className={inputCls} value={report.numCandidatesAbsent} onChange={(e) => update('numCandidatesAbsent', e.target.value)} disabled={readonly} type="number" />
          </div>
          <div>
            <label className={labelCls}>Pass Percentage (%)</label>
            <input className={inputCls} value={report.passPercentage} onChange={(e) => update('passPercentage', e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>NYC Percentage (%)</label>
            <input className={inputCls} value={report.nycPercentage} onChange={(e) => update('nycPercentage', e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Percentage Moderated (%)</label>
            <input className={inputCls} value={report.percentageModerated} onChange={(e) => update('percentageModerated', e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Registration Start Date</label>
            <input type="date" className={inputCls} value={report.registrationStartDate} onChange={(e) => update('registrationStartDate', e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Registration End Date</label>
            <input type="date" className={inputCls} value={report.registrationEndDate} onChange={(e) => update('registrationEndDate', e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Last Date of Enrolment</label>
            <input type="date" className={inputCls} value={report.lastDateOfEnrolment} onChange={(e) => update('lastDateOfEnrolment', e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>Last Date for Achievement</label>
            <input type="date" className={inputCls} value={report.lastDateForAchievement} onChange={(e) => update('lastDateForAchievement', e.target.value)} disabled={readonly} />
          </div>
          {/* QCTO Official - read only */}
          <div className="md:col-span-2 rounded-xl bg-blue-50 border border-blue-100 p-3">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">QCTO Official</p>
            <div className="grid md:grid-cols-3 gap-2 text-sm">
              <div><span className="text-xs text-gray-400">Name:</span><p className="font-medium">{report.qctoOfficialName}</p></div>
              <div><span className="text-xs text-gray-400">Contact:</span><p className="font-medium">{report.qctoOfficialContact}</p></div>
              <div><span className="text-xs text-gray-400">Email:</span><p className="font-medium text-xs">{report.qctoOfficialEmail}</p></div>
            </div>
          </div>
          <div>
            <label className={labelCls}>QP Responsible Person Name</label>
            <input className={inputCls} value={report.qpResponsiblePersonName} onChange={(e) => update('qpResponsiblePersonName', e.target.value)} disabled={readonly} />
          </div>
          <div>
            <label className={labelCls}>QP Responsible Contact</label>
            <input className={inputCls} value={report.qpResponsibleContact} onChange={(e) => update('qpResponsibleContact', e.target.value)} disabled={readonly} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>QP Responsible Email</label>
            <input className={inputCls} value={report.qpResponsibleEmail} onChange={(e) => update('qpResponsibleEmail', e.target.value)} disabled={readonly} />
          </div>
        </div>
      </div>

      {/* Learner Achievements Table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">2. Learner Achievements</p>
        </div>
        <div className="p-5 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b">
                {['Qualification Name', 'Enrolled', 'Assessed', 'Scripts Marked', 'Moderators', 'Markers', 'Competent', 'NYC'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.learnerAchievements.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  {(['qualificationName', 'enrolledLearners', 'candidatesAssessed', 'totalScriptsMarked', 'numModerators', 'numMarkers', 'competentLearners', 'nycLearners'] as (keyof LearnerAchievementRow)[]).map(field => (
                    <td key={field} className="px-2 py-2">
                      <input
                        className="w-full min-w-[80px] rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-red-400 disabled:bg-gray-50"
                        value={row[field]}
                        onChange={(e) => updateLearnerRow(i, field, e.target.value)}
                        disabled={readonly}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!readonly && (
            <button
              type="button"
              onClick={() => onChange({ ...report, learnerAchievements: [...report.learnerAchievements, { qualificationName: '', enrolledLearners: '', candidatesAssessed: '', totalScriptsMarked: '', numModerators: '', numMarkers: '', competentLearners: '', nycLearners: '' }] })}
              className="mt-3 text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
            >
              + Add Row
            </button>
          )}
        </div>
      </div>

      {/* QA Standards Sections */}
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
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Explanation / Comment</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item) => {
                  const std = report.standards[item.key] || { yes: null, no: null, explanation: '' };
                  return (
                    <tr key={item.key} className="border-b last:border-0 hover:bg-gray-50/40">
                      <td className="px-4 py-3 text-xs font-mono text-gray-400">{item.key}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.label}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!std.yes}
                          onChange={(e) => updateStandard(item.key, 'yes', e.target.checked)}
                          disabled={readonly}
                          className="h-4 w-4 rounded accent-emerald-600"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!std.no}
                          onChange={(e) => updateStandard(item.key, 'no', e.target.checked)}
                          disabled={readonly}
                          className="h-4 w-4 rounded accent-red-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-red-400 disabled:bg-gray-50"
                          value={std.explanation}
                          onChange={(e) => updateStandard(item.key, 'explanation', e.target.value)}
                          disabled={readonly}
                          placeholder="Add explanation..."
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Section 7 & 8 */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">7. Quality of Question Paper/s</p>
        </div>
        <div className="p-5">
          <textarea
            className={`${inputCls} min-h-[80px] resize-y`}
            value={report.qualityOfQuestionPaper}
            onChange={(e) => update('qualityOfQuestionPaper', e.target.value)}
            disabled={readonly}
            placeholder="As identified in Marker's and Moderator's Reports..."
          />
        </div>
      </div>
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">8. General Comments</p>
        </div>
        <div className="p-5">
          <textarea
            className={`${inputCls} min-h-[80px] resize-y`}
            value={report.generalComments}
            onChange={(e) => update('generalComments', e.target.value)}
            disabled={readonly}
            placeholder="General comments..."
          />
        </div>
      </div>

      {/* Completed By */}
      {!readonly && (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Completion Details</p>
          </div>
          <div className="p-5 grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Completed By (Name)</label>
              <input className={inputCls} value={report.completedBy} onChange={(e) => update('completedBy', e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label className={labelCls}>Completion Date</label>
              <input type="date" className={inputCls} value={report.completedDate} onChange={(e) => update('completedDate', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {!readonly && (
        <div className="flex items-center gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <Save className="h-4 w-4" /> Save Draft
          </button>
          <button
            type="button"
            onClick={onFinalise}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
          >
            <FileCheck className="h-4 w-4" /> Finalise Evaluation Report
          </button>
        </div>
      )}

      {readonly && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Evaluation Report Finalised</p>
            <p className="text-xs text-emerald-600 mt-0.5">Completed by {report.completedBy} on {report.completedDate}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ EXTERNAL SUBMISSION VIEWER (read-only) ============
function ExternalSubmissionViewer({ facilitator, learner }: { facilitator: FacilitatorQuestionnaire; learner: LearnerQuestionnaire }) {
  const [view, setView] = useState<'facilitator' | 'learner'>('facilitator');
  const labelCls = 'block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5';
  const F_QUESTIONS = [
    { key: 'q1', label: '1. Orientation session held with academic staff prior to training:' },
    { key: 'q2', label: '2. Who is the AQP for this qualification?' },
    { key: 'q3', label: '3. Consulted Qualification document prior to starting training?' },
    { key: 'q4', label: '4. Consulted Curriculum document prior to starting training?' },
    { key: 'q5', label: '5. To whom do facilitators report?' },
    { key: 'q6', label: '6. Information session held with facilitators and learners?' },
    { key: 'q7', label: '7. Learning material received timeously?' },
    { key: 'q8', label: '8. Opinion on learning material used?' },
    { key: 'q9', label: '9. Additional activities used to make lessons interesting?' },
    { key: 'q10', label: '10. Attendance registers taken for each class?' },
    { key: 'q11', label: '11. Difference between legacy and new Occupational Qualification?' },
    { key: 'q12', label: '12. Most important objective for learner doing Occupational Qualification?' },
    { key: 'q13', label: '13. Additional support and meetings with management?' },
    { key: 'q14', label: '14. Formal internal summative assessments completed?' },
    { key: 'q15', label: '15. Format/methods used for summative assessments?' },
    { key: 'q16', label: '16. Who recorded formal results?' },
    { key: 'q17', label: '17. Where were results recorded?' },
    { key: 'q18', label: '18. Feedback provided to learners after each assessment?' },
    { key: 'q19', label: '19. Re-assessed learners found Not Yet Competent?' },
    { key: 'q20', label: '20. How were NYC learners re-assessed?' },
    { key: 'q21', label: '21. Where did learners do their workplace component?' },
    { key: 'q22', label: '22. Workplace monitored while learners were there?' },
    { key: 'q23', label: '23. Understanding of EISA?' },
    { key: 'q24', label: '24. Received EISA exemplar and worked through it with learners?' },
    { key: 'q25', label: '25. Why did learners perform poorly during EISA?' },
    { key: 'q26', label: '26. Any other matters to bring to QCTO attention?' },
  ];
  const L_QUESTIONS = [
    { key: 'q1', label: '1. Orientation session held with all learners prior to training:' },
    { key: 'q2', label: '2. Received enough information regarding qualification at beginning?' },
    { key: 'q3', label: '3. Read Qualification and Curriculum document prior to starting?' },
    { key: 'q4', label: '4. Where did you complete your Workplace Component?' },
    { key: 'q5', label: '5. Supervisor/mentor signed off workplace competencies?' },
    { key: 'q6', label: '6. Provider/facilitator monitored you at workplace?' },
    { key: 'q7', label: '8. Given opportunity to be re-assessed until Competent?' },
    { key: 'q9', label: '9. Learning material received at beginning of training?' },
    { key: 'q10', label: '10. Thoughts on learning material used?' },
    { key: 'q11', label: '11. Given additional materials to assist with learning?' },
    { key: 'q12', label: '12. Attendance register completed for each class?' },
    { key: 'q13', label: '13. Most enjoyed about this programme?' },
    { key: 'q14', label: '14. What can be done to improve quality of training?' },
    { key: 'q15', label: '15. Informed about EISA at beginning of programme?' },
    { key: 'q16', label: '16. Who is the AQP for this qualification?' },
    { key: 'q17', label: '17. Given opportunity to provide feedback on facilitators?' },
    { key: 'q18', label: '18. Understanding of EISA?' },
    { key: 'q19', label: '19. Revised for EISA using Exemplar with facilitator?' },
    { key: 'q20', label: '20. Well-prepared for final assessment (EISA)?' },
    { key: 'q21', label: '21. What more could improve performance in EISA?' },
    { key: 'q22', label: '22. Why did learners perform poorly in EISA?' },
    { key: 'q23', label: '23. Other matters that prevented quality training?' },
    { key: 'q24', label: '24. What would you like to do once you achieve this qualification?' },
  ];
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 rounded-xl bg-gray-100">
        <button type="button" onClick={() => setView('facilitator')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${view === 'facilitator' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}>
          <GraduationCap className="h-4 w-4" /> Facilitator Questionnaire
        </button>
        <button type="button" onClick={() => setView('learner')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${view === 'learner' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
          <Users className="h-4 w-4" /> Learner Questionnaire
        </button>
      </div>

      {view === 'facilitator' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-purple-100 bg-purple-50/30 p-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div><p className={labelCls}>SDP Name</p><p className="font-medium text-gray-800">{facilitator.sdpName || '—'}</p></div>
              <div><p className={labelCls}>Facilitator Name</p><p className="font-medium text-gray-800">{facilitator.facilitatorName || '—'}</p></div>
              <div className="md:col-span-2"><p className={labelCls}>Modules Facilitated</p><p className="font-medium text-gray-800">{facilitator.modulesFactilitated || '—'}</p></div>
              <div><p className={labelCls}>Today's Date</p><p className="font-medium text-gray-800">{facilitator.todaysDate || '—'}</p></div>
            </div>
          </div>
          {F_QUESTIONS.map(({ key, label }) => {
            const val = (facilitator as any)[key];
            return val ? (
              <div key={key} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{val}</p>
              </div>
            ) : null;
          })}
        </div>
      )}

      {view === 'learner' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div><p className={labelCls}>SDP Name</p><p className="font-medium text-gray-800">{learner.sdpName || '—'}</p></div>
              <div><p className={labelCls}>Learner Name</p><p className="font-medium text-gray-800">{learner.learnerName || '—'}</p></div>
              <div><p className={labelCls}>Duration From</p><p className="font-medium text-gray-800">{learner.durationFrom || '—'}</p></div>
              <div><p className={labelCls}>Duration Until</p><p className="font-medium text-gray-800">{learner.durationUntil || '—'}</p></div>
              <div><p className={labelCls}>Date of EISA</p><p className="font-medium text-gray-800">{learner.dateOfEisa || '—'}</p></div>
              <div><p className={labelCls}>Today's Date</p><p className="font-medium text-gray-800">{learner.todaysDate || '—'}</p></div>
            </div>
          </div>
          {/* Q7 special layout */}
          {(learner.q8yesNo || learner.q8assessmentMethod || learner.q8feedback) && (
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 mb-2">7. Did you do a formal assessment after each module?</p>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-gray-400">Yes/No</p><p className="font-medium">{learner.q8yesNo || '—'}</p></div>
                <div><p className="text-xs text-gray-400">How assessed?</p><p className="font-medium">{learner.q8assessmentMethod || '—'}</p></div>
                <div><p className="text-xs text-gray-400">Facilitator feedback?</p><p className="font-medium">{learner.q8feedback || '—'}</p></div>
              </div>
            </div>
          )}
          {L_QUESTIONS.map(({ key, label }) => {
            const val = (learner as any)[key];
            return val ? (
              <div key={key} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{val}</p>
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

// ============ PEM REPORT TAB ============
function PEMReportTab({
  record, pemReport, onChange, onSave, onSubmitToDd, onDdRecommend, currentRole, isPemSubmitted, isDdRecommended,onSendToApprovals
}: {
  record: ExtendedSiteMonitoringRecord;
  pemReport: PEMReport;
  onChange: (r: PEMReport) => void;
  onSave: () => void;
  onSubmitToDd: () => void;
  onDdRecommend: (recommendation: string) => void;
   onSendToApprovals?: () => void;   
  currentRole: string;
  isPemSubmitted: boolean;
  isDdRecommended: boolean;
}) {
  const [ddRec, setDdRec] = useState(pemReport.ddRecommendation || '');
  const u = (field: keyof PEMReport, val: any) => onChange({ ...pemReport, [field]: val });
  const isAdReadonly = isPemSubmitted;
  const isDdRole = currentRole === 'Deputy Director';
  const isAdRole = currentRole === 'Assistant Director';
  const inp = `w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 ${isAdReadonly ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white'}`;
  const lbl = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';
  const chk = (section: Record<string, PemCheckItem>, key: string, field: 'yes' | 'no' | 'comments', val: any) => {
    const updated = { ...section, [key]: { ...section[key], [field]: val } };
    return updated;
  };

  const SECTION_B = [
    { key: 'B1', label: 'Induction/orientation of learners took place' },
    { key: 'B2', label: 'CVs of facilitators contain relevant industry experience' },
    { key: 'B3', label: 'Copies of certified copies of Facilitators qualifications' },
    { key: 'B4', label: 'Facilitators employment contracts are for the duration of the qualification' },
    { key: 'B5', label: 'Minutes of Staff meetings with facilitators have been held' },
    { key: 'B6', label: 'Timetabling allows for completion of qualifications' },
    { key: 'B7', label: 'Sufficient time has been allocated for each required component' },
    { key: 'B8', label: 'Facilitators files indicate well-prepared lessons' },
    { key: 'B9', label: 'Facilitator files contain qualification and curriculum documents' },
    { key: 'B10', label: 'Attendance Registers for each class/session' },
    { key: 'B11', label: 'Attendance register tallies with learners that wrote the EISA' },
    { key: 'B12', label: 'If discrepancy above, state difference and reason' },
    { key: 'B13', label: 'Effective transitioning from legacy to occupational qualification' },
    { key: 'B14', label: 'Measures taken by facilitator to "bring the world of work" into the classroom' },
    { key: 'B15', label: 'Telephonic confirmation with sample of learners workplaces' },
  ];
  const SECTION_C = [
    { key: 'C1', label: 'Formative assessments are continuously conducted informally' },
    { key: 'C2', label: 'Formal summative assessments conducted for each module and results recorded' },
    { key: 'C2.1', label: 'Assessment instruments and memo available' },
    { key: 'C2.2', label: 'Marked and moderated answer scripts (at least 10%) available for each learner' },
    { key: 'C3', label: 'Completed "Workplace Statement of Results" for each learner' },
    { key: 'C3.1', label: 'Competencies signed off by workplace over the period of time' },
    { key: 'C4', label: 'Internal summative results formally recorded for all components' },
    { key: 'C4.1', label: 'Results reflect on the Statement of Results issued' },
    { key: 'C5', label: 'Learners have worked through the Exemplar of the EISA instrument' },
  ];
  const SECTION_D = [
    { key: 'D1', label: 'SDP has a valid accreditation letter for this qualification' },
    { key: 'D2', label: 'If also accredited as Assessment Centre, valid accreditation letter' },
    { key: 'D3', label: 'Recruitment of learners has been done well' },
    { key: 'D4', label: 'Implementation of the OC has been done well' },
    { key: 'D5', label: 'Each learner has a learner file containing required documents' },
    { key: 'D6', label: 'All learners have met entry requirements of the qualification' },
    { key: 'D7', label: 'Evaluation forms completed by learners anonymously' },
    { key: 'D8', label: 'Internal moderator reports on final summative assessments completed' },
    { key: 'D9', label: 'Matrix available indicating how internal summative assessment criteria are met' },
    { key: 'D10', label: 'NYC learners given opportunity to be re-assessed until competent' },
    { key: 'D11', label: 'Measures taken by SDP to assist and monitor learner in workplace' },
  ];
  const SECTION_E = [
    { key: 'E1', label: 'Assessment instruments received timeously from AQP' },
    { key: 'E2', label: 'Storage of assessment instruments in safe prior to assessment' },
    { key: 'E3', label: 'Assessment venue is of acceptable standard' },
    { key: 'E4', label: 'EISA conducted by trained invigilator' },
    { key: 'E5', label: 'Invigilators know how to deal with irregularities' },
    { key: 'E6', label: 'State whether scripts were couriered or marked/moderated at AC' },
    { key: 'E7', label: 'If couriered, answer scripts were couriered on the same day' },
  ];
  const EVIDENCE_ITEMS = [
    { key: 'evidenceA', label: 'a) Facilitators\' employment contracts' },
    { key: 'evidenceB', label: 'b) Copies of Facilitators\' CVs' },
    { key: 'evidenceC', label: 'c) Copies of Facilitators\' highest qualifications (certified)' },
    { key: 'evidenceD', label: 'd) Facilitator\'s lesson plan/facilitation file' },
    { key: 'evidenceE', label: 'e) Learners\' Enrolment forms with the SDP' },
    { key: 'evidenceF', label: 'f) Learners\' Highest qualifications (meeting entry requirements)' },
    { key: 'evidenceG', label: 'g) Learners\' Workplace Contracts (for funded learners)' },
    { key: 'evidenceH', label: 'h) Timetables that were used' },
    { key: 'evidenceI', label: 'i) List of enrolled learners with IDs' },
    { key: 'evidenceJ', label: 'j) Learners\' Attendance Registers' },
    { key: 'evidenceK', label: 'k) Assessment instruments and memos for internal summative assessments' },
    { key: 'evidenceL', label: 'l) Learners\' marked (and at least 10% moderated) answer scripts' },
    { key: 'evidenceM', label: 'm) Proof of formal recording of modular results' },
    { key: 'evidenceN', label: 'n) Statements of Results printed for each learner as admission to EISA' },
  ];
const reportTitle = record.assessmentType === 'fisa' 
  ? 'Post FISA Performance Report on SDP'
  : 'Post EISA Performance Report on SDP';

const reportSubtitle = record.assessmentType === 'fisa'
  ? 'This report captures the monitoring findings after the Formative Integrated Summative Assessment (FISA)'
  : 'This report captures the monitoring findings after the External Integrated Summative Assessment (EISA)';

  const getSectionTitle = (section: string) => {
  if (record.assessmentType === 'fisa') {
    const fisaTitles: Record<string, string> = {
      'Section B — Training of Learners': 'Section B — Training of Learners (Formative Phase)',
      'Section C — Internal Assessments': 'Section C — Formative & Summative Assessments',
      'Section D — Internal Quality Assurance': 'Section D — Internal Quality Assurance (FISA Readiness)',
      'Section E — Conduct of FISA': 'Section E — Conduct of FISA (if SDP is accredited AC)',
    };
    return fisaTitles[section] || section;
  }
  return section;
};

  const renderSection = (title: string, items: {key:string;label:string}[], sectionData: Record<string, PemCheckItem>, sectionKey: 'sectionB'|'sectionC'|'sectionD'|'sectionE', accent: string) => (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className={`px-5 py-3 border-b ${accent}`}>
        <p className="text-xs font-semibold uppercase tracking-wider">{title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="border-b bg-gray-50/50">
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 w-12">No.</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Statement</th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-emerald-600 w-14">Yes</th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-red-500 w-14">No</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Comments</th>
          </tr></thead>
          <tbody>
            {items.map(({key, label}) => {
              const row = sectionData[key] || { yes: null, no: null, comments: '' };
              return (
                <tr key={key} className="border-b last:border-0 hover:bg-gray-50/40">
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">{key}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{label}</td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={!!row.yes} disabled={isAdReadonly}
                      onChange={e => {
                        const updated = chk(sectionData, key, 'yes', e.target.checked);
                        u(sectionKey, updated);
                      }}
                      className="h-4 w-4 rounded accent-emerald-600" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={!!row.no} disabled={isAdReadonly}
                      onChange={e => {
                        const updated = chk(sectionData, key, 'no', e.target.checked);
                        u(sectionKey, updated);
                      }}
                      className="h-4 w-4 rounded accent-red-500" />
                  </td>
                  <td className="px-4 py-3">
                    <input className="w-full rounded border border-gray-200 px-2 py-1 text-xs outline-none focus:border-red-400 disabled:bg-gray-50"
                      value={row.comments} disabled={isAdReadonly}
                      onChange={e => {
                        const updated = chk(sectionData, key, 'comments', e.target.value);
                        u(sectionKey, updated);
                      }}
                      placeholder="Comments..." />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Status banners */}
      {isDdRecommended && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0"><ThumbsUp className="h-5 w-5 text-white" /></div>
          <div>
            <p className="text-sm font-bold text-emerald-800">PEM Report Recommended by Deputy Director</p>
            <p className="text-xs text-emerald-600 mt-0.5">Recommended on {record.pemReport?.ddReviewedAt ? new Date(record.pemReport.ddReviewedAt).toLocaleDateString('en-ZA') : '—'} by {record.pemReport?.ddReviewedBy || 'Deputy Director'}</p>
            {record.pemReport?.ddRecommendation && <p className="text-xs text-emerald-700 mt-1 bg-white rounded-lg p-2 border border-emerald-200">{record.pemReport.ddRecommendation}</p>}
          </div>
        </div>
      )}
      {isPemSubmitted && !isDdRecommended && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0"><Clock className="h-5 w-5 text-white" /></div>
          <div>
            <p className="text-sm font-bold text-purple-800">PEM Report Submitted — Awaiting Deputy Director Review</p>
            <p className="text-xs text-purple-600 mt-0.5">Submitted by Assistant Director on {record.pemSubmittedByAdAt ? new Date(record.pemSubmittedByAdAt).toLocaleDateString('en-ZA') : '—'}</p>
          </div>
        </div>
      )}
      {!isPemSubmitted && isAdRole && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 flex items-start gap-3">
          <PenLine className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Compile Post EISA Performance Report on SDP</p>
            <p className="text-xs text-amber-700 mt-0.5">Complete all sections of the PEM Report below, then submit to the Deputy Director for review.</p>
          </div>
        </div>
      )}

      {/* ── Cover Section ── */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
       <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
  <FileText className="h-4 w-4 text-red-600" />
  <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">
    {record.assessmentType === 'fisa' ? 'Post FISA Performance Report on SDP — Cover' : 'Post EISA Performance Report on SDP — Cover'}
  </p>
</div>
        <div className="p-5 grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className={lbl}>Skills Development Provider</label><input className={inp} value={pemReport.sdpName} onChange={e=>u('sdpName',e.target.value)} disabled={isAdReadonly} placeholder="SDP name" /></div>
          <div className="md:col-span-2"><label className={lbl}>Address</label><input className={inp} value={pemReport.address} onChange={e=>u('address',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Contact Person</label><input className={inp} value={pemReport.contactPerson} onChange={e=>u('contactPerson',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Contact Number</label><input className={inp} value={pemReport.contactNumber} onChange={e=>u('contactNumber',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Date of Visit</label><input type="date" className={inp} value={pemReport.dateOfVisit} onChange={e=>u('dateOfVisit',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Accredited Provider?</label>
            <select className={inp} value={pemReport.isAccreditedProvider} onChange={e=>u('isAccreditedProvider',e.target.value)} disabled={isAdReadonly}>
              <option value="">Select...</option><option value="Yes">Yes</option><option value="No">No</option>
            </select>
          </div>
          <div><label className={lbl}>Provider Accreditation Number</label><input className={inp} value={pemReport.providerAccreditationNumber} onChange={e=>u('providerAccreditationNumber',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Valid Period of Accreditation</label><input className={inp} value={pemReport.providerAccreditationValidity} onChange={e=>u('providerAccreditationValidity',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Accredited Assessment Centre?</label>
            <select className={inp} value={pemReport.isAccreditedAssessmentCentre} onChange={e=>u('isAccreditedAssessmentCentre',e.target.value)} disabled={isAdReadonly}>
              <option value="">Select...</option><option value="Yes">Yes</option><option value="No">No</option>
            </select>
          </div>
          <div><label className={lbl}>AC Accreditation Number</label><input className={inp} value={pemReport.acAccreditationNumber} onChange={e=>u('acAccreditationNumber',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>AC Valid Period</label><input className={inp} value={pemReport.acAccreditationValidity} onChange={e=>u('acAccreditationValidity',e.target.value)} disabled={isAdReadonly} /></div>
        </div>
      </div>

      {/* Attendees */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Attendees (from signed Attendance Register)</p></div>
        <div className="p-5 space-y-2">
          {pemReport.attendees.map((a, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <input className={inp} value={a.name} disabled={isAdReadonly} onChange={e=>{const arr=[...pemReport.attendees]; arr[i]={...arr[i],name:e.target.value}; u('attendees',arr);}} placeholder={`Name ${i+1}`} />
              <input className={inp} value={a.institution} disabled={isAdReadonly} onChange={e=>{const arr=[...pemReport.attendees]; arr[i]={...arr[i],institution:e.target.value}; u('attendees',arr);}} placeholder="Institution" />
            </div>
          ))}
          {!isAdReadonly && <button type="button" onClick={()=>u('attendees',[...pemReport.attendees,{name:'',institution:''}])} className="text-xs text-red-600 hover:text-red-700 font-semibold">+ Add Attendee</button>}
        </div>
      </div>

      {/* Head of Institution */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Head of Institution</p></div>
        <div className="p-5 grid md:grid-cols-2 gap-4">
          <div><label className={lbl}>Full Names</label><input className={inp} value={pemReport.headFullNames} onChange={e=>u('headFullNames',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>ID Number</label><input className={inp} value={pemReport.headIdNumber} onChange={e=>u('headIdNumber',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Professional Body</label><input className={inp} value={pemReport.headProfessionalBody} onChange={e=>u('headProfessionalBody',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Highest Qualification</label><input className={inp} value={pemReport.headHighestQualification} onChange={e=>u('headHighestQualification',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Industry Experience</label><input className={inp} value={pemReport.headIndustryExperience} onChange={e=>u('headIndustryExperience',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Mobile Number</label><input className={inp} value={pemReport.headMobileNumber} onChange={e=>u('headMobileNumber',e.target.value)} disabled={isAdReadonly} /></div>
          <div className="md:col-span-2"><label className={lbl}>Email Address</label><input className={inp} value={pemReport.headEmail} onChange={e=>u('headEmail',e.target.value)} disabled={isAdReadonly} /></div>
        </div>
      </div>

      {/* Qualification Info + Learner Stats */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Qualification & Learner Statistics</p></div>
        <div className="p-5 grid md:grid-cols-3 gap-4">
          <div><label className={lbl}>Name of AQP</label><input className={inp} value={pemReport.aqpName} onChange={e=>u('aqpName',e.target.value)} disabled={isAdReadonly} /></div>
          <div className="md:col-span-2"><label className={lbl}>Title of Qualification</label><input className={inp} value={pemReport.qualificationTitle} onChange={e=>u('qualificationTitle',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>SAQA ID</label><input className={inp} value={pemReport.saqaId} onChange={e=>u('saqaId',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>NQF Level</label><input className={inp} value={pemReport.nqfLevel} onChange={e=>u('nqfLevel',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Credits</label><input className={inp} value={pemReport.credits} onChange={e=>u('credits',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Date of EISA</label><input type="date" className={inp} value={pemReport.dateOfEisa} onChange={e=>u('dateOfEisa',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Duration</label><input className={inp} value={pemReport.duration} onChange={e=>u('duration',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>No. of Components</label><input className={inp} value={pemReport.numComponents} onChange={e=>u('numComponents',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Required Pass / Competency Mark</label><input className={inp} value={pemReport.requiredPassMark} onChange={e=>u('requiredPassMark',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Learners Registered/Enrolled</label><input className={inp} value={pemReport.learnersRegistered} onChange={e=>u('learnersRegistered',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Duration of Programme</label><input className={inp} value={pemReport.programDuration} onChange={e=>u('programDuration',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Learners Sat for EISA</label><input className={inp} value={pemReport.learnersSatForEisa} onChange={e=>u('learnersSatForEisa',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Learners Absent</label><input className={inp} value={pemReport.learnersAbsent} onChange={e=>u('learnersAbsent',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Competent Learners</label><input className={inp} value={pemReport.learnersCompetent} onChange={e=>u('learnersCompetent',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Not Yet Competent</label><input className={inp} value={pemReport.learnersNyc} onChange={e=>u('learnersNyc',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>Overall Pass Rate</label><input className={inp} value={pemReport.overallPassRate} onChange={e=>u('overallPassRate',e.target.value)} disabled={isAdReadonly} /></div>
        </div>
        {/* Current Learners Table */}
        <div className="px-5 pb-5">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Current Learners Enrolled</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-gray-100 rounded-xl overflow-hidden">
              <thead><tr className="bg-gray-50 border-b"><th className="px-3 py-2 text-left">OC Name</th><th className="px-3 py-2 text-left">Start Date</th><th className="px-3 py-2 text-left">End Date</th></tr></thead>
              <tbody>
                {pemReport.currentLearners.map((cl, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-2 py-1"><input className="w-full min-w-[120px] rounded border border-gray-200 px-2 py-1 text-xs disabled:bg-gray-50" value={cl.ocName} disabled={isAdReadonly} onChange={e=>{const arr=[...pemReport.currentLearners];arr[i]={...arr[i],ocName:e.target.value};u('currentLearners',arr);}} /></td>
                    <td className="px-2 py-1"><input type="date" className="w-full rounded border border-gray-200 px-2 py-1 text-xs disabled:bg-gray-50" value={cl.startDate} disabled={isAdReadonly} onChange={e=>{const arr=[...pemReport.currentLearners];arr[i]={...arr[i],startDate:e.target.value};u('currentLearners',arr);}} /></td>
                    <td className="px-2 py-1"><input type="date" className="w-full rounded border border-gray-200 px-2 py-1 text-xs disabled:bg-gray-50" value={cl.endDate} disabled={isAdReadonly} onChange={e=>{const arr=[...pemReport.currentLearners];arr[i]={...arr[i],endDate:e.target.value};u('currentLearners',arr);}} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isAdReadonly && <button type="button" onClick={()=>u('currentLearners',[...pemReport.currentLearners,{ocName:'',startDate:'',endDate:''}])} className="mt-2 text-xs text-red-600 hover:text-red-700 font-semibold">+ Add Row</button>}
        </div>
      </div>

      {/* Evidence Checklist */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100"><p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Evidence Checklist (must be made available by SDP)</p></div>
        <div className="p-5 space-y-2">
          {EVIDENCE_ITEMS.map(({key, label}) => (
            <div key={key} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-700 flex-1">{label}</span>
              <select className="rounded-lg border border-gray-200 px-2 py-1 text-xs disabled:bg-gray-50 focus:border-red-400"
                value={(pemReport as any)[key]} disabled={isAdReadonly}
                onChange={e=>u(key as keyof PEMReport, e.target.value)}>
                <option value="">—</option><option value="Yes">Yes</option><option value="No">No</option>
              </select>
            </div>
          ))}
        </div>
        {/* Evidence not available table */}
        <div className="px-5 pb-5">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Evidence not available — Reason provided by SDP:</p>
          {pemReport.evidenceNotAvailable.map((ev, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 mb-2">
              <input className={inp} value={ev.item} disabled={isAdReadonly} onChange={e=>{const arr=[...pemReport.evidenceNotAvailable];arr[i]={...arr[i],item:e.target.value};u('evidenceNotAvailable',arr);}} placeholder="Evidence item" />
              <input className={inp} value={ev.reason} disabled={isAdReadonly} onChange={e=>{const arr=[...pemReport.evidenceNotAvailable];arr[i]={...arr[i],reason:e.target.value};u('evidenceNotAvailable',arr);}} placeholder="Reason" />
            </div>
          ))}
          {!isAdReadonly && <button type="button" onClick={()=>u('evidenceNotAvailable',[...pemReport.evidenceNotAvailable,{item:'',reason:''}])} className="text-xs text-red-600 hover:text-red-700 font-semibold">+ Add Row</button>}
        </div>
      </div>

      {/* Section A — Facilitators */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100"><p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Section A — Appointed Facilitators</p></div>
        <div className="p-5 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead><tr className="bg-gray-50 border-b">
              {['','Name & Surname','Highest Qual.','Modules Taught','Relevant Qual? (Y/N)','Contract Dates'].map(h=><th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>
              {pemReport.facilitators.map((f, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-3 py-2 text-gray-400 font-mono">{`A${i+1}`}</td>
                  {(['name','highestQual','modulesName','hasRelevantQual','contractDates'] as (keyof PemFacilitatorRow)[]).map(field=>(
                    <td key={field} className="px-2 py-1">
                      <input className="w-full min-w-[100px] rounded border border-gray-200 px-2 py-1 text-xs disabled:bg-gray-50 focus:border-red-400"
                        value={f[field]} disabled={isAdReadonly}
                        onChange={e=>{const arr=[...pemReport.facilitators];arr[i]={...arr[i],[field]:e.target.value};u('facilitators',arr);}} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!isAdReadonly && <button type="button" onClick={()=>u('facilitators',[...pemReport.facilitators,{name:'',highestQual:'',modulesName:'',hasRelevantQual:'',contractDates:''}])} className="mt-2 text-xs text-red-600 hover:text-red-700 font-semibold">+ Add Facilitator</button>}
        </div>
        <div className="p-5 space-y-4 border-t border-gray-100">
          <div><label className={lbl}>A6. If registration with a Council is required, has this been met for all facilitators?</label><textarea className={`${inp} resize-y`} style={{minHeight:'60px'}} value={pemReport.sectionA6} onChange={e=>u('sectionA6',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>A7. If registration of learners with a Council is required, has this been met?</label><textarea className={`${inp} resize-y`} style={{minHeight:'60px'}} value={pemReport.sectionA7} onChange={e=>u('sectionA7',e.target.value)} disabled={isAdReadonly} /></div>
          <div><label className={lbl}>A8. Comment on whether qualifications and experience of facilitators meet QCTO standards in the curriculum document:</label><textarea className={`${inp} resize-y`} style={{minHeight:'80px'}} value={pemReport.sectionA8} onChange={e=>u('sectionA8',e.target.value)} disabled={isAdReadonly} /></div>
        </div>
      </div>

      {/* Sections B–E */}
      {renderSection('Section B — Training of Learners', SECTION_B, pemReport.sectionB, 'sectionB', 'bg-emerald-50 border-emerald-100 text-emerald-700')}
      {renderSection('Section C — Internal Assessments', SECTION_C, pemReport.sectionC, 'sectionC', 'bg-blue-50 border-blue-100 text-blue-700')}
      {renderSection('Section D — Internal Quality Assurance', SECTION_D, pemReport.sectionD, 'sectionD', 'bg-purple-50 border-purple-100 text-purple-700')}
      {renderSection('Section E — Conduct of EISA (if SDP is accredited AC)', SECTION_E, pemReport.sectionE, 'sectionE', 'bg-orange-50 border-orange-100 text-orange-700')}

      {/* Summary */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Summary & Completion</p></div>
        <div className="p-5 space-y-4">
          <div><label className={lbl}>
  {record.assessmentType === 'fisa' ? 'FISA Outcome Summary' : 'EISA Outcome Summary'}
</label>
<textarea className={`${inp} resize-y`} style={{minHeight:'80px'}} 
  value={pemReport.bestPractice} 
  onChange={e=>u('bestPractice',e.target.value)} 
  disabled={isAdReadonly} 
  placeholder={record.assessmentType === 'fisa' 
    ? "Summarise the FISA outcomes, noting trends in learner performance and areas needing intervention..."
    : "Summarise best practices identified during the monitoring visit..."} 
/>
</div>
          <div><label className={lbl}>Areas for Recommended Improvements:</label><textarea className={`${inp} resize-y`} style={{minHeight:'80px'}} value={pemReport.recommendedImprovements} onChange={e=>u('recommendedImprovements',e.target.value)} disabled={isAdReadonly} /></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className={lbl}>Compiled By</label><input className={inp} value={pemReport.compiledBy} onChange={e=>u('compiledBy',e.target.value)} disabled={isAdReadonly} placeholder="Full name" /></div>
            <div><label className={lbl}>Date</label><input type="date" className={inp} value={pemReport.compiledDate} onChange={e=>u('compiledDate',e.target.value)} disabled={isAdReadonly} /></div>
          </div>
        </div>
      </div>

      {/* AD Actions */}
      {isAdRole && !isPemSubmitted && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">Complete all sections, then submit to Deputy Director.</p>
          <div className="flex gap-3">
            <button type="button" onClick={onSave} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
              <Save className="h-4 w-4" /> Save Draft
            </button>
            <button type="button" onClick={onSubmitToDd} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 px-5 py-2 text-sm font-semibold text-white transition">
              <Send className="h-4 w-4" /> Submit to Deputy Director
            </button>
          </div>
        </div>
      )}

      {/* DD Review panel */}
      {isDdRole && isPemSubmitted && !isDdRecommended && (
        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 overflow-hidden">
          <div className="px-5 py-3 bg-purple-100 border-b border-purple-200 flex items-center gap-2">
            <ClipboardCheckIcon className="h-4 w-4 text-purple-700" />
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Deputy Director — Review & Recommend</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className={lbl}>DD Recommendation / Comments</label>
              <textarea className="w-full rounded-xl border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 bg-white resize-y min-h-[80px]"
                value={ddRec} onChange={e=>setDdRec(e.target.value)} placeholder="Enter your recommendation or comments..." />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={()=>onDdRecommend(ddRec)}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2.5 text-sm font-semibold text-white transition">
                <ThumbsUp className="h-4 w-4" /> Recommend PEM Report
              </button>
            </div>
          </div>
        </div>
      )}
 {isDdRecommended && !record.sentToQp && currentRole === 'Deputy Director' && (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">PEM Report Recommended</p>
          <p className="text-xs text-emerald-600">The report has been reviewed and recommended. You can now send it to Approvals & Outcomes.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          // Use the prop correctly - call onSendToApprovals
          if (onSendToApprovals) {
            onSendToApprovals();
          }
        }}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition"
      >
        <ArrowRight className="h-4 w-4" /> Move to Approvals & Outcomes
      </button>
    </div>
  )}

    </div>
  );
}

// ============ MAIN COMPONENT ============
export default function InternalSiteVisitsAndMonitoringPage() {
  const [activeTab, setActiveTab] = useState<SiteMonitoringTab>('incomingRequests');
  const [records, setRecords] = useState<ExtendedSiteMonitoringRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ExtendedSiteMonitoringRecord | null>(null);
  const [planModalRecord, setPlanModalRecord] = useState<ExtendedSiteMonitoringRecord | null>(null);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleVenue, setScheduleVenue] = useState('');
  const [monthlyPlanMonth, setMonthlyPlanMonth] = useState('');
  const [monthlyPlanSummary, setMonthlyPlanSummary] = useState('');
  const [assignedOfficials, setAssignedOfficials] = useState('');
  const [activeModalTab, setActiveModalTab] = useState<ModalTab>('details');
  const [liveReport, setLiveReport] = useState<QAEvaluationReport | null>(null);
  const [livePemReport, setLivePemReport] = useState<PEMReport | null>(null);
  const { currentRole } = useApp();

  useEffect(() => {
    loadRecords();
    const handleStorage = (e?: StorageEvent) => {
      if (!e || e.key === STORAGE_KEY) loadRecords();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Keep liveReport in sync when selectedRecord changes
  useEffect(() => {
    if (selectedRecord) {
      setLiveReport(selectedRecord.qaEvaluationReport ? { ...selectedRecord.qaEvaluationReport } : { ...DEFAULT_QA_REPORT });
      setLivePemReport(selectedRecord.pemReport ? { ...selectedRecord.pemReport } : DEFAULT_PEM_REPORT());
    } else {
      setLiveReport(null);
      setLivePemReport(null);
    }
  }, [selectedRecord?.id]);

  const loadRecords = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RECORDS));
      setRecords(INITIAL_RECORDS);
      return;
    }
    setRecords(JSON.parse(stored));
  };

  const saveRecords = (updated: ExtendedSiteMonitoringRecord[]) => {
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
  };

  const updateRecord = (recordId: string, updater: (record: ExtendedSiteMonitoringRecord) => ExtendedSiteMonitoringRecord) => {
    const updated = records.map((record) => record.id === recordId ? updater(record) : record);
    saveRecords(updated);
    // Also update selectedRecord if it's the one being edited
    const updatedRecord = updated.find(r => r.id === recordId);
    if (updatedRecord && selectedRecord?.id === recordId) {
      setSelectedRecord(updatedRecord);
    }
  };

  const incomingRecords = useMemo(() => records.filter((record) => record.stage === 'incoming_request'), [records]);
  const planningRecords = useMemo(() => records.filter((record) => record.stage === 'planning_scheduling'), [records]);
  const executionRecords = useMemo(() => records.filter((record) => record.stage === 'site_visit_execution'), [records]);
// In the evaluationRecords filter, add console.log:
const evaluationRecords = useMemo(() => {
  const filtered = records.filter((record) =>
    (
      record.stage === 'evaluation_reporting' ||
      (record.approvedResultsSubmittedAt && record.stage !== 'approval_outcome' && record.stage !== 'closed') ||
      (record.approvedResultsSubmission && !record.pemReportGenerated)
    ) &&
    !record.pemSubmittedByAdAt &&
    !record.pemRecommendedByDdAt &&
    !record.sentToQp
  );
  
  // Log records that are being excluded
  records.forEach(record => {
    if (record.pemSubmittedByAdAt && !record.pemRecommendedByDdAt && !record.sentToQp) {
      console.log('Record in Approvals (should not be in Eval):', record.id, 'pemSubmittedByAdAt:', record.pemSubmittedByAdAt);
    }
  });
  
  return filtered;
}, [records]);
const approvalRecords = useMemo(() => records.filter((record) => 
  record.stage === 'approval_outcome' || 
  record.stage === 'closed' ||
  // Records that have been submitted to DD for review
  (record.pemSubmittedByAdAt && !record.pemRecommendedByDdAt) ||
  // Records that have been recommended by DD but not yet sent to QP
  (record.pemRecommendedByDdAt && !record.sentToQp)
), [records]);


  const openPlanModal = (record: ExtendedSiteMonitoringRecord) => {
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
    showToast('Schedule and Monthly Plan saved and submitted for review!');
  };

  const handleSavePlanForRecord = (recordId: string) => {
    if (!scheduleTitle || !scheduleDate) {
      showToast('Please fill in Schedule Title and Schedule Date');
      return;
    }
    updateRecord(recordId, (record) => ({
      ...record,
      stage: 'planning_scheduling',
      subStage: 'deputy_director_review',
      schedulePrepared: true,
      monthlyPlanPrepared: true,
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
    setSelectedRecord(null);
    showToast('Schedule and Monthly Plan saved and submitted for review!');
  };

  const handleDeputyDirectorRecommendMarkedModerated = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      deputyDirectorStatus: 'approved',
      subStage: 'domain_director_approval',
      domainDirectorStatus: 'in_progress',
      submittedBy: 'Deputy Director',
    }));
    showToast('Recommended to Domain Director for approval');
  };

  const handleDomainDirectorApproveMarkedModerated = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      domainDirectorStatus: 'approved',
      stage: 'site_visit_execution',
      subStage: 'site_visit_booked',
      submittedBy: 'Domain Director',
    }));
    showToast('Plan approved! Moved to Site Visit Execution tab');
    setActiveTab('siteVisitExecution');
  };

  const handleDeputyDirectorRecommendPostEisa = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      deputyDirectorStatus: 'approved',
      subStage: 'director_review',
      directorStatus: 'in_progress',
      submittedBy: 'Deputy Director',
    }));
    showToast('Recommended to Director for approval');
  };

  const handleDirectorApprovePostEisa = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      directorStatus: 'approved',
      stage: 'site_visit_execution',
      subStage: 'site_visit_conducted',
      submittedBy: 'Director',
    }));
    showToast('Plan approved! Moved to Site Visit Execution tab');
    setActiveTab('siteVisitExecution');
  };

  const handleBookSiteVisit = (recordId: string) => {
    const bookingReference = `BOOK-${recordId}-${Date.now().toString().slice(-4)}`;
    updateRecord(recordId, (record) => ({
      ...record,
      siteVisitBooked: true,
      subStage: 'site_visit_conducted',
      submittedBy: 'Sub Domain Admin',
      bookingReference,
      siteVisitBookedAt: new Date().toISOString(),
    }));
    showToast(`Site visit booked! Reference: ${bookingReference}`);
  };

  const handleSaveQAReport = (recordId: string) => {
    if (!liveReport) return;
    updateRecord(recordId, (record) => ({
      ...record,
      qaEvaluationReport: { ...liveReport },
    }));
    showToast('Evaluation report draft saved');
  };

  const handleFinaliseQAReport = (recordId: string) => {
    if (!liveReport) return;
    const finalised: QAEvaluationReport = {
      ...liveReport,
      reportFinalised: true,
    };
    updateRecord(recordId, (record) => ({
      ...record,
      qaEvaluationReport: finalised,
      evaluationToolCompleted: true,
      evaluationReportCompiled: true,
      stage: 'evaluation_reporting',
      subStage: 'evaluation_report_compiled',
      submittedBy: 'Deputy & Assistant Director',
      siteVisitConductedAt: record.siteVisitConductedAt || new Date().toISOString(),
    }));
    setLiveReport(finalised);
    showToast('Evaluation Report finalised and moved to Evaluation & Reports');
  };

  // ── PEM Report handlers ──
  const handleSavePemReport = (recordId: string) => {
    if (!livePemReport) return;
    updateRecord(recordId, (record) => ({
      ...record,
      pemReport: { ...livePemReport },
    }));
    showToast('PEM Report draft saved');
  };

 const handleSubmitPemToDd = (recordId: string) => {
  if (!livePemReport) return;
  const submitted: PEMReport = { ...livePemReport, reportFinalised: true, finalisedAt: new Date().toISOString() };
  updateRecord(recordId, (record) => ({
    ...record,
    pemReport: submitted,
    pemSubmittedByAdAt: new Date().toISOString(), // This should be set
    pemReportGenerated: true,
    subStage: 'pem_report_generated',
    deputyDirectorStatus: 'in_progress',
  }));
  setLivePemReport(submitted);
  showToast('PEM Report submitted to Deputy Director for review');
};

  const handleDdRecommendPem = (recordId: string, recommendation: string) => {
  updateRecord(recordId, (record) => ({
    ...record,
    pemReport: record.pemReport
      ? { ...record.pemReport, ddRecommendation: recommendation, ddReviewedBy: currentRole || 'Deputy Director', ddReviewedAt: new Date().toISOString(), ddRecommended: true }
      : record.pemReport,
    pemRecommendedByDdAt: new Date().toISOString(),
    // Stay in evaluation_reporting - do NOT move to approval_outcome yet
    stage: 'evaluation_reporting',
    subStage: 'pem_report_generated',
    deputyDirectorStatus: 'approved',
  }));
  showToast('PEM Report recommended by Deputy Director');
};

const handleMoveToApprovalsOutcomes = (recordId: string) => {
  updateRecord(recordId, (record) => ({
    ...record,
    stage: 'approval_outcome',
    subStage: 'outcome_sent_to_qp',
    sentToQp: true,
    sentToQpAt: new Date().toISOString(),
    sentToQpBy: currentRole || 'Deputy Director',
    submittedBy: currentRole || 'Deputy Director',
  }));
  showToast('Application moved to Approvals & Outcomes');
};

  const handleCompileEvaluationReport = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      stage: 'evaluation_reporting',
      subStage: 'evaluation_report_compiled',
      evaluationToolCompleted: true,
      evaluationReportCompiled: true,
      submittedBy: 'Deputy & Assistant Director',
    }));
    showToast('Evaluation report compiled');
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
    showToast('PEM report generated');
  };

  const handleSendMarkedModeratedToQp = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      stage: 'closed',
      subStage: 'outcome_sent_to_qp',
      sentToQp: true,
      sentToQpAt: new Date().toISOString(),
      sentToQpBy: currentRole || 'Deputy Director',
      submittedBy: 'Deputy Director',
    }));
    showToast('Outcome sent to Quality Partner');
  };

  const handleSendResultsToQp = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      stage: 'closed',
      subStage: 'outcome_sent_to_qp',
      sentToQp: true,
      sentToQpAt: new Date().toISOString(),
      sentToQpBy: currentRole || 'Deputy Director',
      submittedBy: 'Deputy Director',
    }));
    setSelectedRecord(null);
    showToast('Results sent to Quality Partner (External Side)');
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
    showToast('PEM approved and sent to Quality Partner');
  };

  const moveToPlanningScheduling = (recordId: string) => {
    updateRecord(recordId, (record) => ({
      ...record,
      stage: 'planning_scheduling',
      subStage: 'plan_prepared',
      submittedBy: currentRole || 'Assistant Director',
      schedulePrepared: false,
      monthlyPlanPrepared: false,
    }));
    setSelectedRecord(null);
    setActiveTab('planningScheduling');
    showToast('Application moved to Planning & Scheduling tab');
  };

  const showToast = (msg: string) => {
    const el = document.createElement('div');
    el.className = 'fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-2xl z-[200] flex items-center gap-2';
    el.innerHTML = `<span style="color:#34d399">✓</span> ${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  const dashboardCards = useMemo(() => ({
    totalIncoming: records.filter((r) => r.stage === 'incoming_request').length,
    totalPlanning: records.filter((r) => r.stage === 'planning_scheduling').length,
    totalExecution: records.filter((r) => r.stage === 'site_visit_execution').length,
    totalReports: records.filter((r) => r.stage === 'evaluation_reporting').length,
    totalClosed: records.filter((r) => r.stage === 'closed').length,
    sentToQp: records.filter((r) => r.sentToQp).length,
  }), [records]);

  const formatDate = (d?: string) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('en-ZA'); }
    catch { return d ?? '-'; }
  };

  const formatDateTime = (d?: string) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleString('en-ZA'); }
    catch { return d ?? '-'; }
  };

  const hasSchedule = !!(selectedRecord?.eisaSchedule);
  const hasOutcome = !!(selectedRecord?.outcomeReport?.reportFinalised);
  const hasInstrumentValidation = !!(selectedRecord?.eisaSchedule?.instrumentValidation);
  const hasLiaiseDetails = !!(selectedRecord?.eisaSchedule?.qpContactPerson);
  const outcomeDecision = selectedRecord?.outcomeReport?.outcomeDecision || '';
  const isExecutionStage = selectedRecord?.stage === 'site_visit_execution';
  const isPlanningStage = selectedRecord?.stage === 'planning_scheduling';
  const hasExternalSubmission = !!(selectedRecord?.approvedResultsSubmittedAt);
  const hasPemReport = !!(selectedRecord?.pemReportGenerated || selectedRecord?.approvedResultsSubmittedAt);
  const isPemSubmitted = !!(selectedRecord?.pemSubmittedByAdAt);
  const isDdRecommended = !!(selectedRecord?.pemRecommendedByDdAt);

  // Execution workflow state
  const isBooked = !!(selectedRecord?.siteVisitBooked);
  const hasQAReport = !!(selectedRecord?.qaEvaluationReport);
  const isReportFinalised = !!(selectedRecord?.qaEvaluationReport?.reportFinalised);
  const isSentToQp = !!(selectedRecord?.sentToQp);
  

  return (
    <div className="space-y-6">

      {/* ── Gradient Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs text-red-200 font-medium uppercase tracking-widest mb-1">Internal Portal</p>
            <h1 className="text-2xl font-bold">Site Visits & Monitoring</h1>
            <p className="mt-1 text-sm text-red-100">Manage requests, planning, execution, reporting, approvals, and monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { loadRecords(); showToast('Refreshed'); }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 border border-white/30 px-3 py-2 text-sm font-medium text-white hover:bg-white/30 transition"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <div className="inline-flex w-fit items-center rounded-xl bg-white/20 backdrop-blur px-3 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-red-200">Current role</span>
              <span className="ml-3 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm">{currentRole || 'Assistant Director'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b bg-gray-50/80 px-6 py-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <TabButton label="Incoming Requests" active={activeTab === 'incomingRequests'} onClick={() => setActiveTab('incomingRequests')} />
            <TabButton label="Planning & Scheduling" active={activeTab === 'planningScheduling'} onClick={() => setActiveTab('planningScheduling')} />
            <TabButton label="Site Visit Execution" active={activeTab === 'siteVisitExecution'} onClick={() => setActiveTab('siteVisitExecution')} />
            <TabButton label="Evaluation & Reports" active={activeTab === 'evaluationReports'} onClick={() => setActiveTab('evaluationReports')} />
            <TabButton label="Approvals & Outcomes" active={activeTab === 'approvalsOutcomes'} onClick={() => setActiveTab('approvalsOutcomes')} />
            <TabButton label="Monitoring Dashboard" active={activeTab === 'monitoringDashboard'} onClick={() => setActiveTab('monitoringDashboard')} />
          </div>
        </div>

        <div className="p-6">
          {/* Incoming Requests Tab */}
          {activeTab === 'incomingRequests' && (
            <SectionShell title="Incoming Requests" description="Receive EISA notifications for Marked & Moderated Scripts and Approved Results for Post EISA Monitoring.">
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard title="New Requests" value={String(incomingRecords.length)} icon={<Inbox className="h-5 w-5" />} accent="bg-gradient-to-br from-red-500 to-rose-600 text-white" />
                <InfoCard title="Marked & Moderated" value={String(incomingRecords.filter((r) => r.processType === 'marked_moderated_scripts').length)} icon={<FileText className="h-5 w-5" />} accent="bg-gradient-to-br from-blue-500 to-indigo-600 text-white" />
                <InfoCard title="Post EISA Monitoring" value={String(incomingRecords.filter((r) => r.processType === 'post_eisa_monitoring').length)} icon={<FileText className="h-5 w-5" />} accent="bg-gradient-to-br from-violet-500 to-purple-600 text-white" />
              </div>
              <ExtendedRecordsTable
                records={incomingRecords}
                actionRenderer={(record) => (
                  <>
                    <ActionButton variant="secondary" icon={<Eye className="h-4 w-4" />} onClick={() => { setSelectedRecord(record); setActiveModalTab('details'); }}>View</ActionButton>
                    {currentRole === 'Assistant Director' && record.stage === 'incoming_request' && (
                      <ActionButton icon={<PencilLine className="h-4 w-4" />} onClick={() => moveToPlanningScheduling(record.id)}>Move to Planning</ActionButton>
                    )}
                  </>
                )}
              />
            </SectionShell>
          )}

          {/* Planning & Scheduling Tab */}
          {activeTab === 'planningScheduling' && (
            <SectionShell title="Planning & Scheduling" description="Prepare site visit schedules and monthly plans, then submit for review and approval.">
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard title="Pending Preparation" value={String(planningRecords.filter(r => r.subStage === 'plan_prepared').length)} icon={<CalendarDays className="h-5 w-5" />} accent="bg-gradient-to-br from-amber-500 to-orange-600 text-white" />
                <InfoCard title="Awaiting Review" value={String(planningRecords.filter(r => r.deputyDirectorStatus === 'in_progress' || r.domainDirectorStatus === 'in_progress' || r.directorStatus === 'in_progress').length)} icon={<CalendarClock className="h-5 w-5" />} accent="bg-gradient-to-br from-blue-500 to-indigo-600 text-white" />
                <InfoCard title="Ready for Execution" value={String(planningRecords.filter(r => r.schedulePrepared && r.monthlyPlanPrepared).length)} icon={<FolderCheck className="h-5 w-5" />} accent="bg-gradient-to-br from-emerald-500 to-green-600 text-white" />
              </div>
              <PlanningRecordsTable
                records={planningRecords}
                currentRole={currentRole}
                onEditPlan={openPlanModal}
                onRecommendToDomainDirector={handleDeputyDirectorRecommendMarkedModerated}
                onApprovePlan={handleDomainDirectorApproveMarkedModerated}
                onRecommendToDirector={handleDeputyDirectorRecommendPostEisa}
                onApprovePlanDirector={handleDirectorApprovePostEisa}
                onViewDetails={(record) => { setSelectedRecord(record); setActiveModalTab('details'); }}
              />
            </SectionShell>
          )}

          {/* ===== SITE VISIT EXECUTION TAB ===== */}
          {activeTab === 'siteVisitExecution' && (
            <SectionShell title="Site Visit Execution" description="Book and conduct site visits, compile QA evaluation reports, and send results to the Quality Partner.">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <InfoCard
                  title="Total in Execution"
                  value={String(executionRecords.length)}
                  icon={<MapPinned className="h-5 w-5" />}
                  accent="bg-gradient-to-br from-purple-500 to-violet-600 text-white"
                />
                <InfoCard
                  title="Booked"
                  value={String(executionRecords.filter(r => r.siteVisitBooked).length)}
                  icon={<CheckCircle className="h-5 w-5" />}
                  accent="bg-gradient-to-br from-emerald-500 to-green-600 text-white"
                />
                <InfoCard
                  title="Reports Compiled"
                  value={String(executionRecords.filter(r => r.evaluationReportCompiled).length)}
                  icon={<FileCheck className="h-5 w-5" />}
                  accent="bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                />
                <InfoCard
                  title="Sent to QP"
                  value={String(records.filter(r => r.sentToQp).length)}
                  icon={<Send className="h-5 w-5" />}
                  accent="bg-gradient-to-br from-red-500 to-rose-600 text-white"
                />
              </div>

              {/* Records Table */}
              {executionRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16">
                  <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <MapPinned className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-500">No Site Visit Execution Records</p>
                  <p className="text-sm text-gray-400 mt-1">Records will appear here after the plan is approved in Planning & Scheduling.</p>
                  <button
                    type="button"
                    onClick={() => { loadRecords(); showToast('Refreshed'); }}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                  >
                    <RefreshCw className="h-4 w-4" /> Refresh
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b bg-gray-50/60 px-6 py-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Site Visit Records</p>
                    <span className="text-xs text-gray-400">{executionRecords.length} record{executionRecords.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50/60">
                          {['#', 'Registration', 'Qualification', 'Site / SDP', 'Schedule Date', 'Progress', 'Stage', 'Actions'].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {executionRecords.map((record, idx) => {
                          const booked = record.siteVisitBooked;
                          const reported = record.evaluationReportCompiled || record.pemReportGenerated;
                          const sent = record.sentToQp;
                          const stepsDone = [booked, reported, sent].filter(Boolean).length;

                          return (
                            <tr key={record.id} className="border-b border-gray-100 last:border-0 hover:bg-red-50/30 transition-colors group">
                              <td className="px-5 py-4 align-top text-xs font-mono text-gray-400">{String(idx + 1).padStart(2, '0')}</td>
                              <td className="px-5 py-4 align-top">
                                <div className="font-semibold text-gray-900">{record.eisaRegNo || record.id}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{formatDate(record.scheduleDate || record.visitDate)}</div>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <div className="text-sm text-gray-700 truncate max-w-[180px]" title={record.title}>{record.title}</div>
                                {record.saqaId && <div className="text-xs text-gray-400 font-mono mt-0.5">SAQA: {record.saqaId}</div>}
                              </td>
                              <td className="px-5 py-4 align-top text-sm text-gray-700">{record.siteName}</td>
                              <td className="px-5 py-4 align-top">
                                <div className="text-sm font-medium text-gray-800">{formatDate(record.scheduleDate || record.visitDate)}</div>
                                {record.scheduleVenue && <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />{record.scheduleVenue}</div>}
                              </td>
                              <td className="px-5 py-4 align-top">
                                <div className="flex items-center gap-1.5">
                                  {[
                                    { done: booked, tip: 'Booked' },
                                    { done: reported, tip: 'Report' },
                                    { done: sent, tip: 'QP Sent' },
                                  ].map((step, i) => (
                                    <div key={i} title={step.tip} className={`h-2.5 w-2.5 rounded-full ${step.done ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                  ))}
                                  <span className="ml-1 text-xs text-gray-400">{stepsDone}/3</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <StageBadge stage={record.stage} subStage={record.subStage} />
                              </td>
                              <td className="px-5 py-4 align-top">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => { setSelectedRecord(record); setActiveModalTab('siteVisitExecution'); }}
                                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3 text-xs font-semibold text-white transition"
                                  >
                                    <ListChecks className="h-3.5 w-3.5" /> Process
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => { setSelectedRecord(record); setActiveModalTab('details'); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-100 text-red-600"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </SectionShell>
          )}

          {/* Evaluation & Reports Tab */}
          {activeTab === 'evaluationReports' && (
            <SectionShell title="Evaluation & Reports" description="Compile PEM Reports for external submissions, and manage Evaluation Reports for Marked & Moderated Scripts.">
              <div className="grid gap-4 md:grid-cols-4">
                <InfoCard title="Total Records" value={String(evaluationRecords.length)} icon={<FileText className="h-5 w-5" />} accent="bg-gradient-to-br from-gray-500 to-slate-600 text-white" />
                <InfoCard title="QP Submitted" value={String(evaluationRecords.filter((r) => !!r.approvedResultsSubmittedAt).length)} icon={<Upload className="h-5 w-5" />} accent="bg-gradient-to-br from-amber-500 to-orange-600 text-white" />
                <InfoCard title="PEM Compiled" value={String(evaluationRecords.filter((r) => r.pemReportGenerated).length)} icon={<FileCheck className="h-5 w-5" />} accent="bg-gradient-to-br from-violet-500 to-purple-600 text-white" />
                <InfoCard title="Eval Reports" value={String(evaluationRecords.filter((r) => r.evaluationReportCompiled).length)} icon={<FileText className="h-5 w-5" />} accent="bg-gradient-to-br from-blue-500 to-indigo-600 text-white" />
              </div>

              {evaluationRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16">
                  <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-500">No records in Evaluation & Reports</p>
                  <p className="text-sm text-gray-400 mt-1">Records appear here when the QP submits approved results or after a site visit is conducted.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b bg-gray-50/60 px-6 py-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">Evaluation & Report Records</p>
                    <span className="text-xs text-gray-400">{evaluationRecords.length} record{evaluationRecords.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50/60">
                          {['#', 'Registration', 'Qualification / Site', 'Type', 'QP Submission', 'PEM Report', 'Action Required', 'Actions'].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                  <tbody>
    {evaluationRecords.map((record, idx) => {
      const hasQpSub = !!record.approvedResultsSubmittedAt;
      const pemDone = record.pemReportGenerated;
      const pemSubmitted = !!record.pemSubmittedByAdAt;
      const ddRecommended = !!record.pemRecommendedByDdAt;
      const isPostEisa = record.processType === 'post_eisa_monitoring';
      const isFisa = record.assessmentType === 'fisa';

      let actionRequired = '—';
      let actionColor = 'text-gray-400';
      
      // For FISA applications, require PEM compilation after QP submission
      if (isFisa) {
        if (hasQpSub && !pemSubmitted && currentRole === 'Assistant Director') {
          actionRequired = 'Compile FISA PEM Report';
          actionColor = 'text-amber-700 font-semibold';
        } else if (pemSubmitted && !ddRecommended && currentRole === 'Deputy Director') {
          actionRequired = 'Review & Recommend FISA PEM';
          actionColor = 'text-purple-700 font-semibold';
        } else if (ddRecommended && !record.sentToQp && currentRole === 'Deputy Director') {
          actionRequired = 'Send Outcome to QP';
          actionColor = 'text-blue-700 font-semibold';
        }
      } else {
        // Existing logic for EISA
        if (hasQpSub && !pemSubmitted && currentRole === 'Assistant Director') {
          actionRequired = 'Compile PEM Report';
          actionColor = 'text-amber-700 font-semibold';
        } else if (pemSubmitted && !ddRecommended && currentRole === 'Deputy Director') {
          actionRequired = 'Review & Recommend PEM';
          actionColor = 'text-purple-700 font-semibold';
        } else if (record.evaluationReportCompiled && currentRole === 'Deputy Director' && !record.sentToQp) {
          actionRequired = 'Send Outcome to QP';
          actionColor = 'text-blue-700 font-semibold';
        }
      }

      return (
        <tr key={record.id}>
          {/* ... existing cells ... */}
          <td className="px-5 py-4 align-top">
            <div className="flex items-center gap-2">
              {hasQpSub && (
                <button
                  type="button"
                  onClick={() => { setSelectedRecord(record); setActiveModalTab('external_submissions'); }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 text-xs font-semibold text-white transition"
                >
                  <FileSearch className="h-3.5 w-3.5" /> QP Data
                </button>
              )}
              {/* PEM Report button - only show after QP submission for FISA */}
              {(hasQpSub || record.stage === 'evaluation_reporting') && (
                <button
                  type="button"
                  onClick={() => { setSelectedRecord(record); setActiveModalTab('pem_report'); }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-3 text-xs font-semibold text-white transition"
                >
                  <FileCheck className="h-3.5 w-3.5" /> {isFisa ? 'FISA PEM Report' : 'PEM Report'}
                </button>
              )}
              {/* Send to QP button - only after DD recommends PEM for FISA */}
              {isFisa && ddRecommended && !record.sentToQp && currentRole === 'Deputy Director' && (
                <button
                  type="button"
                  onClick={() => handleSendMarkedModeratedToQp(record.id)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3 text-xs font-semibold text-white transition"
                >
                  <Send className="h-3.5 w-3.5" /> Send to QP
                </button>
              )}
              {/* Original send to QP for EISA */}
              {!isFisa && record.evaluationReportCompiled && !record.sentToQp && currentRole === 'Deputy Director' && (
                <button
                  type="button"
                  onClick={() => handleSendMarkedModeratedToQp(record.id)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3 text-xs font-semibold text-white transition"
                >
                  <Send className="h-3.5 w-3.5" /> Send to QP
                </button>
              )}
              <button
                type="button"
                onClick={() => { setSelectedRecord(record); setActiveModalTab('details'); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-100 text-red-600"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      );
    })}
  </tbody>

                    </table>
                  </div>
                </div>
              )}
            </SectionShell>
          )}

          {/* Approvals & Outcomes Tab */}
          {activeTab === 'approvalsOutcomes' && (
            <SectionShell title="Approvals & Outcomes" description="Track final approvals and outcomes sent back to Quality Partner.">
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard title="Awaiting Approval" value={String(records.filter((r) => r.stage === 'approval_outcome').length)} icon={<CheckCircle2 className="h-5 w-5" />} accent="bg-gradient-to-br from-amber-500 to-orange-600 text-white" />
                <InfoCard title="Sent to QP" value={String(records.filter((r) => r.sentToQp).length)} icon={<CheckCircle2 className="h-5 w-5" />} accent="bg-gradient-to-br from-blue-500 to-indigo-600 text-white" />
                <InfoCard title="Closed Records" value={String(records.filter((r) => r.stage === 'closed').length)} icon={<CheckCircle2 className="h-5 w-5" />} accent="bg-gradient-to-br from-emerald-500 to-green-600 text-white" />
              </div>
              <ExtendedRecordsTable
                records={approvalRecords}
                actionRenderer={(record) => (
                  <ActionButton variant="secondary" icon={<Eye className="h-4 w-4" />} onClick={() => { setSelectedRecord(record); setActiveModalTab('details'); }}>View</ActionButton>
                )}
              />
            </SectionShell>
          )}

          {/* Monitoring Dashboard Tab */}
          {activeTab === 'monitoringDashboard' && (
            <SectionShell title="Monitoring Dashboard" description="Track site visit activity, reports, and outcomes across both process flows.">
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                <InfoCard title="Incoming" value={String(dashboardCards.totalIncoming)} icon={<Inbox className="h-5 w-5" />} accent="bg-gradient-to-br from-amber-500 to-orange-600 text-white" />
                <InfoCard title="Planning" value={String(dashboardCards.totalPlanning)} icon={<CalendarDays className="h-5 w-5" />} accent="bg-gradient-to-br from-blue-500 to-indigo-600 text-white" />
                <InfoCard title="Execution" value={String(dashboardCards.totalExecution)} icon={<MapPinned className="h-5 w-5" />} accent="bg-gradient-to-br from-purple-500 to-violet-600 text-white" />
                <InfoCard title="Reports" value={String(dashboardCards.totalReports)} icon={<FileText className="h-5 w-5" />} accent="bg-gradient-to-br from-sky-500 to-blue-600 text-white" />
                <InfoCard title="Closed" value={String(dashboardCards.totalClosed)} icon={<CheckCircle2 className="h-5 w-5" />} accent="bg-gradient-to-br from-emerald-500 to-green-600 text-white" />
                <InfoCard title="Updated QP" value={String(dashboardCards.sentToQp)} icon={<BarChart3 className="h-5 w-5" />} accent="bg-gradient-to-br from-red-500 to-rose-600 text-white" />
              </div>
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8">
                <h3 className="text-base font-semibold text-gray-900">Monitoring Summary</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">This dashboard tracks Marked & Moderated Scripts and Post EISA Monitoring across intake, planning, execution, reporting, approvals, and outcomes sent back to Quality Partner.</p>
              </div>
            </SectionShell>
          )}
        </div>
      </div>

      {/* ============ DETAIL MODAL ============ */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">

            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b px-6 pt-5 flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-indigo-500" />
                    {selectedRecord.stage === 'site_visit_execution' ? 'Site Visit Execution' : 'EISA Notification'}: {selectedRecord.eisaRegNo || selectedRecord.id}
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500">{selectedRecord.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${selectedRecord.processType === 'marked_moderated_scripts' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>
                    {selectedRecord.processType === 'marked_moderated_scripts' ? 'Marked & Moderated Scripts' : 'Post EISA Monitoring'}
                  </span>
                  <button type="button" onClick={() => setSelectedRecord(null)} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
              {/* Tabs */}
              <div className="flex gap-1 overflow-x-auto pb-px">
                {[
                  { id: 'details', label: 'Application Details', emoji: '📄', show: true },
                  { id: 'schedule', label: 'Validation Schedule', emoji: '📅', show: hasSchedule },
                  { id: 'liaise', label: 'Liaise with QP', emoji: '📞', show: hasLiaiseDetails },
                  { id: 'validation', label: 'Instrument Validation', emoji: '✅', show: hasInstrumentValidation },
                  { id: 'dd_review', label: 'DD Review & Outcome', emoji: '🔍', show: hasOutcome },
                  { id: 'registration', label: 'Registration Docs', emoji: '📋', show: true },
                  { id: 'planning', label: 'Planning & Scheduling', emoji: '🗓️', show: isPlanningStage },
                  { id: 'siteVisitExecution', label: 'Site Visit Execution', emoji: '🏢', show: isExecutionStage || selectedRecord.stage === 'evaluation_reporting' || selectedRecord.stage === 'closed' },
                  { id: 'external_submissions', label: 'QP Submissions', emoji: '📥', show: hasExternalSubmission },
                  { id: 'pem_report', label: 'PEM Report', emoji: '📝', show: hasPemReport },
                ].filter(t => t.show).map((tab) => (
                  <button key={tab.id} type="button" onClick={() => setActiveModalTab(tab.id as ModalTab)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 whitespace-nowrap flex-shrink-0 transition-all ${
                      activeModalTab === tab.id
                        ? 'border-indigo-500 text-indigo-700 bg-indigo-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}>
                    <span>{tab.emoji}</span> {tab.label}
                    {tab.id === 'external_submissions' && hasExternalSubmission && !isPemSubmitted && <span className="ml-1 h-2 w-2 rounded-full bg-amber-400 animate-pulse inline-block" />}
                    {tab.id === 'pem_report' && isPemSubmitted && !isDdRecommended && <span className="ml-1 h-2 w-2 rounded-full bg-purple-500 animate-pulse inline-block" />}
                    {tab.id === 'pem_report' && isDdRecommended && <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500 inline-block" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* Tab: Application Details */}
              {activeModalTab === 'details' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-4 flex items-center gap-3">
                    <Bell className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-sm font-semibold text-indigo-800">EISA Notification Received</p>
                      <p className="text-xs text-indigo-600">This notification was sent from the Quality Partner on {formatDate(selectedRecord.createdAt)}</p>
                    </div>
                  </div>
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
                        <DetailRow icon={CalendarClock} label="Received" value={formatDate(selectedRecord.createdAt)} />
                        <DetailRow icon={Tag} label="Stream" value={
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${selectedRecord.stream === 'trades' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                            {selectedRecord.stream === 'trades' ? <Wrench className="h-3 w-3" /> : <Layers className="h-3 w-3" />}
                            {selectedRecord.stream === 'trades' ? 'Trades' : 'Non-Trades'}
                          </span>
                        } />
                        {selectedRecord.registrationNumber && (
                          <DetailRow icon={CheckCircle2} label="Registration Number" value={<span className="font-mono font-bold text-emerald-700">{selectedRecord.registrationNumber}</span>} />
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
                  {selectedRecord.outcomeReport?.reportFinalised && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">EISA Validation Outcome</p>
                        <div className="mt-1"><OutcomeBadge decision={selectedRecord.outcomeReport.outcomeDecision} /></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Validation Schedule */}
              {activeModalTab === 'schedule' && selectedRecord.eisaSchedule && (
                <div className="space-y-6">
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-blue-600" />
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">EISA Validation Schedule</p>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Validation Date:</span><span className="text-sm text-gray-700">{formatDate(selectedRecord.eisaSchedule.validationDate)}</span></div>
                          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Time:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.startTime || '-'} - {selectedRecord.eisaSchedule.endTime || '-'}</span></div>
                          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Venue:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.venue || '-'}</span></div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Assessor:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.assessorName || '-'}</span></div>
                          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Email:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.assessorEmail || '-'}</span></div>
                          {selectedRecord.eisaSchedule.scheduleDocumentName && (
                            <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-blue-600" /><span className="text-sm font-medium">Schedule Doc:</span><span className="text-sm text-gray-700">{selectedRecord.eisaSchedule.scheduleDocumentName}</span></div>
                          )}
                        </div>
                      </div>
                      {selectedRecord.eisaSchedule.notes && (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">SDP Notes</p>
                          <p className="text-sm text-gray-700">{selectedRecord.eisaSchedule.notes}</p>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 flex items-center gap-1"><Send className="h-3 w-3" /> Submitted by SDP: {formatDate(selectedRecord.eisaSchedule.submittedToInternalAt)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Liaise with QP */}
              {activeModalTab === 'liaise' && selectedRecord.eisaSchedule && (
                <div className="space-y-5">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
                    <Phone className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Quality Partner Liaison Details</p>
                      <p className="text-xs text-emerald-700 mt-0.5">These details were captured during the validation process.</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">QP Contact Details</p></div>
                    <div className="p-4 grid gap-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div><p className="text-xs text-gray-400 uppercase tracking-wide">QP Contact Person</p><p className="text-sm font-medium text-gray-900">{selectedRecord.eisaSchedule.qpContactPerson || '—'}</p></div>
                        <div><p className="text-xs text-gray-400 uppercase tracking-wide">Contact Number</p><p className="text-sm font-medium text-gray-900">{selectedRecord.eisaSchedule.qpContactNumber || '—'}</p></div>
                      </div>
                      <div><p className="text-xs text-gray-400 uppercase tracking-wide">Contact Email</p><p className="text-sm font-medium text-gray-900">{selectedRecord.eisaSchedule.qpContactEmail || '—'}</p></div>
                      <div><p className="text-xs text-gray-400 uppercase tracking-wide">Additional Notes</p><p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-200">{selectedRecord.eisaSchedule.internalNotes || '—'}</p></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Instrument Validation */}
              {activeModalTab === 'validation' && selectedRecord.eisaSchedule?.instrumentValidation && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/50 overflow-hidden">
                    <div className="px-4 py-3 bg-blue-100 border-b border-blue-200"><p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">QA Validation Checklist (Read-only)</p></div>
                  </div>
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-violet-50 border-b"><p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Documents Received</p></div>
                    <div className="p-4 grid grid-cols-2 gap-2">
                      {[
                        { key: 'moderatorReport', label: 'Moderator Report' },
                        { key: 'examinerReport', label: 'Examiner Report' },
                        { key: 'cv', label: 'CV' },
                        { key: 'confidentialityAgreement', label: 'Confidentiality Agreement' },
                        { key: 'eisaInstrumentMemo', label: 'EISA Instrument Memo' },
                        { key: 'eisaInstrumentRubric', label: 'EISA Instrument Rubric' },
                      ].map(({ key, label }) => {
                        const iv = selectedRecord.eisaSchedule!.instrumentValidation!;
                        const checked = iv.documents[key as keyof typeof iv.documents];
                        return (
                          <div key={key} className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium ${checked ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                            <span>{checked ? '✓' : '○'}</span>{label}
                          </div>
                        );
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

              {/* Tab: DD Review & Outcome */}
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

              {/* Tab: Registration Docs */}
              {activeModalTab === 'registration' && (
                <div className="space-y-5">
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted Documents</p></div>
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

              {/* Tab: Planning & Scheduling */}
              {activeModalTab === 'planning' && (
                <div className="space-y-6">
                  {/* Schedule Summary Card */}
                  {selectedRecord.schedulePrepared && (
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <CalendarDays className="h-5 w-5 text-indigo-600" />
                        <p className="text-sm font-bold text-indigo-900">Approved Schedule</p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div><span className="text-xs text-gray-400 uppercase tracking-wide">Title</span><p className="font-medium">{selectedRecord.scheduleTitle || '—'}</p></div>
                        <div><span className="text-xs text-gray-400 uppercase tracking-wide">Date</span><p className="font-medium">{formatDate(selectedRecord.scheduleDate)}</p></div>
                        <div><span className="text-xs text-gray-400 uppercase tracking-wide">Time</span><p className="font-medium">{selectedRecord.scheduleTime || '—'}</p></div>
                        <div><span className="text-xs text-gray-400 uppercase tracking-wide">Venue</span><p className="font-medium">{selectedRecord.scheduleVenue || '—'}</p></div>
                        <div><span className="text-xs text-gray-400 uppercase tracking-wide">Month</span><p className="font-medium">{selectedRecord.monthlyPlanMonth || '—'}</p></div>
                        <div><span className="text-xs text-gray-400 uppercase tracking-wide">Officials</span><p className="font-medium">{selectedRecord.assignedOfficials || '—'}</p></div>
                        {selectedRecord.monthlyPlanSummary && (
                          <div className="md:col-span-2"><span className="text-xs text-gray-400 uppercase tracking-wide">Monthly Plan Summary</span><p className="font-medium mt-0.5 text-gray-700">{selectedRecord.monthlyPlanSummary}</p></div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Edit form if not yet prepared */}
                  {!selectedRecord.schedulePrepared && currentRole === 'Assistant Director' && (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-4 flex items-center gap-3">
                        <CalendarDays className="h-5 w-5 text-indigo-600" />
                        <div>
                          <p className="text-sm font-semibold text-indigo-800">Prepare Site Visit Schedule & Monthly Plan</p>
                          <p className="text-xs text-indigo-600">Fill in the details below to create the site visit schedule and monthly plan.</p>
                        </div>
                      </div>
                      <div className="grid gap-5 md:grid-cols-2">
                        <div><label className="mb-2 block text-sm font-medium text-gray-700">Schedule Title *</label><input type="text" value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="Enter schedule title" /></div>
                        <div><label className="mb-2 block text-sm font-medium text-gray-700">Schedule Date *</label><input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></div>
                        <div><label className="mb-2 block text-sm font-medium text-gray-700">Schedule Time</label><input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></div>
                        <div><label className="mb-2 block text-sm font-medium text-gray-700">Venue / Site</label><input type="text" value={scheduleVenue} onChange={(e) => setScheduleVenue(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="Enter venue" /></div>
                        <div><label className="mb-2 block text-sm font-medium text-gray-700">Monthly Plan Month</label><input type="text" value={monthlyPlanMonth} onChange={(e) => setMonthlyPlanMonth(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="Example: May 2026" /></div>
                        <div><label className="mb-2 block text-sm font-medium text-gray-700">Assigned Officials</label><input type="text" value={assignedOfficials} onChange={(e) => setAssignedOfficials(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="Example: Assistant Director, Deputy Director" /></div>
                        <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-gray-700">Monthly Plan Summary</label><textarea value={monthlyPlanSummary} onChange={(e) => setMonthlyPlanSummary(e.target.value)} rows={5} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="Enter the detailed site visit monthly plan..." /></div>
                      </div>
                      <div className="flex justify-end">
                        <button onClick={() => handleSavePlanForRecord(selectedRecord.id)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 flex items-center gap-2">
                          <Save className="h-4 w-4" /> Save Plan & Submit for Review
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedRecord.schedulePrepared && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div><p className="text-sm font-semibold text-green-800">Plan Submitted for Review</p><p className="text-xs text-green-600">Waiting for approval before execution can begin.</p></div>
                    </div>
                  )}
                </div>
              )}

              {/* ===== Tab: Site Visit Execution ===== */}
              {activeModalTab === 'siteVisitExecution' && (
                <div className="space-y-6">
                  {/* Schedule reference banner */}
                  {selectedRecord.schedulePrepared && (
                    <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDays className="h-4 w-4 text-purple-600" />
                        <p className="text-xs font-bold text-purple-800 uppercase tracking-wide">Approved Schedule Reference</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div><span className="text-xs text-gray-400">Date</span><p className="font-semibold text-gray-800">{formatDate(selectedRecord.scheduleDate)}</p></div>
                        <div><span className="text-xs text-gray-400">Time</span><p className="font-semibold text-gray-800">{selectedRecord.scheduleTime || '—'}</p></div>
                        <div><span className="text-xs text-gray-400">Venue</span><p className="font-semibold text-gray-800">{selectedRecord.scheduleVenue || '—'}</p></div>
                        <div><span className="text-xs text-gray-400">Assigned Officials</span><p className="font-semibold text-gray-800">{selectedRecord.assignedOfficials || '—'}</p></div>
                      </div>
                    </div>
                  )}

                  {/* Monthly Plan Summary */}
                  {selectedRecord.monthlyPlanSummary && (
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4">
                      <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">Monthly Plan Summary</p>
                      <p className="text-sm text-gray-700">{selectedRecord.monthlyPlanSummary}</p>
                    </div>
                  )}

                  {/* ── Step 1: Book Site Visit (Sub Domain Admin) ── */}
                  <StepCard
                    step={1}
                    done={isBooked}
                    label="Book Site Visit"
                    description="Sub Domain Admin books the site visit and records a booking reference."
                  >
                    {!isBooked ? (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-500">
                          As <strong>Sub Domain Admin</strong>, confirm the site visit booking for this record. A booking reference will be generated automatically.
                        </p>
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 flex items-center gap-2">
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                          This action is available to the <strong>Sub Domain Admin</strong> role only.
                        </div>
                        <button
                          type="button"
                          onClick={() => handleBookSiteVisit(selectedRecord.id)}
                          disabled={currentRole !== 'Sub Domain Admin'}
                          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Calendar className="h-4 w-4" /> Book Site Visit
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Site Visit Booked</p>
                          <p className="text-sm font-bold text-emerald-800 font-mono">{selectedRecord.bookingReference}</p>
                          {selectedRecord.siteVisitBookedAt && <p className="text-xs text-emerald-600 mt-0.5">Booked on {formatDateTime(selectedRecord.siteVisitBookedAt)}</p>}
                        </div>
                      </div>
                    )}
                  </StepCard>

                  {/* ── Step 2: Conduct Site Visit & Compile QA Evaluation Report (Deputy & Assistant Director) ── */}
                  <StepCard
                    step={2}
                    done={isReportFinalised}
                    label="Conduct Site Visit & Compile QA Evaluation Report"
                    description="Deputy Director & Assistant Director conduct the visit and complete the QA Evaluation Report."
                  >
                    {!isBooked && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-700">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> Complete Step 1 (Book Site Visit) before proceeding.
                      </div>
                    )}
                    {isBooked && (
                      <div className="space-y-4">
                        {!isReportFinalised && (
                          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 flex items-center gap-2">
                            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                            Available to <strong>Deputy & Assistant Director</strong>. Fill in the QA Evaluation Report below, then finalise it.
                          </div>
                        )}
                        {/* QA Report Form */}
                        {liveReport && (
                          <QAEvaluationReportForm
                            report={liveReport}
                            onChange={setLiveReport}
                            onSave={() => handleSaveQAReport(selectedRecord.id)}
                            onFinalise={() => handleFinaliseQAReport(selectedRecord.id)}
                            readonly={isReportFinalised || (currentRole !== 'Deputy & Assistant Director' && currentRole !== 'Deputy Director' && currentRole !== 'Assistant Director')}
                          />
                        )}
                      </div>
                    )}
                  </StepCard>

                  {/* ── Step 3: Send Results to Quality Partner ── */}
                  <StepCard
                    step={3}
                    done={isSentToQp}
                    label="Send Results to Quality Partner"
                    description="Once the evaluation report is finalised, send the results to the external Quality Partner."
                  >
                    {!isReportFinalised && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-700">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> Complete Step 2 (Finalise QA Evaluation Report) before sending results.
                      </div>
                    )}
                    {isReportFinalised && !isSentToQp && (
                      <div className="space-y-3">
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                          QA Evaluation Report is finalised and ready to send to the Quality Partner (external side).
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSendResultsToQp(selectedRecord.id)}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
                        >
                          <ExternalLink className="h-4 w-4" /> Send Results to Quality Partner
                        </button>
                      </div>
                    )}
                    {isSentToQp && (
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-800">Results Sent to Quality Partner</p>
                          {selectedRecord.sentToQpAt && <p className="text-xs text-emerald-600 mt-0.5">Sent on {formatDateTime(selectedRecord.sentToQpAt)} {selectedRecord.sentToQpBy ? `by ${selectedRecord.sentToQpBy}` : ''}</p>}
                        </div>
                      </div>
                    )}
                  </StepCard>

                  {/* All done banner */}
                  {isSentToQp && (
                    <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <ThumbsUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-emerald-800">Site Visit Execution Complete</p>
                        <p className="text-xs text-emerald-600 mt-0.5">The site visit was conducted, the evaluation report was compiled, and results have been sent to the Quality Partner.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab: QP External Submissions (read-only viewer) ── */}
              {activeModalTab === 'external_submissions' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                      <Upload className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-amber-800">External Submission from Quality Partner</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Submitted by {selectedRecord.approvedResultsSubmission?.submittedBy || 'Quality Partner'} on {formatDate(selectedRecord.approvedResultsSubmittedAt)} · Read-only view
                      </p>
                    </div>
                  </div>

                  {/* Application details summary */}
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Application Summary</p>
                    </div>
                    <div className="p-5 grid md:grid-cols-3 gap-4 text-sm">
                      <div><p className="text-xs text-gray-400 uppercase">ID</p><p className="font-semibold font-mono">{selectedRecord.eisaRegNo || selectedRecord.id}</p></div>
                      <div><p className="text-xs text-gray-400 uppercase">Site / SDP</p><p className="font-medium">{selectedRecord.siteName}</p></div>
                      <div><p className="text-xs text-gray-400 uppercase">EISA Date</p><p className="font-medium">{formatDate(selectedRecord.visitDate)}</p></div>
                      <div className="md:col-span-3"><p className="text-xs text-gray-400 uppercase">Qualification</p><p className="font-medium">{selectedRecord.title}</p></div>
                    </div>
                  </div>

                  {/* Switcher between the two questionnaires */}
                  {selectedRecord.approvedResultsSubmission && (() => {
                    const sub = selectedRecord.approvedResultsSubmission!;
                    return (
                      <ExternalSubmissionViewer facilitator={sub.facilitator} learner={sub.learner} />
                    );
                  })()}

                  {/* Prompt AD to go compile PEM */}
                  {!isPemSubmitted && currentRole === 'Assistant Director' && (
                    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <FileCheck className="h-5 w-5 text-violet-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-violet-800">Next Step: Compile PEM Report</p>
                          <p className="text-xs text-violet-600 mt-0.5">Review the QP submission above, then compile the Post EISA Performance Report in the PEM Report tab.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveModalTab('pem_report')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 px-3 py-2 text-xs font-semibold text-white transition flex-shrink-0"
                      >
                        Go to PEM Report →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab: PEM Report ── */}
              {activeModalTab === 'pem_report' && livePemReport && (
  <PEMReportTab
    record={selectedRecord}
    pemReport={livePemReport}
    onChange={setLivePemReport}
    onSave={() => handleSavePemReport(selectedRecord.id)}
    onSubmitToDd={() => handleSubmitPemToDd(selectedRecord.id)}
    onDdRecommend={(rec) => handleDdRecommendPem(selectedRecord.id, rec)}
    onSendToApprovals={() => handleMoveToApprovalsOutcomes(selectedRecord.id)}
    currentRole={currentRole}
    isPemSubmitted={isPemSubmitted}
    isDdRecommended={isDdRecommended}
  />
)}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
              <div className="text-xs text-gray-500">Received: {formatDate(selectedRecord.createdAt)}</div>
              <div className="flex gap-3">
                <button onClick={() => setSelectedRecord(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
                {selectedRecord.stage === 'incoming_request' && (
                  <button onClick={() => moveToPlanningScheduling(selectedRecord.id)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Move to Planning & Scheduling
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Planning Schedule Modal */}
      {planModalRecord && (
        <PlanningScheduleModal
          record={planModalRecord}
          scheduleTitle={scheduleTitle}
          setScheduleTitle={setScheduleTitle}
          scheduleDate={scheduleDate}
          setScheduleDate={setScheduleDate}
          scheduleTime={scheduleTime}
          setScheduleTime={setScheduleTime}
          scheduleVenue={scheduleVenue}
          setScheduleVenue={setScheduleVenue}
          monthlyPlanMonth={monthlyPlanMonth}
          setMonthlyPlanMonth={setMonthlyPlanMonth}
          monthlyPlanSummary={monthlyPlanSummary}
          setMonthlyPlanSummary={setMonthlyPlanSummary}
          assignedOfficials={assignedOfficials}
          setAssignedOfficials={setAssignedOfficials}
          onSave={handleSavePlan}
          onClose={closePlanModal}
        />
      )}
    </div>
  );
}

// ============ TABLE COMPONENTS ============

function ExtendedRecordsTable({
  records,
  actionRenderer,
}: {
  records: ExtendedSiteMonitoringRecord[];
  actionRenderer: (record: ExtendedSiteMonitoringRecord) => React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white">
            <tr className="border-b border-gray-200">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">EISA Reg No</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Qualification</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Site / SDP</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">EISA Date</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Registration No</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Stage</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-500">No records available.</td></tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70">
                  <td className="px-5 py-4 align-top font-mono text-sm font-semibold text-gray-900">{record.eisaRegNo || record.id}</td>
                  <td className="px-5 py-4 align-top">
                    <div className="text-sm text-gray-700 truncate max-w-[200px]" title={record.title}>{record.title}</div>
                    {record.saqaId && <div className="text-xs text-gray-400 font-mono mt-0.5">SAQA: {record.saqaId}</div>}
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-gray-700">{record.siteName}</td>
                  <td className="px-5 py-4 align-top text-sm text-gray-700">{record.visitDate}</td>
                  <td className="px-5 py-4 align-top font-mono text-sm">{record.registrationNumber || '—'}</td>
                  <td className="px-5 py-4 align-top"><StageBadge stage={record.stage} subStage={record.subStage} /></td>
                  <td className="px-5 py-4 align-top">
                    <StatusBadge
                      status={record.stage === 'closed' ? 'approved' : record.deputyDirectorStatus === 'in_progress' || record.domainDirectorStatus === 'in_progress' || record.directorStatus === 'in_progress' ? 'in_progress' : 'pending'}
                      approvedLabel="Completed"
                      pendingLabel="Pending"
                    />
                  </td>
                  <td className="px-5 py-4 align-top"><div className="flex flex-wrap items-center gap-2">{actionRenderer(record)}</div></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanningRecordsTable({
  records,
  currentRole,
  onEditPlan,
  onRecommendToDomainDirector,
  onApprovePlan,
  onRecommendToDirector,
  onApprovePlanDirector,
  onViewDetails,
}: {
  records: ExtendedSiteMonitoringRecord[];
  currentRole: string;
  onEditPlan: (record: ExtendedSiteMonitoringRecord) => void;
  onRecommendToDomainDirector: (recordId: string) => void;
  onApprovePlan: (recordId: string) => void;
  onRecommendToDirector: (recordId: string) => void;
  onApprovePlanDirector: (recordId: string) => void;
  onViewDetails: (record: ExtendedSiteMonitoringRecord) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white">
            <tr className="border-b border-gray-200">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">EISA Reg No</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Qualification</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Site</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">EISA Date</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Schedule Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Review Stage</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500">No records in Planning & Scheduling.</td></tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70">
                  <td className="px-5 py-4 align-top font-mono text-sm font-semibold text-gray-900">{record.eisaRegNo || record.id}</td>
                  <td className="px-5 py-4 align-top">
                    <div className="text-sm text-gray-700 truncate max-w-[200px]" title={record.title}>{record.title}</div>
                    {record.saqaId && <div className="text-xs text-gray-400 font-mono mt-0.5">SAQA: {record.saqaId}</div>}
                  </td>
                  <td className="px-5 py-4 align-top text-sm text-gray-700">{record.siteName}</td>
                  <td className="px-5 py-4 align-top text-sm text-gray-700">{record.visitDate}</td>
                  <td className="px-5 py-4 align-top">
                    {record.schedulePrepared && record.monthlyPlanPrepared
                      ? <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">Ready for Review</span>
                      : <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">Pending Preparation</span>
                    }
                  </td>
                  <td className="px-5 py-4 align-top"><StageBadge stage={record.stage} subStage={record.subStage} /></td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap items-center gap-2">
                      <ActionButton variant="secondary" icon={<Eye className="h-4 w-4" />} onClick={() => onViewDetails(record)}>View</ActionButton>
                      {!record.schedulePrepared && !record.monthlyPlanPrepared && currentRole === 'Assistant Director' && (
                        <ActionButton icon={<PencilLine className="h-4 w-4" />} onClick={() => onEditPlan(record)}>Prepare Plan</ActionButton>
                      )}
                      {(record.schedulePrepared && record.monthlyPlanPrepared) && (
                        <>
                          {currentRole === 'Deputy Director' && record.processType === 'marked_moderated_scripts' && record.subStage === 'deputy_director_review' && (
                            <ActionButton icon={<ClipboardCheck className="h-4 w-4" />} onClick={() => onRecommendToDomainDirector(record.id)}>Recommend to Domain Director</ActionButton>
                          )}
                          {currentRole === 'Domain Director' && record.processType === 'marked_moderated_scripts' && record.subStage === 'domain_director_approval' && (
                            <ActionButton icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => onApprovePlan(record.id)}>Approve Plan</ActionButton>
                          )}
                          {currentRole === 'Deputy Director' && record.processType === 'post_eisa_monitoring' && record.subStage === 'deputy_director_review' && (
                            <ActionButton icon={<ClipboardCheck className="h-4 w-4" />} onClick={() => onRecommendToDirector(record.id)}>Recommend to Director</ActionButton>
                          )}
                          {currentRole === 'Director' && record.processType === 'post_eisa_monitoring' && record.subStage === 'director_review' && (
                            <ActionButton icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => onApprovePlanDirector(record.id)}>Approve Plan</ActionButton>
                          )}
                        </>
                      )}
                    </div>
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

function PlanningScheduleModal({
  record,
  scheduleTitle,
  setScheduleTitle,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  scheduleVenue,
  setScheduleVenue,
  monthlyPlanMonth,
  setMonthlyPlanMonth,
  monthlyPlanSummary,
  setMonthlyPlanSummary,
  assignedOfficials,
  setAssignedOfficials,
  onSave,
  onClose,
}: {
  record: ExtendedSiteMonitoringRecord;
  scheduleTitle: string;
  setScheduleTitle: (v: string) => void;
  scheduleDate: string;
  setScheduleDate: (v: string) => void;
  scheduleTime: string;
  setScheduleTime: (v: string) => void;
  scheduleVenue: string;
  setScheduleVenue: (v: string) => void;
  monthlyPlanMonth: string;
  setMonthlyPlanMonth: (v: string) => void;
  monthlyPlanSummary: string;
  setMonthlyPlanSummary: (v: string) => void;
  assignedOfficials: string;
  setAssignedOfficials: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Create Site Visit Schedule & Monthly Plan</h3>
            <p className="mt-1 text-sm text-gray-600">{record.title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
        </div>
        <div className="grid gap-5 p-6 md:grid-cols-2 overflow-y-auto">
          <div><label className="mb-2 block text-sm font-medium text-gray-700">Schedule Title</label><input type="text" value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="Enter schedule title" /></div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700">Schedule Date</label><input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700">Schedule Time</label><input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700">Venue / Site</label><input type="text" value={scheduleVenue} onChange={(e) => setScheduleVenue(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="Enter venue" /></div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700">Monthly Plan Month</label><input type="text" value={monthlyPlanMonth} onChange={(e) => setMonthlyPlanMonth(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="Example: May 2026" /></div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700">Assigned Officials</label><input type="text" value={assignedOfficials} onChange={(e) => setAssignedOfficials(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="Example: Assistant Director, Deputy Director" /></div>
          <div className="md:col-span-2"><label className="mb-2 block text-sm font-medium text-gray-700">Monthly Plan Summary</label><textarea value={monthlyPlanSummary} onChange={(e) => setMonthlyPlanSummary(e.target.value)} rows={5} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-400" placeholder="Enter the detailed site visit monthly plan..." /></div>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={onSave} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 flex items-center gap-2">
            <Save className="h-4 w-4" /> Save Plan & Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
}