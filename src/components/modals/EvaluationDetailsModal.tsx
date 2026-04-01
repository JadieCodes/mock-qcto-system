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
  Cpu
} from 'lucide-react';
import type{ Application } from '@/types';

interface EvaluationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onEvaluationComplete: (id: string, checklist: any, approved: boolean) => void;
}

export default function EvaluationDetailsModal({ 
  isOpen, 
  onClose, 
  application,
  onEvaluationComplete
}: EvaluationDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'ai' | 'documents'>('overview');
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
              onClick={() => setActiveTab('ai')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'ai' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
              }`}
            >
              <Cpu className="w-4 h-4" />
              AI Moderation
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'documents' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'
              }`}
            >
              Documents
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
                  <h3 className="font-medium mb-3">Draft Report</h3>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                    <pre className="whitespace-pre-wrap">{application.report.draftReport}</pre>
                  </div>
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
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  AI Moderation
                </h3>
                
                {!aiReport && !isAiRunning && (
                  <button
                    onClick={handleRunAi}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg text-sm hover:bg-purple-700 flex items-center gap-2"
                  >
                    <Cpu className="w-5 h-5" />
                    Run AI Moderation on Documentation
                  </button>
                )}

                {isAiRunning && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">AI is analyzing documents...</p>
                  </div>
                )}

                {aiReport && (
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                    <pre className="whitespace-pre-wrap">{aiReport}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

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