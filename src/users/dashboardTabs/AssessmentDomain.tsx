import React, { useState } from 'react';
import { 
  FileText, 
  Bell, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Download,
  CheckCircle,
  AlertCircle,
  Users,
  BarChart3,
  UserCheck,
  BookOpen,
  ClipboardList,
  Award,
  Menu,
  X,
  UserCog,
  Settings,
  Shield,
  Building2,
  ClipboardCheck,
  FileCheck,
  PenTool,
  Eye,
  ThumbsUp,
  Upload,
  Plus,
  Search,
  Filter,
  ChevronDown,
  XCircle,
  Info,
  Edit,
  CalendarDays,
  AlertTriangle,
  Send,
  MessageSquare
} from 'lucide-react';

// Define types for each role's data structures
type UserRole = 'student' | 'training_provider_admin' | 'assessment_center_manager' | 'individual_assessor' | 'quality_partner';

export interface DashboardProps {
  userRole: UserRole;
  userName: string;
  organizationName?: string;
}

type SiteVisit = {
  id: string;
  visitNumber: string;
  centerName: string;
  centerId: string;
  qualification: string;
  visitType: 'moderation' | 'verification' | 'monitoring';
  proposedDate: string;
  confirmedDate?: string;
  status: 'proposed' | 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  attendees: {
    name: string;
    role: string;
    organization: string;
  }[];
  documents: {
    name: string;
    type: string;
    url: string;
    uploadedBy: string;
    uploadedAt: string;
  }[];
  report?: {
    summary: string;
    findings: string[];
    recommendations: string[];
    submittedBy: string;
    submittedAt: string;
  };
  requestedBy: string;
  requestedAt: string;
  notes?: string;
};

type RPLToolkit = {
  id: string;
  toolkitNumber: string;
  qualification: string;
  saqaId: string;
  nqfLevel: number;
  version: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'changes_requested' | 'rejected';
  submissionDate: string;
  documents: {
    name: string;
    type: string;
    url: string;
  }[];
  feedback?: string;
  reviewedDate?: string;
  locked?: boolean;
};

type EISANotification = {
  id: string;
  notificationNumber: string;
  qualification: string;
  saqaId: string;
  assessmentDate: string;
  venues: {
    name: string;
    address: string;
    capacity: number;
    registeredCandidates: number;
  }[];
  totalCandidates: number;
  assessors: {
    name: string;
    id: string;
    qualification: string;
  }[];
  status: 'draft' | 'submitted' | 'acknowledged' | 'changes_requested' | 'approved';
  submissionDate: string;
  acknowledgmentDate?: string;
  feedback?: string;
  submittedBy: string;
};

type CenterReadinessSubmission = {
  id: string;
  submissionNumber: string;
  centerName: string;
  centerId: string;
  qualification: string;
  notificationId?: string;
  readinessStatus: 'pending' | 'under_review' | 'approved' | 'conditions_apply' | 'rejected';
  documents: {
    name: string;
    type: string;
    url: string;
  }[];
  siteVisitRequired: boolean;
  siteVisitDate?: string;
  readinessCertificate?: {
    number: string;
    issueDate: string;
    expiryDate: string;
    conditions?: string[];
  };
  submittedDate: string;
  reviewedDate?: string;
};

type FISAStandard = {
  id: string;
  fisaNumber: string;
  qualification: string;
  saqaId: string;
  nqfLevel: number;
  credits: number;
  version: string;
  status: 'draft' | 'published' | 'archived';
  publishedDate: string;
  expiryDate?: string;
};

type EISASubmission = {
  id: string;
  submissionNumber: string;
  fisaId: string;
  qualification: string;
  submissionDate: string;
  status: 'draft' | 'submitted' | 'completeness_check' | 'in_validation' | 'approved' | 'rejected' | 'changes_requested';
  documents: {
    name: string;
    type: string;
    url: string;
  }[];
  feedback?: string;
  reviewerNotes?: string;
  reviewedDate?: string;
  locked?: boolean;
  version: number;
  history?: ValidationHistoryEntry[];
};

type ValidationSchedule = {
  id: string;
  year: number;
  submissionDeadline: string;
  validationPeriod: string;
  publicationDate: string;
  notes: string;
  status: 'Draft' | 'Pending Approval' | 'Published' | 'Archived';
  createdBy?: string;
  approvedBy?: string;
  approvedDate?: string;
  locked?: boolean;
};

