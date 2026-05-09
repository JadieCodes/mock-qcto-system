import React, { useMemo, useState, useEffect } from 'react';
import type { AppRole } from '@/types';
import { useApp } from '@/contexts/AppContext';
import {
  BookOpen,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Clock3,
  Database,
  Eye,
  Send,
  ClipboardCheck,
  CalendarDays,
  FileCheck2,
  BadgeCheck,
  Users,
  UserCheck,
  X,
  CheckSquare,
} from 'lucide-react';

type FisaTab = 'standards' | 'validation';

type StandardsStage =
  | 'deputy_director_allocation'
  | 'asd_evaluation'
  | 'deputy_director_moderation'
  | 'director_team_moderation'
  | 'aic_moderation'
  | 'qualifications_development_approval'
  | 'deputy_director_database_update'
  | 'completed';

type ValidationStage =
  | 'sdp_notification'
  | 'assistant_director_allocation'
  | 'asd_validation'
  | 'deputy_director_review'
  | 'completed';

type ReviewStatus = 'pending' | 'in_progress' | 'approved';

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
  evaluationReportSubmitted: boolean;
  deputyDirectorModerationStatus: ReviewStatus;
  directorTeamModerationStatus: ReviewStatus;
  aicModerationStatus: ReviewStatus;
  qualificationsDevelopmentApprovalStatus: ReviewStatus;
  databaseUpdated: boolean;
  createdAt: string;
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
}

const ASD_USERS = [
  'ASD 1 - Curriculum Standards',
  'ASD 2 - Learning Standards',
  'ASD 3 - Occupational Standards',
];

const QUALITY_CHECK_ITEMS = [
  'Curriculum document is complete and aligned',
  'SP document meets quality standards',
  'ELO focus is correctly addressed',
  'AAC focus is properly defined',
  'Purpose of SP is clearly stated',
  'Documentation follows required format',
  'All required sections are present',
  'No major gaps or inconsistencies found',
];

const INITIAL_STANDARDS_RECORDS: FisaStandardsRecord[] = [
  {
    id: 'FISA-SP-001',
    spCode: 'SP-001',
    spTitle: 'National Certificate: Software Support',
    curriculumCode: 'CURR-001',
    curriculumTitle: 'Software Support Curriculum',
    purpose: 'Prepare learners to perform software support, troubleshooting, user assistance, and maintenance activities.',
    eloFocus: 'Evaluate exit level outcomes alignment, coherence, sequencing, and occupational relevance.',
    aacFocus: 'Review associated assessment criteria for completeness, quality, and alignment to outcomes.',
    sourceFrom: 'QA Domain',
    currentStage: 'deputy_director_allocation',
    evaluationReportSubmitted: false,
    deputyDirectorModerationStatus: 'pending',
    directorTeamModerationStatus: 'pending',
    aicModerationStatus: 'pending',
    qualificationsDevelopmentApprovalStatus: 'pending',
    databaseUpdated: false,
    createdAt: '2026-04-22',
  },
  {
    id: 'FISA-SP-002',
    spCode: 'SP-002',
    spTitle: 'Further Education and Training Certificate: Project Administration',
    curriculumCode: 'CURR-002',
    curriculumTitle: 'Project Administration Curriculum',
    purpose: 'Develop occupational competence in project administration support and coordination functions.',
    eloFocus: 'Check the ELO structure, correctness, progression, and occupational applicability.',
    aacFocus: 'Check the AAC for measurable assessment expectations and alignment to the ELOs.',
    sourceFrom: 'QA Domain',
    allocatedAsd: 'ASD 2 - Learning Standards',
    currentStage: 'deputy_director_moderation',
    evaluationReportSubmitted: true,
    deputyDirectorModerationStatus: 'in_progress',
    directorTeamModerationStatus: 'pending',
    aicModerationStatus: 'pending',
    qualificationsDevelopmentApprovalStatus: 'pending',
    databaseUpdated: false,
    createdAt: '2026-04-21',
  },
  {
    id: 'FISA-SP-003',
    spCode: 'SP-003',
    spTitle: 'Occupational Certificate: Network Technician',
    curriculumCode: 'CURR-003',
    curriculumTitle: 'Network Technician Curriculum',
    purpose: 'Equip learners with skills to install, maintain, monitor, and support network infrastructure.',
    eloFocus: 'Verify ELO alignment to occupational tasks, industry needs, and progression.',
    aacFocus: 'Verify that AACs are observable, assessable, and support valid judgement.',
    sourceFrom: 'QA Domain',
    allocatedAsd: 'ASD 3 - Occupational Standards',
    currentStage: 'aic_moderation',
    evaluationReportSubmitted: true,
    deputyDirectorModerationStatus: 'approved',
    directorTeamModerationStatus: 'approved',
    aicModerationStatus: 'in_progress',
    qualificationsDevelopmentApprovalStatus: 'pending',
    databaseUpdated: false,
    createdAt: '2026-04-20',
  },
  {
    id: 'FISA-SP-004',
    spCode: 'SP-004',
    spTitle: 'Higher Certificate: Data Capturing',
    curriculumCode: 'CURR-004',
    curriculumTitle: 'Data Capturing Curriculum',
    purpose: 'Provide learners with competence in data capturing, validation, quality checks, and reporting support.',
    eloFocus: 'Confirm ELO relevance, sequencing, competency intent, and curriculum fit.',
    aacFocus: 'Confirm AAC quality, clarity, completeness, and fit to the intended outcomes.',
    sourceFrom: 'QA Domain',
    allocatedAsd: 'ASD 1 - Curriculum Standards',
    currentStage: 'completed',
    evaluationReportSubmitted: true,
    deputyDirectorModerationStatus: 'approved',
    directorTeamModerationStatus: 'approved',
    aicModerationStatus: 'approved',
    qualificationsDevelopmentApprovalStatus: 'approved',
    databaseUpdated: true,
    createdAt: '2026-04-18',
  },
];

