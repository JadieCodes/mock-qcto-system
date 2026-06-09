// src/pages/assessment/Internal/InternalFisaPage.tsx

import React, { useMemo, useState, useEffect } from 'react';
import type { AppRole } from '@/types';
import { useApp } from '@/contexts/AppContext';
import {
  BookOpen, ShieldCheck, FileText, CheckCircle2, Clock3, Database, Eye,
  Send, ClipboardCheck, FileCheck2, BadgeCheck, Users, X, User, Hash,
  Award, Calendar, Sparkles, FilePenLine, AlertCircle, Upload, Plus,
  Trash2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { WorkflowBridgeService } from '@/services/WorkflowBridgeService';
import type { QasaToFisaStandardsRecord } from '@/services/WorkflowBridgeService';

// ── Types ─────────────────────────────────────────────────────────────────────
type FisaTab = 'standards' | 'validation';
type StandardsModalTab = 'details' | 'evaluation' | 'checklist' | 'qasa_checklist' | 'qasa_report';

type StandardsStage =
  | 'deputy_director_allocation'
  | 'asd_evaluation'
  | 'director_team_moderation'
  | 'aic_moderation'
  | 'qualifications_development_approval'
  | 'deputy_director_final'
  | 'completed';

type ValidationStage =
  | 'sdp_notification'
  | 'assistant_director_allocation'
  | 'asd_validation'
  | 'deputy_director_review'
  | 'completed';

type ReviewStatus = 'pending' | 'in_progress' | 'approved';

// ── Evaluation Report structure (digital form filled by ASD) ─────────────────
interface EloItem { id: string; code: string; description: string; aligned: boolean | null; comments: string; }
interface AacItem { id: string; code: string; description: string; measurable: boolean | null; alignedToElo: boolean | null; comments: string; }

interface FisaEvaluationReport {
  evaluatorName: string;
  evaluationDate: string;
  reportReference: string;
  // SP Purpose
  purposeAccurate: boolean | null;
  purposeComments: string;
  // ELO
  eloItems: EloItem[];
  eloOverallConclusion: string;
  // AAC
  aacItems: AacItem[];
  aacOverallConclusion: string;
  // Overall
  overallFindings: string;
  recommendation: 'recommended' | 'recommended_with_amendments' | 'not_recommended' | '';
  recommendationComments: string;
  // Uploaded supplementary file name (optional)
  supplementaryFileName?: string;
}

// ── QASA payload types (carried over for read-only display) ──────────────────
interface QasaChecklistItem { id: string; text: string; yes: boolean | null; no: boolean | null; comments: string; }
interface QasaChecklistSection { sectionId: string; title: string; items: QasaChecklistItem[]; }
interface QasaChecklist {
  dateOfReceipt: string; dateEvaluated: string; evaluatedBy: string;
  remedialActionsRequired: 'yes' | 'no' | ''; dateFeedbackProvided: string;
  sections: QasaChecklistSection[];
  recommendationJobRelated: boolean | null; recommendationJobRelatedNo: boolean | null; recommendationJobRelatedComments: string;
  recommendationApproved: boolean | null; recommendationApprovedNo: boolean | null; recommendationApprovedComments: string;
}
interface QasaEvaluationReport {
  aqpName: string; contactName: string; contactEmail: string; physicalAddress: string;
  dateReceived: string; dateEvaluated: string; evaluatorsName: string;
  qualificationTitle: string; saqaId: string; dateRegistered: string; nqfLevel: string; credits: string;
  registrationStartDate: string; registrationEndDate: string;
  correctQualTitle: string; correctNqfLevel: string; nqfLevelEisa: string; correctCredits: string;
  numberOfComponents: string;
  component1Name: string; component1Marks: string; component1Pass: string;
  component2Name: string; component2Marks: string; component2Pass: string;
  component3Name: string; component3Marks: string; component3Pass: string;
  calculationFinalAchievement: string; finalAchievement: string;
  duration: string; format: string; layout: string; openOrClosed: string;
  assessmentPoints: string; supplementaryAssessments: string; percentageModerated: string;
  markingDays: string; moderationDays: string;
  sectionC: Record<string, { yes: boolean; no: boolean; comments: string }>;
  sectionD: Record<string, { yes: boolean; no: boolean }>;
  evaluationFindings: string; recommendation: string;
  meetsMinRequirements: 'yes' | 'no' | '';
  firstEvaluatorName: string; firstEvaluatorOutcome: 'approved'|'amendments'|'not_recommended'|'';
  secondEvaluatorName: string; secondEvaluatorOutcome: 'approved'|'amendments'|'not_recommended'|'';
  finalRecommendation: 'approved'|'amendments'|'not_recommended'|'';
  acApproval: 'yes'|'no'|''; acDate: string;
}

// ── Checklist items for reviewer roles ───────────────────────────────────────
const DIRECTOR_TEAM_CHECKLIST = [
  'ELO descriptions are clear and measurable',
  'ELOs are appropriately sequenced',
  'ELOs align with the SP purpose',
  'AAC criteria are observable and assessable',
  'AAC items link correctly to their ELOs',
  'Purpose of the SP is accurately stated',
  'Curriculum document is complete and coherent',
  'Evaluation report follows the required format',
];

const AIC_CHECKLIST = [
  'ELO alignment to occupational tasks is confirmed',
  'AAC quality and completeness verified',
  'SP purpose is appropriate for occupational context',
  'Assessment approach is valid and appropriate',
  'No material gaps or inconsistencies identified',
  'Evaluation report conclusions are substantiated',
  'Instrument is fit for purpose',
];

const QUAL_DEV_CHECKLIST = [
  'Qualification development standards are met',
  'Qualification is correctly classified',
  'NQF level and credits are appropriate',
  'SP document meets QCTO requirements',
  'Curriculum document is ready for registration',
  'All required sections are complete',
  'No conflicts with existing registered qualifications',
];

// ── FisaStandardsRecord ───────────────────────────────────────────────────────
interface FisaStandardsRecord {
  id: string;
  spCode: string;
  spTitle: string;
  curriculumCode: string;
  curriculumTitle: string;
  purpose: string;
  eloFocus: string;
  aacFocus: string;
  sourceFrom: string;
  allocatedAsd?: string;
  currentStage: StandardsStage;
  // Moderation statuses
  directorTeamStatus: ReviewStatus;
  aicStatus: ReviewStatus;
  qualDevStatus: ReviewStatus;
  databaseUpdated: boolean;
  createdAt: string;
  // Extra QASA-routed fields
  nqfLevel?: string;
  credits?: string;
  nameOfAQP?: string;
  saqaId?: string;
  isFromQasa?: boolean;
  qasaPayload?: Record<string, unknown>;
  // ASD evaluation report (filled digitally in the modal)
  evaluationReport?: FisaEvaluationReport | null;
  evaluationSubmittedAt?: string;
  // Role review records
  directorTeamChecklist?: Record<string, boolean>;
  directorTeamNotes?: string;
  aicChecklist?: Record<string, boolean>;
  aicNotes?: string;
  qualDevChecklist?: Record<string, boolean>;
  qualDevNotes?: string;
}

interface EisaChecklistSection {
  title: string;
  items: { id: string; text: string; yes: boolean | null; no: boolean | null }[];
  findingsBeforeEisa: string;
  recommendationsForward: string;
}

interface EisaValidationReport {
  // QA Checklist header
  nameOfQp: string;
  addressOfQp: string;
  contactNumber: string;
  contactPerson: string;
  dateOfEisa: string;
  dateInstrumentViewed: string;
  titleOfQualification: string;
  qualificationRegStatus: string;
  saqaId: string;
  credits: string;
  nqfLevel: string;
  // QA Checklist completed by
  completedByFullName: string;
  completedByDesignation: string;
  completedByDate: string;
  dateOfPreviousValidation: string;
  previousRecommendations: string;
  // Sections
  qasAddendum: EisaChecklistSection;
  examinerDeveloper: EisaChecklistSection;
  moderator: EisaChecklistSection;
  overallEvaluation: EisaChecklistSection;
  // Overall outcome
  overallRecommendation: 'approved' | 'approved_with_conditions' | 'not_approved' | '';
  overallFindings: string;
}

interface FisaValidationRecord {
  id: string;
  fisaCode: string;
  fisaTitle: string;
  instrumentName: string;
  validationDate: string;
  sourceFrom: string;
  allocatedAsd?: string;
  currentStage: ValidationStage;
  examinerReport: boolean;
  cvReceived: boolean;
  confidentialityAgreement: boolean;
  writtenInstrumentAndMemo: boolean;
  practicalInstrumentAndRubric: boolean;
  eisaValidationReportGenerated: boolean;
  deputyDirectorReviewStatus: ReviewStatus;
  createdAt: string;
  // Full SDP notification payload carried for AD detail view
  sdpPayload?: Record<string, any> | null;
  // AD liaison fields
  adLiaisonNotes?: string;
  adContactedSdpDate?: string;
  adConfirmedDate?: string;
  // ASD EISA validation report (digital)
  eisaReport?: EisaValidationReport | null;
  eisaReportSubmittedAt?: string;
  // DD review fields
  ddReviewNotes?: string;
  ddRecommendation?: 'approved' | 'approved_with_conditions' | 'not_approved' | '';
  ddReviewedAt?: string;
}

const ASD_USERS = [
  'ASD 1 - Curriculum Standards',
  'ASD 2 - Learning Standards',
  'ASD 3 - Occupational Standards',
];

// ── Pipeline config ───────────────────────────────────────────────────────────
const STANDARDS_PIPELINE: { key: StandardsStage; label: string; icon: string; role: string }[] = [
  { key: 'deputy_director_allocation',          label: 'DD Allocates',    icon: '👔', role: 'Deputy Director' },
  { key: 'asd_evaluation',                      label: 'ASD Evaluates',   icon: '🔍', role: 'ASD' },
  { key: 'director_team_moderation',            label: 'Director & Team', icon: '👥', role: 'Director & Team' },
  { key: 'aic_moderation',                      label: 'AIC Validates',   icon: '📋', role: 'AIC' },
  { key: 'qualifications_development_approval', label: 'Qual. Dev.',      icon: '🏆', role: 'Qualifications Development' },
  { key: 'deputy_director_final',               label: 'DD Final',        icon: '✅', role: 'Deputy Director' },
  { key: 'completed',                           label: 'Completed',       icon: '🎉', role: '' },
];

// ── Initial seed records ──────────────────────────────────────────────────────
const INITIAL_RECORDS: FisaStandardsRecord[] = [
  {
    id: 'FISA-SP-001', spCode: 'SP-001', spTitle: 'National Certificate: Software Support',
    curriculumCode: 'CURR-001', curriculumTitle: 'Software Support Curriculum',
    purpose: 'Prepare learners to perform software support, troubleshooting, user assistance, and maintenance activities.',
    eloFocus: 'Evaluate exit level outcomes alignment, coherence, sequencing, and occupational relevance.',
    aacFocus: 'Review associated assessment criteria for completeness, quality, and alignment to outcomes.',
    sourceFrom: 'QA Domain', currentStage: 'deputy_director_allocation',
    directorTeamStatus: 'pending', aicStatus: 'pending', qualDevStatus: 'pending',
    databaseUpdated: false, createdAt: '2026-04-22',
  },
  {
    id: 'FISA-SP-002', spCode: 'SP-002', spTitle: 'Further Education and Training Certificate: Project Administration',
    curriculumCode: 'CURR-002', curriculumTitle: 'Project Administration Curriculum',
    purpose: 'Develop occupational competence in project administration support and coordination functions.',
    eloFocus: 'Check the ELO structure, correctness, progression, and occupational applicability.',
    aacFocus: 'Check the AAC for measurable assessment expectations and alignment to the ELOs.',
    sourceFrom: 'QA Domain', allocatedAsd: 'ASD 2 - Learning Standards',
    currentStage: 'asd_evaluation',
    directorTeamStatus: 'pending', aicStatus: 'pending', qualDevStatus: 'pending',
    databaseUpdated: false, createdAt: '2026-04-21',
  },
  {
    id: 'FISA-SP-003', spCode: 'SP-003', spTitle: 'Occupational Certificate: Network Technician',
    curriculumCode: 'CURR-003', curriculumTitle: 'Network Technician Curriculum',
    purpose: 'Equip learners with skills to install, maintain, monitor, and support network infrastructure.',
    eloFocus: 'Verify ELO alignment to occupational tasks, industry needs, and progression.',
    aacFocus: 'Verify that AACs are observable, assessable, and support valid judgement.',
    sourceFrom: 'QA Domain', allocatedAsd: 'ASD 3 - Occupational Standards',
    currentStage: 'aic_moderation',
    directorTeamStatus: 'approved', aicStatus: 'in_progress', qualDevStatus: 'pending',
    databaseUpdated: false, createdAt: '2026-04-20',
  },
  {
    id: 'FISA-SP-004', spCode: 'SP-004', spTitle: 'Higher Certificate: Data Capturing',
    curriculumCode: 'CURR-004', curriculumTitle: 'Data Capturing Curriculum',
    purpose: 'Provide learners with competence in data capturing, validation, quality checks, and reporting support.',
    eloFocus: 'Confirm ELO relevance, sequencing, competency intent, and curriculum fit.',
    aacFocus: 'Confirm AAC quality, clarity, completeness, and fit to the intended outcomes.',
    sourceFrom: 'QA Domain', allocatedAsd: 'ASD 1 - Curriculum Standards',
    currentStage: 'completed',
    directorTeamStatus: 'approved', aicStatus: 'approved', qualDevStatus: 'approved',
    databaseUpdated: true, createdAt: '2026-04-18',
  },
];

// ── Helper functions ──────────────────────────────────────────────────────────
function getStageLabel(stage: StandardsStage): string {
  return STANDARDS_PIPELINE.find(s => s.key === stage)?.label ?? stage;
}

function getValidationStageLabel(stage: ValidationStage): string {
  const m: Record<ValidationStage, string> = {
    sdp_notification: 'SDP Notification', assistant_director_allocation: 'AD Allocation',
    asd_validation: 'ASD Validation', deputy_director_review: 'DD Review', completed: 'Completed',
  };
  return m[stage];
}

function convertQasaRecord(r: QasaToFisaStandardsRecord): FisaStandardsRecord {
  return {
    id: r.id, spCode: r.spCode, spTitle: r.spTitle,
    curriculumCode: r.curriculumCode, curriculumTitle: r.curriculumTitle,
    purpose: r.purpose, eloFocus: r.eloFocus, aacFocus: r.aacFocus,
    sourceFrom: 'QASA Approval', allocatedAsd: r.allocatedAsd,
    currentStage: (r.currentStage as StandardsStage) || 'deputy_director_allocation',
    directorTeamStatus: 'pending', aicStatus: 'pending', qualDevStatus: 'pending',
    databaseUpdated: false, createdAt: r.createdAt,
    nqfLevel: r.nqfLevel, credits: r.credits,
    nameOfAQP: r.nameOfAQP, saqaId: r.saqaId,
    isFromQasa: true, qasaPayload: r.qasaPayload,
  };
}

function isVisibleForRole(record: FisaStandardsRecord, role: AppRole): boolean {
  // Once 'completed' and databaseUpdated=true, the record has been sent to external/SDP.
  // It no longer belongs in the Standards pipeline view for any role.
  if (record.currentStage === 'completed' && record.databaseUpdated) return false;

  switch (role) {
    case 'Deputy Director':
      return ['deputy_director_allocation', 'deputy_director_final', 'completed'].includes(record.currentStage);
    case 'ASD': return record.currentStage === 'asd_evaluation';
    case 'Director & Team': return record.currentStage === 'director_team_moderation';
    case 'AIC': return record.currentStage === 'aic_moderation';
    case 'Qualifications Development': return record.currentStage === 'qualifications_development_approval';
    default: return false;
  }
}

function isValidationVisibleForRole(record: FisaValidationRecord, role: AppRole): boolean {
  switch (role) {
    case 'SDP': 
      return record.currentStage === 'sdp_notification';
    case 'Assistant Director': 
      return ['assistant_director_allocation', 'asd_validation', 'deputy_director_review', 'completed'].includes(record.currentStage);
    case 'ASD': 
      return record.currentStage === 'asd_validation';
    case 'Deputy Director': 
      // Deputy Director should see records in deputy_director_review stage AND completed
      return ['deputy_director_review', 'completed'].includes(record.currentStage);
    default: 
      return false;
  }
}

function makeEmptyReport(): FisaEvaluationReport {
  return {
    evaluatorName: '', evaluationDate: '', reportReference: '',
    purposeAccurate: null, purposeComments: '',
    eloItems: [{ id: '1', code: 'ELO 1', description: '', aligned: null, comments: '' }],
    eloOverallConclusion: '',
    aacItems: [{ id: '1', code: 'AAC 1', description: '', measurable: null, alignedToElo: null, comments: '' }],
    aacOverallConclusion: '',
    overallFindings: '', recommendation: '', recommendationComments: '',
  };
}

function makeEmptyEisaChecklistSection(items: { id: string; text: string }[]): EisaChecklistSection {
  return {
    title: '',
    items: items.map(i => ({ ...i, yes: null, no: null })),
    findingsBeforeEisa: '',
    recommendationsForward: '',
  };
}

function makeEmptyEisaReport(record: FisaValidationRecord): EisaValidationReport {
  const sdp = record.sdpPayload as Record<string, any> | null | undefined;
  return {
    nameOfQp: sdp?.nameOfAQP || '',
    addressOfQp: '',
    contactNumber: '',
    contactPerson: '',
    dateOfEisa: record.validationDate || '',
    dateInstrumentViewed: '',
    titleOfQualification: sdp?.spTitle || record.fisaTitle,
    qualificationRegStatus: '',
    saqaId: sdp?.saqaId || '',
    credits: sdp?.credits || '',
    nqfLevel: sdp?.nqfLevel || '',
    completedByFullName: '',
    completedByDesignation: '',
    completedByDate: '',
    dateOfPreviousValidation: '',
    previousRecommendations: '',
    qasAddendum: makeEmptyEisaChecklistSection([
      { id: 'qa1', text: 'Has the QAS Addendum been developed and approved?' },
      { id: 'qa2', text: 'Is the QAS Addendum correctly filed on the Assessment SharePoint?' },
      { id: 'qa3', text: 'Is the Component Details correctly captured on the EISA Component Control Register?' },
      { id: 'qa4', text: 'Is the QAS Addendum on the current template?' },
      { id: 'qa5', text: 'Do the Component details (Total Marks and Pass/Competency Requirements) match the instrument being validated?' },
      { id: 'qa6', text: 'Was a template for FILE 3 as well as an example of FILE 3 provided to the QP?' },
      { id: 'qa7', text: 'Was an EISA Final Percentage Calculator (where applicable) developed and provided to the QP?' },
    ]),
    examinerDeveloper: makeEmptyEisaChecklistSection([
      { id: 'ed1', text: 'Has the criteria for the Examiner/Developer been specified?' },
      { id: 'ed2', text: 'Does Examiner/Developer meet the specified Criteria according to his/her CV?' },
      { id: 'ed3', text: 'Has the Examiner/Developer completed their report on this instrument?' },
      { id: 'ed4', text: 'Has the Examiner/Developer\'s report been completed on the QCTO prescribed template?' },
      { id: 'ed5', text: 'Examiner/Assessor Report has been checked to ensure standards related to compliance to QAS addendum, content coverage, marking memorandum and technical aspects?' },
      { id: 'ed6', text: 'Was the Examiner/Developer requested to do any remediations as per Moderator findings?' },
    ]),
    moderator: makeEmptyEisaChecklistSection([
      { id: 'mo1', text: 'Has the criteria for the Moderator been specified?' },
      { id: 'mo2', text: 'Does Moderator meet the specified Criteria according to his/her CV?' },
      { id: 'mo3', text: 'Has the Moderator completed their report on this instrument?' },
      { id: 'mo4', text: 'Has the Moderators report been completed on the QCTO prescribed template?' },
      { id: 'mo5', text: 'Did the moderator request remediation from the Examiner/Developer?' },
      { id: 'mo6', text: 'Has the moderator made any changes to the instrument?' },
      { id: 'mo7', text: 'Were changes, if any, communicated to the Examiner/Developer?' },
      { id: 'mo8', text: 'Moderator Report has been checked to ensure standards related to compliance to QAS addendum, content coverage, marking memorandum and technical aspects?' },
    ]),
    overallEvaluation: makeEmptyEisaChecklistSection([
      { id: 'oe1', text: 'Has the EISA assessment instrument been approved by the Moderator?' },
      { id: 'oe2', text: 'The assessment instrument and the marking memo/guideline are clearly separated documents?' },
      { id: 'oe3', text: 'The memorandum/guideline corresponds to the assessment instrument with regards to question numbers and mark allocation?' },
      { id: 'oe4', text: 'All details on the front page correct (Logo, Date, Duration, Total Marks, Pass Mark, Instructions to candidates for the assessment are clear)?' },
      { id: 'oe5', text: 'EISA rules have been clearly stipulated on the instrument' },
      { id: 'oe6', text: 'Assessment instructions have been included?' },
      { id: 'oe7', text: 'Instructions in questions are clear (candidates will know what is expected of them)?' },
      { id: 'oe8', text: 'Grammar has been checked?' },
      { id: 'oe9', text: 'Spelling has been checked?' },
      { id: 'oe10', text: 'Question numbers and marks allocated per question are as indicated in the QAS Addendum (Blueprint)?' },
      { id: 'oe11', text: 'The language used is pitched at a suitable level?' },
      { id: 'oe12', text: 'Does the instrument inspire confidence by starting with lower cognitive questions first and thereafter increasing the cognitive levels?' },
    ]),
    overallRecommendation: '',
    overallFindings: '',
  };
}

// ── Shared small UI components ────────────────────────────────────────────────
function StagePill({ stage }: { stage: StandardsStage }) {
  const cfg: Record<StandardsStage, { bg: string; text: string; dot: string }> = {
    deputy_director_allocation:          { bg: 'bg-amber-50 border-amber-200',    text: 'text-amber-700',   dot: 'bg-amber-400'   },
    asd_evaluation:                      { bg: 'bg-blue-50 border-blue-200',      text: 'text-blue-700',    dot: 'bg-blue-400'    },
    director_team_moderation:            { bg: 'bg-violet-50 border-violet-200',  text: 'text-violet-700',  dot: 'bg-violet-400'  },
    aic_moderation:                      { bg: 'bg-purple-50 border-purple-200',  text: 'text-purple-700',  dot: 'bg-purple-400'  },
    qualifications_development_approval: { bg: 'bg-teal-50 border-teal-200',      text: 'text-teal-700',    dot: 'bg-teal-400'    },
    deputy_director_final:               { bg: 'bg-sky-50 border-sky-200',        text: 'text-sky-700',     dot: 'bg-sky-400'     },
    completed:                           { bg: 'bg-emerald-50 border-emerald-200',text: 'text-emerald-700', dot: 'bg-emerald-500' },
  };
  const c = cfg[stage];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />{getStageLabel(stage)}
    </span>
  );
}

