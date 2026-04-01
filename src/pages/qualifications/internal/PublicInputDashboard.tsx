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
  Users,
  GitBranch,
  ClipboardList,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Filter,
  Search,
  ChevronRight,
  ChevronLeft,
  Mail,
  Phone,
  Globe,
  Star,
  Award,
  BookOpen,
  User,
  UserCheck,
  RefreshCw,
  Upload,
  Paperclip,
  Link,
  Printer,
  MoreVertical,
  Copy,
  Archive,
  Bell,
  Home,
  Briefcase,
  Heart,
  Flag,
  TrendingUp,
  PieChart,
  Edit
} from 'lucide-react';

// Types
interface PublicSubmission {
  id: string;
  submissionNumber: string;
  qualificationTitle: string;
  qualificationCode: string;
  submitterName: string;
  submitterEmail: string;
  submitterType: 'individual' | 'organization' | 'stakeholder' | 'expert';
  organization?: string;
  submissionDate: string;
  feedbackType: 'general' | 'curriculum' | 'assessment' | 'requirements' | 'other';
  feedback: string;
  attachments?: string[];
  rating?: number;
  status: 'pending' | 'reviewed' | 'acknowledged' | 'incorporated' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  tags: string[];
  reviewedBy?: string;
  reviewDate?: string;
  response?: string;
  responseDate?: string;
  aiSentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  aiKeywords?: string[];
}

interface SubmissionStats {
  total: number;
  pending: number;
  reviewed: number;
  incorporated: number;
  averageRating: number;
  positiveSentiment: number;
  byType: {
    individual: number;
    organization: number;
    stakeholder: number;
    expert: number;
  };
  byFeedbackType: {
    general: number;
    curriculum: number;
    assessment: number;
    requirements: number;
    other: number;
  };
}

