// pages/internal/InternalEvaluations.tsx
import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  FileText, 
  CheckCircle, 
  Clock, 
  Download, 
  Calendar, 
  User,
  AlertCircle,
  MessageSquare,
  Filter,
  Search,
  BarChart3,
  Star,
  Award,
  TrendingUp,
  Upload,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import EvaluationDetailsModal from '@/components/modals/EvaluationDetailsModal';
import { getApplications, updateApplication } from '@/lib/applicationStorage';
import type { Application } from '@/types';

export default function InternalEvaluations() {
  const [activeTab, setActiveTab] = useState<'initial' | 'summary'>('initial');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    setApplications(getApplications());
  }, []);

  // Filter applications based on status
  const initialEvaluationApps = applications.filter(app => app.status === 'evaluation');
  const summaryApps = applications.filter(app => app.status === 'evaluation_summary');

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApplication(null);
    setApplications(getApplications());
  };

  const handleEvaluationComplete = (id: string, checklist: any, approved: boolean) => {
    const updatedApp = updateApplication(id, {
      status: approved ? 'evaluation_summary' : 'rejected',
      evaluation: {
        ...checklist,
        approved: approved,
        reviewedBy: 'Current User',
        reviewDate: new Date().toISOString(),
        notes: checklist.notes,
        checklistCompleted: true
      }
    });
    
    if (updatedApp) {
      setApplications(getApplications());
    }
  };

  const handleSummaryComplete = (id: string, resolution: string, resolutionFile: string | null, recommended: boolean) => {
    const updatedApp = updateApplication(id, {
      status: 'approved',
      evaluationSummary: {
        resolution: resolution,
        resolutionUploaded: resolutionFile,
        recommended: recommended,
        submitted: true,
        approvalLetter: null,
        approvalDate: new Date().toISOString(),
        approvedBy: 'Current User'
      }
    });
    
    if (updatedApp) {
      setApplications(getApplications());
    }
  };

 const handleApprovalLetterUpload = (id: string, file: string) => {
  const app = applications.find(a => a.id === id);

  if (app) {
    updateApplication(id, {
      evaluationSummary: {
        resolution: app.evaluationSummary?.resolution || '',
        resolutionUploaded: app.evaluationSummary?.resolutionUploaded || null,
        recommended: app.evaluationSummary?.recommended || false,
        approvalDate: app.evaluationSummary?.approvalDate || new Date().toISOString(),
        approvedBy: app.evaluationSummary?.approvedBy || 'Current User',

        approvalLetter: file,
        submitted: true
      }
    });

    setApplications(getApplications());
  }
};

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'evaluation':
        return 'bg-yellow-100 text-yellow-800';
      case 'evaluation_summary':
        return 'bg-purple-100 text-purple-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Internal Evaluations</h1>
        <p className="text-gray-500 mt-2">
          Review and evaluate qualification submissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Initial Evaluation</p>
              <p className="text-2xl font-bold">{initialEvaluationApps.length}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Evaluation Summary</p>
              <p className="text-2xl font-bold">{summaryApps.length}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold">
                {applications.filter(app => app.status === 'approved').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold">
                {applications.filter(app => app.status === 'rejected').length}
              </p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('initial')}
            className={`pb-4 px-1 relative ${
              activeTab === 'initial'
                ? 'text-purple-600 border-b-2 border-purple-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Initial Evaluation ({initialEvaluationApps.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-4 px-1 relative ${
              activeTab === 'summary'
                ? 'text-purple-600 border-b-2 border-purple-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Evaluation Summary ({summaryApps.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'initial' ? (
        <InitialEvaluation 
          applications={initialEvaluationApps}
          onViewApplication={handleViewApplication}
          getStatusColor={getStatusColor}
        />
      ) : (
        <EvaluationSummary 
          applications={summaryApps}
          onViewApplication={handleViewApplication}
          onSummaryComplete={handleSummaryComplete}
          onApprovalLetterUpload={handleApprovalLetterUpload}
        />
      )}

      {/* Evaluation Details Modal */}
      <EvaluationDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        application={selectedApplication}
        onEvaluationComplete={handleEvaluationComplete}
      />
    </div>
  );
}

// Initial Evaluation Component
function InitialEvaluation({ applications, onViewApplication, getStatusColor }: any) {
  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search evaluations..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <Filter className="w-5 h-5" />
          Filter
        </button>
      </div>

      {/* Evaluations Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Application ID</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Applicant</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Qualification</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Submission Date</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Documents</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {applications.length > 0 ? (
              applications.map((app: Application) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 text-sm font-medium">{app.id}</td>
                  <td className="py-4 px-6 text-sm">{app.applicantName}</td>
                  <td className="py-4 px-6 text-sm">{app.qualification}</td>
                  <td className="py-4 px-6 text-sm">{app.submissionDate}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                      Initial Evaluation
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-1">
                      {app.documents.applicationLetter && <span className="text-xs bg-green-100 text-green-700 px-1 rounded">AL</span>}
                      {app.documents.motivation && <span className="text-xs bg-green-100 text-green-700 px-1 rounded">M</span>}
                      {app.documents.reference && <span className="text-xs bg-green-100 text-green-700 px-1 rounded">R</span>}
                      {app.documents.acrLetter && <span className="text-xs bg-green-100 text-green-700 px-1 rounded">ACR</span>}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <button 
                      onClick={() => onViewApplication(app)}
                      className="p-1 hover:bg-purple-50 rounded text-purple-600"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No applications pending initial evaluation</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Evaluation Summary Component
function EvaluationSummary({ applications, onViewApplication, onSummaryComplete, onApprovalLetterUpload }: any) {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [resolutionFile, setResolutionFile] = useState<string | null>(null);
  const [recommended, setRecommended] = useState(false);

  const handleSubmit = (appId: string) => {
    onSummaryComplete(appId, resolution, resolutionFile, recommended);
    setSelectedApp(null);
    setResolution('');
    setResolutionFile(null);
    setRecommended(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResolutionFile(file.name);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl shadow-sm border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Ready for Summary</p>
              <p className="text-3xl font-bold text-gray-900">{applications.length}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl shadow-sm border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Resolution Pending</p>
              <p className="text-3xl font-bold text-gray-900">
                {applications.filter((a: Application) => !a.evaluationSummary?.submitted).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Approval Letters</p>
              <p className="text-3xl font-bold text-gray-900">
                {applications.filter((a: Application) => !a.evaluationSummary?.approvalLetter).length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {applications.map((app: Application) => (
          <div key={app.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold">{app.applicantName}</h4>
                  <span className="text-sm text-gray-500">{app.id}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    Evaluation Summary
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{app.qualification}</p>
                
                {/* Resolution Section */}
                {selectedApp === app.id ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resolution / Recommendation
                      </label>
                      <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        className="w-full border rounded-lg p-3 text-sm"
                        rows={3}
                        placeholder="Enter resolution details..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Resolution Document
                      </label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="resolution-upload"
                        />
                        <label
                          htmlFor="resolution-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">
                            {resolutionFile || 'Click to upload resolution document'}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={recommended}
                          onChange={(e) => setRecommended(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">Recommend Approval</span>
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSubmit(app.id)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
                      >
                        Submit Resolution
                      </button>
                      <button
                        onClick={() => setSelectedApp(null)}
                        className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : app.evaluationSummary?.submitted ? (
                  <div className="mt-4 space-y-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium">Resolution:</p>
                      <p className="text-sm text-gray-600 mt-1">{app.evaluationSummary.resolution}</p>
                      {app.evaluationSummary.recommended && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full inline-block mt-2">
                          ✓ Recommended
                        </span>
                      )}
                    </div>
                    
                    {!app.evaluationSummary.approvalLetter ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload Approval Letter
                        </label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          <input
                            type="file"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                onApprovalLetterUpload(app.id, e.target.files[0].name);
                              }
                            }}
                            className="hidden"
                            id={`approval-${app.id}`}
                          />
                          <label
                            htmlFor={`approval-${app.id}`}
                            className="cursor-pointer flex flex-col items-center"
                          >
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">Click to upload approval letter</span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm">Approval letter uploaded</span>
                        </div>
                        <button className="text-blue-600 text-sm hover:underline">Download</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setSelectedApp(app.id)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
                    >
                      Add Resolution
                    </button>
                    <button
                      onClick={() => onViewApplication(app)}
                      className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
                    >
                      View Details
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}