function ValidationStagePill({ stage }: { stage: ValidationStage }) {
  const cfg: Record<ValidationStage, { bg: string; text: string; dot: string }> = {
    sdp_notification:              { bg: 'bg-amber-50 border-amber-200',    text: 'text-amber-700',   dot: 'bg-amber-400'   },
    assistant_director_allocation: { bg: 'bg-blue-50 border-blue-200',      text: 'text-blue-700',    dot: 'bg-blue-400'    },
    asd_validation:                { bg: 'bg-purple-50 border-purple-200',  text: 'text-purple-700',  dot: 'bg-purple-400'  },
    deputy_director_review:        { bg: 'bg-indigo-50 border-indigo-200',  text: 'text-indigo-700',  dot: 'bg-indigo-400'  },
    completed:                     { bg: 'bg-emerald-50 border-emerald-200',text: 'text-emerald-700', dot: 'bg-emerald-500' },
  };
  const c = cfg[stage];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />{getValidationStageLabel(stage)}
    </span>
  );
}

function ReviewPill({ status, approvedLabel = 'Approved', pendingLabel = 'Pending' }: { status: ReviewStatus; approvedLabel?: string; pendingLabel?: string }) {
  if (status === 'approved') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 border-emerald-200 text-emerald-700"><CheckCircle2 className="h-3 w-3" />{approvedLabel}</span>;
  if (status === 'in_progress') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-50 border-blue-200 text-blue-700"><Clock3 className="h-3 w-3" />In Progress</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 border-gray-200 text-gray-500"><AlertCircle className="h-3 w-3" />{pendingLabel}</span>;
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`inline-flex h-8 w-8 rounded-lg bg-gradient-to-br ${color} items-center justify-center mb-3`}>
        <span className="text-white text-xs font-bold">{value}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

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

