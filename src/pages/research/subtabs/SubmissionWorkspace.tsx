// screens/subtabs/SubmissionWorkspace.tsx
import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, FileText, Clock, Play, CheckCircle, XCircle, Upload } from 'lucide-react';
import type { BulletinSubmission, BulletinEvaluation } from '@/types';

const SubmissionWorkspace = () => {
  const { bulletinSubmissions, setBulletinSubmissions, currentUser } = useApp();
  const [selectedSubmission, setSelectedSubmission] = useState<BulletinSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('call');
  
  // Evaluation state
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [evaluationComments, setEvaluationComments] = useState('');
  const [directorChecklistState, setDirectorChecklistState] = useState<Record<string, boolean>>({});
  const [directorEvaluationComments, setDirectorEvaluationComments] = useState('');
  
  // Edit state
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editNotes, setEditNotes] = useState('');

  // Keep selected submission in sync with global state and load existing evaluations
  useEffect(() => {
    if (selectedSubmission) {
      const latestSubmission = bulletinSubmissions.find(
        sub => sub.id === selectedSubmission.id
      );
      if (latestSubmission && JSON.stringify(latestSubmission) !== JSON.stringify(selectedSubmission)) {
        setSelectedSubmission(latestSubmission);
        
        // Load existing deputy director evaluation if any
        const deputyEvaluationItem = latestSubmission.evaluations?.find(
          evaluation => evaluation.reviewerRole === 'Research Deputy Director'
        );
        if (deputyEvaluationItem) {
          const loadedChecklist: Record<string, boolean> = {};
          deputyEvaluationItem.checklist.forEach(item => {
            loadedChecklist[item.criteriaId] = item.isMet;
          });
          setChecklistState(loadedChecklist);
          setEvaluationComments(deputyEvaluationItem.comments || '');
        } else {
          setChecklistState({});
          setEvaluationComments('');
        }
        
        // Load existing director evaluation if any
        const directorEvaluationItem = latestSubmission.evaluations?.find(
          evaluation => evaluation.reviewerRole === 'Research Director'
        );
        if (directorEvaluationItem) {
          const loadedChecklist: Record<string, boolean> = {};
          directorEvaluationItem.checklist.forEach(item => {
            loadedChecklist[item.criteriaId] = item.isMet;
          });
          setDirectorChecklistState(loadedChecklist);
          setDirectorEvaluationComments(directorEvaluationItem.comments || '');
        } else {
          setDirectorChecklistState({});
          setDirectorEvaluationComments('');
        }
        
        setEditFile(null);
        setEditNotes('');
      }
    }
  }, [bulletinSubmissions, selectedSubmission]);

  const evaluationChecklist = [
    { id: 'completeness', label: 'Submission Completeness', description: 'Is the submission complete with all required information?' },
    { id: 'quality', label: 'Quality of Content', description: 'Is the content of high quality and well-structured?' },
    { id: 'relevance', label: 'Relevance to Call', description: 'Does the submission align with the call objectives?' },
    { id: 'originality', label: 'Originality', description: 'Is the submission original and innovative?' },
    { id: 'clarity', label: 'Clarity', description: 'Is the submission clear and easy to understand?' },
  ];

  // Filter submissions based on status
  const pendingSubmissions = bulletinSubmissions.filter(sub => 
    sub.status === 'Submitted' || sub.status === 'Under Review'
  );
  
  const directorReviewSubmissions = bulletinSubmissions.filter(sub => 
    sub.status === 'Pending Director Review' || sub.status === 'Under Director Review'
  );
  
  const editingSubmissions = bulletinSubmissions.filter(sub => 
    sub.status === 'Editing Pending' || sub.status === 'Editing In Progress'
  );

  const viewSubmission = (submission: BulletinSubmission) => {
    setSelectedSubmission(submission);
    setIsViewModalOpen(true);
    setActiveTab('call');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      'Submitted': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Review' },
      'Under Review': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Review' },
      'Pending Director Review': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Director Review' },
      'Under Director Review': { color: 'bg-orange-100 text-orange-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Director Review' },
      'Editing Pending': { color: 'bg-purple-100 text-purple-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Editing Pending' },
      'Editing In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Editing In Progress' },
      'Accepted': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Accepted' },
      'Inserted into Bulletin': { color: 'bg-green-600 text-white', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Inserted' },
    };
    const config = statusConfig[status] || statusConfig['Submitted'];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getReviewStatusBadge = (reviewStatus?: string) => {
    if (!reviewStatus) return <span className="text-gray-400 text-xs">-</span>;
    const statusConfig: Record<string, { color: string; label: string }> = {
      'Deputy Director Recommended': { color: 'bg-green-100 text-green-800', label: 'DD Recommended' },
      'Director Recommended': { color: 'bg-blue-100 text-blue-800', label: 'Director Recommended' },
      'Inserted into Bulletin': { color: 'bg-purple-100 text-purple-800', label: 'Inserted' },
    };
    const config = statusConfig[reviewStatus];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        {config?.label || reviewStatus}
      </span>
    );
  };

  // Deputy Director Actions
  const handleStartReview = () => {
    if (!selectedSubmission) return;
    
    if (selectedSubmission.status === 'Submitted') {
      const updatedSubmissions = bulletinSubmissions.map(sub => 
        sub.id === selectedSubmission.id
          ? { ...sub, status: 'Under Review' as any }
          : sub
      );
      setBulletinSubmissions(updatedSubmissions);
    }
  };

  const handleDeputyDirectorEvaluation = (recommendation: 'recommend' | 'not_recommend') => {
    if (!selectedSubmission) return;
    
    const evaluation: BulletinEvaluation = {
      id: `eval-${Date.now()}`,
      submissionId: selectedSubmission.id,
      reviewerRole: currentUser.role,
      reviewerName: currentUser.name,
      checklist: evaluationChecklist.map(item => ({
        criteriaId: item.id,
        criteriaName: item.label,
        isMet: checklistState[item.id] || false,
        comments: evaluationComments,
      })),
      recommendation: recommendation,
      submittedAt: new Date().toISOString(),
    };
    
    // Remove any existing deputy director evaluation
    const existingEvaluations = (selectedSubmission.evaluations || []).filter(
      evaluation => evaluation.reviewerRole !== 'Research Deputy Director'
    );
    
    const updatedSubmissions = bulletinSubmissions.map(sub => 
      sub.id === selectedSubmission.id
        ? { 
            ...sub, 
            evaluations: [...existingEvaluations, evaluation],
            status: recommendation === 'recommend' ? 'Pending Director Review' as any : 'Submitted' as any,
            reviewStatus: recommendation === 'recommend' ? 'Deputy Director Recommended' as any : sub.reviewStatus
          }
        : sub
    );
    setBulletinSubmissions(updatedSubmissions);
    setIsViewModalOpen(false);
  };

  // Director Actions
  const handleStartDirectorReview = () => {
    if (!selectedSubmission) return;
    
    if (selectedSubmission.status === 'Pending Director Review') {
      const updatedSubmissions = bulletinSubmissions.map(sub => 
        sub.id === selectedSubmission.id
          ? { ...sub, status: 'Under Director Review' as any }
          : sub
      );
      setBulletinSubmissions(updatedSubmissions);
    }
  };

  const handleDirectorEvaluation = (recommendation: 'recommend' | 'not_recommend') => {
    if (!selectedSubmission) return;
    
    const evaluation: BulletinEvaluation = {
      id: `eval-${Date.now()}`,
      submissionId: selectedSubmission.id,
      reviewerRole: currentUser.role,
      reviewerName: currentUser.name,
      checklist: evaluationChecklist.map(item => ({
        criteriaId: item.id,
        criteriaName: item.label,
        isMet: directorChecklistState[item.id] || false,
        comments: directorEvaluationComments,
      })),
      recommendation: recommendation,
      submittedAt: new Date().toISOString(),
    };
    
    // Remove any existing director evaluation
    const existingEvaluations = (selectedSubmission.evaluations || []).filter(
      evaluation => evaluation.reviewerRole !== 'Research Director'
    );
    
    const updatedSubmissions = bulletinSubmissions.map(sub => 
      sub.id === selectedSubmission.id
        ? { 
            ...sub, 
            evaluations: [...existingEvaluations, evaluation],
            status: recommendation === 'recommend' ? 'Editing Pending' as any : 'Pending Director Review' as any,
            reviewStatus: recommendation === 'recommend' ? 'Director Recommended' as any : sub.reviewStatus
          }
        : sub
    );
    setBulletinSubmissions(updatedSubmissions);
    setIsViewModalOpen(false);
  };

  // Deputy Director Edit Actions
  const handleStartEditing = () => {
    if (!selectedSubmission) return;
    const updatedSubmissions = bulletinSubmissions.map(sub => 
      sub.id === selectedSubmission.id
        ? { ...sub, status: 'Editing In Progress' as any }
        : sub
    );
    setBulletinSubmissions(updatedSubmissions);
  };

 const handleInsertIntoBulletin = () => {
  if (!selectedSubmission || !editFile) return;
  
  const updatedSubmissions = bulletinSubmissions.map(sub => 
    sub.id === selectedSubmission.id
      ? { 
          ...sub, 
          editedSubmission: {
            id: `edit-${Date.now()}`,
            submissionId: selectedSubmission.id,
            editedDocument: {
              id: Math.random().toString(),
              name: editFile.name,
              url: URL.createObjectURL(editFile),
              uploadedAt: new Date().toISOString(),
            },
            editNotes: editNotes,
            editedBy: currentUser.name,
            editedAt: new Date().toISOString(),
            approvedForBulletin: true,
          },
          status: 'Accepted' as any,
          reviewStatus: 'Inserted into Bulletin' as any
        }
      : sub
  );
  setBulletinSubmissions(updatedSubmissions);
  setIsViewModalOpen(false);
};

  const canStartReview = () => {
    return currentUser.role === 'Research Deputy Director' && 
           selectedSubmission?.status === 'Submitted';
  };

  const canEvaluateDeputy = () => {
    return currentUser.role === 'Research Deputy Director' && 
           selectedSubmission?.status === 'Under Review' &&
           !selectedSubmission.evaluations?.some(e => e.reviewerRole === 'Research Deputy Director');
  };

  const canStartDirectorReview = () => {
    return currentUser.role === 'Research Director' && 
           selectedSubmission?.status === 'Pending Director Review';
  };

  const canEvaluateDirector = () => {
    return currentUser.role === 'Research Director' && 
           selectedSubmission?.status === 'Under Director Review' &&
           !selectedSubmission.evaluations?.some(e => e.reviewerRole === 'Research Director');
  };

  const canStartEditing = () => {
    return currentUser.role === 'Research Deputy Director' && 
           selectedSubmission?.status === 'Editing Pending';
  };

  const canInsertIntoBulletin = () => {
    return currentUser.role === 'Research Deputy Director' && 
           selectedSubmission?.status === 'Editing In Progress';
  };

  // Check if there are existing evaluations to display
  const hasDeputyEvaluation = selectedSubmission?.evaluations?.some(
    evaluation => evaluation.reviewerRole === 'Research Deputy Director'
  );
  
  const hasDirectorEvaluation = selectedSubmission?.evaluations?.some(
    evaluation => evaluation.reviewerRole === 'Research Director'
  );

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Submission Workspace</h3>
      <p className="text-gray-600">Review and manage bulletin submissions</p>
      
      {/* Deputy Director Review Section */}
      {pendingSubmissions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Deputy Director Review</h4>
            <p className="text-sm text-gray-500">Submissions ready for initial review or currently being reviewed</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call Number</TableHead>
                <TableHead>Call Title</TableHead>
                <TableHead>Submission Title</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Review Status</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.call.callNumber}</TableCell>
                  <TableCell>{submission.call.title}</TableCell>
                  <TableCell>{submission.submissionTitle || '-'}</TableCell>
                  <TableCell>{submission.applicantName}</TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell>{getReviewStatusBadge(submission.reviewStatus)}</TableCell>
                  <TableCell>{new Date(submission.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewSubmission(submission)}>
                      <Eye className="h-4 w-4 mr-2" />
                      {submission.status === 'Under Review' ? 'Continue Review' : 'Review'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Director Review Section */}
      {directorReviewSubmissions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Director Review</h4>
            <p className="text-sm text-gray-500">Submissions ready for director review or currently being reviewed</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call Number</TableHead>
                <TableHead>Call Title</TableHead>
                <TableHead>Submission Title</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Review Status</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {directorReviewSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.call.callNumber}</TableCell>
                  <TableCell>{submission.call.title}</TableCell>
                  <TableCell>{submission.submissionTitle || '-'}</TableCell>
                  <TableCell>{submission.applicantName}</TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell>{getReviewStatusBadge(submission.reviewStatus)}</TableCell>
                  <TableCell>{new Date(submission.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewSubmission(submission)}>
                      <Eye className="h-4 w-4 mr-2" />
                      {submission.status === 'Under Director Review' ? 'Continue Review' : 'Review'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Editing Section */}
      {editingSubmissions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Editing Workspace</h4>
            <p className="text-sm text-gray-500">Submissions ready for final editing or currently being edited</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call Number</TableHead>
                <TableHead>Call Title</TableHead>
                <TableHead>Submission Title</TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Review Status</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editingSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.call.callNumber}</TableCell>
                  <TableCell>{submission.call.title}</TableCell>
                  <TableCell>{submission.submissionTitle || '-'}</TableCell>
                  <TableCell>{submission.applicantName}</TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell>{getReviewStatusBadge(submission.reviewStatus)}</TableCell>
                  <TableCell>{new Date(submission.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewSubmission(submission)}>
                      <Eye className="h-4 w-4 mr-2" />
                      {submission.status === 'Editing In Progress' ? 'Continue Editing' : 'Edit'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Review Submission Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Review</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="call">Call for Submission</TabsTrigger>
                <TabsTrigger value="submission">Submission Details</TabsTrigger>
                <TabsTrigger value="review">Review & Edit</TabsTrigger>
              </TabsList>
              
              {/* Tab 1: Call Details */}
              <TabsContent value="call" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Call Information</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Call Number</Label><p className="font-medium">{selectedSubmission.call.callNumber}</p></div>
                    <div><Label className="text-sm text-gray-500">Title</Label><p className="font-medium">{selectedSubmission.call.title}</p></div>
                    <div><Label className="text-sm text-gray-500">Target Audience</Label><p className="font-medium">{selectedSubmission.call.targetAudience}</p></div>
                    <div><Label className="text-sm text-gray-500">Deadline</Label><p className="font-medium">{new Date(selectedSubmission.call.submissionDeadline).toLocaleString()}</p></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-lg"><p>{selectedSubmission.call.description}</p></div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Criteria</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Eligibility</Label><p className="mt-1">{selectedSubmission.call.eligibilityCriteria}</p></div>
                    <div><Label className="text-sm text-gray-500">Evaluation</Label><p className="mt-1">{selectedSubmission.call.evaluationCriteria}</p></div>
                  </div>
                </div>
                {selectedSubmission.call.attachments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      {selectedSubmission.call.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <a href={attachment.url} target="_blank" className="text-blue-600 hover:underline">{attachment.name}</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 2: Submission Details */}
              <TabsContent value="submission" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Applicant Information</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Applicant Name</Label><p className="font-medium">{selectedSubmission.applicantName}</p></div>
                    <div><Label className="text-sm text-gray-500">Role</Label><p className="font-medium">{selectedSubmission.applicantRole}</p></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Submission Details</h3>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Submission Title</Label><p className="mt-1">{selectedSubmission.submissionTitle}</p></div>
                    <div><Label className="text-sm text-gray-500">Description</Label><p className="mt-1">{selectedSubmission.submissionDescription}</p></div>
                    <div>
                      <Label className="text-sm text-gray-500">Submission Document</Label>
                      <div className="mt-1">
                        <a href={selectedSubmission.submissionDocument.url} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {selectedSubmission.submissionDocument.name}
                        </a>
                      </div>
                    </div>
                    {selectedSubmission.additionalNotes && (
                      <div><Label className="text-sm text-gray-500">Additional Notes</Label><p className="mt-1">{selectedSubmission.additionalNotes}</p></div>
                    )}
                  </div>
                </div>
                {selectedSubmission.editedSubmission && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Edited Version</h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <a href={selectedSubmission.editedSubmission.editedDocument.url} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {selectedSubmission.editedSubmission.editedDocument.name}
                      </a>
                      {selectedSubmission.editedSubmission.editNotes && (
                        <p className="text-sm text-gray-600 mt-2">Edit Notes: {selectedSubmission.editedSubmission.editNotes}</p>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 3: Review & Edit */}
    <TabsContent value="review" className="space-y-6 py-4">
  {/* Show Deputy Director's Evaluation (if exists) */}
  {hasDeputyEvaluation && selectedSubmission.evaluations?.find(e => e.reviewerRole === 'Research Deputy Director') && (
    <div className="border-b pb-6 mb-6">
      <h4 className="font-medium text-gray-700 mb-3">Deputy Director's Evaluation</h4>
      {(() => {
        const evaluationItem = selectedSubmission.evaluations?.find(e => e.reviewerRole === 'Research Deputy Director');
        if (!evaluationItem) return null;
        return (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Recommendation: 
                <span className={evaluationItem.recommendation === 'recommend' ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                  {evaluationItem.recommendation === 'recommend' ? '✓ Recommend' : '✗ Not Recommend'}
                </span>
              </span>
              <span className="text-xs text-gray-500">Reviewed on: {new Date(evaluationItem.submittedAt).toLocaleString()}</span>
            </div>
            <div className="space-y-1 mt-2">
              <p className="text-sm font-medium text-gray-700">Checklist Results:</p>
              {evaluationItem.checklist.map((item) => (
                <div key={item.criteriaId} className="flex items-center gap-2 text-sm">
                  {item.isMet ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                  <span>{item.criteriaName}</span>
                </div>
              ))}
            </div>
            {evaluationItem.comments && (
              <p className="text-sm text-gray-600 mt-3">Comments: {evaluationItem.comments}</p>
            )}
          </div>
        );
      })()}
    </div>
  )}
  
  {/* Show Director's Evaluation (if exists) */}
  {hasDirectorEvaluation && selectedSubmission.evaluations?.find(e => e.reviewerRole === 'Research Director') && (
    <div className="border-b pb-6 mb-6">
      <h4 className="font-medium text-gray-700 mb-3">Director's Evaluation</h4>
      {(() => {
        const evaluationItem = selectedSubmission.evaluations?.find(e => e.reviewerRole === 'Research Director');
        if (!evaluationItem) return null;
        return (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Recommendation: 
                <span className={evaluationItem.recommendation === 'recommend' ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                  {evaluationItem.recommendation === 'recommend' ? '✓ Recommend' : '✗ Not Recommend'}
                </span>
              </span>
              <span className="text-xs text-gray-500">Reviewed on: {new Date(evaluationItem.submittedAt).toLocaleString()}</span>
            </div>
            <div className="space-y-1 mt-2">
              <p className="text-sm font-medium text-gray-700">Checklist Results:</p>
              {evaluationItem.checklist.map((item) => (
                <div key={item.criteriaId} className="flex items-center gap-2 text-sm">
                  {item.isMet ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                  <span>{item.criteriaName}</span>
                </div>
              ))}
            </div>
            {evaluationItem.comments && (
              <p className="text-sm text-gray-600 mt-3">Comments: {evaluationItem.comments}</p>
            )}
          </div>
        );
      })()}
    </div>
  )}
  
  {/* Director's Action Section - Only show if director hasn't evaluated yet */}
  {selectedSubmission.status === 'Pending Director Review' && !hasDirectorEvaluation && (
    <div className="space-y-4">
      <Button onClick={handleStartDirectorReview} className="bg-blue-600 hover:bg-blue-700">
        <Play className="h-4 w-4 mr-2" />
        Start Director Review
      </Button>
      <p className="text-sm text-gray-500">Once started, the status will change to "Under Director Review". You can close the modal and come back later.</p>
    </div>
  )}
  
  {/* Director Evaluation Form - Only show if director is in review and hasn't submitted yet */}
  {canEvaluateDirector() && (
    <div className="space-y-4">
      <h4 className="font-medium">Your Evaluation (Director)</h4>
      <div className="space-y-3">
        {evaluationChecklist.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
            <Checkbox
              id={item.id}
              checked={directorChecklistState[item.id] || false}
              onCheckedChange={(checked) => setDirectorChecklistState(prev => ({ ...prev, [item.id]: checked === true }))}
            />
            <div className="flex-1">
              <Label htmlFor={item.id} className="font-medium cursor-pointer">{item.label}</Label>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div>
        <Label>Comments</Label>
        <Textarea
          value={directorEvaluationComments}
          onChange={(e) => setDirectorEvaluationComments(e.target.value)}
          placeholder="Add your evaluation comments..."
          rows={3}
          className="mt-1"
        />
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => handleDirectorEvaluation('not_recommend')} className="border-red-300 text-red-600 hover:bg-red-50">
          <XCircle className="h-4 w-4 mr-2" />
          Not Recommend
        </Button>
        <Button onClick={() => handleDirectorEvaluation('recommend')} className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-4 w-4 mr-2" />
          Recommend
        </Button>
      </div>
    </div>
  )}
  
  {/* Show status when both evaluations are complete */}
  {hasDeputyEvaluation && hasDirectorEvaluation && selectedSubmission.status === 'Editing Pending' && (
    <div className="bg-purple-50 p-4 rounded-lg">
      <p className="text-purple-800 font-medium">✓ Both Evaluations Complete</p>
      <p className="text-sm text-gray-600">This submission is ready for editing and insertion into the bulletin.</p>
    </div>
  )}
         
                {/* Editing Section */}
                {selectedSubmission.status === 'Editing Pending' && (
                  <div className="space-y-4 border-t pt-4">
                    <Button onClick={handleStartEditing} className="bg-blue-600 hover:bg-blue-700">
                      <Play className="h-4 w-4 mr-2" />
                      Start Editing
                    </Button>
                    <p className="text-sm text-gray-500">Once started, the status will change to "Editing In Progress". You can close the modal and come back later.</p>
                  </div>
                )}
                
                {canInsertIntoBulletin() && (
                  <div className="space-y-4 border-t pt-4">
                    <div>
                      <Label>Upload Edited Document</Label>
                      <Input
                        type="file"
                        onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                        className="mt-1"
                        accept=".pdf,.doc,.docx"
                      />
                    </div>
                    <div>
                      <Label>Edit Notes</Label>
                      <Textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Describe the changes made..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={handleInsertIntoBulletin} disabled={!editFile} className="bg-green-600 hover:bg-green-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Insert into Bulletin
                    </Button>
                  </div>
                )}
                
                {selectedSubmission.status === 'Accepted' && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-800 font-medium">✓ Submission Accepted</p>
                    <p className="text-sm text-gray-600">This submission has been accepted and inserted into the bulletin.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmissionWorkspace;