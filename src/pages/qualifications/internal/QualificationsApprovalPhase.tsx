import React, { useState } from 'react';
import { 
  Eye, 
  XCircle, 
  BarChart3,
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Download, 
  Calendar, 
  MapPin, 
  User,
  GitBranch,
  ClipboardList,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Filter,
  Search,
  Award,
  BookOpen,
  GraduationCap,
  Globe,
  Shield,
  Upload,
  Printer,
  Mail,
  Plus,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  FileCheck,
  FileSignature,
  FolderOpen,
  Archive,
  Star,
  TrendingUp,
  Users,
  Building,
  Phone,
  Mail as MailIcon,
  Check,
  X,
  HelpCircle
} from 'lucide-react';

// Types
interface Resolution {
  id: string;
  resolutionNumber: string;
  title: string;
  meetingDate: string;
  effectiveDate: string;
  status: 'Draft' | 'Approved' | 'Implemented' | 'Archived';
  qualificationCodes: string[];
  approvedBy: string;
  notes: string;
}

interface SubmissionPackage {
  id: string;
  qualificationTitle: string;
  qualificationCode: string;
  submittedBy: string;
  submissionDate: string;
  documents: {
    name: string;
    status: 'Pending' | 'Verified' | 'Rejected';
    version: string;
  }[];
  status: 'Pending Review' | 'In Review' | 'Approved' | 'Rejected' | 'Returned';
  priority: 'High' | 'Medium' | 'Low';
  comments: number;
}

interface QualificationRegistration {
  id: string;
  qualificationTitle: string;
  qualificationCode: string;
  nqfLevel: number;
  credits: number;
  registrationNumber: string;
  registrationDate: string;
  expiryDate: string;
  status: 'Active' | 'Pending' | 'Expiring' | 'Expired';
  accreditingBody: string;
  saqaId: string;
}

interface RegisteredQualification {
  id: string;
  qualificationTitle: string;
  qualificationCode: string;
  nqfLevel: number;
  credits: number;
  registrationNumber: string;
  registrationDate: string;
  expiryDate: string;
  status: 'Active' | 'Expiring' | 'Expired';
  saqaId: string;
  provider: string;
  totalEnrollments: number;
  lastUpdated: string;
}

