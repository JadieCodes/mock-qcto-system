// components/modals/EvaluationDetailsModal.tsx
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
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  ChevronLeft,
  Printer,
  Share2,
  Award,
  Cpu,
  History,
  Upload
} from 'lucide-react';
import type{ Application,DraftReportData  } from '@/types';


interface HistoryItem {
  action: string;
  user: string;
  date: string;
  description: string;
  expandable?: boolean;
  details?: {
    qualificationDesign?: boolean;
    draftReport?: boolean;
    applicationLetter?: boolean;
    motivation?: boolean;
    reference?: boolean;
    acrLetter?: boolean;
    completed?: boolean;
    approved?: boolean;
    checklistCompleted?: boolean;
    score?: number;
    notes?: string;
    aiReportGenerated?: boolean;
    source?: 'documentReview' | 'resolution' | 'evaluation' | 'evaluationSummary';
  };
}
interface EvaluationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onEvaluationComplete: (id: string, checklist: any, approved: boolean) => void;
  onSummaryComplete: (id: string, resolution: string, resolutionFile: string | null, recommended: boolean) => void;
  onApprovalLetterUpload: (id: string, file: string) => void;
}

export default function EvaluationDetailsModal({ 
  isOpen, 
  onClose, 
  application,
  onEvaluationComplete,
  onSummaryComplete,
  onApprovalLetterUpload
}: EvaluationDetailsModalProps) {
  const [expandedHistoryIndex, setExpandedHistoryIndex] = useState<number | null>(null);
const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'documents' | 'history' | 'resolutions'>('overview');

const [resolution, setResolution] = useState(application?.evaluationSummary?.resolution || '');
const [resolutionFile, setResolutionFile] = useState<string | null>(application?.evaluationSummary?.resolutionUploaded || null);
const [recommended, setRecommended] = useState(application?.evaluationSummary?.recommended || false);

  const [checklist, setChecklist] = useState({
    qualificationDesign: true,
    draftReport: !!application?.report,
    applicationLetter: !!application?.documents?.applicationLetter,
    motivation: !!application?.documents?.motivation,
    reference: !!application?.documents?.reference,
    acrLetter: !!application?.documents?.acrLetter
  });
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [notes, setNotes] = useState('');

  if (!isOpen || !application) return null;

const historyItems: HistoryItem[] = [
  {
    action: 'Application Submitted',
    user: 'System',
    date: application.submissionDate,
    description: 'Application received and logged',
    expandable: false
  },

  ...(application.documentReview
    ? [
        {
          action: 'Document Review Completed',
          user: application.documentReview.reviewedBy,
          date: application.documentReview.reviewDate,
          description: application.documentReview.notes || 'Document review completed',
          expandable: false
        }
      ]
    : []),

  ...(application.resolution
    ? [
        {
          action: 'Resolution Completed',
          user: application.resolution.reviewedBy,
          date: application.resolution.reviewDate,
          description: application.resolution.notes || 'Resolution completed',
          expandable: true,
          details: {
            qualificationDesign: application.resolution.qualificationDesign,
            draftReport: application.resolution.draftReport,
            applicationLetter: application.resolution.applicationLetter,
            motivation: application.resolution.motivation,
            reference: application.resolution.reference,
            acrLetter: application.resolution.acrLetter,
            completed: application.resolution.completed,
            notes: application.resolution.notes,
            source: 'resolution' as const
          }
        }
      ]
    : []),

  ...(application.evaluation
    ? [
        {
          action: application.evaluation.approved
            ? 'Evaluation Approved'
            : 'Evaluation Rejected',
          user: application.evaluation.reviewedBy,
          date: application.evaluation.reviewDate,
          description: application.evaluation.notes || 'Evaluation completed',
          expandable: true,
          details: {
            qualificationDesign: application.evaluation.qualificationDesign,
            draftReport: application.evaluation.draftReport,
            applicationLetter: application.evaluation.applicationLetter,
            motivation: application.evaluation.motivation,
            reference: application.evaluation.reference,
            acrLetter: application.evaluation.acrLetter,
            approved: application.evaluation.approved,
            checklistCompleted: application.evaluation.checklistCompleted,
            score: application.evaluation.score,
            notes: application.evaluation.notes,
            aiReportGenerated: application.evaluation.aiReportGenerated,
            source: 'evaluation' as const
          }
        }
      ]
    : []),

  ...(application.finalApproval
    ? [
        {
          action: application.finalApproval.approved
            ? 'Final Approval Granted'
            : 'Final Approval Rejected',
          user: application.finalApproval.approvedBy,
          date: application.finalApproval.approvalDate,
          description: application.finalApproval.notes || 'Final approval completed',
          expandable: false
        }
      ]
    : []),

 ...(application.evaluationSummary
  ? [
      {
        action: 'Evaluation Summary Submitted',
        user: application.evaluationSummary.approvedBy,
        date: application.evaluationSummary.approvalDate,
        description:
          application.evaluationSummary.resolution || 'Evaluation summary recorded',
        expandable: true,
        details: application.evaluation
          ? {
              qualificationDesign: application.evaluation.qualificationDesign,
              draftReport: application.evaluation.draftReport,
              applicationLetter: application.evaluation.applicationLetter,
              motivation: application.evaluation.motivation,
              reference: application.evaluation.reference,
              acrLetter: application.evaluation.acrLetter,
              approved: application.evaluation.approved,
              checklistCompleted: application.evaluation.checklistCompleted,
              score: application.evaluation.score,
              notes: application.evaluation.notes || application.evaluationSummary.resolution,
              aiReportGenerated: application.evaluation.aiReportGenerated,
              source: 'evaluationSummary' as const
            }
          : {
              notes: application.evaluationSummary.resolution,
              approved: application.evaluationSummary.recommended,
              source: 'evaluationSummary' as const
            }
      }
    ]
  : [])
];

const handleResolutionSubmit = () => {
  if (!application) return;

  onSummaryComplete(application.id, resolution, resolutionFile, recommended);
};

const handleResolutionFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    setResolutionFile(file.name);
  }
};
  const handleRunAi = () => {
    setIsAiRunning(true);
    // Simulate AI processing
    setTimeout(() => {
      const report = `
╔════════════════════════════════════════════════════════════╗
║                    AI MODERATION REPORT                     ║
╠════════════════════════════════════════════════════════════╣
║ Application ID: ${application.id}                                  
║ Applicant: ${application.applicantName}                                
║ Qualification: ${application.qualification}                            
║ Date: ${new Date().toLocaleDateString()}                                  
╚════════════════════════════════════════════════════════════╝

📊 DOCUMENT ANALYSIS
═══════════════════════════════════════════════════════════════

1. Qualification Design Application: ✓ VALID
2. Draft Report: ✓ VALID
3. Application Letter: ✓ VALID
4. Motivation: ⚠️ NEEDS REVIEW
5. Reference: ✓ VALID
6. ACR Letter: ✓ VALID

═══════════════════════════════════════════════════════════════

🎯 OVERALL ASSESSMENT
═══════════════════════════════════════════════════════════════
Score: 85/100 - RECOMMEND APPROVAL

═══════════════════════════════════════════════════════════════
      `;
      setAiReport(report);
      setIsAiRunning(false);
    }, 2000);
  };

  const handleApprove = () => {
    onEvaluationComplete(application.id, { ...checklist, notes }, true);
    onClose();
  };

  const handleReject = () => {
    onEvaluationComplete(application.id, { ...checklist, notes }, false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Evaluation Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              ID: {application.id} | Applicant: {application.applicantName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'overview' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'checklist' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
              }`}
            >
              Evaluation Checklist
            </button>
           
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'documents' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
              }`}
            >
              Documents
            </button>
            <button
  onClick={() => setActiveTab('resolutions')}
  className={`py-3 font-medium text-sm border-b-2 transition-colors ${
    activeTab === 'resolutions'
      ? 'border-purple-600 text-purple-600'
      : 'border-transparent text-gray-500'
  }`}
>
  Resolutions
</button>
            <button
  onClick={() => setActiveTab('history')}
  className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
    activeTab === 'history'
      ? 'border-purple-600 text-purple-600'
      : 'border-transparent text-gray-500'
  }`}
>
  <History className="w-4 h-4" />
  History
</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Applicant Information
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm"><span className="text-gray-500">Name:</span> {application.applicantName}</p>
                    <p className="text-sm"><span className="text-gray-500">Qualification:</span> {application.qualification}</p>
                    <p className="text-sm"><span className="text-gray-500">Submitted:</span> {application.submissionDate}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Document Status
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Application Letter:</span>
                      {application.documents.applicationLetter ? 
                        <CheckCircle className="w-4 h-4 text-green-500" /> : 
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      }
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Motivation:</span>
                      {application.documents.motivation ? 
                        <CheckCircle className="w-4 h-4 text-green-500" /> : 
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      }
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Reference:</span>
                      {application.documents.reference ? 
                        <CheckCircle className="w-4 h-4 text-green-500" /> : 
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      }
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">ACR Letter:</span>
                      {application.documents.acrLetter ? 
                        <CheckCircle className="w-4 h-4 text-green-500" /> : 
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      }
                    </div>
                  </div>
                </div>
              </div>

                        {application.report && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Draft Report
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
                          <p className="text-sm font-medium">
                            {application.report.draftReport?.applicationId}
                          </p>
                        </div>
            
                        <div>
                          <p className="text-xs text-gray-500">Applicant</p>
                          <p className="text-sm font-medium">
                            {application.report.draftReport?.applicant}
                          </p>
                        </div>
            
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500">Qualification</p>
                          <p className="text-sm font-medium">
                            {application.report.draftReport?.qualification}
                          </p>
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
                                  <td className="px-4 py-2">{doc.label}</td>
                                  <td className="px-4 py-2">
                                    {doc.status ? (
                                      <span className="text-green-600 font-medium">Present</span>
                                    ) : doc.optional ? (
                                      <span className="text-gray-400">Optional</span>
                                    ) : (
                                      <span className="text-red-600 font-medium">Missing</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-gray-600">
                                    {doc.file || 'Not uploaded'}
                                  </td>
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

          {/* Checklist Tab */}
          {activeTab === 'checklist' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Evaluation Checklist</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Qualification Design Application</span>
                    <input
                      type="checkbox"
                      checked={checklist.qualificationDesign}
                      onChange={(e) => setChecklist({ ...checklist, qualificationDesign: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Draft Report</span>
                    <input
                      type="checkbox"
                      checked={checklist.draftReport}
                      onChange={(e) => setChecklist({ ...checklist, draftReport: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Application Letter</span>
                    <input
                      type="checkbox"
                      checked={checklist.applicationLetter}
                      onChange={(e) => setChecklist({ ...checklist, applicationLetter: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Motivation</span>
                    <input
                      type="checkbox"
                      checked={checklist.motivation}
                      onChange={(e) => setChecklist({ ...checklist, motivation: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Reference</span>
                    <input
                      type="checkbox"
                      checked={checklist.reference}
                      onChange={(e) => setChecklist({ ...checklist, reference: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ACR Letter</span>
                    <input
                      type="checkbox"
                      checked={checklist.acrLetter}
                      onChange={(e) => setChecklist({ ...checklist, acrLetter: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm text-gray-600 mb-1">Evaluation Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border rounded-lg p-3 text-sm"
                    rows={4}
                    placeholder="Add evaluation notes..."
                  />
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleApprove}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Tab */}
      

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Application Letter</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {application.documents.applicationLetter ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Uploaded
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {application.documents.applicationLetter && (
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Motivation</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {application.documents.motivation ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Uploaded
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {application.documents.motivation && (
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">Reference</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {application.documents.reference ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Uploaded
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {application.documents.reference && (
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">ACR Letter</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {application.documents.acrLetter ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Uploaded
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {application.documents.acrLetter && (
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

    {activeTab === 'resolutions' && (
  <div className="space-y-6">
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="bg-gray-50 border-b px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">Resolution Details</h3>
        <p className="text-sm text-gray-500 mt-1">
          Enter the resolution, upload the resolution document, and manage the approval letter.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resolution / Recommendation
          </label>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="w-full border rounded-lg p-3 text-sm"
            rows={4}
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
              onChange={handleResolutionFileUpload}
              className="hidden"
              id="resolution-upload-modal"
            />
            <label
              htmlFor="resolution-upload-modal"
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

        <div className="flex gap-3">
          <button
            onClick={handleResolutionSubmit}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
          >
            Submit Resolution
          </button>
        </div>

        <div className="border-t pt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Approval Letter</h4>

          {!application.evaluationSummary?.approvalLetter ? (
            <div>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      onApprovalLetterUpload(application.id, e.target.files[0].name);
                    }
                  }}
                  className="hidden"
                  id={`approval-modal-${application.id}`}
                />
                <label
                  htmlFor={`approval-modal-${application.id}`}
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    Click to upload approval letter
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Approval letter uploaded</p>
                  <p className="text-xs text-green-700">
                    {application.evaluationSummary.approvalLetter}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {application.evaluationSummary?.submitted && (
          <div className="border-t pt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Current Submitted Details</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Submitted By</p>
                <p className="text-sm font-medium text-gray-800">
                  {application.evaluationSummary.approvedBy}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Submission Date</p>
                <p className="text-sm font-medium text-gray-800">
                  {application.evaluationSummary.approvalDate}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Submitted Resolution</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {application.evaluationSummary.resolution}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}

{activeTab === 'history' && (
  <div className="space-y-4">
    <div className="relative">
      {historyItems.length > 0 ? (
        historyItems.map((item, index) => {
          const isExpanded = expandedHistoryIndex === index;

          return (
            <div key={index} className="pb-6 relative">
              <div className="flex gap-4 relative">
                {index < historyItems.length - 1 && (
                  <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200"></div>
                )}

                <div className="relative z-10">
                  <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                </div>

                <div className="flex-1">
                  {item.expandable ? (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedHistoryIndex(isExpanded ? null : index)
                      }
                      className="w-full text-left bg-gray-50 hover:bg-purple-50 border border-transparent hover:border-purple-200 p-3 rounded-lg transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-medium text-gray-900">{item.action}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-purple-600 underline">
                            {item.user}
                          </p>
                          <p className="text-xs text-gray-400">{item.date}</p>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-medium text-gray-900">{item.action}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-500">{item.user}</p>
                          <p className="text-xs text-gray-400">{item.date}</p>
                        </div>
                      </div>
                    </div>
                  )}

             {item.expandable && isExpanded && item.details && (
  <div className="mt-3 border border-purple-200 bg-white rounded-lg p-4">
    <h4 className="text-sm font-semibold text-purple-700 mb-3">
      Evaluation Checklist Results
    </h4>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      <div className="flex justify-between rounded bg-gray-50 px-3 py-2">
        <span>Qualification Design</span>
        <span className={item.details.qualificationDesign ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {item.details.qualificationDesign ? 'Yes' : 'No'}
        </span>
      </div>

      <div className="flex justify-between rounded bg-gray-50 px-3 py-2">
        <span>Draft Report</span>
        <span className={item.details.draftReport ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {item.details.draftReport ? 'Yes' : 'No'}
        </span>
      </div>

      <div className="flex justify-between rounded bg-gray-50 px-3 py-2">
        <span>Application Letter</span>
        <span className={item.details.applicationLetter ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {item.details.applicationLetter ? 'Yes' : 'No'}
        </span>
      </div>

      <div className="flex justify-between rounded bg-gray-50 px-3 py-2">
        <span>Motivation</span>
        <span className={item.details.motivation ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {item.details.motivation ? 'Yes' : 'No'}
        </span>
      </div>

      <div className="flex justify-between rounded bg-gray-50 px-3 py-2">
        <span>Reference</span>
        <span className={item.details.reference ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {item.details.reference ? 'Yes' : 'No'}
        </span>
      </div>

      <div className="flex justify-between rounded bg-gray-50 px-3 py-2">
        <span>ACR Letter</span>
        <span className={item.details.acrLetter ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {item.details.acrLetter ? 'Yes' : 'No'}
        </span>
      </div>

     

      

      <div className="flex justify-between rounded bg-gray-50 px-3 py-2">
        <span>Decision</span>
        <span className={item.details.approved ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {item.details.approved ? 'Approved' : 'Rejected'}
        </span>
      </div>

     

      <div className="md:col-span-2 rounded bg-gray-50 px-3 py-2">
        <p className="text-xs text-gray-500 mb-1">Notes</p>
        <p className="font-medium text-gray-800">
          {item.details.notes || 'No notes added'}
        </p>
      </div>
    </div>
  </div>
)}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          No history available yet.
        </div>
      )}
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