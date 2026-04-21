import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Eye, 
  XCircle, 
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  DollarSign,
  Upload,
  FileCheck,
  Zap,
  History
} from 'lucide-react';
import type { ApplicationStatus, EvaluationChecklist, AIRecommendation, EvaluationHistoryEntry ,RequiredUploadItem} from '@/types';
import { mockAccreditationService } from '@/services/mockAccreditationService';

interface AccreditationInternalDashboardProps {
  userName?: string;
  userRole?: string;
}

// Initial evaluation criteria (without payment check)
const initialEvaluationCriteria = [
  { id: 'init1', name: 'Company registration is valid and active' },
  { id: 'init2', name: 'Organisation details match registration documents' },
  { id: 'init3', name: 'Qualification applied for is within scope' },
  { id: 'init4', name: 'Training location is properly identified' },
  { id: 'init5', name: 'All required contact information is provided' },
];

// Final evaluation criteria (without payment check)


const requiredDocumentOptions = [
  { id: 'ohs_audit', label: 'OHS Audit Report' },
  { id: 'ownership_lease', label: 'Ownership / Lease Proof' },
  { id: 'facilitator_cvs', label: 'Facilitator CVs' },
  { id: 'facilitator_ids', label: 'Facilitator ID Copies' },
  { id: 'facilitator_qualifications', label: 'Facilitator Qualifications' },
  { id: 'business_plan', label: 'Business Plan' },
  { id: 'financial_statements', label: 'Financial Statements' },
  { id: 'tax_compliance', label: 'Tax Compliance / Exemption' },
  { id: 'registration_proof', label: 'Registration Proof' },
  { id: 'mou_sla', label: 'MoU / SLA / Intent Letter' },
  { id: 'learning_material_matrix', label: 'Learning Material Matrix' },
];
const requiredDocumentEvaluationLabels: Record<string, string> = {
  ohs_audit: 'Valid Occupational Health and Safety Audit Report (Signed by a registered OHS inspector/auditor and not older than 12 months)',
  ownership_lease: 'Proof of Ownership or Lease Agreement',
  facilitator_cvs: 'Comprehensive CVs of facilitators',
  facilitator_ids: 'Certified ID copies of individual facilitators',
  facilitator_qualifications: 'Certified Facilitators qualifications as per curriculum specifications.',
  business_plan: 'Financial sustainability information (C1 Business plan [new company / institution])',
  financial_statements: 'C2 Audited Financial Statement, [if company/institution has been operational for more than 1 year]; not applicable to a new institution',
  tax_compliance: 'Valid Tax compliance pin, if exempted provide proof of exemption',
  registration_proof: 'Proof of Registration (PTY, CC, NGO, NPO, CET, Public Institution)',
  mou_sla: 'Signed Memorandum of Understanding (MoU) / Service Level Agreement (SLA) / Declaration / Letter of Intent for the implementation of the workplace component, indicating clear deliverables for learners',
  learning_material_matrix: 'Learning material matrix',
};
export default function AccreditationInternalDashboard({ 
  userName = "Admin User", 
  userRole = "Accreditation Officer" 
}: AccreditationInternalDashboardProps) {
  const [applications, setApplications] = useState<ApplicationStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationStatus | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [verificationNotes, setVerificationNotes] = useState('');
  const [initialChecklist, setInitialChecklist] = useState<EvaluationChecklist[]>(
    initialEvaluationCriteria.map(c => ({ criteriaId: c.id, criteriaName: c.name, isMet: false }))
  );
const [finalChecklist, setFinalChecklist] = useState<EvaluationChecklist[]>([]);
 // Update the state declarations
const [activeTab, setActiveTab] = useState<'details' | 'initial-evaluation' | 'final-evaluation' | 'ai-report' | 'payment' | 'history'>('details');
  const [showInitialEvaluation, setShowInitialEvaluation] = useState(false);
  const [paymentVerificationChecks, setPaymentVerificationChecks] = useState({
  referenceMatchesApplication: false,
  amountMatchesApplication: false,
  paymentBelongsToThisApplication: false,
});

  const [qualificationChecks, setQualificationChecks] = useState({
  qualificationTitle: false,
  saqaId: false,
  curriculumCode: false,
  nqfLevel: false,
  credits: false,
});

const [requiredApplicantDocuments, setRequiredApplicantDocuments] = useState<RequiredUploadItem[]>([]);

useEffect(() => {
  if (!selectedApplication || activeTab !== 'final-evaluation') return;

  const allDocsUploaded = areAllRequestedDocumentsUploaded(selectedApplication);

  setFinalChecklist((prev) =>
    prev.map((item) =>
      item.criteriaId === 'all_requested_uploaded'
        ? { ...item, isMet: allDocsUploaded }
        : item
    )
  );
}, [selectedApplication, activeTab]);

  useEffect(() => {
    loadApplications();
    const interval = setInterval(loadApplications, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  if (!selectedApplication) return;

  const refreshedSelectedApplication = applications.find(
    (app) => app.id === selectedApplication.id
  );

  if (refreshedSelectedApplication) {
    setSelectedApplication(refreshedSelectedApplication);
  }
}, [applications, selectedApplication?.id]);

  const loadApplications = () => {
    const apps = mockAccreditationService.getApplications();
    setApplications(apps);
  };

  const toggleRowExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

const getStatusBadge = (status: ApplicationStatus['status']) => {
  const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
    'step1_initial_submitted': { color: 'bg-blue-100 text-blue-800', label: 'Initial Submitted', icon: Clock },
    'step2_under_initial_review': { color: 'bg-yellow-100 text-yellow-800', label: 'Under Initial Review', icon: Clock },
    'step3_initial_approved': { color: 'bg-green-100 text-green-800', label: 'Initial Approved', icon: CheckCircle },
    'step3_initial_rejected': { color: 'bg-red-100 text-red-800', label: 'Initial Rejected', icon: XCircle },
    'step4_documents_uploaded': { color: 'bg-purple-100 text-purple-800', label: 'Documents Uploaded', icon: Upload },
    'step5_under_final_review': { color: 'bg-orange-100 text-orange-800', label: 'Under Final Review', icon: Zap },
    'step6_final_approved': { color: 'bg-green-100 text-green-800', label: 'Final Approved', icon: CheckCircle },
    'step6_final_rejected': { color: 'bg-red-100 text-red-800', label: 'Final Rejected', icon: XCircle },
    'step7_payment_pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Payment Pending', icon: DollarSign },
    'step8_payment_uploaded': { color: 'bg-blue-100 text-blue-800', label: 'Payment Uploaded', icon: FileCheck },
    'step9_completed': { color: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle },
  };
  
  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status, icon: Clock };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 w-fit ${config.color}`}>
      {config.icon && <config.icon className="w-3 h-3" />}
      {config.label}
      {status === 'step8_payment_uploaded' && (
        <span className="ml-1 text-xs">(Awaiting Verification)</span>
      )}
    </span>
  );
};


const toggleQualificationCheck = (key: keyof typeof qualificationChecks) => {
  setQualificationChecks(prev => ({
    ...prev,
    [key]: !prev[key]
  }));
};

const toggleRequiredDocument = (doc: { id: string; label: string }) => {
  setRequiredApplicantDocuments(prev => {
    const exists = prev.some(item => item.id === doc.id);

    if (exists) {
      return prev.filter(item => item.id !== doc.id);
    }

    return [...prev, { id: doc.id, label: doc.label }];
  });
};
// Update the handleStartInitialReview function
const handleStartInitialReview = (applicationId: string) => {
  mockAccreditationService.updateApplication(applicationId, {
    status: 'step2_under_initial_review'
  });

  loadApplications();
  
  // Instead of setting a state, we'll directly set the active tab
  // and rely on the application status to show the tab
  setActiveTab('initial-evaluation');
};

const handleInitialReview = (applicationId: string, decision: 'approved' | 'rejected') => {
  const app = applications.find(a => a.id === applicationId);
  if (!app) return;

  const newStatus = decision === 'approved' ? 'step3_initial_approved' : 'step3_initial_rejected';

  const actualInitialChecklist: EvaluationChecklist[] = [
  {
    criteriaId: 'qualificationTitle',
    criteriaName: 'Qualification / Curriculum Title',
    isMet: qualificationChecks.qualificationTitle,
  },
  {
    criteriaId: 'saqaId',
    criteriaName: 'SAQA ID',
    isMet: qualificationChecks.saqaId,
  },
  {
    criteriaId: 'curriculumCode',
    criteriaName: 'Curriculum Code',
    isMet: qualificationChecks.curriculumCode,
  },
  {
    criteriaId: 'nqfLevel',
    criteriaName: 'NQF Level',
    isMet: qualificationChecks.nqfLevel,
  },
  {
    criteriaId: 'credits',
    criteriaName: 'Credits',
    isMet: qualificationChecks.credits,
  },
  ...requiredApplicantDocuments.map((doc) => ({
    criteriaId: `requested_${doc.id}`,
    criteriaName: `Requested from applicant: ${doc.label}`,
    isMet: true,
  })),
];

const evaluationEntry: EvaluationHistoryEntry = {
  stage: 'initial',
  reviewedBy: userName,
  reviewedAt: new Date().toISOString(),
  checklist: actualInitialChecklist,
  decision,
  comments: verificationNotes,
};

  const updates: any = {
    status: newStatus,
    initialQualificationChecks: qualificationChecks,
    requiredApplicantDocuments: requiredApplicantDocuments,
   initialReview: {
  reviewedBy: userName,
  reviewedAt: new Date().toISOString(),
  checklist: actualInitialChecklist,
  decision,
  comments: verificationNotes,
},
    evaluationHistory: [...(app.evaluationHistory || []), evaluationEntry]
  };

  if (decision === 'approved') {
    updates.acknowledgementLetter = {
      id: `ack-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      letterUrl: `/letters/ack-${app.applicationId}.pdf`,
      content: `Acknowledgement of Initial Approval for ${app.applicationId}`,
    };
  }

  mockAccreditationService.updateApplication(applicationId, updates);
  loadApplications();
  setSelectedApplication(null);

  setQualificationChecks({
    qualificationTitle: false,
    saqaId: false,
    curriculumCode: false,
    nqfLevel: false,
    credits: false,
  });
  setRequiredApplicantDocuments([]);
  setInitialChecklist(initialEvaluationCriteria.map(c => ({
    criteriaId: c.id,
    criteriaName: c.name,
    isMet: false
  })));
  setVerificationNotes('');
};