export default function QualificationsApprovalPhase() {
  const [activeTab, setActiveTab] = useState<'resolution' | 'submission' | 'registration' | 'registered'>('resolution');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Sample Data
  const resolutions: Resolution[] = [
    {
      id: '1',
      resolutionNumber: 'RES-2024-001',
      title: 'Approval of National Diploma: Information Technology',
      meetingDate: '2024-03-15',
      effectiveDate: '2024-04-01',
      status: 'Approved',
      qualificationCodes: ['ND-IT-2024'],
      approvedBy: 'Academic Board',
      notes: 'Approved with minor conditions'
    },
    {
      id: '2',
      resolutionNumber: 'RES-2024-002',
      title: 'Amendment to Bachelor of Engineering: Electrical',
      meetingDate: '2024-03-10',
      effectiveDate: '2024-03-15',
      status: 'Implemented',
      qualificationCodes: ['BE-ELEC-2024'],
      approvedBy: 'Senate',
      notes: 'Curriculum updates approved'
    },
    {
      id: '3',
      resolutionNumber: 'RES-2024-003',
      title: 'New Certificate: Project Management',
      meetingDate: '2024-03-20',
      effectiveDate: '2024-04-15',
      status: 'Draft',
      qualificationCodes: ['CERT-PM-2024'],
      approvedBy: 'Curriculum Committee',
      notes: 'Under review'
    }
  ];

  const submissionPackages: SubmissionPackage[] = [
    {
      id: '1',
      qualificationTitle: 'National Diploma: Information Technology',
      qualificationCode: 'ND-IT-2024',
      submittedBy: 'Dr. Sarah Johnson',
      submissionDate: '2024-03-15',
      documents: [
        { name: 'Qualification Document', status: 'Verified', version: 'v2.1' },
        { name: 'Curriculum Specification', status: 'Verified', version: 'v1.5' },
        { name: 'Assessment Guidelines', status: 'Pending', version: 'v1.0' },
        { name: 'QAS Report', status: 'Verified', version: 'v1.0' }
      ],
      status: 'In Review',
      priority: 'High',
      comments: 5
    },
    {
      id: '2',
      qualificationTitle: 'Bachelor of Engineering: Electrical',
      qualificationCode: 'BE-ELEC-2024',
      submittedBy: 'Prof. Michael Chen',
      submissionDate: '2024-03-14',
      documents: [
        { name: 'Qualification Document', status: 'Verified', version: 'v3.0' },
        { name: 'Curriculum Specification', status: 'Verified', version: 'v2.2' },
        { name: 'Assessment Guidelines', status: 'Verified', version: 'v1.8' },
        { name: 'QAS Report', status: 'Verified', version: 'v1.2' }
      ],
      status: 'Approved',
      priority: 'Medium',
      comments: 2
    },
    {
      id: '3',
      qualificationTitle: 'Certificate: Project Management',
      qualificationCode: 'CERT-PM-2024',
      submittedBy: 'Ms. Lisa Williams',
      submissionDate: '2024-03-10',
      documents: [
        { name: 'Qualification Document', status: 'Verified', version: 'v1.0' },
        { name: 'Curriculum Specification', status: 'Rejected', version: 'v0.9' },
        { name: 'Assessment Guidelines', status: 'Pending', version: 'v0.5' }
      ],
      status: 'Returned',
      priority: 'Low',
      comments: 8
    }
  ];

  const registrations: QualificationRegistration[] = [
    {
      id: '1',
      qualificationTitle: 'National Diploma: Information Technology',
      qualificationCode: 'ND-IT-2024',
      nqfLevel: 6,
      credits: 240,
      registrationNumber: 'SAQA-12345-2024',
      registrationDate: '2024-03-01',
      expiryDate: '2029-02-28',
      status: 'Active',
      accreditingBody: 'CHE',
      saqaId: '101234'
    },
    {
      id: '2',
      qualificationTitle: 'Bachelor of Engineering: Electrical',
      qualificationCode: 'BE-ELEC-2024',
      nqfLevel: 7,
      credits: 360,
      registrationNumber: 'SAQA-12346-2024',
      registrationDate: '2024-02-15',
      expiryDate: '2024-12-31',
      status: 'Expiring',
      accreditingBody: 'CHE',
      saqaId: '101235'
    },
    {
      id: '3',
      qualificationTitle: 'Certificate: Project Management',
      qualificationCode: 'CERT-PM-2024',
      nqfLevel: 5,
      credits: 120,
      registrationNumber: 'SAQA-12347-2024',
      registrationDate: '2024-03-10',
      expiryDate: '2029-03-09',
      status: 'Pending',
      accreditingBody: 'QCTO',
      saqaId: '101236'
    }
  ];

  const registeredQualifications: RegisteredQualification[] = [
    {
      id: '1',
      qualificationTitle: 'National Diploma: Information Technology',
      qualificationCode: 'ND-IT-2024',
      nqfLevel: 6,
      credits: 240,
      registrationNumber: 'SAQA-12345-2024',
      registrationDate: '2024-03-01',
      expiryDate: '2029-02-28',
      status: 'Active',
      saqaId: '101234',
      provider: 'Multiple Providers',
      totalEnrollments: 450,
      lastUpdated: '2024-03-15'
    },
    {
      id: '2',
      qualificationTitle: 'Bachelor of Engineering: Electrical',
      qualificationCode: 'BE-ELEC-2024',
      nqfLevel: 7,
      credits: 360,
      registrationNumber: 'SAQA-12346-2024',
      registrationDate: '2024-02-15',
      expiryDate: '2024-12-31',
      status: 'Expiring',
      saqaId: '101235',
      provider: 'University of Technology',
      totalEnrollments: 180,
      lastUpdated: '2024-03-14'
    },
    {
      id: '3',
      qualificationTitle: 'Certificate: Project Management',
      qualificationCode: 'CERT-PM-2024',
      nqfLevel: 5,
      credits: 120,
      registrationNumber: 'SAQA-12347-2024',
      registrationDate: '2024-03-10',
      expiryDate: '2029-03-09',
      status: 'Active',
      saqaId: '101236',
      provider: 'Business School',
      totalEnrollments: 320,
      lastUpdated: '2024-03-16'
    }
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Approved':
      case 'Active':
      case 'Verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Review':
      case 'Pending':
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Implemented':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Rejected':
      case 'Expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Returned':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Expiring':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Qualifications Approval Phase</h1>
          <p className="text-gray-500 mt-2">
            Manage the approval workflow for qualifications
          </p>
        </div>
        <div className="flex gap-2">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Pending Approvals
          </button>
          <button className="border px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Approval History
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('resolution')}
            className={`pb-4 px-1 relative ${
              activeTab === 'resolution'
                ? 'text-indigo-600 border-b-2 border-indigo-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileSignature className="w-5 h-5" />
              Resolution Review
            </div>
          </button>
          <button
            onClick={() => setActiveTab('submission')}
            className={`pb-4 px-1 relative ${
              activeTab === 'submission'
                ? 'text-indigo-600 border-b-2 border-indigo-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Submission Package Approval
            </div>
          </button>
          <button
            onClick={() => setActiveTab('registration')}
            className={`pb-4 px-1 relative ${
              activeTab === 'registration'
                ? 'text-indigo-600 border-b-2 border-indigo-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Qualification Registration
            </div>
          </button>
          <button
            onClick={() => setActiveTab('registered')}
            className={`pb-4 px-1 relative ${
              activeTab === 'registered'
                ? 'text-indigo-600 border-b-2 border-indigo-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Registered Qualifications
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'resolution' && (
          <ResolutionReview 
            resolutions={resolutions}
            getStatusColor={getStatusColor}
          />
        )}
        {activeTab === 'submission' && (
          <SubmissionPackageApproval 
            submissions={submissionPackages}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
          />
        )}
        {activeTab === 'registration' && (
          <QualificationRegistration 
            registrations={registrations}
            getStatusColor={getStatusColor}
          />
        )}
        {activeTab === 'registered' && (
          <RegisteredQualifications 
            qualifications={registeredQualifications}
            getStatusColor={getStatusColor}
          />
        )}
      </div>
    </div>
  );
}

// Resolution Review Component
function ResolutionReview({ resolutions, getStatusColor }: any) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Resolutions</p>
              <p className="text-2xl font-bold text-gray-900">{resolutions.length}</p>
            </div>
            <FileSignature className="w-10 h-10 text-indigo-500 opacity-75" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Draft</p>
              <p className="text-2xl font-bold text-gray-900">
                {resolutions.filter((r: Resolution) => r.status === 'Draft').length}
              </p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500 opacity-75" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {resolutions.filter((r: Resolution) => r.status === 'Approved').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500 opacity-75" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Implemented</p>
              <p className="text-2xl font-bold text-gray-900">
                {resolutions.filter((r: Resolution) => r.status === 'Implemented').length}
              </p>
            </div>
            <ThumbsUp className="w-10 h-10 text-blue-500 opacity-75" />
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search resolutions..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <Filter className="w-5 h-5" />
          Filter
        </button>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Resolution
        </button>
      </div>

      {/* Resolutions Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Resolution #</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Title</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Meeting Date</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Effective Date</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Approved By</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {resolutions.map((resolution: Resolution) => (
                <tr key={resolution.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-indigo-600">
                    {resolution.resolutionNumber}
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{resolution.title}</p>
                      <p className="text-sm text-gray-500">
                        {resolution.qualificationCodes.join(', ')}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm">{resolution.meetingDate}</td>
                  <td className="py-4 px-6 text-sm">{resolution.effectiveDate}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(resolution.status)}`}>
                      {resolution.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm">{resolution.approvedBy}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button className="p-1 hover:bg-gray-100 rounded" title="View">
                        <Eye className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Edit">
                        <Edit className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Download">
                        <Download className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Print">
                        <Printer className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Timeline */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Resolution Timeline</h3>
        <div className="space-y-4">
          {resolutions.slice(0, 3).map((resolution: Resolution, index: number) => (
            <div key={resolution.id} className="flex items-start gap-4">
              <div className="relative">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <FileSignature className="w-4 h-4 text-indigo-600" />
                </div>
                {index < 2 && (
                  <div className="absolute top-8 left-4 w-0.5 h-12 bg-gray-200"></div>
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium">{resolution.resolutionNumber}</p>
                <p className="text-sm text-gray-600">{resolution.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Meeting: {resolution.meetingDate} • Effective: {resolution.effectiveDate}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(resolution.status)}`}>
                {resolution.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Submission Package Approval Component
function SubmissionPackageApproval({ submissions, getStatusColor, getPriorityColor }: any) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
            </div>
            <FolderOpen className="w-10 h-10 text-indigo-500 opacity-75" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">
                {submissions.filter((s: SubmissionPackage) => s.status === 'Pending Review').length}
              </p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500 opacity-75" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {submissions.filter((s: SubmissionPackage) => s.status === 'Approved').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500 opacity-75" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">
                {submissions.filter((s: SubmissionPackage) => s.priority === 'High').length}
              </p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-500 opacity-75" />
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search submissions..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <Filter className="w-5 h-5" />
          Filter
        </button>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          Start Review
        </button>
      </div>

      {/* Submissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {submissions.map((submission: SubmissionPackage) => (
          <div key={submission.id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{submission.qualificationTitle}</h3>
                <p className="text-sm text-gray-500">Code: {submission.qualificationCode}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
                  {submission.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(submission.priority)}`}>
                  {submission.priority}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {submission.submittedBy}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {submission.submissionDate}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {submission.comments} comments
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">Documents ({submission.documents.length})</p>
              <div className="space-y-2">
                {submission.documents.map((doc: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>{doc.name}</span>
                      <span className="text-xs text-gray-400">v{doc.version}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
              <button className="p-2 hover:bg-gray-100 rounded" title="View Details">
                <Eye className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded" title="Download All">
                <Download className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded" title="Add Comment">
                <MessageSquare className="w-5 h-5 text-gray-600" />
              </button>
              <button className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">
                Approve
              </button>
              <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Qualification Registration Component
function QualificationRegistration({ registrations, getStatusColor }: any) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Registrations</p>
              <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
            </div>
            <Shield className="w-10 h-10 text-indigo-500 opacity-75" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {registrations.filter((r: QualificationRegistration) => r.status === 'Active').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500 opacity-75" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">
                {registrations.filter((r: QualificationRegistration) => r.status === 'Expiring').length}
              </p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500 opacity-75" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {registrations.filter((r: QualificationRegistration) => r.status === 'Pending').length}
              </p>
            </div>
            <AlertCircle className="w-10 h-10 text-orange-500 opacity-75" />
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search registrations..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <Filter className="w-5 h-5" />
          Filter
        </button>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Register New
        </button>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Qualification</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">NQF Level</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Credits</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Registration #</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Registration Date</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Expiry Date</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">SAQA ID</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {registrations.map((registration: QualificationRegistration) => (
                <tr key={registration.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{registration.qualificationTitle}</p>
                      <p className="text-sm text-gray-500">{registration.qualificationCode}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">Level {registration.nqfLevel}</td>
                  <td className="py-4 px-6">{registration.credits}</td>
                  <td className="py-4 px-6 font-mono text-sm">{registration.registrationNumber}</td>
                  <td className="py-4 px-6 text-sm">{registration.registrationDate}</td>
                  <td className="py-4 px-6 text-sm">{registration.expiryDate}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(registration.status)}`}>
                      {registration.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono text-sm">{registration.saqaId}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button className="p-1 hover:bg-gray-100 rounded" title="View">
                        <Eye className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Edit">
                        <Edit className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Renew">
                        <Clock className="w-5 h-5 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Certificate">
                        <Award className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Renewal Calendar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Upcoming Renewals</h3>
        <div className="space-y-3">
          {registrations
            .filter((r: QualificationRegistration) => r.status === 'Expiring')
            .map((registration: QualificationRegistration) => (
              <div key={registration.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-gray-900">{registration.qualificationTitle}</p>
                    <p className="text-sm text-gray-600">Expires: {registration.expiryDate}</p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
                  Renew Now
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Registered Qualifications Component
function RegisteredQualifications({ qualifications, getStatusColor }: any) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Registered</p>
              <p className="text-2xl font-bold text-gray-900">{qualifications.length}</p>
            </div>
            <Award className="w-10 h-10 text-indigo-500 opacity-75" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {qualifications.filter((q: RegisteredQualification) => q.status === 'Active').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500 opacity-75" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expiring</p>
              <p className="text-2xl font-bold text-gray-900">
                {qualifications.filter((q: RegisteredQualification) => q.status === 'Expiring').length}
              </p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500 opacity-75" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Enrollments</p>
              <p className="text-2xl font-bold text-gray-900">
                {qualifications.reduce((acc: number, q: RegisteredQualification) => acc + q.totalEnrollments, 0)}
              </p>
            </div>
            <Users className="w-10 h-10 text-blue-500 opacity-75" />
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search registered qualifications..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <Filter className="w-5 h-5" />
          Filter
        </button>
        <div className="flex gap-2">
          <button className="border px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export
          </button>
          <button className="border px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Print
          </button>
        </div>
      </div>

      {/* Qualifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {qualifications.map((qualification: RegisteredQualification) => (
          <div key={qualification.id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{qualification.qualificationTitle}</h3>
                <p className="text-sm text-gray-500">Code: {qualification.qualificationCode}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(qualification.status)}`}>
                {qualification.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-500">NQF Level</p>
                <p className="font-medium">Level {qualification.nqfLevel}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Credits</p>
                <p className="font-medium">{qualification.credits}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">SAQA ID</p>
                <p className="font-medium font-mono">{qualification.saqaId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Registration #</p>
                <p className="font-medium text-sm">{qualification.registrationNumber}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm border-t pt-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Reg: {qualification.registrationDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>Exp: {qualification.expiryDate}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{qualification.totalEnrollments} enrolled</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{qualification.provider}</span>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded" title="View Details">
                  <Eye className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded" title="View Providers">
                  <Building className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded" title="Download Certificate">
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded" title="Share">
                  <ExternalLink className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h4 className="font-medium mb-3">By NQF Level</h4>
          <div className="space-y-2">
            {[5, 6, 7, 8].map(level => (
              <div key={level} className="flex items-center justify-between">
                <span className="text-sm">Level {level}</span>
                <span className="font-medium">
                  {qualifications.filter((q: RegisteredQualification) => q.nqfLevel === level).length}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h4 className="font-medium mb-3">By Provider Type</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">University</span>
              <span className="font-medium">2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">University of Technology</span>
              <span className="font-medium">1</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Business School</span>
              <span className="font-medium">1</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h4 className="font-medium mb-3">Registration Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Active</span>
              <span className="font-medium text-green-600">
                {qualifications.filter((q: RegisteredQualification) => q.status === 'Active').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Expiring in 90 days</span>
              <span className="font-medium text-yellow-600">
                {qualifications.filter((q: RegisteredQualification) => q.status === 'Expiring').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}