// pages/internal/PublicInputDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Eye,
  XCircle,
  BarChart3,
  FileText,
  CheckCircle,
  Clock,
  Download,
  Calendar,
  Users,
  ClipboardList,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Filter,
  Search,
  ChevronRight,
  ChevronLeft,
  Star,
  Award,
  User,
  RefreshCw,
  Upload,
  Paperclip,
  Printer,
  MoreVertical,
  TrendingUp,
  Edit,
  Trash2,
  Send,
  X,
  Plus,
  FileSignature,
  FolderOpen,
  Shield
} from 'lucide-react';

// Types
interface PublicComment {
  id: string;
  commentNumber: string;
  submitterName: string;
  submitterEmail: string;
  organization?: string;
  commentDate: string;
  comment: string;
  attachments?: string[];
  status: 'pending' | 'reviewed' | 'forwarded' | 'ignored';
  source: 'email' | 'webform' | 'letter' | 'meeting';
  reviewedBy?: string;
  reviewDate?: string;
  response?: string;
}

interface QualificationForPublicInput {
  id: string;
  qualificationCode: string;
  qualificationTitle: string;
  qualificationLevel: number;
  credits: number;
  submittedBy: string;
  submittedDate: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'forwarded';
  comments: PublicComment[];
  resolutionDocument?: {
    fileName: string;
    fileUrl: string;
    uploadDate: string;
    resolutionNumber: string;
  };
  allPhasesCompleted: boolean;
}

// Sample data
const getSampleQualifications = (): QualificationForPublicInput[] => {
  return [
    {
      id: '1',
      qualificationCode: 'ND-IT-2024',
      qualificationTitle: 'National Diploma: Information Technology',
      qualificationLevel: 6,
      credits: 240,
      submittedBy: 'Dr. Sarah Johnson',
      submittedDate: '2024-03-20',
      status: 'pending',
      allPhasesCompleted: true,
      comments: [
        {
          id: 'c1',
          commentNumber: 'PUB-2403-001',
          submitterName: 'John Smith',
          submitterEmail: 'john.smith@email.com',
          commentDate: '2024-03-21',
          comment: 'The curriculum should include more emphasis on agile project management methodologies.',
          status: 'pending',
          source: 'webform'
        },
        {
          id: 'c2',
          commentNumber: 'PUB-2403-002',
          submitterName: 'PMI South Africa',
          submitterEmail: 'feedback@pmisa.org.za',
          organization: 'PMI South Africa',
          commentDate: '2024-03-22',
          comment: 'The assessment criteria should align with PMP certification requirements.',
          status: 'pending',
          source: 'email'
        }
      ]
    },
    {
      id: '2',
      qualificationCode: 'NC-DS-2024',
      qualificationTitle: 'National Certificate: Data Science',
      qualificationLevel: 5,
      credits: 120,
      submittedBy: 'Prof. Michael Chen',
      submittedDate: '2024-03-18',
      status: 'pending',
      allPhasesCompleted: true,
      comments: [
        {
          id: 'c3',
          commentNumber: 'PUB-2403-003',
          submitterName: 'Dr. Maria Garcia',
          submitterEmail: 'm.garcia@techuniversity.ac.za',
          organization: 'Tech University',
          commentDate: '2024-03-19',
          comment: 'The practical requirements need to be more specific about the tools and technologies.',
          status: 'pending',
          source: 'email'
        },
        {
          id: 'c4',
          commentNumber: 'PUB-2403-004',
          submitterName: 'Data Science SA',
          submitterEmail: 'contact@datasciencesa.org',
          organization: 'Data Science SA',
          commentDate: '2024-03-20',
          comment: 'Recommend adding ethics in AI and data privacy modules.',
          status: 'pending',
          source: 'webform'
        }
      ]
    }
  ];
};

export default function PublicInputDashboard() {
  const [activeTab, setActiveTab] = useState<'submissions' | 'analytics' | 'settings'>('submissions');
  const [selectedQualification, setSelectedQualification] = useState<QualificationForPublicInput | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isResolutionUploadOpen, setIsResolutionUploadOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<PublicComment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [qualifications, setQualifications] = useState<QualificationForPublicInput[]>([]);
  const [commentAction, setCommentAction] = useState<'edit' | 'delete' | 'forward' | 'ignore'>('forward');
  const [editedComment, setEditedComment] = useState('');
  const [resolutionData, setResolutionData] = useState({
    resolutionNumber: '',
    issueDate: '',
    signedBy: '',
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCommentsForQualification, setShowCommentsForQualification] = useState<string | null>(null);

  useEffect(() => {
    // Load qualifications from localStorage or use sample
    const storedQualifications = localStorage.getItem('publicInputQualifications');
    if (storedQualifications) {
      setQualifications(JSON.parse(storedQualifications));
    } else {
      setQualifications(getSampleQualifications());
      localStorage.setItem('publicInputQualifications', JSON.stringify(getSampleQualifications()));
    }
  }, []);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'reviewing':
        return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"><Eye className="w-3 h-3" /> Reviewing</span>;
      case 'resolved':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Resolved</span>;
      case 'forwarded':
        return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1"><Send className="w-3 h-3" /> Forwarded</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  const getCommentStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Pending</span>;
      case 'reviewed':
        return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Reviewed</span>;
      case 'forwarded':
        return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Forwarded</span>;
      case 'ignored':
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Ignored</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  const handleViewQualification = (qualification: QualificationForPublicInput) => {
    setSelectedQualification(qualification);
    setIsModalOpen(true);
  };

  const handleCommentAction = (comment: PublicComment, action: 'edit' | 'delete' | 'forward' | 'ignore') => {
    setSelectedComment(comment);
    setCommentAction(action);
    setEditedComment(comment.comment);
    setIsCommentModalOpen(true);
  };

  const processCommentAction = () => {
    if (!selectedQualification || !selectedComment) return;

    const updatedQualifications = qualifications.map(q => {
      if (q.id === selectedQualification.id) {
        let updatedComments;
        
        if (commentAction === 'delete') {
          updatedComments = q.comments.filter(c => c.id !== selectedComment.id);
        } else if (commentAction === 'edit') {
          updatedComments = q.comments.map(c => 
            c.id === selectedComment.id 
              ? { ...c, comment: editedComment, status: 'reviewed' as const, reviewedDate: new Date().toISOString() }
              : c
          );
        } else if (commentAction === 'ignore') {
          updatedComments = q.comments.map(c => 
            c.id === selectedComment.id 
              ? { ...c, status: 'ignored' as const, reviewedDate: new Date().toISOString() }
              : c
          );
        } else if (commentAction === 'forward') {
          updatedComments = q.comments.map(c => 
            c.id === selectedComment.id 
              ? { ...c, status: 'forwarded' as const, reviewedDate: new Date().toISOString() }
              : c
          );
        } else {
          updatedComments = q.comments;
        }
        
        // Check if all comments are resolved (reviewed, forwarded, or ignored)
        const allCommentsResolved = updatedComments.every(c => 
          c.status === 'reviewed' || c.status === 'forwarded' || c.status === 'ignored'
        );
        
        return { ...q, comments: updatedComments, status: allCommentsResolved ? 'resolved' : q.status };
      }
      return q;
    });
    
    setQualifications(updatedQualifications);
    localStorage.setItem('publicInputQualifications', JSON.stringify(updatedQualifications));
    
    // Update selected qualification
    const updatedSelected = updatedQualifications.find(q => q.id === selectedQualification.id);
    if (updatedSelected) setSelectedQualification(updatedSelected);
    
    setIsCommentModalOpen(false);
    setSelectedComment(null);
    setEditedComment('');
  };

  const handleUploadResolution = () => {
    if (!selectedQualification || !selectedFile) return;
    
    const newResolution = {
      fileName: selectedFile.name,
      fileUrl: URL.createObjectURL(selectedFile),
      uploadDate: new Date().toISOString(),
      resolutionNumber: resolutionData.resolutionNumber,
      issueDate: resolutionData.issueDate,
      signedBy: resolutionData.signedBy,
      notes: resolutionData.notes
    };
    
    const updatedQualifications = qualifications.map(q => {
      if (q.id === selectedQualification.id) {
        return { ...q, resolutionDocument: newResolution, status: 'forwarded' as const };
      }
      return q;
    });
    
    setQualifications(updatedQualifications);
    localStorage.setItem('publicInputQualifications', JSON.stringify(updatedQualifications));
    
    // Update selected qualification
    const updatedSelected = updatedQualifications.find(q => q.id === selectedQualification.id);
    if (updatedSelected) setSelectedQualification(updatedSelected);
    
    // Also add to Qualifications Approval Phase
    const approvalQualification = {
      id: selectedQualification.id,
      qualificationCode: selectedQualification.qualificationCode,
      qualificationTitle: selectedQualification.qualificationTitle,
      nqfLevel: selectedQualification.qualificationLevel,
      credits: selectedQualification.credits,
      submittedBy: selectedQualification.submittedBy,
      submittedDate: selectedQualification.submittedDate,
      status: 'Pending Review',
      resolutionDocument: newResolution,
      movedAt: new Date().toISOString()
    };
    
    const existingApprovals = localStorage.getItem('approvalQualifications') || '[]';
    const approvals = JSON.parse(existingApprovals);
    approvals.push(approvalQualification);
    localStorage.setItem('approvalQualifications', JSON.stringify(approvals));
    
    setIsResolutionUploadOpen(false);
    setSelectedFile(null);
    setResolutionData({ resolutionNumber: '', issueDate: '', signedBy: '', notes: '' });
    
    alert('Resolution uploaded and qualification forwarded to Qualifications Approval Phase successfully!');
  };

  const toggleComments = (qualificationId: string) => {
    setShowCommentsForQualification(showCommentsForQualification === qualificationId ? null : qualificationId);
  };

  const filteredQualifications = qualifications.filter(q => {
    if (searchTerm && !q.qualificationTitle.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !q.qualificationCode.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter && q.status !== statusFilter) return false;
    return true;
  });

  // Stats calculations
  const totalQualifications = qualifications.length;
  const pendingQualifications = qualifications.filter(q => q.status === 'pending').length;
  const totalComments = qualifications.reduce((acc, q) => acc + q.comments.length, 0);
  const pendingComments = qualifications.reduce((acc, q) => acc + q.comments.filter(c => c.status === 'pending').length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Public Input Dashboard</h1>
        <p className="text-gray-500 mt-2">Manage public comments and feedback for qualifications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Qualifications</p>
              <p className="text-2xl font-bold">{totalQualifications}</p>
            </div>
            <div className="p-2 bg-pink-100 rounded-lg">
              <Award className="w-5 h-5 text-pink-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingQualifications}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Comments</p>
              <p className="text-2xl font-bold">{totalComments}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Comments</p>
              <p className="text-2xl font-bold text-orange-600">{pendingComments}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Forwarded</p>
              <p className="text-2xl font-bold text-purple-600">
                {qualifications.filter(q => q.status === 'forwarded').length}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeTab === 'submissions' 
                ? 'text-pink-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Submissions
            </div>
            {activeTab === 'submissions' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeTab === 'analytics' 
                ? 'text-pink-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics & Insights
            </div>
            {activeTab === 'analytics' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeTab === 'settings' 
                ? 'text-pink-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Settings
            </div>
            {activeTab === 'settings' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by qualification..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="border rounded-lg px-3 py-2 text-sm min-w-[150px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="forwarded">Forwarded</option>
            </select>
            <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Qualifications List */}
          <div className="space-y-4">
            {filteredQualifications.map((qualification) => (
              <div key={qualification.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* Qualification Header */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{qualification.qualificationTitle}</h3>
                        {getStatusBadge(qualification.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                        <span>Code: {qualification.qualificationCode}</span>
                        <span>NQF Level: {qualification.qualificationLevel}</span>
                        <span>Credits: {qualification.credits}</span>
                        <span>Submitted: {qualification.submittedDate}</span>
                        <span>By: {qualification.submittedBy}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleViewQualification(qualification)}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button 
                        onClick={() => toggleComments(qualification.id)}
                        className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Comments ({qualification.comments.length})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments Section - Toggle */}
                {showCommentsForQualification === qualification.id && (
                  <div className="p-4 bg-gray-50 border-b">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-pink-600" />
                      Public Comments
                    </h4>
                    <div className="space-y-3">
                      {qualification.comments.map((comment) => (
                        <div key={comment.id} className="bg-white p-3 rounded-lg border">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{comment.submitterName}</span>
                                {comment.organization && (
                                  <span className="text-xs text-gray-500">({comment.organization})</span>
                                )}
                                {getCommentStatusBadge(comment.status)}
                              </div>
                              <p className="text-sm text-gray-700">{comment.comment}</p>
                              <p className="text-xs text-gray-400 mt-1">Received: {comment.commentDate} via {comment.source}</p>
                            </div>
                            <div className="flex gap-1 ml-4">
                              <button 
                                onClick={() => handleCommentAction(comment, 'edit')}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleCommentAction(comment, 'delete')}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleCommentAction(comment, 'forward')}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                title="Forward to Quality Partner"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleCommentAction(comment, 'ignore')}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                title="Ignore"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {qualification.comments.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No comments for this qualification
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-4">Comments by Status</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Pending</span>
                  <span className="font-medium">{pendingComments}</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(pendingComments / totalComments) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Reviewed/Forwarded</span>
                  <span className="font-medium">{totalComments - pendingComments}</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${((totalComments - pendingComments) / totalComments) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-4">Comments by Source</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Email</span>
                <span className="font-medium">
                  {qualifications.reduce((acc, q) => acc + q.comments.filter(c => c.source === 'email').length, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Webform</span>
                <span className="font-medium">
                  {qualifications.reduce((acc, q) => acc + q.comments.filter(c => c.source === 'webform').length, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold mb-4">Public Input Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Auto-import emails as comments</p>
                <p className="text-sm text-gray-500">Automatically pull comments from configured email accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
              </label>
            </div>
            <div className="pt-4">
              <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Qualification Detail Modal */}
      {isModalOpen && selectedQualification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-pink-50 to-white">
              <div>
                <h3 className="text-lg font-semibold">{selectedQualification.qualificationTitle}</h3>
                <p className="text-sm text-gray-500">Code: {selectedQualification.qualificationCode}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Qualification Overview Tab */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Qualification Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-gray-500">Qualification Code</p><p className="font-medium">{selectedQualification.qualificationCode}</p></div>
                    <div><p className="text-xs text-gray-500">NQF Level</p><p className="font-medium">Level {selectedQualification.qualificationLevel}</p></div>
                    <div><p className="text-xs text-gray-500">Credits</p><p className="font-medium">{selectedQualification.credits}</p></div>
                    <div><p className="text-xs text-gray-500">Submitted By</p><p className="font-medium">{selectedQualification.submittedBy}</p></div>
                    <div><p className="text-xs text-gray-500">Submitted Date</p><p className="font-medium">{selectedQualification.submittedDate}</p></div>
                    <div><p className="text-xs text-gray-500">Status</p><div>{getStatusBadge(selectedQualification.status)}</div></div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-pink-600" />
                    Public Comments ({selectedQualification.comments.length})
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedQualification.comments.map((comment) => (
                      <div key={comment.id} className="bg-white p-3 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{comment.submitterName}</span>
                              {comment.organization && <span className="text-xs text-gray-500">({comment.organization})</span>}
                              {getCommentStatusBadge(comment.status)}
                            </div>
                            <p className="text-sm text-gray-700">{comment.comment}</p>
                            <p className="text-xs text-gray-400 mt-1">Received: {comment.commentDate} via {comment.source}</p>
                          </div>
                          <div className="flex gap-1 ml-4">
                            <button onClick={() => handleCommentAction(comment, 'edit')} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleCommentAction(comment, 'delete')} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                            <button onClick={() => handleCommentAction(comment, 'forward')} className="p-1 text-purple-600 hover:bg-purple-50 rounded"><Send className="w-4 h-4" /></button>
                            <button onClick={() => handleCommentAction(comment, 'ignore')} className="p-1 text-gray-600 hover:bg-gray-100 rounded"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resolution Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-purple-600" />
                    Resolution Document
                  </h4>
                  {selectedQualification.resolutionDocument ? (
                    <div className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-purple-600" />
                          <div>
                            <p className="font-medium">{selectedQualification.resolutionDocument.fileName}</p>
                            <p className="text-xs text-gray-500">Resolution #: {selectedQualification.resolutionDocument.resolutionNumber}</p>
                            <p className="text-xs text-gray-500">Uploaded: {new Date(selectedQualification.resolutionDocument.uploadDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <a href={selectedQualification.resolutionDocument.fileUrl} download className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-3">No resolution document uploaded yet</p>
                      <button 
                        onClick={() => setIsResolutionUploadOpen(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 mx-auto"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Resolution & Forward
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Action Modal */}
      {isCommentModalOpen && selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-pink-50 to-white">
              <h3 className="text-lg font-semibold">
                {commentAction === 'edit' && 'Edit Comment'}
                {commentAction === 'delete' && 'Delete Comment'}
                {commentAction === 'forward' && 'Forward Comment'}
                {commentAction === 'ignore' && 'Ignore Comment'}
              </h3>
              <button onClick={() => setIsCommentModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {commentAction === 'delete' && (
                <p>Are you sure you want to delete this comment? This action cannot be undone.</p>
              )}
              {commentAction === 'ignore' && (
                <p>This comment will be marked as ignored and will not be forwarded. Continue?</p>
              )}
              {commentAction === 'forward' && (
                <p>This comment will be marked as forwarded. It will be included in the resolution package. Continue?</p>
              )}
              {commentAction === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Edit Comment</label>
                  <textarea
                    value={editedComment}
                    onChange={(e) => setEditedComment(e.target.value)}
                    className="w-full border rounded-lg p-3 text-sm"
                    rows={4}
                  />
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setIsCommentModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">
                Cancel
              </button>
              <button 
                onClick={processCommentAction}
                className={`px-4 py-2 rounded-lg text-sm text-white ${
                  commentAction === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                  commentAction === 'edit' ? 'bg-blue-600 hover:bg-blue-700' :
                  'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {commentAction === 'delete' ? 'Delete' : commentAction === 'edit' ? 'Save Changes' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Upload Modal */}
      {isResolutionUploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
              <h3 className="text-lg font-semibold">Upload Resolution Document</h3>
              <button onClick={() => setIsResolutionUploadOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Number *</label>
                <input
                  type="text"
                  value={resolutionData.resolutionNumber}
                  onChange={(e) => setResolutionData({ ...resolutionData, resolutionNumber: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., RES-2024-001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
                <input
                  type="date"
                  value={resolutionData.issueDate}
                  onChange={(e) => setResolutionData({ ...resolutionData, issueDate: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Signed By *</label>
                <input
                  type="text"
                  value={resolutionData.signedBy}
                  onChange={(e) => setResolutionData({ ...resolutionData, signedBy: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., Dr. Sarah Johnson, Registrar"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document *</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="resolution-upload"
                    accept=".pdf,.doc,.docx"
                  />
                  <label htmlFor="resolution-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to upload resolution document</p>
                    <p className="text-xs text-gray-400">PDF, DOC, DOCX (max 10MB)</p>
                  </label>
                  {selectedFile && (
                    <p className="text-sm text-green-600 mt-2">Selected: {selectedFile.name}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={resolutionData.notes}
                  onChange={(e) => setResolutionData({ ...resolutionData, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Any additional notes about this resolution..."
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setIsResolutionUploadOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">
                Cancel
              </button>
              <button 
                onClick={handleUploadResolution}
                disabled={!selectedFile || !resolutionData.resolutionNumber || !resolutionData.issueDate || !resolutionData.signedBy}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload & Forward
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}