export default function PublicInputDashboard() {
  const [activeTab, setActiveTab] = useState<'submissions' | 'analytics' | 'settings'>('submissions');
  const [selectedSubmission, setSelectedSubmission] = useState<PublicSubmission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // Sample data for public submissions
  const submissions: PublicSubmission[] = [
    {
      id: 'SUB-2024-001',
      submissionNumber: 'PUB-2403-001',
      qualificationTitle: 'Advanced Diploma in Project Management',
      qualificationCode: 'AD-PM-2024',
      submitterName: 'John Smith',
      submitterEmail: 'john.smith@email.com',
      submitterType: 'individual',
      submissionDate: '2024-03-15',
      feedbackType: 'curriculum',
      feedback: 'The curriculum should include more emphasis on agile project management methodologies. Current focus seems heavily weighted towards traditional waterfall approaches which may not reflect current industry practices.',
      attachments: ['agile_feedback.docx', 'industry_survey.pdf'],
      rating: 4,
      status: 'pending',
      priority: 'high',
      category: 'Curriculum Enhancement',
      tags: ['agile', 'methodology', 'industry-alignment'],
      aiSentiment: 'positive',
      aiKeywords: ['agile', 'modernization', 'industry-practice']
    },
    {
      id: 'SUB-2024-002',
      submissionNumber: 'PUB-2403-002',
      qualificationTitle: 'Advanced Diploma in Project Management',
      qualificationCode: 'AD-PM-2024',
      submitterName: 'Project Management Institute SA',
      submitterEmail: 'feedback@pmisa.org.za',
      organization: 'PMI South Africa',
      submitterType: 'organization',
      submissionDate: '2024-03-14',
      feedbackType: 'assessment',
      feedback: 'The assessment criteria should align with PMP certification requirements. We recommend incorporating PMBOK 7th edition principles and including a capstone project that demonstrates practical application.',
      attachments: ['pmi_feedback_formal.pdf', 'pmbok_alignment.xlsx'],
      rating: 5,
      status: 'reviewed',
      priority: 'critical',
      category: 'Assessment Alignment',
      tags: ['pmp', 'certification', 'alignment', 'capstone'],
      reviewedBy: 'Dr. Sarah Johnson',
      reviewDate: '2024-03-16',
      response: 'Thank you for your valuable feedback. We will incorporate PMBOK 7th edition principles and review the capstone project requirements.',
      responseDate: '2024-03-17',
      aiSentiment: 'positive',
      aiKeywords: ['certification', 'alignment', 'capstone', 'pmbok']
    },
    {
      id: 'SUB-2024-003',
      submissionNumber: 'PUB-2403-003',
      qualificationTitle: 'National Certificate: Data Science',
      qualificationCode: 'NC-DS-2024',
      submitterName: 'Dr. Maria Garcia',
      submitterEmail: 'm.garcia@techuniversity.ac.za',
      submitterType: 'expert',
      organization: 'Tech University',
      submissionDate: '2024-03-13',
      feedbackType: 'requirements',
      feedback: 'The practical requirements need to be more specific about the tools and technologies. Suggest specifying Python, R, and SQL requirements more clearly. Also recommend including cloud computing platforms.',
      attachments: ['data_science_requirements.pdf'],
      rating: 3,
      status: 'acknowledged',
      priority: 'high',
      category: 'Technical Requirements',
      tags: ['python', 'r', 'sql', 'cloud', 'tools'],
      reviewedBy: 'Prof. Michael Chen',
      reviewDate: '2024-03-14',
      response: 'Thank you for your expertise. We will update the technical requirements section.',
      responseDate: '2024-03-14',
      aiSentiment: 'neutral',
      aiKeywords: ['python', 'tools', 'cloud', 'requirements']
    },
    {
      id: 'SUB-2024-004',
      submissionNumber: 'PUB-2403-004',
      qualificationTitle: 'Bachelor of Education (Foundation Phase)',
      qualificationCode: 'BED-FP-2024',
      submitterName: 'South African Teachers Union',
      submitterEmail: 'policy@satu.org.za',
      organization: 'SATU',
      submitterType: 'stakeholder',
      submissionDate: '2024-03-12',
      feedbackType: 'requirements',
      feedback: 'The practical teaching hours requirement (120 hours) is insufficient. Based on our members feedback, minimum 200 hours are needed for adequate classroom experience. Also request more focus on inclusive education.',
      attachments: ['satu_formal_response.pdf', 'teaching_hours_survey.xlsx'],
      rating: 2,
      status: 'incorporated',
      priority: 'high',
      category: 'Practical Requirements',
      tags: ['teaching-hours', 'practical', 'inclusive-education'],
      reviewedBy: 'Dr. Emily Brown',
      reviewDate: '2024-03-13',
      response: 'Feedback accepted. Practical hours increased to 200 hours and inclusive education module added.',
      responseDate: '2024-03-15',
      aiSentiment: 'negative',
      aiKeywords: ['hours-insufficient', 'inclusive-education']
    },
    {
      id: 'SUB-2024-005',
      submissionNumber: 'PUB-2403-005',
      qualificationTitle: 'National Certificate: Data Science',
      qualificationCode: 'NC-DS-2024',
      submitterName: 'Data Science South Africa',
      submitterEmail: 'contact@datasciencesa.org',
      organization: 'Data Science SA',
      submitterType: 'organization',
      submissionDate: '2024-03-11',
      feedbackType: 'curriculum',
      feedback: 'Recommend adding ethics in AI and data privacy modules. Also suggest including industry projects with real datasets from partner companies.',
      attachments: ['dssa_curriculum_proposal.pdf'],
      rating: 4,
      status: 'pending',
      priority: 'medium',
      category: 'Curriculum Enhancement',
      tags: ['ethics', 'ai', 'privacy', 'industry-projects'],
      aiSentiment: 'positive',
      aiKeywords: ['ethics', 'ai-privacy', 'industry-projects']
    },
    {
      id: 'SUB-2024-006',
      submissionNumber: 'PUB-2403-006',
      qualificationTitle: 'Advanced Diploma in Project Management',
      qualificationCode: 'AD-PM-2024',
      submitterName: 'Thabo Mbeki',
      submitterEmail: 'thabo.m@email.com',
      submitterType: 'individual',
      submissionDate: '2024-03-10',
      feedbackType: 'general',
      feedback: 'The program should include more soft skills training. Project managers need strong communication and leadership skills.',
      rating: 3,
      status: 'rejected',
      priority: 'low',
      category: 'Soft Skills',
      tags: ['soft-skills', 'communication', 'leadership'],
      reviewedBy: 'Dr. Sarah Johnson',
      reviewDate: '2024-03-11',
      response: 'Soft skills are already covered in the Professional Skills module. Additional content would exceed credit limits.',
      responseDate: '2024-03-11',
      aiSentiment: 'neutral',
      aiKeywords: ['soft-skills', 'communication']
    }
  ];

  // Calculate stats
  const stats: SubmissionStats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    reviewed: submissions.filter(s => s.status === 'reviewed').length,
    incorporated: submissions.filter(s => s.status === 'incorporated').length,
    averageRating: submissions.reduce((acc, s) => acc + (s.rating || 0), 0) / submissions.filter(s => s.rating).length,
    positiveSentiment: submissions.filter(s => s.aiSentiment === 'positive').length,
    byType: {
      individual: submissions.filter(s => s.submitterType === 'individual').length,
      organization: submissions.filter(s => s.submitterType === 'organization').length,
      stakeholder: submissions.filter(s => s.submitterType === 'stakeholder').length,
      expert: submissions.filter(s => s.submitterType === 'expert').length
    },
    byFeedbackType: {
      general: submissions.filter(s => s.feedbackType === 'general').length,
      curriculum: submissions.filter(s => s.feedbackType === 'curriculum').length,
      assessment: submissions.filter(s => s.feedbackType === 'assessment').length,
      requirements: submissions.filter(s => s.feedbackType === 'requirements').length,
      other: submissions.filter(s => s.feedbackType === 'other').length
    }
  };

  const handleViewDetails = (submission: PublicSubmission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'reviewed':
        return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><Eye className="w-3 h-3" /> Reviewed</span>;
      case 'acknowledged':
        return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Acknowledged</span>;
      case 'incorporated':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Incorporated</span>;
      case 'rejected':
        return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'critical':
        return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Critical</span>;
      case 'high':
        return <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">High</span>;
      case 'medium':
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">Medium</span>;
      case 'low':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Low</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{priority}</span>;
    }
  };

  const getSubmitterTypeBadge = (type: string) => {
    switch(type) {
      case 'individual':
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Individual</span>;
      case 'organization':
        return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Organization</span>;
      case 'stakeholder':
        return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Stakeholder</span>;
      case 'expert':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Expert</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{type}</span>;
    }
  };

  const getFeedbackTypeBadge = (type: string) => {
    switch(type) {
      case 'general':
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">General</span>;
      case 'curriculum':
        return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Curriculum</span>;
      case 'assessment':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Assessment</span>;
      case 'requirements':
        return <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Requirements</span>;
      case 'other':
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Other</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{type}</span>;
    }
  };

  const getSentimentBadge = (sentiment?: string) => {
    switch(sentiment) {
      case 'positive':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Positive</span>;
      case 'negative':
        return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> Negative</span>;
      case 'neutral':
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Neutral</span>;
      case 'mixed':
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Mixed</span>;
      default:
        return null;
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(sub => {
    if (searchTerm && !sub.submissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !sub.qualificationTitle.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !sub.submitterName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter && sub.status !== statusFilter) return false;
    if (typeFilter && sub.submitterType !== typeFilter) return false;
    if (priorityFilter && sub.priority !== priorityFilter) return false;
    
    if (dateRange !== 'all') {
      const submissionDate = new Date(sub.submissionDate);
      const today = new Date();
      const diffTime = today.getTime() - submissionDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      if (dateRange === 'today' && diffDays > 1) return false;
      if (dateRange === 'week' && diffDays > 7) return false;
      if (dateRange === 'month' && diffDays > 30) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Public Input Dashboard</h1>
        <p className="text-gray-500 mt-2">Manage and analyze public feedback and submissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Submissions</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="p-2 bg-pink-100 rounded-lg">
              <Users className="w-5 h-5 text-pink-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Last 30 days</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Need review</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Incorporated</p>
              <p className="text-2xl font-bold text-green-600">{stats.incorporated}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Feedback implemented</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Rating</p>
              <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Out of 5</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Positive Sentiment</p>
              <p className="text-2xl font-bold text-green-600">{stats.positiveSentiment}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <ThumbsUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">AI analysis</div>
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
              <BarChart3 className="w-4 h-4" />
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
          {/* Filters and Search */}
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by number, qualification, or submitter..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              className="border rounded-lg px-3 py-2 text-sm min-w-[120px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="incorporated">Incorporated</option>
              <option value="rejected">Rejected</option>
            </select>

            <select 
              className="border rounded-lg px-3 py-2 text-sm min-w-[120px]"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="individual">Individual</option>
              <option value="organization">Organization</option>
              <option value="stakeholder">Stakeholder</option>
              <option value="expert">Expert</option>
            </select>

            <select 
              className="border rounded-lg px-3 py-2 text-sm min-w-[120px]"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select 
              className="border rounded-lg px-3 py-2 text-sm min-w-[120px]"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
            
            <button className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-700 flex items-center gap-2 ml-auto">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Submission #</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Qualification</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Submitter</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Type</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Feedback Type</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Priority</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Sentiment</th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <span className="text-sm font-mono text-pink-600">{submission.submissionNumber}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{submission.qualificationTitle}</p>
                          <p className="text-xs text-gray-500">{submission.qualificationCode}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-sm font-medium">{submission.submitterName}</p>
                          {submission.organization && (
                            <p className="text-xs text-gray-500">{submission.organization}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getSubmitterTypeBadge(submission.submitterType)}
                      </td>
                      <td className="py-4 px-6">
                        {getFeedbackTypeBadge(submission.feedbackType)}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm">{submission.submissionDate}</span>
                      </td>
                      <td className="py-4 px-6">
                        {getPriorityBadge(submission.priority)}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="py-4 px-6">
                        {getSentimentBadge(submission.aiSentiment)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleViewDetails(submission)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Acknowledge">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Message">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="More">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {filteredSubmissions.length} of {submissions.length} submissions
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm">Page 1 of 1</span>
                <button className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm border">
              <p className="text-xs text-gray-500">By Submitter Type</p>
              <div className="flex justify-between mt-2 text-sm">
                <span>Individual: {stats.byType.individual}</span>
                <span>Org: {stats.byType.organization}</span>
                <span>Expert: {stats.byType.expert}</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border">
              <p className="text-xs text-gray-500">By Feedback Type</p>
              <div className="flex justify-between mt-2 text-sm">
                <span>Curriculum: {stats.byFeedbackType.curriculum}</span>
                <span>Assessment: {stats.byFeedbackType.assessment}</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border">
              <p className="text-xs text-gray-500">Priority Breakdown</p>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-red-600">Critical: {submissions.filter(s => s.priority === 'critical').length}</span>
                <span className="text-orange-600">High: {submissions.filter(s => s.priority === 'high').length}</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border">
              <p className="text-xs text-gray-500">Response Rate</p>
              <div className="mt-2 text-sm">
                <span className="font-medium">{Math.round((submissions.filter(s => s.response).length / submissions.length) * 100)}%</span>
                <span className="text-gray-500 ml-2">responded</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Sentiment Analysis */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-pink-600" />
                Sentiment Analysis
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Positive</span>
                    <span className="font-medium">{submissions.filter(s => s.aiSentiment === 'positive').length}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(submissions.filter(s => s.aiSentiment === 'positive').length / submissions.length) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Neutral</span>
                    <span className="font-medium">{submissions.filter(s => s.aiSentiment === 'neutral').length}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${(submissions.filter(s => s.aiSentiment === 'neutral').length / submissions.length) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Negative</span>
                    <span className="font-medium">{submissions.filter(s => s.aiSentiment === 'negative').length}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(submissions.filter(s => s.aiSentiment === 'negative').length / submissions.length) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Keywords */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-pink-600" />
                Top Keywords from AI Analysis
              </h3>
              <div className="flex flex-wrap gap-2">
                {['agile', 'curriculum', 'assessment', 'practical', 'ethics', 'python', 'cloud', 'certification', 'industry', 'soft-skills'].map((keyword, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                    {keyword} <span className="text-gray-400 ml-1">({Math.floor(Math.random() * 10) + 1})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Feedback by Qualification */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-semibold mb-4">Feedback by Qualification</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Advanced Diploma: Project Management</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div className="bg-pink-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>National Certificate: Data Science</span>
                    <span className="font-medium">2</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div className="bg-pink-500 h-2 rounded-full" style={{ width: '33%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Bachelor of Education</span>
                    <span className="font-medium">1</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div className="bg-pink-500 h-2 rounded-full" style={{ width: '17%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Times */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="font-semibold mb-4">Average Response Time</h3>
              <div className="text-center">
                <p className="text-4xl font-bold text-pink-600">2.4</p>
                <p className="text-gray-500">days</p>
                <div className="mt-4 text-sm text-gray-600">
                  <span className="text-green-600">↑ 12%</span> faster than last month
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-4">Feedback Trends</h3>
            <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
              <p className="text-gray-400">Chart visualization would go here</p>
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
                <p className="font-medium">Auto-acknowledge submissions</p>
                <p className="text-sm text-gray-500">Send automatic acknowledgment emails for new submissions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">AI sentiment analysis</p>
                <p className="text-sm text-gray-500">Automatically analyze sentiment of submissions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Public submission form</p>
                <p className="text-sm text-gray-500">Allow public submissions via web form</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
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

      {/* Modal */}
      {isModalOpen && selectedSubmission && (
        <PublicSubmissionModal 
          submission={selectedSubmission}
          onClose={() => setIsModalOpen(false)}
          getStatusBadge={getStatusBadge}
          getPriorityBadge={getPriorityBadge}
          getSubmitterTypeBadge={getSubmitterTypeBadge}
          getFeedbackTypeBadge={getFeedbackTypeBadge}
          getSentimentBadge={getSentimentBadge}
        />
      )}
    </div>
  );
}

// Public Submission Modal Component
interface PublicSubmissionModalProps {
  submission: PublicSubmission;
  onClose: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getPriorityBadge: (priority: string) => React.ReactNode;
  getSubmitterTypeBadge: (type: string) => React.ReactNode;
  getFeedbackTypeBadge: (type: string) => React.ReactNode;
  getSentimentBadge: (sentiment?: string) => React.ReactNode;
}
function PublicSubmissionModal({ 
  submission, 
  onClose, 
  getStatusBadge,
  getPriorityBadge,
  getSubmitterTypeBadge,
  getFeedbackTypeBadge,
  getSentimentBadge
}: PublicSubmissionModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'response' | 'attachments' | 'history'>('overview');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-pink-600 to-pink-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Public Submission Details
            </h2>
            <p className="text-pink-100 text-sm mt-1">
              {submission.submissionNumber} - {submission.qualificationTitle}
            </p>
          </div>
          <button onClick={onClose} className="text-white hover:text-pink-200">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-50 px-6 py-3 border-b flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            {getStatusBadge(submission.status)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Priority:</span>
            {getPriorityBadge(submission.priority)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sentiment:</span>
            {getSentimentBadge(submission.aiSentiment)}
          </div>
          {submission.rating && (
            <div className="flex items-center gap-1 ml-auto">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < submission.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
          )}
        </div>

        {/* Modal Tabs */}
        <div className="border-b px-6">
          <div className="flex gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'overview' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('response')}
              className={`py-3 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'response' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Response
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`py-3 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'attachments' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Attachments
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 px-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'history' ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              History & Tags
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Submitter Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-pink-600" />
                  Submitter Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="font-medium">{submission.submitterName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{submission.submitterEmail}</p>
                  </div>
                  {submission.organization && (
                    <div>
                      <p className="text-xs text-gray-500">Organization</p>
                      <p className="font-medium">{submission.organization}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Type</p>
                    <div className="mt-1">{getSubmitterTypeBadge(submission.submitterType)}</div>
                  </div>
                </div>
              </div>

              {/* Feedback Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-pink-600" />
                  Feedback Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Qualification</p>
                    <p className="font-medium">{submission.qualificationTitle}</p>
                    <p className="text-sm text-gray-500">{submission.qualificationCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Feedback Type</p>
                    <div className="mt-1">{getFeedbackTypeBadge(submission.feedbackType)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="font-medium">{submission.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Submission Date</p>
                    <p className="font-medium">{submission.submissionDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Feedback</p>
                    <div className="mt-2 p-3 bg-white rounded-lg border">
                      <p className="text-gray-700 whitespace-pre-wrap">{submission.feedback}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              {submission.aiKeywords && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-medium mb-2 text-purple-800">AI Analysis</h4>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {submission.aiKeywords.map((keyword, idx) => (
                      <span key={idx} className="bg-white text-purple-700 px-3 py-1 rounded-full text-xs border border-purple-200">
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-purple-600">Keywords extracted from feedback</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'response' && (
            <div className="space-y-6">
              {/* Response Form */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Draft Response</h4>
                <textarea
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  rows={5}
                  placeholder="Type your response to the submitter..."
                  defaultValue={submission.response || ''}
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button className="border px-4 py-2 rounded-lg text-sm hover:bg-white">
                    Save Draft
                  </button>
                  <button className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-700">
                    Send Response
                  </button>
                </div>
              </div>

              {/* Previous Response */}
              {submission.response && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Previous Response</h4>
                  <p className="text-gray-700 mb-2">{submission.response}</p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Responded by: {submission.reviewedBy || 'System'}</span>
                    <span>Date: {submission.responseDate}</span>
                  </div>
                </div>
              )}

              {/* Response Templates */}
              <div>
                <h4 className="font-medium mb-2">Response Templates</h4>
                <div className="grid grid-cols-3 gap-3">
                  <button className="p-3 border rounded-lg text-left hover:bg-gray-50">
                    <p className="font-medium">Acknowledgement</p>
                    <p className="text-xs text-gray-500">Thank you for your feedback...</p>
                  </button>
                  <button className="p-3 border rounded-lg text-left hover:bg-gray-50">
                    <p className="font-medium">Incorporation</p>
                    <p className="text-xs text-gray-500">Your suggestion has been incorporated...</p>
                  </button>
                  <button className="p-3 border rounded-lg text-left hover:bg-gray-50">
                    <p className="font-medium">Clarification</p>
                    <p className="text-xs text-gray-500">Could you provide more details...</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <h4 className="font-medium">Attachments</h4>
              {submission.attachments && submission.attachments.length > 0 ? (
                <div className="space-y-3">
                  {submission.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{attachment}</p>
                          <p className="text-xs text-gray-500">Uploaded on {submission.submissionDate}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-white rounded" title="Download">
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-white rounded" title="View">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No attachments</p>
                </div>
              )}

              <div className="mt-4">
                <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload New Attachment
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Tags */}
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {submission.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                  <button className="border border-dashed px-3 py-1.5 rounded-full text-sm text-gray-500 hover:bg-gray-50">
                    + Add Tag
                  </button>
                </div>
              </div>

              {/* Review History */}
              {submission.reviewedBy && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Review History</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">Reviewed by {submission.reviewedBy}</span>
                        </p>
                        <p className="text-xs text-gray-500">{submission.reviewDate}</p>
                      </div>
                    </div>
                    {submission.responseDate && (
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">Response sent</span>
                          </p>
                          <p className="text-xs text-gray-500">{submission.responseDate}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Activity Log */}
              <div>
                <h4 className="font-medium mb-2">Activity Log</h4>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <span className="text-gray-400">2024-03-15 10:30:</span> Submission received
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="text-gray-400">2024-03-15 10:31:</span> AI sentiment analysis completed
                  </div>
                  {submission.reviewedBy && (
                    <div className="text-sm text-gray-600">
                      <span className="text-gray-400">{submission.reviewDate} 14:15:</span> Reviewed by {submission.reviewedBy}
                    </div>
                  )}
                  {submission.responseDate && (
                    <div className="text-sm text-gray-600">
                      <span className="text-gray-400">{submission.responseDate} 09:45:</span> Response sent to submitter
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-2">
          <button className="px-4 py-2 border rounded-lg hover:bg-white flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {submission.status === 'pending' ? 'Acknowledge' : 'Update Status'}
          </button>
          <button className="px-4 py-2 border rounded-lg hover:bg-white" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Missing Tag icon import
function Tag(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}