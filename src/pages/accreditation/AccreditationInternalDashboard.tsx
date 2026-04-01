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
import type { ApplicationStatus, EvaluationChecklist, AIRecommendation, EvaluationHistoryEntry } from '@/types';
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
const finalEvaluationCriteria = [
  { id: 'final1', name: 'QMS documentation meets minimum requirements' },
  { id: 'final2', name: 'Training material is comprehensive and up-to-date' },
  { id: 'final3', name: 'Staff qualifications are verified and adequate' },
  { id: 'final4', name: 'Venue meets safety and accessibility requirements' },
  { id: 'final5', name: 'AI recommendation has been reviewed' },
];

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
  const [finalChecklist, setFinalChecklist] = useState<EvaluationChecklist[]>(
    finalEvaluationCriteria.map(c => ({ criteriaId: c.id, criteriaName: c.name, isMet: false }))
  );
 // Update the state declarations
const [activeTab, setActiveTab] = useState<'details' | 'initial-evaluation' | 'final-evaluation' | 'ai-report' | 'payment' | 'history'>('details');
  const [showInitialEvaluation, setShowInitialEvaluation] = useState(false);

  useEffect(() => {
    loadApplications();
    const interval = setInterval(loadApplications, 5000);
    return () => clearInterval(interval);
  }, []);

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
  
  // Create evaluation history entry
  const evaluationEntry: EvaluationHistoryEntry = {
    stage: 'initial',
    reviewedBy: userName,
    reviewedAt: new Date().toISOString(),
    checklist: initialChecklist,
    decision: decision,
    comments: verificationNotes,
  };

  const updates: any = {
    status: newStatus,
    initialReview: {
      reviewedBy: userName,
      reviewedAt: new Date().toISOString(),
      checklist: initialChecklist,
      decision: decision,
      comments: verificationNotes,
    },
    evaluationHistory: [...(app.evaluationHistory || []), evaluationEntry]
  };
  
  // If approved, generate acknowledgement letter
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
  setInitialChecklist(initialEvaluationCriteria.map(c => ({ criteriaId: c.id, criteriaName: c.name, isMet: false })));
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
  
  // If the application is in initial review, default to the initial evaluation tab
  if (app.status === 'step2_under_initial_review') {
    setActiveTab('initial-evaluation');
  } else {
    setActiveTab('details');
  }
};