// Update the modal close handler
const handleCloseModal = () => {
  setSelectedApplication(null);
  setActiveTab('details');
};

// When opening an application, check if it's in initial review and set the tab accordingly
const handleOpenApplication = (app: ApplicationStatus) => {
  setSelectedApplication(app);
  setPaymentVerificationChecks({
  referenceMatchesApplication: app.paymentVerifiedForCorrectApplication || false,
  amountMatchesApplication: false,
  paymentBelongsToThisApplication: app.paymentVerifiedForCorrectApplication || false,
});

  if (app.status === 'step2_under_initial_review') {
    setActiveTab('initial-evaluation');
  } else {
    setActiveTab('details');
  }

  if (app.status === 'step5_under_final_review') {
    setFinalChecklist(buildFinalChecklist(app));
  }
};

const generateAIRecommendation = (applicationId: string) => {
  const app = applications.find(a => a.id === applicationId);
  if (!app) return;

  const requestedDocs = app.requiredApplicantDocuments || [];
  const uploadedDocs = app.applicantRequiredUploads || [];

const documentFindings: AIRecommendation['documentFindings'] = requestedDocs.map((req) => {
  const uploadedMatch = uploadedDocs.find(
    (item) => item.requirementId === req.id && item.document
  );

  return {
    documentType: 'application_form' as const,
    fileName: uploadedMatch?.document?.name || req.label,
    status: uploadedMatch?.document ? 'valid' as const : 'missing' as const,
    confidence: 100,
    issues: uploadedMatch?.document ? [] : ['Document was not uploaded'],
  };
});

  const validCount = documentFindings.filter(f => f.status === 'valid').length;
  const missingCount = documentFindings.filter(f => f.status === 'missing').length;

  const aiRecommendation: AIRecommendation = {
    recommendationId: `ai-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    overallScore: 0,
    summary: `AI document evaluation completed. ${validCount} requested documents were uploaded and ${missingCount} requested documents are missing.`,
    documentFindings,
    recommendedAction: 'needs_review',
    riskLevel: 'low',
  };

  const aiEvaluationEntry: EvaluationHistoryEntry = {
    stage: 'ai-evaluation',
    reviewedBy: 'AI System',
    reviewedAt: new Date().toISOString(),
    checklist: [],
    decision: 'pending',
    comments: aiRecommendation.summary,
    aiRecommendation,
  };

  mockAccreditationService.updateApplication(applicationId, {
    status: 'step5_under_final_review',
    finalReview: {
      ...app.finalReview,
      aiRecommendation,
    },
    evaluationHistory: [...(app.evaluationHistory || []), aiEvaluationEntry]
  });

  loadApplications();

  const refreshedApp = mockAccreditationService.getApplicationById(applicationId);
  if (refreshedApp) {
    setSelectedApplication(refreshedApp);
    setFinalChecklist(buildFinalChecklist(refreshedApp));
  }

  setActiveTab('ai-report');
};
  const handleFinalReview = (applicationId: string, decision: 'approved' | 'rejected') => {
    const app = applications.find(a => a.id === applicationId);
    if (!app) return;

    const newStatus = decision === 'approved' ? 'step6_final_approved' : 'step6_final_rejected';
    
    // Create evaluation history entry
    const evaluationEntry: EvaluationHistoryEntry = {
      stage: 'final',
      reviewedBy: userName,
      reviewedAt: new Date().toISOString(),
      checklist: finalChecklist,
      decision: decision,
      comments: verificationNotes,
      aiRecommendation: app.finalReview?.aiRecommendation,
    };

    const updates: any = {
      status: newStatus,
      finalReview: {
        ...app.finalReview,
        reviewedBy: userName,
        reviewedAt: new Date().toISOString(),
        checklist: finalChecklist,
        decision: decision,
        comments: verificationNotes,
      },
      evaluationHistory: [...(app.evaluationHistory || []), evaluationEntry]
    };
    
    // If approved, generate payment notification
    if (decision === 'approved') {
      updates.paymentNotification = {
        id: `pay-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        amount: 2500,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        paymentReference: `PAY-${app.applicationId}`,
        bankDetails: {
          bankName: 'First National Bank',
          accountName: 'QCTO Accreditation',
          accountNumber: '123456789',
          branchCode: '250655',
          reference: app.applicationId,
        },
      };
      updates.status = 'step7_payment_pending';
    }
    
    mockAccreditationService.updateApplication(applicationId, updates);
    loadApplications();
    setSelectedApplication(null);
    setFinalChecklist([]);
    setVerificationNotes('');
  };

  const handleRequestFinanceVerification = (applicationId: string) => {
  mockAccreditationService.updateApplication(applicationId, {
    financeVerificationRequested: true,
    financeVerificationRequestedAt: new Date().toISOString(),
    financeVerificationRequestedBy: userName,
    financeVerificationStatus: 'requested',
    paymentVerificationNotes: 'Proof of payment sent to Finance Department for verification.',
  });

  loadApplications();

  const refreshedApp = mockAccreditationService.getApplicationById(applicationId);
  if (refreshedApp) {
    setSelectedApplication(refreshedApp);
  }
};

