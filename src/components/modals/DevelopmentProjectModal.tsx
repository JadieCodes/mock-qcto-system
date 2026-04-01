// components/modals/DevelopmentProjectModal.tsx
import React, { useState } from 'react';
import {
  X,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  User,
  Calendar,
  Users,
  MessageSquare,
  Edit,
  Upload,
  GitBranch,
  Award,
  TrendingUp,
  Paperclip,
  Tag,
  ChevronRight,
  ChevronLeft,
  Printer,
  Share2,
  Plus
} from 'lucide-react';

interface DevelopmentProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any | null;
  mode: 'development' | 'resolution';
}

export default function DevelopmentProjectModal({ 
  isOpen, 
  onClose, 
  project,
  mode 
}: DevelopmentProjectModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'team' | 'timeline' | 'comments'>('overview');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  if (!isOpen || !project) return null;

  // Mock data for development project
  const projectDocuments = [
    { id: 1, name: 'Curriculum Framework', file: 'curriculum_v2.pdf', size: '3.2 MB', uploadedBy: 'Dr. Sarah Johnson', uploadedDate: '2024-03-10', version: 'v2.0', status: 'approved' },
    { id: 2, name: 'Assessment Guidelines', file: 'assessment_guide.pdf', size: '2.1 MB', uploadedBy: 'Dr. Sarah Johnson', uploadedDate: '2024-03-12', version: 'v1.5', status: 'review' },
    { id: 3, name: 'Learning Materials', file: 'learning_materials.docx', size: '5.7 MB', uploadedBy: 'John Smith', uploadedDate: '2024-03-14', version: 'v1.0', status: 'draft' },
    { id: 4, name: 'Stakeholder Feedback', file: 'feedback.pdf', size: '1.8 MB', uploadedBy: 'Emily Brown', uploadedDate: '2024-03-15', version: 'v1.0', status: 'pending' }
  ];

  const teamMembers = [
    { id: 1, name: 'Dr. Sarah Johnson', role: 'Lead Developer', avatar: 'SJ', email: 's.johnson@edu.org', tasks: 5 },
    { id: 2, name: 'John Smith', role: 'Curriculum Specialist', avatar: 'JS', email: 'j.smith@edu.org', tasks: 3 },
    { id: 3, name: 'Emily Brown', role: 'Assessment Designer', avatar: 'EB', email: 'e.brown@edu.org', tasks: 4 },
    { id: 4, name: 'Michael Chen', role: 'Subject Matter Expert', avatar: 'MC', email: 'm.chen@edu.org', tasks: 2 }
  ];

  const timelineItems = [
    { id: 1, phase: 'Initiation', startDate: '2024-02-01', endDate: '2024-02-15', status: 'completed', progress: 100 },
    { id: 2, phase: 'Drafting', startDate: '2024-02-16', endDate: '2024-03-15', status: 'completed', progress: 100 },
    { id: 3, phase: 'Consultation', startDate: '2024-03-16', endDate: '2024-04-15', status: 'in-progress', progress: 45 },
    { id: 4, phase: 'Review', startDate: '2024-04-16', endDate: '2024-05-15', status: 'pending', progress: 0 },
    { id: 5, phase: 'Finalization', startDate: '2024-05-16', endDate: '2024-05-30', status: 'pending', progress: 0 }
  ];

  const comments = [
    { id: 1, user: 'Dr. Sarah Johnson', role: 'Lead Developer', date: '2024-03-15 10:30', comment: 'Completed the curriculum framework draft. Ready for review.', type: 'update' },
    { id: 2, user: 'Prof. Michael Chen', role: 'Reviewer', date: '2024-03-16 14:15', comment: 'Curriculum alignment with NQF levels needs verification.', type: 'feedback' },
    { id: 3, user: 'Emily Brown', role: 'Assessment Designer', date: '2024-03-17 09:45', comment: 'Working on assessment guidelines. Will submit by Friday.', type: 'update' }
  ];

  // Mock data for resolution items
  const resolutionDetails = {
    issueType: project.issueType || 'curriculum_alignment',
    priority: project.priority || 'high',
    description: project.description || 'Curriculum needs alignment with new industry standards',
    rootCause: 'Industry standards updated in January 2024',
    impact: 'High - affects graduate employability',
    resolution: 'Update curriculum modules 3, 4, and 7 to reflect PMBOK 7th edition',
    dueDate: '2024-04-15',
    assignedTo: project.assignedTo || 'Curriculum Committee',
    stakeholders: ['Academic Board', 'Industry Panel', 'Quality Council']
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'review': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'draft': return <FileText className="w-4 h-4 text-gray-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPhaseStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-orange-50 to-white">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-800">
                {mode === 'development' ? 'Development Project Details' : 'Resolution Item Details'}
              </h2>
              {mode === 'development' ? (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  project.phase === 'drafting' ? 'bg-gray-100 text-gray-700' :
                  project.phase === 'consultation' ? 'bg-blue-100 text-blue-700' :
                  project.phase === 'review' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {project.phase?.charAt(0).toUpperCase() + project.phase?.slice(1)}
                </span>
              ) : (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  project.priority === 'critical' ? 'bg-red-100 text-red-700' :
                  project.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                  project.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {project.priority?.toUpperCase()} Priority
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              ID: {project.id} | {mode === 'development' ? `Progress: ${project.progress}%` : `Reported: ${project.reportedDate}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="Print">
              <Printer className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar (for development mode) */}
        {mode === 'development' && (
          <div className="px-6 py-3 bg-orange-50 border-b">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-bold text-orange-600">{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-orange-600 h-2.5 rounded-full" 
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 border-b">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'overview' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'documents' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Documents
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'team' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Team
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'timeline' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'comments' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Comments
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {mode === 'development' ? (
                <>
                  {/* Development Overview */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <GitBranch className="w-4 h-4" />
                        Project Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Qualification Title</p>
                          <p className="text-sm font-medium">{project.qualificationTitle}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Lead Developer</p>
                          <p className="text-sm font-medium">{project.leadDeveloper}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Timeline</p>
                          <p className="text-sm font-medium">{project.startDate} - {project.targetDate}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Phase Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Current Phase</p>
                          <p className="text-sm font-medium capitalize">{project.phase}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Team Size</p>
                          <p className="text-sm font-medium">{project.team.length} members</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reviews */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">Pending Reviews</h3>
                    <div className="space-y-3">
                      {project.reviews.map((review: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                          <div>
                            <p className="font-medium">{review.reviewer}</p>
                            <p className="text-xs text-gray-500">Due: {review.date}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            review.status === 'completed' ? 'bg-green-100 text-green-700' :
                            review.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {review.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Resolution Overview */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Issue Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Issue Type</p>
                          <p className="text-sm font-medium capitalize">{resolutionDetails.issueType.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Description</p>
                          <p className="text-sm">{resolutionDetails.description}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Root Cause</p>
                          <p className="text-sm">{resolutionDetails.rootCause}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Impact & Resolution
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Impact</p>
                          <p className="text-sm">{resolutionDetails.impact}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Proposed Resolution</p>
                          <p className="text-sm">{resolutionDetails.resolution}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Due Date</p>
                          <p className="text-sm font-medium">{resolutionDetails.dueDate}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stakeholders */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">Stakeholders</h3>
                    <div className="flex flex-wrap gap-2">
                      {resolutionDetails.stakeholders.map((stakeholder: string, idx: number) => (
                        <span key={idx} className="bg-white px-3 py-1.5 rounded-full text-sm border">
                          {stakeholder}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {selectedDocument ? (
                <div>
                  <button 
                    onClick={() => setSelectedDocument(null)}
                    className="flex items-center gap-1 text-sm text-orange-600 mb-4"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Documents
                  </button>
                  <div className="border rounded-lg p-8 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="font-medium">{selectedDocument}</p>
                    <p className="text-sm text-gray-500 mt-2">Document preview would appear here</p>
                    <div className="flex justify-center gap-4 mt-4">
                      <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">
                        Download
                      </button>
                      <button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                        Print
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {projectDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(doc.status)}
                              <span className="text-sm font-medium">{doc.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{doc.version}</td>
                          <td className="px-4 py-3 text-sm">{doc.uploadedBy}</td>
                          <td className="px-4 py-3 text-sm">{doc.uploadedDate}</td>
                          <td className="px-4 py-3 text-sm">{doc.size}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                              doc.status === 'review' ? 'bg-blue-100 text-blue-700' :
                              doc.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setSelectedDocument(doc.name)}
                                className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="bg-gray-50 p-4 rounded-lg flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold">
                      {member.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                        <span className="text-xs bg-white px-2 py-1 rounded-full">
                          {member.tasks} tasks
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                  <Plus className="w-4 h-4" />
                  Add Team Member
                </button>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="relative">
                {timelineItems.map((item, index) => (
                  <div key={item.id} className="flex gap-4 pb-6 relative">
                    {index < timelineItems.length - 1 && (
                      <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200"></div>
                    )}
                    <div className="relative z-10">
                      <div className={`w-4 h-4 rounded-full ${
                        item.status === 'completed' ? 'bg-green-500' :
                        item.status === 'in-progress' ? 'bg-blue-500' :
                        'bg-gray-300'
                      }`}></div>
                    </div>
                    <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item.phase}</p>
                          <p className="text-sm text-gray-600">{item.startDate} - {item.endDate}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${getPhaseStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          {item.status === 'in-progress' && (
                            <p className="text-xs text-gray-500 mt-1">{item.progress}% complete</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{comment.user}</span>
                          <span className="text-xs text-gray-500">{comment.role}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            comment.type === 'update' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {comment.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{comment.comment}</p>
                      </div>
                      <p className="text-xs text-gray-400">{comment.date}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <textarea
                  placeholder="Add a comment..."
                  className="w-full border rounded-lg p-3 text-sm"
                  rows={3}
                />
                <div className="flex justify-end mt-2 gap-2">
                  <button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">
                    Add Comment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="flex gap-2">
            <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            {mode === 'development' ? (
              <>
                <button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100">
                  Save Progress
                </button>
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">
                  Update Project
                </button>
              </>
            ) : (
              <>
                <button className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100">
                  Add Comment
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  Mark Resolved
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}