const INITIAL_VALIDATION_RECORDS: FisaValidationRecord[] = [];

export default function InternalFisaPage() {
  const [activeTab, setActiveTab] = useState<FisaTab>('standards');
  const [records, setRecords] = useState<FisaStandardsRecord[]>(INITIAL_STANDARDS_RECORDS);
  const [validationRecords, setValidationRecords] = useState<FisaValidationRecord[]>(INITIAL_VALIDATION_RECORDS);
  const [selectedRecord, setSelectedRecord] = useState<FisaStandardsRecord | null>(null);
  const [selectedValidationRecord, setSelectedValidationRecord] = useState<FisaValidationRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Quality Check Modal States (inside view modal)
  const [showQualityCheckModal, setShowQualityCheckModal] = useState(false);
  const [qualityCheckItems, setQualityCheckItems] = useState<{ [key: string]: boolean }>({});
  const [qualityCheckNotes, setQualityCheckNotes] = useState('');
  
  // Allocation Modal States (inside view modal)
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedAsd, setSelectedAsd] = useState('');
  
  // Validation Allocation Modal States
  const [showValidationAllocateModal, setShowValidationAllocateModal] = useState(false);
  const [selectedValidationForAllocation, setSelectedValidationForAllocation] = useState<FisaValidationRecord | null>(null);
  const [selectedValidationAsd, setSelectedValidationAsd] = useState('');
  const [validationDate, setValidationDate] = useState('');

  const { currentRole } = useApp();

  const standardsCards = useMemo(() => {
    const standardsQueue = records.filter((record) => record.currentStage !== 'completed').length;
    const pendingReview = records.filter((record) =>
      [
        'deputy_director_moderation',
        'director_team_moderation',
        'aic_moderation',
        'qualifications_development_approval',
      ].includes(record.currentStage)
    ).length;
    const approvedStandards = records.filter((record) => record.currentStage === 'completed').length;

    return [
      { title: 'Standards Queue', value: String(standardsQueue), icon: <BookOpen className="h-5 w-5" /> },
      { title: 'Pending Review', value: String(pendingReview), icon: <ShieldCheck className="h-5 w-5" /> },
      { title: 'Approved Standards', value: String(approvedStandards), icon: <CheckCircle2 className="h-5 w-5" /> },
    ];
  }, [records]);

  const validationCards = useMemo(() => {
    const pendingValidations = validationRecords.filter((record) => record.currentStage !== 'completed').length;
    const scheduledReviews = validationRecords.filter((record) => record.currentStage === 'assistant_director_allocation').length;
    const completedValidations = validationRecords.filter((record) => record.currentStage === 'completed').length;

    return [
      { title: 'Pending Validations', value: String(pendingValidations), icon: <ShieldCheck className="h-5 w-5" /> },
      { title: 'Scheduled Reviews', value: String(scheduledReviews), icon: <CalendarDays className="h-5 w-5" /> },
      { title: 'Completed Validations', value: String(completedValidations), icon: <BadgeCheck className="h-5 w-5" /> },
    ];
  }, [validationRecords]);

  // Load external validation submissions
  useEffect(() => {
    const loadExternalSubmissions = () => {
      const stored = localStorage.getItem('fisa_validation_submissions');
      if (stored) {
        const externalSubmissions = JSON.parse(stored);
        const convertedRecords: FisaValidationRecord[] = externalSubmissions.map((sub: any) => ({
          id: sub.id,
          fisaCode: sub.fisaCode,
          fisaTitle: sub.fisaTitle,
          instrumentName: sub.instrumentName,
          validationDate: sub.validationDate || '',
          sourceFrom: 'SDP',
          allocatedAsd: sub.allocatedAsd || undefined,
          currentStage: mapStatusToStage(sub.status),
          examinerReport: false,
          cvReceived: false,
          confidentialityAgreement: false,
          writtenInstrumentAndMemo: false,
          practicalInstrumentAndRubric: false,
          eisaValidationReportGenerated: false,
          deputyDirectorReviewStatus: 'pending',
          createdAt: sub.submissionDate,
        }));
        
        setValidationRecords(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const newRecords = convertedRecords.filter(r => !existingIds.has(r.id));
          return [...prev, ...newRecords];
        });
      }
    };
    
    loadExternalSubmissions();
    
    const handleExternalStorageChange = (e: StorageEvent) => {
      if (e.key === 'fisa_validation_submissions') {
        loadExternalSubmissions();
      }
    };
    window.addEventListener('storage', handleExternalStorageChange);
    
    return () => window.removeEventListener('storage', handleExternalStorageChange);
  }, []);

  function mapStatusToStage(status: string): ValidationStage {
    switch(status) {
      case 'pending': return 'assistant_director_allocation';
      case 'allocated': return 'asd_validation';
      case 'in_progress': return 'asd_validation';
      case 'completed': return 'completed';
      default: return 'assistant_director_allocation';
    }
  }

  const visibleRecords = useMemo(() => {
    return records.filter((record) => isVisibleForRole(record, currentRole));
  }, [records, currentRole]);

  const visibleValidationRecords = useMemo(() => {
    return validationRecords.filter((record) => isValidationVisibleForRole(record, currentRole));
  }, [validationRecords, currentRole]);

  // Allocation Handler (inside view modal)
  const handleAllocateToAsd = () => {
    if (!selectedRecord || !selectedAsd) return;

    setRecords((prev) =>
      prev.map((record) =>
        record.id === selectedRecord.id
          ? {
              ...record,
              allocatedAsd: selectedAsd,
              currentStage: 'asd_evaluation',
            }
          : record
      )
    );
    setShowAllocateModal(false);
    setSelectedAsd('');
    setSelectedRecord(null);
    setIsViewModalOpen(false);
  };

  // Quality Check Handler (inside view modal)
  const openQualityCheckModal = () => {
    if (!selectedRecord) return;
    const initialChecklist: { [key: string]: boolean } = {};
    QUALITY_CHECK_ITEMS.forEach(item => { initialChecklist[item] = false; });
    setQualityCheckItems(initialChecklist);
    setQualityCheckNotes('');
    setShowQualityCheckModal(true);
  };

  const handleQualityCheck = () => {
    if (!selectedRecord) return;

    const allChecked = Object.values(qualityCheckItems).every(v => v === true);
    
    if (!allChecked) {
      alert('Please complete all quality check items before proceeding.');
      return;
    }

    setRecords((prev) =>
      prev.map((record) =>
        record.id === selectedRecord.id
          ? {
              ...record,
              deputyDirectorModerationStatus: 'approved',
              currentStage: 'director_team_moderation',
              directorTeamModerationStatus: 'in_progress',
            }
          : record
      )
    );
    setShowQualityCheckModal(false);
    setSelectedRecord(null);
    setIsViewModalOpen(false);
    setQualityCheckItems({});
    setQualityCheckNotes('');
  };

  const handleSubmitEvaluation = (recordId: string) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? {
              ...record,
              evaluationReportSubmitted: true,
              currentStage: 'deputy_director_moderation',
              deputyDirectorModerationStatus: 'in_progress',
            }
          : record
      )
    );
  };

  const handleDirectorTeamModeration = (recordId: string) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? {
              ...record,
              directorTeamModerationStatus: 'approved',
              currentStage: 'aic_moderation',
              aicModerationStatus: 'in_progress',
            }
          : record
      )
    );
  };

  const handleAicModeration = (recordId: string) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? {
              ...record,
              aicModerationStatus: 'approved',
              currentStage: 'qualifications_development_approval',
              qualificationsDevelopmentApprovalStatus: 'in_progress',
            }
          : record
      )
    );
  };

  const handleQualificationsApproval = (recordId: string) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? {
              ...record,
              qualificationsDevelopmentApprovalStatus: 'approved',
              currentStage: 'deputy_director_database_update',
            }
          : record
      )
    );
  };

  const handleDatabaseUpdate = (recordId: string) => {
    setRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? {
              ...record,
              databaseUpdated: true,
              currentStage: 'completed',
            }
          : record
      )
    );
  };

  const handleValidationAllocateToAsd = () => {
    if (!selectedValidationForAllocation || !selectedValidationAsd) return;

    setValidationRecords((prev) =>
      prev.map((record) =>
        record.id === selectedValidationForAllocation.id
          ? {
              ...record,
              allocatedAsd: selectedValidationAsd,
              validationDate: validationDate,
              currentStage: 'asd_validation',
            }
          : record
      )
    );
    
    const stored = localStorage.getItem('fisa_validation_submissions');
    if (stored) {
      const externalSubmissions = JSON.parse(stored);
      const updatedExternal = externalSubmissions.map((sub: any) =>
        sub.id === selectedValidationForAllocation.id
          ? {
              ...sub,
              status: 'allocated',
              allocatedAsd: selectedValidationAsd,
              validationDate: validationDate,
            }
          : sub
      );
      localStorage.setItem('fisa_validation_submissions', JSON.stringify(updatedExternal));
      window.dispatchEvent(new StorageEvent('storage', { key: 'fisa_validation_submissions' }));
    }
    
    setShowValidationAllocateModal(false);
    setSelectedValidationAsd('');
    setValidationDate('');
    setSelectedValidationForAllocation(null);
  };

  const handleGenerateValidationReport = (recordId: string) => {
    setValidationRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? {
              ...record,
              examinerReport: true,
              cvReceived: true,
              confidentialityAgreement: true,
              writtenInstrumentAndMemo: true,
              practicalInstrumentAndRubric: true,
              eisaValidationReportGenerated: true,
              currentStage: 'deputy_director_review',
              deputyDirectorReviewStatus: 'in_progress',
            }
          : record
      )
    );
  };

  const handleDeputyDirectorValidationReview = (recordId: string) => {
    setValidationRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? {
              ...record,
              deputyDirectorReviewStatus: 'approved',
              currentStage: 'completed',
            }
          : record
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">FISA</h2>
        <p className="mt-1 text-sm text-gray-600">Manage FISA standards and FISA validation activities.</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('standards')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'standards' ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              FISA Standards
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('validation')}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'validation' ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Validation of FISA
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'standards' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">FISA Standards</h3>
                  <p className="mt-1 text-sm text-gray-600">Standards allocation, evaluation, moderation, approval and dashboard update.</p>
                </div>
                <div className="inline-flex w-fit items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Current role</span>
                  <span className="ml-3 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm">{currentRole}</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {standardsCards.map((card) => (
                  <InfoCard key={card.title} title={card.title} value={card.value} icon={card.icon} />
                ))}
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
                  <h4 className="text-sm font-semibold text-gray-900">Standards Register</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white">
                      <tr className="border-b border-gray-200">
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">SP Document</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Curriculum Document</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">ASD</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Stage</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Evaluation Report</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500">No FISA standards records available for this role.</td>
                        </tr>
                      ) : (
                        visibleRecords.map((record) => (
                          <tr key={record.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70">
                            <td className="px-5 py-4 align-top">
                              <div className="font-semibold text-gray-900">{record.spCode}</div>
                              <div className="mt-1 text-sm text-gray-600">{record.spTitle}</div>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="font-semibold text-gray-900">{record.curriculumCode}</div>
                              <div className="mt-1 text-sm text-gray-600">{record.curriculumTitle}</div>
                            </td>
                            <td className="px-5 py-4 align-top text-sm text-gray-700">{record.allocatedAsd || '-'}</td>
                            <td className="px-5 py-4 align-top"><StageBadge stage={record.currentStage} /></td>
                            <td className="px-5 py-4 align-top">
                              <StatusBadge status={record.evaluationReportSubmitted ? 'approved' : 'pending'} approvedLabel="Submitted" pendingLabel="Pending" />
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="flex flex-wrap items-center gap-2">
                                <ActionButton variant="secondary" icon={<Eye className="h-4 w-4" />} onClick={() => {
                                  setSelectedRecord(record);
                                  setIsViewModalOpen(true);
                                }}>View</ActionButton>

                                {currentRole === 'ASD' && record.currentStage === 'asd_evaluation' && record.allocatedAsd && (
                                  <ActionButton icon={<Send className="h-4 w-4" />} onClick={() => handleSubmitEvaluation(record.id)}>Submit Report</ActionButton>
                                )}

                                {currentRole === 'Director & Team' && record.currentStage === 'director_team_moderation' && (
                                  <ActionButton icon={<ClipboardCheck className="h-4 w-4" />} onClick={() => handleDirectorTeamModeration(record.id)}>Quality Check OK</ActionButton>
                                )}

                                {currentRole === 'AIC' && record.currentStage === 'aic_moderation' && (
                                  <ActionButton icon={<ClipboardCheck className="h-4 w-4" />} onClick={() => handleAicModeration(record.id)}>Quality Check OK</ActionButton>
                                )}

                                {currentRole === 'Qualifications Development' && record.currentStage === 'qualifications_development_approval' && (
                                  <ActionButton variant="success" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => handleQualificationsApproval(record.id)}>Approval OK</ActionButton>
                                )}

                                {currentRole === 'Deputy Director' && record.currentStage === 'deputy_director_database_update' && (
                                  <ActionButton variant="info" icon={<Database className="h-4 w-4" />} onClick={() => handleDatabaseUpdate(record.id)}>Update Dashboard</ActionButton>
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
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Validation of FISA</h3>
                  <p className="mt-1 text-sm text-gray-600">Validation notification, allocation, instrument validation and deputy director review.</p>
                </div>
                <div className="inline-flex w-fit items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Current role</span>
                  <span className="ml-3 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm">{currentRole}</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {validationCards.map((card) => (
                  <InfoCard key={card.title} title={card.title} value={card.value} icon={card.icon} />
                ))}
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
                  <h4 className="text-sm font-semibold text-gray-900">Validation Register</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white">
                      <tr className="border-b border-gray-200">
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">FISA</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Instrument</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Validation Date</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">ASD</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Stage</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">EISA Report</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleValidationRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500">No validation records available. Use the external page to create one.</td>
                        </tr>
                      ) : (
                        visibleValidationRecords.map((record) => (
                          <tr key={record.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70">
                            <td className="px-5 py-4 align-top">
                              <div className="font-semibold text-gray-900">{record.fisaCode}</div>
                              <div className="mt-1 text-sm text-gray-600">{record.fisaTitle}</div>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="font-semibold text-gray-900">{record.instrumentName}</div>
                              <div className="mt-1 text-sm text-gray-600">Source: {record.sourceFrom}</div>
                            </td>
                            <td className="px-5 py-4 align-top text-sm text-gray-700">{record.validationDate || '-'}</td>
                            <td className="px-5 py-4 align-top text-sm text-gray-700">{record.allocatedAsd || '-'}</td>
                            <td className="px-5 py-4 align-top"><ValidationStageBadge stage={record.currentStage} /></td>
                            <td className="px-5 py-4 align-top">
                              <StatusBadge status={record.eisaValidationReportGenerated ? 'approved' : 'pending'} approvedLabel="Generated" pendingLabel="Pending" />
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="flex flex-wrap items-center gap-2">
                                <ActionButton variant="secondary" icon={<Eye className="h-4 w-4" />} onClick={() => setSelectedValidationRecord(record)}>View</ActionButton>

                                {currentRole === 'Assistant Director' && record.currentStage === 'assistant_director_allocation' && (
                                  <ActionButton icon={<Users className="h-4 w-4" />} onClick={() => {
                                    setSelectedValidationForAllocation(record);
                                    setShowValidationAllocateModal(true);
                                  }}>Allocate to ASD</ActionButton>
                                )}

                                {currentRole === 'ASD' && record.currentStage === 'asd_validation' && (
                                  <ActionButton icon={<FileCheck2 className="h-4 w-4" />} onClick={() => handleGenerateValidationReport(record.id)}>Generate EISA Report</ActionButton>
                                )}

                                {currentRole === 'Deputy Director' && record.currentStage === 'deputy_director_review' && record.eisaValidationReportGenerated && (
                                  <ActionButton icon={<ClipboardCheck className="h-4 w-4" />} onClick={() => handleDeputyDirectorValidationReview(record.id)}>Review Complete</ActionButton>
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

              {selectedValidationRecord && (
                <ValidationDetailsModal 
                  record={selectedValidationRecord} 
                  onClose={() => setSelectedValidationRecord(null)} 
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* View Modal for Standards with Actions Inside */}
      {isViewModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedRecord.spCode} - {selectedRecord.spTitle}</h3>
                <p className="mt-1 text-sm text-gray-600">FISA standards record details</p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">Close</button>
            </div>
            <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-6">
              {/* Document Information */}
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <h4 className="font-semibold text-gray-900 mb-3">SP Document</h4>
                  <p className="text-sm"><strong>Code:</strong> {selectedRecord.spCode}</p>
                  <p className="text-sm mt-1"><strong>Title:</strong> {selectedRecord.spTitle}</p>
                  <p className="text-sm mt-3"><strong>Purpose:</strong> {selectedRecord.purpose}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <h4 className="font-semibold text-gray-900 mb-3">Curriculum Document</h4>
                  <p className="text-sm"><strong>Code:</strong> {selectedRecord.curriculumCode}</p>
                  <p className="text-sm mt-1"><strong>Title:</strong> {selectedRecord.curriculumTitle}</p>
                  <p className="text-sm mt-3"><strong>ELO Focus:</strong> {selectedRecord.eloFocus}</p>
                  <p className="text-sm mt-1"><strong>AAC Focus:</strong> {selectedRecord.aacFocus}</p>
                </div>
              </div>

              {/* Action Buttons based on Role and Stage */}
              <div className="border-t pt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Available Actions</h4>
                <div className="flex flex-wrap gap-3">
                  {currentRole === 'Deputy Director' && selectedRecord.currentStage === 'deputy_director_allocation' && (
                    <button
                      onClick={() => setShowAllocateModal(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
                    >
                      <Users className="h-4 w-4" />
                      Allocate to ASD
                    </button>
                  )}

                  {currentRole === 'Deputy Director' && selectedRecord.currentStage === 'deputy_director_moderation' && selectedRecord.evaluationReportSubmitted && (
                    <button
                      onClick={openQualityCheckModal}
                      className="inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Quality Check OK
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Modal (inside view modal) */}
      {showAllocateModal && selectedRecord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Allocate to ASD</h3>
                <p className="text-sm text-gray-600">Select an ASD to allocate this SP for evaluation</p>
              </div>
              <button onClick={() => setShowAllocateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select ASD</label>
                <select
                  value={selectedAsd}
                  onChange={(e) => setSelectedAsd(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                >
                  <option value="">Choose ASD...</option>
                  {ASD_USERS.map((asd) => (
                    <option key={asd} value={asd}>{asd}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowAllocateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleAllocateToAsd} disabled={!selectedAsd} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">Allocate</button>
            </div>
          </div>
        </div>
      )}

      {/* Quality Check Modal (inside view modal) */}
      {showQualityCheckModal && selectedRecord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quality Assurance Check</h3>
                <p className="text-sm text-gray-600">Review and moderate the evaluation report</p>
              </div>
              <button onClick={() => setShowQualityCheckModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">SP Document</h4>
                <p className="text-sm text-gray-600">{selectedRecord.spCode} - {selectedRecord.spTitle}</p>
                <p className="text-sm text-gray-600 mt-1"><strong>Purpose:</strong> {selectedRecord.purpose}</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Curriculum Document</h4>
                <p className="text-sm text-gray-600">{selectedRecord.curriculumCode} - {selectedRecord.curriculumTitle}</p>
                <p className="text-sm text-gray-600 mt-1"><strong>ELO Focus:</strong> {selectedRecord.eloFocus}</p>
                <p className="text-sm text-gray-600 mt-1"><strong>AAC Focus:</strong> {selectedRecord.aacFocus}</p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Quality Checklist</h4>
                {QUALITY_CHECK_ITEMS.map((item) => (
                  <div key={item} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={item}
                      checked={qualityCheckItems[item] || false}
                      onChange={(e) => setQualityCheckItems(prev => ({ ...prev, [item]: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor={item} className="text-sm text-gray-700">{item}</label>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Moderation Notes</label>
                <textarea
                  value={qualityCheckNotes}
                  onChange={(e) => setQualityCheckNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                  placeholder="Enter any additional notes about the quality check..."
                />
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowQualityCheckModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleQualityCheck} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">Confirm Quality Check</button>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Modal for Validation */}
      {showValidationAllocateModal && selectedValidationForAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Allocate for Validation</h3>
                <p className="text-sm text-gray-600">Liaise with SDP on date of validation & allocate to ASD</p>
              </div>
              <button onClick={() => setShowValidationAllocateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Validation Date</label>
                <input type="date" value={validationDate} onChange={(e) => setValidationDate(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select ASD</label>
                <select value={selectedValidationAsd} onChange={(e) => setSelectedValidationAsd(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none">
                  <option value="">Choose ASD...</option>
                  {ASD_USERS.map((asd) => (<option key={asd} value={asd}>{asd}</option>))}
                </select>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowValidationAllocateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleValidationAllocateToAsd} disabled={!selectedValidationAsd || !validationDate} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">Allocate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions remain the same...
function isVisibleForRole(record: FisaStandardsRecord, role: AppRole) {
  if (role === 'Deputy Director') {
    return record.currentStage === 'deputy_director_allocation' || record.currentStage === 'deputy_director_moderation' || record.currentStage === 'deputy_director_database_update' || record.currentStage === 'completed';
  }
  if (role === 'ASD') return record.currentStage === 'asd_evaluation';
  if (role === 'Director & Team') return record.currentStage === 'director_team_moderation';
  if (role === 'AIC') return record.currentStage === 'aic_moderation';
  if (role === 'Qualifications Development') return record.currentStage === 'qualifications_development_approval';
  return false;
}

function isValidationVisibleForRole(record: FisaValidationRecord, role: AppRole) {
  if (role === 'SDP') return record.currentStage === 'sdp_notification';
  if (role === 'Assistant Director') return record.currentStage === 'assistant_director_allocation' || record.currentStage === 'completed';
  if (role === 'ASD') return record.currentStage === 'asd_validation';
  if (role === 'Deputy Director') return record.currentStage === 'deputy_director_review' || record.currentStage === 'completed';
  return false;
}

function getStageLabel(stage: StandardsStage) {
  const stages: Record<StandardsStage, string> = {
    deputy_director_allocation: 'Allocation',
    asd_evaluation: 'ASD Evaluation',
    deputy_director_moderation: 'Deputy Director Review',
    director_team_moderation: 'Director & Team Review',
    aic_moderation: 'AIC Review',
    qualifications_development_approval: 'Qualification Approval',
    deputy_director_database_update: 'Dashboard Update',
    completed: 'Completed',
  };
  return stages[stage];
}

function getValidationStageLabel(stage: ValidationStage) {
  const stages: Record<ValidationStage, string> = {
    sdp_notification: 'SDP Notification',
    assistant_director_allocation: 'Assistant Director Allocation',
    asd_validation: 'ASD Validation',
    deputy_director_review: 'Deputy Director Review',
    completed: 'Completed',
  };
  return stages[stage];
}

function StageBadge({ stage }: { stage: StandardsStage }) {
  const styles = stage === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' : stage === 'deputy_director_database_update' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : stage === 'qualifications_development_approval' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-amber-600/20';
  return <span className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold ring-1 ring-inset ${styles}`}>{getStageLabel(stage)}</span>;
}

function ValidationStageBadge({ stage }: { stage: ValidationStage }) {
  const styles = stage === 'completed' ? 'bg-green-50 text-green-700 ring-green-600/20' : stage === 'deputy_director_review' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : stage === 'asd_validation' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' : 'bg-purple-50 text-purple-700 ring-purple-600/20';
  return <span className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold ring-1 ring-inset ${styles}`}>{getValidationStageLabel(stage)}</span>;
}

function StatusBadge({ status, approvedLabel = 'Approved', pendingLabel = 'Pending' }: { status: ReviewStatus; approvedLabel?: string; pendingLabel?: string }) {
  if (status === 'approved') return <span className="inline-flex h-8 items-center rounded-full bg-green-50 px-3 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">{approvedLabel}</span>;
  if (status === 'in_progress') return <span className="inline-flex h-8 items-center rounded-full bg-blue-50 px-3 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">In Progress</span>;
  return <span className="inline-flex h-8 items-center rounded-full bg-gray-100 px-3 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">{pendingLabel}</span>;
}

function ActionButton({ children, icon, onClick, variant = 'primary' }: { children: React.ReactNode; icon?: React.ReactNode; onClick: () => void; variant?: 'primary' | 'secondary' | 'success' | 'info'; }) {
  const styles = variant === 'secondary' ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : variant === 'success' ? 'bg-green-600 text-white hover:bg-green-700' : variant === 'info' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-red-600 text-white hover:bg-red-700';
  return <button type="button" onClick={onClick} className={`inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition ${styles}`}>{icon}{children}</button>;
}

function InfoCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-gray-500">{title}</p><p className="mt-2 text-2xl font-bold text-gray-900">{value}</p></div><div className="rounded-2xl bg-white p-3 text-gray-600 shadow-sm">{icon}</div></div></div>;
}

function ValidationDetailsModal({ record, onClose }: { record: FisaValidationRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5"><div><h3 className="text-lg font-semibold text-gray-900">{record.fisaCode} - {record.fisaTitle}</h3><p className="mt-1 text-sm text-gray-600">FISA validation record details</p></div><button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">Close</button></div>
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h4 className="font-semibold text-gray-900 mb-3">Validation Information</h4>
              <p className="text-sm"><strong>FISA Title:</strong> {record.fisaTitle}</p>
              <p className="text-sm mt-1"><strong>Instrument:</strong> {record.instrumentName}</p>
              <p className="text-sm mt-1"><strong>Validation Date:</strong> {record.validationDate}</p>
              <p className="text-sm mt-1"><strong>Allocated ASD:</strong> {record.allocatedAsd || '-'}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <h4 className="font-semibold text-gray-900 mb-3">Instrument Validation Tool</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2"><CheckCircle2 className={`h-4 w-4 ${record.examinerReport ? 'text-green-600' : 'text-gray-300'}`} /><span className="text-sm">Examiner Report</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className={`h-4 w-4 ${record.cvReceived ? 'text-green-600' : 'text-gray-300'}`} /><span className="text-sm">CV</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className={`h-4 w-4 ${record.confidentialityAgreement ? 'text-green-600' : 'text-gray-300'}`} /><span className="text-sm">Confidentiality Agreement</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className={`h-4 w-4 ${record.writtenInstrumentAndMemo ? 'text-green-600' : 'text-gray-300'}`} /><span className="text-sm">FISA Instrument and Memo (Written)</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className={`h-4 w-4 ${record.practicalInstrumentAndRubric ? 'text-green-600' : 'text-gray-300'}`} /><span className="text-sm">FISA Instrument and Rubric (Practical)</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className={`h-4 w-4 ${record.eisaValidationReportGenerated ? 'text-green-600' : 'text-gray-300'}`} /><span className="text-sm">EISA Validation Report</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}