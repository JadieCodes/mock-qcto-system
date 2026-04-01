// pages/internal/DevelopmentWorkspace.tsx
import React, { useState } from 'react';
import { 
  GitBranch, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Users,
  Calendar,
  MessageSquare,
  Eye,
  Edit,
  Plus,
  Download,
  Upload,
  UserCheck,
  XCircle,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  MoreVertical
} from 'lucide-react';
import DevelopmentProjectModal from '@/components/modals/DevelopmentProjectModal';

interface DevelopmentProject {
  id: string;
  qualificationTitle: string;
  phase: 'drafting' | 'consultation' | 'review' | 'finalization';
  progress: number;
  startDate: string;
  targetDate: string;
  leadDeveloper: string;
  team: string[];
  status: 'active' | 'on-hold' | 'completed';
  documents: Record<string, string>;
  reviews: Array<{ reviewer: string; status: string; date: string }>;
}

interface ResolutionItem {
  id: string;
  qualificationTitle: string;
  issueType: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reportedBy: string;
  reportedDate: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'blocked';
  assignedTo: string;
  comments: Array<{ user: string; text: string; date: string }>;
}

export default function DevelopmentWorkspace() {
  const [activeSubTab, setActiveSubTab] = useState<'development' | 'resolution'>('development');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DevelopmentProject | ResolutionItem | null>(null);

  // Sample data for development phases
  const developmentProjects: DevelopmentProject[] = [
    {
      id: 'DEV-2024-001',
      qualificationTitle: 'Advanced Diploma in Project Management',
      phase: 'drafting',
      progress: 35,
      startDate: '2024-02-01',
      targetDate: '2024-05-30',
      leadDeveloper: 'Dr. Sarah Johnson',
      team: ['John Smith', 'Emily Brown', 'Michael Chen'],
      status: 'active',
      documents: {
        curriculum: 'curriculum_draft_v2.pdf',
        assessment: 'assessment_guide.pdf',
        learningMaterials: 'learning_materials.docx'
      },
      reviews: [
        { reviewer: 'Prof. David Wilson', status: 'pending', date: '2024-03-20' },
        { reviewer: 'Dr. Lisa Anderson', status: 'completed', date: '2024-03-18' }
      ]
    },
    {
      id: 'DEV-2024-002',
      qualificationTitle: 'National Certificate: Data Science',
      phase: 'consultation',
      progress: 65,
      startDate: '2024-01-15',
      targetDate: '2024-04-30',
      leadDeveloper: 'Prof. Michael Chen',
      team: ['Anna Williams', 'Robert Taylor', 'Maria Garcia'],
      status: 'active',
      documents: {
        curriculum: 'data_science_curriculum.pdf',
        assessment: 'assessment_framework.docx',
        stakeholderFeedback: 'consultation_feedback.xlsx'
      },
      reviews: [
        { reviewer: 'Industry Panel', status: 'in-progress', date: '2024-03-25' },
        { reviewer: 'Academic Board', status: 'pending', date: '2024-03-28' }
      ]
    },
    {
      id: 'DEV-2024-003',
      qualificationTitle: 'Bachelor of Education (Foundation Phase)',
      phase: 'review',
      progress: 85,
      startDate: '2023-11-01',
      targetDate: '2024-03-30',
      leadDeveloper: 'Dr. Emily Brown',
      team: ['James Wilson', 'Patricia Lee', 'Thomas Wright'],
      status: 'active',
      documents: {
        curriculum: 'education_curriculum_final.pdf',
        assessment: 'assessment_tools.docx',
        qualityAssurance: 'qa_report.pdf'
      },
      reviews: [
        { reviewer: 'Quality Council', status: 'completed', date: '2024-03-15' },
        { reviewer: 'SACE', status: 'pending', date: '2024-03-22' }
      ]
    },
    {
      id: 'DEV-2024-004',
      qualificationTitle: 'Higher Certificate: Business Management',
      phase: 'finalization',
      progress: 95,
      startDate: '2023-12-01',
      targetDate: '2024-03-15',
      leadDeveloper: 'Dr. Robert Taylor',
      team: ['Sarah Adams', 'David Lee'],
      status: 'active',
      documents: {
        curriculum: 'business_curriculum_final.pdf',
        assessment: 'assessment_final.docx',
        qualityAssurance: 'qa_approved.pdf'
      },
      reviews: [
        { reviewer: 'Academic Board', status: 'completed', date: '2024-03-10' },
        { reviewer: 'Quality Council', status: 'completed', date: '2024-03-12' }
      ]
    }
  ];

  // Sample data for resolution items
  const resolutionItems: ResolutionItem[] = [
    {
      id: 'RES-2024-001',
      qualificationTitle: 'Advanced Diploma in Project Management',
      issueType: 'curriculum_alignment',
      description: 'Curriculum needs alignment with new industry standards',
      priority: 'high',
      reportedBy: 'Dr. Sarah Johnson',
      reportedDate: '2024-03-10',
      status: 'in-progress',
      assignedTo: 'Curriculum Committee',
      comments: [
        { user: 'John Smith', text: 'Updated module outcomes to reflect PMBOK 7th edition', date: '2024-03-12' },
        { user: 'Emily Brown', text: 'Added agile project management module', date: '2024-03-14' }
      ]
    },
    {
      id: 'RES-2024-002',
      qualificationTitle: 'National Certificate: Data Science',
      issueType: 'assessment_conflict',
      description: 'Assessment methods conflict with QA requirements',
      priority: 'critical',
      reportedBy: 'Prof. Michael Chen',
      reportedDate: '2024-03-08',
      status: 'pending',
      assignedTo: 'Assessment Team',
      comments: [
        { user: 'Anna Williams', text: 'Need to revise practical assessment criteria', date: '2024-03-09' }
      ]
    },
    {
      id: 'RES-2024-003',
      qualificationTitle: 'Bachelor of Education (Foundation Phase)',
      issueType: 'stakeholder_feedback',
      description: 'Incorporate feedback from teacher unions',
      priority: 'medium',
      reportedBy: 'Dr. Emily Brown',
      reportedDate: '2024-03-05',
      status: 'resolved',
      assignedTo: 'Stakeholder Committee',
      comments: [
        { user: 'James Wilson', text: 'Integrated feedback on practical teaching hours', date: '2024-03-06' },
        { user: 'Patricia Lee', text: 'Updated foundation phase learning outcomes', date: '2024-03-07' },
        { user: 'Thomas Wright', text: 'Changes approved by teacher unions', date: '2024-03-15' }
      ]
    },
    {
      id: 'RES-2024-004',
      qualificationTitle: 'Higher Certificate: Business Management',
      issueType: 'resource_constraint',
      description: 'Insufficient learning materials for module 4',
      priority: 'high',
      reportedBy: 'Dr. Robert Taylor',
      reportedDate: '2024-03-12',
      status: 'in-progress',
      assignedTo: 'Learning Resources Team',
      comments: [
        { user: 'Sarah Adams', text: 'Working on developing case studies', date: '2024-03-13' }
      ]
    }
  ];

  const handleViewItem = (item: DevelopmentProject | ResolutionItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const getPhaseBadge = (phase: string) => {
    switch(phase) {
      case 'drafting':
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">Drafting</span>;
      case 'consultation':
        return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">Consultation</span>;
      case 'review':
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">Review</span>;
      case 'finalization':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Finalization</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{phase}</span>;
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

  const getResolutionStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'in-progress':
        return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><RefreshCw className="w-3 h-3" /> In Progress</span>;
      case 'resolved':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Resolved</span>;
      case 'blocked':
        return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium flex items-center gap-1"><XCircle className="w-3 h-3" /> Blocked</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Projects</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <GitBranch className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">8 in development, 4 in review</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Reviews</p>
              <p className="text-2xl font-bold">9</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Eye className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">3 due this week</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Open Resolutions</p>
              <p className="text-2xl font-bold">6</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">2 critical issues</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold">24</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">This quarter</div>
        </div>
      </div>

      {/* Subtabs Navigation */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveSubTab('development')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeSubTab === 'development' 
                ? 'text-orange-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Qualifications Development Phase
            </div>
            {activeSubTab === 'development' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('resolution')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeSubTab === 'resolution' 
                ? 'text-orange-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Resolution Phase
            </div>
            {activeSubTab === 'resolution' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* Qualifications Development Phase Tab */}
      {activeSubTab === 'development' && (
        <div className="space-y-4">
          {/* Development Controls */}
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3 justify-between">
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64"
                />
              </div>
              <select className="border rounded-lg px-3 py-2 text-sm">
                <option value="">All Phases</option>
                <option value="drafting">Drafting</option>
                <option value="consultation">Consultation</option>
                <option value="review">Review</option>
                <option value="finalization">Finalization</option>
              </select>
              <select className="border rounded-lg px-3 py-2 text-sm">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Development Project
            </button>
          </div>

          {/* Development Projects Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phase</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Developer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timeline</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {developmentProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{project.id}</td>
                      <td className="px-4 py-3 text-sm">{project.qualificationTitle}</td>
                      <td className="px-4 py-3">{getPhaseBadge(project.phase)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-600 h-2 rounded-full" 
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{project.leadDeveloper}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>{project.startDate}</span>
                        </div>
                        <div className="text-xs text-gray-500">due: {project.targetDate}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          project.status === 'active' ? 'bg-green-100 text-green-700' :
                          project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewItem(project)}
                            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Upload">
                            <Upload className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Showing 1-4 of 12 projects</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">Previous</button>
              <button className="px-3 py-1 bg-orange-600 text-white rounded text-sm">1</button>
              <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">2</button>
              <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">3</button>
              <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Phase Tab */}
      {activeSubTab === 'resolution' && (
        <div className="space-y-4">
          {/* Resolution Controls */}
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3 justify-between">
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search resolutions..."
                  className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64"
                />
              </div>
              <select className="border rounded-lg px-3 py-2 text-sm">
                <option value="">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select className="border rounded-lg px-3 py-2 text-sm">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <button className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Resolution Item
            </button>
          </div>

          {/* Resolution Items Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported By</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resolutionItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{item.id}</td>
                      <td className="px-4 py-3 text-sm">{item.qualificationTitle}</td>
                      <td className="px-4 py-3 text-sm capitalize">{item.issueType.replace('_', ' ')}</td>
                      <td className="px-4 py-3">{getPriorityBadge(item.priority)}</td>
                      <td className="px-4 py-3">{getResolutionStatusBadge(item.status)}</td>
                      <td className="px-4 py-3 text-sm">{item.reportedBy}</td>
                      <td className="px-4 py-3 text-sm">{item.reportedDate}</td>
                      <td className="px-4 py-3 text-sm">{item.assignedTo}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewItem(item)}
                            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Assign">
                            <UserCheck className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Showing 1-4 of 6 resolution items</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">Previous</button>
              <button className="px-3 py-1 bg-orange-600 text-white rounded text-sm">1</button>
              <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">2</button>
              <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">Next</button>
            </div>
          </div>

          {/* Resolution Summary */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h4 className="font-medium mb-3">Resolution Summary</h4>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold text-gray-800">6</p>
                <p className="text-xs text-gray-500">Open Issues</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">2</p>
                <p className="text-xs text-gray-500">Critical Priority</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">3</p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">8</p>
                <p className="text-xs text-gray-500">Resolved This Month</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Development Project Modal */}
      <DevelopmentProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        project={selectedItem}
        mode={activeSubTab}
      />
    </div>
  );
}