const handleVerifyPayment = (applicationId: string) => {
  const allChecksPassed =
    paymentVerificationChecks.referenceMatchesApplication &&
    paymentVerificationChecks.amountMatchesApplication &&
    paymentVerificationChecks.paymentBelongsToThisApplication;

  if (!allChecksPassed) {
    alert('Please complete all payment attribution checks before verifying payment.');
    return;
  }

  if (!selectedApplication?.financeVerificationRequested) {
    alert('Please first send the proof of payment to the Finance Department for verification.');
    return;
  }

  mockAccreditationService.updateApplication(applicationId, {
    status: 'step9_completed',
    paymentStatus: 'verified',
    paymentDate: new Date().toISOString(),
    paymentVerifiedForCorrectApplication: true,
    paymentVerificationNotes: 'Payment verified and confirmed for the correct application.',
    financeVerificationStatus: 'confirmed',
  });

  loadApplications();
  setSelectedApplication(null);
};

  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationData?.applicantInfo.organisationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationData?.qualification.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesRegion = regionFilter === 'all' || app.applicationData?.applicantInfo.region === regionFilter;
    
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const regions = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Mpumalanga', 'Limpopo', 'North West', 'Northern Cape'];

  const areAllRequestedDocumentsUploaded = (app: ApplicationStatus | null) => {
  if (!app?.requiredApplicantDocuments || app.requiredApplicantDocuments.length === 0) {
    return false;
  }

  return app.requiredApplicantDocuments.every((req) =>
    app.applicantRequiredUploads?.some(
      (item) => item.requirementId === req.id && item.document
    )
  );
};