type AddendumSubmission = {
  id: string;
  applicationNumber: string;
  assessorName: string;
  assessorId: string;
  qualification: string;
  saqaId: string;
  isRegistered: boolean;
  documents: {
    name: string;
    type: string;
    uploaded: boolean;
    url?: string;
  }[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'draft';
  submittedDate: string;
  submittedBy: string;
};

type QualityPartnerAssessment = {
  date: string;
  qualification: string;
  candidates: number;
  center: string;
  status: string;
};

type CenterManagerAssessment = {
  date: string;
  qualification: string;
  candidates: number;
  assessor: string;
  status: string;
  venue: string;
};

type AssessorAssessment = {
  date: string;
  qualification: string;
  candidates: number;
  center: string;
  status: string;
  time: string;
};

type ProviderAdminAssessment = {
  date: string;
  qualification: string;
  candidates: string[] | number;
  status: string;
};

type StudentAssessment = {
  date: string;
  qualification: string;
  time: string;
  venue: string;
  address: string;
  status: string;
};

// Updated Validation Status type for external users
type ValidationStatus = 
  | 'draft'
  | 'submitted'
  | 'completeness_check'
  | 'in_validation'
  | 'changes_requested'
  | 'approved'
  | 'rejected';

type EISAValidationInstrument = {
  id: string;
  validationId: string;
  qualification: string;
  saqaId: string;
  assessmentDate: string;
  status: ValidationStatus;
  documents: {
    moderatorReport?: { name: string; url: string; uploadedAt: string };
    examinerReport?: { name: string; url: string; uploadedAt: string };
    cv?: { name: string; url: string; uploadedAt: string };
    confidentialityAgreement?: { name: string; url: string; uploadedAt: string };
    eisaInstrumentWritten?: { name: string; url: string; uploadedAt: string };
    eisaMemo?: { name: string; url: string; uploadedAt: string };
    eisaInstrumentPractical?: { name: string; url: string; uploadedAt: string };
    eisaRubric?: { name: string; url: string; uploadedAt: string };
  };
  feedback?: string;
  recommendedChanges?: string[];
  version: number;
  history: ValidationHistoryEntry[];
  locked?: boolean;
  assignedValidator?: string;
  validationDate?: string;
  liaisonMeetingDate?: string;
};

type ValidationHistoryEntry = {
  action: string;
  date: string;
  performedBy: string;
  comments?: string;
};

type Assessment = 
  | QualityPartnerAssessment 
  | CenterManagerAssessment 
  | AssessorAssessment 
  | ProviderAdminAssessment 
  | StudentAssessment;

const isCenterManagerAssessment = (assessment: Assessment): assessment is CenterManagerAssessment => {
  return 'assessor' in assessment && 'venue' in assessment;
};

const isAssessorAssessment = (assessment: Assessment): assessment is AssessorAssessment => {
  return 'center' in assessment && 'time' in assessment && !('venue' in assessment);
};

const isProviderAdminAssessment = (assessment: Assessment): assessment is ProviderAdminAssessment => {
  return 'candidates' in assessment && !('center' in assessment) && !('assessor' in assessment);
};

const isStudentAssessment = (assessment: Assessment): assessment is StudentAssessment => {
  return 'address' in assessment && 'time' in assessment && 'venue' in assessment;
};

export default function AssessmentDomain({ userRole, userName, organizationName }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // Modal state for QAS Addendum
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedQualification, setSelectedQualification] = useState('');
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [documents, setDocuments] = useState<{name: string; type: string; status: 'available' | 'pending' | 'error'; url?: string}[]>([]);
  const [addendumSubmissions, setAddendumSubmissions] = useState<AddendumSubmission[]>([
    {
      id: '1',
      applicationNumber: 'QAS-2024-001',
      assessorName: 'John Doe',
      assessorId: 'ASS-123',
      qualification: 'Electrician Level 4',
      saqaId: 'SAQA-12345',
      isRegistered: true,
      documents: [
        { name: 'Curriculum Document.pdf', type: 'pdf', uploaded: true },
        { name: 'Assessment Specification.pdf', type: 'pdf', uploaded: true },
        { name: 'SAQA Document.pdf', type: 'pdf', uploaded: true }
      ],
      status: 'pending',
      submittedDate: '2024-03-15',
      submittedBy: 'ABC Training'
    },
    {
      id: '2',
      applicationNumber: 'QAS-2024-002',
      assessorName: 'Mary Smith',
      assessorId: 'ASS-456',
      qualification: 'Plumber Level 3',
      saqaId: 'SAQA-67890',
      isRegistered: false,
      documents: [
        { name: 'Curriculum Document.pdf', type: 'pdf', uploaded: true },
        { name: 'Assessment Specification.pdf', type: 'pdf', uploaded: true }
      ],
      status: 'under_review',
      submittedDate: '2024-03-14',
      submittedBy: 'XYZ College'
    }
  ]);

  const [rplToolkits, setRplToolkits] = useState<RPLToolkit[]>([
    {
      id: '1',
      toolkitNumber: 'RPL-ELEC-001',
      qualification: 'Electrician Level 4',
      saqaId: 'SAQA-12345',
      nqfLevel: 4,
      version: '1.0',
      status: 'approved',
      submissionDate: '2024-02-15',
      documents: [
        { name: 'RPL-Candidate-Guide.pdf', type: 'pdf', url: '#' },
        { name: 'RPL-Assessor-Guide.pdf', type: 'pdf', url: '#' },
        { name: 'RPL-Practical-Tasks.pdf', type: 'pdf', url: '#' }
      ],
      locked: true
    },
    {
      id: '2',
      toolkitNumber: 'RPL-PLUMB-001',
      qualification: 'Plumber Level 3',
      saqaId: 'SAQA-67890',
      nqfLevel: 3,
      version: '1.0',
      status: 'under_review',
      submissionDate: '2024-03-10',
      documents: [
        { name: 'RPL-Candidate-Guide.pdf', type: 'pdf', url: '#' },
        { name: 'RPL-Assessor-Guide.pdf', type: 'pdf', url: '#' }
      ]
    },
    {
      id: '3',
      toolkitNumber: 'RPL-WELD-001',
      qualification: 'Welder Level 2',
      saqaId: 'SAQA-45678',
      nqfLevel: 2,
      version: '1.0',
      status: 'changes_requested',
      submissionDate: '2024-03-01',
      documents: [
        { name: 'RPL-Candidate-Guide.pdf', type: 'pdf', url: '#' },
        { name: 'RPL-Assessor-Guide.pdf', type: 'pdf', url: '#' },
        { name: 'RPL-Practical-Tasks.pdf', type: 'pdf', url: '#' }
      ],
      feedback: 'Please add evidence verification tools and update decision guidelines to include partial recognition options.'
    }
  ]);

  const [isRPLModalOpen, setIsRPLModalOpen] = useState(false);
  const [rplFormData, setRplFormData] = useState({
    qualification: '',
    candidateGuide: null as File | null,
    assessorGuide: null as File | null,
    practicalTasks: null as File | null,
    evidenceTools: null as File | null,
    decisionGuidelines: null as File | null,
    additionalDocs: null as File | null,
    notes: ''
  });

  const getApplicationsData = () => {
    switch(userRole) {
      case 'quality_partner':
        return {
          pendingAddendums: 2,
          underReview: 1,
          approved: 3,
          pendingFISA: 1,
          pendingEISA: 2
        };
      case 'assessment_center_manager':
        return {
          pendingReadiness: 1,
          pendingAddendums: 3,
          approvedCenters: 2,
          upcomingSessions: 4
        };
      case 'individual_assessor':
        return {
          pendingAddendums: 1,
          approvedQualifications: 3,
          assignedSessions: 2
        };
      case 'training_provider_admin':
        return {
          pendingRegistrations: 15,
          confirmedRegistrations: 42,
          resultsPending: 8
        };
      case 'student':
        return {
          registrationStatus: 'Confirmed',
          assessmentDate: '2024-04-15',
          documentsUploaded: 3,
          documentsRequired: 4
        };
      default:
        return {
          pending: 0,
          underReview: 0,
          approved: 0
        };
    }
  };

  const getNotifications = () => {
    switch(userRole) {
      case 'quality_partner':
        return [
          { id: 1, message: "FISA Electrician L4 validation completed", time: "2 hours ago", read: false, type: "fisa" },
          { id: 2, message: "EISA Plumbing L3 approved", time: "1 day ago", read: false, type: "eisa" },
          { id: 3, message: "Addendum requires correction", time: "2 days ago", read: true, type: "addendum" }
        ];
      case 'assessment_center_manager':
        return [
          { id: 1, message: "Center readiness verified", time: "2 hours ago", read: false, type: "readiness" },
          { id: 2, message: "New assessor addendum pending approval", time: "1 day ago", read: false, type: "assessor" },
          { id: 3, message: "EISA session confirmed for 2024-04-15", time: "2 days ago", read: true, type: "session" }
        ];
      case 'individual_assessor':
        return [
          { id: 1, message: "Assigned to Electrician L4 session", time: "2 hours ago", read: false, type: "assignment" },
          { id: 2, message: "Addendum approved", time: "1 day ago", read: false, type: "addendum" },
          { id: 3, message: "Marking schedule released", time: "2 days ago", read: true, type: "marking" }
        ];
      case 'training_provider_admin':
        return [
          { id: 1, message: "15 registrations pending approval", time: "2 hours ago", read: false, type: "registration" },
          { id: 2, message: "Results released for 8 candidates", time: "1 day ago", read: false, type: "results" },
          { id: 3, message: "Registration deadline approaching", time: "2 days ago", read: true, type: "deadline" }
        ];
      case 'student':
        return [
          { id: 1, message: "Assessment confirmed for 2024-04-15", time: "2 hours ago", read: false, type: "confirmation" },
          { id: 2, message: "Please upload outstanding documents", time: "1 day ago", read: false, type: "document" },
          { id: 3, message: "Venue details available", time: "2 days ago", read: true, type: "venue" }
        ];
      default:
        return [];
    }
  };

  const getUpcomingAssessments = (): Assessment[] => {
    switch(userRole) {
      case 'quality_partner':
        return [
          { date: "2024-04-15", qualification: "Electrician L4", candidates: 8, center: "ABC Training", status: "confirmed" },
          { date: "2024-04-16", qualification: "Plumber L3", candidates: 5, center: "XYZ College", status: "confirmed" },
          { date: "2024-04-20", qualification: "Business Mgmt L5", candidates: 20, center: "Skills Academy", status: "scheduled" }
        ];
      case 'assessment_center_manager':
        return [
          { date: "2024-04-15", qualification: "Electrician L4", candidates: 8, assessor: "T. Williams", status: "confirmed", venue: "Workshop A" },
          { date: "2024-04-16", qualification: "Plumber L3", candidates: 5, assessor: "R. Davis", status: "confirmed", venue: "Workshop B" },
          { date: "2024-04-20", qualification: "Business Mgmt L5", candidates: 20, assessor: "S. Clark", status: "scheduled", venue: "Computer Lab 3" }
        ];
      case 'individual_assessor':
        return [
          { date: "2024-04-15", qualification: "Electrician L4", candidates: 8, center: "ABC Training", status: "confirmed", time: "08:00-15:00" },
          { date: "2024-04-20", qualification: "Business Mgmt L5", candidates: 20, center: "Skills Academy", status: "scheduled", time: "09:00-12:00" }
        ];
      case 'training_provider_admin':
        return [
          { date: "2024-04-15", qualification: "Electrician L4", candidates: ["John Smith", "Mary Jones", "Peter Brown"], status: "confirmed" },
          { date: "2024-04-16", qualification: "Plumber L3", candidates: ["Susan Lee", "David Kim"], status: "confirmed" },
          { date: "2024-04-20", qualification: "Business Mgmt L5", candidates: 20, status: "scheduled" }
        ];
      case 'student':
        return [
          { date: "2024-04-15", qualification: "Electrician L4", time: "08:00-15:00", venue: "ABC Training - Workshop A", address: "123 Industrial Rd, Johannesburg", status: "confirmed" }
        ];
      default:
        return [];
    }
  };

  const getQuickStats = () => {
    switch(userRole) {
      case 'quality_partner':
        return {
          items: [
            { label: "Active Assessors", value: 12, icon: Users },
            { label: "Sessions this month", value: 3, icon: Calendar },
            { label: "Pass rate (YTD)", value: "78%", icon: TrendingUp },
            { label: "Qualifications active", value: 5, icon: Award }
          ]
        };
      case 'assessment_center_manager':
        return {
          items: [
            { label: "Registered Assessors", value: 8, icon: Users },
            { label: "Upcoming Sessions", value: 4, icon: Calendar },
            { label: "Center Capacity", value: "75%", icon: TrendingUp },
            { label: "Readiness Status", value: "Valid", icon: CheckCircle }
          ]
        };
      case 'individual_assessor':
        return {
          items: [
            { label: "Assigned Sessions", value: 2, icon: Calendar },
            { label: "Candidates to Mark", value: 28, icon: Users },
            { label: "Avg Turnaround", value: "2.3 days", icon: Clock },
            { label: "Qualifications", value: 3, icon: Award }
          ]
        };
      case 'training_provider_admin':
        return {
          items: [
            { label: "Registered Candidates", value: 42, icon: Users },
            { label: "Pending Registrations", value: 15, icon: Clock },
            { label: "Results Awaited", value: 8, icon: FileText },
            { label: "Pass Rate", value: "76%", icon: TrendingUp }
          ]
        };
      case 'student':
        return {
          items: [
            { label: "Registration Status", value: "Confirmed", icon: CheckCircle },
            { label: "Days to Assessment", value: 12, icon: Clock },
            { label: "Documents", value: "3/4", icon: FileText },
            { label: "Qualification", value: "Electrician L4", icon: Award }
          ]
        };
      default:
        return { items: [] };
    }
  };

  const getPendingActions = () => {
    switch(userRole) {
      case 'quality_partner':
        return [
          { id: 1, action: "Addendum requires correction", link: "/assessors/addendum/123", priority: "high", type: "addendum" },
          { id: 2, action: "FISA Electrician L4 feedback pending", link: "/standards/fisa/456", priority: "medium", type: "fisa" },
          { id: 3, action: "EISA Plumbing L3 resubmission", link: "/standards/eisa/789", priority: "low", type: "eisa" }
        ];
      case 'assessment_center_manager':
        return [
          { id: 1, action: "Complete readiness checklist", link: "/centers/readiness/123", priority: "high", type: "readiness" },
          { id: 2, action: "Approve 3 assessor addendums", link: "/assessors/pending", priority: "medium", type: "assessor" },
          { id: 3, action: "Allocate slots for April 15", link: "/assessments/allocate/456", priority: "high", type: "allocation" }
        ];
      case 'individual_assessor':
        return [
          { id: 1, action: "Submit addendum correction", link: "/assessors/addendum/123", priority: "medium", type: "addendum" },
          { id: 2, action: "Confirm availability for April 20", link: "/assessments/availability/456", priority: "high", type: "availability" },
          { id: 3, action: "Complete marking by Friday", link: "/marking/sessions/789", priority: "high", type: "marking" }
        ];
      case 'training_provider_admin':
        return [
          { id: 1, action: "Approve 15 registrations", link: "/registrations/pending", priority: "high", type: "registration" },
          { id: 2, action: "Upload documents for 8 candidates", link: "/registrations/documents", priority: "medium", type: "document" },
          { id: 3, action: "Confirm attendance for April 15", link: "/assessments/attendance/456", priority: "medium", type: "attendance" }
        ];
      case 'student':
        return [
          { id: 1, action: "Upload outstanding documents", link: "/candidate/documents", priority: "high", type: "document" },
          { id: 2, action: "Confirm attendance", link: "/candidate/confirm/123", priority: "medium", type: "attendance" },
          { id: 3, action: "Review candidate guide", link: "/resources/guide", priority: "low", type: "resource" }
        ];
      default:
        return [];
    }
  };

  const getRecentDocuments = () => {
    switch(userRole) {
      case 'quality_partner':
        return [
          { name: "Addendum-ELEC-001.pdf", type: "pdf", date: "2024-03-15", from: "submitted" },
          { name: "FISA-ELEC-001-v2.pdf", type: "pdf", date: "2024-03-14", from: "revision" },
          { name: "EISA-2024-045.pdf", type: "pdf", date: "2024-03-12", from: "approved" }
        ];
      case 'assessment_center_manager':
        return [
          { name: "Readiness-Cert-2024.pdf", type: "pdf", date: "2024-03-15", from: "issued" },
          { name: "Assessor-Addendum-123.pdf", type: "pdf", date: "2024-03-14", from: "submitted" },
          { name: "EISA-Schedule-April.pdf", type: "pdf", date: "2024-03-10", from: "generated" }
        ];
      case 'individual_assessor':
        return [
          { name: "Marking-Guide-ELEC.pdf", type: "pdf", date: "2024-03-15", from: "assigned" },
          { name: "Assessment-Schedule.pdf", type: "pdf", date: "2024-03-14", from: "assigned" },
          { name: "Addendum-Approval.pdf", type: "pdf", date: "2024-03-10", from: "approved" }
        ];
      case 'training_provider_admin':
        return [
          { name: "Bulk-Registration-123.xlsx", type: "xlsx", date: "2024-03-15", from: "uploaded" },
          { name: "Candidate-List-April.xlsx", type: "xlsx", date: "2024-03-14", from: "generated" },
          { name: "Results-March.pdf", type: "pdf", date: "2024-03-01", from: "released" }
        ];
      case 'student':
        return [
          { name: "RPL-Candidate-Guide.pdf", type: "pdf", date: "2024-03-15", from: "resource" },
          { name: "ID-Document.pdf", type: "pdf", date: "2024-03-10", from: "uploaded" },
          { name: "Assessment-Confirmation.pdf", type: "pdf", date: "2024-03-05", from: "received" }
        ];
      default:
        return [];
    }
  };

  const [activeTab, setActiveTab] = useState<'fisa' | 'validation-schedule' | 'eisa-validation' | 'rpl'>('fisa');
  const [selectedFISA, setSelectedFISA] = useState<string | null>(null);
  const [isEISAModalOpen, setIsEISAModalOpen] = useState(false);
  const [eisaFormData, setEisaFormData] = useState({
    fisaId: '',
    examPaper: null as File | null,
    markingGuide: null as File | null,
    practicalTasks: null as File | null,
    resourceList: null as File | null,
    notes: ''
  });
  
  // Updated EISA Submissions with new status types
  const [eisaSubmissions, setEisaSubmissions] = useState<EISASubmission[]>([
    {
      id: '1',
      submissionNumber: 'EISA-2024-045',
      fisaId: 'FISA-ELEC-001',
      qualification: 'Electrician Level 4',
      submissionDate: '2024-03-15',
      status: 'approved',
      documents: [
        { name: 'Exam-Paper-2024.pdf', type: 'pdf', url: '#' },
        { name: 'Marking-Guide-2024.pdf', type: 'pdf', url: '#' }
      ],
      locked: true,
      version: 2,
      history: [
        { action: 'Submitted', date: '2024-03-15T10:30:00', performedBy: 'ABC Training' },
        { action: 'Completeness Check', date: '2024-03-16T09:15:00', performedBy: 'ASD Admin' },
        { action: 'In Validation', date: '2024-03-17T14:20:00', performedBy: 'ASD Admin' },
        { action: 'Approved', date: '2024-03-20T11:00:00', performedBy: 'ASD Admin' }
      ]
    },
    {
      id: '2',
      submissionNumber: 'EISA-2024-046',
      fisaId: 'FISA-ELEC-001',
      qualification: 'Electrician Level 4',
      submissionDate: '2024-03-10',
      status: 'changes_requested',
      documents: [
        { name: 'Exam-Paper-v2.pdf', type: 'pdf', url: '#' },
        { name: 'Marking-Guide-v2.pdf', type: 'pdf', url: '#' }
      ],
      feedback: 'Please update Task 3 to match FISA specifications. The practical task requires 3 fault-finding scenarios, not 2.',
      version: 1,
      history: [
        { action: 'Submitted', date: '2024-03-10T11:20:00', performedBy: 'XYZ College' },
        { action: 'Completeness Check', date: '2024-03-11T10:30:00', performedBy: 'ASD Admin' },
        { action: 'Changes Requested', date: '2024-03-12T15:45:00', performedBy: 'ASD Admin', comments: 'Task 3 needs updating' }
      ]
    }
  ]);

  // View-only published schedules for external users
  const [publishedSchedules] = useState<ValidationSchedule[]>([
    {
      id: '1',
      year: 2025,
      submissionDeadline: '2024-09-30',
      validationPeriod: 'October - November 2024',
      publicationDate: '2024-11-30',
      notes: 'All EISA submissions for 2025 academic year must be submitted by this deadline.',
      status: 'Published',
      createdBy: 'ASD Admin',
      approvedBy: 'Director',
      approvedDate: '2023-11-15',
      locked: true
    },
    {
      id: '2',
      year: 2024,
      submissionDeadline: '2023-09-30',
      validationPeriod: 'October - November 2023',
      publicationDate: '2023-11-30',
      notes: 'Previous year schedule',
      status: 'Archived',
      locked: true
    }
  ]);

  const [activeQualityTab, setActiveQualityTab] = useState<'site-visits' | 'visit-history'>('site-visits');
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([
    {
      id: '1',
      visitNumber: 'VISIT-2024-001',
      centerName: 'ABC Training Center',
      centerId: 'CEN-001',
      qualification: 'Electrician Level 4',
      visitType: 'moderation',
      proposedDate: '2024-04-15',
      confirmedDate: '2024-04-15',
      status: 'scheduled',
      attendees: [
        { name: 'John Doe', role: 'Quality Partner', organization: 'ABC Training' },
        { name: 'Mary Smith', role: 'Moderator', organization: 'QCTO' }
      ],
      documents: [
        { name: 'Visit-Plan.pdf', type: 'pdf', url: '#', uploadedBy: 'John Doe', uploadedAt: '2024-03-01' }
      ],
      requestedBy: 'John Doe',
      requestedAt: '2024-02-28',
      notes: 'Moderation visit for Electrician L4 practical assessments'
    },
    {
      id: '2',
      visitNumber: 'VISIT-2024-002',
      centerName: 'XYZ College',
      centerId: 'CEN-002',
      qualification: 'Plumber Level 3',
      visitType: 'verification',
      proposedDate: '2024-04-10',
      status: 'proposed',
      attendees: [
        { name: 'Peter Jones', role: 'Quality Partner', organization: 'XYZ College' }
      ],
      documents: [],
      requestedBy: 'Peter Jones',
      requestedAt: '2024-03-01',
      notes: 'Verification of assessment center readiness'
    },
    {
      id: '3',
      visitNumber: 'VISIT-2024-003',
      centerName: 'Skills Academy',
      centerId: 'CEN-003',
      qualification: 'Business Management L5',
      visitType: 'monitoring',
      proposedDate: '2024-03-20',
      confirmedDate: '2024-03-20',
      status: 'completed',
      attendees: [
        { name: 'Susan Lee', role: 'Quality Partner', organization: 'Skills Academy' },
        { name: 'David Kim', role: 'Monitor', organization: 'QCTO' }
      ],
      documents: [
        { name: 'Visit-Plan.pdf', type: 'pdf', url: '#', uploadedBy: 'Susan Lee', uploadedAt: '2024-03-01' },
        { name: 'Monitoring-Report.pdf', type: 'pdf', url: '#', uploadedBy: 'David Kim', uploadedAt: '2024-03-25' }
      ],
      report: {
        summary: 'Site visit completed successfully. All assessment procedures are compliant.',
        findings: [
          'Assessment records are well maintained',
          'Candidate portfolios are complete',
          'Equipment calibration is up to date'
        ],
        recommendations: [
          'Improve lighting in practical workshop',
          'Update emergency evacuation plan'
        ],
        submittedBy: 'David Kim',
        submittedAt: '2024-03-25'
      },
      requestedBy: 'Susan Lee',
      requestedAt: '2024-02-15'
    }
  ]);

  const [visitFormData, setVisitFormData] = useState({
    centerName: '',
    qualification: '',
    visitType: 'moderation' as 'moderation' | 'verification' | 'monitoring',
    proposedDate: '',
    attendees: [] as { name: string; role: string; organization: string }[],
    attendeeName: '',
    attendeeRole: '',
    notes: ''
  });  

  const [fisaStandards] = useState<FISAStandard[]>([
    {
      id: '1',
      fisaNumber: 'FISA-ELEC-001',
      qualification: 'Electrician Level 4',
      saqaId: 'SAQA-12345',
      nqfLevel: 4,
      credits: 120,
      version: '2.1',
      status: 'published',
      publishedDate: '2024-01-15',
      expiryDate: '2027-01-14'
    },
    {
      id: '2',
      fisaNumber: 'FISA-PLUMB-001',
      qualification: 'Plumber Level 3',
      saqaId: 'SAQA-67890',
      nqfLevel: 3,
      credits: 90,
      version: '1.0',
      status: 'published',
      publishedDate: '2024-02-01',
      expiryDate: '2027-01-31'
    }
  ]);

  const [activeCenterTab, setActiveCenterTab] = useState<'eisa-notifications' | 'readiness-submissions'>('eisa-notifications');
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [eisaNotifications, setEisaNotifications] = useState<EISANotification[]>([
    {
      id: '1',
      notificationNumber: 'EISA-NOT-2024-001',
      qualification: 'Electrician Level 4',
      saqaId: 'SAQA-12345',
      assessmentDate: '2024-04-15',
      venues: [
        { 
          name: 'ABC Training - Workshop A', 
          address: '123 Industrial Rd, Johannesburg', 
          capacity: 8, 
          registeredCandidates: 8 
        },
        { 
          name: 'ABC Training - Workshop B', 
          address: '123 Industrial Rd, Johannesburg', 
          capacity: 6, 
          registeredCandidates: 4 
        }
      ],
      totalCandidates: 12,
      assessors: [
        { name: 'John Doe', id: 'ASS-123', qualification: 'Electrician L4' },
        { name: 'Mary Smith', id: 'ASS-456', qualification: 'Electrician L4' }
      ],
      status: 'approved',
      submissionDate: '2024-02-15',
      acknowledgmentDate: '2024-02-20',
      submittedBy: 'ABC Training'
    },
    {
      id: '2',
      notificationNumber: 'EISA-NOT-2024-002',
      qualification: 'Plumber Level 3',
      saqaId: 'SAQA-67890',
      assessmentDate: '2024-04-16',
      venues: [
        { 
          name: 'XYZ College - Workshop C', 
          address: '456 Main St, Pretoria', 
          capacity: 6, 
          registeredCandidates: 5 
        }
      ],
      totalCandidates: 5,
      assessors: [
        { name: 'Peter Jones', id: 'ASS-789', qualification: 'Plumber L3' }
      ],
      status: 'submitted',
      submissionDate: '2024-03-01',
      submittedBy: 'XYZ College'
    },
    {
      id: '3',
      notificationNumber: 'EISA-NOT-2024-003',
      qualification: 'Business Management L5',
      saqaId: 'SAQA-45678',
      assessmentDate: '2024-04-20',
      venues: [
        { 
          name: 'Skills Academy - Computer Lab', 
          address: '789 Park Ave, Cape Town', 
          capacity: 20, 
          registeredCandidates: 15 
        }
      ],
      totalCandidates: 15,
      assessors: [
        { name: 'Susan Lee', id: 'ASS-101', qualification: 'Business L5' },
        { name: 'David Kim', id: 'ASS-102', qualification: 'Business L5' }
      ],
      status: 'changes_requested',
      submissionDate: '2024-02-28',
      feedback: 'Please provide assessor qualifications and venue capacity details for the computer lab.',
      submittedBy: 'Skills Academy'
    }
  ]);

  const [notificationFormData, setNotificationFormData] = useState({
    qualification: '',
    assessmentDate: '',
    venues: [] as { name: string; address: string; capacity: number }[],
    venueName: '',
    venueAddress: '',
    venueCapacity: '',
    assessors: [] as { name: string; id: string; qualification: string }[],
    assessorName: '',
    assessorId: '',
    assessorQualification: '',
    additionalNotes: ''
  });

  const [readinessSubmissions] = useState<CenterReadinessSubmission[]>([
    {
      id: '1',
      submissionNumber: 'READY-2024-001',
      centerName: 'ABC Training',
      centerId: 'CEN-001',
      qualification: 'Electrician Level 4',
      notificationId: 'EISA-NOT-2024-001',
      readinessStatus: 'approved',
      documents: [
        { name: 'Readiness-Checklist.pdf', type: 'pdf', url: '#' },
        { name: 'Workshop-Photos.pdf', type: 'pdf', url: '#' },
        { name: 'Equipment-Inventory.xlsx', type: 'xlsx', url: '#' }
      ],
      siteVisitRequired: true,
      siteVisitDate: '2024-03-10',
      readinessCertificate: {
        number: 'RC-2024-089',
        issueDate: '2024-03-15',
        expiryDate: '2025-03-14',
        conditions: ['Improve workshop lighting within 30 days']
      },
      submittedDate: '2024-03-01',
      reviewedDate: '2024-03-15'
    },
    {
      id: '2',
      submissionNumber: 'READY-2024-002',
      centerName: 'XYZ College',
      centerId: 'CEN-002',
      qualification: 'Plumber Level 3',
      notificationId: 'EISA-NOT-2024-002',
      readinessStatus: 'under_review',
      documents: [
        { name: 'Readiness-Checklist.pdf', type: 'pdf', url: '#' },
        { name: 'Workshop-Photos.pdf', type: 'pdf', url: '#' }
      ],
      siteVisitRequired: true,
      siteVisitDate: '2024-03-25',
      submittedDate: '2024-03-10'
    }
  ]);

  // Updated Validation Instruments with new status types
  const [eisaValidationInstruments, setEisaValidationInstruments] = useState<EISAValidationInstrument[]>([
    {
      id: '1',
      validationId: 'VAL-2024-001',
      qualification: 'Electrician Level 4',
      saqaId: 'SAQA-12345',
      assessmentDate: '2024-04-15',
      status: 'approved',
      documents: {
        moderatorReport: { name: 'Moderator-Report.pdf', url: '#', uploadedAt: '2024-03-15' },
        examinerReport: { name: 'Examiner-Report.pdf', url: '#', uploadedAt: '2024-03-15' },
        cv: { name: 'CV.pdf', url: '#', uploadedAt: '2024-03-15' },
        confidentialityAgreement: { name: 'Confidentiality.pdf', url: '#', uploadedAt: '2024-03-15' },
        eisaInstrumentWritten: { name: 'EISA-Written.pdf', url: '#', uploadedAt: '2024-03-15' },
        eisaMemo: { name: 'EISA-Memo.pdf', url: '#', uploadedAt: '2024-03-15' }
      },
      version: 2,
      locked: true,
      history: [
        { action: 'Submitted', date: '2024-03-15T10:30:00', performedBy: 'ABC Training' },
        { action: 'Completeness Check', date: '2024-03-16T09:15:00', performedBy: 'ASD Admin' },
        { action: 'In Validation', date: '2024-03-17T14:20:00', performedBy: 'ASD Admin' },
        { action: 'Approved', date: '2024-03-20T11:00:00', performedBy: 'ASD Admin' }
      ]
    },
    {
      id: '2',
      validationId: 'VAL-2024-002',
      qualification: 'Plumber Level 3',
      saqaId: 'SAQA-67890',
      assessmentDate: '2024-04-16',
      status: 'changes_requested',
      documents: {
        moderatorReport: { name: 'Moderator-Report.pdf', url: '#', uploadedAt: '2024-03-14' },
        examinerReport: { name: 'Examiner-Report.pdf', url: '#', uploadedAt: '2024-03-14' },
        cv: { name: 'CV.pdf', url: '#', uploadedAt: '2024-03-14' },
        confidentialityAgreement: { name: 'Confidentiality.pdf', url: '#', uploadedAt: '2024-03-14' },
        eisaInstrumentPractical: { name: 'EISA-Practical.pdf', url: '#', uploadedAt: '2024-03-14' },
        eisaRubric: { name: 'EISA-Rubric.pdf', url: '#', uploadedAt: '2024-03-14' }
      },
      feedback: 'Practical task 2 needs clearer instructions',
      recommendedChanges: ['Update task 2 description', 'Add time allocation'],
      version: 1,
      history: [
        { action: 'Submitted', date: '2024-03-14T11:20:00', performedBy: 'XYZ College' },
        { action: 'Completeness Check', date: '2024-03-15T10:30:00', performedBy: 'ASD Admin' },
        { action: 'Changes Requested', date: '2024-03-16T15:45:00', performedBy: 'ASD Admin', comments: 'Task 2 needs updating' }
      ]
    }
  ]);

  const [isInstrumentModalOpen, setIsInstrumentModalOpen] = useState(false);
  const [selectedValidation, setSelectedValidation] = useState<EISAValidationInstrument | null>(null);
  const [instrumentFormData, setInstrumentFormData] = useState({
    qualification: '',
    assessmentDate: '',
    moderatorReport: null as File | null,
    examinerReport: null as File | null,
    cv: null as File | null,
    confidentialityAgreement: null as File | null,
    eisaInstrumentWritten: null as File | null,
    eisaMemo: null as File | null,
    eisaInstrumentPractical: null as File | null,
    eisaRubric: null as File | null,
    notes: ''
  });

  const applications = getApplicationsData();
  const notifications = getNotifications();
  const upcomingAssessments = getUpcomingAssessments();
  const quickStats = getQuickStats();
  const pendingActions = getPendingActions();
  const recentDocuments = getRecentDocuments();

  const getWelcomeMessage = () => {
    switch(userRole) {
      case 'student': return `Welcome back, ${userName}`;
      case 'training_provider_admin': return `Welcome back, ${userName} - ${organizationName || 'Training Provider'}`;
      case 'assessment_center_manager': return `Welcome back, ${userName} - ${organizationName || 'Assessment Center'}`;
      case 'individual_assessor': return `Welcome back, Assessor ${userName}`;
      case 'quality_partner': return `Welcome back, ${userName} - ${organizationName || 'Quality Partner'}`;
      default: return `Welcome back, ${userName}`;
    }
  };

  const handleQASACheck = () => {
    setIsChecking(true);
    
    setTimeout(() => {
      const isRegisteredQualification = 
        selectedQualification.includes('(REG') || 
        selectedQualification.includes('Registered') ||
        selectedQualification.includes('REG-123') ||
        selectedQualification.includes('REG-789');
      
      setIsRegistered(isRegisteredQualification);
      
      if (isRegisteredQualification) {
        setDocuments([
          { name: 'Curriculum Document.pdf', type: 'pdf', status: 'available', url: '/docs/curriculum-123.pdf' },
          { name: 'Assessment Specification.pdf', type: 'pdf', status: 'available', url: '/docs/assessment-123.pdf' },
          { name: 'SAQA Document.pdf', type: 'pdf', status: 'available', url: '/docs/saqa-123.pdf' }
        ]);
      } else {
        setDocuments([
          { name: 'Curriculum Document.pdf', type: 'pdf', status: 'available', url: '/docs/curriculum-456.pdf' },
          { name: 'Assessment Specification.pdf', type: 'pdf', status: 'available', url: '/docs/assessment-456.pdf' }
        ]);
      }
      
      setIsChecking(false);
      setCurrentStep(2);
    }, 1500);
  };

  const handleSubmitApplication = () => {
    const newSubmission: AddendumSubmission = {
      id: Date.now().toString(),
      applicationNumber: `QAS-${new Date().getFullYear()}-${String(addendumSubmissions.length + 1).padStart(3, '0')}`,
      assessorName: 'New Assessor',
      assessorId: 'ASS-NEW',
      qualification: selectedQualification,
      saqaId: selectedQualification.includes('REG') ? 'SAQA-12345' : 'Not Registered',
      isRegistered: isRegistered || false,
      documents: documents.map(doc => ({
        name: doc.name,
        type: doc.type,
        uploaded: true,
        url: doc.url
      })),
      status: 'pending',
      submittedDate: new Date().toISOString().split('T')[0],
      submittedBy: organizationName || 'Unknown'
    };

    setAddendumSubmissions([newSubmission, ...addendumSubmissions]);
    setIsModalOpen(false);
    setCurrentStep(1);
    setSelectedQualification('');
    setIsRegistered(null);
    setDocuments([]);
  };

  // Handle instrument submission (external only)
  const handleInstrumentSubmit = () => {
    const newInstrument: EISAValidationInstrument = {
      id: Date.now().toString(),
      validationId: `VAL-${new Date().getFullYear()}-${String(eisaValidationInstruments.length + 1).padStart(3, '0')}`,
      qualification: instrumentFormData.qualification,
      saqaId: 'SAQA-12345',
      assessmentDate: instrumentFormData.assessmentDate,
      status: 'submitted',
      documents: {
        moderatorReport: instrumentFormData.moderatorReport ? 
          { name: instrumentFormData.moderatorReport.name, url: URL.createObjectURL(instrumentFormData.moderatorReport), uploadedAt: new Date().toISOString() } : undefined,
        examinerReport: instrumentFormData.examinerReport ? 
          { name: instrumentFormData.examinerReport.name, url: URL.createObjectURL(instrumentFormData.examinerReport), uploadedAt: new Date().toISOString() } : undefined,
        cv: instrumentFormData.cv ? 
          { name: instrumentFormData.cv.name, url: URL.createObjectURL(instrumentFormData.cv), uploadedAt: new Date().toISOString() } : undefined,
        confidentialityAgreement: instrumentFormData.confidentialityAgreement ? 
          { name: instrumentFormData.confidentialityAgreement.name, url: URL.createObjectURL(instrumentFormData.confidentialityAgreement), uploadedAt: new Date().toISOString() } : undefined,
        eisaInstrumentWritten: instrumentFormData.eisaInstrumentWritten ? 
          { name: instrumentFormData.eisaInstrumentWritten.name, url: URL.createObjectURL(instrumentFormData.eisaInstrumentWritten), uploadedAt: new Date().toISOString() } : undefined,
        eisaMemo: instrumentFormData.eisaMemo ? 
          { name: instrumentFormData.eisaMemo.name, url: URL.createObjectURL(instrumentFormData.eisaMemo), uploadedAt: new Date().toISOString() } : undefined,
        eisaInstrumentPractical: instrumentFormData.eisaInstrumentPractical ? 
          { name: instrumentFormData.eisaInstrumentPractical.name, url: URL.createObjectURL(instrumentFormData.eisaInstrumentPractical), uploadedAt: new Date().toISOString() } : undefined,
        eisaRubric: instrumentFormData.eisaRubric ? 
          { name: instrumentFormData.eisaRubric.name, url: URL.createObjectURL(instrumentFormData.eisaRubric), uploadedAt: new Date().toISOString() } : undefined,
      },
      version: 1,
      history: [{
        action: 'Submitted',
        date: new Date().toISOString(),
        performedBy: userName || 'Quality Partner',
        comments: instrumentFormData.notes
      }]
    };

    setEisaValidationInstruments([newInstrument, ...eisaValidationInstruments]);
    setIsInstrumentModalOpen(false);
    setInstrumentFormData({
      qualification: '',
      assessmentDate: '',
      moderatorReport: null,
      examinerReport: null,
      cv: null,
      confidentialityAgreement: null,
      eisaInstrumentWritten: null,
      eisaMemo: null,
      eisaInstrumentPractical: null,
      eisaRubric: null,
      notes: ''
    });
  };

  // Handle resubmission when changes requested
  const handleResubmitInstrument = (instrumentId: string) => {
    const updatedInstruments = eisaValidationInstruments.map(instr => {
      if (instr.id === instrumentId) {
        return {
          ...instr,
          status: 'submitted' as const,
          version: instr.version + 1,
          history: [
            ...instr.history,
            {
              action: 'Resubmitted',
              date: new Date().toISOString(),
              performedBy: userName || 'Quality Partner',
              comments: 'Resubmitted with requested changes'
            }
          ]
        };
      }
      return instr;
    });
    setEisaValidationInstruments(updatedInstruments);
  };

  const renderApplications = () => {
    switch(userRole) {
      case 'quality_partner':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Pending Addendums</p>
                  <p className="text-3xl font-bold text-gray-800">{applications.pendingAddendums}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">FISA Under Review</p>
                  <p className="text-3xl font-bold text-gray-800">{applications.pendingFISA}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">EISA Approved</p>
                  <p className="text-3xl font-bold text-gray-800">{applications.pendingEISA}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
        );

      case 'assessment_center_manager':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Readiness Pending</p>
                  <p className="text-3xl font-bold text-gray-800">{applications.pendingReadiness}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Assessor Addendums</p>
                  <p className="text-3xl font-bold text-gray-800">{applications.pendingAddendums}</p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Upcoming Sessions</p>
                  <p className="text-3xl font-bold text-gray-800">{applications.upcomingSessions}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
        );

      case 'individual_assessor':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Pending Addendums</p>
                  <p className="text-3xl font-bold text-gray-800">{applications.pendingAddendums}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Active Qualifications</p>
                  <p className="text-3xl font-bold text-gray-800">{applications.approvedQualifications}</p>
                </div>
                <Award className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Assigned Sessions</p>
                  <p className="text-3xl font-bold text-gray-800">{applications.assignedSessions}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
        );

      case 'training_provider_admin':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Pending Registrations</p>
                  <p className="text-3xl font-bold text-gray-800">{applications.pendingRegistrations}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Confirmed</p>
                  <p className="text-3xl font-bold text-gray-800">{applications.confirmedRegistrations}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Results Pending</p>
                  <p className="text-3xl font-bold text-gray-800">{applications.resultsPending}</p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
        );

      case 'student':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Registration Status</p>
                <p className="text-2xl font-bold text-green-600">{applications.registrationStatus}</p>
                <p className="text-sm text-gray-600 mt-2">Assessment Date: {applications.assessmentDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Documents</p>
                <p className="text-2xl font-bold text-gray-800">{applications.documentsUploaded}/{applications.documentsRequired}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderAssessmentItem = (assessment: Assessment, index: number) => {
    return (
      <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-gray-800">{assessment.qualification}</p>
            <div className="flex items-center mt-1 text-sm text-gray-600 flex-wrap gap-2">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{assessment.date}</span>
              
              {isCenterManagerAssessment(assessment) && (
                <>
                  <Users className="h-3 w-3 ml-2 mr-1" />
                  <span>{assessment.candidates} candidates</span>
                  <UserCheck className="h-3 w-3 ml-2 mr-1" />
                  <span>Assessor: {assessment.assessor}</span>
                  <span>•</span>
                  <span>{assessment.venue}</span>
                </>
              )}
              
              {isAssessorAssessment(assessment) && (
                <>
                  <Users className="h-3 w-3 ml-2 mr-1" />
                  <span>{assessment.candidates} candidates</span>
                  <span>•</span>
                  <span>Center: {assessment.center}</span>
                  <span>•</span>
                  <span>{assessment.time}</span>
                </>
              )}
              
              {isProviderAdminAssessment(assessment) && (
                <>
                  <Users className="h-3 w-3 ml-2 mr-1" />
                  <span>
                    {typeof assessment.candidates === 'number' 
                      ? `${assessment.candidates} candidates` 
                      : `${assessment.candidates.length} candidates`}
                  </span>
                </>
              )}
              
              {isStudentAssessment(assessment) && (
                <>
                  <span>{assessment.time}</span>
                  <span>•</span>
                  <span>{assessment.venue}</span>
                  <span>•</span>
                  <span className="text-xs">{assessment.address}</span>
                </>
              )}
              
              {!isCenterManagerAssessment(assessment) && 
               !isAssessorAssessment(assessment) && 
               !isProviderAdminAssessment(assessment) && 
               !isStudentAssessment(assessment) && (
                <>
                  <Users className="h-3 w-3 ml-2 mr-1" />
                  <span>{(assessment as QualityPartnerAssessment).candidates} candidates</span>
                  <span>•</span>
                  <span>Center: {(assessment as QualityPartnerAssessment).center}</span>
                </>
              )}
            </div>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${
            assessment.status === 'confirmed' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {assessment.status}
          </span>
        </div>
      </div>
    );
  };

  const renderAddendumModal = () => {
    if (!isModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800">New QAS Addendum Application</h3>
            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
              <XCircle size={24} />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center">
                <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  }`}>
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium">Select Qualification</span>
                </div>
                <div className={`w-12 h-0.5 mx-2 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  }`}>
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">View Documents</span>
                </div>
                <div className={`w-12 h-0.5 mx-2 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 3 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  }`}>
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium">Review & Submit</span>
                </div>
              </div>
            </div>

            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Qualification
                  </label>
                  <select
                    value={selectedQualification}
                    onChange={(e) => setSelectedQualification(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a qualification...</option>
                    <option value="Electrician Level 4 (REG-123)">Electrician Level 4 (Registered)</option>
                    <option value="Electrician Level 4 (NEW-456)">Electrician Level 4 (New - Not Registered)</option>
                    <option value="Plumber Level 3 (REG-789)">Plumber Level 3 (Registered)</option>
                    <option value="Welder Level 2 (NEW-101)">Welder Level 2 (New - Not Registered)</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleQASACheck}
                    disabled={!selectedQualification || isChecking}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                  >
                    {isChecking ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Checking QASA Gate...
                      </>
                    ) : (
                      'Next'
                    )}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && isRegistered !== null && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${isRegistered ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  <p className="text-sm font-medium">
                    {isRegistered ? (
                      <span className="text-green-700">✓ Qualification is registered with SAQA</span>
                    ) : (
                      <span className="text-yellow-700">⚠ Qualification is not registered with SAQA</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    The following documents have been retrieved from the system:
                  </p>
                </div>

                <div className="space-y-3">
                  {documents.map((doc, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-700">{doc.name}</span>
                          {doc.status === 'available' && (
                            <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
                          )}
                        </div>
                        <div>
                          {doc.status === 'available' && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </a>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-7">
                        System document • Auto-populated
                      </p>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 flex items-start">
                    <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    These documents have been automatically retrieved from the system. 
                    Please review them to ensure they are correct for this application.
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Application Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Qualification:</span>
                      <span className="text-sm font-medium">{selectedQualification}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">SAQA Registration:</span>
                      <span className={`text-sm font-medium ${isRegistered ? 'text-green-600' : 'text-yellow-600'}`}>
                        {isRegistered ? 'Registered' : 'Not Registered'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Documents Retrieved:</span>
                      <span className="text-sm font-medium">{documents.length} documents</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Submitted By:</span>
                      <span className="text-sm font-medium">{organizationName || userName}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-700 mb-2">Retrieved Documents:</h5>
                  <ul className="space-y-2">
                    {documents.map((doc, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>{doc.name}</span>
                        <a href={doc.url} className="text-blue-600 ml-2 hover:underline" target="_blank" rel="noopener noreferrer">
                          (View)
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    By submitting this application, you confirm that the retrieved documents are correct 
                    and applicable to this qualification.
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitApplication}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Submit Application
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch(activeSection) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {renderApplications()}

              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-800">
                      {userRole === 'student' ? 'Your Assessment' : 'Upcoming Assessments'}
                    </h2>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {upcomingAssessments.map((assessment, index) => renderAssessmentItem(assessment, index))}
                </div>
                {userRole !== 'student' && (
                  <div className="p-4 bg-gray-50 rounded-b-lg">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View All Assessments →
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-800">Pending Actions</h2>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {pendingActions.map((action) => (
                    <div key={action.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className={`h-2 w-2 rounded-full mr-3 ${
                            action.priority === 'high' ? 'bg-red-500' : 
                            action.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <span className="text-gray-700">{action.action}</span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Take Action →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Bell className="h-5 w-5 text-gray-500 mr-2" />
                      <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
                    </div>
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {notifications.filter(n => !n.read).length} new
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`text-sm ${!notification.read ? 'font-medium' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                        </div>
                        {!notification.read && (
                          <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-gray-50 rounded-b-lg">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View All Notifications →
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 text-gray-500 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-800">Quick Stats</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {quickStats.items.map((stat, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-600">{stat.label}</span>
                      <div className="flex items-center">
                        <stat.icon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-xl font-semibold text-gray-800">{stat.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center">
                    <Download className="h-5 w-5 text-gray-500 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-800">Recent Documents</h2>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {recentDocuments.map((doc, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-700">{doc.name}</span>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 ml-6">{doc.date}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-gray-50 rounded-b-lg">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View All Documents →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'assessor':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Assessor Management</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                New QAS Addendum
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">Total Addendums</p>
                <p className="text-2xl font-bold text-gray-800">{addendumSubmissions.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-800">
                  {addendumSubmissions.filter(s => s.status === 'pending').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                <p className="text-sm text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-gray-800">
                  {addendumSubmissions.filter(s => s.status === 'under_review').length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-800">
                  {addendumSubmissions.filter(s => s.status === 'approved').length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">QAS Addendum Applications</h3>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search applications..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <Filter className="h-4 w-4 text-gray-600" />
                    </button>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SAQA ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {addendumSubmissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {submission.applicationNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{submission.assessorName}</p>
                            <p className="text-xs text-gray-500">{submission.assessorId}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {submission.qualification}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${submission.isRegistered ? 'text-green-600' : 'text-yellow-600'}`}>
                            {submission.saqaId}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            {submission.documents.map((doc, idx) => (
                              <div key={idx} className="relative group">
                                <FileText className="h-4 w-4 text-gray-400 hover:text-blue-600 cursor-pointer" />
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                  {doc.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            submission.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            submission.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                            submission.status === 'approved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {submission.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {submission.submittedDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button className="text-blue-600 hover:text-blue-800">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {addendumSubmissions.length} applications
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    1
                  </button>
                  <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'standards':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Standards Management</h2>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">
                  Quality Partner: {organizationName || 'Your Organization'}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">EISA Validation Schedule 2025</p>
                  <p className="text-sm text-blue-600 mt-1">
                    EISA schedule is prepared annually in September for the subsequent academic year 
                    and published on the QCTO website by November. This guides the validation process.
                  </p>
                  <p className="text-xs text-blue-500 mt-2">
                    Next deadline: 30 September 2024 for 2025 academic year EISAs
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
               
                
                {/* View-only Validation Schedule for External Users */}
                <button
                  onClick={() => setActiveTab('validation-schedule')}
                  className={`pb-4 px-1 relative ${
                    activeTab === 'validation-schedule'
                      ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  EISA Validation Schedule
                </button>

                {/* EISA Validation Management - Unified view */}
                <button
                  onClick={() => setActiveTab('eisa-validation')}
                  className={`pb-4 px-1 relative ${
                    activeTab === 'eisa-validation'
                      ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  EISA Validation
                  {eisaValidationInstruments.filter(v => v.status === 'submitted' || v.status === 'changes_requested').length > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {eisaValidationInstruments.filter(v => v.status === 'submitted' || v.status === 'changes_requested').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('rpl')}
                  className={`pb-4 px-1 relative ${
                    activeTab === 'rpl'
                      ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  RPL Toolkit Evaluation
                </button>
              </nav>
            </div>

          

            {/* View-only Validation Schedule for External Users */}
            {activeTab === 'validation-schedule' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">EISA Validation Schedule</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    The EISA Validation Schedule is published annually by QCTO. You may view the current schedule below.
                  </p>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Important Note</p>
                      <p className="text-sm text-amber-700 mt-1">
                        EISA schedule is prepared annually in September for the subsequent academic year 
                        and published on the QCTO website by November. This schedule is final and cannot be modified.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Year Schedule - Published Only */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-800">Current Published Schedule</h4>
                  </div>
                  <div className="p-6">
                    {publishedSchedules.filter(s => s.status === 'Published').map((schedule) => (
                      <div key={schedule.id} className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-sm font-medium text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
                              {schedule.year} Academic Year
                            </span>
                          </div>
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Published</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-white p-4 rounded-lg">
                            <p className="text-xs text-gray-500">Submission Deadline</p>
                            <p className="text-lg font-semibold text-gray-800">{schedule.submissionDeadline}</p>
                          </div>
                          <div className="bg-white p-4 rounded-lg">
                            <p className="text-xs text-gray-500">Validation Period</p>
                            <p className="text-lg font-semibold text-gray-800">{schedule.validationPeriod}</p>
                          </div>
                          <div className="bg-white p-4 rounded-lg">
                            <p className="text-xs text-gray-500">Publication Date</p>
                            <p className="text-lg font-semibold text-gray-800">{schedule.publicationDate}</p>
                          </div>
                        </div>
                        
                        <div className="bg-amber-50 p-3 rounded-lg">
                          <p className="text-sm text-amber-700">{schedule.notes}</p>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
                            <Eye className="h-4 w-4 inline mr-1" />
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Archived Schedules */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-800">Previous Schedules</h4>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {publishedSchedules.filter(s => s.status === 'Archived').map((schedule) => (
                      <div key={schedule.id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium text-gray-800">{schedule.year} Schedule</span>
                            <p className="text-sm text-gray-500 mt-1">
                              Deadline: {schedule.submissionDeadline} | Published: {schedule.publicationDate}
                            </p>
                          </div>
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            View Archive
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Unified EISA Validation Management */}
            {activeTab === 'eisa-validation' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">EISA Validation Management</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Submit and track EISA instruments for validation
                    </p>
                  </div>
                  <button
                    onClick={() => setIsInstrumentModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                    disabled={eisaValidationInstruments.some(i => i.locked)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Submit for Validation
                  </button>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Validation Status Guide</p>
                      <ul className="text-sm text-blue-600 mt-1 list-disc list-inside">
                        <li><span className="font-medium">Submitted:</span> Awaiting completeness check</li>
                        <li><span className="font-medium">Completeness Check:</span> Under initial review</li>
                        <li><span className="font-medium">In Validation:</span> Being validated by ASD</li>
                        <li><span className="font-medium">Changes Requested:</span> Action required from you</li>
                        <li><span className="font-medium">Approved:</span> Validation complete - locked</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Status Tabs for better organization */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-4">
                    {(['all', 'submitted', 'changes_requested', 'approved'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {/* Add filter state if needed */}}
                        className={`pb-2 px-1 text-sm ${
                          filter === 'all' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500'
                        }`}
                      >
                        {filter === 'all' ? 'All' : filter.replace('_', ' ')}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Instruments Table */}
                <div className="bg-white rounded-lg shadow">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validation #</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">History</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {eisaValidationInstruments.map((instrument) => (
                          <tr key={instrument.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {instrument.validationId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {instrument.qualification}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {instrument.assessmentDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-1">
                                {Object.entries(instrument.documents).map(([key, value]) => value && (
                                  <div key={key} className="relative group">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              v{instrument.version}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                instrument.status === 'approved' ? 'bg-green-100 text-green-700' :
                                instrument.status === 'in_validation' ? 'bg-purple-100 text-purple-700' :
                                instrument.status === 'completeness_check' ? 'bg-blue-100 text-blue-700' :
                                instrument.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                                instrument.status === 'changes_requested' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {instrument.status.replace('_', ' ')}
                              </span>
                              {instrument.locked && (
                                <span className="ml-1 text-xs text-gray-400">🔒</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <div className="relative group">
                                <span className="text-blue-600 cursor-help">📋</span>
                                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition z-10">
                                  {instrument.history.slice(-2).map((h, i) => (
                                    <p key={i}>{h.action} - {new Date(h.date).toLocaleDateString()}</p>
                                  ))}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button 
                                onClick={() => setSelectedValidation(instrument)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="h-4 w-4 inline mr-1" />
                                View
                              </button>
                              {instrument.status === 'changes_requested' && !instrument.locked && (
                                <button 
                                  onClick={() => handleResubmitInstrument(instrument.id)}
                                  className="ml-3 text-orange-600 hover:text-orange-800"
                                >
                                  <Upload className="h-4 w-4 inline mr-1" />
                                  Resubmit
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {eisaValidationInstruments.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                              No validation submissions yet. Click "Submit for Validation" to start.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rpl' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">RPL Toolkit Evaluation</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Submit and track Recognition of Prior Learning (RPL) toolkits for evaluation
                    </p>
                  </div>
                  <button
                    onClick={() => setIsRPLModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Submit RPL Toolkit
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">Total Submissions</p>
                    <p className="text-2xl font-bold text-gray-800">{rplToolkits.length}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                    <p className="text-sm text-gray-600">Pending Review</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {rplToolkits.filter(t => t.status === 'submitted' || t.status === 'under_review').length}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {rplToolkits.filter(t => t.status === 'approved').length}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                    <p className="text-sm text-gray-600">Changes Requested</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {rplToolkits.filter(t => t.status === 'changes_requested').length}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">About RPL Toolkit Evaluation</p>
                      <p className="text-sm text-blue-600 mt-1">
                        RPL toolkits are used to assess candidates with prior learning and experience. 
                        Submit your toolkit for evaluation against the qualification standards. 
                        Approved toolkits will be published for use by assessment centers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toolkit #</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SAQA ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NQF Level</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rplToolkits.map((toolkit) => (
                          <tr key={toolkit.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {toolkit.toolkitNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {toolkit.qualification}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {toolkit.saqaId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              Level {toolkit.nqfLevel}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              v{toolkit.version}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {toolkit.submissionDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-1">
                                {toolkit.documents.map((doc, idx) => (
                                  <a
                                    key={idx}
                                    href={doc.url}
                                    className="text-blue-600 hover:text-blue-800 relative group"
                                    title={doc.name}
                                  >
                                    <FileText className="h-4 w-4" />
                                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                                      {doc.name}
                                    </span>
                                  </a>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                toolkit.status === 'approved' ? 'bg-green-100 text-green-700' :
                                toolkit.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                                toolkit.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                                toolkit.status === 'changes_requested' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {toolkit.status.replace('_', ' ')}
                              </span>
                              {toolkit.locked && (
                                <span className="ml-1 text-xs text-gray-400">🔒</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                              {toolkit.feedback && (
                                <div className="relative group">
                                  <span className="text-orange-600 cursor-help flex items-center">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    View feedback
                                  </span>
                                  <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition z-10">
                                    {toolkit.feedback}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button className="text-blue-600 hover:text-blue-800 mr-3">
                                <Eye className="h-4 w-4" />
                              </button>
                              {toolkit.status === 'changes_requested' && !toolkit.locked && (
                                <button 
                                  onClick={() => {
                                    setIsRPLModalOpen(true);
                                  }}
                                  className="text-orange-600 hover:text-orange-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {rplToolkits.length} RPL toolkits
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                        Previous
                      </button>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                        1
                      </button>
                      <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                {isRPLModalOpen && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-800">Submit RPL Toolkit for Evaluation</h3>
                        <button onClick={() => setIsRPLModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <XCircle size={24} />
                        </button>
                      </div>

                      <div className="p-6">
                        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                          <p className="text-sm text-yellow-700 flex items-start">
                            <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            Please upload all required components of the RPL toolkit. Incomplete submissions may be returned.
                          </p>
                        </div>

                        <form onSubmit={(e) => {
                          e.preventDefault();
                          
                          const newToolkit: RPLToolkit = {
                            id: Date.now().toString(),
                            toolkitNumber: `RPL-${rplFormData.qualification.substring(0, 4)}-${String(rplToolkits.length + 1).padStart(3, '0')}`,
                            qualification: rplFormData.qualification,
                            saqaId: 'SAQA-12345',
                            nqfLevel: 4,
                            version: '1.0',
                            status: 'submitted',
                            submissionDate: new Date().toISOString().split('T')[0],
                            documents: [
                              ...(rplFormData.candidateGuide ? [{ name: rplFormData.candidateGuide.name, type: 'pdf', url: URL.createObjectURL(rplFormData.candidateGuide) }] : []),
                              ...(rplFormData.assessorGuide ? [{ name: rplFormData.assessorGuide.name, type: 'pdf', url: URL.createObjectURL(rplFormData.assessorGuide) }] : []),
                              ...(rplFormData.practicalTasks ? [{ name: rplFormData.practicalTasks.name, type: 'pdf', url: URL.createObjectURL(rplFormData.practicalTasks) }] : []),
                              ...(rplFormData.evidenceTools ? [{ name: rplFormData.evidenceTools.name, type: rplFormData.evidenceTools.type, url: URL.createObjectURL(rplFormData.evidenceTools) }] : []),
                              ...(rplFormData.decisionGuidelines ? [{ name: rplFormData.decisionGuidelines.name, type: 'pdf', url: URL.createObjectURL(rplFormData.decisionGuidelines) }] : []),
                              ...(rplFormData.additionalDocs ? [{ name: rplFormData.additionalDocs.name, type: rplFormData.additionalDocs.type, url: URL.createObjectURL(rplFormData.additionalDocs) }] : [])
                            ]
                          };

                          setRplToolkits([newToolkit, ...rplToolkits]);
                          setIsRPLModalOpen(false);
                          setRplFormData({
                            qualification: '',
                            candidateGuide: null,
                            assessorGuide: null,
                            practicalTasks: null,
                            evidenceTools: null,
                            decisionGuidelines: null,
                            additionalDocs: null,
                            notes: ''
                          });
                        }} className="space-y-4">
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Qualification <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={rplFormData.qualification}
                              onChange={(e) => setRplFormData({...rplFormData, qualification: e.target.value})}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            >
                              <option value="">Select Qualification...</option>
                              <option value="Electrician Level 4">Electrician Level 4</option>
                              <option value="Plumber Level 3">Plumber Level 3</option>
                              <option value="Welder Level 2">Welder Level 2</option>
                              <option value="Business Management L5">Business Management L5</option>
                              <option value="IT Technician L4">IT Technician L4</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Candidate Guide <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setRplFormData({...rplFormData, candidateGuide: e.target.files?.[0] || null})}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                required
                              />
                              <p className="text-xs text-gray-400 mt-1">Guide for candidates explaining RPL process</p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assessor Guide <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setRplFormData({...rplFormData, assessorGuide: e.target.files?.[0] || null})}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                required
                              />
                              <p className="text-xs text-gray-400 mt-1">Instructions for assessors conducting RPL</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Practical Tasks
                              </label>
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setRplFormData({...rplFormData, practicalTasks: e.target.files?.[0] || null})}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                              />
                              <p className="text-xs text-gray-400 mt-1">Practical assessment tasks (if applicable)</p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Evidence Verification Tools
                              </label>
                              <input
                                type="file"
                                accept=".pdf,.xlsx,.xls"
                                onChange={(e) => setRplFormData({...rplFormData, evidenceTools: e.target.files?.[0] || null})}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                              />
                              <p className="text-xs text-gray-400 mt-1">Checklists, templates for evidence verification</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Decision Guidelines
                              </label>
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setRplFormData({...rplFormData, decisionGuidelines: e.target.files?.[0] || null})}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                              />
                              <p className="text-xs text-gray-400 mt-1">Pass/fail criteria, partial recognition rules</p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Documents
                              </label>
                              <input
                                type="file"
                                onChange={(e) => setRplFormData({...rplFormData, additionalDocs: e.target.files?.[0] || null})}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                              />
                              <p className="text-xs text-gray-400 mt-1">Any other supporting documents</p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Additional Notes
                            </label>
                            <textarea
                              rows={3}
                              value={rplFormData.notes}
                              onChange={(e) => setRplFormData({...rplFormData, notes: e.target.value})}
                              placeholder="Any additional information for the evaluator..."
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 flex items-start">
                              <Info className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                              Your toolkit will be evaluated against the qualification requirements. 
                              You will be notified when feedback is available.
                            </p>
                          </div>

                          <div className="flex justify-end space-x-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setIsRPLModalOpen(false)}
                              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Submit for Evaluation
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'centers':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Center Management</h2>
              <button
                onClick={() => setIsNotificationModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit EISA Notification
              </button>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">EISA Notification Submission</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Submit EISA notifications on the Quality Partner Portfolio (QCTO Web Portal) to inform 
                    QCTO about upcoming assessments. This must be done before candidates can be registered.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveCenterTab('eisa-notifications')}
                  className={`pb-4 px-1 relative ${
                    activeCenterTab === 'eisa-notifications'
                      ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  EISA Notifications
                  {eisaNotifications.filter(n => n.status === 'submitted').length > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {eisaNotifications.filter(n => n.status === 'submitted').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveCenterTab('readiness-submissions')}
                  className={`pb-4 px-1 relative ${
                    activeCenterTab === 'readiness-submissions'
                      ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Readiness Submissions
                </button>
              </nav>
            </div>

            {activeCenterTab === 'eisa-notifications' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">Total Notifications</p>
                    <p className="text-2xl font-bold text-gray-800">{eisaNotifications.length}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {eisaNotifications.filter(n => n.status === 'submitted').length}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {eisaNotifications.filter(n => n.status === 'approved').length}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                    <p className="text-sm text-gray-600">Changes Requested</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {eisaNotifications.filter(n => n.status === 'changes_requested').length}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">EISA Notifications</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Notifications submitted to QCTO about upcoming EISA assessments
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notification #</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venues</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidates</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessors</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {eisaNotifications.map((notification) => (
                          <tr key={notification.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {notification.notificationNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              <div>
                                {notification.qualification}
                                <div className="text-xs text-gray-500">{notification.saqaId}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {notification.assessmentDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-1">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-700">{notification.venues.length}</span>
                                <div className="relative group ml-1">
                                  <Info className="h-3 w-3 text-gray-400 cursor-help" />
                                  <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition z-10">
                                    {notification.venues.map(v => `${v.name} (${v.registeredCandidates}/${v.capacity})`).join(', ')}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {notification.totalCandidates}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-1">
                                <UserCheck className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-700">{notification.assessors.length}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                notification.status === 'approved' ? 'bg-green-100 text-green-700' :
                                notification.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                                notification.status === 'acknowledged' ? 'bg-blue-100 text-blue-700' :
                                notification.status === 'changes_requested' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {notification.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {notification.submissionDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button className="text-blue-600 hover:text-blue-800 mr-3">
                                <Eye className="h-4 w-4" />
                              </button>
                              {notification.status === 'changes_requested' && (
                                <button 
                                  onClick={() => {
                                    setIsNotificationModalOpen(true);
                                  }}
                                  className="text-orange-600 hover:text-orange-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeCenterTab === 'readiness-submissions' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Center Readiness Submissions</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Track readiness submissions linked to your EISA notifications
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submission #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Visit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {readinessSubmissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {submission.submissionNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{submission.centerName}</p>
                              <p className="text-xs text-gray-500">{submission.centerId}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {submission.qualification}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              {submission.documents.map((doc, idx) => (
                                <a
                                  key={idx}
                                  href={doc.url}
                                  className="text-blue-600 hover:text-blue-800 relative group"
                                  title={doc.name}
                                >
                                  <FileText className="h-4 w-4" />
                                </a>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {submission.siteVisitRequired ? (
                              <div>
                                <span className="text-orange-600">Required</span>
                                {submission.siteVisitDate && (
                                  <div className="text-xs text-gray-400">{submission.siteVisitDate}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-green-600">Not Required</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              submission.readinessStatus === 'approved' ? 'bg-green-100 text-green-700' :
                              submission.readinessStatus === 'under_review' ? 'bg-blue-100 text-blue-700' :
                              submission.readinessStatus === 'conditions_apply' ? 'bg-orange-100 text-orange-700' :
                              submission.readinessStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {submission.readinessStatus.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {submission.readinessCertificate ? (
                              <div className="relative group">
                                <span className="text-green-600 cursor-help flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Issued
                                </span>
                                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition z-10">
                                  <p>Cert: {submission.readinessCertificate.number}</p>
                                  <p>Expires: {submission.readinessCertificate.expiryDate}</p>
                                  {submission.readinessCertificate.conditions && (
                                    <p className="text-yellow-300 mt-1">Conditions apply</p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Pending</span>
                            )}
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
        );

      case 'quality':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Quality Assurance</h2>
              <button
                onClick={() => setIsVisitModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Request Site Visit
              </button>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Site Visit Planning & Moderation</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Schedule and manage site visits for moderation, verification, and monitoring of assessments. 
                    Site visits are an essential part of quality assurance.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveQualityTab('site-visits')}
                  className={`pb-4 px-1 relative ${
                    activeQualityTab === 'site-visits'
                      ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upcoming Site Visits
                  {siteVisits.filter(v => v.status === 'proposed' || v.status === 'scheduled').length > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {siteVisits.filter(v => v.status === 'proposed' || v.status === 'scheduled').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveQualityTab('visit-history')}
                  className={`pb-4 px-1 relative ${
                    activeQualityTab === 'visit-history'
                      ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Visit History
                </button>
              </nav>
            </div>

            {activeQualityTab === 'site-visits' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">Proposed Visits</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {siteVisits.filter(v => v.status === 'proposed').length}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                    <p className="text-sm text-gray-600">Scheduled</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {siteVisits.filter(v => v.status === 'scheduled').length}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                    <p className="text-sm text-gray-600">Completed (This Month)</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {siteVisits.filter(v => v.status === 'completed' && v.confirmedDate?.startsWith('2024-03')).length}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {siteVisits
                    .filter(v => v.status === 'proposed' || v.status === 'scheduled')
                    .map((visit) => (
                      <div key={visit.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {visit.visitNumber}
                              </span>
                              <h4 className="font-medium text-gray-800 mt-2">{visit.centerName}</h4>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              visit.status === 'scheduled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {visit.status}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-600">
                              <BookOpen className="h-4 w-4 mr-2 text-gray-400" />
                              {visit.qualification}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              {visit.confirmedDate || visit.proposedDate}
                              {!visit.confirmedDate && <span className="text-xs text-gray-400 ml-2">(proposed)</span>}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <UserCheck className="h-4 w-4 mr-2 text-gray-400" />
                              {visit.attendees.length} attendee{visit.attendees.length !== 1 ? 's' : ''}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              {visit.documents.map((doc, idx) => (
                                <a
                                  key={idx}
                                  href={doc.url}
                                  className="text-blue-600 hover:text-blue-800 relative group"
                                  title={doc.name}
                                >
                                  <FileText className="h-4 w-4" />
                                </a>
                              ))}
                            </div>
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-800 text-sm">
                                <Eye className="h-4 w-4" />
                              </button>
                              {visit.status === 'proposed' && (
                                <button className="text-orange-600 hover:text-orange-800 text-sm">
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {visit.notes && (
                            <p className="text-xs text-gray-500 mt-2 italic">
                              {visit.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                  {siteVisits.filter(v => v.status === 'proposed' || v.status === 'scheduled').length === 0 && (
                    <div className="col-span-2 bg-gray-50 rounded-lg p-8 text-center">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No upcoming site visits</p>
                      <button
                        onClick={() => setIsVisitModalOpen(true)}
                        className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Request a site visit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeQualityTab === 'visit-history' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Site Visit History</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Past site visits and completed moderation reports
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Center</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {siteVisits
                        .filter(v => v.status === 'completed')
                        .map((visit) => (
                          <tr key={visit.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {visit.visitNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {visit.centerName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {visit.qualification}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                visit.visitType === 'moderation' ? 'bg-purple-100 text-purple-700' :
                                visit.visitType === 'verification' ? 'bg-blue-100 text-blue-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {visit.visitType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {visit.confirmedDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-1">
                                {visit.documents.map((doc, idx) => (
                                  <a
                                    key={idx}
                                    href={doc.url}
                                    className="text-blue-600 hover:text-blue-800 relative group"
                                    title={doc.name}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </a>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                              {visit.report ? (
                                <div className="relative group">
                                  <span className="text-green-600 cursor-help flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Available
                                  </span>
                                  <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition z-10">
                                    <p className="font-medium mb-1">Findings:</p>
                                    <ul className="list-disc pl-4">
                                      {visit.report.findings.slice(0, 2).map((f, i) => (
                                        <li key={i}>{f}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">Pending</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button className="text-blue-600 hover:text-blue-800">
                                <Eye className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}

                      {siteVisits.filter(v => v.status === 'completed').length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                            No completed site visits yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 ease-in-out`}>
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className={`font-bold text-gray-800 ${!sidebarOpen && 'hidden'}`}>Assessment</h2>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded hover:bg-gray-100">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${
              activeSection === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            <BarChart3 size={20} />
            <span className={`ml-3 ${!sidebarOpen && 'hidden'}`}>Dashboard</span>
          </button>

          <div className="pt-4 pb-2">
            <p className={`text-xs font-semibold text-gray-400 uppercase ${!sidebarOpen && 'text-center'}`}>
              {sidebarOpen ? 'Main Sections' : '•••'}
            </p>
          </div>

          <button
            onClick={() => setActiveSection('assessor')}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${
              activeSection === 'assessor' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            <UserCog size={20} />
            <span className={`ml-3 ${!sidebarOpen && 'hidden'}`}>ASSESSOR MANAGEMENT</span>
          </button>

          <button
            onClick={() => setActiveSection('standards')}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${
              activeSection === 'standards' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            <BookOpen size={20} />
            <span className={`ml-3 ${!sidebarOpen && 'hidden'}`}>STANDARDS MANAGEMENT</span>
          </button>

          <button
            onClick={() => setActiveSection('centers')}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${
              activeSection === 'centers' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            <Building2 size={20} />
            <span className={`ml-3 ${!sidebarOpen && 'hidden'}`}>CENTER MANAGEMENT</span>
          </button>

          <button
            onClick={() => setActiveSection('quality')}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${
              activeSection === 'quality' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            <Shield size={20} />
            <span className={`ml-3 ${!sidebarOpen && 'hidden'}`}>QUALITY ASSURANCE</span>
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Assessment Domain</h1>
            <p className="text-gray-600">{getWelcomeMessage()}</p>
          </div>

          {renderContent()}
        </div>
      </div>

      {renderAddendumModal()}

      {/* Submit for Validation Modal */}
      {isInstrumentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Submit EISA Instrument for Validation</h3>
              <button onClick={() => setIsInstrumentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-yellow-700 flex items-start">
                  <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  Submit all required documents for validation against the QAS Addendum. 
                  Both written and practical components must be included.
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleInstrumentSubmit();
              }} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qualification <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={instrumentFormData.qualification}
                      onChange={(e) => setInstrumentFormData({...instrumentFormData, qualification: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Qualification...</option>
                      <option value="Electrician Level 4">Electrician Level 4</option>
                      <option value="Plumber Level 3">Plumber Level 3</option>
                      <option value="Welder Level 2">Welder Level 2</option>
                      <option value="Business Management L5">Business Management L5</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assessment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={instrumentFormData.assessmentDate}
                      onChange={(e) => setInstrumentFormData({...instrumentFormData, assessmentDate: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Required Documents</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Moderator Report <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setInstrumentFormData({...instrumentFormData, moderatorReport: e.target.files?.[0] || null})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Examiner Report <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setInstrumentFormData({...instrumentFormData, examinerReport: e.target.files?.[0] || null})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CV of Examiner/Moderator <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setInstrumentFormData({...instrumentFormData, cv: e.target.files?.[0] || null})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confidentiality Agreement <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setInstrumentFormData({...instrumentFormData, confidentialityAgreement: e.target.files?.[0] || null})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Written Component (if applicable)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        EISA Instrument (Written)
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setInstrumentFormData({...instrumentFormData, eisaInstrumentWritten: e.target.files?.[0] || null})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        EISA Memo
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setInstrumentFormData({...instrumentFormData, eisaMemo: e.target.files?.[0] || null})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Practical Component (if applicable)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        EISA Instrument (Practical)
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setInstrumentFormData({...instrumentFormData, eisaInstrumentPractical: e.target.files?.[0] || null})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        EISA Rubric
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setInstrumentFormData({...instrumentFormData, eisaRubric: e.target.files?.[0] || null})}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    value={instrumentFormData.notes}
                    onChange={(e) => setInstrumentFormData({...instrumentFormData, notes: e.target.value})}
                    placeholder="Any additional information for the validator..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsInstrumentModalOpen(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit for Validation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EISA Submission Modal */}
      {isEISAModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Submit EISA for Validation</h3>
              <button onClick={() => setIsEISAModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-yellow-700 flex items-start">
                  <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  Ensure your EISA documents align with the FISA standard requirements before submission.
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                setIsEISAModalOpen(false);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    FISA Standard
                  </label>
                  <select
                    value={eisaFormData.fisaId}
                    onChange={(e) => setEisaFormData({...eisaFormData, fisaId: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select FISA Standard...</option>
                    {fisaStandards.map(fisa => (
                      <option key={fisa.id} value={fisa.id}>
                        {fisa.fisaNumber} - {fisa.qualification} v{fisa.version}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Paper (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setEisaFormData({...eisaFormData, examPaper: e.target.files?.[0] || null})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marking Guide (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setEisaFormData({...eisaFormData, markingGuide: e.target.files?.[0] || null})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Practical Tasks (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setEisaFormData({...eisaFormData, practicalTasks: e.target.files?.[0] || null})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resource List (Excel/PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls"
                    onChange={(e) => setEisaFormData({...eisaFormData, resourceList: e.target.files?.[0] || null})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    value={eisaFormData.notes}
                    onChange={(e) => setEisaFormData({...eisaFormData, notes: e.target.value})}
                    placeholder="Any additional information for the validator..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEISAModalOpen(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit for Validation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Request Site Visit Modal */}
      {isVisitModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Request Site Visit</h3>
              <button onClick={() => setIsVisitModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-yellow-700 flex items-start">
                  <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  Request a site visit for moderation, verification, or monitoring purposes. 
                  QCTO will confirm the date and assign attendees.
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                
                const newVisit: SiteVisit = {
                  id: Date.now().toString(),
                  visitNumber: `VISIT-${new Date().getFullYear()}-${String(siteVisits.length + 1).padStart(3, '0')}`,
                  centerName: visitFormData.centerName,
                  centerId: 'CEN-XXX',
                  qualification: visitFormData.qualification,
                  visitType: visitFormData.visitType,
                  proposedDate: visitFormData.proposedDate,
                  status: 'proposed',
                  attendees: [
                    { name: userName, role: 'Quality Partner', organization: organizationName || '' },
                    ...visitFormData.attendees
                  ],
                  documents: [],
                  requestedBy: userName,
                  requestedAt: new Date().toISOString().split('T')[0],
                  notes: visitFormData.notes
                };

                setSiteVisits([newVisit, ...siteVisits]);
                setIsVisitModalOpen(false);
                setVisitFormData({
                  centerName: '',
                  qualification: '',
                  visitType: 'moderation',
                  proposedDate: '',
                  attendees: [],
                  attendeeName: '',
                  attendeeRole: '',
                  notes: ''
                });
              }} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Center Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={visitFormData.centerName}
                      onChange={(e) => setVisitFormData({...visitFormData, centerName: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qualification <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={visitFormData.qualification}
                      onChange={(e) => setVisitFormData({...visitFormData, qualification: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Qualification...</option>
                      <option value="Electrician Level 4">Electrician Level 4</option>
                      <option value="Plumber Level 3">Plumber Level 3</option>
                      <option value="Welder Level 2">Welder Level 2</option>
                      <option value="Business Management L5">Business Management L5</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Visit Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={visitFormData.visitType}
                      onChange={(e) => setVisitFormData({...visitFormData, visitType: e.target.value as any})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="moderation">Moderation</option>
                      <option value="verification">Verification</option>
                      <option value="monitoring">Monitoring</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proposed Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={visitFormData.proposedDate}
                      onChange={(e) => setVisitFormData({...visitFormData, proposedDate: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Additional Attendees (Optional)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Name"
                      value={visitFormData.attendeeName}
                      onChange={(e) => setVisitFormData({...visitFormData, attendeeName: e.target.value})}
                      className="p-2 border border-gray-300 rounded-lg"
                    />
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Role"
                        value={visitFormData.attendeeRole}
                        onChange={(e) => setVisitFormData({...visitFormData, attendeeRole: e.target.value})}
                        className="flex-1 p-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (visitFormData.attendeeName && visitFormData.attendeeRole) {
                            setVisitFormData({
                              ...visitFormData,
                              attendees: [
                                ...visitFormData.attendees,
                                {
                                  name: visitFormData.attendeeName,
                                  role: visitFormData.attendeeRole,
                                  organization: visitFormData.centerName || 'External'
                                }
                              ],
                              attendeeName: '',
                              attendeeRole: ''
                            });
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {visitFormData.attendees.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {visitFormData.attendees.map((attendee, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center">
                            <UserCheck className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm">{attendee.name} - {attendee.role}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newAttendees = [...visitFormData.attendees];
                              newAttendees.splice(index, 1);
                              setVisitFormData({...visitFormData, attendees: newAttendees});
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    value={visitFormData.notes}
                    onChange={(e) => setVisitFormData({...visitFormData, notes: e.target.value})}
                    placeholder="Any specific requirements or information for the visit..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 flex items-start">
                    <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    Your request will be reviewed by QCTO. You will be notified when the visit is confirmed 
                    or if more information is needed.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsVisitModalOpen(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Submit EISA Notification Modal */}
      {isNotificationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Submit EISA Notification</h3>
              <button onClick={() => setIsNotificationModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-yellow-700 flex items-start">
                  <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  Submit this notification to inform QCTO about your upcoming EISA assessment. 
                  This must be done before candidates can be registered.
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                
                const newNotification: EISANotification = {
                  id: Date.now().toString(),
                  notificationNumber: `EISA-NOT-${new Date().getFullYear()}-${String(eisaNotifications.length + 1).padStart(3, '0')}`,
                  qualification: notificationFormData.qualification,
                  saqaId: 'SAQA-12345',
                  assessmentDate: notificationFormData.assessmentDate,
                  venues: notificationFormData.venues.map(v => ({
                    ...v,
                    registeredCandidates: 0
                  })),
                  totalCandidates: 0,
                  assessors: notificationFormData.assessors,
                  status: 'submitted',
                  submissionDate: new Date().toISOString().split('T')[0],
                  submittedBy: organizationName || userName
                };

                setEisaNotifications([newNotification, ...eisaNotifications]);
                setIsNotificationModalOpen(false);
                setNotificationFormData({
                  qualification: '',
                  assessmentDate: '',
                  venues: [],
                  venueName: '',
                  venueAddress: '',
                  venueCapacity: '',
                  assessors: [],
                  assessorName: '',
                  assessorId: '',
                  assessorQualification: '',
                  additionalNotes: ''
                });
              }} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qualification <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={notificationFormData.qualification}
                      onChange={(e) => setNotificationFormData({...notificationFormData, qualification: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Qualification...</option>
                      <option value="Electrician Level 4">Electrician Level 4</option>
                      <option value="Plumber Level 3">Plumber Level 3</option>
                      <option value="Welder Level 2">Welder Level 2</option>
                      <option value="Business Management L5">Business Management L5</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assessment Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={notificationFormData.assessmentDate}
                      onChange={(e) => setNotificationFormData({...notificationFormData, assessmentDate: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Assessment Venues</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Venue Name"
                      value={notificationFormData.venueName}
                      onChange={(e) => setNotificationFormData({...notificationFormData, venueName: e.target.value})}
                      className="p-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={notificationFormData.venueAddress}
                      onChange={(e) => setNotificationFormData({...notificationFormData, venueAddress: e.target.value})}
                      className="p-2 border border-gray-300 rounded-lg"
                    />
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Capacity"
                        value={notificationFormData.venueCapacity}
                        onChange={(e) => setNotificationFormData({...notificationFormData, venueCapacity: e.target.value})}
                        className="w-24 p-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (notificationFormData.venueName && notificationFormData.venueAddress && notificationFormData.venueCapacity) {
                            setNotificationFormData({
                              ...notificationFormData,
                              venues: [
                                ...notificationFormData.venues,
                                {
                                  name: notificationFormData.venueName,
                                  address: notificationFormData.venueAddress,
                                  capacity: parseInt(notificationFormData.venueCapacity)
                                }
                              ],
                              venueName: '',
                              venueAddress: '',
                              venueCapacity: ''
                            });
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {notificationFormData.venues.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {notificationFormData.venues.map((venue, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm">{venue.name} - {venue.address} (Capacity: {venue.capacity})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newVenues = [...notificationFormData.venues];
                              newVenues.splice(index, 1);
                              setNotificationFormData({...notificationFormData, venues: newVenues});
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">Assessors</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Assessor Name"
                      value={notificationFormData.assessorName}
                      onChange={(e) => setNotificationFormData({...notificationFormData, assessorName: e.target.value})}
                      className="p-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Assessor ID"
                      value={notificationFormData.assessorId}
                      onChange={(e) => setNotificationFormData({...notificationFormData, assessorId: e.target.value})}
                      className="p-2 border border-gray-300 rounded-lg"
                    />
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Qualification"
                        value={notificationFormData.assessorQualification}
                        onChange={(e) => setNotificationFormData({...notificationFormData, assessorQualification: e.target.value})}
                        className="flex-1 p-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (notificationFormData.assessorName && notificationFormData.assessorId && notificationFormData.assessorQualification) {
                            setNotificationFormData({
                              ...notificationFormData,
                              assessors: [
                                ...notificationFormData.assessors,
                                {
                                  name: notificationFormData.assessorName,
                                  id: notificationFormData.assessorId,
                                  qualification: notificationFormData.assessorQualification
                                }
                              ],
                              assessorName: '',
                              assessorId: '',
                              assessorQualification: ''
                            });
                          }
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {notificationFormData.assessors.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {notificationFormData.assessors.map((assessor, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex items-center">
                            <UserCheck className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm">{assessor.name} ({assessor.id}) - {assessor.qualification}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newAssessors = [...notificationFormData.assessors];
                              newAssessors.splice(index, 1);
                              setNotificationFormData({...notificationFormData, assessors: newAssessors});
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notificationFormData.additionalNotes}
                    onChange={(e) => setNotificationFormData({...notificationFormData, additionalNotes: e.target.value})}
                    placeholder="Any additional information for QCTO..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 flex items-start">
                    <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    After submission, QCTO will acknowledge receipt and may request changes. 
                    Once approved, candidates can be registered for this assessment.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsNotificationModalOpen(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Notification
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}