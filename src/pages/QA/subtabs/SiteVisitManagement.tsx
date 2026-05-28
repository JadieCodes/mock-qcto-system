import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, FileText, Camera, Upload, CheckCircle, XCircle, Clock, User, Send, Calendar, Users, ClipboardList, CheckCircle2, Plus, Trash2, FolderPlus, Download, Paperclip } from 'lucide-react';
import type { LearnerEnrolment, LearnerEnrolmentStatus, LearnerSiteVisitReport } from '@/types';

// Key that external side uses
const EXTERNAL_STORAGE_KEY = 'external_learner_enrolment_batches_v2';
const ENROLMENT_SYNC_EVENT = 'external-learner-enrolments-updated';

// Types for gate evaluation and draft report
interface GateCheckItem {
  criteria: string;
  isMet: boolean;
  detail: string;
}

interface GateEvaluation {
  status: 'passed' | 'failed' | null;
  generatedAt?: string;
  checklistResults: GateCheckItem[];
  failureReasons: string[];
}

interface DraftReportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  uploadedFileName?: string;
  submissionMethod: 'manual' | 'upload' | 'mixed';
}

interface DraftReport {
  id: string;
  generatedAt: string;
  reportTitle: string;
  summary: DraftReportSummary;
  validationChecks: GateCheckItem[];
  notes: string[];
}

// Learner Row type
interface LearnerRow {
  id: string;
  nationalId: string;
  alternateId: string;
  lastName: string;
  firstName: string;
  gender: string;
  birthDate: string;
  province: string;
  popiaAgree: string;
  sorStatus: string;
  readinessType: string;
  flc: string;
}

// Checklist Attachment type
interface ChecklistAttachment {
  id: string;
  name: string;
  uploadedAt: string;
  url: string;
}

// Review Question types for dynamic checklist
interface ReviewQuestion {
  id: string;
  label: string;
  description: string;
  isDefault?: boolean;
  isActive?: boolean;
}

interface ReviewSection {
  id: string;
  title: string;
  description: string;
  isDefault?: boolean;
  isActive?: boolean;
  questions: ReviewQuestion[];
}

interface ReviewQuestionState {
  checked: boolean;
  comment: string;
  attachments: ChecklistAttachment[];
}

// Evidence Interface
interface Evidence {
  id: string;
  type: 'photo' | 'document';
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  description: string;
}

interface CompletedSiteVisit {
  id: string;
  enrolmentId: string;
  learnerName: string;
  qualification: string;
  visitDate: string;
  submittedDate: string;
  inspector: string;
  compliance: string;
  riskLevel: string;
  findings: string;
  originalEnrolment: any;
}

interface ExternalLearnerEnrolment {
  id: string;
  enrolmentId: string;
  learnerDetails?: {
    firstName?: string;
    lastName?: string;
    idNumber?: string;
    email?: string;
    phone?: string;
    name?: string;
  };
  qualification?: {
    name?: string;
    code?: string;
  };
  qualificationId?: string;
  status: string;
  qpAllocation?: {
    quarterlyPeriod?: string;
    allocatedAt?: string;
    allocatedTo?: string;
  };
  plansReports?: {
    documentUrl: string;
    documentName: string;
    uploadedAt: string;
    uploadedBy: string;
    submittedAt: string;
    notes?: string;
  };
  consolidatedPlans?: {
    documentUrl: string;
    documentName: string;
    uploadedAt: string;
    uploadedBy: string;
    sharedAt?: string;
    sharedWith?: string[];
    notes?: string;
  };
  sdpCode?: string;
  assessmentCentreCode?: string;
  dateStamp?: string;
  submittedBy?: string;
  submittedAt?: string;
  gateEvaluation?: GateEvaluation | null;
  draftReport?: DraftReport | null;
  learnerRows?: LearnerRow[];
  uploadedFileName?: string;
}

// Default Site Visit Review Sections
const defaultSiteVisitSections: ReviewSection[] = [
  {
    id: 'section_infrastructure',
    title: 'Infrastructure & Facilities',
    description: 'Review the training facilities, equipment, and safety measures.',
    isDefault: true,
    isActive: true,
    questions: [
      { id: 'classroom_facilities', label: 'Classroom Facilities', description: 'Are the classrooms adequate for the number of learners?', isDefault: true, isActive: true },
      { id: 'equipment_availability', label: 'Equipment Availability', description: 'Is the necessary equipment available and in working condition?', isDefault: true, isActive: true },
      { id: 'safety_measures', label: 'Safety Measures', description: 'Are health and safety measures properly implemented?', isDefault: true, isActive: true },
    ],
  },
  {
    id: 'section_training',
    title: 'Training & Assessment',
    description: 'Review the training delivery, materials, and assessment methods.',
    isDefault: true, isActive: true,
    questions: [
      { id: 'trainer_qualifications', label: 'Trainer Qualifications', description: 'Do trainers possess the required qualifications?', isDefault: true, isActive: true },
      { id: 'learning_materials', label: 'Learning Materials', description: 'Are learning materials up to date and accessible?', isDefault: true, isActive: true },
      { id: 'assessment_methods', label: 'Assessment Methods', description: 'Are assessment methods appropriate and valid?', isDefault: true, isActive: true },
    ],
  },
  {
    id: 'section_quality',
    title: 'Quality Management',
    description: 'Review quality management systems and learner support.',
    isDefault: true, isActive: true,
    questions: [
      { id: 'learner_support', label: 'Learner Support', description: 'Is there adequate learner support services in place?', isDefault: true, isActive: true },
      { id: 'record_keeping', label: 'Record Keeping', description: 'Are proper record keeping systems maintained?', isDefault: true, isActive: true },
      { id: 'quality_systems', label: 'Quality Systems', description: 'Are quality management systems implemented?', isDefault: true, isActive: true },
    ],
  },
];

// Label maps for display
const provinceLabelMap: Record<string, string> = {
  '1': 'Western Cape', '2': 'Eastern Cape', '3': 'Northern Cape', '4': 'Free State',
  '5': 'KwaZulu-Natal', '6': 'North West', '7': 'Gauteng', '8': 'Mpumalanga',
  '9': 'Limpopo', N: 'SA National', X: 'Outside SA',
};

const sorStatusLabelMap: Record<string, string> = {
  '01': 'Statement of Results issued', '02': 'Statement of Results not yet issued',
};

const readinessTypeLabelMap: Record<string, string> = {
  '1': 'Enrolled', '2': 'RPL for Access to EISA determined by SDP',
  '3': 'Mixed Mode to EISA', '4': 'SDP Training and assessment for readiness to EISA',
  '5': 'SDP e-learning training and assessment for readiness to EISA',
  '6': 'RPL for Access to EISA determined by Assessment Partner/Quality Partner',
};

const flcLabelMap: Record<string, string> = {
  '01': 'FLC certificate (competent)', '02': 'RPL', '03': 'Grade 12/NCV Level 4 pass',
  '04': 'Not yet competent', '05': 'FLC not completed yet', '06': 'Not applicable',
  '07': 'Enrolled for FLC', '08': 'N3 Mathematics and Business Language',
};

const genderLabelMap: Record<string, string> = { M: 'Male', F: 'Female' };

const formatDisplayDate = (value?: string) => {
  if (!value) return '-';
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  return value;
};

const buildInitialQuestionState = (sections: ReviewSection[]) => {
  const state: Record<string, ReviewQuestionState> = {};
  sections.forEach((section) => {
    section.questions.forEach((question) => {
      if (question.isActive !== false) {
        state[question.id] = { checked: false, comment: '', attachments: [] };
      }
    });
  });
  return state;
};

const SiteVisitManagement = () => {
  const { currentUser, enrolments, updateEnrolment } = useApp();
  const [selectedEnrolment, setSelectedEnrolment] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [externalEnrolments, setExternalEnrolments] = useState<ExternalLearnerEnrolment[]>([]);
  const [completedVisits, setCompletedVisits] = useState<CompletedSiteVisit[]>([]);

  // Review Sections State for dynamic checklist
  const [reviewSections, setReviewSections] = useState<ReviewSection[]>(defaultSiteVisitSections);
  const [questionState, setQuestionState] = useState<Record<string, ReviewQuestionState>>(
    buildInitialQuestionState(defaultSiteVisitSections)
  );
  
  // Reporting states that will directly reflect in the generated report
  const [summary, setSummary] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [overallCompliance, setOverallCompliance] = useState<'compliant' | 'partially_compliant' | 'non_compliant'>('compliant');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [nextSteps, setNextSteps] = useState('');
  const [overallReviewComments, setOverallReviewComments] = useState('');
  
  // New section/question inputs
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [newQuestionInputs, setNewQuestionInputs] = useState<Record<string, { label: string; description: string }>>({});
  
  // Evidence for photos/documents (general uploads)
  const [generalEvidence, setGeneralEvidence] = useState<Evidence[]>([]);
  
  // Generated report state
  const [generatedReport, setGeneratedReport] = useState<LearnerSiteVisitReport | null>(null);
  
  // Upload states
  const [uploading, setUploading] = useState(false);
  const [currentEvidenceDescription, setCurrentEvidenceDescription] = useState('');
  const [currentEvidenceType, setCurrentEvidenceType] = useState<'photo' | 'document'>('photo');

  // Listen for external submissions
  useEffect(() => {
    const loadExternalEnrolments = () => {
      const saved = localStorage.getItem(EXTERNAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setExternalEnrolments(parsed);
          console.log('Loaded external enrolments for Site Visit:', parsed);
        } catch (e) { console.error('Error loading external enrolments', e); }
      }
    };
    loadExternalEnrolments();
    const handleStorageChange = (e: StorageEvent) => { if (e.key === EXTERNAL_STORAGE_KEY) loadExternalEnrolments(); };
    const handleSyncEvent = () => loadExternalEnrolments();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(ENROLMENT_SYNC_EVENT, handleSyncEvent);
    const interval = setInterval(loadExternalEnrolments, 3000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(ENROLMENT_SYNC_EVENT, handleSyncEvent);
      clearInterval(interval);
    };
  }, []);

  // Helper functions
  const hasGateEvaluation = (enrolment: any): boolean => enrolment.gateEvaluation !== null && enrolment.gateEvaluation !== undefined;
  const hasDraftReport = (enrolment: any): boolean => enrolment.draftReport !== null && enrolment.draftReport !== undefined;
  const getLearnerRows = (enrolment: any): LearnerRow[] => enrolment.learnerRows || [];
  const getLearnerName = (enrolment: any): string => {
    if (enrolment.learnerDetails) {
      return `${enrolment.learnerDetails.firstName || ''} ${enrolment.learnerDetails.lastName || ''}`.trim() || '-';
    }
    return '-';
  };
  const getQualificationName = (enrolment: any): string => {
    if (enrolment.qualification) return enrolment.qualification.name || '-';
    if (enrolment.qualificationId) return enrolment.qualificationId;
    return '-';
  };
  const getQuarter = (enrolment: any): string => {
    if (enrolment.qpAllocation?.quarterlyPeriod) return enrolment.qpAllocation.quarterlyPeriod;
    if (enrolment.quarter) return enrolment.quarter;
    return '-';
  };

  const hiddenDefaultSections = reviewSections.filter((s) => s.isDefault && s.isActive === false);
  const hiddenDefaultQuestionsBySection = reviewSections.filter((s) => s.isActive !== false).map((s) => ({
    sectionId: s.id, sectionTitle: s.title,
    questions: s.questions.filter((q) => q.isDefault && q.isActive === false),
  })).filter((s) => s.questions.length > 0);

  const restoreSection = (sectionId: string) => {
    setReviewSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, isActive: true, questions: s.questions.map((q) => ({ ...q, isActive: true })) } : s));
  };
  const restoreQuestion = (sectionId: string, questionId: string) => {
    setReviewSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, questions: s.questions.map((q) => q.id === questionId ? { ...q, isActive: true } : q) } : s));
    setQuestionState((prev) => ({ ...prev, [questionId]: { checked: false, comment: '', attachments: [] } }));
  };
  const addSection = () => {
    if (!newSectionTitle.trim()) return;
    setReviewSections((prev) => [...prev, { id: `section_${Date.now()}`, title: newSectionTitle.trim(), description: newSectionDescription.trim(), questions: [] }]);
    setNewSectionTitle(''); setNewSectionDescription('');
  };
  const removeSection = (sectionId: string) => {
    setReviewSections((prev) => prev.map((s) => s.id === sectionId ? (s.isDefault ? { ...s, isActive: false, questions: s.questions.map((q) => ({ ...q, isActive: false })) } : null) : s).filter(Boolean) as ReviewSection[]);
    setNewQuestionInputs((prev) => { const updated = { ...prev }; delete updated[sectionId]; return updated; });
  };
  const addQuestionToSection = (sectionId: string) => {
    const input = newQuestionInputs[sectionId];
    if (!input?.label?.trim()) return;
    const newQuestion: ReviewQuestion = { id: `question_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, label: input.label.trim(), description: input.description.trim(), isDefault: false, isActive: true };
    setReviewSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, questions: [...s.questions, newQuestion] } : s));
    setQuestionState((prev) => ({ ...prev, [newQuestion.id]: { checked: false, comment: '', attachments: [] } }));
    setNewQuestionInputs((prev) => ({ ...prev, [sectionId]: { label: '', description: '' } }));
  };
  const removeQuestionFromSection = (sectionId: string, questionId: string) => {
    setReviewSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, questions: s.questions.map((q) => q.id === questionId ? (q.isDefault ? { ...q, isActive: false } : null) : q).filter(Boolean) as ReviewQuestion[] } : s));
    const removedQuestion = reviewSections.find((s) => s.id === sectionId)?.questions.find((q) => q.id === questionId);
    if (!removedQuestion?.isDefault) { setQuestionState((prev) => { const updated = { ...prev }; delete updated[questionId]; return updated; }); }
  };
  const updateQuestionCheck = (questionId: string, checked: boolean) => {
    setQuestionState((prev) => ({ ...prev, [questionId]: { ...(prev[questionId] || { checked: false, comment: '', attachments: [] }), checked } }));
  };
  const updateQuestionComment = (questionId: string, comment: string) => {
    setQuestionState((prev) => ({ ...prev, [questionId]: { ...(prev[questionId] || { checked: false, comment: '', attachments: [] }), comment } }));
  };
  const handleQuestionAttachmentUpload = (questionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const attachments: ChecklistAttachment[] = files.map((file) => ({ id: `${questionId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: file.name, uploadedAt: new Date().toISOString(), url: URL.createObjectURL(file) }));
    setQuestionState((prev) => ({ ...prev, [questionId]: { ...(prev[questionId] || { checked: false, comment: '', attachments: [] }), attachments: [...(prev[questionId]?.attachments || []), ...attachments] } }));
  };
  const removeAttachment = (questionId: string, attachmentId: string) => {
    setQuestionState((prev) => ({ ...prev, [questionId]: { ...(prev[questionId] || { checked: false, comment: '', attachments: [] }), attachments: (prev[questionId]?.attachments || []).filter((item) => item.id !== attachmentId) } }));
  };
  const handleGeneralEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const files = Array.from(e.target.files);
    for (const file of files) {
      setGeneralEvidence(prev => [...prev, { id: `ev-${Date.now()}-${Math.random()}`, type: currentEvidenceType, fileName: file.name, fileUrl: URL.createObjectURL(file), uploadedAt: new Date().toISOString(), description: currentEvidenceDescription || `${currentEvidenceType === 'photo' ? 'Photo' : 'Document'} evidence` }]);
    }
    setUploading(false);
    setCurrentEvidenceDescription('');
  };
  const removeGeneralEvidence = (evidenceId: string) => {
    setGeneralEvidence(prev => prev.filter(ev => ev.id !== evidenceId));
  };

  const completedEnrolmentIds = new Set(completedVisits.map(cv => cv.enrolmentId));

  const pendingSiteVisits = [
    ...enrolments.filter(e =>
      (e.status === 'Plans Consolidated' || e.status === 'Site Visit Pending' || (e.consolidatedPlans?.sharedAt && e.status !== 'Site Visit Completed')) &&
      !completedEnrolmentIds.has(e.enrolmentId)
    ),
    ...externalEnrolments.filter((e: ExternalLearnerEnrolment) =>
      (e.status === 'Site Visit Pending' || e.consolidatedPlans?.sharedAt) &&
      !enrolments.some(ce => ce.id === e.id) &&
      !completedEnrolmentIds.has(e.enrolmentId)
    ),
  ];

  const viewEnrolment = (enrolment: any) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
    setGeneratedReport(null);
    if (!enrolment.siteVisit?.report) {
      resetSiteVisitTool();
    } else {
      loadExistingReport(enrolment.siteVisit.report);
    }
  };

  const resetSiteVisitTool = () => {
    setReviewSections(defaultSiteVisitSections);
    setQuestionState(buildInitialQuestionState(defaultSiteVisitSections));
    setGeneralEvidence([]);
    setSummary('');
    setRecommendations('');
    setOverallCompliance('compliant');
    setRiskLevel('low');
    setNextSteps('');
    setOverallReviewComments('');
    setCurrentEvidenceDescription('');
    setNewQuestionInputs({});
    setNewSectionTitle('');
    setNewSectionDescription('');
    setGeneratedReport(null);
  };

  const loadExistingReport = (report: LearnerSiteVisitReport) => {
    // Reconstruct sections from report checklist
    const sectionsMap = new Map<string, ReviewSection>();
    report.checklist.forEach((item) => {
      let section = sectionsMap.get(item.id);
      if (!section) {
        section = { id: `section_${item.id}`, title: item.criteria.substring(0, 50), description: item.description || '', isDefault: false, isActive: true, questions: [] };
        sectionsMap.set(item.id, section);
      }
      section.questions.push({ id: item.id, label: item.criteria, description: item.description || '', isDefault: false, isActive: true });
    });
    const loadedSections = Array.from(sectionsMap.values());
    if (loadedSections.length > 0) setReviewSections(loadedSections);
    else setReviewSections(defaultSiteVisitSections);
    
    const loadedState: Record<string, ReviewQuestionState> = {};
    report.checklist.forEach((item) => { 
      loadedState[item.id] = { 
        checked: item.isMet, 
        comment: item.comments || '', 
        attachments: [] 
      }; 
    });
    setQuestionState(loadedState);
    setGeneralEvidence(report.evidence || []);
    setSummary(report.summary);
    setRecommendations(report.recommendations);
    setOverallCompliance(report.overallCompliance);
    setRiskLevel(report.riskLevel);
    setNextSteps(report.nextSteps);
    setOverallReviewComments('');
  };

  // Generate report - ONLY includes active sections and questions (no placeholders for removed items)
  const generateReport = (): LearnerSiteVisitReport => {
    // Collect all attachments from questionState into a combined evidence array
    const checklistAttachments: Evidence[] = [];
    Object.entries(questionState).forEach(([questionId, state]) => {
      state.attachments.forEach(attachment => {
        checklistAttachments.push({
          id: attachment.id,
          type: 'document',
          fileName: attachment.name,
          fileUrl: attachment.url,
          uploadedAt: attachment.uploadedAt,
          description: `Attachment for checklist item`
        });
      });
    });
    
    // Combine general evidence with checklist attachments
    const allEvidence = [...generalEvidence, ...checklistAttachments];
    
    // Only include active sections and their active questions
    // IMPORTANT: Removed sections/questions (isActive === false) are EXCLUDED entirely
    const flattenedChecklist = reviewSections
      .filter((s) => s.isActive !== false) // Only active sections
      .flatMap((s) =>
        s.questions
          .filter((q) => q.isActive !== false) // Only active questions
          .map((q) => {
            const qState = questionState[q.id];
            return {
              id: q.id,
              criteria: q.label,
              description: q.description,
              isMet: qState?.checked || false,
              comments: qState?.comment || '',
              evidenceIds: (qState?.attachments || []).map(a => a.id),
            };
          })
      );
    
    // Use the user-selected values from the Evaluation tab directly
    return {
      id: `report-${Date.now()}`,
      conductedBy: currentUser.name,
      conductedAt: new Date().toISOString(),
      checklist: flattenedChecklist,
      evidence: allEvidence,
      summary,
      recommendations,
      overallCompliance,
      riskLevel,
      nextSteps,
      // Include overall review comments as additional field
      ...(overallReviewComments && { overallReviewComments } as any),
    };
  };

  const handleGenerateReport = () => {
    const report = generateReport();
    setGeneratedReport(report);
    setActiveTab('report');
  };

  const handleSubmitReport = () => {
    if (!selectedEnrolment || !generatedReport) return;
    setIsSubmitting(true);

    const newCompletedVisit: CompletedSiteVisit = {
      id: `cv-${Date.now()}`,
      enrolmentId: selectedEnrolment.enrolmentId,
      learnerName: getLearnerName(selectedEnrolment),
      qualification: getQualificationName(selectedEnrolment),
      visitDate: generatedReport.conductedAt,
      submittedDate: new Date().toISOString(),
      inspector: generatedReport.conductedBy,
      compliance: generatedReport.overallCompliance,
      riskLevel: generatedReport.riskLevel,
      findings: generatedReport.summary || '-',
      originalEnrolment: selectedEnrolment,
    };
    setCompletedVisits(prev => [...prev, newCompletedVisit]);

    const reportBlob = new Blob([JSON.stringify(generatedReport, null, 2)], { type: 'application/json' });
    const reportUrl = URL.createObjectURL(reportBlob);
    updateEnrolment(selectedEnrolment.id, {
      siteVisit: { ...selectedEnrolment.siteVisit, status: 'completed', report: generatedReport, reportUrl: reportUrl, completedAt: new Date().toISOString(), notes: summary.substring(0, 200) },
      status: 'Site Visit Completed' as LearnerEnrolmentStatus
    });
    setIsSubmitting(false);
    setIsViewModalOpen(false);
  };

  const handleViewCompletedVisit = (visit: CompletedSiteVisit) => {
    viewEnrolment(visit.originalEnrolment);
  };

  const getStatusBadge = (status: LearnerEnrolmentStatus | string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      Draft: { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Draft' },
      'Plans Consolidated': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Plans Consolidated' },
      'Site Visit Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Site Visit Pending' },
      'Site Visit Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Site Visit Completed' },
    };
    const config = statusConfig[status] ?? { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3 mr-1" />, label: status };
    return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.icon}{config.label}</span>;
  };

  const safeFormatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '-';
    try { return new Date(dateString).toLocaleString(); } catch { return '-'; }
  };
  const safeFormatDateTime = (dateString: string | undefined | null) => {
    if (!dateString) return '-';
    try { return new Date(dateString).toLocaleString(); } catch { return '-'; }
  };
  const calculateComplianceScore = () => {
    const activeQuestions = reviewSections.filter(s => s.isActive !== false).flatMap(s => s.questions.filter(q => q.isActive !== false));
    const metCount = activeQuestions.filter(q => questionState[q.id]?.checked).length;
    const totalCount = activeQuestions.length;
    return totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;
  };

  // Get count of attachments across all questions
  const totalAttachments = Object.values(questionState).reduce((sum, state) => sum + (state.attachments?.length || 0), 0);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Site Visit Management</h3>
      <p className="text-gray-600">Conduct site visits using the Site Visit Evaluation Tool</p>
      <div className="text-xs text-green-600 mb-2">🔄 Auto-syncing with external submissions...</div>
      
      {pendingSiteVisits.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Pending Site Visits</h4>
            <p className="text-sm text-gray-500">Enrolments ready for site visit evaluation</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Enrolment ID</TableHead><TableHead>Learner Name</TableHead><TableHead>Qualification</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {pendingSiteVisits.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{getLearnerName(enrolment)}</TableCell>
                  <TableCell>{getQualificationName(enrolment)}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}><Eye className="h-4 w-4 mr-2" />Conduct Site Visit</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No pending site visits. Waiting for consolidated plans to be shared.
          <div className="text-xs text-gray-400 mt-2">Listening for shared plans...</div>
        </div>
      )}

      {/* Completed Site Visits Table */}
      {completedVisits.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Completed Site Visits</h4>
            <p className="text-sm text-gray-500">Site visits with submitted reports</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrolment ID</TableHead>
                <TableHead>Learner Name</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Visit Date</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedVisits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="font-medium">{visit.enrolmentId}</TableCell>
                  <TableCell>{visit.learnerName}</TableCell>
                  <TableCell>{visit.qualification}</TableCell>
                  <TableCell>{safeFormatDate(visit.visitDate)}</TableCell>
                  <TableCell>{safeFormatDate(visit.submittedDate)}</TableCell>
                  <TableCell>{visit.inspector}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />Completed
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleViewCompletedVisit(visit)}>
                      <Eye className="h-4 w-4 mr-2" />View Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* QA Site Visit Tracker */}
      <div className="bg-white rounded-lg border border-gray-200 mt-4">
        <div className="p-4 border-b bg-gray-50">
          <h4 className="font-medium text-gray-900">QA Site Visit Tracker</h4>
          <p className="text-sm text-gray-500">Live overview of all site visit activity</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-gray-100">
          <div className="bg-blue-50 rounded-lg p-4 flex flex-col items-center">
            <Calendar className="h-6 w-6 text-blue-600 mb-1" />
            <p className="text-2xl font-bold text-blue-700">{pendingSiteVisits.length + completedVisits.length}</p>
            <p className="text-xs text-blue-600 mt-1 text-center">Total Scheduled</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 flex flex-col items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mb-1" />
            <p className="text-2xl font-bold text-green-700">{completedVisits.length}</p>
            <p className="text-xs text-green-600 mt-1 text-center">Completed</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 flex flex-col items-center">
            <Clock className="h-6 w-6 text-yellow-600 mb-1" />
            <p className="text-2xl font-bold text-yellow-700">{pendingSiteVisits.length}</p>
            <p className="text-xs text-yellow-600 mt-1 text-center">Pending</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 flex flex-col items-center">
            <ClipboardList className="h-6 w-6 text-purple-600 mb-1" />
            <p className="text-2xl font-bold text-purple-700">{completedVisits.filter(cv => cv.findings && cv.findings !== '-').length}</p>
            <p className="text-xs text-purple-600 mt-1 text-center">Findings Logged</p>
          </div>
        </div>

        {/* Tracker Table */}
        {(pendingSiteVisits.length > 0 || completedVisits.length > 0) ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrolment ID</TableHead>
                <TableHead>Learner Name</TableHead>
                <TableHead>Visit Date</TableHead>
                <TableHead>Inspector</TableHead>
                <TableHead>Key Findings</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSiteVisits.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{getLearnerName(enrolment)}</TableCell>
                  <TableCell>{safeFormatDate(('siteVisit' in enrolment ? enrolment.siteVisit?.scheduledDate : undefined)) || '—'}</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell className="text-gray-400 italic">Not yet conducted</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />Pending
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {completedVisits.map((cv) => (
                <TableRow key={cv.id}>
                  <TableCell className="font-medium">{cv.enrolmentId}</TableCell>
                  <TableCell>{cv.learnerName}</TableCell>
                  <TableCell>{safeFormatDate(cv.visitDate)}</TableCell>
                  <TableCell>{cv.inspector}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-gray-700" title={cv.findings}>{cv.findings || '—'}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />Completed
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6 text-center text-gray-500 text-sm">
            No site visits to track yet.
          </div>
        )}
      </div>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-7xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Site Visit Evaluation Tool</DialogTitle></DialogHeader>
          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="details">Enrolment Details</TabsTrigger>
                <TabsTrigger value="gateEvaluation">Gate Evaluation</TabsTrigger>
                <TabsTrigger value="draftReport">Draft Report</TabsTrigger>
                <TabsTrigger value="submittedPlans">Submitted Plans</TabsTrigger>
                <TabsTrigger value="consolidatedPlans">Consolidated Plans</TabsTrigger>
                <TabsTrigger value="evaluation">Evaluation & Report</TabsTrigger>
                <TabsTrigger value="report">Generated Report</TabsTrigger>
              </TabsList>

              {/* Tab 1: Details */}
              <TabsContent value="details" className="space-y-6 py-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-semibold text-gray-900">Submission Header</h3><p className="text-sm text-gray-600">Full enrolment submission details</p></div>{getStatusBadge(selectedEnrolment.status)}</div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div><p className="text-xs text-gray-500">Enrolment ID</p><p className="font-medium">{selectedEnrolment.enrolmentId}</p></div>
                    <div><p className="text-xs text-gray-500">SDP Code</p><p className="font-medium">{selectedEnrolment.sdpCode || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Qualification ID</p><p className="font-medium">{getQualificationName(selectedEnrolment)}</p></div>
                    <div><p className="text-xs text-gray-500">Assessment Centre Code</p><p className="font-medium">{selectedEnrolment.assessmentCentreCode || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Date Stamp</p><p className="font-medium">{selectedEnrolment.dateStamp || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Quarter</p><p className="font-medium">{getQuarter(selectedEnrolment)}</p></div>
                    <div><p className="text-xs text-gray-500">Submitted By</p><p className="font-medium">{selectedEnrolment.submittedBy || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">Submitted At</p><p className="font-medium">{safeFormatDateTime(selectedEnrolment.plansReports?.submittedAt)}</p></div>
                    <div><p className="text-xs text-gray-500">QP Allocation</p><p className="font-medium">{selectedEnrolment.qpAllocation?.allocatedTo || '-'}</p></div>
                    <div><p className="text-xs text-gray-500">QP Allocation Date</p><p className="font-medium">{safeFormatDateTime(selectedEnrolment.qpAllocation?.allocatedAt)}</p></div>
                  </div>
                </div>
                <div className="space-y-4"><h3 className="text-lg font-semibold text-gray-900">Learner Information</h3><div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg"><div><Label className="text-sm text-gray-500">Name</Label><p className="font-medium">{getLearnerName(selectedEnrolment)}</p></div><div><Label className="text-sm text-gray-500">ID Number</Label><p className="font-medium">{selectedEnrolment.learnerDetails?.idNumber || '-'}</p></div><div><Label className="text-sm text-gray-500">Email</Label><p className="font-medium">{selectedEnrolment.learnerDetails?.email || '-'}</p></div><div><Label className="text-sm text-gray-500">Phone</Label><p className="font-medium">{selectedEnrolment.learnerDetails?.phone || '-'}</p></div></div></div>
                <div className="space-y-4"><h3 className="text-lg font-semibold text-gray-900">Qualification Details</h3><div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg"><div><Label className="text-sm text-gray-500">Qualification Name</Label><p className="font-medium">{getQualificationName(selectedEnrolment)}</p></div><div><Label className="text-sm text-gray-500">Code</Label><p className="font-medium">{selectedEnrolment.qualification?.code || '-'}</p></div></div></div>
                <div className="rounded-2xl border border-gray-200 bg-white"><div className="border-b border-gray-200 px-5 py-4"><h3 className="text-lg font-semibold text-gray-900">Learner Rows</h3><p className="text-sm text-gray-600">These rows reflect the same learner data captured earlier in the process.</p></div><div className="overflow-x-auto p-5"><Table><TableHeader><TableRow><TableHead>National ID</TableHead><TableHead>Alternate ID</TableHead><TableHead>Last Name</TableHead><TableHead>First Name</TableHead><TableHead>Gender</TableHead><TableHead>Birth Date</TableHead><TableHead>Province</TableHead><TableHead>POPIA Agree</TableHead><TableHead>SOR Status</TableHead><TableHead>Readiness Type</TableHead><TableHead>FLC</TableHead></TableRow></TableHeader><TableBody>{getLearnerRows(selectedEnrolment).length === 0 ? (<TableRow><TableCell colSpan={11} className="py-10 text-center text-gray-500">No learner rows found.</TableCell></TableRow>) : (getLearnerRows(selectedEnrolment).map((row: LearnerRow) => (<TableRow key={row.id}><TableCell>{row.nationalId || '-'}</TableCell><TableCell>{row.alternateId || '-'}</TableCell><TableCell>{row.lastName || '-'}</TableCell><TableCell>{row.firstName || '-'}</TableCell><TableCell>{genderLabelMap[row.gender] || row.gender || '-'}</TableCell><TableCell>{formatDisplayDate(row.birthDate)}</TableCell><TableCell>{provinceLabelMap[row.province] || row.province || '-'}</TableCell><TableCell>{row.popiaAgree || '-'}</TableCell><TableCell>{sorStatusLabelMap[row.sorStatus] || row.sorStatus || '-'}</TableCell><TableCell>{readinessTypeLabelMap[row.readinessType] || row.readinessType || '-'}</TableCell><TableCell>{flcLabelMap[row.flc] || row.flc || '-'}</TableCell></TableRow>)))}</TableBody></Table></div></div>
              </TabsContent>

              {/* Tab 2: Gate Evaluation */}
              <TabsContent value="gateEvaluation" className="space-y-6 py-4">
                {!hasGateEvaluation(selectedEnrolment) ? (<div className="rounded-2xl border border-gray-200 bg-gray-50 p-5"><p className="text-sm text-gray-600">No gate evaluation has been completed for this enrolment.</p></div>) : (
                  <div className="space-y-4"><div className={`p-4 rounded-lg ${selectedEnrolment.gateEvaluation.status === 'passed' ? 'bg-green-50' : 'bg-red-50'}`}><p className={`font-medium ${selectedEnrolment.gateEvaluation.status === 'passed' ? 'text-green-800' : 'text-red-800'}`}>{selectedEnrolment.gateEvaluation.status === 'passed' ? '✓ Gate Evaluation Passed' : '✗ Gate Evaluation Failed'}</p><p className="text-xs text-gray-500 mt-2">Generated: {safeFormatDateTime(selectedEnrolment.gateEvaluation.generatedAt)}</p></div>
                  {selectedEnrolment.gateEvaluation.checklistResults?.length > 0 && (<div className="rounded-2xl border border-gray-200 bg-white p-5"><h4 className="font-medium mb-3">Gate Evaluation Checklist Results</h4><div className="space-y-3">{selectedEnrolment.gateEvaluation.checklistResults.map((item: GateCheckItem, idx: number) => (<div key={idx} className={`rounded-xl border p-4 ${item.isMet ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}><div className="flex items-center gap-2 mb-1">{item.isMet ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}<span className="font-medium">{item.criteria}</span></div><p className="text-sm text-gray-700">{item.detail}</p></div>))}</div></div>)}
                  {selectedEnrolment.gateEvaluation.failureReasons?.length > 0 && (<div className="rounded-2xl border border-red-200 bg-red-50 p-5"><h4 className="font-medium text-red-900 mb-3">Failure Details</h4><div className="space-y-2">{selectedEnrolment.gateEvaluation.failureReasons.map((reason: string, idx: number) => (<div key={idx} className="rounded-xl border border-red-100 bg-white px-4 py-3 text-sm font-medium text-red-900">{reason}</div>))}</div></div>)}
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: Draft Report */}
              <TabsContent value="draftReport" className="space-y-5 py-4">
                {!hasDraftReport(selectedEnrolment) ? (<div className="rounded-2xl border border-gray-200 bg-gray-50 p-5"><p className="text-sm text-gray-600">No draft report is available for this enrolment.</p></div>) : (
                  <div className="space-y-5"><div className="rounded-2xl border border-green-200 bg-green-50 p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-green-700" /><div><p className="font-semibold text-green-900">Draft learner enrolment report generated</p><p className="text-sm text-green-800">Full report data carried forward from the external submission.</p></div></div></div>
                  <div className="rounded-2xl border border-gray-200 bg-white p-6"><div className="mb-5 flex items-start justify-between gap-4 border-b pb-4"><div><h3 className="text-xl font-bold text-gray-900">{selectedEnrolment.draftReport.reportTitle}</h3><p className="text-sm text-gray-600">Generated learner enrolment validation report.</p></div><div className="rounded-xl bg-gray-50 px-4 py-3 text-sm"><p className="text-gray-500">Generated</p><p className="font-semibold text-gray-900">{safeFormatDateTime(selectedEnrolment.draftReport.generatedAt)}</p></div></div>
                  <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"><div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs text-gray-500">Total Rows</p><p className="mt-1 text-2xl font-bold">{selectedEnrolment.draftReport.summary.totalRows}</p></div><div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs text-gray-500">Valid Rows</p><p className="mt-1 text-2xl font-bold text-green-700">{selectedEnrolment.draftReport.summary.validRows}</p></div><div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs text-gray-500">Invalid Rows</p><p className="mt-1 text-2xl font-bold text-red-700">{selectedEnrolment.draftReport.summary.invalidRows}</p></div><div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs text-gray-500">Method</p><p className="mt-1 font-semibold capitalize">{selectedEnrolment.draftReport.summary.submissionMethod}</p></div><div className="rounded-xl border border-gray-200 bg-gray-50 p-4"><p className="text-xs text-gray-500">Uploaded File</p><p className="mt-1 font-semibold">{selectedEnrolment.draftReport.summary.uploadedFileName || 'Manual only'}</p></div></div>
                  <div className="mb-6"><h4 className="mb-3 text-base font-semibold text-gray-900">Validation Checks</h4><div className="space-y-3">{selectedEnrolment.draftReport.validationChecks.map((check: GateCheckItem, index: number) => (<div key={index} className={`rounded-xl border p-4 ${check.isMet ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}><div className="mb-1 flex items-center gap-2">{check.isMet ? <CheckCircle2 className="h-4 w-4 text-green-700" /> : <XCircle className="h-4 w-4 text-red-700" />}<p className="font-semibold text-gray-900">{check.criteria}</p></div><p className="text-sm text-gray-700">{check.detail}</p></div>))}</div></div>
                  <div><h4 className="mb-3 text-base font-semibold text-gray-900">Report Notes</h4><div className="space-y-2">{selectedEnrolment.draftReport.notes.map((note: string, index: number) => (<div key={index} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{note}</div>))}</div></div></div></div>
                )}
              </TabsContent>

              {/* Tab 4: Submitted Plans */}
              <TabsContent value="submittedPlans" className="space-y-6 py-4">
                {selectedEnrolment.plansReports ? (<div className="bg-blue-50 p-4 rounded-lg"><p className="text-blue-800 font-medium">✓ Plans & Reports Submitted by QP</p><a href={selectedEnrolment.plansReports.documentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-2 mt-2"><FileText className="h-4 w-4" />{selectedEnrolment.plansReports.documentName}</a><p className="text-xs text-gray-500 mt-2">Submitted by: {selectedEnrolment.plansReports.uploadedBy}</p><p className="text-xs text-gray-500">Submitted on: {safeFormatDate(selectedEnrolment.plansReports?.submittedAt)}</p></div>) : (<div className="text-center text-gray-500 py-8">No plans and reports have been submitted yet.</div>)}
              </TabsContent>

              {/* Tab 5: Consolidated Plans */}
              <TabsContent value="consolidatedPlans" className="space-y-6 py-4">
                {selectedEnrolment.consolidatedPlans ? (<div className="bg-purple-50 p-4 rounded-lg"><p className="text-purple-800 font-medium">✓ Plans Consolidated & Shared</p><a href={selectedEnrolment.consolidatedPlans.documentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-2 mt-2"><FileText className="h-4 w-4" />{selectedEnrolment.consolidatedPlans.documentName}</a><p className="text-xs text-gray-500 mt-2">Shared on: {safeFormatDate(selectedEnrolment.consolidatedPlans.sharedAt)}</p><p className="text-xs text-gray-500">Shared with: {selectedEnrolment.consolidatedPlans.sharedWith?.join(', ') || '-'}</p></div>) : (<div className="text-center text-gray-500 py-8">No consolidated plans available yet.</div>)}
              </TabsContent>

              {/* Tab 6: Evaluation & Report - This tab directly maps to the Generated Report */}
              <TabsContent value="evaluation" className="space-y-6 py-4">
                <div className="space-y-6">
                  {/* Add Section Area */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="mb-4 flex items-center gap-2"><FolderPlus className="h-5 w-5 text-gray-700" /><h4 className="font-medium text-gray-900">Checklist Sections</h4></div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><div><Label>New Section Title</Label><Input value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)} placeholder="Enter section title" /></div><div><Label>New Section Description</Label><Input value={newSectionDescription} onChange={(e) => setNewSectionDescription(e.target.value)} placeholder="Enter section description" /></div></div>
                    <div className="mt-4"><Button type="button" variant="outline" onClick={addSection}><Plus className="h-4 w-4 mr-2" />Add Section</Button></div>
                  </div>

                  {hiddenDefaultSections.length > 0 && (<div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-5"><h4 className="font-medium text-amber-900 mb-3">Restore Default Sections</h4><div className="flex flex-wrap gap-3">{hiddenDefaultSections.map((section) => (<Button key={section.id} variant="outline" onClick={() => restoreSection(section.id)}><Plus className="h-4 w-4 mr-2" />Add Back {section.title}</Button>))}</div></div>)}
                  {hiddenDefaultQuestionsBySection.length > 0 && (<div className="rounded-2xl border border-dashed border-blue-300 bg-blue-50 p-5"><h4 className="font-medium text-blue-900 mb-3">Restore Default Questions</h4><div className="space-y-4">{hiddenDefaultQuestionsBySection.map((section) => (<div key={section.sectionId}><p className="text-sm font-medium text-blue-900 mb-2">{section.sectionTitle}</p><div className="flex flex-wrap gap-3">{section.questions.map((question) => (<Button key={question.id} variant="outline" onClick={() => restoreQuestion(section.sectionId, question.id)}><Plus className="h-4 w-4 mr-2" />Add Back {question.label}</Button>))}</div></div>))}</div></div>)}

                  {/* Active Sections - ONLY selected sections appear, no X placeholders for removed items */}
                  <div className="space-y-5">
                    {reviewSections.filter((s) => s.isActive !== false).length === 0 ? (
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
                        <p className="text-gray-500">No sections added. Use the "Add Section" button above to create checklist sections.</p>
                      </div>
                    ) : (
                      reviewSections.filter((s) => s.isActive !== false).map((section) => (
                        <div key={section.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                          <div className="mb-4 flex items-start justify-between gap-4"><div><h4 className="font-semibold text-gray-900">{section.title}</h4><p className="text-sm text-gray-500">{section.description}</p></div><Button variant="ghost" size="sm" onClick={() => removeSection(section.id)}><Trash2 className="h-4 w-4 mr-2" />Remove Section</Button></div>
                          <div className="mb-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><div><Label>Add Question</Label><Input value={newQuestionInputs[section.id]?.label || ''} onChange={(e) => setNewQuestionInputs((prev) => ({ ...prev, [section.id]: { label: e.target.value, description: prev[section.id]?.description || '' } }))} placeholder="Enter question label" /></div><div><Label>Question Description</Label><Input value={newQuestionInputs[section.id]?.description || ''} onChange={(e) => setNewQuestionInputs((prev) => ({ ...prev, [section.id]: { label: prev[section.id]?.label || '', description: e.target.value } }))} placeholder="Enter question description" /></div></div>
                            <div className="mt-3"><Button variant="outline" onClick={() => addQuestionToSection(section.id)}><Plus className="h-4 w-4 mr-2" />Add Question</Button></div>
                          </div>
                          <div className="space-y-4">
                            {section.questions.filter((q) => q.isActive !== false).length === 0 ? (<div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500 text-center">No questions in this section yet.</div>) : (
                              section.questions.filter((q) => q.isActive !== false).map((question) => (
                                <div key={question.id} className="rounded-xl border border-gray-200 p-4">
                                  <div className="mb-3 flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3"><Checkbox id={question.id} checked={questionState[question.id]?.checked || false} onCheckedChange={(checked) => updateQuestionCheck(question.id, checked === true)} /><div><Label htmlFor={question.id} className="font-medium cursor-pointer text-gray-900">{question.label}</Label><p className="text-sm text-gray-500">{question.description}</p></div></div>
                                    <Button variant="ghost" size="sm" onClick={() => removeQuestionFromSection(section.id, question.id)}><Trash2 className="h-4 w-4 mr-2" />Remove</Button>
                                  </div>
                                  <div className="space-y-3">
                                    <div><Label>Comment for this checklist item</Label><Textarea value={questionState[question.id]?.comment || ''} onChange={(e) => updateQuestionComment(question.id, e.target.value)} placeholder="Add additional context for this specific checklist item..." rows={3} className="mt-1" /></div>
                                    <div><Label className="mb-2 block">Upload Supporting Documents</Label><div className="flex flex-wrap items-center gap-3"><Input type="file" multiple onChange={(e) => handleQuestionAttachmentUpload(question.id, e)} className="max-w-sm" /><div className="text-sm text-gray-500 flex items-center gap-2"><Upload className="h-4 w-4" />Attach evidence directly to this checklist item</div></div>
                                    {(questionState[question.id]?.attachments || []).length > 0 && (<div className="mt-3 space-y-2">{(questionState[question.id]?.attachments || []).map((attachment) => (<div key={attachment.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><a href={attachment.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-2"><FileText className="h-4 w-4" />{attachment.name}</a><Button variant="ghost" size="sm" onClick={() => removeAttachment(question.id, attachment.id)}><Trash2 className="h-4 w-4" /></Button></div>))}</div>)}</div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* General Evidence Upload */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">General Evidence Upload</h4>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button variant={currentEvidenceType === 'photo' ? 'default' : 'outline'} onClick={() => setCurrentEvidenceType('photo')} className="flex-1"><Camera className="h-4 w-4 mr-2" />Photos</Button>
                        <Button variant={currentEvidenceType === 'document' ? 'default' : 'outline'} onClick={() => setCurrentEvidenceType('document')} className="flex-1"><FileText className="h-4 w-4 mr-2" />Documents</Button>
                      </div>
                      <Input placeholder="Description of evidence..." value={currentEvidenceDescription} onChange={(e) => setCurrentEvidenceDescription(e.target.value)} />
                      <div className="flex items-center gap-4">
                        <Input type="file" accept={currentEvidenceType === 'photo' ? 'image/*' : '.pdf,.doc,.docx'} onChange={handleGeneralEvidenceUpload} multiple className="flex-1" />
                        <Button variant="outline" disabled={uploading}><Upload className="h-4 w-4 mr-2" />Upload</Button>
                      </div>
                      {generalEvidence.length > 0 && (
                        <div className="mt-3">
                          <Label>Uploaded Evidence:</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {generalEvidence.map(ev => (
                              <div key={ev.id} className="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded">
                                <div className="flex items-center gap-2 flex-1">
                                  {ev.type === 'photo' ? <Camera className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                  <a href={ev.fileUrl} target="_blank" className="text-sm text-blue-600 hover:underline truncate flex-1">{ev.fileName}</a>
                                  <span className="text-xs text-gray-500 truncate max-w-[150px]">{ev.description}</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => removeGeneralEvidence(ev.id)}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reporting Section - These values directly populate the Generated Report */}
                  <div className="border rounded-lg p-4 bg-blue-50/30">
                    <h4 className="font-semibold text-gray-900 mb-3">Site Visit Reporting (Directly reflects in Generated Report)</h4>
                    <div className="space-y-4">
                      <div><Label className="text-red-500">Overall Summary of Findings *</Label><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Provide a comprehensive summary of the site visit findings..." rows={4} className="mt-1" /></div>
                      <div><Label className="text-red-500">Recommendations *</Label><Textarea value={recommendations} onChange={(e) => setRecommendations(e.target.value)} placeholder="Provide recommendations based on findings..." rows={4} className="mt-1" /></div>
                      <div className="grid grid-cols-2 gap-4"><div><Label>Overall Compliance</Label><select value={overallCompliance} onChange={(e) => setOverallCompliance(e.target.value as any)} className="w-full p-2 border rounded-md mt-1"><option value="compliant">Compliant</option><option value="partially_compliant">Partially Compliant</option><option value="non_compliant">Non-Compliant</option></select></div><div><Label>Risk Level</Label><select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as any)} className="w-full p-2 border rounded-md mt-1"><option value="low">Low Risk</option><option value="medium">Medium Risk</option><option value="high">High Risk</option></select></div></div>
                      <div><Label className="text-red-500">Next Steps / Action Plan *</Label><Textarea value={nextSteps} onChange={(e) => setNextSteps(e.target.value)} placeholder="Outline the next steps and action plan..." rows={3} className="mt-1" /></div>
                      <div><Label>Overall Review Comments</Label><Textarea value={overallReviewComments} onChange={(e) => setOverallReviewComments(e.target.value)} placeholder="Add overall review comments for the site visit..." rows={3} className="mt-1" /></div>
                    </div>
                  </div>

                  {/* Generate Report Button */}
                  <div className="flex justify-between items-center pt-4">
                    <div className="text-sm text-gray-500">
                      {reviewSections.filter(s => s.isActive !== false).length} sections, {reviewSections.filter(s => s.isActive !== false).flatMap(s => s.questions.filter(q => q.isActive !== false)).length} questions, {generalEvidence.length + totalAttachments} attachments
                    </div>
                    <Button onClick={handleGenerateReport} className="bg-blue-600 hover:bg-blue-700"><FileText className="h-4 w-4 mr-2" />Generate Report</Button>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 7: Generated Report */}
              <TabsContent value="report" className="space-y-6 py-4">
                {generatedReport ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
                      <h3 className="text-xl font-bold mb-2">Site Visit Report</h3>
                      <p className="text-sm opacity-90">Enrolment: {selectedEnrolment.enrolmentId}</p>
                      <p className="text-sm opacity-90">Learner: {getLearnerName(selectedEnrolment)}</p>
                      <p className="text-sm opacity-90">Conducted By: {generatedReport.conductedBy}</p>
                      <p className="text-sm opacity-90">Date: {new Date(generatedReport.conductedAt).toLocaleString()}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200"><h4 className="text-lg font-semibold text-gray-800 mb-3">Executive Summary</h4><p className="text-gray-700">{generatedReport.summary}</p></div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><p className="text-xs text-gray-500 mb-1">Overall Compliance</p><p className={`text-lg font-semibold ${generatedReport.overallCompliance === 'compliant' ? 'text-green-600' : generatedReport.overallCompliance === 'partially_compliant' ? 'text-yellow-600' : 'text-red-600'}`}>{generatedReport.overallCompliance.replace('_', ' ').toUpperCase()}</p></div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><p className="text-xs text-gray-500 mb-1">Risk Level</p><p className={`text-lg font-semibold ${generatedReport.riskLevel === 'low' ? 'text-green-600' : generatedReport.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>{generatedReport.riskLevel.toUpperCase()} RISK</p></div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><p className="text-xs text-gray-500 mb-1">Compliance Score</p><p className="text-lg font-semibold text-blue-600">{generatedReport.checklist.filter(c => c.isMet).length} / {generatedReport.checklist.length} ({generatedReport.checklist.length > 0 ? Math.round((generatedReport.checklist.filter(c => c.isMet).length / generatedReport.checklist.length) * 100) : 0}%)</p></div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">Evaluation Checklist</h4>
                      {generatedReport.checklist.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No checklist items have been added to this report.</p>
                      ) : (
                        <div className="space-y-4">
                          {generatedReport.checklist.map((item) => (
                            <div key={item.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                              <div className="flex items-start space-x-3">
                                {item.isMet ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">{item.criteria}</p>
                                  {item.comments && <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">{item.comments}</p>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {generatedReport.evidence && generatedReport.evidence.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Evidence Collected ({generatedReport.evidence.length})</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {generatedReport.evidence.map((item) => (
                            <a key={item.id} href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="block p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                              <div className="aspect-square bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                                <span className="text-2xl">{item.type === 'photo' ? '📷' : '📄'}</span>
                              </div>
                              <p className="text-xs font-medium text-gray-700 truncate">{item.fileName}</p>
                              {item.description && <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-white p-4 rounded-lg border border-gray-200"><h4 className="text-lg font-semibold text-gray-800 mb-3">Recommendations</h4><p className="text-gray-700 whitespace-pre-wrap">{generatedReport.recommendations}</p></div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200"><h4 className="text-lg font-semibold text-gray-800 mb-3">Next Steps / Action Plan</h4><p className="text-gray-700 whitespace-pre-wrap">{generatedReport.nextSteps}</p></div>

                    {(generatedReport as any).overallReviewComments && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200"><h4 className="text-lg font-semibold text-gray-800 mb-3">Overall Review Comments</h4><p className="text-gray-700 whitespace-pre-wrap">{(generatedReport as any).overallReviewComments}</p></div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 border-t">
                      <Button variant="outline" onClick={() => { const blob = new Blob([JSON.stringify(generatedReport, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `site-visit-report-${selectedEnrolment.enrolmentId}.json`; a.click(); URL.revokeObjectURL(url); }}><Download className="h-4 w-4 mr-2" />Download Report</Button>
                      <Button onClick={handleSubmitReport} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700"><Send className="h-4 w-4 mr-2" />Submit Site Visit Report</Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No report has been generated yet.</p>
                    <p className="text-sm mt-2">Please complete the checklist and reporting information in the Evaluation tab, then click "Generate Report".</p>
                    <Button onClick={() => setActiveTab('evaluation')} className="mt-4"><Plus className="h-4 w-4 mr-2" />Go to Evaluation</Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SiteVisitManagement;