import React, { useState, useRef } from 'react';
import { 
  UserCog, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Edit,
  ThumbsUp,
  XCircle,
  Search,
  Filter,
  Download,
  UserCheck,
  Award,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Save,
  Send,
  CheckSquare,
  XSquare,
  Info,
  AlertTriangle,
  FileSignature,
  ClipboardList,
  FileCheck,
  FileSearch,
  UserPlus,
  Mail,
  Printer,
  Archive,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';

interface AssessorManagementProps {
  userRole?: string;
  userName?: string;
  organizationName?: string;
}

// Define proper types for user roles
type UserRoleType = 'admin' | 'evaluator' | 'approver' | 'director' | 'quality_partner';

// Types for addendum applications
type AddendumApplication = {
  id: string;
  applicationNumber: string;
  assessorName: string;
  assessorId: string;
  qualification: string;
  saqaId: string;
  isRegistered: boolean;
  type: 'new_qualification' | 'extension' | 'personal_details' | 'status_change' | 'new_site';
  documents: {
    name: string;
    type: string;
    url: string;
    isSystemGenerated?: boolean;
  }[];
  
  // Step 1-3: Acknowledgement Process
  acknowledgementLetter?: {
    name: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
    reviewedAt?: string;
    reviewedBy?: string;
    reviewStatus?: 'pending' | 'approved' | 'rejected';
    reviewComments?: string;
  };
  
  // Step 4-6: Initial Evaluation Checklist
  evaluationChecklist?: {
    completed: boolean;
    items: EvaluationItem[];
    completedAt?: string;
    completedBy?: string;
    recommendation?: 'approve' | 'reject' | 'changes_requested';
    notes?: string;
    reportGenerated?: boolean;
    reportUrl?: string;
  };
  
  // Step 7-10: Detailed Evaluation
  detailedEvaluation?: {
    startedAt?: string;
    startedBy?: string;
    completedAt?: string;
    completedBy?: string;
    assessmentCriteria: AssessmentCriteria[];
    overallAssessment?: string;
    strengths?: string[];
    weaknesses?: string[];
    riskAssessment?: 'low' | 'medium' | 'high';
    recommendation?: 'approve' | 'reject' | 'changes_requested' | 'further_review';
    reportUrl?: string;
  };
  
  // Step 11-13: Final Approval
  finalApproval?: {
    reviewedAt?: string;
    reviewedBy?: string;
    decision?: 'approved' | 'rejected';
    approvalLetter?: {
      name: string;
      url: string;
      generatedAt: string;
      generatedBy: string;
    };
    comments?: string;
  };
  
  submittedDate: string;
  status: 'pending' | 'acknowledged' | 'initial_evaluation' | 'detailed_evaluation' | 'pending_approval' | 'approved' | 'rejected' | 'changes_requested' | 'further_review' | 'on_hold';
  submittedBy: string;
  submittedByOrganization: string;
  
  // Tracking
  evaluator?: string;
  evaluationDate?: string;
  approvalDate?: string;
  feedback?: string;
  approvedBy?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  history?: StatusHistoryEntry[];
};

type StatusHistoryEntry = {
  status: string;
  changedAt: string;
  changedBy: string;
  comments?: string;
};

type EvaluationItem = {
  id: string;
  description: string;
  status: 'pass' | 'fail' | 'na';
  comments?: string;
  evidence?: string;
};

type AssessmentCriteria = {
  id: string;
  category: 'documentation' | 'qualifications' | 'experience' | 'references' | 'compliance';
  criteria: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comments?: string;
  supportingEvidence?: string;
};

export default function AssessorManagement({ userRole, userName, organizationName }: AssessorManagementProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'applications' | 'evaluation' | 'approval'>('applications');
  const [selectedApplication, setSelectedApplication] = useState<AddendumApplication | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  
  // Step-specific states
  const [currentStep, setCurrentStep] = useState<'view' | 'upload' | 'review_ack' | 'initial_eval' | 'detailed_eval' | 'approval'>('view');
  const [ackReviewStatus, setAckReviewStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [ackReviewComments, setAckReviewComments] = useState('');
  
  // Evaluation states
  const [evaluationResults, setEvaluationResults] = useState<EvaluationItem[]>([
    { id: '1', description: 'All required documents are present and readable', status: 'na', comments: '' },
    { id: '2', description: 'Assessor registration is valid and active', status: 'na', comments: '' },
    { id: '3', description: 'Qualification matches assessor\'s expertise', status: 'na', comments: '' },
    { id: '4', description: 'Supporting documents are authentic and valid', status: 'na', comments: '' },
    { id: '5', description: 'No conflicts of interest identified', status: 'na', comments: '' },
    { id: '6', description: 'Application meets all requirements', status: 'na', comments: '' },
    { id: '7', description: 'Assessor has required experience (min 3 years)', status: 'na', comments: '' },
    { id: '8', description: 'Professional body registration is valid', status: 'na', comments: '' },
  ]);
  
  // Detailed assessment criteria
  const [assessmentCriteria, setAssessmentCriteria] = useState<AssessmentCriteria[]>([
    { id: '1', category: 'documentation', criteria: 'All documents are properly certified', rating: 3, comments: '' },
    { id: '2', category: 'qualifications', criteria: 'Qualifications are NQF aligned', rating: 3, comments: '' },
    { id: '3', category: 'experience', criteria: 'Work experience is verifiable', rating: 3, comments: '' },
    { id: '4', category: 'references', criteria: 'References are contactable and valid', rating: 3, comments: '' },
    { id: '5', category: 'compliance', criteria: 'No previous disciplinary issues', rating: 3, comments: '' },
  ]);
  
  const [evaluationNotes, setEvaluationNotes] = useState('');
  const [recommendation, setRecommendation] = useState<'approve' | 'reject' | 'changes_requested' | 'further_review' | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<'low' | 'medium' | 'high'>('low');
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [strengthInput, setStrengthInput] = useState('');
  const [weaknessInput, setWeaknessInput] = useState('');
  
  const itemsPerPage = 10;

  // Mock user for signature
  const currentUser = {
    name: userName || 'John Evaluator',
    role: 'Senior Evaluator',
    credentials: 'EVAL-2024-001',
    id: 'USR-123'
  };

  // Mock data - these would come from the Quality Partner submissions
  const [applications, setApplications] = useState<AddendumApplication[]>([
    {
      id: '1',
      applicationNumber: 'QAS-2024-001',
      assessorName: 'John Doe',
      assessorId: 'ASS-123',
      qualification: 'Electrician Level 4',
      saqaId: 'SAQA-12345',
      isRegistered: true,
      type: 'new_qualification',
      documents: [
        { name: 'Curriculum Document.pdf', type: 'pdf', url: '#', isSystemGenerated: true },
        { name: 'Assessment Specification.pdf', type: 'pdf', url: '#', isSystemGenerated: true },
        { name: 'SAQA Document.pdf', type: 'pdf', url: '#', isSystemGenerated: true },
        { name: 'ID Document.pdf', type: 'pdf', url: '#', isSystemGenerated: false },
        { name: 'Qualifications Certificate.pdf', type: 'pdf', url: '#', isSystemGenerated: false }
      ],
      submittedDate: '2024-03-15',
      status: 'pending',
      submittedBy: 'John Doe',
      submittedByOrganization: 'ABC Training Institute',
      history: [
        { status: 'pending', changedAt: '2024-03-15T09:30:00', changedBy: 'John Doe', comments: 'Application submitted' }
      ]
    },
    {
      id: '2',
      applicationNumber: 'QAS-2024-002',
      assessorName: 'Mary Smith',
      assessorId: 'ASS-456',
      qualification: 'Plumber Level 3',
      saqaId: 'SAQA-67890',
      isRegistered: false,
      type: 'extension',
      documents: [
        { name: 'Curriculum Document.pdf', type: 'pdf', url: '#', isSystemGenerated: true },
        { name: 'Assessment Specification.pdf', type: 'pdf', url: '#', isSystemGenerated: true },
        { name: 'Current Certification.pdf', type: 'pdf', url: '#', isSystemGenerated: false }
      ],
      acknowledgementLetter: {
        name: 'Acknowledgement-Letter-QAS-2024-002.pdf',
        url: '#',
        uploadedAt: '2024-03-16T10:30:00',
        uploadedBy: 'John Evaluator',
        reviewedAt: '2024-03-17T14:20:00',
        reviewedBy: 'John Evaluator',
        reviewStatus: 'approved',
        reviewComments: 'Acknowledgement letter verified and approved'
      },
      submittedDate: '2024-03-14',
      status: 'initial_evaluation',
      submittedBy: 'Mary Smith',
      submittedByOrganization: 'XYZ College',
      acknowledgedAt: '2024-03-16T10:30:00',
      acknowledgedBy: 'John Evaluator',
      evaluator: 'John Evaluator',
      history: [
        { status: 'pending', changedAt: '2024-03-14T11:20:00', changedBy: 'Mary Smith', comments: 'Application submitted' },
        { status: 'acknowledged', changedAt: '2024-03-16T10:30:00', changedBy: 'John Evaluator', comments: 'Acknowledgement letter uploaded' },
        { status: 'initial_evaluation', changedAt: '2024-03-17T14:20:00', changedBy: 'John Evaluator', comments: 'Acknowledgement letter approved, moving to evaluation' }
      ]
    },
    {
      id: '3',
      applicationNumber: 'QAS-2024-003',
      assessorName: 'David Brown',
      assessorId: 'ASS-789',
      qualification: 'Welder Level 2',
      saqaId: 'SAQA-45678',
      isRegistered: false,
      type: 'new_qualification',
      documents: [
        { name: 'Curriculum Document.pdf', type: 'pdf', url: '#', isSystemGenerated: true },
        { name: 'Assessment Specification.pdf', type: 'pdf', url: '#', isSystemGenerated: true }
      ],
      acknowledgementLetter: {
        name: 'Acknowledgement-Letter-QAS-2024-003.pdf',
        url: '#',
        uploadedAt: '2024-03-13T14:15:00',
        uploadedBy: 'John Evaluator',
        reviewedAt: '2024-03-14T09:45:00',
        reviewedBy: 'John Evaluator',
        reviewStatus: 'approved',
        reviewComments: 'Acknowledgement letter verified'
      },
      evaluationChecklist: {
        completed: true,
        items: [
          { id: '1', description: 'All required documents are present and readable', status: 'pass', comments: 'All documents verified' },
          { id: '2', description: 'Assessor registration is valid and active', status: 'pass', comments: 'Registration confirmed' },
          { id: '3', description: 'Qualification matches assessor\'s expertise', status: 'pass', comments: 'Experience verified' },
          { id: '4', description: 'Supporting documents are authentic and valid', status: 'pass', comments: 'All documents authentic' },
          { id: '5', description: 'No conflicts of interest identified', status: 'pass', comments: 'Clear' },
          { id: '6', description: 'Application meets all requirements', status: 'pass', comments: 'Meets all criteria' },
        ],
        completedAt: '2024-03-14T09:45:00',
        completedBy: 'John Evaluator',
        recommendation: 'approve',
        notes: 'Initial evaluation complete. Moving to detailed assessment.',
        reportGenerated: true,
        reportUrl: '#'
      },
      submittedDate: '2024-03-12',
      status: 'detailed_evaluation',
      submittedBy: 'David Brown',
      submittedByOrganization: 'Skills Academy',
      evaluator: 'John Evaluator',
      evaluationDate: '2024-03-14',
      history: [
        { status: 'pending', changedAt: '2024-03-12T10:15:00', changedBy: 'David Brown', comments: 'Application submitted' },
        { status: 'acknowledged', changedAt: '2024-03-13T14:15:00', changedBy: 'John Evaluator', comments: 'Acknowledgement letter uploaded' },
        { status: 'initial_evaluation', changedAt: '2024-03-14T09:45:00', changedBy: 'John Evaluator', comments: 'Initial evaluation complete' },
        { status: 'detailed_evaluation', changedAt: '2024-03-14T10:30:00', changedBy: 'John Evaluator', comments: 'Moved to detailed evaluation' }
      ]
    },
    {
      id: '4',
      applicationNumber: 'QAS-2024-004',
      assessorName: 'Sarah Wilson',
      assessorId: 'ASS-101',
      qualification: 'Business Management L5',
      saqaId: 'SAQA-90123',
      isRegistered: true,
      type: 'status_change',
      documents: [
        { name: 'Curriculum Document.pdf', type: 'pdf', url: '#', isSystemGenerated: true },
        { name: 'Assessment Specification.pdf', type: 'pdf', url: '#', isSystemGenerated: true },
        { name: 'SAQA Document.pdf', type: 'pdf', url: '#', isSystemGenerated: true }
      ],
      acknowledgementLetter: {
        name: 'Acknowledgement-Letter-QAS-2024-004.pdf',
        url: '#',
        uploadedAt: '2024-03-09T11:20:00',
        uploadedBy: 'John Evaluator',
        reviewedAt: '2024-03-10T09:30:00',
        reviewedBy: 'John Evaluator',
        reviewStatus: 'approved',
        reviewComments: 'Acknowledgement letter approved'
      },
      evaluationChecklist: {
        completed: true,
        items: [
          { id: '1', description: 'All required documents are present and readable', status: 'pass', comments: 'Documents verified' },
          { id: '2', description: 'Assessor registration is valid and active', status: 'pass', comments: 'Registration active' },
          { id: '3', description: 'Qualification matches assessor\'s expertise', status: 'pass', comments: 'Qualification match' },
          { id: '4', description: 'Supporting documents are authentic and valid', status: 'fail', comments: 'ID document expired' },
          { id: '5', description: 'No conflicts of interest identified', status: 'pass', comments: 'No conflicts' },
          { id: '6', description: 'Application meets all requirements', status: 'fail', comments: 'Requires updated ID' },
        ],
        completedAt: '2024-03-10T15:30:00',
        completedBy: 'John Evaluator',
        recommendation: 'changes_requested',
        notes: 'ID document has expired. Changes requested.',
        reportGenerated: true,
        reportUrl: '#'
      },
      detailedEvaluation: {
        startedAt: '2024-03-11T10:00:00',
        startedBy: 'John Evaluator',
        assessmentCriteria: [
          { id: '1', category: 'documentation', criteria: 'All documents are properly certified', rating: 2, comments: 'ID document expired' },
          { id: '2', category: 'qualifications', criteria: 'Qualifications are NQF aligned', rating: 4, comments: 'Qualifications verified' },
          { id: '3', category: 'experience', criteria: 'Work experience is verifiable', rating: 4, comments: '10 years experience confirmed' },
          { id: '4', category: 'references', criteria: 'References are contactable and valid', rating: 4, comments: 'References responded' },
          { id: '5', category: 'compliance', criteria: 'No previous disciplinary issues', rating: 5, comments: 'Clean record' },
        ],
        overallAssessment: 'Candidate is well qualified but needs to update ID document',
        strengths: ['Extensive experience', 'Good references', 'Clean disciplinary record'],
        weaknesses: ['Expired ID document'],
        riskAssessment: 'medium',
        recommendation: 'changes_requested'
      },
      submittedDate: '2024-03-08',
      status: 'changes_requested',
      submittedBy: 'Sarah Wilson',
      submittedByOrganization: 'Tech Institute',
      evaluator: 'John Evaluator',
      evaluationDate: '2024-03-10',
      feedback: 'ID document has expired. Please upload a valid ID.',
      history: [
        { status: 'pending', changedAt: '2024-03-08T14:30:00', changedBy: 'Sarah Wilson', comments: 'Application submitted' },
        { status: 'acknowledged', changedAt: '2024-03-09T11:20:00', changedBy: 'John Evaluator', comments: 'Acknowledgement letter uploaded' },
        { status: 'initial_evaluation', changedAt: '2024-03-10T15:30:00', changedBy: 'John Evaluator', comments: 'Initial evaluation complete - changes requested' },
        { status: 'changes_requested', changedAt: '2024-03-11T10:00:00', changedBy: 'John Evaluator', comments: 'Moved to changes requested' }
      ]
    }
  ]);

  // Mock user roles
  const currentUserRole: UserRoleType = 'evaluator';
  const isEvaluator = ['evaluator', 'admin'].includes(currentUserRole);
  const isApprover = ['approver', 'director'].includes(currentUserRole);

  // Filter applications based on search and tab
  const getFilteredApplications = () => {
    let filtered = applications;
    
    // Filter by tab
    if (activeTab === 'applications') {
      filtered = applications.filter(app => 
        app.status === 'pending' || 
        app.status === 'acknowledged' || 
        app.status === 'initial_evaluation'
      );
    } else if (activeTab === 'evaluation') {
      filtered = applications.filter(app => 
        app.status === 'detailed_evaluation' || 
        app.status === 'changes_requested' || 
        app.status === 'further_review' ||
        app.status === 'on_hold'
      );
    } else if (activeTab === 'approval') {
      filtered = applications.filter(app => 
        app.status === 'pending_approval'
      );
    }
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.assessorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.assessorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.qualification.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredApplications = getFilteredApplications();
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = {
    pending: applications.filter(a => a.status === 'pending').length,
    acknowledged: applications.filter(a => a.status === 'acknowledged').length,
    initialEval: applications.filter(a => a.status === 'initial_evaluation').length,
    detailedEval: applications.filter(a => a.status === 'detailed_evaluation').length,
    pendingApproval: applications.filter(a => a.status === 'pending_approval').length,
    approved: applications.filter(a => a.status === 'approved').length,
    changesRequested: applications.filter(a => a.status === 'changes_requested').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    total: applications.length
  };

  // Handle acknowledgement letter upload
 // Handle acknowledgement letter upload - FIXED
const handleAcknowledgementUpload = (event: React.ChangeEvent<HTMLInputElement>, app: AddendumApplication) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setIsUploading(true);
  
  // Simulate upload
  setTimeout(() => {
    const updatedApps: AddendumApplication[] = applications.map(a => {
      if (a.id === app.id) {
        const newHistory = a.history ? [...a.history] : [];
        newHistory.push({
          status: 'acknowledged',
          changedAt: new Date().toISOString(),
          changedBy: currentUser.name,
          comments: 'Acknowledgement letter uploaded'
        });

        return {
          ...a,
          acknowledgementLetter: {
            name: file.name,
            url: URL.createObjectURL(file),
            uploadedAt: new Date().toISOString(),
            uploadedBy: currentUser.name,
            reviewStatus: 'pending' as const // Fixed: added 'as const'
          },
          status: 'acknowledged' as const,
          acknowledgedAt: new Date().toISOString(),
          acknowledgedBy: currentUser.name,
          history: newHistory
        } as AddendumApplication; // Fixed: added type assertion
      }
      return a;
    });
    
    setApplications(updatedApps);
    setSelectedApplication(updatedApps.find(a => a.id === app.id) || null);
    setIsUploading(false);
    setCurrentStep('review_ack');
  }, 1000);
};

// Handle acknowledgement letter review - FIXED
const handleAckReviewSubmit = () => {
  if (!selectedApplication) return;

  const updatedApps: AddendumApplication[] = applications.map(a => {
    if (a.id === selectedApplication.id) {
      const newHistory = a.history ? [...a.history] : [];
      newHistory.push({
        status: 'initial_evaluation',
        changedAt: new Date().toISOString(),
        changedBy: currentUser.name,
        comments: ackReviewComments || 'Acknowledgement letter reviewed and approved'
      });

      return {
        ...a,
        acknowledgementLetter: a.acknowledgementLetter ? {
          ...a.acknowledgementLetter,
          reviewedAt: new Date().toISOString(),
          reviewedBy: currentUser.name,
          reviewStatus: ackReviewStatus as 'pending' | 'approved' | 'rejected', // Fixed: type assertion
          reviewComments: ackReviewComments
        } : undefined,
        status: 'initial_evaluation' as const,
        history: newHistory
      } as AddendumApplication; // Fixed: added type assertion
    }
    return a;
  });

  setApplications(updatedApps);
  setSelectedApplication(updatedApps.find(a => a.id === selectedApplication.id) || null);
  setCurrentStep('initial_eval');
  setAckReviewStatus('pending');
  setAckReviewComments('');
};

// Handle initial evaluation save - FIXED
const handleInitialEvaluationSave = () => {
  if (!selectedApplication) return;

  const allItemsRated = evaluationResults.every(item => item.status !== 'na');
  if (!allItemsRated) {
    alert('Please complete all evaluation items before saving');
    return;
  }

  const newStatus = recommendation === 'approve' ? 'detailed_evaluation' : 
                   recommendation === 'changes_requested' ? 'changes_requested' : 
                   recommendation === 'further_review' ? 'further_review' : 'rejected';

  const updatedApps: AddendumApplication[] = applications.map(a => {
    if (a.id === selectedApplication.id) {
      const newHistory = a.history ? [...a.history] : [];
      newHistory.push({
        status: newStatus,
        changedAt: new Date().toISOString(),
        changedBy: currentUser.name,
        comments: evaluationNotes || 'Initial evaluation completed'
      });

      return {
        ...a,
        evaluationChecklist: {
          completed: true,
          items: evaluationResults,
          completedAt: new Date().toISOString(),
          completedBy: currentUser.name,
          recommendation: recommendation as 'approve' | 'reject' | 'changes_requested' | undefined, // Fixed: type assertion
          notes: evaluationNotes,
          reportGenerated: true,
          reportUrl: '#'
        },
        status: newStatus,
        evaluator: currentUser.name,
        evaluationDate: new Date().toISOString().split('T')[0],
        feedback: recommendation === 'changes_requested' ? evaluationNotes : undefined,
        history: newHistory
      } as AddendumApplication; // Fixed: added type assertion
    }
    return a;
  });

  setApplications(updatedApps);
  setSelectedApplication(null);
  setCurrentStep('view');
  resetEvaluationForm();
};

// Handle detailed evaluation save - FIXED
const handleDetailedEvaluationSave = () => {
  if (!selectedApplication) return;

  const updatedApps: AddendumApplication[] = applications.map(a => {
    if (a.id === selectedApplication.id) {
      const newHistory = a.history ? [...a.history] : [];
      newHistory.push({
        status: 'pending_approval',
        changedAt: new Date().toISOString(),
        changedBy: currentUser.name,
        comments: 'Detailed evaluation completed'
      });

      return {
        ...a,
        detailedEvaluation: {
          startedAt: a.detailedEvaluation?.startedAt || new Date().toISOString(),
          startedBy: a.detailedEvaluation?.startedBy || currentUser.name,
          completedAt: new Date().toISOString(),
          completedBy: currentUser.name,
          assessmentCriteria: assessmentCriteria,
          overallAssessment: evaluationNotes,
          strengths: strengths,
          weaknesses: weaknesses,
          riskAssessment: riskAssessment as 'low' | 'medium' | 'high', // Fixed: type assertion
          recommendation: recommendation as 'approve' | 'reject' | 'changes_requested' | 'further_review' | undefined, // Fixed: type assertion
          reportUrl: '#'
        },
        status: 'pending_approval' as const,
        history: newHistory
      } as AddendumApplication; // Fixed: added type assertion
    }
    return a;
  });

  setApplications(updatedApps);
  setSelectedApplication(null);
  setCurrentStep('view');
};

// Handle final approval - FIXED
const handleFinalApproval = (approved: boolean) => {
  if (!selectedApplication) return;

  // Generate approval/rejection letter
  const letterName = approved 
    ? `Approval-Letter-${selectedApplication.applicationNumber}.pdf`
    : `Rejection-Letter-${selectedApplication.applicationNumber}.pdf`;

  const updatedApps: AddendumApplication[] = applications.map(a => {
    if (a.id === selectedApplication.id) {
      const newHistory = a.history ? [...a.history] : [];
      newHistory.push({
        status: approved ? 'approved' : 'rejected',
        changedAt: new Date().toISOString(),
        changedBy: currentUser.name,
        comments: approved ? 'Application approved' : 'Application rejected'
      });

      return {
        ...a,
        status: approved ? ('approved' as const) : ('rejected' as const),
        approvedBy: currentUser.name,
        approvalDate: new Date().toISOString().split('T')[0],
        finalApproval: {
          reviewedAt: new Date().toISOString(),
          reviewedBy: currentUser.name,
          decision: approved ? 'approved' as const : 'rejected' as const, // Fixed: added 'as const'
          approvalLetter: {
            name: letterName,
            url: '#',
            generatedAt: new Date().toISOString(),
            generatedBy: currentUser.name
          },
          comments: evaluationNotes
        },
        history: newHistory
      } as AddendumApplication; // Fixed: added type assertion
    }
    return a;
  });

  setApplications(updatedApps);
  setSelectedApplication(null);
  setCurrentStep('view');
};

  // Reset evaluation form
  const resetEvaluationForm = () => {
    setEvaluationResults(evaluationResults.map(item => ({ ...item, status: 'na', comments: '' })));
    setEvaluationNotes('');
    setRecommendation(null);
    setRiskAssessment('low');
    setStrengths([]);
    setWeaknesses([]);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'acknowledged':
        return 'bg-blue-100 text-blue-700';
      case 'initial_evaluation':
        return 'bg-purple-100 text-purple-700';
      case 'detailed_evaluation':
        return 'bg-indigo-100 text-indigo-700';
      case 'pending_approval':
        return 'bg-orange-100 text-orange-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'changes_requested':
        return 'bg-pink-100 text-pink-700';
      case 'further_review':
        return 'bg-gray-100 text-gray-700';
      case 'on_hold':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'new_qualification':
        return <Award className="h-4 w-4 text-purple-500" />;
      case 'extension':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'personal_details':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      case 'status_change':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'new_site':
        return <Building2 className="h-4 w-4 text-indigo-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // Render application details based on current step
  const renderApplicationDetails = () => {
    if (!selectedApplication) return null;

    switch(currentStep) {
      case 'upload':
        return (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-3">Step 1: Upload Acknowledgement Letter</h4>
            <p className="text-sm text-yellow-600 mb-4">
              Please upload the acknowledgement letter for this application. This will acknowledge receipt of the application.
            </p>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => handleAcknowledgementUpload(e, selectedApplication)}
                disabled={isUploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center"
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Letter
              </button>
              {isUploading && <span className="text-sm text-gray-500">Uploading...</span>}
            </div>
          </div>
        );

      case 'review_ack':
        return (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-3">Step 2: Review Acknowledgement Letter</h4>
            <p className="text-sm text-blue-600 mb-4">
              Review the uploaded acknowledgement letter and verify its contents.
            </p>
            
            {selectedApplication.acknowledgementLetter && (
              <div className="mb-4 p-3 bg-white rounded border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium">{selectedApplication.acknowledgementLetter.name}</span>
                  </div>
                  <a href={selectedApplication.acknowledgementLetter.url} className="text-blue-600 hover:text-blue-800 flex items-center" download>
                    <Download className="h-4 w-4 mr-1" />
                    <span className="text-sm">Download</span>
                  </a>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Uploaded by {selectedApplication.acknowledgementLetter.uploadedBy} on {new Date(selectedApplication.acknowledgementLetter.uploadedAt).toLocaleString()}
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Review Status</label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setAckReviewStatus('approved')}
                  className={`px-4 py-2 rounded-lg border ${
                    ackReviewStatus === 'approved'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-green-300 text-green-700 hover:bg-green-50'
                  }`}
                >
                  Approve
                </button>
                <button
                  onClick={() => setAckReviewStatus('rejected')}
                  className={`px-4 py-2 rounded-lg border ${
                    ackReviewStatus === 'rejected'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'border-red-300 text-red-700 hover:bg-red-50'
                  }`}
                >
                  Reject
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Review Comments</label>
              <textarea
                rows={3}
                value={ackReviewComments}
                onChange={(e) => setAckReviewComments(e.target.value)}
                placeholder="Add any comments about the acknowledgement letter..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setCurrentStep('view')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAckReviewSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Review
              </button>
            </div>
          </div>
        );

      case 'initial_eval':
        return (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-3">Step 3: Initial Evaluation Checklist</h4>
            <p className="text-sm text-purple-600 mb-4">
              Complete the initial evaluation checklist. This will determine if the application can proceed to detailed evaluation.
            </p>
            
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {evaluationResults.map((item, index) => (
                <div key={item.id} className="bg-white p-3 rounded border border-purple-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-700">{index + 1}. {item.description}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          const newResults = [...evaluationResults];
                          newResults[index].status = 'pass';
                          setEvaluationResults(newResults);
                        }}
                        className={`px-2 py-1 text-xs rounded ${
                          item.status === 'pass' 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-gray-100 text-gray-500 hover:bg-green-50'
                        }`}
                      >
                        Pass
                      </button>
                      <button
                        onClick={() => {
                          const newResults = [...evaluationResults];
                          newResults[index].status = 'fail';
                          setEvaluationResults(newResults);
                        }}
                        className={`px-2 py-1 text-xs rounded ${
                          item.status === 'fail' 
                            ? 'bg-red-100 text-red-700 border border-red-300' 
                            : 'bg-gray-100 text-gray-500 hover:bg-red-50'
                        }`}
                      >
                        Fail
                      </button>
                      <button
                        onClick={() => {
                          const newResults = [...evaluationResults];
                          newResults[index].status = 'na';
                          setEvaluationResults(newResults);
                        }}
                        className={`px-2 py-1 text-xs rounded ${
                          item.status === 'na' 
                            ? 'bg-gray-300 text-gray-700' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        N/A
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Add comments (optional)"
                    value={item.comments}
                    onChange={(e) => {
                      const newResults = [...evaluationResults];
                      newResults[index].comments = e.target.value;
                      setEvaluationResults(newResults);
                    }}
                    className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Evaluation Notes</label>
              <textarea
                rows={3}
                value={evaluationNotes}
                onChange={(e) => setEvaluationNotes(e.target.value)}
                placeholder="Add overall evaluation notes..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Recommendation</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRecommendation('approve')}
                  className={`py-2 rounded-lg border ${
                    recommendation === 'approve'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-green-300 text-green-700 hover:bg-green-50'
                  }`}
                >
                  Proceed to Detailed Evaluation
                </button>
                <button
                  onClick={() => setRecommendation('changes_requested')}
                  className={`py-2 rounded-lg border ${
                    recommendation === 'changes_requested'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                  }`}
                >
                  Request Changes
                </button>
                <button
                  onClick={() => setRecommendation('further_review')}
                  className={`py-2 rounded-lg border ${
                    recommendation === 'further_review'
                      ? 'bg-gray-600 text-white border-gray-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Further Review Needed
                </button>
                <button
                  onClick={() => setRecommendation('reject')}
                  className={`py-2 rounded-lg border ${
                    recommendation === 'reject'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'border-red-300 text-red-700 hover:bg-red-50'
                  }`}
                >
                  Reject Application
                </button>
              </div>
            </div>

            <div className="bg-gray-100 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-600 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                You are logged in as <span className="font-medium ml-1">{currentUser.name} ({currentUser.role})</span>
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setCurrentStep('view')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInitialEvaluationSave}
                disabled={!recommendation}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Complete Initial Evaluation
              </button>
            </div>
          </div>
        );

      case 'detailed_eval':
        return (
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h4 className="font-medium text-indigo-800 mb-3">Step 4: Detailed Assessment</h4>
            <p className="text-sm text-indigo-600 mb-4">
              Conduct a detailed assessment of the application using the criteria below.
            </p>
            
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {assessmentCriteria.map((criterion, index) => (
                <div key={criterion.id} className="bg-white p-3 rounded border border-indigo-200">
                  <div className="mb-2">
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {criterion.category}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-2">{criterion.criteria}</p>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs text-gray-500">Rating:</span>
                    {[1,2,3,4,5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => {
                          const newCriteria = [...assessmentCriteria];
                          newCriteria[index].rating = rating as 1|2|3|4|5;
                          setAssessmentCriteria(newCriteria);
                        }}
                        className={`w-8 h-8 rounded-full text-xs ${
                          criterion.rating === rating
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-indigo-100'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Add comments..."
                    value={criterion.comments}
                    onChange={(e) => {
                      const newCriteria = [...assessmentCriteria];
                      newCriteria[index].comments = e.target.value;
                      setAssessmentCriteria(newCriteria);
                    }}
                    className="w-full p-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Strengths</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={strengthInput}
                    onChange={(e) => setStrengthInput(e.target.value)}
                    placeholder="Add strength..."
                    className="flex-1 p-2 text-sm border border-gray-300 rounded"
                  />
                  <button
                    onClick={() => {
                      if (strengthInput) {
                        setStrengths([...strengths, strengthInput]);
                        setStrengthInput('');
                      }
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  {strengths.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-green-50 p-2 rounded">
                      <span className="text-sm">{s}</span>
                      <button
                        onClick={() => setStrengths(strengths.filter((_, idx) => idx !== i))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weaknesses</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={weaknessInput}
                    onChange={(e) => setWeaknessInput(e.target.value)}
                    placeholder="Add weakness..."
                    className="flex-1 p-2 text-sm border border-gray-300 rounded"
                  />
                  <button
                    onClick={() => {
                      if (weaknessInput) {
                        setWeaknesses([...weaknesses, weaknessInput]);
                        setWeaknessInput('');
                      }
                    }}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  {weaknesses.map((w, i) => (
                    <div key={i} className="flex items-center justify-between bg-red-50 p-2 rounded">
                      <span className="text-sm">{w}</span>
                      <button
                        onClick={() => setWeaknesses(weaknesses.filter((_, idx) => idx !== i))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Assessment</label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setRiskAssessment('low')}
                  className={`flex-1 py-2 rounded-lg border ${
                    riskAssessment === 'low'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-green-300 text-green-700 hover:bg-green-50'
                  }`}
                >
                  Low Risk
                </button>
                <button
                  onClick={() => setRiskAssessment('medium')}
                  className={`flex-1 py-2 rounded-lg border ${
                    riskAssessment === 'medium'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                  }`}
                >
                  Medium Risk
                </button>
                <button
                  onClick={() => setRiskAssessment('high')}
                  className={`flex-1 py-2 rounded-lg border ${
                    riskAssessment === 'high'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'border-red-300 text-red-700 hover:bg-red-50'
                  }`}
                >
                  High Risk
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Overall Assessment</label>
              <textarea
                rows={3}
                value={evaluationNotes}
                onChange={(e) => setEvaluationNotes(e.target.value)}
                placeholder="Provide an overall assessment summary..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Final Recommendation</label>
              <div className="flex space-x-3">
                <button
                  onClick={() => setRecommendation('approve')}
                  className={`flex-1 py-2 rounded-lg border ${
                    recommendation === 'approve'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-green-300 text-green-700 hover:bg-green-50'
                  }`}
                >
                  Recommend Approval
                </button>
                <button
                  onClick={() => setRecommendation('changes_requested')}
                  className={`flex-1 py-2 rounded-lg border ${
                    recommendation === 'changes_requested'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                  }`}
                >
                  Request Changes
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setCurrentStep('view')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDetailedEvaluationSave}
                disabled={!recommendation}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Submit Detailed Assessment
              </button>
            </div>
          </div>
        );

      case 'approval':
        return (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 mb-3">Step 5: Final Approval</h4>
            <p className="text-sm text-green-600 mb-4">
              Review the complete application and detailed assessment before making a final decision.
            </p>

            <div className="bg-white p-4 rounded-lg mb-4">
              <h5 className="font-medium text-gray-700 mb-2">Application Summary</h5>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Application #</p>
                  <p className="font-medium">{selectedApplication.applicationNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Assessor</p>
                  <p className="font-medium">{selectedApplication.assessorName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Qualification</p>
                  <p className="font-medium">{selectedApplication.qualification}</p>
                </div>
                <div>
                  <p className="text-gray-500">Evaluator</p>
                  <p className="font-medium">{selectedApplication.evaluator}</p>
                </div>
              </div>
            </div>

            {selectedApplication.detailedEvaluation && (
              <div className="bg-white p-4 rounded-lg mb-4">
                <h5 className="font-medium text-gray-700 mb-2">Detailed Assessment Results</h5>
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Risk Level:</span> {selectedApplication.detailedEvaluation.riskAssessment}</p>
                  <p className="text-sm"><span className="font-medium">Strengths:</span></p>
                  <ul className="list-disc list-inside text-sm pl-2">
                    {selectedApplication.detailedEvaluation.strengths?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                  <p className="text-sm"><span className="font-medium">Weaknesses:</span></p>
                  <ul className="list-disc list-inside text-sm pl-2">
                    {selectedApplication.detailedEvaluation.weaknesses?.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                  <p className="text-sm"><span className="font-medium">Overall Assessment:</span> {selectedApplication.detailedEvaluation.overallAssessment}</p>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Approval Comments</label>
              <textarea
                rows={3}
                value={evaluationNotes}
                onChange={(e) => setEvaluationNotes(e.target.value)}
                placeholder="Add any final comments..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setCurrentStep('view')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleFinalApproval(false)}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 flex items-center"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Application
              </button>
              <button
                onClick={() => handleFinalApproval(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Approve Application
              </button>
            </div>
          </div>
        );

      default:
        return (
          <>
            {/* Application Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Application Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Application Number</p>
                  <p className="text-sm font-medium">{selectedApplication.applicationNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs rounded-full inline-block mt-1 ${getStatusBadge(selectedApplication.status)}`}>
                    {selectedApplication.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Submitted By</p>
                  <p className="text-sm font-medium">{selectedApplication.submittedBy}</p>
                  <p className="text-xs text-gray-500">{selectedApplication.submittedByOrganization}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Submitted Date</p>
                  <p className="text-sm font-medium">{selectedApplication.submittedDate}</p>
                </div>
              </div>
            </div>

            {/* Assessor Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Assessor Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Assessor Name</p>
                  <p className="text-sm font-medium">{selectedApplication.assessorName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Assessor ID</p>
                  <p className="text-sm font-medium">{selectedApplication.assessorId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Qualification</p>
                  <p className="text-sm font-medium">{selectedApplication.qualification}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">SAQA ID</p>
                  <p className="text-sm font-medium">{selectedApplication.saqaId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">SAQA Registration</p>
                  <span className={`px-2 py-1 text-xs rounded-full inline-block mt-1 ${
                    selectedApplication.isRegistered ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedApplication.isRegistered ? 'Registered' : 'Not Registered'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Application Type</p>
                  <p className="text-sm font-medium capitalize">{selectedApplication.type.replace('_', ' ')}</p>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Application Documents</h4>
              <div className="space-y-2">
                {selectedApplication.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-500 mr-3" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">{doc.name}</span>
                        {doc.isSystemGenerated && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            System Generated
                          </span>
                        )}
                      </div>
                    </div>
                    <a href={doc.url} className="text-blue-600 hover:text-blue-800 flex items-center" download>
                      <Download className="h-4 w-4 mr-1" />
                      <span className="text-sm">Download</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Acknowledgement Letter Info - If already uploaded */}
            {selectedApplication.acknowledgementLetter && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">Acknowledgement Letter</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{selectedApplication.acknowledgementLetter.name}</p>
                      <p className="text-xs text-gray-500">
                        Uploaded by {selectedApplication.acknowledgementLetter.uploadedBy} on {new Date(selectedApplication.acknowledgementLetter.uploadedAt).toLocaleString()}
                      </p>
                      {selectedApplication.acknowledgementLetter.reviewedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Reviewed by {selectedApplication.acknowledgementLetter.reviewedBy} on {new Date(selectedApplication.acknowledgementLetter.reviewedAt).toLocaleString()}
                          <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                            selectedApplication.acknowledgementLetter.reviewStatus === 'approved' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {selectedApplication.acknowledgementLetter.reviewStatus}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <a href={selectedApplication.acknowledgementLetter.url} className="text-blue-600 hover:text-blue-800 flex items-center" download>
                    <Download className="h-4 w-4 mr-1" />
                    <span className="text-sm">Download</span>
                  </a>
                </div>
              </div>
            )}

            {/* Evaluation Results - If already evaluated */}
            {selectedApplication.evaluationChecklist?.completed && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-3">Initial Evaluation Results</h4>
                <div className="space-y-2 mb-3">
                  {selectedApplication.evaluationChecklist.items.map((item, index) => (
                    <div key={item.id} className="flex items-start space-x-2">
                      {item.status === 'pass' && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />}
                      {item.status === 'fail' && <XCircle className="h-4 w-4 text-red-500 mt-0.5" />}
                      {item.status === 'na' && <Minus className="h-4 w-4 text-gray-400 mt-0.5" />}
                      <div>
                        <p className="text-sm text-gray-700">{item.description}</p>
                        {item.comments && <p className="text-xs text-gray-500">{item.comments}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedApplication.evaluationChecklist.notes && (
                  <div className="bg-white p-3 rounded mb-3">
                    <p className="text-sm font-medium text-gray-700">Notes:</p>
                    <p className="text-sm text-gray-600">{selectedApplication.evaluationChecklist.notes}</p>
                  </div>
                )}
                {selectedApplication.evaluationChecklist.reportUrl && (
                  <div className="flex items-center justify-end">
                    <a href={selectedApplication.evaluationChecklist.reportUrl} className="text-blue-600 hover:text-blue-800 flex items-center text-sm">
                      <FileText className="h-4 w-4 mr-1" />
                      Download Evaluation Report
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Evaluation Results */}
            {selectedApplication.detailedEvaluation && (
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-medium text-indigo-800 mb-3">Detailed Assessment Results</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Risk Assessment</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedApplication.detailedEvaluation.riskAssessment === 'low' ? 'bg-green-100 text-green-700' :
                        selectedApplication.detailedEvaluation.riskAssessment === 'medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {selectedApplication.detailedEvaluation.riskAssessment}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Recommendation</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedApplication.detailedEvaluation.recommendation === 'approve' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {selectedApplication.detailedEvaluation.recommendation}
                      </span>
                    </div>
                  </div>
                  
                  {selectedApplication.detailedEvaluation.strengths && selectedApplication.detailedEvaluation.strengths.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Strengths:</p>
                      <ul className="list-disc list-inside text-sm">
                        {selectedApplication.detailedEvaluation.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {selectedApplication.detailedEvaluation.weaknesses && selectedApplication.detailedEvaluation.weaknesses.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Weaknesses:</p>
                      <ul className="list-disc list-inside text-sm">
                        {selectedApplication.detailedEvaluation.weaknesses.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <p className="text-sm"><span className="font-medium">Overall:</span> {selectedApplication.detailedEvaluation.overallAssessment}</p>
                </div>
              </div>
            )}

            {/* Final Approval Results */}
            {selectedApplication.finalApproval && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">Final Decision</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`px-2 py-1 text-sm rounded-full ${
                      selectedApplication.finalApproval.decision === 'approved' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedApplication.finalApproval.decision === 'approved' ? '✓ APPROVED' : '✗ REJECTED'}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      Decided by {selectedApplication.finalApproval.reviewedBy} on {new Date(selectedApplication.finalApproval.reviewedAt || '').toLocaleDateString()}
                    </p>
                    {selectedApplication.finalApproval.comments && (
                      <p className="text-sm mt-2">{selectedApplication.finalApproval.comments}</p>
                    )}
                  </div>
                  {selectedApplication.finalApproval.approvalLetter && (
                    <a href={selectedApplication.finalApproval.approvalLetter.url} className="text-blue-600 hover:text-blue-800 flex items-center" download>
                      <FileText className="h-4 w-4 mr-1" />
                      {selectedApplication.finalApproval.decision === 'approved' ? 'Approval Letter' : 'Rejection Letter'}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Feedback Section */}
            {selectedApplication.feedback && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Feedback</h4>
                <p className="text-sm text-yellow-700">{selectedApplication.feedback}</p>
              </div>
            )}

            {/* Status History */}
            {selectedApplication.history && selectedApplication.history.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3">Status History</h4>
                <div className="space-y-2">
                  {selectedApplication.history.map((entry, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-700">
                          <span className="font-medium">{entry.status.replace('_', ' ')}</span> by {entry.changedBy}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(entry.changedAt).toLocaleString()}
                          {entry.comments && ` - ${entry.comments}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
    }
  };

  // Render action buttons based on current step and status
  const renderActionButtons = () => {
    if (!selectedApplication) return null;

    if (currentStep !== 'view') return null;

    return (
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        {activeTab === 'applications' && selectedApplication.status === 'pending' && !selectedApplication.acknowledgementLetter && (
          <button
            onClick={() => setCurrentStep('upload')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Acknowledgement Letter
          </button>
        )}

        {activeTab === 'applications' && selectedApplication.status === 'acknowledged' && selectedApplication.acknowledgementLetter?.reviewStatus === 'pending' && (
          <button
            onClick={() => setCurrentStep('review_ack')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Review Acknowledgement Letter
          </button>
        )}

        {activeTab === 'applications' && selectedApplication.status === 'initial_evaluation' && !selectedApplication.evaluationChecklist?.completed && (
          <button
            onClick={() => {
              setCurrentStep('initial_eval');
              resetEvaluationForm();
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Complete Initial Evaluation
          </button>
        )}

        {activeTab === 'evaluation' && selectedApplication.status === 'detailed_evaluation' && !selectedApplication.detailedEvaluation?.completedAt && (
          <button
            onClick={() => {
              setCurrentStep('detailed_eval');
              if (selectedApplication.detailedEvaluation) {
                setAssessmentCriteria(selectedApplication.detailedEvaluation.assessmentCriteria);
                setStrengths(selectedApplication.detailedEvaluation.strengths || []);
                setWeaknesses(selectedApplication.detailedEvaluation.weaknesses || []);
                setRiskAssessment(selectedApplication.detailedEvaluation.riskAssessment || 'low');
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <FileSearch className="h-4 w-4 mr-2" />
            Conduct Detailed Assessment
          </button>
        )}

        {activeTab === 'approval' && selectedApplication.status === 'pending_approval' && (
          <button
            onClick={() => setCurrentStep('approval')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Make Final Decision
          </button>
        )}

        <button
          onClick={() => setSelectedApplication(null)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Assessor Management</h1>
        {userName && (
          <p className="text-gray-600 mt-1">
            Welcome, {userName} {organizationName && `- ${organizationName}`}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('applications');
              setCurrentPage(1);
              setSelectedApplication(null);
            }}
            className={`pb-4 px-1 relative ${
              activeTab === 'applications'
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            QAS Addendum Applications
            {stats.pending + stats.acknowledged + stats.initialEval > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {stats.pending + stats.acknowledged + stats.initialEval}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('evaluation');
              setCurrentPage(1);
              setSelectedApplication(null);
            }}
            className={`pb-4 px-1 relative ${
              activeTab === 'evaluation'
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            QASA Application Evaluation
            {(stats.detailedEval + stats.changesRequested) > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {stats.detailedEval + stats.changesRequested}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('approval');
              setCurrentPage(1);
              setSelectedApplication(null);
            }}
            className={`pb-4 px-1 relative ${
              activeTab === 'approval'
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            QASA Application Approval
            {stats.pendingApproval > 0 && (
              <span className="absolute -top-1 -right-2 bg-green-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {stats.pendingApproval}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-3">
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-600">Pending</p>
          <p className="text-xl font-bold text-gray-800">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-blue-500">
          <p className="text-xs text-gray-600">Acknowledged</p>
          <p className="text-xl font-bold text-gray-800">{stats.acknowledged}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-purple-500">
          <p className="text-xs text-gray-600">Initial Eval</p>
          <p className="text-xl font-bold text-gray-800">{stats.initialEval}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-indigo-500">
          <p className="text-xs text-gray-600">Detailed Eval</p>
          <p className="text-xl font-bold text-gray-800">{stats.detailedEval}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-orange-500">
          <p className="text-xs text-gray-600">Pending Approval</p>
          <p className="text-xl font-bold text-gray-800">{stats.pendingApproval}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-green-500">
          <p className="text-xs text-gray-600">Approved</p>
          <p className="text-xl font-bold text-gray-800">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-3 border-l-4 border-pink-500">
          <p className="text-xs text-gray-600">Changes</p>
          <p className="text-xl font-bold text-gray-800">{stats.changesRequested}</p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div>
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">QAS Addendum Applications</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Applications awaiting acknowledgement and initial evaluation
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search applications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">App #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                      setSelectedApplication(app);
                      setCurrentStep('view');
                    }}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {app.applicationNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{app.assessorName}</p>
                          <p className="text-xs text-gray-500">{app.assessorId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {app.qualification}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getTypeIcon(app.type)}
                          <span className="ml-2 text-sm text-gray-600">
                            {app.type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-gray-900">{app.submittedBy}</p>
                          <p className="text-xs text-gray-500">{app.submittedByOrganization}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.submittedDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(app.status)}`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApplication(app);
                            setCurrentStep('view');
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredApplications.length)} of {filteredApplications.length} applications
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Evaluation Tab */}
        {activeTab === 'evaluation' && (
          <div>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">QASA Application Evaluation</h3>
              <p className="text-sm text-gray-500 mt-1">
                Applications requiring detailed assessment and evaluation
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">App #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluator</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                      setSelectedApplication(app);
                      setCurrentStep('view');
                    }}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {app.applicationNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">{app.assessorName}</p>
                        <p className="text-xs text-gray-500">{app.assessorId}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {app.qualification}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {app.type.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.evaluator || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(app.status)}`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Approval Tab */}
        {activeTab === 'approval' && (
          <div>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">QASA Application Approval</h3>
              <p className="text-sm text-gray-500 mt-1">
                Applications ready for final approval decision
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">App #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluator</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommendation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                      setSelectedApplication(app);
                      setCurrentStep('view');
                    }}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {app.applicationNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">{app.assessorName}</p>
                        <p className="text-xs text-gray-500">{app.assessorId}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {app.qualification}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.evaluator || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {app.evaluationChecklist?.recommendation && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            app.evaluationChecklist.recommendation === 'approve' ? 'bg-green-100 text-green-700' :
                            app.evaluationChecklist.recommendation === 'reject' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {app.evaluationChecklist.recommendation.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(app.status)}`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                Application Details - {selectedApplication.applicationNumber}
              </h3>
              <button onClick={() => {
                setSelectedApplication(null);
                setCurrentStep('view');
                resetEvaluationForm();
              }} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Dynamic content based on current step */}
              {renderApplicationDetails()}

              {/* Action buttons */}
              {renderActionButtons()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Minus icon component
const Minus = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);