// screens/subtabs/AgendaInformation.tsx
import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { Agenda, AgendaItem, AgendaReview } from '@/types';
import ReviewDetailsModal from './ReviewDetailsModal';
import { FolderOpen } from 'lucide-react';

interface AgendaInformationProps {
  agenda: Agenda | null;
  onSave: (agenda: Agenda) => void;
  onCancel: () => void;
  onManageProject?: (agendaId: string, itemId: string, itemName: string) => void;
}

const AgendaInformation: React.FC<AgendaInformationProps> = ({
  agenda,
  onSave,
  onCancel,
  onManageProject,
}) => {
  const { currentUser, currentRole, projects } = useApp();

  const [agendaName, setAgendaName] = useState(agenda?.name || '');
  const [agendaDescription, setAgendaDescription] = useState(agenda?.description || '');
  const [items, setItems] = useState<AgendaItem[]>(agenda?.items || []);
  const [status, setStatus] = useState<Agenda['status']>(agenda?.status || 'draft');
  const [selectedReview, setSelectedReview] = useState<{ review: AgendaReview; stage: string } | null>(null);
  const [isEditingRejected, setIsEditingRejected] = useState(false);

  const [minutesDocument, setMinutesDocument] = useState<File | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  

  // Helper function to check if user can edit rejected agenda
  const canEditRejectedAgenda = () => {
    return (
      agenda?.status === 'rejected' && 
      (currentRole === 'Forum' || 
       currentRole === 'Research Chief Director' || 
       currentRole === 'Research Chief Executive Officer')
    );
  };

  // Function to handle editing a rejected agenda
  const handleEditRejectedAgenda = () => {
    // Store the original agenda data
    setAgendaName(agenda?.name || '');
    setAgendaDescription(agenda?.description || '');
    setItems(agenda?.items || []);
    setStatus('draft');
    setIsEditingRejected(true);
  };

  // Function to handle resubmission after rejection
  const handleResubmitAfterRejection = () => {
    if (!agendaName.trim()) {
      alert('Please enter an agenda name');
      return;
    }

    // Determine which stage to submit to based on original rejection stage
    let newStatus: Agenda['status'] = 'forum_review';
    
    if (agenda?.rejectionStage === 'chief_director_review') {
      newStatus = 'chief_director_review';
    } else if (agenda?.rejectionStage === 'ceo_approval') {
      newStatus = 'ceo_approval_pending';
    } else {
      newStatus = 'forum_review';
    }

    const updatedAgenda: Agenda = {
      ...agenda!,
      name: agendaName,
      description: agendaDescription,
      status: newStatus,
      items: items,
      rejectionReason: undefined,
      rejectionStage: undefined,
      updatedAt: new Date(),
      submittedAt: new Date(),
      submittedBy: currentUser.name,
      // Clear previous reviews based on resubmission level
      forumReview: newStatus === 'forum_review' ? undefined : agenda?.forumReview,
      chiefDirectorReview: newStatus === 'chief_director_review' ? undefined : agenda?.chiefDirectorReview,
      ceoApproval: newStatus === 'ceo_approval_pending' ? undefined : agenda?.ceoApproval,
    };

    onSave(updatedAgenda);
    setIsEditingRejected(false);
  };

  // Function to render rejected agenda actions
  const renderRejectedActions = () => {
    if (!canEditRejectedAgenda()) return null;
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-red-800 font-semibold mb-1">Agenda Rejected</h4>
            <p className="text-sm text-red-700 mb-2">
              Reason: {agenda?.rejectionReason || 'No reason provided'}
            </p>
            <p className="text-xs text-red-600">
              You can edit the agenda and resubmit for approval at the {agenda?.rejectionStage === 'forum_review' ? 'Forum' : agenda?.rejectionStage === 'chief_director_review' ? 'Chief Director' : 'CEO'} level.
            </p>
          </div>
          <button
            onClick={handleEditRejectedAgenda}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Edit & Resubmit
          </button>
        </div>
      </div>
    );
  };

  const addNewItem = () => {
    const newItem: AgendaItem = {
      id: `item-${Date.now()}`,
      name: '',
      type: 'internal',
      plannedTime: { start: '', end: '' },
      actualTime: { start: '', end: '' },
      plannedCost: 0,
      actualCost: 0,
      additionalItems: [],
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<AgendaItem>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleSubmit = (isDraft: boolean = false) => {
    if (!agendaName.trim()) {
      alert('Please enter an agenda name');
      return;
    }

    const newStatus = isDraft ? 'draft' : 'forum_review';

    const newAgenda: Agenda = {
      id: agenda?.id || `agenda-${Date.now()}`,
      name: agendaName,
      description: agendaDescription,
      status: newStatus,
      items,
      createdAt: agenda?.createdAt || new Date(),
      updatedAt: new Date(),
      createdBy: agenda?.createdBy || currentUser.name,
      createdByRole: agenda?.createdByRole || currentUser.role,
      submittedAt: !isDraft && !agenda?.submittedAt ? new Date() : agenda?.submittedAt,
      submittedBy: !isDraft && !agenda?.submittedBy ? currentUser.name : agenda?.submittedBy,
    };

    onSave(newAgenda);
    setIsEditingRejected(false);
  };

 const handleForumApprove = () => {
  if (!minutesDocument) {
    alert('Please upload the minutes document');
    return;
  }

  const review: AgendaReview = {
    reviewedBy: currentUser.name,
    reviewedAt: new Date(),
    reviewRole: currentRole,
    comments: reviewComments,
    minutesDocument: {
      name: minutesDocument.name,
      url: URL.createObjectURL(minutesDocument),
      uploadedAt: new Date(),
    },
    decision: 'approve',
  };

  const updatedAgenda: Agenda = {
    ...agenda!,
    status: 'chief_director_review', // This will trigger the 'approved' action in updateAgenda
    forumReview: review,
    updatedAt: new Date(),
  };

  onSave(updatedAgenda);
};

 const handleForumReject = () => {
  if (!rejectionReason.trim()) {
    alert('Please provide a reason for rejection');
    return;
  }

  const review: AgendaReview = {
    reviewedBy: currentUser.name,
    reviewedAt: new Date(),
    reviewRole: currentRole,
    comments: rejectionReason,
    decision: 'reject',
  };

  const updatedAgenda: Agenda = {
    ...agenda!,
    status: 'rejected', // This will trigger the 'rejected' action in updateAgenda
    forumReview: review,
    rejectionReason,
    rejectionStage: 'forum_review',
    updatedAt: new Date(),
  };

  onSave(updatedAgenda);
};

const handleChiefDirectorApprove = () => {
  const review: AgendaReview = {
    reviewedBy: currentUser.name,
    reviewedAt: new Date(),
    reviewRole: currentRole,
    comments: reviewComments,
    decision: 'approve',
  };

  const updatedAgenda: Agenda = {
    ...agenda!,
    status: 'ceo_approval_pending', // This will trigger the 'approved' action in updateAgenda
    chiefDirectorReview: review,
    updatedAt: new Date(),
  };

  onSave(updatedAgenda);
};

const handleChiefDirectorReject = () => {
  if (!rejectionReason.trim()) {
    alert('Please provide a reason for rejection');
    return;
  }

  const review: AgendaReview = {
    reviewedBy: currentUser.name,
    reviewedAt: new Date(),
    reviewRole: currentRole,
    comments: rejectionReason,
    decision: 'reject',
  };

  const updatedAgenda: Agenda = {
    ...agenda!,
    status: 'rejected', // This will trigger the 'rejected' action in updateAgenda
    chiefDirectorReview: review,
    rejectionReason,
    rejectionStage: 'chief_director_review',
    updatedAt: new Date(),
  };

  onSave(updatedAgenda);
};

 const handleCEOApprove = () => {
  const review: AgendaReview = {
    reviewedBy: currentUser.name,
    reviewedAt: new Date(),
    reviewRole: currentRole,
    comments: reviewComments,
    decision: 'approve',
  };

  const updatedAgenda: Agenda = {
    ...agenda!,
    status: 'approved', // This will trigger the 'approved' action in updateAgenda
    ceoApproval: review,
    approvedAt: new Date(),
    approvedBy: currentUser.name,
    updatedAt: new Date(),
  };

  onSave(updatedAgenda);
};

const handleCEOReject = () => {
  if (!rejectionReason.trim()) {
    alert('Please provide a reason for rejection');
    return;
  }

  const review: AgendaReview = {
    reviewedBy: currentUser.name,
    reviewedAt: new Date(),
    reviewRole: currentRole,
    comments: rejectionReason,
    decision: 'reject',
  };

  const updatedAgenda: Agenda = {
    ...agenda!,
    status: 'rejected', // This will trigger the 'rejected' action in updateAgenda
    ceoApproval: review,
    rejectionReason,
    rejectionStage: 'ceo_approval',
    updatedAt: new Date(),
  };

  onSave(updatedAgenda);
};

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderReviewHistory = () => {
    const reviews = [];

    if (agenda?.forumReview) {
      reviews.push({
        stage: 'Forum Review',
        review: agenda.forumReview,
        icon: '📋',
      });
    }

    if (agenda?.chiefDirectorReview) {
      reviews.push({
        stage: 'Chief Director Review',
        review: agenda.chiefDirectorReview,
        icon: '👔',
      });
    }

    if (agenda?.ceoApproval) {
      reviews.push({
        stage: 'CEO Approval',
        review: agenda.ceoApproval,
        icon: '✓',
      });
    }

    if (reviews.length === 0) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📝</span> Review History
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((review, index) => (
            <div
              key={index}
              onClick={() => setSelectedReview({ review: review.review, stage: review.stage })}
              className="border-l-4 border-blue-500 bg-gray-50 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{review.icon}</span>
                <h5 className="font-semibold text-gray-900">{review.stage}</h5>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{review.review.reviewedBy}</span>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    review.review.decision === 'approve'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {review.review.decision === 'approve' ? 'Approved' : 'Rejected'}
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                {new Date(review.review.reviewedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAgendaItems = () => {
    if (!agenda || agenda.items.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Agenda Items</h4>
          <p className="text-gray-500 text-center py-8">No items added to this agenda.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>📌</span> Agenda Items 
        </h4>

        <div className="space-y-6">
          {agenda.items.map((item, index) => {
            const linkedProject = projects.find(
              (p) => p.agendaId === agenda.id && p.agendaItemId === item.id
            );

            const actualStart =
              linkedProject?.actualStartDate
                ? new Date(linkedProject.actualStartDate).toISOString()
                : item.actualTime?.start;

            const actualEnd =
              linkedProject?.actualEndDate
                ? new Date(linkedProject.actualEndDate).toISOString()
                : item.actualTime?.end;

            const actualCost =
              linkedProject?.actualCost !== undefined && linkedProject?.actualCost !== null
                ? linkedProject.actualCost
                : item.actualCost;

            const hasActualData = !!actualStart || !!actualEnd || (actualCost ?? 0) > 0;

            return (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h5 className="text-xl font-bold text-gray-900">
                    Item {index + 1}: {item.name}
                  </h5>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        item.type === 'internal'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {item.type === 'internal' ? 'Internal' : 'External'}
                    </span>

                    {linkedProject && (
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${
                          linkedProject.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : linkedProject.status === 'under_review'
                            ? 'bg-blue-100 text-blue-800'
                            : linkedProject.status === 'awaiting_report_submission'
                            ? 'bg-orange-100 text-orange-800'
                            : linkedProject.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {linkedProject.status === 'awaiting_report_submission'
                          ? 'Awaiting Report Submission'
                          : linkedProject.status === 'under_review'
                          ? 'Under Review'
                          : linkedProject.status === 'in_progress'
                          ? 'In Progress'
                          : linkedProject.status === 'completed'
                          ? 'Completed'
                          : 'Not Started'}
                      </span>
                    )}

                    {agenda.status === 'approved' && onManageProject && (
                      <button
                        onClick={() => onManageProject(agenda.id, item.id, item.name)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <FolderOpen className="h-4 w-4" />
                        Manage Project
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h6 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span>📅</span> Planned
                    </h6>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="text-base font-medium text-gray-900">
                          {formatDisplayDate(item.plannedTime.start)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="text-base font-medium text-gray-900">
                          {formatDisplayDate(item.plannedTime.end)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Cost</p>
                        <p className="text-base font-medium text-gray-900">
                          ZAR {item.plannedCost.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <h6 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <span>✅</span> Actual
                    </h6>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-green-600">Start Date</p>
                        <p className="text-base font-medium text-green-800">
                          {formatDisplayDate(actualStart)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-600">End Date</p>
                        <p className="text-base font-medium text-green-800">
                          {formatDisplayDate(actualEnd)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-green-600">Cost</p>
                        <p className="text-base font-medium text-green-800">
                          {actualCost !== undefined && actualCost !== null && actualCost > 0
                            ? `ZAR ${actualCost.toLocaleString()}`
                            : '-'}
                        </p>
                      </div>
                      {!hasActualData && (
                        <p className="text-xs text-gray-500 italic mt-2">
                          Will be populated after project execution
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAgendaDetails = () => {
    if (!agenda) return null;

    return (
      <>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
  {/* HEADER ROW */}
  <div className="flex justify-between items-start mb-4">
    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
      <span>ℹ️</span> Agenda Information
    </h4>

    {/* STATUS TOP RIGHT */}
    
    <span
    
      className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
        agenda.status === 'draft'
          ? 'bg-gray-100 text-gray-800'
          : agenda.status === 'forum_review'
          ? 'bg-blue-100 text-blue-800'
          : agenda.status === 'chief_director_review'
          ? 'bg-purple-100 text-purple-800'
          : agenda.status === 'ceo_approval_pending'
          ? 'bg-orange-100 text-orange-800'
          : agenda.status === 'approved'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      
      {agenda.status.replace('_', ' ').toUpperCase()}
    </span>
  </div>

  {/* CONTENT GRID */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <p className="text-sm text-gray-500">Agenda Name</p>
      <p className="font-medium text-gray-900 text-lg">{agenda.name}</p>
    </div>

    <div className="md:col-span-2">
      <p className="text-sm text-gray-500">Description</p>
      <p className="text-gray-900">
        {agenda.description || 'No description provided'}
      </p>
    </div>

    <div className="flex gap-60 flex-wrap md:col-span-2">
      <div>
        <p className="text-sm text-gray-500">Created By</p>
        <p className="text-gray-900">{agenda.createdBy}</p>
      </div>

      <div>
        <p className="text-sm text-gray-500">Created At</p>
        <p className="text-gray-900">
          {new Date(agenda.createdAt).toLocaleDateString()}
        </p>
      </div>

      {agenda.submittedAt && (
        <div>
          <p className="text-sm text-gray-500">Submitted At</p>
          <p className="text-gray-900">
            {new Date(agenda.submittedAt).toLocaleDateString()}
          </p>
        </div>
      )}
         {agenda.approvedAt && (
      <div>
        <p className="text-sm text-gray-500">Approved At</p>
        <p className="text-gray-900">
          {new Date(agenda.approvedAt).toLocaleDateString()}
        </p>
      </div>
    )}

    {agenda.approvedBy && (
      <div>
        <p className="text-sm text-gray-500">Approved By</p>
        <p className="text-gray-900">{agenda.approvedBy}</p>
      </div>
    )}
    </div>

 

    {agenda.rejectionReason && (
      <div className="md:col-span-2">
        <p className="text-sm text-red-600 font-medium">Rejection Reason</p>
        <p className="text-red-700">{agenda.rejectionReason}</p>
      </div>
    )}
  </div>
</div>

        {renderAgendaItems()}
      </>
    );
  };

  const renderReviewForm = (title: string, showMinutesUpload: boolean = false) => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>✍️</span> {title}
        </h4>

        <div className="space-y-4">
          {showMinutesUpload && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minutes Document <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                onChange={(e) => setMinutesDocument(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload the meeting minutes document for this agenda
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Comments
            </label>
            <textarea
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Enter your review comments, feedback, or observations..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={
                title === 'Forum Review'
                  ? handleForumApprove
                  : title === 'Chief Director Review'
                  ? handleChiefDirectorApprove
                  : handleCEOApprove
              }
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Approve Agenda
            </button>
            <button
              onClick={
                title === 'Forum Review'
                  ? handleForumReject
                  : title === 'Chief Director Review'
                  ? handleChiefDirectorReject
                  : handleCEOReject
              }
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reject Agenda
            </button>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason (if rejecting)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Provide detailed reason for rejection..."
            />
          </div>
        </div>
      </div>
    );
  };

  if (selectedReview) {
    return (
      <ReviewDetailsModal
        review={selectedReview.review}
        stage={selectedReview.stage}
        onClose={() => setSelectedReview(null)}
      />
    );
  }

  // Handle editing rejected agenda
  if (isEditingRejected && status === 'draft') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Edit Rejected Agenda</h3>
            <p className="text-gray-600 mt-1">
              Modify agenda items based on rejection feedback
              {agenda?.rejectionReason && `: ${agenda.rejectionReason}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleResubmitAfterRejection}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Resubmit for {agenda?.rejectionStage === 'chief_director_review' 
                ? 'Chief Director Review' 
                : agenda?.rejectionStage === 'ceo_approval'
                ? 'CEO Approval'
                : 'Forum Review'}
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Agenda Details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agenda Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={agendaName}
                onChange={(e) => setAgendaName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter agenda name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={agendaDescription}
                onChange={(e) => setAgendaDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter agenda description"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Agenda Items</h4>
            <button
              onClick={addNewItem}
              className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              + Add Item
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No items added. Click "Add Item" to start building your agenda.
            </p>
          ) : (
            <div className="space-y-6">
              {items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h5 className="font-semibold text-gray-900">Item {index + 1}</h5>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter item name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={item.type}
                        onChange={(e) =>
                          updateItem(item.id, {
                            type: e.target.value as 'internal' | 'external',
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="internal">Internal</option>
                        <option value="external">External</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Planned Dates (Start - End) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={formatDateForInput(item.plannedTime.start)}
                          onChange={(e) =>
                            updateItem(item.id, {
                              plannedTime: { ...item.plannedTime, start: e.target.value },
                            })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <span className="self-center">-</span>
                        <input
                          type="date"
                          value={formatDateForInput(item.plannedTime.end)}
                          onChange={(e) =>
                            updateItem(item.id, {
                              plannedTime: { ...item.plannedTime, end: e.target.value },
                            })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Planned Cost (ZAR)
                      </label>
                      <input
                        type="number"
                        value={item.plannedCost}
                        onChange={(e) =>
                          updateItem(item.id, { plannedCost: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            This agenda was previously rejected. Please make the necessary changes and resubmit for approval.
          </p>
        </div>
      </div>
    );
  }

  // Handle draft creation/editing
  if (!agenda || status === 'draft') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {agenda ? 'Edit Agenda' : 'Create New Agenda'}
            </h3>
            <p className="text-gray-600 mt-1">
              {agenda ? 'Modify agenda details and items' : 'Fill in the details to create a new agenda'}
            </p>
          </div>
          <div className="flex gap-2">
            {status === 'draft' && (
              <button
                onClick={() => handleSubmit(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Save as Draft
              </button>
            )}
            {status === 'draft' && (
              <button
                onClick={() => handleSubmit(false)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Submit for Forum Review
              </button>
            )}
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Agenda Details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agenda Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={agendaName}
                onChange={(e) => setAgendaName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter agenda name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={agendaDescription}
                onChange={(e) => setAgendaDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter agenda description"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Agenda Items</h4>
            <button
              onClick={addNewItem}
              className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              + Add Item
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No items added. Click "Add Item" to start building your agenda.
            </p>
          ) : (
            <div className="space-y-6">
              {items.map((item, index) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h5 className="font-semibold text-gray-900">Item {index + 1}</h5>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter item name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={item.type}
                        onChange={(e) =>
                          updateItem(item.id, {
                            type: e.target.value as 'internal' | 'external',
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="internal">Internal</option>
                        <option value="external">External</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Planned Dates (Start - End) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={formatDateForInput(item.plannedTime.start)}
                          onChange={(e) =>
                            updateItem(item.id, {
                              plannedTime: { ...item.plannedTime, start: e.target.value },
                            })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <span className="self-center">-</span>
                        <input
                          type="date"
                          value={formatDateForInput(item.plannedTime.end)}
                          onChange={(e) =>
                            updateItem(item.id, {
                              plannedTime: { ...item.plannedTime, end: e.target.value },
                            })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Planned Cost (ZAR)
                      </label>
                      <input
                        type="number"
                        value={item.plannedCost}
                        onChange={(e) =>
                          updateItem(item.id, { plannedCost: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            This agenda is currently in <strong>Draft</strong> mode. Once submitted, it will go to Forum Review.
          </p>
        </div>
      </div>
    );
  }

  // Handle rejected agenda view (non-edit mode)
  if (status === 'rejected' && agenda) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Rejected Agenda</h3>
            <p className="text-gray-600 mt-1">{agenda.name}</p>
          </div>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Back to List
          </button>
        </div>

        {renderRejectedActions()}
        {renderAgendaDetails()}
        {renderReviewHistory()}
      </div>
    );
  }

  // Handle forum review
  if (status === 'forum_review' && currentRole === 'Forum') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Forum Review</h3>
            <p className="text-gray-600 mt-1">Reviewing agenda: {agenda.name}</p>
          </div>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Back to List
          </button>
        </div>

        {renderAgendaDetails()}
        {renderReviewForm('Forum Review', true)}
      </div>
    );
  }

  // Handle chief director review
  if (status === 'chief_director_review' && currentRole === 'Research Chief Director') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Chief Director Review</h3>
            <p className="text-gray-600 mt-1">Secondary review for agenda: {agenda.name}</p>
          </div>
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg">
            Back to List
          </button>
        </div>

        {renderAgendaDetails()}
        {renderReviewHistory()}
        {renderReviewForm('Chief Director Review', false)}
      </div>
    );
  }

  // Handle CEO approval
  if (status === 'ceo_approval_pending' && currentRole === 'Research Chief Executive Officer') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">CEO Final Approval</h3>
            <p className="text-gray-600 mt-1">Final approval for agenda: {agenda.name}</p>
          </div>
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg">
            Back to List
          </button>
        </div>

        {renderAgendaDetails()}
        {renderReviewHistory()}
        {renderReviewForm('CEO Approval', false)}
      </div>
    );
  }

  // Default view for other statuses
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Agenda Details</h3>
          <p className="text-gray-600 mt-1">{agenda?.name}</p>
        </div>
        <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg">
          Back to List
        </button>
      </div>

      {renderAgendaDetails()}
      {renderReviewHistory()}
    </div>
  );
};

export default AgendaInformation;