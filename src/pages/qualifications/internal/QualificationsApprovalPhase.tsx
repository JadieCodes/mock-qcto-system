// pages/internal/QualificationsApprovalPhase.tsx
import React, { useState, useEffect } from 'react';
import {
  Eye,
  XCircle,
  FileText,
  CheckCircle,
  Clock,
  Download,
  Calendar,
  User,
  ClipboardList,
  AlertCircle,
  MessageSquare,
  Filter,
  Search,
  Award,
  Shield,
  Upload,
  Printer,
  Edit,
  FileSignature,
  FolderOpen,
  Users,
  Building,
  Send,
  X,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Star,
  ExternalLink,
  Check,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Plus,
  Trash2
} from 'lucide-react';

// Types
interface ApprovalRecommendation {
  role: 'Deputy Director' | 'Director' | 'Chief Director' | 'CEO';
  name: string;
  recommended: boolean;
  date: string;
  comments: string;
}

interface ApprovalQualification {
  id: string;
  qualificationCode: string;
  qualificationTitle: string;
  nqfLevel: number;
  credits: number;
  submittedBy: string;
  submittedDate: string;
  status: 'pending_review' | 'under_review' | 'recommended' | 'approved' | 'registered';
  currentApprovalLevel: number;
  recommendations: ApprovalRecommendation[];
  resolutionDocument?: {
    fileName: string;
    fileUrl: string;
    resolutionNumber: string;
    issueDate: string;
    signedBy: string;
    notes: string;
    uploadDate: string;
  };
  registrationDetails?: {
    registrationNumber: string;
    registrationDate: string;
    expiryDate: string;
    saqaId: string;
    accreditingBody: string;
    registeredBy: string;
    registrationDateComplete: string;
  };
  allDocuments: {
    qualificationDocument: string;
    curriculumSpec: string;
    assessmentGuidelines: string;
    qasReport: string;
  };
  movedToApprovalDate: string;
}

interface RegisteredQualification {
  id: string;
  qualificationCode: string;
  qualificationTitle: string;
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
  approvalQualificationData: ApprovalQualification;
}

// Sample data
const getSampleApprovalQualifications = (): ApprovalQualification[] => {
  return [
    {
      id: '1',
      qualificationCode: 'ND-IT-2024',
      qualificationTitle: 'National Diploma: Information Technology',
      nqfLevel: 6,
      credits: 240,
      submittedBy: 'Dr. Sarah Johnson',
      submittedDate: '2024-03-20',
      status: 'pending_review',
      currentApprovalLevel: 0,
      movedToApprovalDate: '2024-03-21',
      recommendations: [],
      resolutionDocument: {
        fileName: 'Resolution_ND-IT-2024.pdf',
        fileUrl: '#',
        resolutionNumber: 'RES-2024-001',
        issueDate: '2024-03-19',
        signedBy: 'Dr. Sarah Johnson, Registrar',
        notes: 'Qualification approved for further processing',
        uploadDate: '2024-03-20'
      },
      allDocuments: {
        qualificationDocument: 'ND-IT-2024_Qualification_v2.1.pdf',
        curriculumSpec: 'ND-IT-2024_Curriculum_v1.5.pdf',
        assessmentGuidelines: 'ND-IT-2024_Assessment_v1.0.pdf',
        qasReport: 'ND-IT-2024_QAS_v1.0.pdf'
      }
    }
  ];
};

const getSampleRegisteredQualifications = (): RegisteredQualification[] => {
  return [
    {
      id: '1',
      qualificationCode: 'ND-IT-2024',
      qualificationTitle: 'National Diploma: Information Technology',
      nqfLevel: 6,
      credits: 240,
      registrationNumber: 'SAQA-12345-2024',
      registrationDate: '2024-03-25',
      expiryDate: '2029-03-24',
      status: 'Active',
      saqaId: '101234',
      provider: 'Multiple Providers',
      totalEnrollments: 450,
      lastUpdated: '2024-03-25',
      approvalQualificationData: {} as ApprovalQualification
    }
  ];
};

