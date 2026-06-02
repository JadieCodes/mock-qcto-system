import React, { useState, useEffect } from 'react';
import {
  Eye, XCircle, BarChart3, FileText, CheckCircle, Clock, Download, Calendar,
  Users, ClipboardList, AlertCircle, MessageSquare, Filter, Search, Award,
  User, RefreshCw, Send, X, FileSignature, Shield, ExternalLink, Reply
} from 'lucide-react';

interface ExternalComment {
  id: string;
  referenceNumber: string;
  submitterName: string;
  submitterOrganization?: string;
  submissionDate: string;
  type: 'comment' | 'objection' | 'support';
  status: 'pending' | 'reviewed' | 'addressed';
  commentText: string;
  source: string;
  response?: string;
  responseDate?: string;
  resolutionLetter?: {
    letterNumber: string;
    issueDate: string;
    signedBy: string;
    letterType: string;
    recipientName?: string;
    recipientOrganisation?: string;
    additionalNotes?: string;
    status: string;
  };
}

interface ExternalQualification {
  id: string;
  qualificationCode: string;
  qualificationTitle: string;
  qualificationLevel: number;
  credits: number;
  comments: ExternalComment[];
  status: 'pending' | 'reviewing' | 'resolved' | 'approved';
}

interface RespondModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment: ExternalComment | null;
  qualificationTitle: string;
  onSendResponse: (commentId: string, response: string) => void;
}

// ── Resolution Letter Display Component ──────────────────────────────────────
function ResolutionLetterDisplay({ letter }: { letter: ExternalComment['resolutionLetter'] }) {
  if (!letter) return null;
  
  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-white rounded-lg border border-green-200">
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-5 h-5 text-green-600" />
        <h4 className="font-semibold text-green-800">Official QCTO Resolution Letter</h4>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">Issued</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold">Letter Number</p>
          <p className="font-mono font-medium">{letter.letterNumber || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold">Issue Date</p>
          <p className="font-medium">{letter.issueDate || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold">Signed By</p>
          <p className="font-medium">{letter.signedBy || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
          <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Approved</span>
        </div>
      </div>
      
      {letter.recipientName && (
        <div className="grid grid-cols-2 gap-3 text-sm mb-3 pt-2 border-t">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Recipient</p>
            <p className="font-medium">{letter.recipientName}</p>
            {letter.recipientOrganisation && <p className="text-xs text-gray-500">{letter.recipientOrganisation}</p>}
          </div>
          {letter.additionalNotes && (
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Additional Notes</p>
              <p className="text-xs text-gray-600">{letter.additionalNotes}</p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-3 pt-2 border-t flex justify-end">
        <button 
          onClick={() => {
            const letterText = `QCTO RESOLUTION LETTER

Letter Number: ${letter.letterNumber}
Issue Date: ${letter.issueDate}
Recipient: ${letter.recipientName || 'N/A'}${letter.recipientOrganisation ? ` (${letter.recipientOrganisation})` : ''}
Signed By: ${letter.signedBy}
Status: Approved

This qualification has been approved by the Quality Council for Trades and Occupations (QCTO).
${letter.additionalNotes ? `\nAdditional Notes:\n${letter.additionalNotes}` : ''}

---
This is an official QCTO document. Please retain for your records.`;
            
            const blob = new Blob([letterText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `QCTO_Letter_${letter.letterNumber || 'Approval'}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
        >
          <Download className="w-4 h-4" /> Download Letter
        </button>
      </div>
    </div>
  );
}

function RespondModal({ isOpen, onClose, comment, qualificationTitle, onSendResponse }: RespondModalProps) {
  const [responseText, setResponseText] = useState('');
  if (!isOpen || !comment) return null;
  const handleSend = () => {
    if (responseText.trim()) { onSendResponse(comment.id, responseText); setResponseText(''); onClose(); }
    else alert('Please enter a response message.');
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-green-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><Reply className="w-5 h-5 text-green-600" /></div>
            <div><h3 className="font-semibold">Respond to Comment</h3><p className="text-xs text-gray-500">{qualificationTitle}</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border">
            <p className="text-xs text-gray-500 mb-1">Original Comment from {comment.submitterName}</p>
            <p className="text-sm text-gray-700">{comment.commentText}</p>
            <p className="text-xs text-gray-400 mt-2">Received: {comment.submissionDate}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Your Response *</label>
            <textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={5}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-300 outline-none resize-none"
              placeholder="Type your response to the submitter..." />
          </div>
        </div>
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Cancel</button>
          <button onClick={handleSend} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2">
            <Send className="w-4 h-4" />Send Response
          </button>
        </div>
      </div>
    </div>
  );
}

// Load which qualification codes have been registered via the approval phase
function loadRegisteredCodes(): Set<string> {
  try {
    const raw = localStorage.getItem('registeredQualifications');
    if (!raw) return new Set();
    const list = JSON.parse(raw) as any[];
    return new Set(list.map((r: any) => r.qualificationCode));
  } catch { return new Set(); }
}

export default function PublicSubmissionsScreen() {
  const [activeTab, setActiveTab] = useState<'submissions' | 'approved' | 'analytics' | 'settings'>('submissions');
  const [selectedQualification, setSelectedQualification] = useState<ExternalQualification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<ExternalComment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [qualifications, setQualifications] = useState<ExternalQualification[]>([]);
  const [approvedQualifications, setApprovedQualifications] = useState<ExternalQualification[]>([]);
  const [showCommentsForQualification, setShowCommentsForQualification] = useState<string | null>(null);
  const [registeredCodes, setRegisteredCodes] = useState<Set<string>>(loadRegisteredCodes);

  // Build active submissions (not yet approved)
  const buildQualifications = (submissions: any[], regCodes: Set<string>): ExternalQualification[] => {
    const grouped = new Map<string, ExternalQualification>();
    submissions.forEach((sub: any) => {
      const key = sub.qualificationCode;
      // Only include qualifications that are NOT registered (still active)
      if (!regCodes.has(key)) {
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: key,
            qualificationCode: sub.qualificationCode,
            qualificationTitle: sub.qualificationTitle,
            qualificationLevel: 5,
            credits: 120,
            comments: [],
            status: 'pending',
          });
        }
        const comment: ExternalComment = {
          id: sub.id,
          referenceNumber: sub.referenceNumber,
          submitterName: sub.submitterName,
          submitterOrganization: sub.submitterOrganization,
          submissionDate: sub.submissionDate,
          type: sub.type,
          status: sub.status,
          commentText: sub.commentText,
          source: sub.source,
          response: sub.response,
          responseDate: sub.responseDate,
          resolutionLetter: sub.resolutionLetter,
        };
        grouped.get(key)!.comments.push(comment);
      }
    });
    const arr = Array.from(grouped.values()).filter(q => q.comments.length > 0);
    arr.forEach(qual => {
      const hasPending = qual.comments.some(c => c.status === 'pending');
      const hasReviewed = qual.comments.some(c => c.status === 'reviewed');
      const allAddressed = qual.comments.every(c => c.status === 'addressed');
      if (allAddressed) qual.status = 'resolved';
      else if (hasReviewed) qual.status = 'reviewing';
      else qual.status = 'pending';
    });
    return arr;
  };

  // Build approved qualifications (already registered)
  const buildApprovedQualifications = (submissions: any[], regCodes: Set<string>): ExternalQualification[] => {
    const grouped = new Map<string, ExternalQualification>();
    submissions.forEach((sub: any) => {
      const key = sub.qualificationCode;
      // Only include qualifications that ARE registered (approved)
      if (regCodes.has(key)) {
        if (!grouped.has(key)) {
          grouped.set(key, {
            id: key,
            qualificationCode: sub.qualificationCode,
            qualificationTitle: sub.qualificationTitle,
            qualificationLevel: 5,
            credits: 120,
            comments: [],
            status: 'approved',
          });
        }
        const comment: ExternalComment = {
          id: sub.id,
          referenceNumber: sub.referenceNumber,
          submitterName: sub.submitterName,
          submitterOrganization: sub.submitterOrganization,
          submissionDate: sub.submissionDate,
          type: sub.type,
          status: sub.status,
          commentText: sub.commentText,
          source: sub.source,
          response: sub.response,
          responseDate: sub.responseDate,
          resolutionLetter: sub.resolutionLetter,
        };
        grouped.get(key)!.comments.push(comment);
      }
    });
    return Array.from(grouped.values());
  };

  useEffect(() => {
    const loadAll = () => {
      const stored = localStorage.getItem('externalPublicSubmissions');
      let submissions: any[] = [];
      if (stored) {
        submissions = JSON.parse(stored);
      } else {
        submissions = [
          { id: 'sample-1', referenceNumber: 'PUB-2024-001', qualificationTitle: 'Advanced Diploma in Project Management', qualificationCode: 'AD-PM-2024', submitterName: 'John Smith', submitterOrganization: 'PMI South Africa', submissionDate: '2024-01-15', type: 'comment', status: 'pending', commentText: 'The project management curriculum should include more emphasis on agile methodologies.', source: 'webform' },
          { id: 'sample-2', referenceNumber: 'PUB-2024-002', qualificationTitle: 'Advanced Diploma in Project Management', qualificationCode: 'AD-PM-2024', submitterName: 'Jane Doe', submitterOrganization: 'Tech Solutions', submissionDate: '2024-01-16', type: 'objection', status: 'reviewed', commentText: 'The practical assessment criteria are not clearly defined.', source: 'email' },
          { id: 'sample-3', referenceNumber: 'PUB-2024-003', qualificationTitle: 'Certificate in Data Science', qualificationCode: 'C-DS-2024', submitterName: 'Tech Industry Association', submitterOrganization: 'TIA', submissionDate: '2024-01-17', type: 'support', status: 'addressed', commentText: 'We fully support this qualification as it addresses critical skills gaps.', source: 'webform' },
        ];
        localStorage.setItem('externalPublicSubmissions', JSON.stringify(submissions));
      }
      const regCodes = loadRegisteredCodes();
      setRegisteredCodes(regCodes);
      setQualifications(buildQualifications(submissions, regCodes));
      setApprovedQualifications(buildApprovedQualifications(submissions, regCodes));
    };
    loadAll();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'externalPublicSubmissions' || e.key === 'registeredQualifications') loadAll();
    };
    const handleRegistered = () => loadAll();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', loadAll);
    window.addEventListener('qualificationRegistered', handleRegistered);
    document.addEventListener('visibilitychange', loadAll);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', loadAll);
      window.removeEventListener('qualificationRegistered', handleRegistered);
      document.removeEventListener('visibilitychange', loadAll);
    };
  }, []);

  const handleUpdateCommentStatus = (commentId: string, newStatus: 'pending' | 'reviewed' | 'addressed') => {
    const stored = localStorage.getItem('externalPublicSubmissions');
    if (!stored) return;
    const submissions = JSON.parse(stored);
    const updated = submissions.map((sub: any) => sub.id === commentId ? { ...sub, status: newStatus } : sub);
    localStorage.setItem('externalPublicSubmissions', JSON.stringify(updated));
    const regCodes = loadRegisteredCodes();
    setQualifications(buildQualifications(updated, regCodes));
    setApprovedQualifications(buildApprovedQualifications(updated, regCodes));
  };

  const handleSendResponse = (commentId: string, response: string) => {
    const stored = localStorage.getItem('externalPublicSubmissions');
    if (!stored) return;
    const submissions = JSON.parse(stored);
    const updated = submissions.map((sub: any) =>
      sub.id === commentId ? { ...sub, response, responseDate: new Date().toISOString(), status: 'addressed' } : sub
    );
    localStorage.setItem('externalPublicSubmissions', JSON.stringify(updated));
    const regCodes = loadRegisteredCodes();
    setQualifications(buildQualifications(updated, regCodes));
    setApprovedQualifications(buildApprovedQualifications(updated, regCodes));
    alert('Response sent successfully!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':    return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>;
      case 'reviewing':  return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"><Eye className="w-3 h-3" />Reviewing</span>;
      case 'resolved':   return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" />Resolved</span>;
      case 'approved':   return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1"><Award className="w-3 h-3" />Approved</span>;
      default:           return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  const getCommentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':   return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Pending</span>;
      case 'reviewed':  return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Reviewed</span>;
      case 'addressed': return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Addressed</span>;
      default:          return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'comment':   return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">💬 Comment</span>;
      case 'objection': return <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">⚠️ Objection</span>;
      case 'support':   return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✅ Support</span>;
      default:          return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{type}</span>;
    }
  };

  // Filter active submissions
  const filteredActive = qualifications.filter(q => {
    if (searchTerm && !q.qualificationTitle.toLowerCase().includes(searchTerm.toLowerCase()) && !q.qualificationCode.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (statusFilter && q.status !== statusFilter) return false;
    return true;
  });

  // Filter approved qualifications
  const filteredApproved = approvedQualifications.filter(q => {
    if (searchTerm && !q.qualificationTitle.toLowerCase().includes(searchTerm.toLowerCase()) && !q.qualificationCode.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const totalComments = qualifications.reduce((acc, q) => acc + q.comments.length, 0);
  const pendingComments = qualifications.reduce((acc, q) => acc + q.comments.filter(c => c.status === 'pending').length, 0);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Public Submissions</h1>
        <p className="text-gray-500 mt-2">Manage public comments and feedback from stakeholders</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Under Review', value: qualifications.length, color: 'text-blue-600', bg: 'bg-blue-100', Icon: ClipboardList },
          { label: 'Pending Review', value: qualifications.filter(q => q.status === 'pending').length, color: 'text-yellow-600', bg: 'bg-yellow-100', Icon: Clock },
          { label: 'Total Comments', value: totalComments, color: 'text-gray-800', bg: 'bg-purple-100', Icon: MessageSquare },
          { label: 'Pending Comments', value: pendingComments, color: 'text-orange-600', bg: 'bg-orange-100', Icon: AlertCircle },
          { label: 'Approved', value: approvedQualifications.length, color: 'text-green-600', bg: 'bg-green-100', Icon: CheckCircle },
        ].map(({ label, value, color, bg, Icon }) => (
          <div key={label} className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></div>
              <div className={`p-2 ${bg} rounded-lg`}><Icon className={`w-5 h-5`} /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {([
            { key: 'submissions', label: 'Active Submissions', Icon: ClipboardList, count: qualifications.length },
            { key: 'approved', label: 'Approved Qualifications', Icon: CheckCircle, count: approvedQualifications.length },
            { key: 'analytics', label: 'Analytics & Insights', Icon: BarChart3 },
            { key: 'settings', label: 'Settings', Icon: Shield },
          ] as const).map(({ key, label, Icon, count }: any) => (
            <button key={key} onClick={() => setActiveTab(key as any)}
              className={`px-4 py-2 font-medium text-sm transition-colors relative flex items-center gap-2 ${activeTab === key ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
              <Icon className="w-4 h-4" />{label}
              {count !== undefined && count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
              )}
              {activeTab === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Active Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search by qualification..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <select className="border rounded-lg px-3 py-2 text-sm min-w-[150px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
            </select>
            <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
          </div>

          {filteredActive.length === 0 ? (
            <div className="bg-white rounded-lg border p-10 text-center text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No active submissions</p>
              <p className="text-sm mt-1">All qualifications have been approved or resolved.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActive.map(qualification => (
                <div key={qualification.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-lg">{qualification.qualificationTitle}</h3>
                          {getStatusBadge(qualification.status)}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                          <span>Code: {qualification.qualificationCode}</span>
                          <span>NQF Level: {qualification.qualificationLevel}</span>
                          <span>Comments: {qualification.comments.length}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedQualification(qualification); setIsModalOpen(true); }}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
                          <Eye className="w-4 h-4" />View
                        </button>
                        <button onClick={() => setShowCommentsForQualification(showCommentsForQualification === qualification.id ? null : qualification.id)}
                          className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />Comments ({qualification.comments.length})
                        </button>
                      </div>
                    </div>
                  </div>

                  {showCommentsForQualification === qualification.id && (
                    <div className="p-4 bg-gray-50">
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {qualification.comments.map(comment => (
                          <div key={comment.id} className="bg-white p-3 rounded-lg border">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-medium text-sm">{comment.submitterName}</span>
                                  {comment.submitterOrganization && <span className="text-xs text-gray-500">({comment.submitterOrganization})</span>}
                                  {getTypeBadge(comment.type)}
                                  {getCommentStatusBadge(comment.status)}
                                </div>
                                <p className="text-sm text-gray-700">{comment.commentText}</p>
                                <p className="text-xs text-gray-400 mt-1">Ref: {comment.referenceNumber} · {comment.submissionDate} via {comment.source}</p>
                                {comment.response && (
                                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                    <p className="text-xs text-green-600 font-medium">Response sent:</p>
                                    <p className="text-sm text-gray-700">{comment.response}</p>
                                  </div>
                                )}
                                {comment.resolutionLetter && (
                                  <ResolutionLetterDisplay letter={comment.resolutionLetter} />
                                )}
                              </div>
                              {comment.status !== 'addressed' && (
                                <div className="flex gap-1 ml-4">
                                  <button onClick={() => handleUpdateCommentStatus(comment.id, 'reviewed')} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Mark Reviewed"><Eye className="w-4 h-4" /></button>
                                  <button onClick={() => { setSelectedComment(comment); setIsRespondModalOpen(true); }} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Respond"><Reply className="w-4 h-4" /></button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approved Qualifications Tab */}
      {activeTab === 'approved' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search approved qualifications..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"><RefreshCw className="w-4 h-4" />Refresh</button>
          </div>

          {filteredApproved.length === 0 ? (
            <div className="bg-white rounded-lg border p-10 text-center text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No approved qualifications</p>
              <p className="text-sm mt-1">Approved qualifications will appear here once resolution letters are issued.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApproved.map(qualification => (
                <div key={qualification.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-white border-b">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-lg">{qualification.qualificationTitle}</h3>
                          {getStatusBadge(qualification.status)}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                          <span>Code: {qualification.qualificationCode}</span>
                          <span>NQF Level: {qualification.qualificationLevel}</span>
                          <span>Comments: {qualification.comments.length}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedQualification(qualification); setIsModalOpen(true); }}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
                          <Eye className="w-4 h-4" />View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-4">Comments by Status</h3>
            <div className="space-y-3">
              {[
                { label: 'Pending', value: pendingComments, color: 'bg-yellow-500' },
                { label: 'Reviewed / Addressed', value: totalComments - pendingComments, color: 'bg-green-500' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}</span></div>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div className={`${color} h-2 rounded-full`} style={{ width: `${totalComments ? (value / totalComments) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-4">Qualification Status</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Pending Review', value: qualifications.filter(q => q.status === 'pending').length },
                { label: 'Under Review', value: qualifications.filter(q => q.status === 'reviewing').length },
                { label: 'Resolved', value: qualifications.filter(q => q.status === 'resolved').length },
                { label: 'Approved', value: approvedQualifications.length },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold mb-4">Public Submissions Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Auto-notify on new submissions</p>
                <p className="text-sm text-gray-500">Send email notifications for new public comments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
            <div className="pt-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {isModalOpen && selectedQualification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white shrink-0">
              <div>
                <h3 className="text-lg font-semibold">{selectedQualification.qualificationTitle}</h3>
                <p className="text-sm text-gray-500">Code: {selectedQualification.qualificationCode}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs text-gray-500">Code</p><p className="font-medium">{selectedQualification.qualificationCode}</p></div>
                  <div><p className="text-xs text-gray-500">NQF Level</p><p className="font-medium">Level {selectedQualification.qualificationLevel}</p></div>
                  <div><p className="text-xs text-gray-500">Credits</p><p className="font-medium">{selectedQualification.credits}</p></div>
                  <div><p className="text-xs text-gray-500">Status</p>{getStatusBadge(selectedQualification.status)}</div>
                </div>
              </div>
              
              {/* Check for resolution letter in any comment */}
              {selectedQualification.comments.some(c => c.resolutionLetter) && (
                <ResolutionLetterDisplay letter={selectedQualification.comments.find(c => c.resolutionLetter)?.resolutionLetter} />
              )}
              
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Public Comments ({selectedQualification.comments.length})
                </h4>
                {selectedQualification.comments.map(comment => (
                  <div key={comment.id} className="bg-white p-3 rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-sm">{comment.submitterName}</span>
                          {comment.submitterOrganization && <span className="text-xs text-gray-500">({comment.submitterOrganization})</span>}
                          {getTypeBadge(comment.type)}
                          {getCommentStatusBadge(comment.status)}
                        </div>
                        <p className="text-sm text-gray-700">{comment.commentText}</p>
                        <p className="text-xs text-gray-400 mt-1">Ref: {comment.referenceNumber} · {comment.submissionDate}</p>
                        {comment.response && (
                          <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                            <p className="text-xs text-green-600 font-medium">Response:</p>
                            <p className="text-sm text-gray-700">{comment.response}</p>
                          </div>
                        )}
                      </div>
                      {comment.status !== 'addressed' && !comment.resolutionLetter && selectedQualification.status !== 'approved' && (
                        <div className="flex gap-1 ml-4">
                          <button onClick={() => handleUpdateCommentStatus(comment.id, 'reviewed')} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => { setSelectedComment(comment); setIsRespondModalOpen(true); }} className="p-1 text-green-600 hover:bg-green-50 rounded"><Reply className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Close</button>
            </div>
          </div>
        </div>
      )}

      <RespondModal
        isOpen={isRespondModalOpen}
        onClose={() => setIsRespondModalOpen(false)}
        comment={selectedComment}
        qualificationTitle={selectedComment ? qualifications.find(q => q.comments.some(c => c.id === selectedComment.id))?.qualificationTitle || '' : ''}
        onSendResponse={handleSendResponse}
      />
    </div>
  );
}