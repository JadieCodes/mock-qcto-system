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
  Upload,
  ClipboardList,
  Building2,
  FileCheck,
  Target,
  BookOpen
} from 'lucide-react';
import type { Application, DraftReportData } from '@/types';

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
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'history' | 'checklist'>('details');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  
  // Document Review Checklist State
  const [documentChecklist, setDocumentChecklist] = useState({
    motivation: !!application?.documents?.motivation,
    reference: !!application?.documents?.reference,
    acrLetter: !!application?.documents?.acrLetter
  });
  
  // Resolution Checklist State
  const [resolutionChecklist, setResolutionChecklist] = useState({
    qualificationDesign: true,
    draftReport: !!application?.report,
    motivation: !!application?.documents?.motivation,
    reference: !!application?.documents?.reference,
    acrLetter: !!application?.documents?.acrLetter
  });
  
  const [notes, setNotes] = useState('');

  if (!isOpen || !application) return null;
  
  const draftReportData: DraftReportData | null =
    application.report &&
    application.report.draftReport &&
    typeof application.report.draftReport !== 'string'
      ? (application.report.draftReport as DraftReportData)
      : null;

  // Format display values
  const formatBoolean = (value: boolean | undefined) => {
    if (value === undefined) return 'Not specified';
    return value ? '✓ Yes' : '✗ No';
  };

  const getQualificationTypeDisplay = (type: string | undefined) => {
    if (!type) return 'Not specified';
    return type;
  };

  const getActionTypeDisplay = (type: string | undefined) => {
    if (!type) return 'Not specified';
    return type;
  };

  const documentList = [
    { id: 'motivation', name: 'Motivation Letter', file: application.documents?.motivation, uploadedDate: application.submissionDate },
    { id: 'reference', name: 'Reference', file: application.documents?.reference, uploadedDate: application.submissionDate },
    { id: 'acrLetter', name: 'ACR Letter', file: application.documents?.acrLetter, uploadedDate: application.submissionDate },
    { id: 'other', name: 'Other Document', file: application.documents?.other, uploadedDate: application.submissionDate },
  ];

  const historyItems = [
    { action: 'Application Submitted', user: application.applicantName || 'System', date: application.submissionDate, description: 'Application received and logged' },
    ...(application.documentReview ? [
      { action: 'Document Review Completed', user: application.documentReview.reviewedBy, date: application.documentReview.reviewDate, description: application.documentReview.notes }
    ] : []),
    ...(application.resolution ? [
      { action: 'Resolution Completed', user: application.resolution.reviewedBy, date: application.resolution.reviewDate, description: application.resolution.notes }
    ] : [])
  ];

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">QCTO Application Details</h2>
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
              onClick={() => setActiveTab('checklist')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'checklist' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Review Checklist
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
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Details Tab - Full QCTO Application Data */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              
              {/* SECTION A: Development Requested */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                  <Target className="w-5 h-5" />
                  SECTION A: TYPE OF DEVELOPMENT REQUESTED
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Qualification Type</p>
                    <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">
                      {getQualificationTypeDisplay(application.qualificationType)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Action Type</p>
                    <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">
                      {getActionTypeDisplay(application.actionType)}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION B1: Occupation Details */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                  <Briefcase className="w-5 h-5" />
                  SECTION B1: OCCUPATION DETAILS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Occupation Title</p>
                    <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.occupationTitle || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">OFO Code</p>
                    <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.ofoCode || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Specialisation Title</p>
                    <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.specialisationTitle || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">SETA Chamber</p>
                    <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.setaChamber || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">SIC Code</p>
                    <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.sicCode || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* SECTION B2: Existing Qualification */}
              {(application.existingQualId || application.existingQualTitle) && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                    <BookOpen className="w-5 h-5" />
                    SECTION B2: EXISTING QUALIFICATION AFFECTED
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Qualification ID</p>
                      <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.existingQualId || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Qualification Title</p>
                      <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.existingQualTitle || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NQF Level</p>
                      <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.existingQualLevel || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Credits</p>
                      <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.existingQualCredits || 'Not specified'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500">Quality Partner (QP)</p>
                      <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.existingQualQP || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B3: Learnership Details */}
              {(application.learnershipRegNo || application.learnershipTitle) && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                    <Award className="w-5 h-5" />
                    SECTION B3: LEARNERSHIP DETAILS
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Learnership Registration Number</p>
                      <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.learnershipRegNo || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Learnership Title</p>
                      <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.learnershipTitle || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NQF Level</p>
                      <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.learnershipNqfLevel || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B4: Priority Alignments */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                  <FileCheck className="w-5 h-5" />
                  SECTION B4: POLICY & PRIORITY ALIGNMENTS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white px-3 py-2 rounded border text-sm">
                    <span className="font-medium">ERRP:</span> {formatBoolean(application.errp)}
                  </div>
                  <div className="bg-white px-3 py-2 rounded border text-sm">
                    <span className="font-medium">National Development Plan:</span> {formatBoolean(application.ndp)}
                  </div>
                  <div className="bg-white px-3 py-2 rounded border text-sm">
                    <span className="font-medium">New Growth Path:</span> {formatBoolean(application.ngp)}
                  </div>
                  <div className="bg-white px-3 py-2 rounded border text-sm">
                    <span className="font-medium">Industrial Policy Action Plan:</span> {formatBoolean(application.ipap)}
                  </div>
                  <div className="bg-white px-3 py-2 rounded border text-sm">
                    <span className="font-medium">Strategic Infrastructure Projects:</span> {formatBoolean(application.sips)}
                  </div>
                  <div className="bg-white px-3 py-2 rounded border text-sm">
                    <span className="font-medium">N4-N6 Reconfiguration:</span> {formatBoolean(application.n4n6Reconfig)}
                  </div>
                  <div className="bg-white px-3 py-2 rounded border text-sm">
                    <span className="font-medium">DHET Scarce Skills List:</span> {formatBoolean(application.scarceSkills)}
                  </div>
                  <div className="bg-white px-3 py-2 rounded border text-sm">
                    <span className="font-medium">Legacy OQSF Qualifications:</span> {formatBoolean(application.legacyOqsf)}
                  </div>
                  <div className="bg-white px-3 py-2 rounded border text-sm">
                    <span className="font-medium">Other Priorities:</span> {formatBoolean(application.otherPriority)}
                  </div>
                </div>
              </div>

              {/* SECTION B5: Rationale */}
              {application.rationale && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                    <MessageSquare className="w-5 h-5" />
                    SECTION B5: RATIONALE
                  </h3>
                  <div className="bg-white px-4 py-3 rounded border">
                    <p className="text-sm whitespace-pre-wrap">{application.rationale}</p>
                  </div>
                </div>
              )}

              {/* SECTION B6: Regulatory Bodies */}
              {application.regulatoryBodies && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                    <Building2 className="w-5 h-5" />
                    SECTION B6: REGULATORY BODIES & STAKEHOLDERS
                  </h3>
                  <div className="bg-white px-4 py-3 rounded border">
                    <p className="text-sm whitespace-pre-wrap">{application.regulatoryBodies}</p>
                  </div>
                </div>
              )}

              {/* SECTION C: Quality Partner & Applicant Details */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                  <User className="w-5 h-5" />
                  SECTION C: QUALITY PARTNER & APPLICANT DETAILS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500">Quality Partner Name</p>
                    <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.qualityPartnerName || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Applicant Name</p>
                    <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.applicantName || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Designation</p>
                    <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.applicantDesignation || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email Address</p>
                    <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.applicantEmail || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.applicationDate || 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500">Signature</p>
                    <p className="text-sm font-medium bg-white px-3 py-1.5 rounded border">{application.applicantSignature || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Draft Report Section */}
              {application.report && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                    <FileText className="w-5 h-5" />
                    GATE EVALUATION REPORT
                  </h3>

                  {typeof application.report.draftReport === 'string' ? (
                    <div className="bg-white border border-gray-200 p-4 rounded-lg text-sm text-gray-800">
                      <pre className="whitespace-pre-wrap font-sans">
                        {application.report.draftReport}
                      </pre>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <h4 className="font-semibold text-gray-900">Gate Evaluation Report</h4>
                        <p className="text-sm text-gray-500">
                          Generated on {application.report.draftReport?.date} at {application.report.draftReport?.time}
                        </p>
                      </div>

                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Application ID</p>
                            <p className="text-sm font-medium">{application.report.draftReport?.applicationId}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Applicant</p>
                            <p className="text-sm font-medium">{application.report.draftReport?.applicant}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Qualification Type</p>
                            <p className="text-sm font-medium">{application.report.draftReport?.qualificationType || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Action Type</p>
                            <p className="text-sm font-medium">{application.report.draftReport?.actionType || 'Not specified'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-xs text-gray-500">Qualification</p>
                            <p className="text-sm font-medium">{application.report.draftReport?.qualification}</p>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Document Verification</h5>
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left px-4 py-2">Document</th>
                                  <th className="text-left px-4 py-2">Status</th>
                                  <th className="text-left px-4 py-2">File</th>
                                </tr>
                              </thead>
                              <tbody>
                                {application.report.draftReport?.documents?.map((doc: any, idx: number) => (
                                  <tr key={idx} className="border-t">
                                    <td className="px-4 py-2">{doc.label}{doc.optional && <span className="ml-2 text-xs text-gray-400">(Optional)</span>}</td>
                                    <td className="px-4 py-2">
                                      {doc.status ? (
                                        <span className="text-green-600 font-medium">Present</span>
                                      ) : doc.optional ? (
                                        <span className="text-gray-400">Optional</span>
                                      ) : (
                                        <span className="text-red-600 font-medium">Missing</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-gray-600">{doc.file || 'Not uploaded'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs text-gray-500">Recommendation</p>
                          <p className="text-sm font-medium text-gray-800">
                            {application.report.draftReport?.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {documentList.filter(doc => doc.file).map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium">{doc.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{doc.uploadedDate}</td>
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
                      {documentList.filter(doc => doc.file).length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                            No documents uploaded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Review Checklist Tab */}
          {activeTab === 'checklist' && (
            <div className="space-y-6">
              {mode === 'documentReview' && (
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-blue-200">
                  <h3 className="font-medium mb-3 text-blue-700 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Document Review Checklist
                  </h3>
                  <div className="space-y-3">
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

              {mode === 'resolution' && (
                <div className="bg-gray-50 p-4 rounded-lg border-2 border-purple-200">
                  <h3 className="font-medium mb-3 text-purple-700 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Evaluation Checklist
                  </h3>
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