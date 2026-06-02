// pages/internal/InternalEvaluations.tsx
import React, { useState, useEffect } from 'react';
import {
  Eye,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Search,
  BarChart3,
  Award,
  Mail,
  FileCheck2,
  Send
} from 'lucide-react';
import EvaluationDetailsModal from '@/components/modals/EvaluationDetailsModal';
import { getApplications, updateApplication } from '@/lib/applicationStorage';
import type { Application } from '@/types';

interface AcknowledgementLetterData {
  recipientName: string;
  recipientOrganization: string;
  recipientAddress: string;
  submissionDate: string;
  skillsProgrammes: Array<{ id: string; type: string; title: string; nqfLevel: number; credits: number; curriculumCode: string }>;
  documentsChecklist: Array<{ documentName: string; submitted: boolean; completed: boolean }>;
  additionalNotes: string;
  senderName: string;
  senderDesignation: string;
  letterDate: string;
}

export default function InternalEvaluations() {
  const [activeTab, setActiveTab] = useState<'initial' | 'summary'>('initial');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    setApplications(getApplications());
  }, []);

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

  // Called when "Complete Evaluation & Send Letter" is clicked in the modal.
  // Moves the application to evaluation_summary.
  const handleEvaluationComplete = (
    id: string,
    evaluationData: any,
    acknowledgementLetter: AcknowledgementLetterData
  ) => {
    const updatedApp = updateApplication(id, {
      status: evaluationData.recommendation === 'approve' ? 'evaluation_summary' : 'rejected',
      evaluationSummary: {
        ...evaluationData,
        resolution: evaluationData.notes || '',
        recommended: evaluationData.recommendation === 'approve',
        submitted: true,
        approvalDate: new Date().toISOString(),
        approvedBy: 'Current User'
      },
      acknowledgementLetter: acknowledgementLetter
    });
    if (updatedApp) {
      setApplications(getApplications());
      if (evaluationData.recommendation === 'approve') setActiveTab('summary');
    }
  };

  const handleSummaryComplete = (
    id: string,
    resolution: string,
    resolutionFile: string | null,
    recommended: boolean,
    approvalLetter: string | null
  ) => {
    const updatedApp = updateApplication(id, {
      status: recommended ? 'development_workspace' : 'rejected',
      evaluationSummary: {
        resolution: resolution || '',
        resolutionUploaded: resolutionFile,
        recommended,
        submitted: true,
        approvalLetter,
        approvalDate: new Date().toISOString(),
        approvedBy: 'Current User'
      }
    });
    if (updatedApp) setApplications(getApplications());
  };

  // Called when the Outcome Letter is sent from the new tab.
  // DEVELOP + approve  → development_workspace (moves to QualificationDevelopment / CyclePlan)
  // DEVELOP + decline  → rejected
  // REVIEW / DE-ACTIVATE / REPLACE → returned_to_qd (moves back to QualificationDesign view)
  const handleOutcomeLetterSent = (id: string, outcomeData: any) => {
    const app = applications.find(a => a.id === id);
    const actionType = (app?.actionType || '').toUpperCase();
    const isDevelop = actionType === 'DEVELOP';
    const isApproved = outcomeData.developOutcome === 'approve';

    let newStatus: string;
    if (isDevelop) {
      newStatus = isApproved ? 'development_workspace' : 'rejected';
    } else {
      // REVIEW, DE-ACTIVATE, REPLACE — send back to Qualification Design for record-keeping
      newStatus = 'returned_to_qd';
    }

    const updatedApp = updateApplication(id, {
      status: newStatus,
      outcomeLetter: { ...outcomeData, sent: true }
    });
    if (updatedApp) setApplications(getApplications());
  };

  const handleApprovalLetterUpload = (id: string, file: string) => {
    const app = applications.find(a => a.id === id);
    if (app && app.evaluationSummary) {
      updateApplication(id, { evaluationSummary: { ...app.evaluationSummary, approvalLetter: file, submitted: true } });
      setApplications(getApplications());
    } else if (app) {
      updateApplication(id, { evaluationSummary: { resolution: '', resolutionUploaded: null, recommended: false, submitted: true, approvalLetter: file, approvalDate: new Date().toISOString(), approvedBy: 'Current User' } });
      setApplications(getApplications());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'evaluation': return 'bg-yellow-100 text-yellow-800';
      case 'evaluation_summary': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Internal Evaluations</h1>
        <p className="text-gray-500 mt-2">Review and evaluate qualification submissions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Initial Evaluation</p><p className="text-2xl font-bold">{initialEvaluationApps.length}</p></div><Clock className="w-10 h-10 text-yellow-500" /></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Evaluation Summary</p><p className="text-2xl font-bold">{summaryApps.length}</p></div><BarChart3 className="w-10 h-10 text-purple-500" /></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Approved</p><p className="text-2xl font-bold">{applications.filter(app => app.status === 'approved').length}</p></div><CheckCircle className="w-10 h-10 text-green-500" /></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Rejected</p><p className="text-2xl font-bold">{applications.filter(app => app.status === 'rejected').length}</p></div><AlertCircle className="w-10 h-10 text-red-500" /></div></div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab('initial')} className={`pb-4 px-1 relative ${activeTab === 'initial' ? 'text-purple-600 border-b-2 border-purple-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            <div className="flex items-center gap-2"><FileText className="w-5 h-5" />Initial Evaluation ({initialEvaluationApps.length})</div>
          </button>
          <button onClick={() => setActiveTab('summary')} className={`pb-4 px-1 relative ${activeTab === 'summary' ? 'text-purple-600 border-b-2 border-purple-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Evaluation Summary ({summaryApps.length})</div>
          </button>
        </nav>
      </div>

      {activeTab === 'initial' ? (
        <InitialEvaluation applications={initialEvaluationApps} onViewApplication={handleViewApplication} getStatusColor={getStatusColor} />
      ) : (
        <EvaluationSummary applications={summaryApps} onViewApplication={handleViewApplication} onApprovalLetterUpload={handleApprovalLetterUpload} />
      )}

      <EvaluationDetailsModal
        key={selectedApplication?.id ?? 'none'}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        application={selectedApplication}
        onEvaluationComplete={handleEvaluationComplete}
        onSummaryComplete={handleSummaryComplete}
        onApprovalLetterUpload={handleApprovalLetterUpload}
        onOutcomeLetterSent={handleOutcomeLetterSent}
      />
    </div>
  );
}

function InitialEvaluation({ applications, onViewApplication, getStatusColor }: any) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" placeholder="Search evaluations..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"><Filter className="w-5 h-5" />Filter</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b"><tr><th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Application ID</th><th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Applicant</th><th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Qualification</th><th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Submission Date</th><th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Status</th><th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Actions</th></tr></thead>
          <tbody className="divide-y">
            {applications.length > 0 ? applications.map((app: Application) => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="py-4 px-6 text-sm font-medium">{app.id}</td>
                <td className="py-4 px-6 text-sm">{app.applicantName}</td>
                <td className="py-4 px-6 text-sm">{app.qualification}</td>
                <td className="py-4 px-6 text-sm">{app.submissionDate}</td>
                <td className="py-4 px-6"><span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>Initial Evaluation</span></td>
                <td className="py-4 px-6"><button onClick={() => onViewApplication(app)} className="p-1 hover:bg-purple-50 rounded text-purple-600"><Eye className="w-5 h-5" /></button></td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="py-8 text-center text-gray-500"><FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" /><p>No applications pending initial evaluation</p></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EvaluationSummary({ applications, onViewApplication, onApprovalLetterUpload }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl shadow-sm border border-purple-100"><div className="flex items-center justify-between"><div><p className="text-sm text-purple-600 font-medium">Ready for Summary</p><p className="text-3xl font-bold text-gray-900">{applications.length}</p></div><div className="bg-purple-100 p-3 rounded-lg"><BarChart3 className="w-6 h-6 text-purple-600" /></div></div></div>
        <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl shadow-sm border border-green-100"><div className="flex items-center justify-between"><div><p className="text-sm text-green-600 font-medium">Resolution Submitted</p><p className="text-3xl font-bold text-gray-900">{applications.filter((a: Application) => a.evaluationSummary?.submitted).length}</p></div><div className="bg-green-100 p-3 rounded-lg"><FileText className="w-6 h-6 text-green-600" /></div></div></div>
        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-sm border border-blue-100"><div className="flex items-center justify-between"><div><p className="text-sm text-blue-600 font-medium">Outcome Letters Sent</p><p className="text-3xl font-bold text-gray-900">{applications.filter((a: Application) => (a as any).outcomeLetter?.sent).length}</p></div><div className="bg-blue-100 p-3 rounded-lg"><Send className="w-6 h-6 text-blue-600" /></div></div></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Application ID</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicant</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qualification</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type / Action</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Evaluation</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Outcome Letter</th>
              <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {applications.length > 0 ? applications.map((app: Application) => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="py-4 px-6 text-sm font-medium text-gray-900">{app.id}</td>
                <td className="py-4 px-6 text-sm text-gray-700">{app.applicantName}</td>
                <td className="py-4 px-6 text-sm text-gray-700 max-w-[160px] truncate">{app.qualification}</td>
                <td className="py-4 px-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-gray-700">{app.qualificationType || '—'}</span>
                    <span className="text-xs text-gray-400">{app.actionType || '—'}</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  {(app as any).evaluationSummary?.evaluationApplications ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit"><FileCheck2 className="w-3 h-3" />Complete</span>
                      {(app as any).acknowledgementLetter?.senderName && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit"><Mail className="w-3 h-3" />Letter Sent</span>}
                    </div>
                  ) : <span className="text-xs text-gray-400">—</span>}
                </td>
                <td className="py-4 px-6">
                  {(app as any).outcomeLetter?.sent ? (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit"><Send className="w-3 h-3" />{(app as any).outcomeLetter?.letterTypeLabel || 'Sent'}</span>
                  ) : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium w-fit">Pending</span>}
                </td>
                <td className="py-4 px-6">
                  <button onClick={() => onViewApplication(app)} className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"><Eye className="w-4 h-4" />View Details</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="py-10 text-center text-gray-500"><BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" /><p>No applications in evaluation summary</p></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}