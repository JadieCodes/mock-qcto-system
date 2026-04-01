// screens/subtabs/SubmissionApproval.tsx
import React, { useState } from 'react';
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
import { Eye, FileText, Upload, CheckCircle, Clock, Play, XCircle } from 'lucide-react';
import type { ResearchRequest, ResearchSubmissionDocument, ResearchEvaluation, ResearchInternalStatus, ResearchReviewOutcome } from '@/types';

const SubmissionApproval = () => {
  const { researchApprovedRequests, setResearchApprovedRequests, currentUser, approvedRequests, setApprovedRequests } = useApp();
  const [selectedRequest, setSelectedRequest] = useState<ResearchRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('request');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmittingSubmission, setIsSubmittingSubmission] = useState(false);
  
  // Evaluation state
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [evaluationComments, setEvaluationComments] = useState('');

  const evaluationChecklist = [
    { id: 'completeness', label: 'Submission Completeness', description: 'Is the submission complete with all required documents?' },
    { id: 'quality', label: 'Submission Quality', description: 'Is the submission of high quality and well-organized?' },
    { id: 'alignment', label: 'Alignment with TOR', description: 'Does the submission align with the Terms of Reference?' },
    { id: 'compliance', label: 'Compliance', description: 'Does the submission comply with all requirements?' },
    { id: 'clarity', label: 'Clarity', description: 'Is the submission clear and easy to understand?' },
  ];

  // Filter requests ready for submission approval
  const submissionReadyRequests = researchApprovedRequests.filter(req => 
    (req.internalStatus === 'Report Recommended' || 
     req.internalStatus === 'Submission In Progress' || 
     req.internalStatus === 'Pending Approval Review' || 
     req.internalStatus === 'Under Approval Review' || 
     req.internalStatus === 'Recommended for Approval' || 
     req.internalStatus === 'Under Final Approval') && 
    !req.publishingDoc
  );

  const viewRequest = (request: ResearchRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
    setActiveTab('request');
    setSubmissionFile(null);
    setSubmissionNotes('');
    setChecklistState({});
    setEvaluationComments('');
  };

  const getInternalStatusBadge = (status?: ResearchInternalStatus) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      'Report Recommended': { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Report Recommended' },
      'Submission In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Submission In Progress' },
      'Pending Approval Review': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Approval Review' },
      'Under Approval Review': { color: 'bg-orange-100 text-orange-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Approval Review' },
      'Recommended for Approval': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Recommended for Approval' },
      'Under Final Approval': { color: 'bg-orange-100 text-orange-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Final Approval' },
      'Approved': { color: 'bg-green-600 text-white', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Approved' },
    };
    const config = status ? statusConfig[status] : statusConfig['Report Recommended'];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (request: ResearchRequest) => {
    if (request.submissionDoc && request.internalStatus === 'Pending Approval Review') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending Approval Review
        </span>
      );
    }
    if (request.internalStatus === 'Submission In Progress') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="h-3 w-3 mr-1" />
          Submission In Progress
        </span>
      );
    }
    if (request.internalStatus === 'Under Approval Review') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3 mr-1" />
          Under Approval Review
        </span>
      );
    }
    if (request.internalStatus === 'Under Final Approval') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3 mr-1" />
          Under Final Approval
        </span>
      );
    }
    if (request.internalStatus === 'Recommended for Approval') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Recommended for Approval
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <Clock className="h-3 w-3 mr-1" />
        Report Recommended
      </span>
    );
  };

  const handleStartSubmission = () => {
    if (!selectedRequest) return;
    
    const updatedResearchApproved = researchApprovedRequests.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, internalStatus: 'Submission In Progress' as any }
        : req
    );
    setResearchApprovedRequests(updatedResearchApproved);
    setSelectedRequest({ ...selectedRequest, internalStatus: 'Submission In Progress' as any });
  };

  const handleSubmitSubmission = () => {
    if (!selectedRequest || !submissionFile) return;
    
    setIsSubmittingSubmission(true);
    
    const submissionDoc: ResearchSubmissionDocument = {
      id: `submission-${Date.now()}`,
      requestId: selectedRequest.id,
      documentUrl: URL.createObjectURL(submissionFile),
      documentName: submissionFile.name,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.name,
      submissionNotes: submissionNotes,
    };
    
    const updatedResearchApproved = researchApprovedRequests.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            submissionDoc,
            internalStatus: 'Pending Approval Review' as any
          }
        : req
    );
    setResearchApprovedRequests(updatedResearchApproved);
    
    setSelectedRequest({ 
      ...selectedRequest, 
      submissionDoc,
      internalStatus: 'Pending Approval Review' as any
    });
    
    setSubmissionFile(null);
    setSubmissionNotes('');
    setIsSubmittingSubmission(false);
    setIsViewModalOpen(false);
  };

  const handleStartDirectorReview = () => {
    if (!selectedRequest) return;
    
    const updatedResearchApproved = researchApprovedRequests.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, internalStatus: 'Under Approval Review' as any }
        : req
    );
    setResearchApprovedRequests(updatedResearchApproved);
    setSelectedRequest({ ...selectedRequest, internalStatus: 'Under Approval Review' as any });
  };

  const handleDirectorEvaluation = (recommendation: 'recommend' | 'not_recommend') => {
    if (!selectedRequest) return;
    
    const evaluation: ResearchEvaluation = {
      id: `eval-${Date.now()}`,
      requestId: selectedRequest.id,
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
    
    const existingEvaluations = selectedRequest.submissionEvaluations || [];
    
    const updatedResearchApproved = researchApprovedRequests.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            submissionEvaluations: [...existingEvaluations, evaluation],
            internalStatus: 'Recommended for Approval' as any
          }
        : req
    );
    setResearchApprovedRequests(updatedResearchApproved);
    
    setSelectedRequest({ 
      ...selectedRequest, 
      submissionEvaluations: [...existingEvaluations, evaluation],
      internalStatus: 'Recommended for Approval' as any
    });
    setChecklistState({});
    setEvaluationComments('');
    setIsViewModalOpen(false);
  };

  const handleStartCEOReview = () => {
    if (!selectedRequest) return;
    
    const updatedResearchApproved = researchApprovedRequests.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, internalStatus: 'Under Final Approval' as any }
        : req
    );
    setResearchApprovedRequests(updatedResearchApproved);
    setSelectedRequest({ ...selectedRequest, internalStatus: 'Under Final Approval' as any });
  };

  const handleCEOEvaluation = (decision: 'approve' | 'decline') => {
    if (!selectedRequest) return;
    
    const evaluation: ResearchEvaluation = {
      id: `eval-${Date.now()}`,
      requestId: selectedRequest.id,
      reviewerRole: currentUser.role,
      reviewerName: currentUser.name,
      checklist: evaluationChecklist.map(item => ({
        criteriaId: item.id,
        criteriaName: item.label,
        isMet: checklistState[item.id] || false,
        comments: evaluationComments,
      })),
      recommendation: decision === 'approve' ? 'approve' : 'decline',
      submittedAt: new Date().toISOString(),
    };
    
    const existingEvaluations = selectedRequest.finalEvaluations || [];
    
    const updatedResearchApproved = researchApprovedRequests.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            finalEvaluations: [...existingEvaluations, evaluation],
            internalStatus: decision === 'approve' ? 'Approved' as any : 'Recommended for Approval' as any
          }
        : req
    );
    setResearchApprovedRequests(updatedResearchApproved);
    
    setSelectedRequest({ 
      ...selectedRequest, 
      finalEvaluations: [...existingEvaluations, evaluation],
      internalStatus: decision === 'approve' ? 'Approved' as any : 'Recommended for Approval' as any
    });
    setChecklistState({});
    setEvaluationComments('');
    setIsViewModalOpen(false);
  };

  const canStartSubmission = () => {
    const request = selectedRequest;
    return currentUser.role === 'Research Deputy Director' && 
           request && 
           !request.submissionDoc &&
           request.internalStatus === 'Report Recommended';
  };

  const canSubmitSubmission = () => {
    const request = selectedRequest;
    return currentUser.role === 'Research Deputy Director' && 
           request && 
           request.internalStatus === 'Submission In Progress' &&
           !request.submissionDoc;
  };

  const canStartDirectorReview = () => {
    const request = selectedRequest;
    return currentUser.role === 'Research Director' && 
           request && 
           request.submissionDoc &&
           request.internalStatus === 'Pending Approval Review';
  };

  const canEvaluateDirector = () => {
    const request = selectedRequest;
    return currentUser.role === 'Research Director' && 
           request && 
           request.internalStatus === 'Under Approval Review' &&
           !request.submissionEvaluations?.some(e => e.reviewerRole === 'Research Director');
  };

  const canStartCEOReview = () => {
    const request = selectedRequest;
    return currentUser.role === 'Research Chief Executive Officer' && 
           request && 
           request.internalStatus === 'Recommended for Approval' &&
           !request.finalEvaluations?.some(e => e.reviewerRole === 'Research Chief Executive Officer');
  };

  const canEvaluateCEO = () => {
    const request = selectedRequest;
    return currentUser.role === 'Research Chief Executive Officer' && 
           request && 
           request.internalStatus === 'Under Final Approval' &&
           !request.finalEvaluations?.some(e => e.reviewerRole === 'Research Chief Executive Officer');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Submission & Approval</h3>
      <p className="text-gray-600">Submit and approve research reports</p>
      
      {submissionReadyRequests.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Ready for Submission</h4>
            <p className="text-sm text-gray-500">Compile submission and get approval</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissionReadyRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.requestId}</TableCell>
                  <TableCell>{request.title}</TableCell>
                  <TableCell>{getStatusBadge(request)}</TableCell>
                  <TableCell>{request.requesterDetails.name}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewRequest(request)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No submissions ready for approval. Recommended reports will appear here.
        </div>
      )}

      {/* Submission Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission & Approval</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
             <TabsList className="flex w-full flex-wrap gap-1 sticky top-0 bg-white z-10 pb-2 border-b mb-4">
            <TabsTrigger value="request" className="flex-shrink-0">Research Request</TabsTrigger>
            <TabsTrigger value="agenda" className="flex-shrink-0">Agenda & Submission</TabsTrigger>
            <TabsTrigger value="tor" className="flex-shrink-0">TOR Development</TabsTrigger>
            <TabsTrigger value="sla" className="flex-shrink-0">SLA Preparation</TabsTrigger>
            <TabsTrigger value="review" className="flex-shrink-0">Legal Review</TabsTrigger>
            <TabsTrigger value="research" className="flex-shrink-0">Research Report</TabsTrigger>
            <TabsTrigger value="submission" className="flex-shrink-0 bg-primary/10">Submission & Approval</TabsTrigger>
          </TabsList>
              
              {/* Tab 1: Research Request Details */}
              <TabsContent value="request" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">A. Basic Request Info</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Request ID</Label><p className="font-medium">{selectedRequest.requestId}</p></div>
                    <div><Label className="text-sm text-gray-500">Title</Label><p className="font-medium">{selectedRequest.title}</p></div>
                    <div><Label className="text-sm text-gray-500">Date Submitted</Label><p className="font-medium">{new Date(selectedRequest.dateSubmitted).toLocaleString()}</p></div>
                    <div><Label className="text-sm text-gray-500">Status</Label>{getInternalStatusBadge(selectedRequest.internalStatus)}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">B. Requester Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Name</Label><p className="font-medium">{selectedRequest.requesterDetails.name}</p></div>
                    <div><Label className="text-sm text-gray-500">Role</Label><p className="font-medium">{selectedRequest.requesterDetails.role}</p></div>
                    <div><Label className="text-sm text-gray-500">Business Unit</Label><p className="font-medium">{selectedRequest.requesterDetails.businessUnit}</p></div>
                    <div><Label className="text-sm text-gray-500">Email</Label><p className="font-medium">{selectedRequest.requesterDetails.email}</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">C. Research Purpose / Motivation</h3>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Problem Statement</Label><p className="mt-1">{selectedRequest.researchPurpose.problemStatement}</p></div>
                    <div><Label className="text-sm text-gray-500">Reason for Research</Label><p className="mt-1">{selectedRequest.researchPurpose.reasonForResearch}</p></div>
                    <div><Label className="text-sm text-gray-500">Trigger</Label><p className="mt-1">{selectedRequest.researchPurpose.trigger}</p></div>
                    <div><Label className="text-sm text-gray-500">Expected Impact</Label><p className="mt-1">{selectedRequest.researchPurpose.expectedImpact}</p></div>
                  </div>
                </div>

                {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">J. Attachments</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      {selectedRequest.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <a href={attachment.url} target="_blank" className="text-blue-600 hover:underline">{attachment.name}</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 2: Agenda & Submission */}
              <TabsContent value="agenda" className="space-y-6 py-4">
                {selectedRequest.agenda ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Research Agenda & Submission</h3>
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-gray-500">Agenda Document</Label>
                          {selectedRequest.agenda.agendaDocument ? (
                            <a href={selectedRequest.agenda.agendaDocument.url} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-1">
                              <FileText className="h-4 w-4" />
                              {selectedRequest.agenda.agendaDocument.name}
                            </a>
                          ) : <p className="text-gray-500 mt-1">No agenda document uploaded</p>}
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">Submission Document</Label>
                          {selectedRequest.agenda.submissionDocument ? (
                            <a href={selectedRequest.agenda.submissionDocument.url} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-1">
                              <FileText className="h-4 w-4" />
                              {selectedRequest.agenda.submissionDocument.name}
                            </a>
                          ) : <p className="text-gray-500 mt-1">No submission document uploaded</p>}
                        </div>
                      </div>
                      <div><Label className="text-sm text-gray-500">Submitted By</Label><p className="mt-1">{selectedRequest.agenda.submittedBy || 'Unknown'}</p></div>
                      <div><Label className="text-sm text-gray-500">Submitted At</Label><p className="mt-1">{selectedRequest.agenda.submittedAt ? new Date(selectedRequest.agenda.submittedAt).toLocaleString() : 'Not submitted'}</p></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No agenda has been created for this request.</div>
                )}

                {selectedRequest.evaluations && selectedRequest.evaluations.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900">Evaluations</h3>
                    {selectedRequest.evaluations.map((evalItem) => (
                      <div key={evalItem.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{evalItem.reviewerRole}</span>
                          <span className="text-sm text-gray-500">{new Date(evalItem.submittedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm mb-2">Recommendation: <span className="font-semibold">{evalItem.recommendation}</span></p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 3: TOR Development */}
              <TabsContent value="tor" className="space-y-6 py-4">
                {selectedRequest.torDocument ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">TOR Document</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <a href={selectedRequest.torDocument.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {selectedRequest.torDocument.documentName}
                      </a>
                      <p className="text-sm text-gray-600 mt-2">Uploaded by: {selectedRequest.torDocument.uploadedBy} on {new Date(selectedRequest.torDocument.uploadedAt).toLocaleDateString()}</p>
                      {selectedRequest.torDocument.workshopConducted && (
                        <>
                          <p className="text-sm text-gray-600 mt-2">Workshop conducted on: {new Date(selectedRequest.torDocument.workshopDate || '').toLocaleDateString()}</p>
                          {selectedRequest.torDocument.workshopNotes && <p className="text-sm text-gray-600 mt-1">Notes: {selectedRequest.torDocument.workshopNotes}</p>}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">TOR document not yet uploaded.</div>
                )}
              </TabsContent>
              
              {/* Tab 4: SLA Preparation */}
              <TabsContent value="sla" className="space-y-6 py-4">
                {selectedRequest.slaDocument ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">SLA Document</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <a href={selectedRequest.slaDocument.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {selectedRequest.slaDocument.documentName}
                      </a>
                      <p className="text-sm text-gray-600 mt-2">Signed by: {selectedRequest.slaDocument.signedBy} on {new Date(selectedRequest.slaDocument.signedAt || '').toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Uploaded by: {selectedRequest.slaDocument.uploadedBy} on {new Date(selectedRequest.slaDocument.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">SLA document not yet uploaded.</div>
                )}
              </TabsContent>

              {/* Tab 5: Legal Review & CEO Approval */}
              <TabsContent value="review" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Legal Review & CEO Approval</h3>
                  
                  {selectedRequest.legalDocument && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700">Legal Review Result</h4>
                      <div className={`p-4 rounded-lg ${selectedRequest.legalDocument.recommendation === 'recommend' ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`font-medium ${selectedRequest.legalDocument.recommendation === 'recommend' ? 'text-green-800' : 'text-red-800'}`}>
                          {selectedRequest.legalDocument.recommendation === 'recommend' ? '✓ Recommended by Legal' : '✗ Not Recommended'}
                        </p>
                        <a href={selectedRequest.legalDocument.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                          <FileText className="h-4 w-4" />
                          {selectedRequest.legalDocument.documentName}
                        </a>
                        {selectedRequest.legalDocument.comments && (
                          <p className="text-sm text-gray-600 mt-2">Comments: {selectedRequest.legalDocument.comments}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {selectedRequest.ceoDocument && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700">CEO Approval Result</h4>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-green-800 font-medium mb-2">✓ Approved by CEO</p>
                        <a href={selectedRequest.ceoDocument.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {selectedRequest.ceoDocument.documentName}
                        </a>
                        {selectedRequest.ceoDocument.comments && (
                          <p className="text-sm text-gray-600 mt-2">Comments: {selectedRequest.ceoDocument.comments}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Tab 6: Research Report */}
              <TabsContent value="research" className="space-y-6 py-4">
                {selectedRequest.researchReport && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Research Report</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <a href={selectedRequest.researchReport.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {selectedRequest.researchReport.documentName}
                      </a>
                      <p className="text-sm text-gray-600 mt-2">Uploaded by: {selectedRequest.researchReport.uploadedBy} on {new Date(selectedRequest.researchReport.uploadedAt).toLocaleDateString()}</p>
                      {selectedRequest.researchReport.reportNotes && (
                        <p className="text-sm text-gray-600 mt-2">Notes: {selectedRequest.researchReport.reportNotes}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedRequest.researchEvaluations && selectedRequest.researchEvaluations.length > 0 && (
                  <div className="space-y-4 mt-4">
                    <h3 className="text-lg font-semibold text-gray-900">Research Evaluations</h3>
                    {selectedRequest.researchEvaluations.map((evalItem) => (
                      <div key={evalItem.id} className="bg-green-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{evalItem.reviewerRole}</span>
                          <span className="text-sm text-gray-500">{new Date(evalItem.submittedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm mb-2">Recommendation: <span className="font-semibold">{evalItem.recommendation}</span></p>
                        {evalItem.comments && (
                          <p className="text-sm text-gray-600 mt-2">Comments: {evalItem.comments}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 7: Submission & Approval */}
            {/* Tab 7: Submission & Approval */}
{/* Tab 7: Submission & Approval */}
<TabsContent value="submission" className="space-y-6 py-4">
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900">Submission & Approval</h3>
    
    {/* Always show the submission document if it exists */}
    {selectedRequest.submissionDoc && (
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Submitted Document</h4>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <a href={selectedRequest.submissionDoc.documentUrl} target="_blank" className="text-blue-600 hover:underline">
            {selectedRequest.submissionDoc.documentName}
          </a>
        </div>
        {selectedRequest.submissionDoc.submissionNotes && (
          <p className="text-sm text-gray-600 mt-2">Notes: {selectedRequest.submissionDoc.submissionNotes}</p>
        )}
        <p className="text-xs text-gray-500 mt-2">
          Uploaded by: {selectedRequest.submissionDoc.uploadedBy} on {new Date(selectedRequest.submissionDoc.uploadedAt).toLocaleDateString()}
        </p>
      </div>
    )}
    
    {/* Display Director's Evaluation if exists */}
    {selectedRequest.submissionEvaluations && selectedRequest.submissionEvaluations.length > 0 && (
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <h4 className="font-medium text-blue-800 mb-2">Director's Evaluation</h4>
        {selectedRequest.submissionEvaluations.map((evalItem) => (
          <div key={evalItem.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Recommendation: 
                <span className={evalItem.recommendation === 'recommend' ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                  {evalItem.recommendation === 'recommend' ? '✓ Recommend' : '✗ Not Recommend'}
                </span>
              </span>
              <span className="text-xs text-gray-500">{new Date(evalItem.submittedAt).toLocaleString()}</span>
            </div>
            {evalItem.comments && (
              <p className="text-sm text-gray-600 mt-1">Comments: {evalItem.comments}</p>
            )}
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700">Checklist Results:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                {evalItem.checklist.map((item) => (
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
            </div>
          </div>
        ))}
      </div>
    )}
    
    {/* Display CEO's Evaluation if exists */}
    {selectedRequest.finalEvaluations && selectedRequest.finalEvaluations.length > 0 && (
      <div className="bg-purple-50 p-4 rounded-lg mb-4">
        <h4 className="font-medium text-purple-800 mb-2">CEO's Final Evaluation</h4>
        {selectedRequest.finalEvaluations.map((evalItem) => (
          <div key={evalItem.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Decision: 
                <span className={evalItem.recommendation === 'approve' ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                  {evalItem.recommendation === 'approve' ? '✓ Approved' : '✗ Declined'}
                </span>
              </span>
              <span className="text-xs text-gray-500">{new Date(evalItem.submittedAt).toLocaleString()}</span>
            </div>
            {evalItem.comments && (
              <p className="text-sm text-gray-600 mt-1">Comments: {evalItem.comments}</p>
            )}
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700">Checklist Results:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                {evalItem.checklist.map((item) => (
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
            </div>
          </div>
        ))}
      </div>
    )}
    
    {/* Start Submission Button - for Deputy Director */}
    {!selectedRequest.submissionDoc && selectedRequest.internalStatus === 'Report Recommended' && (
      <div className="space-y-4">
        <Button onClick={handleStartSubmission} className="bg-blue-600 hover:bg-blue-700">
          <Play className="h-4 w-4 mr-2" />
          Start Submission
        </Button>
      </div>
    )}
    
    {/* Upload Submission Form - after clicking Start */}
    {canSubmitSubmission() && (
      <div className="space-y-4">
        <div>
          <Label>Upload Submission Document</Label>
          <Input
            type="file"
            onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
            className="mt-1"
            accept=".pdf,.doc,.docx"
          />
        </div>
        <div>
          <Label>Submission Notes</Label>
          <Textarea
            value={submissionNotes}
            onChange={(e) => setSubmissionNotes(e.target.value)}
            placeholder="Add any notes about the submission..."
            rows={3}
            className="mt-1"
          />
        </div>
        <Button onClick={handleSubmitSubmission} disabled={!submissionFile} className="bg-green-600 hover:bg-green-700">
          <Upload className="h-4 w-4 mr-2" />
          Submit for Director Review
        </Button>
      </div>
    )}
    
    {/* Display status for Director Review */}
    {selectedRequest.submissionDoc && selectedRequest.internalStatus === 'Pending Approval Review' && !selectedRequest.submissionEvaluations?.length && (
      <div className="bg-yellow-50 p-4 rounded-lg">
        <p className="text-yellow-800 font-medium">Submission Ready for Director Review</p>
        <p className="text-sm text-gray-600 mt-1">Please review the submission document above and complete the evaluation checklist.</p>
      </div>
    )}
    
    {/* Start Director Review Button */}
    {canStartDirectorReview() && (
      <div className="space-y-4">
        <Button onClick={handleStartDirectorReview} className="bg-blue-600 hover:bg-blue-700">
          <Play className="h-4 w-4 mr-2" />
          Start Director Review
        </Button>
      </div>
    )}
    
    {/* Director Evaluation Form */}
    {canEvaluateDirector() && (
      <div className="space-y-4">
        <h4 className="font-medium">Director Evaluation Checklist</h4>
        <div className="space-y-3">
          {evaluationChecklist.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
              <Checkbox
                id={item.id}
                checked={checklistState[item.id] || false}
                onCheckedChange={(checked) => setChecklistState(prev => ({ ...prev, [item.id]: checked === true }))}
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
            value={evaluationComments}
            onChange={(e) => setEvaluationComments(e.target.value)}
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
    
    {/* Display status after Director Recommendation */}
    {selectedRequest.internalStatus === 'Recommended for Approval' && !selectedRequest.finalEvaluations?.length && (
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-green-800 font-medium">✓ Recommended for Approval - Ready for CEO</p>
        {selectedRequest.submissionEvaluations?.map((evalItem) => (
          <div key={evalItem.id} className="mt-2 text-sm">
            <p>Director's Recommendation: {evalItem.recommendation === 'recommend' ? 'Recommend' : 'Not Recommend'}</p>
            {evalItem.comments && <p>Comments: {evalItem.comments}</p>}
          </div>
        ))}
      </div>
    )}
    
    {/* Start CEO Review Button */}
    {canStartCEOReview() && (
      <div className="space-y-4">
        <Button onClick={handleStartCEOReview} className="bg-blue-600 hover:bg-blue-700">
          <Play className="h-4 w-4 mr-2" />
          Start CEO Approval
        </Button>
      </div>
    )}
    
    {/* CEO Evaluation Form */}
    {canEvaluateCEO() && (
      <div className="space-y-4">
        <h4 className="font-medium">CEO Evaluation Checklist</h4>
        <div className="space-y-3">
          {evaluationChecklist.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
              <Checkbox
                id={item.id}
                checked={checklistState[item.id] || false}
                onCheckedChange={(checked) => setChecklistState(prev => ({ ...prev, [item.id]: checked === true }))}
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
            value={evaluationComments}
            onChange={(e) => setEvaluationComments(e.target.value)}
            placeholder="Add your final approval comments..."
            rows={3}
            className="mt-1"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleCEOEvaluation('decline')} className="border-red-300 text-red-600 hover:bg-red-50">
            <XCircle className="h-4 w-4 mr-2" />
            Decline
          </Button>
          <Button onClick={() => handleCEOEvaluation('approve')} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </div>
      </div>
    )}
  </div>
</TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmissionApproval;