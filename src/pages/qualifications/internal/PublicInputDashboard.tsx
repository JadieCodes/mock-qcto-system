import React, { useState, useEffect } from 'react';
import {
  Eye,
  XCircle,
  BarChart3,
  FileText,
  CheckCircle,
  Clock,
  Download,
  Calendar,
  Users,
  ClipboardList,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Filter,
  Search,
  ChevronRight,
  ChevronLeft,
  Star,
  Award,
  User,
  RefreshCw,
  Upload,
  Paperclip,
  Printer,
  MoreVertical,
  TrendingUp,
  Edit,
  Trash2,
  Send,
  X,
  Plus,
  FileSignature,
  FolderOpen,
  Shield,
  Sparkles,
  PenLine,
  CheckSquare,
  ExternalLink,
  Info
} from 'lucide-react';

interface PublicComment {
  id: string;
  commentNumber: string;
  submitterName: string;
  submitterEmail: string;
  organization?: string;
  commentDate: string;
  comment: string;
  attachments?: string[];
  status: 'pending' | 'reviewed' | 'forwarded' | 'ignored' | 'submitted_to_external';
  source: 'email' | 'webform' | 'letter' | 'meeting' | 'internal';
  reviewedBy?: string;
  reviewDate?: string;
  response?: string;
  isInternalGenerated?: boolean;
}

interface QualificationForPublicInput {
  id: string;
  qualificationCode: string;
  qualificationTitle: string;
  qualificationLevel: number;
  credits: number;
  submittedBy: string;
  submittedDate: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'forwarded';
  comments: PublicComment[];
  resolutionDocument?: {
    fileName?: string;
    fileUrl?: string;
    uploadDate: string;
    resolutionNumber?: string;
    letterNumber?: string;
    issueDate?: string;
    signedBy?: string;
    notes?: string;
  };
  allPhasesCompleted: boolean;
  publicCommentsClosed?: boolean;
  closedDate?: string;
}

const getSampleQualifications = (): QualificationForPublicInput[] => [
  {
    id: '1',
    qualificationCode: 'ND-IT-2024',
    qualificationTitle: 'National Diploma: Information Technology',
    qualificationLevel: 6,
    credits: 240,
    submittedBy: 'Dr. Sarah Johnson',
    submittedDate: '2024-03-20',
    status: 'pending',
    allPhasesCompleted: true,
    comments: [
      {
        id: 'c1',
        commentNumber: 'PUB-2403-001',
        submitterName: 'John Smith',
        submitterEmail: 'john.smith@email.com',
        commentDate: '2024-03-21',
        comment: 'The curriculum should include more emphasis on agile project management methodologies.',
        status: 'pending',
        source: 'webform',
      },
      {
        id: 'c2',
        commentNumber: 'PUB-2403-002',
        submitterName: 'PMI South Africa',
        submitterEmail: 'feedback@pmisa.org.za',
        organization: 'PMI South Africa',
        commentDate: '2024-03-22',
        comment: 'The assessment criteria should align with PMP certification requirements.',
        status: 'pending',
        source: 'email',
      },
    ],
  },
  {
    id: '2',
    qualificationCode: 'NC-DS-2024',
    qualificationTitle: 'National Certificate: Data Science',
    qualificationLevel: 5,
    credits: 120,
    submittedBy: 'Prof. Michael Chen',
    submittedDate: '2024-03-18',
    status: 'pending',
    allPhasesCompleted: true,
    comments: [
      {
        id: 'c3',
        commentNumber: 'PUB-2403-003',
        submitterName: 'Dr. Maria Garcia',
        submitterEmail: 'm.garcia@techuniversity.ac.za',
        organization: 'Tech University',
        commentDate: '2024-03-19',
        comment: 'The practical requirements need to be more specific about the tools and technologies.',
        status: 'pending',
        source: 'email',
      },
    ],
  },
];

function syncToExternalSubmissions(
  qualification: QualificationForPublicInput,
  comment: PublicComment
) {
  const key = 'externalPublicSubmissions';
  const existing: any[] = JSON.parse(localStorage.getItem(key) || '[]');

  const alreadyExists = existing.some(e => e.id === comment.id);
  if (!alreadyExists) {
    existing.push({
      id: comment.id,
      referenceNumber: comment.commentNumber,
      qualificationTitle: qualification.qualificationTitle,
      qualificationCode: qualification.qualificationCode,
      submitterName: comment.submitterName,
      submitterOrganization: comment.organization,
      submissionDate: comment.commentDate,
      type: 'comment',
      status: 'pending',
      commentText: comment.comment,
      source: comment.source,
      documents: {
        submissionLetter: null,
        supportingDocs: null,
      },
    });
  }

  localStorage.setItem(key, JSON.stringify(existing));
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(existing) }));
}