const generateAIRecommendation = (applicationId: string) => {
  // Simulate AI evaluation based on uploaded documents
  const app = applications.find(a => a.id === applicationId);
  if (!app || !app.applicationData?.documents) return;

  // Define the allowed status types
  type DocumentStatus = 'valid' | 'invalid' | 'missing' | 'needs_review';

  const documentFindings = app.applicationData.documents.map(doc => {
    const randomScore = Math.floor(Math.random() * 30) + 70;
    
    // Determine status based on score with proper typing
    let status: DocumentStatus;
    if (randomScore > 80) {
      status = 'valid';
    } else if (randomScore > 60) {
      status = 'needs_review';
    } else {
      status = 'invalid';
    }
    
    return {
      documentType: doc.type,
      fileName: doc.name,
      status: status,
      confidence: randomScore,
      issues: randomScore < 70 ? ['Document requires verification'] : undefined,
    };
  });

  const overallScore = Math.floor(documentFindings.reduce((acc, f) => acc + f.confidence, 0) / documentFindings.length);
  
  const aiRecommendation: AIRecommendation = {
    recommendationId: `ai-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    overallScore: overallScore,
    summary: `AI analysis complete. ${documentFindings.filter(f => f.status === 'valid').length} documents valid, ${documentFindings.filter(f => f.status === 'needs_review').length} need review.`,
    documentFindings: documentFindings,
    recommendedAction: overallScore > 75 ? 'approve' : overallScore > 60 ? 'needs_review' : 'reject',
    riskLevel: overallScore > 80 ? 'low' : overallScore > 60 ? 'medium' : 'high',
  };

  // Create an AI evaluation history entry
  const aiEvaluationEntry: EvaluationHistoryEntry = {
    stage: 'ai-evaluation',
    reviewedBy: 'AI System',
    reviewedAt: new Date().toISOString(),
    checklist: [], // AI doesn't use checklist
    decision: aiRecommendation.recommendedAction === 'approve' ? 'approved' : 
              aiRecommendation.recommendedAction === 'reject' ? 'rejected' : 'pending',
    comments: aiRecommendation.summary,
    aiRecommendation: aiRecommendation,
  };

  mockAccreditationService.updateApplication(applicationId, {
    status: 'step5_under_final_review',
    finalReview: {
      ...app.finalReview,
      aiRecommendation: aiRecommendation,
    },
    evaluationHistory: [...(app.evaluationHistory || []), aiEvaluationEntry]
  });
  
  loadApplications();
  // Stay on the AI report tab to show the generated report
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
    setFinalChecklist(finalEvaluationCriteria.map(c => ({ criteriaId: c.id, criteriaName: c.name, isMet: false })));
    setVerificationNotes('');
  };

  const handleVerifyPayment = (applicationId: string) => {
    mockAccreditationService.updateApplication(applicationId, {
      status: 'step9_completed',
      paymentStatus: 'verified',
      paymentDate: new Date().toISOString(),
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
  {selectedApplication.status === 'step7_payment_pending' && (
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
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Initial Evaluation Checklist</h3>
                    <div className="space-y-3">
                      {initialEvaluationCriteria.map((criteria) => (
                        <div key={criteria.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                          <span className="text-sm text-gray-700">{criteria.name}</span>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={initialChecklist.find(c => c.criteriaId === criteria.id)?.isMet || false}
                              onChange={(e) => {
                                setInitialChecklist(prev => prev.map(c => 
                                  c.criteriaId === criteria.id ? { ...c, isMet: e.target.checked } : c
                                ));
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">Met</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Verification Notes</h3>
                    <textarea
                      rows={4}
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="Add notes about your evaluation findings..."
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
            <h3 className="text-lg font-semibold text-gray-800">AI Recommendation Report</h3>
          </div>
          <span className="text-sm text-gray-500">
            Generated: {new Date(selectedApplication.finalReview.aiRecommendation.generatedAt).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">Overall Score</p>
            <p className="text-2xl font-bold text-blue-600">{selectedApplication.finalReview.aiRecommendation.overallScore}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">Risk Level</p>
            <p className={`text-2xl font-bold ${
              selectedApplication.finalReview.aiRecommendation.riskLevel === 'low' ? 'text-green-600' :
              selectedApplication.finalReview.aiRecommendation.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {selectedApplication.finalReview.aiRecommendation.riskLevel.toUpperCase()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">Recommended Action</p>
            <p className={`text-2xl font-bold ${
              selectedApplication.finalReview.aiRecommendation.recommendedAction === 'approve' ? 'text-green-600' :
              selectedApplication.finalReview.aiRecommendation.recommendedAction === 'reject' ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {selectedApplication.finalReview.aiRecommendation.recommendedAction.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-700">{selectedApplication.finalReview.aiRecommendation.summary}</p>
        </div>

        <h4 className="font-medium text-gray-800 mb-3">Document Findings</h4>
        <div className="space-y-3">
          {selectedApplication.finalReview.aiRecommendation.documentFindings.map((finding, index) => (
            <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium">{finding.fileName}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  finding.status === 'valid' ? 'bg-green-100 text-green-700' :
                  finding.status === 'invalid' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {finding.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Confidence: {finding.confidence}%</span>
                {finding.issues && finding.issues.length > 0 && (
                  <span className="text-red-600">{finding.issues.length} issues found</span>
                )}
              </div>
              {finding.issues && finding.issues.length > 0 && (
                <ul className="mt-2 text-xs text-red-600 list-disc list-inside">
                  {finding.issues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Show a note if this is a historical report */}
        {selectedApplication.status !== 'step4_documents_uploaded' && 
         selectedApplication.status !== 'step5_under_final_review' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              This AI report was generated during the evaluation process and is part of the permanent record.
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
      // Editable view for ongoing review
      <>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Final Evaluation Checklist</h3>
          <div className="space-y-3">
            {finalEvaluationCriteria.map((criteria) => (
              <div key={criteria.id} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                <span className="text-sm text-gray-700">{criteria.name}</span>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={finalChecklist.find(c => c.criteriaId === criteria.id)?.isMet || false}
                    onChange={(e) => {
                      setFinalChecklist(prev => prev.map(c => 
                        c.criteriaId === criteria.id ? { ...c, isMet: e.target.checked } : c
                      ));
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Met</span>
                </label>
              </div>
            ))}
          </div>
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
      // Read-only view for completed evaluations (shouldn't normally be seen, but just in case)
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
            <h4 className="text-sm font-medium text-gray-700 mb-2">AI Analysis:</h4>
            <div className="bg-white p-3 rounded border border-gray-200">
              <p className="text-sm text-gray-700 mb-2">{entry.aiRecommendation.summary}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Overall Score:</span>
                  <span className="ml-1 font-medium text-blue-600">{entry.aiRecommendation.overallScore}%</span>
                </div>
                <div>
                  <span className="text-gray-500">Recommended:</span>
                  <span className={`ml-1 font-medium ${
                    entry.aiRecommendation.recommendedAction === 'approve' ? 'text-green-600' :
                    entry.aiRecommendation.recommendedAction === 'reject' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {entry.aiRecommendation.recommendedAction}
                  </span>
                </div>
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