export default function QualificationsApprovalPhase() {
  const [activeTab, setActiveTab] = useState<'resolution' | 'submission' | 'registration' | 'registered'>('resolution');
  const [selectedQualification, setSelectedQualification] = useState<ApprovalQualification | null>(null);
  const [selectedRegisteredQualification, setSelectedRegisteredQualification] = useState<RegisteredQualification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isRegisteredModalOpen, setIsRegisteredModalOpen] = useState(false);
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'Deputy Director' | 'Director' | 'Chief Director' | 'CEO'>('Deputy Director');
  const [recommendationComments, setRecommendationComments] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [approvalQualifications, setApprovalQualifications] = useState<ApprovalQualification[]>([]);
  const [registeredQualifications, setRegisteredQualifications] = useState<RegisteredQualification[]>([]);
  const [registrationData, setRegistrationData] = useState({
    registrationNumber: '',
    registrationDate: '',
    expiryDate: '',
    saqaId: '',
    accreditingBody: 'CHE'
  });

  useEffect(() => {
    // Load approval qualifications from localStorage
    const storedApprovals = localStorage.getItem('approvalQualifications');
    if (storedApprovals) {
      const parsed = JSON.parse(storedApprovals);
      setApprovalQualifications(parsed);
    } else {
      setApprovalQualifications(getSampleApprovalQualifications());
      localStorage.setItem('approvalQualifications', JSON.stringify(getSampleApprovalQualifications()));
    }
    
    // Load registered qualifications
    const storedRegistered = localStorage.getItem('registeredQualifications');
    if (storedRegistered) {
      setRegisteredQualifications(JSON.parse(storedRegistered));
    } else {
      setRegisteredQualifications(getSampleRegisteredQualifications());
      localStorage.setItem('registeredQualifications', JSON.stringify(getSampleRegisteredQualifications()));
    }
  }, []);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending_review':
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Review</span>;
      case 'under_review':
        return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"><Eye className="w-3 h-3" /> Under Review</span>;
      case 'recommended':
        return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Recommended</span>;
      case 'approved':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'registered':
        return <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full flex items-center gap-1"><Award className="w-3 h-3" /> Registered</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  const getRecommendationStatus = (qualification: ApprovalQualification) => {
    const levels = ['Deputy Director', 'Director', 'Chief Director', 'CEO'];
    const currentLevel = qualification.currentApprovalLevel;
    if (currentLevel === 0) return 'Not Started';
    if (currentLevel === 4) return 'All Levels Approved';
    return `${levels[currentLevel - 1]} Completed`;
  };

  const handleViewQualification = (qualification: ApprovalQualification) => {
    setSelectedQualification(qualification);
    setIsModalOpen(true);
  };

  const handleViewRegisteredQualification = (qualification: RegisteredQualification) => {
    setSelectedRegisteredQualification(qualification);
    setIsRegisteredModalOpen(true);
  };

  const handleRecommend = () => {
    if (!selectedQualification) return;
    
    const roleOrder = ['Deputy Director', 'Director', 'Chief Director', 'CEO'];
    const currentRole = roleOrder[selectedQualification.currentApprovalLevel];
    
    const newRecommendation: ApprovalRecommendation = {
      role: currentRole as any,
      name: `User ${selectedQualification.currentApprovalLevel + 1}`,
      recommended: true,
      date: new Date().toISOString(),
      comments: recommendationComments
    };
    
    const updatedRecommendations = [...selectedQualification.recommendations, newRecommendation];
    const newApprovalLevel = selectedQualification.currentApprovalLevel + 1;
    let newStatus: ApprovalQualification['status'] = 'under_review';
    
    if (newApprovalLevel === 4) {
      newStatus = 'approved';
    } else if (newApprovalLevel > 0) {
      newStatus = 'under_review';
    }
    
    const updatedQualification = {
      ...selectedQualification,
      recommendations: updatedRecommendations,
      currentApprovalLevel: newApprovalLevel,
      status: newStatus
    };
    
    const updatedQualifications = approvalQualifications.map(q =>
      q.id === selectedQualification.id ? updatedQualification : q
    );
    
    setApprovalQualifications(updatedQualifications);
    localStorage.setItem('approvalQualifications', JSON.stringify(updatedQualifications));
    setSelectedQualification(updatedQualification);
    setIsRecommendModalOpen(false);
    setRecommendationComments('');
  };

  const handleRegisterQualification = () => {
    if (!selectedQualification) return;
    
    const newRegisteredQualification: RegisteredQualification = {
      id: selectedQualification.id,
      qualificationCode: selectedQualification.qualificationCode,
      qualificationTitle: selectedQualification.qualificationTitle,
      nqfLevel: selectedQualification.nqfLevel,
      credits: selectedQualification.credits,
      registrationNumber: registrationData.registrationNumber,
      registrationDate: registrationData.registrationDate,
      expiryDate: registrationData.expiryDate,
      status: 'Active',
      saqaId: registrationData.saqaId,
      provider: 'Multiple Providers',
      totalEnrollments: 0,
      lastUpdated: new Date().toISOString(),
      approvalQualificationData: selectedQualification
    };
    
    const updatedRegistered = [...registeredQualifications, newRegisteredQualification];
    setRegisteredQualifications(updatedRegistered);
    localStorage.setItem('registeredQualifications', JSON.stringify(updatedRegistered));
    
    // Update approval qualification status
    const updatedApprovals = approvalQualifications.map(q =>
      q.id === selectedQualification.id ? { ...q, status: 'registered' as const, registrationDetails: { ...registrationData, registeredBy: 'Internal User', registrationDateComplete: new Date().toISOString() } } : q
    );
    setApprovalQualifications(updatedApprovals);
    localStorage.setItem('approvalQualifications', JSON.stringify(updatedApprovals));
    
    // Update the public comment qualification status for external side
    const publicQualifications = localStorage.getItem('publicInputQualifications');
    if (publicQualifications) {
      const parsed = JSON.parse(publicQualifications);
      const updatedPublic = parsed.map((q: any) =>
        q.qualificationCode === selectedQualification.qualificationCode ? { ...q, status: 'registered', registered: true } : q
      );
      localStorage.setItem('publicInputQualifications', JSON.stringify(updatedPublic));
    }
    
    setIsRegistrationModalOpen(false);
    setSelectedQualification(null);
    setIsModalOpen(false);
    setRegistrationData({ registrationNumber: '', registrationDate: '', expiryDate: '', saqaId: '', accreditingBody: 'CHE' });
  };

  const handleMoveToSubmission = (qualification: ApprovalQualification) => {
    const updatedQualifications = approvalQualifications.map(q =>
      q.id === qualification.id ? { ...q, status: 'approved' as const } : q
    );
    setApprovalQualifications(updatedQualifications);
    localStorage.setItem('approvalQualifications', JSON.stringify(updatedQualifications));
    setActiveTab('submission');
  };

  const handleMoveToRegistration = (qualification: ApprovalQualification) => {
    setSelectedQualification(qualification);
    setIsRegistrationModalOpen(true);
  };

  const filteredQualifications = approvalQualifications.filter(q => {
    if (searchTerm && !q.qualificationTitle.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !q.qualificationCode.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter && q.status !== statusFilter) return false;
    return true;
  });

  const filteredRegistered = registeredQualifications.filter(q => {
    if (searchTerm && !q.qualificationTitle.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !q.qualificationCode.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const roleOrder = ['Deputy Director', 'Director', 'Chief Director', 'CEO'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Qualifications Approval Phase</h1>
          <p className="text-gray-500 mt-2">Manage the approval workflow for qualifications</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab('resolution')} className={`pb-4 px-1 relative ${activeTab === 'resolution' ? 'text-indigo-600 border-b-2 border-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            <div className="flex items-center gap-2"><FileSignature className="w-5 h-5" />Resolution Review</div>
          </button>
          <button onClick={() => setActiveTab('submission')} className={`pb-4 px-1 relative ${activeTab === 'submission' ? 'text-indigo-600 border-b-2 border-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            <div className="flex items-center gap-2"><FolderOpen className="w-5 h-5" />Submission Package Approval</div>
          </button>
          <button onClick={() => setActiveTab('registration')} className={`pb-4 px-1 relative ${activeTab === 'registration' ? 'text-indigo-600 border-b-2 border-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            <div className="flex items-center gap-2"><Shield className="w-5 h-5" />Qualification Registration</div>
          </button>
          <button onClick={() => setActiveTab('registered')} className={`pb-4 px-1 relative ${activeTab === 'registered' ? 'text-indigo-600 border-b-2 border-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            <div className="flex items-center gap-2"><Award className="w-5 h-5" />Registered Qualifications</div>
          </button>
        </nav>
      </div>

      {/* Resolution Review Tab */}
      {activeTab === 'resolution' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search qualifications..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select className="border rounded-lg px-3 py-2 text-sm min-w-[150px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending_review">Pending Review</option>
              <option value="under_review">Under Review</option>
              <option value="recommended">Recommended</option>
              <option value="approved">Approved</option>
            </select>
            <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recommendation Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredQualifications.map((qualification) => (
                    <tr key={qualification.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><div><p className="text-sm font-medium text-gray-900">{qualification.qualificationTitle}</p><p className="text-xs text-gray-500">{qualification.qualificationCode}</p></div></td>
                      <td className="px-4 py-3 text-sm">{qualification.submittedBy}</td>
                      <td className="px-4 py-3 text-sm">{qualification.submittedDate}</td>
                      <td className="px-4 py-3 text-sm">{getRecommendationStatus(qualification)}</td>
                      <td className="px-4 py-3">{getStatusBadge(qualification.status)}</td>
                      <td className="px-4 py-3"><button onClick={() => handleViewQualification(qualification)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Submission Package Approval Tab */}
      {activeTab === 'submission' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search qualifications..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" /></div>
            <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Docs Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-200">
                  {approvalQualifications.filter(q => q.status === 'approved').map((qualification) => (
                    <tr key={qualification.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><div><p className="text-sm font-medium text-gray-900">{qualification.qualificationTitle}</p><p className="text-xs text-gray-500">{qualification.qualificationCode}</p></div></td>
                      <td className="px-4 py-3 text-sm">{qualification.submittedBy}</td>
                      <td className="px-4 py-3 text-sm">{qualification.submittedDate}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">All Verified</span></td>
                      <td className="px-4 py-3">{getStatusBadge(qualification.status)}</td>
                      <td className="px-4 py-3"><button onClick={() => handleMoveToRegistration(qualification)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Register</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Qualification Registration Tab */}
      {activeTab === 'registration' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search qualifications..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" /></div>
            <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted By</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NQF Level</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-200">
                  {approvalQualifications.filter(q => q.status === 'approved').map((qualification) => (
                    <tr key={qualification.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><div><p className="text-sm font-medium text-gray-900">{qualification.qualificationTitle}</p><p className="text-xs text-gray-500">{qualification.qualificationCode}</p></div></td>
                      <td className="px-4 py-3 text-sm">{qualification.submittedBy}</td>
                      <td className="px-4 py-3">Level {qualification.nqfLevel}</td>
                      <td className="px-4 py-3">{qualification.credits}</td>
                      <td className="px-4 py-3">{getStatusBadge(qualification.status)}</td>
                      <td className="px-4 py-3"><button onClick={() => handleMoveToRegistration(qualification)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Register</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Registered Qualifications Tab */}
      {activeTab === 'registered' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Search registered qualifications..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" /></div>
            <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration #</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NQF Level</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registration Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRegistered.map((qualification) => (
                    <tr key={qualification.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><div><p className="text-sm font-medium text-gray-900">{qualification.qualificationTitle}</p><p className="text-xs text-gray-500">{qualification.qualificationCode}</p></div></td>
                      <td className="px-4 py-3 font-mono text-sm">{qualification.registrationNumber}</td>
                      <td className="px-4 py-3">Level {qualification.nqfLevel}</td>
                      <td className="px-4 py-3">{qualification.credits}</td>
                      <td className="px-4 py-3 text-sm">{qualification.registrationDate}</td>
                      <td className="px-4 py-3 text-sm">{qualification.expiryDate}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span></td>
                      <td className="px-4 py-3"><button onClick={() => handleViewRegisteredQualification(qualification)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Review Modal */}
      {isModalOpen && selectedQualification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
              <div><h3 className="text-lg font-semibold">{selectedQualification.qualificationTitle}</h3><p className="text-sm text-gray-500">Code: {selectedQualification.qualificationCode}</p></div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg"><h4 className="font-medium mb-3">Qualification Information</h4><div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-gray-500">Qualification Code</p><p className="font-medium">{selectedQualification.qualificationCode}</p></div><div><p className="text-xs text-gray-500">NQF Level</p><p className="font-medium">Level {selectedQualification.nqfLevel}</p></div><div><p className="text-xs text-gray-500">Credits</p><p className="font-medium">{selectedQualification.credits}</p></div><div><p className="text-xs text-gray-500">Submitted By</p><p className="font-medium">{selectedQualification.submittedBy}</p></div><div><p className="text-xs text-gray-500">Submitted Date</p><p className="font-medium">{selectedQualification.submittedDate}</p></div><div><p className="text-xs text-gray-500">Status</p><div>{getStatusBadge(selectedQualification.status)}</div></div></div></div>

              {selectedQualification.resolutionDocument && (<div className="bg-gray-50 p-4 rounded-lg"><h4 className="font-medium mb-3 flex items-center gap-2"><FileSignature className="w-4 h-4 text-purple-600" />Resolution Document</h4><div className="border rounded-lg p-4 bg-white"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><FileText className="w-8 h-8 text-purple-600" /><div><p className="font-medium">{selectedQualification.resolutionDocument.fileName}</p><p className="text-xs text-gray-500">Resolution #: {selectedQualification.resolutionDocument.resolutionNumber}</p><p className="text-xs text-gray-500">Issue Date: {selectedQualification.resolutionDocument.issueDate}</p><p className="text-xs text-gray-500">Signed By: {selectedQualification.resolutionDocument.signedBy}</p></div></div><button className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Download className="w-5 h-5" /></button></div></div></div>)}

              <div className="bg-gray-50 p-4 rounded-lg"><h4 className="font-medium mb-3">Recommendation Progress</h4><div className="space-y-3">{roleOrder.map((role, index) => {const isCompleted = selectedQualification.currentApprovalLevel > index;const isCurrent = selectedQualification.currentApprovalLevel === index;const recommendation = selectedQualification.recommendations.find(r => r.role === role);return (<div key={role} className={`flex items-center justify-between p-3 rounded-lg ${isCompleted ? 'bg-green-50 border border-green-200' : isCurrent ? 'bg-blue-50 border border-blue-200' : 'bg-gray-100'}`}><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-400 text-white'}`}>{index + 1}</div><div><p className="font-medium">{role}</p>{recommendation && <p className="text-xs text-gray-500">Recommended on {new Date(recommendation.date).toLocaleDateString()}</p>}</div></div>{isCompleted ? <CheckCircle className="w-5 h-5 text-green-500" /> : isCurrent && selectedQualification.status !== 'approved' && selectedQualification.status !== 'registered' ?
               (<button onClick={() => {setSelectedRole(role as 'Deputy Director' | 'Director' | 'Chief Director' | 'CEO'); setIsRecommendModalOpen(true);}} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Recommend</button>) : <Clock className="w-5 h-5 text-gray-400" />}</div>);})}</div></div>

              {selectedQualification.currentApprovalLevel === 4 && selectedQualification.status !== 'registered' && (<div className="flex gap-3"><button onClick={() => handleMoveToSubmission(selectedQualification)} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"><Send className="w-4 h-4" />Move to Submission Package Approval</button></div>)}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end"><button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Close</button></div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {isRegistrationModalOpen && selectedQualification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white"><h3 className="text-lg font-semibold">Register Qualification</h3><button onClick={() => setIsRegistrationModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label><input type="text" value={registrationData.registrationNumber} onChange={(e) => setRegistrationData({...registrationData, registrationNumber: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., SAQA-12345-2024" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Registration Date *</label><input type="date" value={registrationData.registrationDate} onChange={(e) => setRegistrationData({...registrationData, registrationDate: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label><input type="date" value={registrationData.expiryDate} onChange={(e) => setRegistrationData({...registrationData, expiryDate: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">SAQA ID *</label><input type="text" value={registrationData.saqaId} onChange={(e) => setRegistrationData({...registrationData, saqaId: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., 101234" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Accrediting Body</label><select value={registrationData.accreditingBody} onChange={(e) => setRegistrationData({...registrationData, accreditingBody: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="CHE">CHE</option><option value="QCTO">QCTO</option><option value="SAQA">SAQA</option></select></div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2"><button onClick={() => setIsRegistrationModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Cancel</button><button onClick={handleRegisterQualification} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2"><CheckCircle className="w-4 h-4" />Register Qualification</button></div>
          </div>
        </div>
      )}

      {/* Recommend Modal */}
      {isRecommendModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-xl w-full max-w-md"><div className="px-6 py-4 border-b"><h3 className="text-lg font-semibold">Recommend: {selectedRole}</h3></div><div className="p-6"><textarea value={recommendationComments} onChange={(e) => setRecommendationComments(e.target.value)} className="w-full border rounded-lg p-3 text-sm" rows={4} placeholder="Add your recommendation comments..." /></div><div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2"><button onClick={() => setIsRecommendModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Cancel</button><button onClick={handleRecommend} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2"><ThumbsUp className="w-4 h-4" />Submit Recommendation</button></div></div></div>)}

      {/* Registered Qualification Modal */}
      {isRegisteredModalOpen && selectedRegisteredQualification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-green-50 to-white">
              <div><h3 className="text-lg font-semibold">{selectedRegisteredQualification.qualificationTitle}</h3><p className="text-sm text-gray-500">Code: {selectedRegisteredQualification.qualificationCode}</p></div>
              <button onClick={() => setIsRegisteredModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg"><h4 className="font-medium mb-3">Registration Information</h4><div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-gray-500">Registration Number</p><p className="font-mono text-sm">{selectedRegisteredQualification.registrationNumber}</p></div><div><p className="text-xs text-gray-500">SAQA ID</p><p className="font-mono text-sm">{selectedRegisteredQualification.saqaId}</p></div><div><p className="text-xs text-gray-500">Registration Date</p><p className="font-medium">{selectedRegisteredQualification.registrationDate}</p></div><div><p className="text-xs text-gray-500">Expiry Date</p><p className="font-medium">{selectedRegisteredQualification.expiryDate}</p></div><div><p className="text-xs text-gray-500">NQF Level</p><p className="font-medium">Level {selectedRegisteredQualification.nqfLevel}</p></div><div><p className="text-xs text-gray-500">Credits</p><p className="font-medium">{selectedRegisteredQualification.credits}</p></div></div></div>
              <div className="bg-gray-50 p-4 rounded-lg"><h4 className="font-medium mb-3">Provider Information</h4><div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-gray-500">Provider</p><p className="font-medium">{selectedRegisteredQualification.provider}</p></div><div><p className="text-xs text-gray-500">Total Enrollments</p><p className="font-medium">{selectedRegisteredQualification.totalEnrollments}</p></div><div><p className="text-xs text-gray-500">Last Updated</p><p className="font-medium">{new Date(selectedRegisteredQualification.lastUpdated).toLocaleDateString()}</p></div></div></div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end"><button onClick={() => setIsRegisteredModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}