interface GenerateCommentModalProps {
  qualification: QualificationForPublicInput;
  editingComment?: PublicComment | null;
  onClose: () => void;
  onSave: (comment: PublicComment) => void;
}

function GenerateCommentModal({ qualification, editingComment, onClose, onSave }: GenerateCommentModalProps) {
  const isEditing = !!editingComment;
  const [form, setForm] = useState({
    submitterName: editingComment?.submitterName || '',
    submitterEmail: editingComment?.submitterEmail || '',
    organization: editingComment?.organization || '',
    commentText: editingComment?.comment || '',
  });

  const handleSave = () => {
    if (!form.submitterName || !form.commentText) {
      alert('Please fill in the submitter name and comment text.');
      return;
    }

    const commentCount = Math.floor(Math.random() * 900) + 100;
    const savedComment: PublicComment = {
      id: editingComment?.id || `gen-${Date.now()}`,
      commentNumber: editingComment?.commentNumber || `PUB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${commentCount}`,
      submitterName: form.submitterName,
      submitterEmail: form.submitterEmail,
      organization: form.organization,
      commentDate: new Date().toISOString().split('T')[0],
      comment: form.commentText,
      status: 'pending',
      source: 'webform',
      isInternalGenerated: true,
    };
    onSave(savedComment);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-pink-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <PenLine className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{isEditing ? 'Edit Public Comment' : 'Generate Public Comment'}</h3>
              <p className="text-xs text-gray-500">{qualification.qualificationTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Name *</label>
              <input
                type="text"
                value={form.submitterName}
                onChange={e => setForm(p => ({ ...p, submitterName: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Email</label>
              <input
                type="email"
                value={form.submitterEmail}
                onChange={e => setForm(p => ({ ...p, submitterEmail: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Organisation</label>
            <input
              type="text"
              value={form.organization}
              onChange={e => setForm(p => ({ ...p, organization: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none"
              placeholder="Company / institution name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Comment *</label>
            <textarea
              value={form.commentText}
              onChange={e => setForm(p => ({ ...p, commentText: e.target.value }))}
              rows={6}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none resize-none"
              placeholder="Enter the comment content here. This will appear as a public comment."
            />
            <p className="text-xs text-gray-400 mt-1">{form.commentText.length} characters</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <ExternalLink className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              <strong>Demo Mode:</strong> This comment will appear in the public comments list. You can edit, delete, or submit it to external later.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {isEditing ? 'Save Changes' : 'Create Comment'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicInputDashboard() {
  const [activeTab, setActiveTab] = useState<'submissions' | 'analytics' | 'settings'>('submissions');
  const [selectedQualification, setSelectedQualification] = useState<QualificationForPublicInput | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isGenerateCommentOpen, setIsGenerateCommentOpen] = useState(false);
  const [editingCommentData, setEditingCommentData] = useState<PublicComment | null>(null);
  const [generateForQualification, setGenerateForQualification] = useState<QualificationForPublicInput | null>(null);
  const [selectedComment, setSelectedComment] = useState<PublicComment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [qualifications, setQualifications] = useState<QualificationForPublicInput[]>([]);
  const [commentAction, setCommentAction] = useState<'edit' | 'delete' | 'forward' | 'ignore' | 'submit_external'>('forward');
  const [editedComment, setEditedComment] = useState('');
  const [showCommentsForQualification, setShowCommentsForQualification] = useState<string | null>(null);

  // Load qualifications and sync resolution letters from external submissions
  useEffect(() => {
    const loadQualifications = () => {
      const stored = localStorage.getItem('publicInputQualifications');
      const externalSubmissions = JSON.parse(localStorage.getItem('externalPublicSubmissions') || '[]');
      const registeredCodes = JSON.parse(localStorage.getItem('registeredQualifications') || '[]');

      let parsed: QualificationForPublicInput[] = [];

      if (stored) {
        parsed = JSON.parse(stored);
      } else {
        parsed = getSampleQualifications();
        localStorage.setItem('publicInputQualifications', JSON.stringify(parsed));
      }

      // Check for resolution letters from externalPublicSubmissions and sync them
      const updatedParsed = parsed.map((qual: QualificationForPublicInput) => {
        const matchingExternal = externalSubmissions.filter(
          (sub: any) => sub.qualificationCode === qual.qualificationCode && sub.resolutionLetter
        );
        const isRegistered = registeredCodes.some((r: any) => r.qualificationCode === qual.qualificationCode);

        if (matchingExternal.length > 0 && !qual.resolutionDocument) {
          const letter = matchingExternal[0].resolutionLetter;
          return {
            ...qual,
            resolutionDocument: {
              fileName: `QCTO_Letter_${letter.letterNumber || 'Approval'}.pdf`,
              fileUrl: '',
              uploadDate: letter.issueDate || new Date().toISOString(),
              resolutionNumber: letter.letterNumber,
              letterNumber: letter.letterNumber,
              issueDate: letter.issueDate,
              signedBy: letter.signedBy,
              notes: letter.additionalNotes,
            },
            status: isRegistered ? 'forwarded' as const : qual.status,
            publicCommentsClosed: isRegistered ? true : qual.publicCommentsClosed,
            closedDate: isRegistered ? (letter.issueDate || new Date().toISOString()) : qual.closedDate,
          };
        }

        if (isRegistered && !qual.resolutionDocument && !qual.publicCommentsClosed) {
          const registeredEntry = registeredCodes.find((r: any) => r.qualificationCode === qual.qualificationCode);
          if (registeredEntry && registeredEntry.letterNumber) {
            return {
              ...qual,
              resolutionDocument: {
                fileName: `QCTO_Letter_${registeredEntry.letterNumber}.pdf`,
                fileUrl: '',
                uploadDate: registeredEntry.approvalDate || new Date().toISOString(),
                resolutionNumber: registeredEntry.letterNumber,
                letterNumber: registeredEntry.letterNumber,
                issueDate: registeredEntry.approvalDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                signedBy: registeredEntry.signedBy,
                notes: 'Automatically synced from approval letter',
              },
              status: 'forwarded' as const,
              publicCommentsClosed: true,
              closedDate: registeredEntry.approvalDate || new Date().toISOString(),
            };
          }
        }

        return qual;
      });

      setQualifications(updatedParsed);

      if (JSON.stringify(parsed) !== JSON.stringify(updatedParsed)) {
        localStorage.setItem('publicInputQualifications', JSON.stringify(updatedParsed));
      }
    };

    loadQualifications();
  }, []);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'publicInputQualifications' && e.newValue) {
        setQualifications(JSON.parse(e.newValue));
      }
      if (e.key === 'externalPublicSubmissions' || e.key === 'registeredQualifications') {
        const externalSubmissions = JSON.parse(localStorage.getItem('externalPublicSubmissions') || '[]');
        const registeredCodes = JSON.parse(localStorage.getItem('registeredQualifications') || '[]');
        const stored = localStorage.getItem('publicInputQualifications');

        if (stored) {
          let parsed = JSON.parse(stored);
          const updatedParsed = parsed.map((qual: QualificationForPublicInput) => {
            const matchingExternal = externalSubmissions.filter(
              (sub: any) => sub.qualificationCode === qual.qualificationCode && sub.resolutionLetter
            );
            const isRegistered = registeredCodes.some((r: any) => r.qualificationCode === qual.qualificationCode);

            if (matchingExternal.length > 0 && !qual.resolutionDocument) {
              const letter = matchingExternal[0].resolutionLetter;
              return {
                ...qual,
                resolutionDocument: {
                  fileName: `QCTO_Letter_${letter.letterNumber || 'Approval'}.pdf`,
                  fileUrl: '',
                  uploadDate: letter.issueDate || new Date().toISOString(),
                  resolutionNumber: letter.letterNumber,
                  letterNumber: letter.letterNumber,
                  issueDate: letter.issueDate,
                  signedBy: letter.signedBy,
                  notes: letter.additionalNotes,
                },
                status: 'forwarded' as const,
                publicCommentsClosed: true,
                closedDate: letter.issueDate || new Date().toISOString(),
              };
            }
            if (isRegistered && !qual.resolutionDocument && !qual.publicCommentsClosed) {
              const registeredEntry = registeredCodes.find((r: any) => r.qualificationCode === qual.qualificationCode);
              if (registeredEntry && registeredEntry.letterNumber) {
                return {
                  ...qual,
                  resolutionDocument: {
                    fileName: `QCTO_Letter_${registeredEntry.letterNumber}.pdf`,
                    fileUrl: '',
                    uploadDate: registeredEntry.approvalDate || new Date().toISOString(),
                    resolutionNumber: registeredEntry.letterNumber,
                    letterNumber: registeredEntry.letterNumber,
                    issueDate: registeredEntry.approvalDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                    signedBy: registeredEntry.signedBy,
                    notes: 'Automatically synced from approval letter',
                  },
                  status: 'forwarded' as const,
                  publicCommentsClosed: true,
                  closedDate: registeredEntry.approvalDate || new Date().toISOString(),
                };
              }
            }
            return qual;
          });
          setQualifications(updatedParsed);
          localStorage.setItem('publicInputQualifications', JSON.stringify(updatedParsed));
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const saveQualifications = (updated: QualificationForPublicInput[]) => {
    setQualifications(updated);
    localStorage.setItem('publicInputQualifications', JSON.stringify(updated));
  };

  const handleOpenGenerateComment = (qual: QualificationForPublicInput, editing?: PublicComment) => {
    setGenerateForQualification(qual);
    setEditingCommentData(editing || null);
    setIsGenerateCommentOpen(true);
  };

  const handleSaveGeneratedComment = (comment: PublicComment) => {
    if (!generateForQualification) return;

    const updated = qualifications.map(q => {
      if (q.id !== generateForQualification.id) return q;
      const existingComments = q.comments || [];
      const idx = existingComments.findIndex(c => c.id === comment.id);
      const updatedComments = idx >= 0
        ? existingComments.map(c => c.id === comment.id ? comment : c)
        : [...existingComments, comment];
      return { ...q, comments: updatedComments };
    });

    saveQualifications(updated);

    if (selectedQualification?.id === generateForQualification.id) {
      const fresh = updated.find(q => q.id === generateForQualification.id);
      if (fresh) setSelectedQualification(fresh);
    }

    setIsGenerateCommentOpen(false);
    setEditingCommentData(null);
    setGenerateForQualification(null);
    alert('Comment saved and appears in the public comments list.');
  };

  const handleDeleteComment = (qualId: string, commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    const updated = qualifications.map(q => {
      if (q.id !== qualId) return q;
      return { ...q, comments: q.comments.filter(c => c.id !== commentId) };
    });
    saveQualifications(updated);
    if (selectedQualification?.id === qualId) {
      const fresh = updated.find(q => q.id === qualId);
      if (fresh) setSelectedQualification(fresh);
    }
  };

  const handleSubmitToExternal = (qual: QualificationForPublicInput, comment: PublicComment) => {
    const updatedComment = { ...comment, status: 'submitted_to_external' as const };
    const updated = qualifications.map(q => {
      if (q.id !== qual.id) return q;
      return { ...q, comments: q.comments.map(c => c.id === comment.id ? updatedComment : c) };
    });

    const updatedQual = updated.find(q => q.id === qual.id);
    if (updatedQual) syncToExternalSubmissions(updatedQual, updatedComment);

    saveQualifications(updated);
    if (selectedQualification?.id === qual.id) {
      const fresh = updated.find(q => q.id === qual.id);
      if (fresh) setSelectedQualification(fresh);
    }
    alert('Comment submitted and forwarded to the external Public Submissions screen.');
  };

  const handleClosePublicComments = () => {
    if (!selectedQualification) return;

    const hasPendingComments = selectedQualification.comments.some(
      c => c.status === 'pending' || c.status === 'submitted_to_external'
    );

    if (hasPendingComments) {
      if (!confirm(
        'There are pending comments that have not been addressed. Are you sure you want to close the public comment phase? Unaddressed comments will be archived.'
      )) {
        return;
      }
    }

    const approvalEntry = {
      id: selectedQualification.id,
      qualificationCode: selectedQualification.qualificationCode,
      qualificationTitle: selectedQualification.qualificationTitle,
      nqfLevel: selectedQualification.qualificationLevel,
      credits: selectedQualification.credits,
      submittedBy: selectedQualification.submittedBy,
      submittedDate: selectedQualification.submittedDate,
      status: 'pending_review',
      currentApprovalLevel: 0,
      movedToApprovalDate: new Date().toISOString(),
      recommendations: [],
      resolutionDocument: selectedQualification.resolutionDocument || null,
      allDocuments: {
        qualificationDocument: '',
        curriculumSpec: '',
        assessmentGuidelines: '',
        qasReport: '',
      },
    };

    const existingApprovals: any[] = JSON.parse(localStorage.getItem('approvalQualifications') || '[]');
    const alreadyExists = existingApprovals.some((a: any) => a.id === selectedQualification.id);
    const updatedApprovals = alreadyExists
      ? existingApprovals.map((a: any) => a.id === selectedQualification.id ? approvalEntry : a)
      : [...existingApprovals, approvalEntry];

    localStorage.setItem('approvalQualifications', JSON.stringify(updatedApprovals));

    const updatedQualifications = qualifications.map(q =>
      q.id === selectedQualification.id
        ? { ...q, status: 'forwarded' as const, publicCommentsClosed: true, closedDate: new Date().toISOString() }
        : q
    );
    saveQualifications(updatedQualifications);
    setSelectedQualification(prev => prev ? { ...prev, status: 'forwarded', publicCommentsClosed: true } : null);

    window.dispatchEvent(new StorageEvent('storage', {
      key: 'approvalQualifications',
      newValue: JSON.stringify(updatedApprovals),
    }));

    alert('Public comments phase closed. Qualification has been forwarded to the Qualifications Approval Phase.');
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':   return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'reviewing': return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"><Eye className="w-3 h-3" /> Reviewing</span>;
      case 'resolved':  return <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Resolved</span>;
      case 'forwarded': return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1"><Send className="w-3 h-3" /> Forwarded</span>;
      default:          return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  const getCommentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':               return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Pending</span>;
      case 'reviewed':              return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Reviewed</span>;
      case 'forwarded':             return <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Forwarded</span>;
      case 'ignored':               return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">Ignored</span>;
      case 'submitted_to_external': return <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">Sent to External</span>;
      default:                      return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{status}</span>;
    }
  };

  const handleViewQualification = (qualification: QualificationForPublicInput) => {
    setSelectedQualification(qualification);
    setIsModalOpen(true);
  };

  const handleCommentAction = (comment: PublicComment, action: 'edit' | 'delete' | 'forward' | 'ignore' | 'submit_external') => {
    setSelectedComment(comment);
    setCommentAction(action);
    setEditedComment(comment.comment);
    setIsCommentModalOpen(true);
  };

  const processCommentAction = () => {
    if (!selectedQualification || !selectedComment) return;

    let updatedQualifications = [...qualifications];

    if (commentAction === 'delete') {
      updatedQualifications = qualifications.map(q => {
        if (q.id !== selectedQualification.id) return q;
        return { ...q, comments: q.comments.filter(c => c.id !== selectedComment.id) };
      });
    } else if (commentAction === 'edit') {
      updatedQualifications = qualifications.map(q => {
        if (q.id !== selectedQualification.id) return q;
        return {
          ...q,
          comments: q.comments.map(c =>
            c.id === selectedComment.id ? { ...c, comment: editedComment, status: 'reviewed' as const } : c
          ),
        };
      });
    } else if (commentAction === 'ignore') {
      updatedQualifications = qualifications.map(q => {
        if (q.id !== selectedQualification.id) return q;
        return {
          ...q,
          comments: q.comments.map(c =>
            c.id === selectedComment.id ? { ...c, status: 'ignored' as const } : c
          ),
        };
      });
    } else if (commentAction === 'forward') {
      updatedQualifications = qualifications.map(q => {
        if (q.id !== selectedQualification.id) return q;
        return {
          ...q,
          comments: q.comments.map(c =>
            c.id === selectedComment.id ? { ...c, status: 'forwarded' as const } : c
          ),
        };
      });
    } else if (commentAction === 'submit_external') {
      const qual = qualifications.find(q => q.id === selectedQualification.id);
      if (qual) handleSubmitToExternal(qual, selectedComment);
      setIsCommentModalOpen(false);
      setSelectedComment(null);
      return;
    }

    saveQualifications(updatedQualifications);
    const fresh = updatedQualifications.find(q => q.id === selectedQualification.id);
    if (fresh) setSelectedQualification(fresh);

    setIsCommentModalOpen(false);
    setSelectedComment(null);
  };

  const toggleComments = (qualificationId: string) => {
    setShowCommentsForQualification(showCommentsForQualification === qualificationId ? null : qualificationId);
  };

  const filteredQualifications = qualifications.filter(q => {
    if (searchTerm && !q.qualificationTitle.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !q.qualificationCode.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (statusFilter && q.status !== statusFilter) return false;
    return true;
  });

  const totalQualifications = qualifications.length;
  const pendingQualifications = qualifications.filter(q => q.status === 'pending').length;
  const totalComments = qualifications.reduce((acc, q) => acc + q.comments.length, 0);
  const pendingComments = qualifications.reduce((acc, q) => acc + q.comments.filter(c => c.status === 'pending').length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Public Input Dashboard</h1>
        <p className="text-gray-500 mt-2">Manage public comments and feedback for qualifications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Qualifications</p><p className="text-2xl font-bold">{totalQualifications}</p></div>
            <div className="p-2 bg-pink-100 rounded-lg"><Award className="w-5 h-5 text-pink-600" /></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Pending Review</p><p className="text-2xl font-bold text-yellow-600">{pendingQualifications}</p></div>
            <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Public Comments</p><p className="text-2xl font-bold">{totalComments}</p></div>
            <div className="p-2 bg-blue-100 rounded-lg"><MessageSquare className="w-5 h-5 text-blue-600" /></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Pending Comments</p><p className="text-2xl font-bold text-orange-600">{pendingComments}</p></div>
            <div className="p-2 bg-orange-100 rounded-lg"><AlertCircle className="w-5 h-5 text-orange-600" /></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Forwarded</p><p className="text-2xl font-bold text-purple-600">{qualifications.filter(q => q.status === 'forwarded').length}</p></div>
            <div className="p-2 bg-purple-100 rounded-lg"><Send className="w-5 h-5 text-purple-600" /></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {([
            { key: 'submissions', label: 'Submissions', Icon: ClipboardList },
            { key: 'analytics',   label: 'Analytics & Insights', Icon: BarChart3 },
            { key: 'settings',    label: 'Settings', Icon: Shield },
          ] as const).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeTab === key ? 'text-pink-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <div className="flex items-center gap-2"><Icon className="w-4 h-4" />{label}</div>
              {activeTab === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by qualification..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="border rounded-lg px-3 py-2 text-sm min-w-[150px]"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="forwarded">Forwarded</option>
            </select>
            <button className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />Refresh
            </button>
          </div>

          <div className="space-y-4">
            {filteredQualifications.map(qualification => (
              <div key={qualification.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg">{qualification.qualificationTitle}</h3>
                        {getStatusBadge(qualification.status)}
                        {qualification.publicCommentsClosed && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Comments Closed
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                        <span>Code: {qualification.qualificationCode}</span>
                        <span>NQF Level: {qualification.qualificationLevel}</span>
                        <span>Credits: {qualification.credits}</span>
                        <span>Submitted: {qualification.submittedDate}</span>
                        <span>By: {qualification.submittedBy}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {qualification.status !== 'forwarded' && (
                        <button
                          onClick={() => handleOpenGenerateComment(qualification)}
                          className="px-3 py-1.5 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex items-center gap-1 transition-colors"
                        >
                          <PenLine className="w-4 h-4" />Generate Comment
                        </button>
                      )}
                      <button
                        onClick={() => handleViewQualification(qualification)}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />View Details
                      </button>
                      <button
                        onClick={() => toggleComments(qualification.id)}
                        className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1"
                      >
                        <MessageSquare className="w-4 h-4" />Comments ({qualification.comments.length})
                      </button>
                    </div>
                  </div>
                </div>

                {showCommentsForQualification === qualification.id && (
                  <div className="p-4 bg-gray-50">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-pink-600" />Public Comments
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {qualification.comments.map(comment => (
                        <div key={comment.id} className="bg-white p-3 rounded-lg border">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-medium">{comment.submitterName}</span>
                                {comment.organization && <span className="text-xs text-gray-500">({comment.organization})</span>}
                                {getCommentStatusBadge(comment.status)}
                                {comment.isInternalGenerated && (
                                  <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">Generated</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700">{comment.comment}</p>
                              <p className="text-xs text-gray-400 mt-1">Received: {comment.commentDate} via {comment.source}</p>
                            </div>
                            {qualification.status !== 'forwarded' && (
                              <div className="flex gap-1 ml-4">
                                <button onClick={() => handleOpenGenerateComment(qualification, comment)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteComment(qualification.id, comment.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                {comment.status !== 'submitted_to_external' && (
                                  <button onClick={() => handleSubmitToExternal(qualification, comment)} className="p-1 text-pink-600 hover:bg-pink-50 rounded" title="Submit to External"><Send className="w-4 h-4" /></button>
                                )}
                                {comment.status !== 'forwarded' && comment.status !== 'ignored' && comment.status !== 'submitted_to_external' && (
                                  <button onClick={() => handleCommentAction(comment, 'forward')} className="p-1 text-purple-600 hover:bg-purple-50 rounded" title="Forward"><Send className="w-4 h-4" /></button>
                                )}
                                {comment.status !== 'ignored' && comment.status !== 'submitted_to_external' && (
                                  <button onClick={() => handleCommentAction(comment, 'ignore')} className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="Ignore"><XCircle className="w-4 h-4" /></button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {qualification.comments.length === 0 && (
                        <p className="text-center py-4 text-gray-500">No public comments for this qualification.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredQualifications.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No qualifications found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-4">Comments by Status</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1"><span>Pending</span><span className="font-medium">{pendingComments}</span></div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${totalComments ? (pendingComments / totalComments) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span>Reviewed / Forwarded</span><span className="font-medium">{totalComments - pendingComments}</span></div>
                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${totalComments ? ((totalComments - pendingComments) / totalComments) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="font-semibold mb-4">Comment Sources</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Webform</span><span className="font-medium">{qualifications.reduce((acc, q) => acc + q.comments.filter(c => c.source === 'webform').length, 0)}</span></div>
              <div className="flex justify-between"><span>Email</span><span className="font-medium">{qualifications.reduce((acc, q) => acc + q.comments.filter(c => c.source === 'email').length, 0)}</span></div>
              <div className="flex justify-between"><span>Generated (Demo)</span><span className="font-medium text-pink-600">{qualifications.reduce((acc, q) => acc + q.comments.filter(c => c.isInternalGenerated).length, 0)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold mb-4">Public Input Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Auto-import emails as comments</p>
                <p className="text-sm text-gray-500">Automatically pull comments from configured email accounts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600" />
              </label>
            </div>
            <div className="pt-4">
              <button className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700">Save Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isModalOpen && selectedQualification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-pink-50 to-white">
              <div>
                <h3 className="text-lg font-semibold">{selectedQualification.qualificationTitle}</h3>
                <p className="text-sm text-gray-500">Code: {selectedQualification.qualificationCode}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Qualification Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Qualification Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs text-gray-500">Code</p><p className="font-medium">{selectedQualification.qualificationCode}</p></div>
                  <div><p className="text-xs text-gray-500">NQF Level</p><p className="font-medium">Level {selectedQualification.qualificationLevel}</p></div>
                  <div><p className="text-xs text-gray-500">Credits</p><p className="font-medium">{selectedQualification.credits}</p></div>
                  <div><p className="text-xs text-gray-500">Submitted By</p><p className="font-medium">{selectedQualification.submittedBy}</p></div>
                  <div><p className="text-xs text-gray-500">Date</p><p className="font-medium">{selectedQualification.submittedDate}</p></div>
                  <div><p className="text-xs text-gray-500">Status</p>{getStatusBadge(selectedQualification.status)}</div>
                </div>
              </div>

              {/* Public Comments */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">Public Comments</h4>
                  {selectedQualification.status !== 'forwarded' && (
                    <button
                      onClick={() => handleOpenGenerateComment(selectedQualification)}
                      className="px-3 py-1.5 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />Add Comment
                    </button>
                  )}
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedQualification.comments.map(comment => (
                    <div key={comment.id} className="bg-white p-3 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium">{comment.submitterName}</span>
                            {comment.organization && <span className="text-xs text-gray-500">({comment.organization})</span>}
                            {getCommentStatusBadge(comment.status)}
                            {comment.isInternalGenerated && (
                              <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">Generated</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{comment.comment}</p>
                          <p className="text-xs text-gray-400 mt-1">{comment.commentDate} via {comment.source}</p>
                        </div>
                        {selectedQualification.status !== 'forwarded' && (
                          <div className="flex gap-1 ml-4">
                            <button onClick={() => handleOpenGenerateComment(selectedQualification, comment)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteComment(selectedQualification.id, comment.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            {comment.status !== 'submitted_to_external' && (
                              <button onClick={() => handleSubmitToExternal(selectedQualification, comment)} className="p-1 text-pink-600 hover:bg-pink-50 rounded" title="Submit to External"><Send className="w-4 h-4" /></button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedQualification.comments.length === 0 && (
                    <p className="text-center py-6 text-gray-400">No comments yet. Click "Add Comment" to generate one.</p>
                  )}
                </div>
              </div>

              {/* Resolution Document — read-only, synced from previous section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-purple-600" />Resolution Document
                </h4>

                {/* Info banner explaining the source */}
                <div className="mb-3 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">
                    The resolution document is generated and attached in the <strong>previous section</strong> of the workflow. It will appear here automatically once it has been issued and synced.
                  </p>
                </div>

                {selectedQualification.resolutionDocument ? (
                  <div className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-purple-600" />
                        <div>
                          <p className="font-medium">{selectedQualification.resolutionDocument.fileName || 'Resolution Letter'}</p>
                          <p className="text-xs text-gray-500">Resolution #: {selectedQualification.resolutionDocument.resolutionNumber || selectedQualification.resolutionDocument.letterNumber || '—'}</p>
                          <p className="text-xs text-gray-500">Issue Date: {selectedQualification.resolutionDocument.issueDate || '—'}</p>
                          <p className="text-xs text-gray-500">Signed By: {selectedQualification.resolutionDocument.signedBy || '—'}</p>
                          {selectedQualification.resolutionDocument.notes && (
                            <p className="text-xs text-gray-500 mt-1">Notes: {selectedQualification.resolutionDocument.notes}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const letterText = `QCTO RESOLUTION LETTER\n\nLetter Number: ${selectedQualification.resolutionDocument?.letterNumber || selectedQualification.resolutionDocument?.resolutionNumber || 'N/A'}\nIssue Date: ${selectedQualification.resolutionDocument?.issueDate || 'N/A'}\nSigned By: ${selectedQualification.resolutionDocument?.signedBy || 'N/A'}\n${selectedQualification.resolutionDocument?.notes ? `\nNotes:\n${selectedQualification.resolutionDocument.notes}` : ''}\n\n---\nThis is an official QCTO document.`;
                          const blob = new Blob([letterText], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `QCTO_Letter_${selectedQualification.resolutionDocument?.letterNumber || selectedQualification.resolutionDocument?.resolutionNumber || 'Approval'}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Download Resolution Letter"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5 border border-dashed border-gray-300 rounded-lg bg-white">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No resolution document available yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Complete the previous section to generate and attach a resolution letter.</p>
                  </div>
                )}

                {/* Close Public Comments — the ONLY gate to Approval Phase */}
                {selectedQualification.status !== 'forwarded' && (
                  <div className="mt-4 pt-4 border-t">
                    <button
                      onClick={handleClosePublicComments}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Close Public Comments &amp; Forward to Approval
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      This will move the qualification to the Qualifications Approval Phase for final review.
                    </p>
                  </div>
                )}

                {selectedQualification.status === 'forwarded' && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Qualification has been forwarded to the Qualifications Approval Phase.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Action Modal */}
      {isCommentModalOpen && selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gradient-to-r from-pink-50 to-white">
              <h3 className="text-lg font-semibold">
                {commentAction === 'edit' && 'Edit Comment'}
                {commentAction === 'delete' && 'Delete Comment'}
                {commentAction === 'forward' && 'Forward Comment'}
                {commentAction === 'ignore' && 'Ignore Comment'}
                {commentAction === 'submit_external' && 'Submit to External'}
              </h3>
              <button onClick={() => setIsCommentModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {commentAction === 'delete' && <p>Are you sure you want to delete this comment? This cannot be undone.</p>}
              {commentAction === 'ignore' && <p>This comment will be marked as ignored and will not be forwarded. Continue?</p>}
              {commentAction === 'forward' && <p>This comment will be marked as forwarded and included in the resolution package. Continue?</p>}
              {commentAction === 'submit_external' && <p>This comment will be submitted to the external Public Submissions screen for the Quality Partner to review. Continue?</p>}
              {commentAction === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Edit Comment</label>
                  <textarea value={editedComment} onChange={e => setEditedComment(e.target.value)} className="w-full border rounded-lg p-3 text-sm" rows={4} />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setIsCommentModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-white">Cancel</button>
              <button
                onClick={processCommentAction}
                className={`px-4 py-2 rounded-lg text-sm text-white ${commentAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : commentAction === 'edit' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-pink-600 hover:bg-pink-700'}`}
              >
                {commentAction === 'delete' ? 'Delete' : commentAction === 'edit' ? 'Save Changes' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate / Edit Comment Modal */}
      {isGenerateCommentOpen && generateForQualification && (
        <GenerateCommentModal
          qualification={generateForQualification}
          editingComment={editingCommentData}
          onClose={() => { setIsGenerateCommentOpen(false); setEditingCommentData(null); setGenerateForQualification(null); }}
          onSave={handleSaveGeneratedComment}
        />
      )}
    </div>
  );
}