function PipelineProgress({ stage }: { stage: StandardsStage }) {
  const idx = STANDARDS_PIPELINE.findIndex(s => s.key === stage);
  return (
    <div className="flex items-center flex-wrap gap-y-2">
      {STANDARDS_PIPELINE.map((step, i) => {
        const done = i < idx, active = i === idx;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm border-2 transition-all
                ${done ? 'bg-red-500 border-red-500' : active ? 'bg-white border-red-500 shadow-md shadow-red-100' : 'bg-white border-gray-200'}`}>
                {done ? <CheckCircle2 className="h-4 w-4 text-white" /> : <span>{step.icon}</span>}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${done ? 'text-red-600' : active ? 'text-red-600' : 'text-gray-400'}`}>{step.label}</span>
            </div>
            {i < STANDARDS_PIPELINE.length - 1 && (
              <div className={`h-0.5 w-5 mb-4 mx-0.5 rounded ${i < idx ? 'bg-red-400' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Role checklist component ──────────────────────────────────────────────────
function RoleChecklist({
  items, checklist, setChecklist, notes, setNotes, color = 'red',
}: {
  items: string[];
  checklist: Record<string, boolean>;
  setChecklist: (v: Record<string, boolean>) => void;
  notes: string;
  setNotes: (v: string) => void;
  color?: string;
}) {
  const checked = Object.values(checklist).filter(Boolean).length;
  const borderActive = `border-${color}-200 bg-${color}-50`;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Evaluation Checklist</p>
        <span className="text-xs text-gray-400">{checked}/{items.length} confirmed</span>
      </div>
      <div className="space-y-2 rounded-xl border bg-gray-50 p-3">
        {items.map(item => {
          const isChecked = !!checklist[item];
          return (
            <div key={item} onClick={() => setChecklist({ ...checklist, [item]: !isChecked })}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all
                ${isChecked ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200 hover:border-gray-300'}`}>
              <div className={`h-5 w-5 rounded flex items-center justify-center flex-shrink-0 ${isChecked ? 'bg-red-500' : 'bg-gray-200'}`}>
                {isChecked && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
              </div>
              <span className={`text-sm select-none ${isChecked ? 'text-red-800 font-medium' : 'text-gray-700'}`}>{item}</span>
            </div>
          );
        })}
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Review Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none resize-none"
          placeholder="Enter your review notes and observations..." />
      </div>
    </div>
  );
}

// ── ASD Digital Evaluation Report Form ───────────────────────────────────────
function EvaluationReportForm({
  report, setReport,
}: {
  report: FisaEvaluationReport;
  setReport: (r: FisaEvaluationReport) => void;
}) {
  const updateField = (field: keyof FisaEvaluationReport, value: any) =>
    setReport({ ...report, [field]: value });

  const addElo = () => setReport({
    ...report,
    eloItems: [...report.eloItems, { id: Date.now().toString(), code: `ELO ${report.eloItems.length + 1}`, description: '', aligned: null, comments: '' }],
  });
  const removeElo = (id: string) => setReport({ ...report, eloItems: report.eloItems.filter(e => e.id !== id) });
  const updateElo = (id: string, patch: Partial<EloItem>) => setReport({
    ...report, eloItems: report.eloItems.map(e => e.id === id ? { ...e, ...patch } : e),
  });

  const addAac = () => setReport({
    ...report,
    aacItems: [...report.aacItems, { id: Date.now().toString(), code: `AAC ${report.aacItems.length + 1}`, description: '', measurable: null, alignedToElo: null, comments: '' }],
  });
  const removeAac = (id: string) => setReport({ ...report, aacItems: report.aacItems.filter(a => a.id !== id) });
  const updateAac = (id: string, patch: Partial<AacItem>) => setReport({
    ...report, aacItems: report.aacItems.map(a => a.id === id ? { ...a, ...patch } : a),
  });

  const yesNo = (value: boolean | null, onChange: (v: boolean) => void) => (
    <div className="flex gap-2">
      {[true, false].map(v => (
        <button key={String(v)} type="button" onClick={() => onChange(v)}
          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all
            ${value === v ? (v ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-red-500 border-red-500 text-white') : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}>
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header fields */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Report Header</p>
        </div>
        <div className="p-4 grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Evaluator Name *</label>
            <input value={report.evaluatorName} onChange={e => updateField('evaluatorName', e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
              placeholder="Full name" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Evaluation Date *</label>
            <input type="date" value={report.evaluationDate} onChange={e => updateField('evaluationDate', e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Report Reference</label>
            <input value={report.reportReference} onChange={e => updateField('reportReference', e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
              placeholder="e.g. FISA-2026-001" />
          </div>
        </div>
      </div>

      {/* Purpose evaluation */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">SP Purpose Evaluation</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border">
            <span className="text-sm text-gray-700">Is the SP purpose accurately and completely stated?</span>
            {yesNo(report.purposeAccurate, v => updateField('purposeAccurate', v))}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Comments</label>
            <textarea value={report.purposeComments} onChange={e => updateField('purposeComments', e.target.value)} rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none resize-none"
              placeholder="Comment on the purpose statement..." />
          </div>
        </div>
      </div>

      {/* ELO evaluation */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Exit Level Outcomes (ELO) Evaluation</p>
          <button onClick={addElo} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700">
            <Plus className="h-3.5 w-3.5" />Add ELO
          </button>
        </div>
        <div className="p-4 space-y-3">
          {report.eloItems.map((elo, i) => (
            <div key={elo.id} className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">ELO {i + 1}</span>
                {report.eloItems.length > 1 && (
                  <button onClick={() => removeElo(elo.id)} className="h-6 w-6 rounded-lg hover:bg-red-100 flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ELO Code</label>
                  <input value={elo.code} onChange={e => updateElo(elo.id, { code: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
                    placeholder="e.g. ELO 1" />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Aligned to SP Purpose?</label>
                    {yesNo(elo.aligned, v => updateElo(elo.id, { aligned: v }))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">ELO Description / Findings</label>
                <textarea value={elo.description} onChange={e => updateElo(elo.id, { description: e.target.value })} rows={2}
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none resize-none"
                  placeholder="Describe the ELO and your evaluation findings..." />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Comments / Amendments needed</label>
                <input value={elo.comments} onChange={e => updateElo(elo.id, { comments: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
                  placeholder="Any specific comments..." />
              </div>
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">ELO Overall Conclusion</label>
            <textarea value={report.eloOverallConclusion} onChange={e => updateField('eloOverallConclusion', e.target.value)} rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none resize-none"
              placeholder="Summarise your overall conclusion on the ELOs..." />
          </div>
        </div>
      </div>

      {/* AAC evaluation */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-purple-50 border-b border-purple-200 flex items-center justify-between">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Associated Assessment Criteria (AAC) Evaluation</p>
          <button onClick={addAac} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700">
            <Plus className="h-3.5 w-3.5" />Add AAC
          </button>
        </div>
        <div className="p-4 space-y-3">
          {report.aacItems.map((aac, i) => (
            <div key={aac.id} className="rounded-xl border border-purple-100 bg-purple-50/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">AAC {i + 1}</span>
                {report.aacItems.length > 1 && (
                  <button onClick={() => removeAac(aac.id)} className="h-6 w-6 rounded-lg hover:bg-red-100 flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">AAC Code</label>
                  <input value={aac.code} onChange={e => updateAac(aac.id, { code: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-purple-400 focus:outline-none"
                    placeholder="e.g. AAC 1.1" />
                </div>
                <div className="space-y-1">
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Measurable?</label>
                    {yesNo(aac.measurable, v => updateAac(aac.id, { measurable: v }))}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Aligned to ELO?</label>
                    {yesNo(aac.alignedToElo, v => updateAac(aac.id, { alignedToElo: v }))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">AAC Description / Findings</label>
                <textarea value={aac.description} onChange={e => updateAac(aac.id, { description: e.target.value })} rows={2}
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-purple-400 focus:outline-none resize-none"
                  placeholder="Describe the AAC and your evaluation findings..." />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Comments</label>
                <input value={aac.comments} onChange={e => updateAac(aac.id, { comments: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-purple-400 focus:outline-none"
                  placeholder="Any specific comments..." />
              </div>
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">AAC Overall Conclusion</label>
            <textarea value={report.aacOverallConclusion} onChange={e => updateField('aacOverallConclusion', e.target.value)} rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none resize-none"
              placeholder="Summarise your overall conclusion on the AACs..." />
          </div>
        </div>
      </div>

      {/* Overall findings & recommendation */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Overall Findings & Recommendation</p>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Overall Findings *</label>
            <textarea value={report.overallFindings} onChange={e => updateField('overallFindings', e.target.value)} rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none resize-none"
              placeholder="Summarise your overall evaluation findings..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recommendation *</label>
            <div className="grid md:grid-cols-3 gap-2">
              {([
                { value: 'recommended', label: 'Recommended', color: 'emerald' },
                { value: 'recommended_with_amendments', label: 'With Amendments', color: 'amber' },
                { value: 'not_recommended', label: 'Not Recommended', color: 'red' },
              ] as const).map(opt => (
                <button key={opt.value} type="button" onClick={() => updateField('recommendation', opt.value)}
                  className={`px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                    ${report.recommendation === opt.value
                      ? opt.color === 'emerald' ? 'bg-emerald-500 border-emerald-500 text-white'
                        : opt.color === 'amber' ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-red-500 border-red-500 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Recommendation Comments</label>
            <textarea value={report.recommendationComments} onChange={e => updateField('recommendationComments', e.target.value)} rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none resize-none"
              placeholder="Any additional notes supporting your recommendation..." />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Read-only evaluation report view ─────────────────────────────────────────
function EvaluationReportReadOnly({ report }: { report: FisaEvaluationReport }) {
  const recCfg = {
    recommended: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Recommended' },
    recommended_with_amendments: { bg: 'bg-amber-50 border-amber-200 text-amber-700', label: 'With Amendments' },
    not_recommended: { bg: 'bg-red-50 border-red-200 text-red-700', label: 'Not Recommended' },
  }[report.recommendation || 'recommended'];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-emerald-50 border-emerald-200 px-5 py-3 flex items-center gap-2">
        <span className="text-base">🔒</span>
        <p className="text-sm font-medium text-emerald-800">Read-only — Evaluation report submitted by ASD</p>
      </div>
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Report Header</p></div>
        <div className="p-4 grid md:grid-cols-3 gap-4 text-sm">
          <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Evaluator</p><p className="font-medium">{report.evaluatorName || '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Date</p><p className="font-medium">{report.evaluationDate || '—'}</p></div>
          <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Reference</p><p className="font-medium font-mono">{report.reportReference || '—'}</p></div>
        </div>
      </div>
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200"><p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">SP Purpose</p></div>
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2"><span className="text-sm text-gray-600">Accurately stated:</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${report.purposeAccurate === true ? 'bg-emerald-100 text-emerald-700' : report.purposeAccurate === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
              {report.purposeAccurate === true ? 'Yes' : report.purposeAccurate === false ? 'No' : 'Not answered'}
            </span>
          </div>
          {report.purposeComments && <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border">{report.purposeComments}</p>}
        </div>
      </div>
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200"><p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">ELO Evaluation</p></div>
        <div className="p-4 space-y-3">
          {report.eloItems.map((elo, i) => (
            <div key={elo.id} className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-indigo-800">{elo.code}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${elo.aligned === true ? 'bg-emerald-100 text-emerald-700' : elo.aligned === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                  {elo.aligned === true ? 'Aligned ✓' : elo.aligned === false ? 'Not Aligned ✗' : '—'}
                </span>
              </div>
              {elo.description && <p className="text-gray-700">{elo.description}</p>}
              {elo.comments && <p className="text-gray-500 italic">{elo.comments}</p>}
            </div>
          ))}
          {report.eloOverallConclusion && (
            <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Overall Conclusion</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border">{report.eloOverallConclusion}</p></div>
          )}
        </div>
      </div>
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-purple-50 border-b border-purple-200"><p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">AAC Evaluation</p></div>
        <div className="p-4 space-y-3">
          {report.aacItems.map((aac) => (
            <div key={aac.id} className="rounded-xl border border-purple-100 bg-purple-50/30 p-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-purple-800">{aac.code}</span>
                <div className="flex gap-1.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${aac.measurable === true ? 'bg-emerald-100 text-emerald-700' : aac.measurable === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                    {aac.measurable === true ? 'Measurable' : aac.measurable === false ? 'Not measurable' : '—'}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${aac.alignedToElo === true ? 'bg-emerald-100 text-emerald-700' : aac.alignedToElo === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                    {aac.alignedToElo === true ? 'ELO aligned' : aac.alignedToElo === false ? 'Not ELO aligned' : '—'}
                  </span>
                </div>
              </div>
              {aac.description && <p className="text-gray-700">{aac.description}</p>}
              {aac.comments && <p className="text-gray-500 italic">{aac.comments}</p>}
            </div>
          ))}
          {report.aacOverallConclusion && (
            <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Overall Conclusion</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border">{report.aacOverallConclusion}</p></div>
          )}
        </div>
      </div>
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200"><p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Findings & Recommendation</p></div>
        <div className="p-4 space-y-3">
          {report.overallFindings && <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border whitespace-pre-wrap">{report.overallFindings}</p>}
          {report.recommendation && (
            <span className={`inline-flex px-3 py-1.5 rounded-xl text-sm font-semibold border ${recCfg?.bg}`}>{recCfg?.label}</span>
          )}
          {report.recommendationComments && <p className="text-sm text-gray-600 italic">{report.recommendationComments}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Reviewer block (read-only display for submitted reviews) ──────────────────
function ReviewerBlock({ title, color, checklist, notes }: {
  title: string; color: 'violet' | 'purple' | 'teal';
  checklist?: Record<string, boolean>; notes?: string;
}) {
  const cm = {
    violet: { bg: 'bg-violet-50/40 border-violet-200', header: 'bg-violet-100 border-violet-200', title: 'text-violet-700' },
    purple: { bg: 'bg-purple-50/40 border-purple-200', header: 'bg-purple-100 border-purple-200', title: 'text-purple-700' },
    teal:   { bg: 'bg-teal-50/40 border-teal-200',     header: 'bg-teal-100 border-teal-200',     title: 'text-teal-700'   },
  }[color];
  const items = checklist ? Object.entries(checklist) : [];
  const passed = items.filter(([, v]) => v).length;
  if (items.length === 0 && !notes) return null;
  return (
    <div className={`rounded-2xl border overflow-hidden ${cm.bg}`}>
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${cm.header}`}>
        <ShieldCheck className={`h-4 w-4 ${cm.title}`} />
        <p className={`text-xs font-semibold uppercase tracking-wider ${cm.title}`}>{title}</p>
        {items.length > 0 && <span className="ml-auto text-xs text-gray-500">{passed}/{items.length} confirmed</span>}
      </div>
      <div className="p-4 space-y-3">
        {items.length > 0 && (
          <div className="space-y-1.5">
            {items.map(([item, checked]) => (
              <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${checked ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-50 text-gray-400 line-through'}`}>
                <div className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  {checked && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>{item}
              </div>
            ))}
          </div>
        )}
        {notes && <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border whitespace-pre-wrap">{notes}</p>}
      </div>
    </div>
  );
}

// ── Standards Detail Modal ────────────────────────────────────────────────────
function StandardsDetailModal({
  record, currentRole, onClose, onUpdate,
}: {
  record: FisaStandardsRecord;
  currentRole: AppRole;
  onClose: () => void;
  onUpdate: (patch: Partial<FisaStandardsRecord>) => void;
}) {
  const [activeTab, setActiveTab] = useState<StandardsModalTab>('details');

  // Allocation
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedAsd, setSelectedAsd] = useState('');

  // ASD evaluation
  const [draftReport, setDraftReport] = useState<FisaEvaluationReport>(() =>
    record.evaluationReport ? { ...record.evaluationReport } : makeEmptyReport()
  );

  // Reviewer checklists
  const [directorChecklist, setDirectorChecklist] = useState<Record<string, boolean>>(
    record.directorTeamChecklist || Object.fromEntries(DIRECTOR_TEAM_CHECKLIST.map(i => [i, false]))
  );
  const [directorNotes, setDirectorNotes] = useState(record.directorTeamNotes || '');
  const [aicChecklist, setAicChecklist] = useState<Record<string, boolean>>(
    record.aicChecklist || Object.fromEntries(AIC_CHECKLIST.map(i => [i, false]))
  );
  const [aicNotes, setAicNotes] = useState(record.aicNotes || '');
  const [qualDevChecklist, setQualDevChecklist] = useState<Record<string, boolean>>(
    record.qualDevChecklist || Object.fromEntries(QUAL_DEV_CHECKLIST.map(i => [i, false]))
  );
  const [qualDevNotes, setQualDevNotes] = useState(record.qualDevNotes || '');

  const canAllocate = currentRole === 'Deputy Director' && record.currentStage === 'deputy_director_allocation';
  const canEvaluate = currentRole === 'ASD' && record.currentStage === 'asd_evaluation' && !!record.allocatedAsd;
  const canDirectorReview = currentRole === 'Director & Team' && record.currentStage === 'director_team_moderation';
  const canAicReview = currentRole === 'AIC' && record.currentStage === 'aic_moderation';
  const canQualDevReview = currentRole === 'Qualifications Development' && record.currentStage === 'qualifications_development_approval';
  const canDDFinal = currentRole === 'Deputy Director' && record.currentStage === 'deputy_director_final';

  const handleAllocate = () => {
    if (!selectedAsd) return;
    onUpdate({ allocatedAsd: selectedAsd, currentStage: 'asd_evaluation' });
    setShowAllocateModal(false);
    onClose();
  };

  const handleSubmitEvaluation = () => {
    if (!draftReport.evaluatorName || !draftReport.evaluationDate || !draftReport.overallFindings || !draftReport.recommendation) {
      alert('Please complete all required fields: Evaluator Name, Evaluation Date, Overall Findings, and Recommendation.');
      return;
    }
    onUpdate({
      evaluationReport: draftReport,
      evaluationSubmittedAt: new Date().toISOString(),
      currentStage: 'director_team_moderation',
      directorTeamStatus: 'in_progress',
    });
    onClose();
  };

  const handleDirectorSubmit = () => {
    if (!Object.values(directorChecklist).every(v => v)) {
      alert('Please confirm all checklist items before submitting.');
      return;
    }
    onUpdate({
      directorTeamChecklist: directorChecklist,
      directorTeamNotes: directorNotes,
      directorTeamStatus: 'approved',
      currentStage: 'aic_moderation',
      aicStatus: 'in_progress',
    });
    onClose();
  };

  const handleAicSubmit = () => {
    if (!Object.values(aicChecklist).every(v => v)) {
      alert('Please confirm all checklist items before submitting.');
      return;
    }
    onUpdate({
      aicChecklist: aicChecklist,
      aicNotes: aicNotes,
      aicStatus: 'approved',
      currentStage: 'qualifications_development_approval',
      qualDevStatus: 'in_progress',
    });
    onClose();
  };

  const handleQualDevSubmit = () => {
    if (!Object.values(qualDevChecklist).every(v => v)) {
      alert('Please confirm all checklist items before submitting.');
      return;
    }
    onUpdate({
      qualDevChecklist: qualDevChecklist,
      qualDevNotes: qualDevNotes,
      qualDevStatus: 'approved',
      currentStage: 'deputy_director_final',
    });
    onClose();
  };

 const handleDDFinalComplete = () => {
  // Create notification for the SDP (ExternalValidationOfFisa)
  const notification = {
    id: `SDP-NOTIF-${record.id}`,
    sourceStandardsId: record.id,
    spCode: record.spCode,
    spTitle: record.spTitle,
    curriculumCode: record.curriculumCode,
    curriculumTitle: record.curriculumTitle,
    purpose: record.purpose,
    eloFocus: record.eloFocus,
    aacFocus: record.aacFocus,
    nqfLevel: record.nqfLevel,
    credits: record.credits,
    nameOfAQP: record.nameOfAQP,
    saqaId: record.saqaId,
    isFromQasa: record.isFromQasa,
    evaluationReport: record.evaluationReport || null,
    evaluationSubmittedAt: record.evaluationSubmittedAt || null,
    directorTeamChecklist: record.directorTeamChecklist || null,
    directorTeamNotes: record.directorTeamNotes || '',
    aicChecklist: record.aicChecklist || null,
    aicNotes: record.aicNotes || '',
    qualDevChecklist: record.qualDevChecklist || null,
    qualDevNotes: record.qualDevNotes || '',
    qasaPayload: record.qasaPayload || null,
    status: 'pending_sdp_instrument' as const,
    notifiedAt: new Date().toISOString(),
    instrumentFileName: null,
    instrumentSubmittedAt: null,
  };

  // Add to SDP notifications (ExternalValidationOfFisa reads this)
  const existingNotifs = (() => {
    try { return JSON.parse(localStorage.getItem('fisa_sdp_notifications') || '[]'); } catch { return []; }
  })();
  
  if (!existingNotifs.some((n: any) => n.sourceStandardsId === record.id)) {
    localStorage.setItem('fisa_sdp_notifications', JSON.stringify([notification, ...existingNotifs]));
    window.dispatchEvent(new StorageEvent('storage', { key: 'fisa_sdp_notifications' }));
  }

  // Update the standards record
  onUpdate({ currentStage: 'completed', databaseUpdated: true });
  onClose();
};

  const hasEvalTab = record.evaluationReport || canEvaluate;
  const hasChecklistTab = record.currentStage !== 'deputy_director_allocation' && record.currentStage !== 'asd_evaluation';

  // QASA payload tabs — only visible when the record came from QASA Approval
  const qasaPayload = record.qasaPayload as Record<string, any> | undefined;
  const hasQasaChecklist = record.isFromQasa && !!qasaPayload?.qasaChecklist;
  const hasQasaReport    = record.isFromQasa && !!qasaPayload?.evaluationReport;

  const tabs = [
    { id: 'details' as const,        label: 'Application Details',    icon: '📄', always: true },
    { id: 'evaluation' as const,     label: 'FISA Evaluation',        icon: '📝', show: hasEvalTab },
    { id: 'checklist' as const,      label: 'Review & Checklist',     icon: '✅', show: hasChecklistTab },
    { id: 'qasa_checklist' as const, label: 'QASA Eval. Checklist',   icon: '📋', show: hasQasaChecklist },
    { id: 'qasa_report' as const,    label: 'QASA Eval. Report',      icon: '📊', show: hasQasaReport },
  ].filter(t => t.always || t.show);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5 flex-shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {record.isFromQasa && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">
                  <Sparkles className="h-3 w-3" />Routed from QASA
                </span>
              )}
              <StagePill stage={record.currentStage} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{record.spTitle}</h3>
            <p className="mt-0.5 text-sm text-gray-500">{record.spCode} · {record.curriculumCode}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center flex-shrink-0">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 border-b bg-white flex-shrink-0">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all
                ${activeTab === tab.id ? 'border-red-500 text-red-700 bg-red-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── DETAILS TAB ── */}
          {activeTab === 'details' && (
            <>
              {/* Pipeline */}
              <div className="rounded-2xl bg-gradient-to-br from-red-50 to-rose-50/50 border border-red-200 p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Standards Pipeline Progress</p>
                <PipelineProgress stage={record.currentStage} />
              </div>

              {/* QASA banner */}
              {record.isFromQasa && (
                <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-4 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-violet-800">Brand New Qualification — Routed from QASA Approval</p>
                    <p className="text-xs text-violet-600 mt-0.5">
                      Submitted by <span className="font-semibold">{record.nameOfAQP}</span>
                      {record.saqaId && <> · SAQA ID: <span className="font-mono">{record.saqaId}</span></>}
                      {record.nqfLevel && <> · NQF Level {record.nqfLevel}</>}
                      {record.credits && <> · {record.credits} credits</>}
                    </p>
                  </div>
                </div>
              )}

              {/* SP & Curriculum */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SP Document</p>
                  </div>
                  <div className="px-4 divide-y divide-gray-50">
                    <DetailRow icon={Hash} label="SP Code" value={<span className="font-mono">{record.spCode}</span>} />
                    <DetailRow icon={BookOpen} label="SP Title" value={record.spTitle} />
                    <DetailRow icon={FileText} label="Purpose" value={record.purpose} />
                    {record.nqfLevel && <DetailRow icon={Award} label="NQF Level" value={record.nqfLevel} />}
                    {record.credits && <DetailRow icon={Hash} label="Credits" value={record.credits} />}
                  </div>
                </div>
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Curriculum Document</p>
                  </div>
                  <div className="px-4 divide-y divide-gray-50">
                    <DetailRow icon={Hash} label="Curriculum Code" value={<span className="font-mono">{record.curriculumCode}</span>} />
                    <DetailRow icon={BookOpen} label="Curriculum Title" value={record.curriculumTitle} />
                    <DetailRow icon={ShieldCheck} label="ELO Focus" value={record.eloFocus} />
                    <DetailRow icon={ClipboardCheck} label="AAC Focus" value={record.aacFocus} />
                  </div>
                </div>
              </div>

              {/* Review status */}
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Review Status</p>
                </div>
                <div className="p-4 grid md:grid-cols-2 gap-3">
                  {[
                    { label: 'Allocated ASD', value: record.allocatedAsd ? 'approved' : 'pending' as ReviewStatus, approvedLabel: record.allocatedAsd || 'Assigned', pendingLabel: 'Not yet allocated' },
                    { label: 'Evaluation Report', value: record.evaluationReport ? 'approved' : 'pending' as ReviewStatus, approvedLabel: 'Submitted', pendingLabel: 'Pending' },
                    { label: 'Director & Team', value: record.directorTeamStatus },
                    { label: 'AIC Review', value: record.aicStatus },
                    { label: 'Qualifications Dev.', value: record.qualDevStatus },
                    { label: 'DD Final', value: record.currentStage === 'completed' ? 'approved' : 'pending' as ReviewStatus, approvedLabel: 'Completed', pendingLabel: 'Pending' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <span className="text-sm text-gray-600 font-medium">{item.label}</span>
                      <ReviewPill status={item.value as ReviewStatus} approvedLabel={(item as any).approvedLabel} pendingLabel={(item as any).pendingLabel} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Allocated ASD banner */}
              {record.allocatedAsd && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Allocated ASD</p>
                    <p className="text-sm font-semibold text-blue-900 mt-0.5">{record.allocatedAsd}</p>
                  </div>
                </div>
              )}

              {/* Actions: DD Allocate */}
              {canAllocate && (
                <div className="rounded-2xl border-2 border-dashed border-red-200 bg-red-50/30 p-4">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3">Available Actions</p>
                  <button onClick={() => setShowAllocateModal(true)}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors">
                    <Users className="h-4 w-4" />Allocate to ASD
                  </button>
                </div>
              )}

              {/* Actions: DD Final */}
              {canDDFinal && (
                <div className="rounded-2xl border-2 border-dashed border-sky-200 bg-sky-50/30 p-4">
                  <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-2">Available Actions</p>
                  <p className="text-xs text-sky-600 mb-3">All reviews have been completed. This application is ready to move to the external process.</p>
                  <button onClick={handleDDFinalComplete}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-colors">
                    <CheckCircle2 className="h-4 w-4" />Mark Complete & Move to External
                  </button>
                </div>
              )}

              {!canAllocate && !canDDFinal && !canEvaluate && !canDirectorReview && !canAicReview && !canQualDevReview && (
                <p className="text-sm text-gray-400 italic text-center py-2">No actions available for your role at this stage.</p>
              )}
            </>
          )}

          {/* ── EVALUATION REPORT TAB ── */}
          {activeTab === 'evaluation' && (
            <>
              {canEvaluate ? (
                <>
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileCheck2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-800">ASD Evaluation — Complete the digital report below</p>
                      <p className="text-xs text-blue-600 mt-0.5">Evaluate the Curriculum document focusing on the ELOs, AACs and SP purpose. Complete all sections then submit.</p>
                    </div>
                  </div>
                  <EvaluationReportForm report={draftReport} setReport={setDraftReport} />
                  <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-white border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                    <button onClick={handleSubmitEvaluation}
                      className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700">
                      <Send className="h-4 w-4" />Submit to Director & Team
                    </button>
                  </div>
                </>
              ) : record.evaluationReport ? (
                <EvaluationReportReadOnly report={record.evaluationReport} />
              ) : (
                <div className="text-center py-16">
                  <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="font-medium text-gray-500">No Evaluation Report Yet</p>
                  <p className="text-sm text-gray-400 mt-1">The ASD will complete the evaluation report once allocated.</p>
                </div>
              )}
            </>
          )}

          {/* ── REVIEW & CHECKLIST TAB ── */}
          {activeTab === 'checklist' && (
            <>
              {/* Previous reviews (read-only display) */}
              {record.directorTeamStatus === 'approved' && record.directorTeamChecklist && (
                <ReviewerBlock title="Director & Team Review" color="violet"
                  checklist={record.directorTeamChecklist} notes={record.directorTeamNotes} />
              )}
              {record.aicStatus === 'approved' && record.aicChecklist && (
                <ReviewerBlock title="AIC Review & Validation" color="purple"
                  checklist={record.aicChecklist} notes={record.aicNotes} />
              )}
              {record.qualDevStatus === 'approved' && record.qualDevChecklist && (
                <ReviewerBlock title="Qualifications Development Approval" color="teal"
                  checklist={record.qualDevChecklist} notes={record.qualDevNotes} />
              )}

              {/* Active reviewer action */}
              {canDirectorReview && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4 flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-violet-800">Director & Team — Review and Moderate</p>
                      <p className="text-xs text-violet-600 mt-0.5">Review the evaluation report and confirm the checklist before submitting to AIC.</p>
                    </div>
                  </div>
                  <RoleChecklist items={DIRECTOR_TEAM_CHECKLIST} checklist={directorChecklist}
                    setChecklist={setDirectorChecklist} notes={directorNotes} setNotes={setDirectorNotes} />
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                    <button onClick={handleDirectorSubmit}
                      className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700">
                      <Send className="h-4 w-4" />Submit to AIC
                    </button>
                  </div>
                </div>
              )}

              {canAicReview && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ClipboardCheck className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-800">AIC — Review and Validate</p>
                      <p className="text-xs text-purple-600 mt-0.5">Validate the evaluation and confirm the checklist before submitting to Qualifications Development.</p>
                    </div>
                  </div>
                  <RoleChecklist items={AIC_CHECKLIST} checklist={aicChecklist}
                    setChecklist={setAicChecklist} notes={aicNotes} setNotes={setAicNotes} />
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                    <button onClick={handleAicSubmit}
                      className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700">
                      <Send className="h-4 w-4" />Submit to Qualifications Development
                    </button>
                  </div>
                </div>
              )}

              {canQualDevReview && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgeCheck className="h-4 w-4 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-teal-800">Qualifications Development — Review and Approve</p>
                      <p className="text-xs text-teal-600 mt-0.5">Review and confirm qualification development standards are met, then return to Deputy Director.</p>
                    </div>
                  </div>
                  <RoleChecklist items={QUAL_DEV_CHECKLIST} checklist={qualDevChecklist}
                    setChecklist={setQualDevChecklist} notes={qualDevNotes} setNotes={setQualDevNotes} />
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                    <button onClick={handleQualDevSubmit}
                      className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700">
                      <Send className="h-4 w-4" />Approve & Return to Deputy Director
                    </button>
                  </div>
                </div>
              )}

              {!canDirectorReview && !canAicReview && !canQualDevReview &&
               record.directorTeamStatus !== 'approved' && record.aicStatus !== 'approved' && record.qualDevStatus !== 'approved' && (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400 italic">No reviews available yet at this stage.</p>
                </div>
              )}
            </>
          )}

          {/* ── QASA EVALUATION CHECKLIST TAB (read-only carry-over) ── */}
          {activeTab === 'qasa_checklist' && (() => {
            const cl = qasaPayload?.qasaChecklist as QasaChecklist | null;
            if (!cl) return (
              <div className="text-center py-16">
                <p className="font-medium text-gray-500">No QASA Checklist available</p>
              </div>
            );
            return (
              <div className="space-y-5">
                <div className="rounded-2xl border bg-violet-50 border-violet-200 px-5 py-3 flex items-center gap-2">
                  <span className="text-base">🔒</span>
                  <p className="text-sm font-medium text-violet-800">Read-only — QASA Addendum Preliminary Checklist carried from QASA Approval</p>
                </div>
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-purple-50 border-b border-purple-200">
                    <p className="text-sm font-bold text-purple-900 uppercase tracking-wide">QAS ADDENDUM PRELIMINARY CHECKLIST</p>
                    <p className="text-xs text-purple-600 mt-0.5">Document No: QCTO/EISA/CL1 · Version: 1</p>
                  </div>
                  <div className="p-4 grid md:grid-cols-2 gap-4 text-sm">
                    {[
                      { label: 'Name of AQP',                value: record.nameOfAQP || qasaPayload?.nameOfAQP },
                      { label: 'Qualification Title',        value: record.spTitle },
                      { label: 'SAQA ID',                   value: record.saqaId, mono: true },
                      { label: 'Date of Receipt',            value: cl.dateOfReceipt },
                      { label: 'Date Evaluated',             value: cl.dateEvaluated },
                      { label: 'Evaluated By',               value: cl.evaluatedBy },
                      { label: 'Remedial Actions Required',  value: cl.remedialActionsRequired ? cl.remedialActionsRequired.charAt(0).toUpperCase() + cl.remedialActionsRequired.slice(1) : '—' },
                      { label: 'Date Feedback Provided',     value: cl.dateFeedbackProvided },
                    ].map(f => (
                      <div key={f.label} className="space-y-0.5">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{f.label}</p>
                        <p className={`font-medium text-gray-900 ${(f as any).mono ? 'font-mono' : ''}`}>{(f.value as string) || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {cl.sections.map(section => (
                  <div key={section.sectionId} className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200">
                      <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">{section.sectionId} — {section.title}</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-gray-50 border-b">
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 w-12">No.</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Item</th>
                          <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-14">Yes</th>
                          <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-14">No</th>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 min-w-[160px]">Comments</th>
                        </tr></thead>
                        <tbody>
                          {section.items.map((item, ii) => (
                            <tr key={item.id} className={`border-b last:border-0 ${ii % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                              <td className="px-4 py-2.5 text-xs text-gray-400 font-mono align-top">{item.id}</td>
                              <td className="px-4 py-2.5 text-sm text-gray-700 align-top">{item.text}</td>
                              <td className="px-3 py-2.5 text-center align-top">
                                <div className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto ${item.yes ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 bg-gray-50'}`}>
                                  {item.yes && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center align-top">
                                <div className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto ${item.no ? 'bg-red-500 border-red-500' : 'border-gray-200 bg-gray-50'}`}>
                                  {item.no && <X className="h-3.5 w-3.5 text-white" />}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-gray-600 align-top">{item.comments || <span className="text-gray-300 italic">No comment</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                {/* Recommendations */}
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200">
                    <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Recommendations</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="bg-gray-50 border-b">
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Recommendation</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-14">Yes</th>
                        <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-14">No</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Comments</th>
                      </tr></thead>
                      <tbody>
                        {[
                          { label: 'This QAS Addendum clearly assesses job-related task(s)', yes: cl.recommendationJobRelated, no: cl.recommendationJobRelatedNo, comments: cl.recommendationJobRelatedComments },
                          { label: 'This QAS Addendum has been recommended for approval by the QCTO', yes: cl.recommendationApproved, no: cl.recommendationApprovedNo, comments: cl.recommendationApprovedComments },
                        ].map((rec, ri) => (
                          <tr key={rec.label} className={`border-b last:border-0 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <td className="px-4 py-2.5 text-sm text-gray-700">{rec.label}</td>
                            <td className="px-3 py-2.5 text-center">
                              <div className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto ${rec.yes ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 bg-gray-50'}`}>
                                {rec.yes && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <div className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto ${rec.no ? 'bg-red-500 border-red-500' : 'border-gray-200 bg-gray-50'}`}>
                                {rec.no && <X className="h-3.5 w-3.5 text-white" />}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-600">{rec.comments || <span className="text-gray-300 italic">No comment</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── QASA EVALUATION REPORT TAB (read-only carry-over) ── */}
          {activeTab === 'qasa_report' && (() => {
            const rp = qasaPayload?.evaluationReport as QasaEvaluationReport | null;
            const cl = qasaPayload?.qasaChecklist as QasaChecklist | null;
            if (!rp) return (
              <div className="text-center py-16">
                <p className="font-medium text-gray-500">No QASA Evaluation Report available</p>
              </div>
            );
            const outcomeLabel = (v: string) => v === 'approved' ? 'Recommended' : v === 'amendments' ? 'With Amendments' : v === 'not_recommended' ? 'Not Recommended' : '—';
            const outcomeCfg = (v: string) => v === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : v === 'amendments' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700';
            return (
              <div className="space-y-5">
                <div className="rounded-2xl border bg-violet-50 border-violet-200 px-5 py-3 flex items-center gap-2">
                  <span className="text-base">🔒</span>
                  <p className="text-sm font-medium text-violet-800">Read-only — QAS Addendum Evaluation Report carried from QASA Approval</p>
                </div>
                <div className="rounded-2xl border bg-purple-50 border-purple-200 px-6 py-4 text-center">
                  <p className="text-base font-bold text-purple-900 uppercase tracking-wide">QAS ADDENDUM EVALUATION REPORT</p>
                  <p className="text-xs text-purple-600 mt-1">QCTO OQA Assessment Evaluation</p>
                </div>
                {/* AC Approval */}
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assessment Committee Approval</p></div>
                  <div className="p-4 flex flex-wrap gap-6 text-sm">
                    <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Approval</p><p className="font-medium">{rp.acApproval ? rp.acApproval.charAt(0).toUpperCase() + rp.acApproval.slice(1) : '—'}</p></div>
                    <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Date</p><p className="font-medium">{rp.acDate || '—'}</p></div>
                  </div>
                </div>
                {/* Section A */}
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-blue-50 border-b border-blue-200"><p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Section A — AQP Details</p></div>
                  <div className="p-4 grid md:grid-cols-2 gap-3 text-sm">
                    {[{l:'AQP Name',v:rp.aqpName},{l:'Contact Name',v:rp.contactName},{l:'Contact Email',v:rp.contactEmail},{l:'Physical Address',v:rp.physicalAddress},{l:'Date Received',v:rp.dateReceived},{l:'Date Evaluated',v:rp.dateEvaluated},{l:"Evaluator's Name",v:rp.evaluatorsName}].map(x => (
                      <div key={x.l}><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">{x.l}</p><p className="font-medium text-gray-900">{x.v || '—'}</p></div>
                    ))}
                  </div>
                </div>
                {/* Section B */}
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200"><p className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Section B — Assessment Specification Requirements</p></div>
                  <div className="p-4 space-y-4">
                    <div className="grid md:grid-cols-3 gap-3 text-sm">
                      {[{l:'Qualification Title',v:rp.qualificationTitle,span:true},{l:'SAQA ID',v:rp.saqaId},{l:'Date Registered',v:rp.dateRegistered},{l:'NQF Level',v:rp.nqfLevel},{l:'Credits',v:rp.credits},{l:'Reg. Start',v:rp.registrationStartDate},{l:'Reg. End',v:rp.registrationEndDate}].map(x => (
                        <div key={x.l} className={(x as any).span ? 'md:col-span-3' : ''}>
                          <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">{x.l}</p>
                          <p className="font-medium text-gray-900">{x.v || '—'}</p>
                        </div>
                      ))}
                    </div>
                    <div className="overflow-x-auto rounded-xl border">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-gray-50 border-b"><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Item</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Findings</th></tr></thead>
                        <tbody>
                          {[{f:'correctQualTitle',l:'Correct Qualification Title'},{f:'correctNqfLevel',l:'Correct NQF Level'},{f:'nqfLevelEisa',l:'NQF Level of EISA'},{f:'correctCredits',l:'Correct Credits'},{f:'numberOfComponents',l:'Number of Components'},{f:'duration',l:'Duration'},{f:'format',l:'Format'},{f:'layout',l:'Layout'},{f:'openOrClosed',l:'Open or Closed Book'},{f:'assessmentPoints',l:'Assessment Points'},{f:'supplementaryAssessments',l:'Supplementary Assessments'},{f:'percentageModerated',l:'% Moderated'},{f:'markingDays',l:'Marking Days'},{f:'moderationDays',l:'Moderation Days'}].map((x,ii) => (
                            <tr key={x.f} className={`border-b last:border-0 ${ii%2===0?'bg-white':'bg-gray-50/30'}`}>
                              <td className="px-4 py-2 text-sm text-gray-700">{x.l}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{(rp as any)[x.f] || <span className="text-gray-300 italic">—</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="overflow-x-auto rounded-xl border">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-gray-50 border-b"><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Component</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Name</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Marks</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Pass</th></tr></thead>
                        <tbody>{[1,2,3].map(n => (<tr key={n} className={`border-b last:border-0 ${n%2===0?'bg-gray-50/30':'bg-white'}`}><td className="px-4 py-2 text-sm font-medium text-gray-700">Component {n}</td><td className="px-4 py-2 text-sm text-gray-900">{(rp as any)[`component${n}Name`]||'—'}</td><td className="px-4 py-2 text-sm text-gray-900">{(rp as any)[`component${n}Marks`]||'—'}</td><td className="px-4 py-2 text-sm text-gray-900">{(rp as any)[`component${n}Pass`]||'—'}</td></tr>))}</tbody>
                      </table>
                    </div>
                  </div>
                </div>
                {/* Section C — Blueprint */}
                {cl && (
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-purple-50 border-b border-purple-200"><p className="text-xs font-bold text-purple-900 uppercase tracking-wider">Section C — Blueprint Evaluation</p></div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-gray-50 border-b"><th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-14">No.</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Item</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-12">Yes</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-12">No</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 min-w-[140px]">Comments</th></tr></thead>
                        <tbody>
                          {cl.sections.flatMap(s => s.items).map((item, ii) => {
                            const ci = rp.sectionC?.[item.id] || { yes: false, no: false, comments: '' };
                            return (
                              <tr key={item.id} className={`border-b last:border-0 ${ii%2===0?'bg-white':'bg-gray-50/30'}`}>
                                <td className="px-3 py-2 text-xs text-gray-400 font-mono align-top">{item.id}</td>
                                <td className="px-4 py-2 text-xs text-gray-700 align-top">{item.text}</td>
                                <td className="px-3 py-2 text-center align-top"><div className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto ${ci.yes?'bg-emerald-500 border-emerald-500':'border-gray-200 bg-gray-50'}`}>{ci.yes&&<CheckCircle2 className="h-3.5 w-3.5 text-white"/>}</div></td>
                                <td className="px-3 py-2 text-center align-top"><div className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto ${ci.no?'bg-red-500 border-red-500':'border-gray-200 bg-gray-50'}`}>{ci.no&&<X className="h-3.5 w-3.5 text-white"/>}</div></td>
                                <td className="px-4 py-2 text-xs text-gray-600 align-top">{ci.comments || <span className="text-gray-300 italic">—</span>}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {/* Section D — General Evaluation */}
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-teal-50 border-b border-teal-200"><p className="text-xs font-bold text-teal-900 uppercase tracking-wider">Section D — Overall General Evaluation</p></div>
                  <div className="p-4 space-y-4">
                    <div className="overflow-x-auto rounded-xl border">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-gray-50 border-b"><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Characteristic</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Description</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-12">Yes</th><th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-12">No</th></tr></thead>
                        <tbody>
                          {[{key:'relevance',char:'Relevance',desc:'Assessment instruments will be able to assess occupational competencies'},{key:'setStandards',char:'Set Standards',desc:'Developers can develop items for the item bank'},{key:'accuracy',char:'Accuracy',desc:'Measures occupational competence at exit level'},{key:'bestPractice',char:'Best Practice',desc:'Final EISA is in line with national and international best practice'}].map((row,ii) => {
                            const sd = rp.sectionD?.[row.key] || { yes: false, no: false };
                            return (
                              <tr key={row.key} className={`border-b last:border-0 ${ii%2===0?'bg-white':'bg-gray-50/30'}`}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-700">{row.char}</td>
                                <td className="px-4 py-2 text-xs text-gray-600">{row.desc}</td>
                                <td className="px-3 py-2 text-center"><div className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto ${sd.yes?'bg-emerald-500 border-emerald-500':'border-gray-200 bg-gray-50'}`}>{sd.yes&&<CheckCircle2 className="h-3.5 w-3.5 text-white"/>}</div></td>
                                <td className="px-3 py-2 text-center"><div className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto ${sd.no?'bg-red-500 border-red-500':'border-gray-200 bg-gray-50'}`}>{sd.no&&<X className="h-3.5 w-3.5 text-white"/>}</div></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1">Evaluation Findings</p><p className="text-gray-900 bg-gray-50 rounded-xl p-3 border whitespace-pre-wrap">{rp.evaluationFindings || <span className="text-gray-300 italic">—</span>}</p></div>
                      <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1">Recommendation</p><p className="text-gray-900 bg-gray-50 rounded-xl p-3 border whitespace-pre-wrap">{rp.recommendation || <span className="text-gray-300 italic">—</span>}</p></div>
                    </div>
                  </div>
                </div>
                {/* Section E — Final Recommendations */}
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200"><p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Section E — Final Recommendations</p></div>
                  <div className="p-4 space-y-4">
                    <div><p className="text-xs text-gray-400 uppercase font-semibold mb-1">Meets Minimum Requirements</p><p className="text-sm font-semibold text-gray-900">{rp.meetsMinRequirements ? rp.meetsMinRequirements.toUpperCase() : '—'}</p></div>
                    <div className="overflow-x-auto rounded-xl border">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-gray-50 border-b"><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Evaluator</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Name</th><th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Outcome</th></tr></thead>
                        <tbody>
                          {[{label:'First Evaluator (ASD)',name:rp.firstEvaluatorName,outcome:rp.firstEvaluatorOutcome},{label:'Second Evaluator (DD)',name:rp.secondEvaluatorName,outcome:rp.secondEvaluatorOutcome},{label:'Final Recommendation',name:'',outcome:rp.finalRecommendation}].map((row,ii) => (
                            <tr key={row.label} className={`border-b last:border-0 ${ii%2===0?'bg-white':'bg-gray-50/30'}`}>
                              <td className="px-4 py-2 text-sm font-medium text-gray-700">{row.label}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{row.name || <span className="text-gray-400 italic">—</span>}</td>
                              <td className="px-4 py-2">
                                {row.outcome ? (
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${outcomeCfg(row.outcome)}`}>
                                    {outcomeLabel(row.outcome)}
                                  </span>
                                ) : <span className="text-gray-400 italic text-xs">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Allocate sub-modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Allocate to ASD</h3>
                <p className="text-xs text-gray-500 mt-0.5">Select an ASD to evaluate this SP document</p>
              </div>
              <button onClick={() => setShowAllocateModal(false)} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-gray-50 border p-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">SP Document</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{record.spCode} — {record.spTitle}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select ASD *</label>
                <select value={selectedAsd} onChange={e => setSelectedAsd(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100">
                  <option value="">Choose ASD...</option>
                  {ASD_USERS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowAllocateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={handleAllocate} disabled={!selectedAsd}
                className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed">
                Allocate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function InternalFisaPage() {
  const { currentRole } = useApp();
  const [activeTab, setActiveTab] = useState<FisaTab>('standards');
  const [records, setRecords] = useState<FisaStandardsRecord[]>(INITIAL_RECORDS);
  const [validationRecords, setValidationRecords] = useState<FisaValidationRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<FisaStandardsRecord | null>(null);
  const [selectedValidationRecord, setSelectedValidationRecord] = useState<FisaValidationRecord | null>(null);
  // Track IDs we've already seen so we can detect new arrivals
  const [seenValidationIds, setSeenValidationIds] = useState<Set<string>>(new Set());
  const [newFromStandardsCount, setNewFromStandardsCount] = useState(0);

  // Add this effect in InternalFisaPage to watch for SDP instrument submissions

  // Add this near the other useEffect hooks in InternalFisaPage component
useEffect(() => {
  const handleValidationUpdate = (event: CustomEvent) => {
    console.log('Custom event received - forcing refresh of validation records');
    // Force a reload of validation records
    const stored = localStorage.getItem('fisa_validation_submissions');
    if (stored) {
      const ext: any[] = JSON.parse(stored);
      const fisaStandardsSubs = ext.filter(sub => sub.sourceFrom === 'FISA Standards');
      
     const converted: FisaValidationRecord[] = fisaStandardsSubs.map(sub => ({
  id: sub.id,
  fisaCode: sub.fisaCode,
  fisaTitle: sub.fisaTitle,
  instrumentName: sub.instrumentName,
  validationDate: sub.validationDate || '',
  sourceFrom: sub.sourceFrom || 'FISA Standards',
  allocatedAsd: sub.allocatedAsd,
  // ↓ Trust stored currentStage first; only fall back to deriving from status
  currentStage: (() => {
    if (sub.currentStage && sub.currentStage !== 'assistant_director_allocation') {
      return sub.currentStage as ValidationStage;
    }
    switch (sub.status) {
      case 'allocated':
      case 'in_progress':     return 'asd_validation' as ValidationStage;
      case 'completed':       return 'completed' as ValidationStage;
      case 'deputy_director_review': return 'deputy_director_review' as ValidationStage;
      default:                return (sub.currentStage || 'assistant_director_allocation') as ValidationStage;
    }
  })(),
  examinerReport: sub.examinerReport ?? false,
  cvReceived: sub.cvReceived ?? false,
  confidentialityAgreement: sub.confidentialityAgreement ?? false,
  writtenInstrumentAndMemo: sub.writtenInstrumentAndMemo ?? false,
  practicalInstrumentAndRubric: sub.practicalInstrumentAndRubric ?? false,
  eisaValidationReportGenerated: sub.eisaValidationReportGenerated ?? false,
  deputyDirectorReviewStatus: sub.deputyDirectorReviewStatus ?? 'pending' as ReviewStatus,
  createdAt: sub.submissionDate || sub.createdAt,
  sdpPayload: sub.sdpPayload || null,
  // Carry over full report and review fields stored in localStorage
  eisaReport: sub.eisaReport || null,
  eisaReportSubmittedAt: sub.eisaReportSubmittedAt || null,
  adLiaisonNotes: sub.adLiaisonNotes || '',
  adContactedSdpDate: sub.adContactedSdpDate || '',
  adConfirmedDate: sub.adConfirmedDate || '',
  ddReviewNotes: sub.ddReviewNotes || '',
  ddRecommendation: sub.ddRecommendation || '',
  ddReviewedAt: sub.ddReviewedAt || '',
}));
      
      setValidationRecords(prev => {
        const prevIds = new Set(prev.map(r => r.id));
        const updated = prev.map(r => {
          const fresh = converted.find(c => c.id === r.id);
          if (!fresh) return r;
          return { ...r, ...fresh };
        });
        const newOnes = converted.filter(r => !prevIds.has(r.id));
        return [...updated, ...newOnes];
      });
    }
  };
  
  window.addEventListener('validationRecordsUpdated', handleValidationUpdate as EventListener);
  return () => window.removeEventListener('validationRecordsUpdated', handleValidationUpdate as EventListener);
}, []);
useEffect(() => {
  const watchSdpSubmissions = () => {
    const notifications = (() => {
      try { return JSON.parse(localStorage.getItem('fisa_sdp_notifications') || '[]'); } catch { return []; }
    })();
    
    const pendingWithInstrument = notifications.filter((n: any) => 
      n.status === 'instrument_submitted' && 
      !n.migrated_to_validation
    );
    
    if (pendingWithInstrument.length > 0) {
      const existingValidations = (() => {
        try { return JSON.parse(localStorage.getItem('fisa_validation_submissions') || '[]'); } catch { return []; }
      })();
      
      pendingWithInstrument.forEach((notif: any) => {
        if (!existingValidations.some((v: any) => v.sourceStandardsId === notif.sourceStandardsId)) {
          const validationRecord = {
            id: `FISA-VAL-${Date.now()}-${notif.sourceStandardsId}`,
            fisaCode: notif.spCode,
            fisaTitle: notif.spTitle,
            instrumentName: notif.instrumentFileName || `${notif.spCode} - Instrument`,
            validationDate: '',
            sourceFrom: 'FISA Standards',
            allocatedAsd: null,
            currentStage: 'assistant_director_allocation',
            examinerReport: false,
            cvReceived: false,
            confidentialityAgreement: false,
            writtenInstrumentAndMemo: false,
            practicalInstrumentAndRubric: false,
            eisaValidationReportGenerated: false,
            deputyDirectorReviewStatus: 'pending',
            createdAt: new Date().toISOString(),
            sdpPayload: {
              ...notif,
              instrumentFileName: notif.instrumentFileName,
              instrumentSubmittedAt: notif.instrumentSubmittedAt,
              status: 'pending_sdp_instrument',
              notifiedAt: notif.notifiedAt || new Date().toISOString(),
            }
          };
          
          existingValidations.push(validationRecord);
          
          // Mark as migrated
          notif.migrated_to_validation = true;
          notif.status = 'completed';
        }
      });
      
      localStorage.setItem('fisa_validation_submissions', JSON.stringify(existingValidations));
      localStorage.setItem('fisa_sdp_notifications', JSON.stringify(notifications));
      window.dispatchEvent(new StorageEvent('storage', { key: 'fisa_validation_submissions' }));
    }
  };
  
  const interval = setInterval(watchSdpSubmissions, 2000);
  return () => clearInterval(interval);
}, []);
  // Load QASA-routed records
  useEffect(() => {
    const load = () => {
      const routed = WorkflowBridgeService.getFisaStandardsRecords().map(convertQasaRecord);
      setRecords(prev => {
        const ids = new Set(prev.map(r => r.id));
        const fresh = routed.filter(r => !ids.has(r.id));
        if (fresh.length === 0) return prev;
        return [...prev, ...fresh];
      });
    };
    load();
    const handler = (e: StorageEvent) => { if (!e.key || e.key === 'fisa_standards_from_qasa') load(); };
    window.addEventListener('storage', handler);
    const interval = setInterval(load, 1500);
    return () => { window.removeEventListener('storage', handler); clearInterval(interval); };
  }, []);

  // Load external validation submissions (from SDP instrument uploads)
  useEffect(() => {
    const load = () => {
      const stored = localStorage.getItem('fisa_validation_submissions');
      if (!stored) return;
      const ext: any[] = JSON.parse(stored);

      // Only process FISA Standards records — QAS Addendum records are handled
      // by the Standards pipeline and never appear in the Validation tab directly
      const fisaStandardsSubs = ext.filter(sub => sub.sourceFrom === 'FISA Standards');

     const converted: FisaValidationRecord[] = fisaStandardsSubs.map(sub => ({
  id: sub.id,
  fisaCode: sub.fisaCode,
  fisaTitle: sub.fisaTitle,
  instrumentName: sub.instrumentName,
  validationDate: sub.validationDate || '',
  sourceFrom: sub.sourceFrom || 'FISA Standards',
  allocatedAsd: sub.allocatedAsd,
  // ↓ Trust stored currentStage first; only fall back to deriving from status
  currentStage: (() => {
    if (sub.currentStage && sub.currentStage !== 'assistant_director_allocation') {
      return sub.currentStage as ValidationStage;
    }
    switch (sub.status) {
      case 'allocated':
      case 'in_progress':     return 'asd_validation' as ValidationStage;
      case 'completed':       return 'completed' as ValidationStage;
      case 'deputy_director_review': return 'deputy_director_review' as ValidationStage;
      default:                return (sub.currentStage || 'assistant_director_allocation') as ValidationStage;
    }
  })(),
  examinerReport: sub.examinerReport ?? false,
  cvReceived: sub.cvReceived ?? false,
  confidentialityAgreement: sub.confidentialityAgreement ?? false,
  writtenInstrumentAndMemo: sub.writtenInstrumentAndMemo ?? false,
  practicalInstrumentAndRubric: sub.practicalInstrumentAndRubric ?? false,
  eisaValidationReportGenerated: sub.eisaValidationReportGenerated ?? false,
  deputyDirectorReviewStatus: sub.deputyDirectorReviewStatus ?? 'pending' as ReviewStatus,
  createdAt: sub.submissionDate || sub.createdAt,
  sdpPayload: sub.sdpPayload || null,
  // Carry over full report and review fields stored in localStorage
  eisaReport: sub.eisaReport || null,
  eisaReportSubmittedAt: sub.eisaReportSubmittedAt || null,
  adLiaisonNotes: sub.adLiaisonNotes || '',
  adContactedSdpDate: sub.adContactedSdpDate || '',
  adConfirmedDate: sub.adConfirmedDate || '',
  ddReviewNotes: sub.ddReviewNotes || '',
  ddRecommendation: sub.ddRecommendation || '',
  ddReviewedAt: sub.ddReviewedAt || '',
}));

      setValidationRecords(prev => {
        const prevIds = new Set(prev.map(r => r.id));
        // Update existing records: preserve in-memory action flags but refresh
        // sdpPayload, instrumentName, validationDate, allocatedAsd, currentStage from storage
        const updated = prev.map(r => {
          const fresh = converted.find(c => c.id === r.id);
          if (!fresh) return r;
          return {
            ...r,
            // Storage-authoritative fields (always sync from storage)
            instrumentName: fresh.instrumentName,
            validationDate: fresh.validationDate,
            allocatedAsd: fresh.allocatedAsd,
            currentStage: fresh.currentStage,
            sdpPayload: fresh.sdpPayload,
            // Preserve in-memory action flags unless storage has a truthy value
            examinerReport: fresh.examinerReport || r.examinerReport,
            cvReceived: fresh.cvReceived || r.cvReceived,
            confidentialityAgreement: fresh.confidentialityAgreement || r.confidentialityAgreement,
            writtenInstrumentAndMemo: fresh.writtenInstrumentAndMemo || r.writtenInstrumentAndMemo,
            practicalInstrumentAndRubric: fresh.practicalInstrumentAndRubric || r.practicalInstrumentAndRubric,
            eisaValidationReportGenerated: fresh.eisaValidationReportGenerated || r.eisaValidationReportGenerated,
            deputyDirectorReviewStatus: fresh.deputyDirectorReviewStatus !== 'pending' ? fresh.deputyDirectorReviewStatus : r.deputyDirectorReviewStatus,
          };
        });
        // Add genuinely new records
        const newOnes = converted.filter(r => !prevIds.has(r.id));
        if (newOnes.length === 0 && updated.every((r, i) => r === prev[i])) return prev;
        return [...updated, ...newOnes];
      });
    };
    load();
    const handler = (e: StorageEvent) => {
      if (e.key === 'fisa_validation_submissions' || e.key === 'fisa_sdp_notifications') load();
    };
    window.addEventListener('storage', handler);
    const interval = setInterval(load, 1500);
    return () => { window.removeEventListener('storage', handler); clearInterval(interval); };
  }, []);

  const updateRecord = (id: string, patch: Partial<FisaStandardsRecord>) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    const rec = records.find(r => r.id === id);
    if (rec?.isFromQasa) {
      const br = WorkflowBridgeService.getFisaStandardsRecords().find(r => r.id === id);
      if (br) WorkflowBridgeService.updateFisaStandardsRecord({ ...br, ...(patch as any) });
    }
    if (selectedRecord?.id === id) setSelectedRecord(prev => prev ? { ...prev, ...patch } : prev);
  };

  const visibleRecords = useMemo(() => records.filter(r => isVisibleForRole(r, currentRole)), [records, currentRole]);
  const visibleValidation = useMemo(() => validationRecords.filter(r => isValidationVisibleForRole(r, currentRole)), [validationRecords, currentRole]);

  // Persists validation record state changes to localStorage so polling doesn't reset them
const updateValidationRecord = (id: string, patch: Partial<FisaValidationRecord>) => {
  setValidationRecords(prev =>
    prev.map(r => r.id === id ? { ...r, ...patch } : r)
  );

  const stored = localStorage.getItem('fisa_validation_submissions');
  if (!stored) return;
  const ext: any[] = JSON.parse(stored);

  const updated = ext.map((s: any) => {
    if (s.id !== id) return s;
    const merged = { ...s, ...patch };

    if (patch.currentStage) {
      // Always persist currentStage directly so the load effect can trust it
      merged.currentStage = patch.currentStage;

      // Keep status in sync for backward compat, but currentStage is authoritative
      switch (patch.currentStage) {
        case 'assistant_director_allocation': merged.status = 'pending'; break;
        case 'asd_validation':               merged.status = 'in_progress'; break;
        case 'deputy_director_review':        merged.status = 'deputy_director_review'; break; // distinct value
        case 'completed':                     merged.status = 'completed'; break;
        default: break;
      }
    }

    if (merged.sdpPayload) {
      if (patch.currentStage === 'deputy_director_review') merged.sdpPayload.status = 'in_progress';
      if (patch.currentStage === 'completed')              merged.sdpPayload.status = 'completed';
    }

    return merged;
  });

  localStorage.setItem('fisa_validation_submissions', JSON.stringify(updated));
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'fisa_validation_submissions',
    newValue: JSON.stringify(updated),
  }));
  window.dispatchEvent(new CustomEvent('validationRecordsUpdated', { detail: { id, patch } }));
};
  // Auto-switch to Validation tab when a new instrument arrives from FISA Standards
  useEffect(() => {
    const fromStandards = validationRecords.filter(r => r.sourceFrom === 'FISA Standards');
    const newOnes = fromStandards.filter(r => !seenValidationIds.has(r.id));
    if (newOnes.length > 0) {
      setSeenValidationIds(prev => new Set([...prev, ...newOnes.map(r => r.id)]));
      setNewFromStandardsCount(prev => prev + newOnes.length);
      // Switch the tab so AD sees the new arrival immediately
      setActiveTab('validation');
    }
  }, [validationRecords]);

  const stats = useMemo(() => ({
    // Exclude records that are completed AND sent to external (databaseUpdated=true) — they've left Standards
    queue:     records.filter(r => r.currentStage !== 'completed').length,
    inReview:  records.filter(r => ['director_team_moderation', 'aic_moderation', 'qualifications_development_approval'].includes(r.currentStage)).length,
    completed: records.filter(r => r.currentStage === 'completed' && !r.databaseUpdated).length,
    sentToExternal: records.filter(r => r.currentStage === 'completed' && r.databaseUpdated).length,
    fromQasa:  records.filter(r => r.isFromQasa).length,
  }), [records]);

  const rl = currentRole || 'Unknown';

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 p-5 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-red-200 font-medium uppercase tracking-widest">Active Session</p>
              <p className="text-lg font-bold">{rl}</p>
            </div>
          </div>
          <p className="text-sm text-red-100 max-w-xs text-right hidden md:block">
            {currentRole === 'Deputy Director' ? 'Allocate SPs to ASD, then review completed applications'
              : currentRole === 'ASD' ? 'Evaluate the Curriculum — ELOs, AACs, and SP purpose'
              : currentRole === 'Director & Team' ? 'Review and moderate the ASD evaluation report'
              : currentRole === 'AIC' ? 'Review and validate the evaluation using the checklist'
              : currentRole === 'Qualifications Development' ? 'Review and approve — then return to Deputy Director'
              : 'Manage FISA standards evaluation and validation activities'}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">FISA</h2>
        <p className="mt-1 text-sm text-gray-500">Standards development pipeline and instrument validation management</p>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 pt-4">
          <div className="flex gap-1">
            {([
              { id: 'standards', label: 'FISA Standards', icon: '📐' },
              { id: 'validation', label: 'Validation of FISA', icon: '✅' },
            ] as { id: FisaTab; label: string; icon: string }[]).map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'validation') setNewFromStandardsCount(0); }}
                className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all
                  ${activeTab === tab.id ? 'border-red-500 text-red-700 bg-red-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                <span>{tab.icon}</span>{tab.label}
                {tab.id === 'validation' && newFromStandardsCount > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold">
                    {newFromStandardsCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* ── STANDARDS ── */}
          {activeTab === 'standards' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard label="Standards Queue"      value={stats.queue}           color="from-slate-500 to-slate-700" />
                <StatCard label="In Review"            value={stats.inReview}        color="from-amber-500 to-orange-600" />
                <StatCard label="Sent to Validation"   value={stats.sentToExternal}  color="from-emerald-500 to-teal-600" />
                <StatCard label="Routed from QASA"     value={stats.fromQasa}        color="from-violet-500 to-purple-600" />
              </div>

              {/* Pipeline tiles */}
              <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {STANDARDS_PIPELINE.map(step => {
                  const count = step.key === 'completed'
                    ? records.filter(r => r.currentStage === step.key && !r.databaseUpdated).length
                    : records.filter(r => r.currentStage === step.key).length;
                  return (
                    <div key={step.key} className="rounded-2xl border bg-white p-3 text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-xl mb-1">{step.icon}</div>
                      <p className="text-xs font-semibold text-gray-700 leading-tight">{step.label}</p>
                      {count > 0 && <div className="mt-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold">{count}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Table */}
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50/80">
                  <h3 className="text-base font-semibold text-gray-900">Standards Register</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Showing {visibleRecords.length} record{visibleRecords.length !== 1 ? 's' : ''} visible to {rl}</p>
                </div>
                {visibleRecords.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <FilePenLine className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="font-medium text-gray-500">No standards records at this stage</p>
                    <p className="text-sm text-gray-400 mt-1">Records appear here when they reach your workflow stage.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50/60 border-b">
                          {['#', 'SP Document', 'Curriculum', 'ASD', 'Source', 'Stage', ''].map(h => (
                            <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRecords.map((record, idx) => (
                          <tr key={record.id} className="border-b last:border-0 hover:bg-red-50/20 transition-colors group">
                            <td className="px-5 py-4 text-gray-400 text-xs font-mono align-top">{String(idx + 1).padStart(2, '0')}</td>
                            <td className="px-5 py-4 align-top">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 whitespace-nowrap">{record.spCode}</span>
                                {record.isFromQasa && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 text-violet-700"><Sparkles className="h-2.5 w-2.5" />QASA</span>}
                              </div>
                              <div className="mt-0.5 text-xs text-gray-500 max-w-[180px] truncate" title={record.spTitle}>{record.spTitle}</div>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="font-semibold text-gray-900 whitespace-nowrap">{record.curriculumCode}</div>
                              <div className="mt-0.5 text-xs text-gray-500 max-w-[160px] truncate">{record.curriculumTitle}</div>
                            </td>
                            <td className="px-5 py-4 align-top text-sm text-gray-600">{record.allocatedAsd || <span className="text-gray-300">—</span>}</td>
                            <td className="px-5 py-4 align-top">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${record.sourceFrom === 'QASA Approval' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}>
                                {record.sourceFrom}
                              </span>
                            </td>
                            <td className="px-5 py-4 align-top"><StagePill stage={record.currentStage} /></td>
                            <td className="px-5 py-4 align-top">
                              <button onClick={() => setSelectedRecord(record)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-lg hover:bg-red-100 flex items-center justify-center">
                                <Eye className="h-4 w-4 text-red-600" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── VALIDATION ── */}
          {activeTab === 'validation' && (
            <div className="space-y-6">
              {/* New-arrival banner — shown to AD when instrument just landed from Standards */}
              {newFromStandardsCount > 0 && (currentRole === 'Assistant Director' || currentRole === 'Deputy Director') && (
                <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileCheck2 className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-800">
                        {newFromStandardsCount} new instrument{newFromStandardsCount > 1 ? 's' : ''} submitted from the FISA Standards pipeline
                      </p>
                      <p className="text-xs text-red-600 mt-0.5">
                        The SDP has uploaded the validation instrument. Review the details and allocate to an ASD to schedule the validation date.
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setNewFromStandardsCount(0)}
                    className="h-7 w-7 rounded-lg hover:bg-red-100 flex items-center justify-center flex-shrink-0">
                    <X className="h-3.5 w-3.5 text-red-400" />
                  </button>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard label="Awaiting Allocation"    value={validationRecords.filter(r => r.currentStage === 'assistant_director_allocation').length} color="from-amber-500 to-orange-600" />
                <StatCard label="In Progress"            value={validationRecords.filter(r => r.currentStage === 'asd_validation').length}                color="from-blue-500 to-indigo-600" />
                <StatCard label="Completed Validations"  value={validationRecords.filter(r => r.currentStage === 'completed').length}                    color="from-emerald-500 to-teal-600" />
              </div>
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50/80 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Validation Register</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Showing {visibleValidation.length} record{visibleValidation.length !== 1 ? 's' : ''} visible to {rl}</p>
                  </div>
                </div>
                {visibleValidation.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <FileCheck2 className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="font-medium text-gray-500">No validation records at this stage</p>
                    <p className="text-sm text-gray-400 mt-1">Records arrive here once the SDP uploads the instrument from the FISA Standards pipeline.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50/60 border-b">
                          {['#', 'FISA / SP', 'Instrument', 'Source', 'Validation Date', 'ASD', 'Stage', ''].map(h => (
                            <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visibleValidation.map((record, idx) => {
                          const isFromStandards = record.sourceFrom === 'FISA Standards';
                          return (
                            <tr key={record.id} className={`border-b last:border-0 transition-colors group ${isFromStandards ? 'bg-red-50/10 hover:bg-red-50/30' : 'hover:bg-red-50/20'}`}>
                              <td className="px-5 py-4 text-gray-400 text-xs font-mono align-top">{String(idx + 1).padStart(2, '0')}</td>
                              <td className="px-5 py-4 align-top">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">{record.fisaCode}</span>
                                  {isFromStandards && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">📐 Standards</span>
                                  )}
                                </div>
                                <div className="mt-0.5 text-xs text-gray-500 max-w-[180px] truncate">{record.fisaTitle}</div>
                              </td>
                              <td className="px-5 py-4 align-top">
                                <div className="font-medium text-gray-900">{record.instrumentName}</div>
                                {record.sdpPayload?.instrumentFileName && record.sdpPayload.instrumentFileName !== record.instrumentName && (
                                  <div className="mt-0.5 text-xs text-emerald-600 font-mono truncate max-w-[160px]">📎 {record.sdpPayload.instrumentFileName}</div>
                                )}
                              </td>
                              <td className="px-5 py-4 align-top">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${isFromStandards ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                  {record.sourceFrom}
                                </span>
                              </td>
                              <td className="px-5 py-4 align-top text-sm text-gray-600">{record.validationDate || '—'}</td>
                              <td className="px-5 py-4 align-top text-sm text-gray-600">{record.allocatedAsd || '—'}</td>
                              <td className="px-5 py-4 align-top"><ValidationStagePill stage={record.currentStage} /></td>
                              <td className="px-5 py-4 align-top">
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setSelectedValidationRecord(record)} className="h-8 w-8 rounded-lg hover:bg-red-100 flex items-center justify-center">
                                    <Eye className="h-4 w-4 text-red-600" />
                                  </button>
                                  {currentRole === 'Assistant Director' && record.currentStage === 'assistant_director_allocation' && (
                                    <button onClick={() => setSelectedValidationRecord(record)}
                                      className="h-8 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 flex items-center gap-1">
                                      <Users className="h-3.5 w-3.5" />Allocate
                                    </button>
                                  )}
                                  {currentRole === 'ASD' && record.currentStage === 'asd_validation' && (
                                    <button onClick={() => updateValidationRecord(record.id, {
                                      examinerReport: true, cvReceived: true, confidentialityAgreement: true,
                                      writtenInstrumentAndMemo: true, practicalInstrumentAndRubric: true,
                                      eisaValidationReportGenerated: true, currentStage: 'deputy_director_review',
                                      deputyDirectorReviewStatus: 'in_progress',
                                    })}
                                      className="h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1">
                                      <FileCheck2 className="h-3.5 w-3.5" />Generate Report
                                    </button>
                                  )}
                                  {currentRole === 'Deputy Director' && record.currentStage === 'deputy_director_review' && record.eisaValidationReportGenerated && (
                                    <button onClick={() => updateValidationRecord(record.id, {
                                      deputyDirectorReviewStatus: 'approved', currentStage: 'completed',
                                    })}
                                      className="h-8 px-3 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1">
                                      <ClipboardCheck className="h-3.5 w-3.5" />Review OK
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {selectedValidationRecord && (
                <ValidationDetailsModal
                  record={selectedValidationRecord}
                  key={selectedValidationRecord.id}
                  currentRole={currentRole}
                  onClose={() => setSelectedValidationRecord(null)}
                  onUpdate={(patch) => {
                    updateValidationRecord(selectedValidationRecord.id, patch);
                    setSelectedValidationRecord(prev => prev ? { ...prev, ...patch } : prev);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Standards detail modal */}
      {selectedRecord && (
        <StandardsDetailModal
          record={selectedRecord}
          currentRole={currentRole}
          onClose={() => setSelectedRecord(null)}
          onUpdate={(patch) => updateRecord(selectedRecord.id, patch)}
        />
      )}

    </div>
  );
}

// ── EISA Checklist Section Form (editable) ───────────────────────────────────
function EisaChecklistSectionForm({
  section, title, color, onChange,
}: {
  section: EisaChecklistSection; title: string;
  color: 'blue' | 'indigo' | 'purple' | 'teal';
  onChange: (s: EisaChecklistSection) => void;
}) {
  const cm = {
    blue:   { header: 'bg-blue-50 border-blue-200',   text: 'text-blue-800'   },
    indigo: { header: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800' },
    purple: { header: 'bg-purple-50 border-purple-200', text: 'text-purple-800' },
    teal:   { header: 'bg-teal-50 border-teal-200',     text: 'text-teal-800'   },
  }[color];
  const yesCount = section.items.filter(i => i.yes).length;

  const setItem = (id: string, val: 'yes' | 'no') =>
    onChange({
      ...section,
      items: section.items.map(i => i.id === id
        ? { ...i, yes: val === 'yes', no: val === 'no' }
        : i),
    });

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className={`px-4 py-3 border-b flex items-center justify-between ${cm.header}`}>
        <p className={`text-xs font-bold uppercase tracking-wider ${cm.text}`}>{title}</p>
        <span className="text-xs text-gray-500">{yesCount}/{section.items.length} Yes</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Criteria</th>
            <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-16">Yes</th>
            <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-16">No</th>
          </tr></thead>
          <tbody>
            {section.items.map((item, ii) => (
              <tr key={item.id} className={`border-b last:border-0 ${ii % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                <td className="px-4 py-2.5 text-sm text-gray-700">{item.text}</td>
                <td className="px-3 py-2.5 text-center">
                  <button onClick={() => setItem(item.id, 'yes')}
                    className={`h-7 w-7 rounded-lg border-2 flex items-center justify-center mx-auto transition-all ${item.yes ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 bg-white hover:border-emerald-300'}`}>
                    {item.yes && <CheckCircle2 className="h-4 w-4 text-white" />}
                  </button>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <button onClick={() => setItem(item.id, 'no')}
                    className={`h-7 w-7 rounded-lg border-2 flex items-center justify-center mx-auto transition-all ${item.no ? 'bg-red-500 border-red-500' : 'border-gray-200 bg-white hover:border-red-300'}`}>
                    {item.no && <X className="h-4 w-4 text-white" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 space-y-3 border-t bg-gray-50/40">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Findings & Recommendations before commencement of EISA</label>
          <textarea value={section.findingsBeforeEisa}
            onChange={e => onChange({ ...section, findingsBeforeEisa: e.target.value })}
            rows={2} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none resize-none"
            placeholder="Enter findings before EISA..." />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Recommendations for improvement going forward</label>
          <textarea value={section.recommendationsForward}
            onChange={e => onChange({ ...section, recommendationsForward: e.target.value })}
            rows={2} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none resize-none"
            placeholder="Enter recommendations going forward..." />
        </div>
      </div>
    </div>
  );
}

// ── EISA Checklist Section Read-Only ─────────────────────────────────────────
function EisaChecklistSectionReadOnly({ section, title, color }: {
  section: EisaChecklistSection; title: string;
  color: 'blue' | 'indigo' | 'purple' | 'teal';
}) {
  const cm = {
    blue:   { header: 'bg-blue-50 border-blue-200',   text: 'text-blue-800'   },
    indigo: { header: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800' },
    purple: { header: 'bg-purple-50 border-purple-200', text: 'text-purple-800' },
    teal:   { header: 'bg-teal-50 border-teal-200',     text: 'text-teal-800'   },
  }[color];
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className={`px-4 py-3 border-b ${cm.header}`}>
        <p className={`text-xs font-bold uppercase tracking-wider ${cm.text}`}>{title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Criteria</th>
            <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-16">Yes</th>
            <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500 w-16">No</th>
          </tr></thead>
          <tbody>
            {section.items.map((item, ii) => (
              <tr key={item.id} className={`border-b last:border-0 ${ii % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                <td className="px-4 py-2.5 text-sm text-gray-700">{item.text}</td>
                <td className="px-3 py-2.5 text-center">
                  <div className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto ${item.yes ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 bg-gray-50'}`}>
                    {item.yes && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className={`h-6 w-6 rounded border-2 flex items-center justify-center mx-auto ${item.no ? 'bg-red-500 border-red-500' : 'border-gray-200 bg-gray-50'}`}>
                    {item.no && <X className="h-3.5 w-3.5 text-white" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(section.findingsBeforeEisa || section.recommendationsForward) && (
        <div className="p-4 space-y-2 border-t bg-gray-50/40">
          {section.findingsBeforeEisa && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Findings before EISA</p>
              <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border whitespace-pre-wrap">{section.findingsBeforeEisa}</p>
            </div>
          )}
          {section.recommendationsForward && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Recommendations going forward</p>
              <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border whitespace-pre-wrap">{section.recommendationsForward}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Validation Details Modal ──────────────────────────────────────────────────
function ValidationDetailsModal({
  record, onClose, onUpdate, currentRole,
}: {
  record: FisaValidationRecord;
  onClose: () => void;
  onUpdate: (patch: Partial<FisaValidationRecord>) => void;
  currentRole: AppRole;
}) {
  type ValTab = 'validation' | 'allocation' | 'conduct_validation' | 'dd_review' | 'standards_details' | 'evaluation_report' | 'reviews';
  const [activeTab, setActiveTab] = useState<ValTab>('validation');

  const sdp = record.sdpPayload as Record<string, any> | null | undefined;
  const isFromStandards = record.sourceFrom === 'FISA Standards';

  // AD liaison state
  const [adLiaisonNotes, setAdLiaisonNotes] = useState(record.adLiaisonNotes || '');
  const [adContactedDate, setAdContactedDate] = useState(record.adContactedSdpDate || '');
  const [adConfirmedDate, setAdConfirmedDate] = useState(record.adConfirmedDate || '');
  const [selectedAsd, setSelectedAsd] = useState(record.allocatedAsd || '');
  const [valDate, setValDate] = useState(record.validationDate || '');

  // ASD EISA report state
  const [eisaReport, setEisaReport] = useState<EisaValidationReport>(() =>
    record.eisaReport ? { ...record.eisaReport } : makeEmptyEisaReport(record)
  );

  // DD review state
  const [ddNotes, setDdNotes] = useState(record.ddReviewNotes || '');
  const [ddRec, setDdRec] = useState<'approved' | 'approved_with_conditions' | 'not_approved' | ''>(record.ddRecommendation || '');

  const isAD = currentRole === 'Assistant Director';
  const isASD = currentRole === 'ASD';
  const isDD = currentRole === 'Deputy Director';

  const canAllocate = isAD && record.currentStage === 'assistant_director_allocation';
  const canConduct  = isASD && record.currentStage === 'asd_validation';
  const canDDReview = isDD && record.currentStage === 'deputy_director_review';

  const handleADSubmit = () => {
    if (!selectedAsd || !valDate) { alert('Please select an ASD and confirm the validation date.'); return; }
    onUpdate({
      allocatedAsd: selectedAsd, validationDate: valDate,
      adLiaisonNotes, adContactedSdpDate: adContactedDate, adConfirmedDate,
      currentStage: 'asd_validation',
    });
    onClose();
  };

const handleASDSubmit = () => {
  if (!eisaReport.completedByFullName || !eisaReport.completedByDate) {
    alert('Please complete the QA Checklist header fields (Full Name and Date).');
    return;
  }
  
  console.log('ASD Submitting report...', {
    recordId: record.id,
    currentStage: record.currentStage,
    newStage: 'deputy_director_review'
  });
  
  onUpdate({
    eisaReport, 
    eisaReportSubmittedAt: new Date().toISOString(),
    examinerReport: true, 
    cvReceived: true, 
    confidentialityAgreement: true,
    writtenInstrumentAndMemo: true, 
    practicalInstrumentAndRubric: true,
    eisaValidationReportGenerated: true,
    currentStage: 'deputy_director_review', 
    deputyDirectorReviewStatus: 'in_progress',
  });
  
  console.log('Update called, closing modal');
  
  // Force close the modal
  onClose();
  
  // Force a page refresh for the ASD view by triggering a storage event
  setTimeout(() => {
    const stored = localStorage.getItem('fisa_validation_submissions');
    if (stored) {
      window.dispatchEvent(new StorageEvent('storage', { 
        key: 'fisa_validation_submissions',
        newValue: stored
      }));
    }
  }, 100);
};
const handleDDSubmit = () => {
  if (!ddRec) { alert('Please select a recommendation before submitting.'); return; }

  onUpdate({
    ddReviewNotes: ddNotes,
    ddRecommendation: ddRec,
    ddReviewedAt: new Date().toISOString(),
    deputyDirectorReviewStatus: 'approved',
    currentStage: 'completed',
  });

  // Write result back to fisa_sdp_notifications
  const notifKey = 'fisa_sdp_notifications';
  const notifs: any[] = (() => {
    try { return JSON.parse(localStorage.getItem(notifKey) || '[]'); } catch { return []; }
  })();
  
  const updatedNotifs = notifs.map((n: any) =>
    n.sourceStandardsId === record.id || n.id === sdp?.id
      ? { ...n, validationOutcome: ddRec, validationNotes: ddNotes, validationCompletedAt: new Date().toISOString() }
      : n
  );
  localStorage.setItem(notifKey, JSON.stringify(updatedNotifs));
  window.dispatchEvent(new StorageEvent('storage', { key: notifKey }));

  // ── Create a Site Visits & Monitoring record for the external SDP ──
  const SITE_KEY = 'site_visits_monitoring_records';
  const existing: any[] = (() => {
    try { return JSON.parse(localStorage.getItem(SITE_KEY) || '[]'); } catch { return []; }
  })();

  // Idempotency: don't create twice for the same FISA validation record
  const sourceId = record.id;
  if (!existing.some((r: any) => r.fisaValidationSourceId === sourceId)) {
    const newRecord = {
      id: `FISA-RESULT-${Date.now()}`,
      fisaValidationSourceId: sourceId,
      
      // Process type - marked_moderated_scripts for results
      processType: 'marked_moderated_scripts' as const,
      
      // Display fields
      title: sdp?.spTitle || record.fisaTitle,
      sourceFrom: 'FISA Validation',
      submittedBy: 'Deputy Director',
      siteName: sdp?.nameOfAQP || sdp?.spTitle || record.fisaTitle,
      visitDate: sdp?.instrumentSubmittedAt
        ? new Date(sdp.instrumentSubmittedAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      
      // IMPORTANT: Set stage to 'incoming_request' for Notifications & Submissions tab
      stage: 'incoming_request' as const,
      subStage: 'eisa_notification_received' as const,
      
      // Set these to FALSE so toExternalStage returns 'submitted_to_assessment'
      eisaNotificationSubmitted: true,
      approvedResultsSubmitted: false,
      schedulePrepared: false,        // FALSE - so it's in submitted_to_assessment
      monthlyPlanPrepared: false,     // FALSE - so it's in submitted_to_assessment
      competencyRateChecked: false,
      sdpIdentified: false,
      siteVisitBooked: false,
      evaluationToolCompleted: false,
      evaluationReportCompiled: false, // FALSE - so it's NOT in report_outcome_available
      pemReportGenerated: false,
      sentToQp: false,                // FALSE - so it's NOT in closed
      
      // Approval statuses - all pending initially
      deputyDirectorStatus: 'pending' as const,
      domainDirectorStatus: 'pending' as const,
      directorStatus: 'pending' as const,
      
      createdAt: new Date().toISOString(),
      
      // Registration / qualification metadata
      eisaRegNo: `FISA-${sdp?.spCode || record.fisaCode}`,
      saqaId: sdp?.saqaId || '',
      nqfLevel: sdp?.nqfLevel || '',
      credits: sdp?.credits || '',
      
      // Carry FISA validation outcome so external SDP can see the result
      outcomeDecision: ddRec,
      outcomeReport: {
        ddRecommendations: ddNotes,
        ddChangesRequired: '',
        outcomeDecision: ddRec,
        outcomeNotes: ddNotes,
        ddReviewedBy: currentRole || 'Deputy Director',
        ddReviewedAt: new Date().toISOString(),
        reportFinalised: true,
        reportFinalisedAt: new Date().toISOString(),
      },
      fisaEisaReport: record.eisaReport || null,
      fisa_sdp_payload: sdp || null,
      
      // QA Evaluation Report (not available yet)
      qaEvaluationReport: null,
    };

    const updated = [newRecord, ...existing];
    localStorage.setItem(SITE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: SITE_KEY }));
    console.log('Created Site Visit record for SDP in Notifications & Submissions:', newRecord.id);
  }

  onClose();
};
  const updateEisaSection = (key: keyof Pick<EisaValidationReport, 'qasAddendum' | 'examinerDeveloper' | 'moderator' | 'overallEvaluation'>) =>
    (s: EisaChecklistSection) => setEisaReport(prev => ({ ...prev, [key]: s }));

  const tabs = ([
    { id: 'validation',        label: 'Validation Info',    icon: '✅', show: true },
    { id: 'allocation',        label: 'AD Allocation',      icon: '📋', show: isFromStandards && (isAD || !!record.allocatedAsd) },
    { id: 'conduct_validation',label: 'Conduct Validation', icon: '🔍', show: isFromStandards && (isASD || !!record.eisaReport) },
    { id: 'dd_review',         label: 'DD Review',          icon: '👔', show: isFromStandards && (isDD || !!record.ddRecommendation) },
    { id: 'standards_details', label: 'Standards Details',  icon: '📐', show: isFromStandards && !!sdp },
    { id: 'evaluation_report', label: 'Evaluation Report',  icon: '📝', show: isFromStandards && !!sdp?.evaluationReport },
    { id: 'reviews',           label: 'Review Records',     icon: '🔍', show: isFromStandards && (!!sdp?.directorTeamChecklist || !!sdp?.aicChecklist || !!sdp?.qualDevChecklist) },
  ] as { id: ValTab; label: string; icon: string; show?: boolean }[]).filter(t => t.show !== false);

  const recCfgMap: Record<string, { bg: string; label: string }> = {
    approved:                 { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Approved' },
    approved_with_conditions: { bg: 'bg-amber-50 border-amber-200 text-amber-700',       label: 'Approved with Conditions' },
    not_approved:             { bg: 'bg-red-50 border-red-200 text-red-700',             label: 'Not Approved' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ValidationStagePill stage={record.currentStage} />
              {isFromStandards && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                  📐 From FISA Standards
                </span>
              )}
              {record.ddRecommendation && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${recCfgMap[record.ddRecommendation]?.bg}`}>
                  {recCfgMap[record.ddRecommendation]?.label}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {sdp?.spCode ? `${sdp.spCode} — ${sdp.spTitle}` : `${record.fisaCode} — ${record.fisaTitle}`}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">FISA validation record</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-gray-100 flex items-center justify-center flex-shrink-0">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 border-b bg-white flex-shrink-0 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap
                ${activeTab === tab.id ? 'border-red-500 text-red-700 bg-red-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── VALIDATION INFO TAB ── */}
          {activeTab === 'validation' && (
            <div className="space-y-5">
              <div className={`rounded-2xl border p-4 flex items-start gap-3 ${isFromStandards ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-gray-50'}`}>
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isFromStandards ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                  <FileText className={`h-4 w-4 ${isFromStandards ? 'text-emerald-600' : 'text-gray-500'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isFromStandards ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {isFromStandards ? 'Instrument for Validation (uploaded by SDP)' : 'Instrument'}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5 font-mono break-all">{record.instrumentName}</p>
                  {sdp?.instrumentFileName && sdp.instrumentFileName !== record.instrumentName && (
                    <p className="text-xs text-emerald-600 font-mono mt-0.5">📎 {sdp.instrumentFileName}</p>
                  )}
                  {sdp?.instrumentSubmittedAt && (
                    <p className="text-xs text-emerald-600 mt-0.5">Submitted: {new Date(sdp.instrumentSubmittedAt).toLocaleDateString('en-ZA')}</p>
                  )}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Validation Information</p></div>
                  <div className="px-4 divide-y divide-gray-50">
                    <DetailRow icon={BookOpen} label="FISA / SP Title"  value={sdp?.spTitle || record.fisaTitle} />
                    <DetailRow icon={Hash}     label="SP Code"          value={sdp?.spCode ? <span className="font-mono">{sdp.spCode}</span> : record.fisaCode} />
                    <DetailRow icon={Calendar} label="Validation Date"  value={record.validationDate || '—'} />
                    <DetailRow icon={User}     label="Allocated ASD"    value={record.allocatedAsd || '—'} />
                    {sdp?.nameOfAQP && <DetailRow icon={User}  label="Name of AQP" value={sdp.nameOfAQP} />}
                    {sdp?.nqfLevel  && <DetailRow icon={Award} label="NQF Level"   value={sdp.nqfLevel} />}
                    {sdp?.credits   && <DetailRow icon={Hash}  label="Credits"     value={sdp.credits} />}
                  </div>
                </div>
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instrument Validation Tool</p></div>
                  <div className="p-4 space-y-2">
                    {[
                      { label: 'Examiner Report',                      done: record.examinerReport },
                      { label: 'CV',                                   done: record.cvReceived },
                      { label: 'Confidentiality Agreement',            done: record.confidentialityAgreement },
                      { label: 'FISA Instrument & Memo (Written)',     done: record.writtenInstrumentAndMemo },
                      { label: 'FISA Instrument & Rubric (Practical)', done: record.practicalInstrumentAndRubric },
                      { label: 'EISA Validation Report',               done: record.eisaValidationReportGenerated },
                    ].map(item => (
                      <div key={item.label} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${item.done ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-50 text-gray-500'}`}>
                        <div className={`h-5 w-5 rounded flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                          {item.done && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                        </div>
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {record.ddRecommendation && (
                <div className={`rounded-2xl border p-4 flex items-start gap-3 ${recCfgMap[record.ddRecommendation]?.bg}`}>
                  <BadgeCheck className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">DD Final Recommendation: {recCfgMap[record.ddRecommendation]?.label}</p>
                    {record.ddReviewNotes && <p className="text-xs mt-1 opacity-80 whitespace-pre-wrap">{record.ddReviewNotes}</p>}
                    {record.ddReviewedAt && <p className="text-xs mt-1 opacity-60">Reviewed: {new Date(record.ddReviewedAt).toLocaleDateString('en-ZA')}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── AD ALLOCATION TAB ── */}
          {activeTab === 'allocation' && (
            <div className="space-y-5">
              {canAllocate ? (
                <>
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Assistant Director — Liaise with SDP & Allocate to ASD</p>
                      <p className="text-xs text-blue-600 mt-0.5">Confirm the validation date with the SDP, document the liaison, and allocate to an ASD for validation.</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SDP Liaison Details</p></div>
                    <div className="p-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date SDP Contacted *</label>
                          <input type="date" value={adContactedDate} onChange={e => setAdContactedDate(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Confirmed Validation Date *</label>
                          <input type="date" value={adConfirmedDate} onChange={e => setAdConfirmedDate(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Liaison Notes</label>
                        <textarea value={adLiaisonNotes} onChange={e => setAdLiaisonNotes(e.target.value)} rows={3}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none resize-none"
                          placeholder="Document the communication with the SDP, agreed date, special requirements..." />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Allocate to ASD</p></div>
                    <div className="p-4 grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Select ASD *</label>
                        <select value={selectedAsd} onChange={e => setSelectedAsd(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none">
                          <option value="">Choose ASD...</option>
                          {ASD_USERS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Validation Date *</label>
                        <input type="date" value={valDate} onChange={e => setValDate(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                    <button onClick={handleADSubmit} disabled={!selectedAsd || !valDate}
                      className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
                      <Send className="h-4 w-4" />Submit to ASD for Validation
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border bg-emerald-50 border-emerald-200 px-5 py-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-800">Allocation completed by Assistant Director</p>
                  </div>
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Allocation Details</p></div>
                    <div className="px-4 divide-y divide-gray-50">
                      <DetailRow icon={User}     label="Allocated ASD"          value={record.allocatedAsd || '—'} />
                      <DetailRow icon={Calendar} label="Validation Date"         value={record.validationDate || '—'} />
                      <DetailRow icon={Calendar} label="Date SDP Contacted"      value={record.adContactedSdpDate || '—'} />
                      <DetailRow icon={Calendar} label="Confirmed Validation Date" value={record.adConfirmedDate || '—'} />
                    </div>
                  </div>
                  {record.adLiaisonNotes && (
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Liaison Notes</p></div>
                      <p className="p-4 text-sm text-gray-700 whitespace-pre-wrap">{record.adLiaisonNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── CONDUCT VALIDATION TAB (ASD fills in EISA checklist) ── */}
          {activeTab === 'conduct_validation' && (
            <div className="space-y-5">
              {canConduct ? (
                <>
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ClipboardCheck className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-800">ASD — Conduct Validation of Instrument</p>
                      <p className="text-xs text-purple-600 mt-0.5">Complete the QA Validation of Assessment Instrument Checklist, then submit to Deputy Director for review.</p>
                    </div>
                  </div>

                  {/* Report header */}
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-purple-50 border-b border-purple-200">
                      <p className="text-xs font-bold text-purple-900 uppercase tracking-wider">QA VALIDATION OF ASSESSMENT INSTRUMENT CHECKLIST</p>
                      <p className="text-xs text-purple-600 mt-0.5">QCTO — Assessment Quality Assurance</p>
                    </div>
                    <div className="p-4 grid md:grid-cols-2 gap-4">
                      {[
                        { label: 'Name of QP', key: 'nameOfQp' as const },
                        { label: 'Address of QP', key: 'addressOfQp' as const },
                        { label: 'Contact Number', key: 'contactNumber' as const },
                        { label: 'Contact Person', key: 'contactPerson' as const },
                        { label: 'Title of Qualification', key: 'titleOfQualification' as const },
                        { label: 'Qualification Registration Status', key: 'qualificationRegStatus' as const },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{f.label}</label>
                          <input value={(eisaReport as any)[f.key]} onChange={e => setEisaReport(p => ({ ...p, [f.key]: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none"
                            placeholder={f.label} />
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">SAQA ID</label>
                        <input value={eisaReport.saqaId} onChange={e => setEisaReport(p => ({ ...p, saqaId: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono focus:border-purple-400 focus:outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Credits</label>
                          <input value={eisaReport.credits} onChange={e => setEisaReport(p => ({ ...p, credits: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">NQF Level</label>
                          <input value={eisaReport.nqfLevel} onChange={e => setEisaReport(p => ({ ...p, nqfLevel: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date of Upcoming EISA</label>
                        <input type="date" value={eisaReport.dateOfEisa} onChange={e => setEisaReport(p => ({ ...p, dateOfEisa: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date Instrument/Exemplar Viewed</label>
                        <input type="date" value={eisaReport.dateInstrumentViewed} onChange={e => setEisaReport(p => ({ ...p, dateInstrumentViewed: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none" />
                      </div>
                    </div>
                    {/* Completed by */}
                    <div className="px-4 pb-4 border-t pt-4 bg-gray-50/40">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">QA Checklist Completed By</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Full Name *</label>
                          <input value={eisaReport.completedByFullName} onChange={e => setEisaReport(p => ({ ...p, completedByFullName: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none" placeholder="Full name" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Designation</label>
                          <input value={eisaReport.completedByDesignation} onChange={e => setEisaReport(p => ({ ...p, completedByDesignation: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none" placeholder="e.g. ASD" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Date *</label>
                          <input type="date" value={eisaReport.completedByDate} onChange={e => setEisaReport(p => ({ ...p, completedByDate: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Date of Previous Validation</label>
                          <input type="date" value={eisaReport.dateOfPreviousValidation} onChange={e => setEisaReport(p => ({ ...p, dateOfPreviousValidation: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Previous Recommendations</label>
                          <textarea value={eisaReport.previousRecommendations} onChange={e => setEisaReport(p => ({ ...p, previousRecommendations: e.target.value }))}
                            rows={2} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none resize-none"
                            placeholder="Previous recommendations..." />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Four checklist sections */}
                  <EisaChecklistSectionForm section={eisaReport.qasAddendum} title="Section 1 — QAS Addendum" color="blue"
                    onChange={updateEisaSection('qasAddendum')} />
                  <EisaChecklistSectionForm section={eisaReport.examinerDeveloper} title="Section 2 — Examiner/Developer Details and Findings" color="indigo"
                    onChange={updateEisaSection('examinerDeveloper')} />
                  <EisaChecklistSectionForm section={eisaReport.moderator} title="Section 3 — Moderator Details and Findings" color="purple"
                    onChange={updateEisaSection('moderator')} />
                  <EisaChecklistSectionForm section={eisaReport.overallEvaluation} title="Section 4 — Overall Evaluation" color="teal"
                    onChange={updateEisaSection('overallEvaluation')} />

                  {/* Overall outcome */}
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200">
                      <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Overall Outcome & Recommendation</p>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Overall Recommendation *</label>
                        <div className="grid md:grid-cols-3 gap-2">
                          {([
                            { value: 'approved' as const,                 label: 'Approved',                  color: 'emerald' },
                            { value: 'approved_with_conditions' as const, label: 'Approved with Conditions', color: 'amber'   },
                            { value: 'not_approved' as const,             label: 'Not Approved',              color: 'red'     },
                          ]).map(opt => (
                            <button key={opt.value} onClick={() => setEisaReport(p => ({ ...p, overallRecommendation: opt.value }))}
                              className={`px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                                ${eisaReport.overallRecommendation === opt.value
                                  ? opt.color === 'emerald' ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : opt.color === 'amber' ? 'bg-amber-500 border-amber-500 text-white'
                                    : 'bg-red-500 border-red-500 text-white'
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Overall Findings</label>
                        <textarea value={eisaReport.overallFindings} onChange={e => setEisaReport(p => ({ ...p, overallFindings: e.target.value }))}
                          rows={3} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none resize-none"
                          placeholder="Summarise overall findings from the validation..." />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                    <button onClick={handleASDSubmit}
                      className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700">
                      <Send className="h-4 w-4" />Submit EISA Report to Deputy Director
                    </button>
                  </div>
                </>
              ) : record.eisaReport ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border bg-emerald-50 border-emerald-200 px-5 py-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-800">Read-only — EISA Validation Report completed by ASD</p>
                    {record.eisaReportSubmittedAt && (
                      <span className="ml-auto text-xs text-emerald-600">{new Date(record.eisaReportSubmittedAt).toLocaleDateString('en-ZA')}</span>
                    )}
                  </div>
                  {/* Read-only header */}
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-purple-50 border-b border-purple-200">
                      <p className="text-xs font-bold text-purple-900 uppercase tracking-wider">QA VALIDATION OF ASSESSMENT INSTRUMENT CHECKLIST</p>
                    </div>
                    <div className="p-4 grid md:grid-cols-2 gap-3 text-sm">
                      {[
                        { l: 'Name of QP', v: record.eisaReport.nameOfQp },
                        { l: 'Title of Qualification', v: record.eisaReport.titleOfQualification },
                        { l: 'SAQA ID', v: record.eisaReport.saqaId },
                        { l: 'NQF Level', v: record.eisaReport.nqfLevel },
                        { l: 'Credits', v: record.eisaReport.credits },
                        { l: 'Date of EISA', v: record.eisaReport.dateOfEisa },
                        { l: 'Completed By', v: record.eisaReport.completedByFullName },
                        { l: 'Designation', v: record.eisaReport.completedByDesignation },
                      ].map(x => (
                        <div key={x.l}><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">{x.l}</p><p className="font-medium text-gray-900">{x.v || '—'}</p></div>
                      ))}
                    </div>
                  </div>
                  <EisaChecklistSectionReadOnly section={record.eisaReport.qasAddendum} title="Section 1 — QAS Addendum" color="blue" />
                  <EisaChecklistSectionReadOnly section={record.eisaReport.examinerDeveloper} title="Section 2 — Examiner/Developer Details and Findings" color="indigo" />
                  <EisaChecklistSectionReadOnly section={record.eisaReport.moderator} title="Section 3 — Moderator Details and Findings" color="purple" />
                  <EisaChecklistSectionReadOnly section={record.eisaReport.overallEvaluation} title="Section 4 — Overall Evaluation" color="teal" />
                  {(record.eisaReport.overallRecommendation || record.eisaReport.overallFindings) && (
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200">
                        <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Overall Outcome</p>
                      </div>
                      <div className="p-4 space-y-3">
                        {record.eisaReport.overallRecommendation && (
                          <span className={`inline-flex px-3 py-1.5 rounded-xl text-sm font-semibold border ${recCfgMap[record.eisaReport.overallRecommendation]?.bg}`}>
                            {recCfgMap[record.eisaReport.overallRecommendation]?.label}
                          </span>
                        )}
                        {record.eisaReport.overallFindings && (
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border whitespace-pre-wrap">{record.eisaReport.overallFindings}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <ClipboardCheck className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="font-medium text-gray-500">No EISA Report Yet</p>
                  <p className="text-sm text-gray-400 mt-1">The ASD will complete the validation report once allocated.</p>
                </div>
              )}
            </div>
          )}

          {/* ── DD REVIEW TAB ── */}
          {activeTab === 'dd_review' && (
            <div className="space-y-5">
              {canDDReview ? (
                <>
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BadgeCheck className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-800">Deputy Director — Review EISA Validation Report & Recommend</p>
                      <p className="text-xs text-indigo-600 mt-0.5">Review the completed EISA checklist, add your notes, and submit your final recommendation. This will be sent back to the external SDP user.</p>
                    </div>
                  </div>
                  {/* Show EISA report summary for reference */}
                  {record.eisaReport && (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50/40 p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ASD EISA Report Summary</p>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="text-gray-600">Completed by: <span className="font-semibold text-gray-900">{record.eisaReport.completedByFullName}</span></span>
                        {record.eisaReport.overallRecommendation && (
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${recCfgMap[record.eisaReport.overallRecommendation]?.bg}`}>
                            ASD: {recCfgMap[record.eisaReport.overallRecommendation]?.label}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200">
                      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">DD Review & Final Recommendation</p>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Final Recommendation *</label>
                        <div className="grid md:grid-cols-3 gap-2">
                          {([
                            { value: 'approved' as const,                 label: 'Approved',                  color: 'emerald' },
                            { value: 'approved_with_conditions' as const, label: 'Approved with Conditions', color: 'amber'   },
                            { value: 'not_approved' as const,             label: 'Not Approved',              color: 'red'     },
                          ]).map(opt => (
                            <button key={opt.value} onClick={() => setDdRec(opt.value)}
                              className={`px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                                ${ddRec === opt.value
                                  ? opt.color === 'emerald' ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : opt.color === 'amber' ? 'bg-amber-500 border-amber-500 text-white'
                                    : 'bg-red-500 border-red-500 text-white'
                                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Review Notes</label>
                        <textarea value={ddNotes} onChange={e => setDdNotes(e.target.value)} rows={4}
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none resize-none"
                          placeholder="Enter your review findings, conditions (if any), and recommendations to be communicated back to the SDP..." />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl">Cancel</button>
                    <button onClick={handleDDSubmit} disabled={!ddRec}
                      className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed">
                      <Send className="h-4 w-4" />Submit & Notify SDP
                    </button>
                  </div>
                </>
              ) : record.ddRecommendation ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border bg-emerald-50 border-emerald-200 px-5 py-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-800">DD Review completed — SDP notified</p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${recCfgMap[record.ddRecommendation]?.bg}`}>
                    <p className="text-sm font-bold">Final Recommendation: {recCfgMap[record.ddRecommendation]?.label}</p>
                    {record.ddReviewNotes && <p className="text-sm mt-2 whitespace-pre-wrap">{record.ddReviewNotes}</p>}
                    {record.ddReviewedAt && <p className="text-xs mt-2 opacity-60">Reviewed: {new Date(record.ddReviewedAt).toLocaleDateString('en-ZA')}</p>}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="font-medium text-gray-500">DD review pending EISA report completion</p>
                </div>
              )}
            </div>
          )}

          {/* ── STANDARDS DETAILS TAB ── */}
          {activeTab === 'standards_details' && sdp && (
            <div className="space-y-5">
              <div className="rounded-2xl border bg-violet-50 border-violet-200 px-5 py-3 flex items-center gap-2">
                <span className="text-base">🔒</span>
                <p className="text-sm font-medium text-violet-800">Read-only — Standards details from the completed FISA Standards pipeline</p>
              </div>
              {sdp.isFromQasa && (
                <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-4 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-violet-800">Brand New Qualification — Routed from QASA Approval</p>
                    <p className="text-xs text-violet-600 mt-0.5">
                      Submitted by <span className="font-semibold">{sdp.nameOfAQP}</span>
                      {sdp.saqaId && <> · SAQA ID: <span className="font-mono">{sdp.saqaId}</span></>}
                      {sdp.nqfLevel && <> · NQF Level {sdp.nqfLevel}</>}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SP Document</p></div>
                  <div className="px-4 divide-y divide-gray-50">
                    <DetailRow icon={Hash}     label="SP Code"    value={<span className="font-mono">{sdp.spCode}</span>} />
                    <DetailRow icon={BookOpen} label="SP Title"   value={sdp.spTitle} />
                    <DetailRow icon={FileText} label="Purpose"    value={sdp.purpose} />
                    {sdp.nqfLevel && <DetailRow icon={Award} label="NQF Level" value={sdp.nqfLevel} />}
                    {sdp.credits   && <DetailRow icon={Hash}  label="Credits"   value={sdp.credits} />}
                    {sdp.nameOfAQP && <DetailRow icon={User}  label="Name of AQP" value={sdp.nameOfAQP} />}
                    {sdp.saqaId    && <DetailRow icon={Hash}  label="SAQA ID"    value={<span className="font-mono">{sdp.saqaId}</span>} />}
                  </div>
                </div>
                <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Curriculum Document</p></div>
                  <div className="px-4 divide-y divide-gray-50">
                    <DetailRow icon={Hash}           label="Curriculum Code"  value={<span className="font-mono">{sdp.curriculumCode}</span>} />
                    <DetailRow icon={BookOpen}       label="Curriculum Title" value={sdp.curriculumTitle} />
                    <DetailRow icon={ShieldCheck}    label="ELO Focus"        value={sdp.eloFocus} />
                    <DetailRow icon={ClipboardCheck} label="AAC Focus"        value={sdp.aacFocus} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── EVALUATION REPORT TAB ── */}
          {activeTab === 'evaluation_report' && sdp?.evaluationReport && (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-violet-50 border-violet-200 px-5 py-3 flex items-center gap-2">
                <span className="text-base">🔒</span>
                <p className="text-sm font-medium text-violet-800">Read-only — FISA Standards evaluation report (completed by ASD)</p>
              </div>
              {(() => {
                const rp = sdp.evaluationReport as FisaEvaluationReport;
                const recCfg: Record<string, { bg: string; label: string }> = {
                  recommended:                 { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Recommended' },
                  recommended_with_amendments: { bg: 'bg-amber-50 border-amber-200 text-amber-700',       label: 'With Amendments' },
                  not_recommended:             { bg: 'bg-red-50 border-red-200 text-red-700',             label: 'Not Recommended' },
                };
                const cfg = recCfg[rp.recommendation || ''] || { bg: 'bg-gray-100 text-gray-500', label: '—' };
                return (
                  <div className="space-y-4">
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Report Header</p></div>
                      <div className="p-4 grid md:grid-cols-3 gap-4 text-sm">
                        <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Evaluator</p><p className="font-medium">{rp.evaluatorName || '—'}</p></div>
                        <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Date</p><p className="font-medium">{rp.evaluationDate || '—'}</p></div>
                        <div><p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Reference</p><p className="font-medium font-mono">{rp.reportReference || '—'}</p></div>
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-200"><p className="text-xs font-semibold text-indigo-700 uppercase">ELO Evaluation</p></div>
                      <div className="p-4 space-y-3">
                        {rp.eloItems?.map((elo: EloItem) => (
                          <div key={elo.id} className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3 text-sm space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-indigo-800">{elo.code}</span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${elo.aligned === true ? 'bg-emerald-100 text-emerald-700' : elo.aligned === false ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                                {elo.aligned === true ? 'Aligned ✓' : elo.aligned === false ? 'Not Aligned ✗' : '—'}
                              </span>
                            </div>
                            {elo.description && <p className="text-gray-700">{elo.description}</p>}
                            {elo.comments && <p className="text-gray-500 italic">{elo.comments}</p>}
                          </div>
                        ))}
                        {rp.eloOverallConclusion && <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border">{rp.eloOverallConclusion}</p>}
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                      <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200"><p className="text-xs font-semibold text-emerald-700 uppercase">Findings & Recommendation</p></div>
                      <div className="p-4 space-y-3">
                        {rp.overallFindings && <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border whitespace-pre-wrap">{rp.overallFindings}</p>}
                        {rp.recommendation && <span className={`inline-flex px-3 py-1.5 rounded-xl text-sm font-semibold border ${cfg.bg}`}>{cfg.label}</span>}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── REVIEW RECORDS TAB ── */}
          {activeTab === 'reviews' && sdp && (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-violet-50 border-violet-200 px-5 py-3 flex items-center gap-2">
                <span className="text-base">🔒</span>
                <p className="text-sm font-medium text-violet-800">Read-only — Review records from the FISA Standards pipeline</p>
              </div>
              {sdp.directorTeamChecklist && Object.keys(sdp.directorTeamChecklist).length > 0 && (
                <ReviewerBlock title="Director & Team Review" color="violet" checklist={sdp.directorTeamChecklist} notes={sdp.directorTeamNotes} />
              )}
              {sdp.aicChecklist && Object.keys(sdp.aicChecklist).length > 0 && (
                <ReviewerBlock title="AIC Review & Validation" color="purple" checklist={sdp.aicChecklist} notes={sdp.aicNotes} />
              )}
              {sdp.qualDevChecklist && Object.keys(sdp.qualDevChecklist).length > 0 && (
                <ReviewerBlock title="Qualifications Development Approval" color="teal" checklist={sdp.qualDevChecklist} notes={sdp.qualDevNotes} />
              )}
              {(!sdp.directorTeamChecklist || !Object.keys(sdp.directorTeamChecklist).length) &&
               (!sdp.aicChecklist || !Object.keys(sdp.aicChecklist).length) &&
               (!sdp.qualDevChecklist || !Object.keys(sdp.qualDevChecklist).length) && (
                <p className="text-sm text-gray-400 italic text-center py-8">No review records available.</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}