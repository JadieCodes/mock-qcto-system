// components/modals/ApplicationDetailsModal.tsx
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
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  ChevronLeft,
  Printer,
  Share2,
  History,
  Upload
} from 'lucide-react';
import type { Application } from '@/types';

interface ApplicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  mode: 'documentReview' | 'resolution';
  onDocumentReviewComplete?: (id: string, allDocsPresent: boolean, notes: string) => void;
  onResolutionComplete?: (id: string, checklist: any, completed: boolean) => void;
}

export default function ApplicationDetailsModal({ 
  isOpen, 
  onClose, 
  application,
  mode,
  onDocumentReviewComplete,
  onResolutionComplete
}: ApplicationDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'history' | 'notes'>('details');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  
  // Document Review Checklist State
  const [documentChecklist, setDocumentChecklist] = useState({
    applicationLetter: !!application?.documents?.applicationLetter,
    motivation: !!application?.documents?.motivation,
    reference: !!application?.documents?.reference,
    acrLetter: !!application?.documents?.acrLetter
  });
  
  // Resolution Checklist State
  const [resolutionChecklist, setResolutionChecklist] = useState({
    qualificationDesign: true,
    draftReport: !!application?.report,
    applicationLetter: !!application?.documents?.applicationLetter,
    motivation: !!application?.documents?.motivation,
    reference: !!application?.documents?.reference,
    acrLetter: !!application?.documents?.acrLetter
  });
  
  const [notes, setNotes] = useState('');

  if (!isOpen || !application) return null;

  // Mock data for demonstration - in real app, this would come from props/API
  const applicantDetails = {
    fullName: application.applicantName,
    email: 'john.smith@email.com',
    phone: '+27 12 345 6789',
    address: '123 Main Street, Johannesburg, 2001',
    idNumber: '900101 5084 089',
    dateOfBirth: '1990-01-01',
    nationality: 'South African'
  };

  const qualificationDetails = {
    title: application.qualification,
    nqfLevel: '7',
    credits: 120,
    saqaId: '97654',
    field: 'Business, Commerce and Management Studies',
    subfield: 'Project Management'
  };

  const documentList = [
    { id: 'applicationLetter', name: 'Application Letter', file: application.documents?.applicationLetter, status: 'verified', size: '2.4 MB', uploadedDate: application.submissionDate },
    { id: 'motivation', name: 'Motivation Letter', file: application.documents?.motivation, status: application.documents?.motivation ? 'verified' : 'pending', size: '1.1 MB', uploadedDate: application.submissionDate },
    { id: 'reference', name: 'Reference', file: application.documents?.reference, status: application.documents?.reference ? 'verified' : 'pending', size: '3.2 MB', uploadedDate: application.submissionDate },
    { id: 'acrLetter', name: 'ACR Letter', file: application.documents?.acrLetter, status: application.documents?.acrLetter ? 'verified' : 'pending', size: '5.7 MB', uploadedDate: application.submissionDate },
  ];

  const historyItems = [
    { action: 'Application Submitted', user: 'System', date: application.submissionDate, description: 'Application received and logged' },
    ...(application.documentReview ? [
      { action: 'Document Review Completed', user: application.documentReview.reviewedBy, date: application.documentReview.reviewDate, description: application.documentReview.notes }
    ] : []),
    ...(application.resolution ? [
      { action: 'Resolution Completed', user: application.resolution.reviewedBy, date: application.resolution.reviewDate, description: application.resolution.notes }
    ] : [])
  ];

  const notesList = application.documentReview ? [
    { user: application.documentReview.reviewedBy, role: 'Reviewer', date: application.documentReview.reviewDate, note: application.documentReview.notes }
  ] : [];

  // Handle Document Review Completion
  const handleDocumentReview = (allDocsPresent: boolean) => {
    if (onDocumentReviewComplete) {
      onDocumentReviewComplete(application.id, allDocsPresent, notes);
      onClose();
    }
  };

  // Handle Resolution Completion
  const handleResolution = (completed: boolean) => {
    if (onResolutionComplete) {
      onResolutionComplete(application.id, { ...resolutionChecklist, notes }, completed);
      onClose();
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'flagged':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Application Details</h2>
            <p className="text-sm text-gray-500 mt-1">ID: {application.id} | Submitted: {application.submissionDate}</p>
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

        {/* Status Bar */}
        <div className="px-6 py-3 bg-blue-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Current Status:</span>
            {application.status === 'submitted' && <span className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">Pending Document Review</span>}
            {application.status === 'document_review' && <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">Document Review</span>}
            {application.status === 'resolution' && <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">Resolution</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Documents
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'notes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Notes
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Applicant Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Applicant Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="text-sm font-medium">{applicantDetails.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium">{applicantDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{applicantDetails.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ID Number</p>
                    <p className="text-sm font-medium">{applicantDetails.idNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date of Birth</p>
                    <p className="text-sm font-medium">{applicantDetails.dateOfBirth}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Nationality</p>
                    <p className="text-sm font-medium">{applicantDetails.nationality}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm font-medium">{applicantDetails.address}</p>
                  </div>
                </div>
              </div>

              {/* Qualification Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Qualification Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Qualification Title</p>
                    <p className="text-sm font-medium">{qualificationDetails.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">SAQA ID</p>
                    <p className="text-sm font-medium">{qualificationDetails.saqaId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">NQF Level</p>
                    <p className="text-sm font-medium">Level {qualificationDetails.nqfLevel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Credits</p>
                    <p className="text-sm font-medium">{qualificationDetails.credits}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Field</p>
                    <p className="text-sm font-medium">{qualificationDetails.field}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Subfield</p>
                    <p className="text-sm font-medium">{qualificationDetails.subfield}</p>
                  </div>
                </div>
              </div>

              {/* Draft Report */}
              {application.report && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Draft Report
                  </h3>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                    <pre className="whitespace-pre-wrap">
                      {application.report.draftReport}
                    </pre>
                  </div>
                </div>
              )}

              {/* Document Review Checklist - Only shown in documentReview mode */}
              {mode === 'documentReview' && (
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-blue-200">
                  <h3 className="font-medium mb-3 text-blue-700">Document Review Checklist</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium">Application Letter</span>
                      <div className="flex items-center gap-2">
                        {documentChecklist.applicationLetter ? 
                          <CheckCircle className="w-5 h-5 text-green-500" /> : 
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        }
                        <input
                          type="checkbox"
                          checked={documentChecklist.applicationLetter}
                          onChange={(e) => setDocumentChecklist({ ...documentChecklist, applicationLetter: e.target.checked })}
                          className="rounded w-4 h-4"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium">Motivation</span>
                      <div className="flex items-center gap-2">
                        {documentChecklist.motivation ? 
                          <CheckCircle className="w-5 h-5 text-green-500" /> : 
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        }
                        <input
                          type="checkbox"
                          checked={documentChecklist.motivation}
                          onChange={(e) => setDocumentChecklist({ ...documentChecklist, motivation: e.target.checked })}
                          className="rounded w-4 h-4"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium">Reference</span>
                      <div className="flex items-center gap-2">
                        {documentChecklist.reference ? 
                          <CheckCircle className="w-5 h-5 text-green-500" /> : 
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        }
                        <input
                          type="checkbox"
                          checked={documentChecklist.reference}
                          onChange={(e) => setDocumentChecklist({ ...documentChecklist, reference: e.target.checked })}
                          className="rounded w-4 h-4"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium">ACR Letter</span>
                      <div className="flex items-center gap-2">
                        {documentChecklist.acrLetter ? 
                          <CheckCircle className="w-5 h-5 text-green-500" /> : 
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        }
                        <input
                          type="checkbox"
                          checked={documentChecklist.acrLetter}
                          onChange={(e) => setDocumentChecklist({ ...documentChecklist, acrLetter: e.target.checked })}
                          className="rounded w-4 h-4"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border rounded-lg p-2 text-sm"
                      rows={3}
                      placeholder="Add review notes..."
                    />
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleDocumentReview(true)}
                      className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      ✓ Yes - All Documents Present
                    </button>
                    <button
                      onClick={() => handleDocumentReview(false)}
                      className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      ✗ No - Documents Missing
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Clicking "Yes" will move this application to Resolution phase
                  </p>
                </div>
              )}

              {/* Resolution Checklist - Only shown in resolution mode */}
              {mode === 'resolution' && (
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-purple-200">
                  <h3 className="font-medium mb-3 text-purple-700">Evaluation Checklist</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium">Qualification Design Application</span>
                      <input
                        type="checkbox"
                        checked={resolutionChecklist.qualificationDesign}
                        onChange={(e) => setResolutionChecklist({ ...resolutionChecklist, qualificationDesign: e.target.checked })}
                        className="rounded w-4 h-4"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium">Draft Report</span>
                      <input
                        type="checkbox"
                        checked={resolutionChecklist.draftReport}
                        onChange={(e) => setResolutionChecklist({ ...resolutionChecklist, draftReport: e.target.checked })}
                        className="rounded w-4 h-4"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium">Application Letter</span>
                      <input
                        type="checkbox"
                        checked={resolutionChecklist.applicationLetter}
                        onChange={(e) => setResolutionChecklist({ ...resolutionChecklist, applicationLetter: e.target.checked })}
                        className="rounded w-4 h-4"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium">Motivation</span>
                      <input
                        type="checkbox"
                        checked={resolutionChecklist.motivation}
                        onChange={(e) => setResolutionChecklist({ ...resolutionChecklist, motivation: e.target.checked })}
                        className="rounded w-4 h-4"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium">Reference</span>
                      <input
                        type="checkbox"
                        checked={resolutionChecklist.reference}
                        onChange={(e) => setResolutionChecklist({ ...resolutionChecklist, reference: e.target.checked })}
                        className="rounded w-4 h-4"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium">ACR Letter</span>
                      <input
                        type="checkbox"
                        checked={resolutionChecklist.acrLetter}
                        onChange={(e) => setResolutionChecklist({ ...resolutionChecklist, acrLetter: e.target.checked })}
                        className="rounded w-4 h-4"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border rounded-lg p-2 text-sm"
                      rows={3}
                      placeholder="Add resolution notes..."
                    />
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleResolution(true)}
                      className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      ✓ Complete - Move to Evaluation
                    </button>
                    <button
                      onClick={() => handleResolution(false)}
                      className="flex-1 bg-yellow-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                    >
                      ⚠ Incomplete - Return to Review
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Clicking "Complete" will move this application to Initial Evaluation phase
                  </p>
                </div>
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
                    className="flex items-center gap-1 text-sm text-blue-600 mb-4"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Documents
                  </button>
                  <div className="border rounded-lg p-8 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="font-medium">{selectedDocument}</p>
                    <p className="text-sm text-gray-500 mt-2">Document preview would appear here</p>
                    <div className="flex justify-center gap-4 mt-4">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {documentList.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium">{doc.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{doc.uploadedDate}</td>
                          <td className="px-4 py-3 text-sm">{doc.size}</td>
                          <td className="px-4 py-3">{getStatusBadge(doc.status)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setSelectedDocument(doc.name)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Download">
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

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="relative">
                {historyItems.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-6 relative">
                    {index < historyItems.length - 1 && (
                      <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200"></div>
                    )}
                    <div className="relative z-10">
                      <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                    </div>
                    <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item.action}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{item.user}</p>
                          <p className="text-xs text-gray-400">{item.date}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {notesList.map((note, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{note.user}</p>
                        <p className="text-xs text-gray-500">{note.role}</p>
                      </div>
                      <p className="text-xs text-gray-400">{note.date}</p>
                    </div>
                    <p className="text-sm mt-2">{note.note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <textarea
                  placeholder="Add a new note..."
                  className="w-full border rounded-lg p-3 text-sm"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    Add Note
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}