// pages/internal/InternalApplications.tsx
import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  FileText, 
  CheckCircle, 
  Clock, 
  Download, 
  Calendar, 
  AlertCircle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Search,
  Filter
} from 'lucide-react';
import ApplicationDetailsModal from '@/components/modals/ApplicationDetailsModal';
import { getApplications, updateApplication } from '@/lib/applicationStorage'; 
import type { Application } from '@/types';

export default function InternalApplications() {
  const [activeSubTab, setActiveSubTab] = useState<'documentReview' | 'resolution'>('documentReview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  // Load applications from localStorage on mount
  useEffect(() => {
    setApplications(getApplications());
  }, []);

  // Filter applications based on active tab
  const documentReviewApps = applications.filter(app => app.status === 'submitted');
  const resolutionApps = applications.filter(app => app.status === 'document_review');

  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApplication(null);
    // Refresh applications
    setApplications(getApplications());
  };

  const handleDocumentReviewComplete = (id: string, allDocsPresent: boolean, notes: string) => {
    console.log('Document Review Complete:', { id, allDocsPresent, notes });
    const updatedApp = updateApplication(id, {
      status: allDocsPresent ? 'document_review' : 'submitted',
      documentReview: {
        allDocumentsPresent: allDocsPresent,
        reviewedBy: 'Current User',
        reviewDate: new Date().toISOString(),
        notes: notes
      }
    });
    
    if (updatedApp) {
      console.log('Updated app:', updatedApp);
      setApplications(getApplications());
    }
  };

  const handleResolutionComplete = (id: string, checklist: any, completed: boolean) => {
    console.log('Resolution Complete:', { id, checklist, completed });
    const updatedApp = updateApplication(id, {
      status: completed ? 'evaluation' : 'document_review',
      resolution: {
        ...checklist,
        completed: completed,
        reviewedBy: 'Current User',
        reviewDate: new Date().toISOString(),
        notes: checklist.notes
      }
    });
    
    if (updatedApp) {
      console.log('Updated app:', updatedApp);
      setApplications(getApplications());
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    switch(status) {
      case 'verified':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>;
      case 'pending':
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'flagged':
        return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Flagged</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  const getApplicationStatusBadge = (status: string) => {
    switch(status) {
      case 'submitted':
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full font-medium">Pending Review</span>;
      case 'document_review':
        return <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-medium">Document Review</span>;
      case 'resolution':
        return <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-medium">Resolution</span>;
      case 'evaluation':
        return <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-medium">Evaluation</span>;
      case 'evaluation_summary':
        return <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-medium">Evaluation Summary</span>;
      case 'approved':
        return <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">Approved</span>;
      case 'rejected':
        return <span className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full font-medium">Rejected</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Applications</p>
              <p className="text-2xl font-bold">{applications.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">{documentReviewApps.length} pending review</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold">{documentReviewApps.length}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Awaiting document check</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Resolution</p>
              <p className="text-2xl font-bold">{resolutionApps.length}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Under review</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Evaluation</p>
              <p className="text-2xl font-bold">
                {applications.filter(app => app.status === 'evaluation').length}
              </p>
            </div>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">Ready for evaluation</div>
        </div>
      </div>

      {/* Subtabs Navigation */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveSubTab('documentReview')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeSubTab === 'documentReview' 
                ? 'text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Document Review ({documentReviewApps.length})
            </div>
            {activeSubTab === 'documentReview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('resolution')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeSubTab === 'resolution' 
                ? 'text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Resolution of Applications ({resolutionApps.length})
            </div>
            {activeSubTab === 'resolution' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* Document Review Tab Content */}
      {activeSubTab === 'documentReview' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by applicant or application ID..."
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {/* Document Review Table - Removed Documents Column */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Application ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submission Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documentReviewApps.length > 0 ? (
                  documentReviewApps.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{app.id}</td>
                      <td className="px-4 py-3 text-sm">{app.applicantName}</td>
                      <td className="px-4 py-3 text-sm max-w-[200px] truncate">{app.qualification}</td>
                      <td className="px-4 py-3 text-sm">{app.submissionDate}</td>
                      <td className="px-4 py-3">{getApplicationStatusBadge(app.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewApplication(app)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded" 
                            title="View Application"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No applications pending document review</p>
                      <p className="text-sm">Applications submitted from the external portal will appear here</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resolution of Applications Tab Content */}
      {activeSubTab === 'resolution' && (
        <div className="space-y-4">
          {/* Resolution Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search applications..."
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {/* Resolution Table - Removed Documents Column */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Application ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qualification</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submission Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resolutionApps.length > 0 ? (
                  resolutionApps.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{app.id}</td>
                      <td className="px-4 py-3 text-sm">{app.applicantName}</td>
                      <td className="px-4 py-3 text-sm max-w-[200px] truncate">{app.qualification}</td>
                      <td className="px-4 py-3 text-sm">{app.submissionDate}</td>
                      <td className="px-4 py-3">{getApplicationStatusBadge(app.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewApplication(app)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded" 
                            title="View Application"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No applications in resolution phase</p>
                      <p className="text-sm">Applications that pass document review will appear here</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      <ApplicationDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        application={selectedApplication}
        mode={activeSubTab}
        onDocumentReviewComplete={handleDocumentReviewComplete}
        onResolutionComplete={handleResolutionComplete}
      />
    </div>
  );
}