const buildFinalChecklist = (app: ApplicationStatus | null): EvaluationChecklist[] => {
  if (!app) return [];

  const requiredDocsChecklist =
    (app.requiredApplicantDocuments || []).map((doc) => ({
      criteriaId: `required_${doc.id}`,
      criteriaName: requiredDocumentEvaluationLabels[doc.id] || doc.label,
      isMet: false,
    }));

  return [
    ...requiredDocsChecklist,
    {
      criteriaId: 'ai_report_evaluated',
      criteriaName: 'AI report evaluated',
      isMet: false,
    },
    {
      criteriaId: 'all_requested_uploaded',
      criteriaName: 'All documentation of annexures was uploaded',
      isMet: false,
    },
  ];
};
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Accreditation Applications</h1>
              <p className="text-sm text-gray-600">Manage and review SDP accreditation applications</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {userName.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-sm p-4 border border-blue-200">
            <p className="text-sm text-blue-600">Initial Submitted</p>
            <p className="text-2xl font-bold text-blue-600">
              {applications.filter(a => a.status === 'step1_initial_submitted').length}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-sm p-4 border border-yellow-200">
            <p className="text-sm text-yellow-600">Under Review</p>
            <p className="text-2xl font-bold text-yellow-600">
              {applications.filter(a => ['step2_under_initial_review', 'step5_under_final_review'].includes(a.status)).length}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg shadow-sm p-4 border border-purple-200">
            <p className="text-sm text-purple-600">Docs Uploaded</p>
            <p className="text-2xl font-bold text-purple-600">
              {applications.filter(a => a.status === 'step4_documents_uploaded').length}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg shadow-sm p-4 border border-green-200">
            <p className="text-sm text-green-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {applications.filter(a => ['step3_initial_approved', 'step6_final_approved', 'step9_completed'].includes(a.status)).length}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg shadow-sm p-4 border border-orange-200">
            <p className="text-sm text-orange-600">Payment Pending</p>
            <p className="text-2xl font-bold text-orange-600">
              {applications.filter(a => a.status === 'step7_payment_pending').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="step1_initial_submitted">Initial Submitted</option>
                <option value="step2_under_initial_review">Under Initial Review</option>
                <option value="step3_initial_approved">Initial Approved</option>
                <option value="step3_initial_rejected">Initial Rejected</option>
                <option value="step4_documents_uploaded">Documents Uploaded</option>
                <option value="step5_under_final_review">Under Final Review</option>
                <option value="step6_final_approved">Final Approved</option>
                <option value="step6_final_rejected">Final Rejected</option>
                <option value="step7_payment_pending">Payment Pending</option>
                <option value="step8_payment_uploaded">Payment Uploaded</option>
                <option value="step9_completed">Completed</option>
              </select>
            </div>

            <div>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div className="flex space-x-2">
              <button 
                onClick={loadApplications}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organisation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No applications found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <React.Fragment key={app.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{app.applicationId}</div>
                        <div className="text-xs text-gray-500">{app.applicationData?.applicationType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{app.applicationData?.applicantInfo.organisationName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{app.applicationData?.qualification}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.applicationData?.applicantInfo.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.submittedDate ? new Date(app.submittedDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleRowExpand(app.id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          {expandedRows.has(app.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                       <button
                        onClick={() => {
                            handleOpenApplication(app);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        >
                        <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    {expandedRows.has(app.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Contact Information</h4>
                              <div className="space-y-2 text-sm">
                                <p className="flex items-center text-gray-600">
                                  <User className="w-4 h-4 mr-2" />
                                  {app.applicationData?.applicantInfo.fullName}
                                </p>
                                <p className="flex items-center text-gray-600">
                                  <Mail className="w-4 h-4 mr-2" />
                                  {app.applicationData?.applicantInfo.email}
                                </p>
                                <p className="flex items-center text-gray-600">
                                  <Phone className="w-4 h-4 mr-2" />
                                  {app.applicationData?.applicantInfo.phone}
                                </p>
                              </div>
                              
                              <h4 className="text-sm font-semibold text-gray-900 mt-4 mb-2">Location</h4>
                              <div className="space-y-2 text-sm">
                                <p className="flex items-center text-gray-600">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  {app.applicationData?.applicantInfo.trainingLocation}
                                </p>
                              </div>

                              {app.acknowledgementLetter && (
                                <>
                                  <h4 className="text-sm font-semibold text-gray-900 mt-4 mb-2">Acknowledgement</h4>
                                  <a
                                    href={app.acknowledgementLetter.letterUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    View Acknowledgement Letter
                                  </a>
                                </>
                              )}
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">Documents</h4>
                              <div className="space-y-2">
                                {app.applicationData?.documents && app.applicationData.documents.length > 0 ? (
                                  app.applicationData.documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                      <div className="flex items-center">
                                        <FileText className="w-4 h-4 text-gray-500 mr-2" />
                                        <span className="text-sm text-gray-600">{doc.name}</span>
                                      </div>
                                      <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                      >
                                        View
                                      </a>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-gray-500">No documents uploaded yet</p>
                                )}
                              </div>

                              {app.paymentNotification && (
                                <>
                                  <h4 className="text-sm font-semibold text-gray-900 mt-4 mb-2">Payment Required</h4>
                                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                    <p className="text-sm text-yellow-800">
                                      Amount: R{app.paymentNotification.amount}
                                    </p>
                                    <p className="text-xs text-yellow-600">
                                      Due: {new Date(app.paymentNotification.dueDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Application Details: {selectedApplication.applicationId}</h2>
                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                </div>
               <button
                    onClick={handleCloseModal}
                    className="text-gray-500 hover:text-gray-700"
                    >
                    <XCircle className="w-6 h-6" />
                    </button>
              </div>

              {/* Tabs */}
            {/* Tabs */}
{/* Tabs */}
{/* Tabs */}
<div className="flex space-x-4 mt-4 border-b border-gray-200">
  <button
    onClick={() => setActiveTab('details')}
    className={`pb-2 px-1 ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
  >
    Details
  </button>
  
  {/* Show Initial Evaluation tab when status is under_initial_review */}
  {selectedApplication.status === 'step2_under_initial_review' && (
    <button
      onClick={() => setActiveTab('initial-evaluation')}
      className={`pb-2 px-1 ${activeTab === 'initial-evaluation' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
    >
      Initial Evaluation
    </button>
  )}
  
  {/* Show AI Report tab if documents have been uploaded OR if an AI report already exists */}
  {(selectedApplication.status === 'step4_documents_uploaded' || 
    selectedApplication.status === 'step5_under_final_review' ||
    selectedApplication.status === 'step6_final_approved' ||
    selectedApplication.status === 'step6_final_rejected' ||
    selectedApplication.status === 'step7_payment_pending' ||
    selectedApplication.status === 'step8_payment_uploaded' ||
    selectedApplication.status === 'step9_completed' ||
    selectedApplication.finalReview?.aiRecommendation) && (
    <button
      onClick={() => setActiveTab('ai-report')}
      className={`pb-2 px-1 ${activeTab === 'ai-report' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
    >
      AI Report
    </button>
  )}
  
  {/* Show Final Evaluation tab ONLY when still under final review - hide after completion */}
  {selectedApplication.status === 'step5_under_final_review' && (
    <button
      onClick={() => setActiveTab('final-evaluation')}
      className={`pb-2 px-1 ${activeTab === 'final-evaluation' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
    >
      Final Evaluation
    </button>
  )}
  
  {/* Payment tab - only show when payment is pending */}
 {(selectedApplication.status === 'step7_payment_pending' ||
  selectedApplication.status === 'step8_payment_uploaded' ||
  selectedApplication.paymentNotification) && (
  <button
    onClick={() => setActiveTab('payment')}
    className={`pb-2 px-1 ${activeTab === 'payment' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
  >
    Payment
  </button>
)}

  {/* History tab - always show if there's history */}
  {selectedApplication.evaluationHistory && selectedApplication.evaluationHistory.length > 0 && (
    <button
      onClick={() => setActiveTab('history')}
      className={`pb-2 px-1 ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
    >
      <History className="w-4 h-4 inline mr-1" />
      History
    </button>
  )}
</div>
            </div>

            <div className="p-6">
              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Applicant Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Full Name</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">ID Number</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.idNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Organisation Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Organisation Name</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.organisationName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Company Name</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Company Registration</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.companyRegistration || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Region</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.region}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Training Location</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicantInfo.trainingLocation}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Qualification</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.qualification}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Application Type</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationData?.applicationType}</p>
                      </div>
                    </div>
                  </div>

               {/* Documents Section in Details Tab */}
<div className="bg-gray-50 p-4 rounded-lg">
  <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents</h3>
  
  {/* Regular Documents */}
  {selectedApplication.applicationData?.documents && selectedApplication.applicationData.documents.length > 0 ? (
    <>
      <h4 className="text-sm font-medium text-gray-700 mb-2">Application Documents</h4>
      <div className="space-y-2 mb-4">
        {selectedApplication.applicationData.documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
            <div className="flex items-center">
              <FileText className="w-4 h-4 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">{doc.name}</span>
            </div>
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View
            </a>
          </div>
        ))}
      </div>
      {(() => {
  const applicationForm = selectedApplication.applicationData?.documents?.find(
    (doc) => doc.type === 'application_form'
  ) as any;

  if (!applicationForm) return null;

  return (
    <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h4 className="text-sm font-semibold text-gray-800 mb-3">
        Application Form Validation
      </h4>

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-700">{applicationForm.name}</p>
          <p className="text-xs text-gray-500">
            Uploaded: {new Date(applicationForm.uploadedAt).toLocaleString()}
          </p>
        </div>

        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            applicationForm.validationStatus === 'passed'
              ? 'bg-green-100 text-green-700'
              : applicationForm.validationStatus === 'failed'
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {applicationForm.validationStatus || 'Not validated'}
        </span>
      </div>

      {applicationForm.validationChecks?.length > 0 ? (
        <div className="space-y-2">
          {applicationForm.validationChecks.map((check: any) => (
            <div
              key={check.id}
              className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
            >
              <div>
                <p className="text-sm text-gray-700">{check.label}</p>
                {check.message && (
                  <p className="text-xs text-gray-500 mt-1">{check.message}</p>
                )}
              </div>

              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  check.status === 'passed'
                    ? 'bg-green-100 text-green-700'
                    : check.status === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : check.status === 'processing'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {check.status}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No validation details available.</p>
      )}

      {applicationForm.validationError && (
        <p className="mt-3 text-sm text-red-600">{applicationForm.validationError}</p>
      )}
    </div>
  );
})()}
      {selectedApplication.applicantRequiredUploads &&
 selectedApplication.applicantRequiredUploads.length > 0 && (
  <>
    <h4 className="text-sm font-medium text-gray-700 mb-2 mt-4">
      Applicant Uploaded Required Documents
    </h4>
    <div className="space-y-2">
      {selectedApplication.applicantRequiredUploads.map((item) =>
        item.document ? (
          <div
            key={item.requirementId}
            className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200"
          >
            <div>
              <p className="text-sm font-medium text-gray-700">{item.label}</p>
              <p className="text-xs text-gray-500">{item.document.name}</p>
            </div>
            <a
              href={item.document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View
            </a>
          </div>
        ) : null
      )}
    </div>
  </>
)}
    </>
  ) : (
    <p className="text-sm text-gray-500 mb-4">No documents uploaded yet</p>
  )}

  {/* Proof of Payment */}
  {selectedApplication.proofOfPayment && selectedApplication.proofOfPayment.length > 0 && (
    <>
      <h4 className="text-sm font-medium text-gray-700 mb-2">Proof of Payment</h4>
      <div className="space-y-2">
        {selectedApplication.proofOfPayment.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
            <div className="flex items-center">
              <FileText className="w-4 h-4 text-blue-500 mr-2" />
              <span className="text-sm text-gray-600">{doc.name}</span>
            </div>
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View
            </a>
          </div>
        ))}
      </div>
      {selectedApplication.paymentStatus === 'paid' && (
        <p className="text-xs text-yellow-600 mt-2">Payment uploaded, awaiting verification</p>
      )}
      {selectedApplication.paymentStatus === 'verified' && (
        <p className="text-xs text-green-600 mt-2">Payment verified</p>
      )}
    </>
  )}
  
</div>

                  {selectedApplication.acknowledgementLetter && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Acknowledgement Letter</h3>
                      <a
                        href={selectedApplication.acknowledgementLetter.letterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        View Acknowledgement Letter
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Initial Evaluation Tab */}
        {activeTab === 'initial-evaluation' && (
  <div className="space-y-6">
    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">
        Qualification Verification
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Complete these checks before approving the initial application.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex items-center justify-between gap-3 p-3 bg-white rounded border border-gray-200">
          <span className="text-sm text-gray-700">Qualification / Curriculum Title</span>
          <input
            type="checkbox"
            checked={qualificationChecks.qualificationTitle}
            onChange={() => toggleQualificationCheck('qualificationTitle')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </label>

        <label className="flex items-center justify-between gap-3 p-3 bg-white rounded border border-gray-200">
          <span className="text-sm text-gray-700">SAQA ID</span>
          <input
            type="checkbox"
            checked={qualificationChecks.saqaId}
            onChange={() => toggleQualificationCheck('saqaId')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </label>

        <label className="flex items-center justify-between gap-3 p-3 bg-white rounded border border-gray-200">
          <span className="text-sm text-gray-700">Curriculum Code</span>
          <input
            type="checkbox"
            checked={qualificationChecks.curriculumCode}
            onChange={() => toggleQualificationCheck('curriculumCode')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </label>

        <label className="flex items-center justify-between gap-3 p-3 bg-white rounded border border-gray-200">
          <span className="text-sm text-gray-700">NQF Level</span>
          <input
            type="checkbox"
            checked={qualificationChecks.nqfLevel}
            onChange={() => toggleQualificationCheck('nqfLevel')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </label>

        <label className="flex items-center justify-between gap-3 p-3 bg-white rounded border border-gray-200 md:col-span-2">
          <span className="text-sm text-gray-700">Credits</span>
          <input
            type="checkbox"
            checked={qualificationChecks.credits}
            onChange={() => toggleQualificationCheck('credits')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </label>
      </div>
    </div>

    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">
        Required Applicant Documents
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Tick the documents the external applicant must upload after initial approval.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {requiredDocumentOptions.map((doc) => {
          const selected = requiredApplicantDocuments.some(item => item.id === doc.id);

          return (
            <label
              key={doc.id}
              className={`flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition ${
                selected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <span className="text-sm text-gray-700">{doc.label}</span>

              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleRequiredDocument(doc)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </label>
          );
        })}
      </div>

      {requiredApplicantDocuments.length > 0 && (
        <div className="mt-4 p-3 bg-white rounded border border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">
            Selected documents to request from applicant:
          </p>
          <div className="flex flex-wrap gap-2">
            {requiredApplicantDocuments.map((doc) => (
              <span
                key={doc.id}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
              >
                {doc.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>

    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Verification Notes</h3>
      <textarea
        rows={4}
        value={verificationNotes}
        onChange={(e) => setVerificationNotes(e.target.value)}
        placeholder="Add notes for the applicant or internal reviewers..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>
)}

              {/* AI Report Tab */}
        {/* AI Report Tab */}
{/* AI Report Tab */}
{activeTab === 'ai-report' && (
  <div className="space-y-6">
    {!selectedApplication.finalReview?.aiRecommendation ? (
      // Show this only if no report exists AND we're in the document upload stage
      selectedApplication.status === 'step4_documents_uploaded' ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Report Generated Yet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Click the "Run AI Evaluation" button below to analyze the uploaded documents.
          </p>
          <p className="text-xs text-gray-500">
            The AI will evaluate all documents and provide a recommendation report.
          </p>
        </div>
      ) : (
        // If no report exists but we're past the document upload stage (shouldn't happen)
        <div className="bg-yellow-50 p-8 rounded-lg text-center">
          <p className="text-sm text-yellow-700">No AI report was generated for this application.</p>
        </div>
      )
    ) : (
      // Show the AI report whenever it exists, regardless of status
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center">
      <Zap className="w-6 h-6 text-blue-600 mr-2" />
      <h3 className="text-lg font-semibold text-gray-800">AI Draft Evaluation Report</h3>
    </div>
    <span className="text-sm text-gray-500">
      Generated: {new Date(selectedApplication.finalReview.aiRecommendation.generatedAt).toLocaleString()}
    </span>
  </div>

  <div className="bg-white p-4 rounded-lg mb-4">
    <p className="text-sm text-gray-700">
      {selectedApplication.finalReview.aiRecommendation.summary}
    </p>
  </div>

  <h4 className="font-medium text-gray-800 mb-3">Requested Document Evaluation</h4>
  <div className="space-y-3">
    {selectedApplication.finalReview.aiRecommendation.documentFindings.map((finding, index) => (
      <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <FileText className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium">{finding.fileName}</span>
          </div>

          <span
            className={`text-xs px-2 py-1 rounded ${
              finding.status === 'valid'
                ? 'bg-green-100 text-green-700'
                : finding.status === 'missing'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {finding.status === 'valid'
              ? 'Uploaded'
              : finding.status === 'missing'
              ? 'Missing'
              : finding.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {finding.issues && finding.issues.length > 0 && (
          <div className="mt-2">
            {finding.issues.map((issue, i) => (
              <p key={i} className="text-xs text-red-600">
                {issue}
              </p>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>

  {selectedApplication.status !== 'step4_documents_uploaded' &&
   selectedApplication.status !== 'step5_under_final_review' && (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      <p className="text-xs text-blue-700">
        This draft AI evaluation report forms part of the application record.
      </p>
    </div>
  )}
</div>
    )}
  </div>
)}

              {/* Final Evaluation Tab */}
          {/* Final Evaluation Tab */}
{activeTab === 'final-evaluation' && (
  <div className="space-y-6">
    {selectedApplication.status === 'step5_under_final_review' ? (
      <>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Final Evaluation Checklist
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Verify all requested applicant documents and confirm the AI review before making the final decision.
          </p>

          <div className="space-y-3">
            {finalChecklist.map((criteria) => {
              const isAutoCalculated = criteria.criteriaId === 'all_requested_uploaded';

              return (
                <div
                  key={criteria.criteriaId}
                  className="flex items-start justify-between gap-4 p-3 bg-white rounded border border-gray-200"
                >
                  <span className="text-sm text-gray-700 leading-5">
                    {criteria.criteriaName}
                  </span>

                  <label className="flex items-center space-x-2 shrink-0">
                    <input
                      type="checkbox"
                      checked={criteria.isMet}
                      disabled={isAutoCalculated}
                      onChange={(e) => {
                        setFinalChecklist((prev) =>
                          prev.map((c) =>
                            c.criteriaId === criteria.criteriaId
                              ? { ...c, isMet: e.target.checked }
                              : c
                          )
                        );
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">
                      {isAutoCalculated ? 'Auto' : 'Met'}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">
            Uploaded Applicant Documents
          </h4>

          {selectedApplication.applicantRequiredUploads &&
          selectedApplication.applicantRequiredUploads.length > 0 ? (
            <div className="space-y-2">
              {selectedApplication.applicantRequiredUploads.map((item) =>
                item.document ? (
                  <div
                    key={item.requirementId}
                    className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-700">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.document.name}</p>
                    </div>
                    <a
                      href={item.document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </a>
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No applicant documents uploaded yet.</p>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Final Evaluation Notes</h3>
          <textarea
            rows={4}
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            placeholder="Add notes about your final evaluation findings..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </>
    ) : (
      <div className="bg-yellow-50 p-6 rounded-lg text-center">
        <History className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Final Evaluation Completed</h3>
        <p className="text-sm text-gray-600">
          The final evaluation for this application has been completed.
          You can view the evaluation details in the History tab.
        </p>
      </div>
    )}
  </div>
)}

              {/* Payment Tab */}
        {/* Payment Tab */}
{activeTab === 'payment' && selectedApplication.paymentNotification && (
  <div className="space-y-6">
    <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
      <div className="flex items-center mb-4">
        <DollarSign className="w-6 h-6 text-yellow-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Payment Notification</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg">
          <p className="text-sm text-gray-600">Amount Due</p>
          <p className="text-2xl font-bold text-gray-900">R{selectedApplication.paymentNotification.amount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg">
          <p className="text-sm text-gray-600">Due Date</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Date(selectedApplication.paymentNotification.dueDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg mb-4">
        <h4 className="font-medium text-gray-800 mb-3">Bank Details</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-600">Bank:</p>
            <p className="font-medium">{selectedApplication.paymentNotification.bankDetails.bankName}</p>
          </div>
          <div>
            <p className="text-gray-600">Account Name:</p>
            <p className="font-medium">{selectedApplication.paymentNotification.bankDetails.accountName}</p>
          </div>
          <div>
            <p className="text-gray-600">Account Number:</p>
            <p className="font-medium">{selectedApplication.paymentNotification.bankDetails.accountNumber}</p>
          </div>
          <div>
            <p className="text-gray-600">Branch Code:</p>
            <p className="font-medium">{selectedApplication.paymentNotification.bankDetails.branchCode}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-600">Reference:</p>
            <p className="font-medium text-blue-600">{selectedApplication.paymentNotification.bankDetails.reference}</p>
          </div>
        </div>
      </div>

      {/* Proof of Payment Section */}
      {selectedApplication.proofOfPayment && selectedApplication.proofOfPayment.length > 0 ? (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            Proof of Payment Uploaded
          </h4>
          {selectedApplication.proofOfPayment.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 mb-2">
              <div className="flex items-center">
                <FileText className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">{doc.name}</span>
              </div>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View
              </a>
            </div>
          ))}
          {selectedApplication.paymentStatus === 'paid' && (
            <p className="text-xs text-yellow-600 mt-2">Payment pending verification</p>
          )}
          {selectedApplication.paymentStatus === 'verified' && (
            <p className="text-xs text-green-600 mt-2">Payment verified</p>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-yellow-700">No proof of payment uploaded yet.</p>
        </div>
      )}
      {selectedApplication.proofOfPayment && selectedApplication.proofOfPayment.length > 0 && (
  <div className="mt-4">
    {!selectedApplication.financeVerificationRequested ? (
      <button
        onClick={() => handleRequestFinanceVerification(selectedApplication.id)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Request Finance Department Verification
      </button>
    ) : (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm font-medium text-blue-800">
          Sent to Finance Department
        </p>
        <p className="text-xs text-blue-700 mt-1">
          Requested by {selectedApplication.financeVerificationRequestedBy || userName}
        </p>
        <p className="text-xs text-blue-700">
          {selectedApplication.financeVerificationRequestedAt
            ? new Date(selectedApplication.financeVerificationRequestedAt).toLocaleString()
            : ''}
        </p>
      </div>
    )}
  </div>
)}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
  <h4 className="font-medium text-gray-800 mb-3">Payment Attribution Verification</h4>

  <div className="space-y-3">
    <label className="flex items-center justify-between p-3 border border-gray-200 rounded bg-gray-50">
      <span className="text-sm text-gray-700">
        Payment reference matches this application
      </span>
      <input
        type="checkbox"
        checked={paymentVerificationChecks.referenceMatchesApplication}
        onChange={() =>
          setPaymentVerificationChecks(prev => ({
            ...prev,
            referenceMatchesApplication: !prev.referenceMatchesApplication
          }))
        }
        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
      />
    </label>

    <label className="flex items-center justify-between p-3 border border-gray-200 rounded bg-gray-50">
      <span className="text-sm text-gray-700">
        Payment amount matches this application
      </span>
      <input
        type="checkbox"
        checked={paymentVerificationChecks.amountMatchesApplication}
        onChange={() =>
          setPaymentVerificationChecks(prev => ({
            ...prev,
            amountMatchesApplication: !prev.amountMatchesApplication
          }))
        }
        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
      />
    </label>

    <label className="flex items-center justify-between p-3 border border-gray-200 rounded bg-gray-50">
      <span className="text-sm text-gray-700">
        Payment belongs to this application only
      </span>
      <input
        type="checkbox"
        checked={paymentVerificationChecks.paymentBelongsToThisApplication}
        onChange={() =>
          setPaymentVerificationChecks(prev => ({
            ...prev,
            paymentBelongsToThisApplication: !prev.paymentBelongsToThisApplication
          }))
        }
        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
      />
    </label>
  </div>

  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
    <p className="text-xs text-gray-600">Application ID</p>
    <p className="text-sm font-medium text-gray-800">{selectedApplication.applicationId}</p>

    <p className="text-xs text-gray-600 mt-2">Expected Payment Reference</p>
    <p className="text-sm font-medium text-blue-600">
      {selectedApplication.paymentNotification?.paymentReference}
    </p>

    <p className="text-xs text-gray-600 mt-2">Uploaded Payment Linked To</p>
    <p className="text-sm font-medium text-gray-800">
      {selectedApplication.paymentAllocatedToApplicationId || 'Not yet linked'}
    </p>
  </div>
</div>
    </div>
  </div>
)}

              {/* History Tab */}
           {/* History Tab */}
{activeTab === 'history' && selectedApplication.evaluationHistory && (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-gray-800">Evaluation History</h3>
    {selectedApplication.evaluationHistory.map((entry, index) => (
      <div key={index} className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              entry.stage === 'initial' ? 'bg-blue-100 text-blue-800' : 
              entry.stage === 'final' ? 'bg-purple-100 text-purple-800' : 
              'bg-green-100 text-green-800'
            }`}>
              {entry.stage === 'initial' ? 'Initial Review' : 
               entry.stage === 'final' ? 'Final Review' : 
               'AI Evaluation'}
            </span>
            <p className="text-sm text-gray-600 mt-1">
              Reviewed by: {entry.reviewedBy} on {new Date(entry.reviewedAt).toLocaleString()}
            </p>
          </div>
          {entry.stage !== 'ai-evaluation' && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              entry.decision === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {entry.decision === 'approved' ? 'Approved' : 'Rejected'}
            </span>
          )}
          {entry.stage === 'ai-evaluation' && entry.aiRecommendation && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              entry.aiRecommendation.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
              entry.aiRecommendation.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              Risk: {entry.aiRecommendation.riskLevel}
            </span>
          )}
        </div>
        
        {entry.stage !== 'ai-evaluation' && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Checklist Results:</h4>
            <div className="space-y-2">
              {entry.checklist.map((item) => (
                <div key={item.criteriaId} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{item.criteriaName}</span>
                  {item.isMet ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

    {entry.stage === 'ai-evaluation' && entry.aiRecommendation && (
  <div className="mt-3">
    <h4 className="text-sm font-medium text-gray-700 mb-2">AI Draft Evaluation:</h4>
    <div className="bg-white p-3 rounded border border-gray-200">
      <p className="text-sm text-gray-700 mb-3">{entry.aiRecommendation.summary}</p>

      <div className="space-y-2">
        {entry.aiRecommendation.documentFindings.map((finding, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{finding.fileName}</span>
            <span
              className={`px-2 py-1 text-xs rounded ${
                finding.status === 'valid'
                  ? 'bg-green-100 text-green-700'
                  : finding.status === 'missing'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {finding.status === 'valid'
                ? 'Uploaded'
                : finding.status === 'missing'
                ? 'Missing'
                : finding.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

        {entry.comments && (
          <div className="mt-3 p-2 bg-white rounded">
            <p className="text-sm text-gray-600">{entry.comments}</p>
          </div>
        )}
      </div>
    ))}
  </div>
)}
            </div>

            {/* Action Buttons */}
        {/* Action Buttons */}
{/* Action Buttons */}
{/* Action Buttons */}
<div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
  <div className="flex justify-end space-x-4">
    {selectedApplication.status === 'step1_initial_submitted' && (
      <button
        onClick={() => {
          mockAccreditationService.updateApplication(selectedApplication.id, {
            status: 'step2_under_initial_review'
          });
          loadApplications();
          handleStartInitialReview(selectedApplication.id);
        }}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Start Initial Review
      </button>
    )}

    {/* Show Approve/Reject buttons when on Initial Evaluation tab */}
    {selectedApplication.status === 'step2_under_initial_review' && 
     activeTab === 'initial-evaluation' && (
      
      <>

        <button
          onClick={() => handleInitialReview(selectedApplication.id, 'rejected')}
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Reject Application
        </button>
        <button
          onClick={() => handleInitialReview(selectedApplication.id, 'approved')}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Approve Initial Application
        </button>
      </>
    )}

    {/* Show Run AI Evaluation button only in AI Report tab, when no AI report exists yet, and status is documents_uploaded */}
    {selectedApplication.status === 'step4_documents_uploaded' && 
     activeTab === 'ai-report' && 
     !selectedApplication.finalReview?.aiRecommendation && (
      <button
        onClick={() => generateAIRecommendation(selectedApplication.id)}
        className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
      >
        <Zap className="w-4 h-4 inline mr-2" />
        Run AI Evaluation
      </button>
    )}

    {/* Show Final Evaluation buttons only when in under_final_review status AND on Final Evaluation tab */}
    {selectedApplication.status === 'step5_under_final_review' && 
     activeTab === 'final-evaluation' && (
      <>
        <button
          onClick={() => handleFinalReview(selectedApplication.id, 'rejected')}
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Reject Final Application
        </button>
        <button
          onClick={() => handleFinalReview(selectedApplication.id, 'approved')}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Approve Final Application
        </button>
      </>
    )}

    {selectedApplication.status === 'step8_payment_uploaded' && (
      <button
        onClick={() => handleVerifyPayment(selectedApplication.id)}
        className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        Verify Payment & Complete
      </button>
    )}
  </div>
</div>
          </div>
        </div>
      )}
    </div>
  );
}