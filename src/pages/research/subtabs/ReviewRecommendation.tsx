// screens/subtabs/ReviewRecommendation.tsx
import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import type { ResearchRequest, LegalDocument, CEODocument } from '@/types';

const ReviewRecommendation = () => {
  const { approvedRequests, setApprovedRequests, currentUser,setResearchApprovedRequests } = useApp();
  const [selectedRequest, setSelectedRequest] = useState<ResearchRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('request');
  
  // Legal review state
  const [legalFile, setLegalFile] = useState<File | null>(null);
  const [legalComments, setLegalComments] = useState('');
  const [isSubmittingLegal, setIsSubmittingLegal] = useState(false);
  
  // CEO review state
  const [ceoFile, setCeoFile] = useState<File | null>(null);
  const [ceoComments, setCeoComments] = useState('');
  const [isSubmittingCEO, setIsSubmittingCEO] = useState(false);
 
 

  const viewRequest = (request: ResearchRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
    setActiveTab('request');
    setLegalFile(null);
    setLegalComments('');
    setCeoFile(null);
    setCeoComments('');
  };
  const reviewReadyRequests = approvedRequests.filter(req => 
  req.slaDocument && 
  !req.ceoDocument && 
  req.appointmentStatus !== 'Approved – SLA Signed' &&
  req.internalStatus !== 'Approved' &&
  (req.internalStatus === 'Pending Legal Review' || 
   req.internalStatus === 'Under Legal Review' || 
   req.internalStatus === 'Pending CEO Approval (SLA)' || 
   req.internalStatus === 'Under CEO Approval (SLA)')
);

  // Appointment Status Badge
  const getAppointmentStatusBadge = (status?: string) => {
    if (!status) return <span className="text-gray-400 text-xs">-</span>;
    
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      'Recommended by Legal': { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      'Approved – SLA Signed': { color: 'bg-green-600 text-white', icon: <CheckCircle className="h-3 w-3 mr-1" /> },
    };
    
    const config = statusConfig[status];
    if (!config) return <span className="text-gray-400 text-xs">-</span>;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {status === 'Approved – SLA Signed' ? 'Approved' : status}
      </span>
    );
  };

  // Internal Status Badge for the table
  const getReviewStatusBadge = (request: ResearchRequest) => {
    if (request.internalStatus === 'Approved') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </span>
      );
    }
    if (request.internalStatus === 'Under Legal Review') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="h-3 w-3 mr-1" />
          Under Legal Review
        </span>
      );
    }
    if (request.internalStatus === 'Under CEO Approval (SLA)') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3 mr-1" />
          Under CEO Approval
        </span>
      );
    }
    if (request.internalStatus === 'Pending CEO Approval (SLA)') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending CEO Approval
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="h-3 w-3 mr-1" />
        Pending Legal Review
      </span>
    );
  };

  const handleStartLegalReview = () => {
    if (!selectedRequest) return;
    
    const updatedApproved = approvedRequests.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, internalStatus: 'Under Legal Review' as any }
        : req
    );
    setApprovedRequests(updatedApproved);
    setSelectedRequest({ ...selectedRequest, internalStatus: 'Under Legal Review' as any });
  };

 const handleLegalRecommend = (recommendation: 'recommend' | 'not_recommend') => {
  if (!selectedRequest || !legalFile) return;
  
  setIsSubmittingLegal(true);
  
  const legalDocument: LegalDocument = {
    id: `legal-${Date.now()}`,
    requestId: selectedRequest.id,
    documentUrl: URL.createObjectURL(legalFile),
    documentName: legalFile.name,
    uploadedAt: new Date().toISOString(),
    uploadedBy: currentUser.name,
    reviewedBy: currentUser.name,
    reviewedAt: new Date().toISOString(),
    recommendation: recommendation,
    comments: legalComments,
  };
  
  const updatedApproved = approvedRequests.map(req => 
    req.id === selectedRequest.id 
      ? { 
          ...req, 
          legalDocument,
          internalStatus: recommendation === 'recommend' ? 'Pending CEO Approval (SLA)' as any : 'Pending Legal Review' as any,
          appointmentStatus: recommendation === 'recommend' ? 'Recommended by Legal' as any : req.appointmentStatus
        }
      : req
  );
  setApprovedRequests(updatedApproved);
  
  setSelectedRequest({ 
    ...selectedRequest, 
    legalDocument,
    internalStatus: recommendation === 'recommend' ? 'Pending CEO Approval (SLA)' as any : 'Pending Legal Review' as any,
    appointmentStatus: recommendation === 'recommend' ? 'Recommended by Legal' as any : selectedRequest.appointmentStatus
  });
  
  setLegalFile(null);
  setLegalComments('');
  setIsSubmittingLegal(false);
  setIsViewModalOpen(false);
};

  const handleStartCEOApproval = () => {
    if (!selectedRequest) return;
    
    const updatedApproved = approvedRequests.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, internalStatus: 'Under CEO Approval (SLA)' as any }
        : req
    );
    setApprovedRequests(updatedApproved);
    setSelectedRequest({ ...selectedRequest, internalStatus: 'Under CEO Approval (SLA)' as any });
  };

 
 

// Check if Legal Director can start review
const canStartLegalReview = () => {
  const request = selectedRequest;
  return currentUser.role === 'Research Legal Director' && 
         request && 
         !request.legalDocument && 
         !request.ceoDocument &&
         request.internalStatus === 'Pending Legal Review' &&  // ← Add this condition
         request.slaDocument;
};

// Check if Legal Director can submit review (after clicking Start)
const canSubmitLegalReview = () => {
  const request = selectedRequest;
  return currentUser.role === 'Research Legal Director' && 
         request && 
         request.internalStatus === 'Under Legal Review' &&  // ← After Start button clicked
         !request.legalDocument;
};

 const canStartCEOApproval = () => {
  const request = selectedRequest;
  return currentUser.role === 'Research Chief Executive Officer' && 
         request && 
         request.legalDocument?.recommendation === 'recommend' &&
         !request.ceoDocument &&
         request.internalStatus === 'Pending CEO Approval (SLA)';  // ← This should match
};

const canSubmitCEOApproval = () => {
  const request = selectedRequest;
  return currentUser.role === 'Research Chief Executive Officer' && 
         request && 
         request.internalStatus === 'Under CEO Approval (SLA)' &&
         !request.ceoDocument;
};
const handleCEOApproval = (decision: 'approve' | 'decline') => {
  if (!selectedRequest || !ceoFile) return;
  
  setIsSubmittingCEO(true);
  
  const ceoDocument: CEODocument = {
    id: `ceo-${Date.now()}`,
    requestId: selectedRequest.id,
    documentUrl: URL.createObjectURL(ceoFile),
    documentName: ceoFile.name,
    uploadedAt: new Date().toISOString(),
    uploadedBy: currentUser.name,
    approvedBy: currentUser.name,
    approvedAt: new Date().toISOString(),
    decision: decision,
    comments: ceoComments,
  };
  
  // Remove from approvedRequests
  const updatedApproved = approvedRequests.filter(req => req.id !== selectedRequest.id);
  setApprovedRequests(updatedApproved);
  
  // If approved, add to researchApprovedRequests with status 'Pending Research'
  if (decision === 'approve') {
    const researchReadyRequest: ResearchRequest = { 
      ...selectedRequest, 
      ceoDocument,
      internalStatus: 'Pending Research' as any,
      appointmentStatus: 'Approved – SLA Signed' as any
    };
    setResearchApprovedRequests((prev: ResearchRequest[]) => [...prev, researchReadyRequest]);
  }
  
  setSelectedRequest({ 
    ...selectedRequest, 
    ceoDocument,
    internalStatus: decision === 'approve' ? 'Pending Research' as any : 'Pending CEO Approval (SLA)' as any,
    appointmentStatus: decision === 'approve' ? 'Approved – SLA Signed' as any : selectedRequest.appointmentStatus
  });
  
  setCeoFile(null);
  setCeoComments('');
  setIsSubmittingCEO(false);
  setIsViewModalOpen(false);
};
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Review & Recommendation</h3>
      <p className="text-gray-600">Legal review and CEO approval for signed SLA documents</p>
      
      {/* Review Requests Table */}
      {reviewReadyRequests.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Requests Ready for Review</h4>
            <p className="text-sm text-gray-500">Legal review and CEO approval of signed SLA</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Internal Status</TableHead>
                <TableHead>Appointment Status</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Business Unit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewReadyRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.requestId}</TableCell>
                  <TableCell>{request.title}</TableCell>
                  <TableCell>{new Date(request.dateSubmitted).toLocaleDateString()}</TableCell>
                  <TableCell>{getReviewStatusBadge(request)}</TableCell>
                  <TableCell>{getAppointmentStatusBadge(request.appointmentStatus)}</TableCell>
                  <TableCell>{request.requesterDetails.name}</TableCell>
                  <TableCell>{request.requesterDetails.businessUnit}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewRequest(request)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No requests ready for review. Complete SLA preparation first.
        </div>
      )}

      {/* Review Modal with 5 Tabs */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Research Request Details - Review & Recommendation</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="request">Research Request</TabsTrigger>
                <TabsTrigger value="agenda">Agenda & Submission</TabsTrigger>
                <TabsTrigger value="tor">TOR Development</TabsTrigger>
                <TabsTrigger value="sla">SLA Preparation</TabsTrigger>
                <TabsTrigger value="review">Review & Approval</TabsTrigger>
              </TabsList>
              
              {/* Tab 1: Research Request Details */}
              <TabsContent value="request" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">A. Basic Request Info</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Request ID</Label><p className="font-medium">{selectedRequest.requestId}</p></div>
                    <div><Label className="text-sm text-gray-500">Title</Label><p className="font-medium">{selectedRequest.title}</p></div>
                    <div><Label className="text-sm text-gray-500">Date Submitted</Label><p className="font-medium">{new Date(selectedRequest.dateSubmitted).toLocaleString()}</p></div>
                    <div><Label className="text-sm text-gray-500">Status</Label><p className="font-medium text-green-600">{selectedRequest.internalStatus === 'Approved' ? 'Approved' : 'In Progress'}</p></div>
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

                {selectedRequest.attachments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">J. Attachments</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      {selectedRequest.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{attachment.name}</a>
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
                            <a href={selectedRequest.agenda.agendaDocument.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2 mt-1">
                              <FileText className="h-4 w-4" />
                              {selectedRequest.agenda.agendaDocument.name}
                            </a>
                          ) : <p className="text-gray-500 mt-1">No agenda document uploaded</p>}
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">Submission Document</Label>
                          {selectedRequest.agenda.submissionDocument ? (
                            <a href={selectedRequest.agenda.submissionDocument.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2 mt-1">
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
              </TabsContent>
              
              {/* Tab 3: TOR Development */}
              <TabsContent value="tor" className="space-y-6 py-4">
                {selectedRequest.torDocument ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">TOR Document</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <a href={selectedRequest.torDocument.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {selectedRequest.torDocument.documentName}
                      </a>
                      <p className="text-sm text-gray-600 mt-2">Uploaded by: {selectedRequest.torDocument.uploadedBy} on {new Date(selectedRequest.torDocument.uploadedAt).toLocaleDateString()}</p>
                      {selectedRequest.torDocument.workshopConducted && (
                        <>
                          <p className="text-sm text-gray-600 mt-2">Workshop conducted on: {new Date(selectedRequest.torDocument.workshopDate || '').toLocaleDateString()}</p>
                          {selectedRequest.torDocument.workshopNotes && <p className="text-sm text-gray-600 mt-1">Workshop Notes: {selectedRequest.torDocument.workshopNotes}</p>}
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
                      <a href={selectedRequest.slaDocument.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
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
              
              {/* Tab 5: Review & Approval */}
              <TabsContent value="review" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Legal Review & CEO Approval</h3>
                  
                  {/* Legal Review Section */}
                  {!selectedRequest.legalDocument && !selectedRequest.ceoDocument && selectedRequest.internalStatus !== 'Approved' && (
                    <div className="space-y-4 border-b pb-6">
                      <h4 className="font-medium text-gray-700">Legal Review</h4>
                      
                      {canStartLegalReview() && (
                        <Button onClick={handleStartLegalReview} className="bg-blue-600 hover:bg-blue-700">
                          <Play className="h-4 w-4 mr-2" />
                          Start Legal Review
                        </Button>
                      )}
                      
                      {canSubmitLegalReview() && (
                        <div className="space-y-4">
                          <div>
                            <Label>Upload Reviewed SLA Document</Label>
                            <Input
                              type="file"
                              onChange={(e) => setLegalFile(e.target.files?.[0] || null)}
                              className="mt-1"
                              accept=".pdf,.doc,.docx"
                            />
                          </div>
                          <div>
                            <Label>Comments</Label>
                            <Textarea
                              value={legalComments}
                              onChange={(e) => setLegalComments(e.target.value)}
                              placeholder="Add any comments or notes about the review..."
                              rows={3}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button variant="outline" onClick={() => handleLegalRecommend('not_recommend')} className="border-red-300 text-red-600 hover:bg-red-50">
                              <XCircle className="h-4 w-4 mr-2" />
                              Not Recommend
                            </Button>
                            <Button onClick={() => handleLegalRecommend('recommend')} className="bg-green-600 hover:bg-green-700" disabled={!legalFile}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Recommend
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Display Legal Review Result */}
                  {selectedRequest.legalDocument && !selectedRequest.ceoDocument && selectedRequest.internalStatus !== 'Approved' && (
                    <div className="space-y-4 border-b pb-6">
                      <h4 className="font-medium text-gray-700">Legal Review Result</h4>
                      <div className={`p-4 rounded-lg ${selectedRequest.legalDocument.recommendation === 'recommend' ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`font-medium ${selectedRequest.legalDocument.recommendation === 'recommend' ? 'text-green-800' : 'text-red-800'}`}>
                          {selectedRequest.legalDocument.recommendation === 'recommend' ? '✓ Recommended by Legal' : '✗ Not Recommended'}
                        </p>
                        <a href={selectedRequest.legalDocument.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                          <FileText className="h-4 w-4" />
                          {selectedRequest.legalDocument.documentName}
                        </a>
                        {selectedRequest.legalDocument.comments && (
                          <p className="text-sm text-gray-600 mt-2">Comments: {selectedRequest.legalDocument.comments}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Reviewed by: {selectedRequest.legalDocument.reviewedBy} on {new Date(selectedRequest.legalDocument.reviewedAt || '').toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* CEO Approval Section */}
                  {selectedRequest.legalDocument?.recommendation === 'recommend' && !selectedRequest.ceoDocument && selectedRequest.internalStatus !== 'Approved' && (
                    <div className="space-y-4 border-b pb-6">
                      <h4 className="font-medium text-gray-700">CEO Approval</h4>
                      
                      {canStartCEOApproval() && (
                        <Button onClick={handleStartCEOApproval} className="bg-blue-600 hover:bg-blue-700">
                          <Play className="h-4 w-4 mr-2" />
                          Start CEO Approval
                        </Button>
                      )}
                      
                      {canSubmitCEOApproval() && (
                        <div className="space-y-4">
                          <div>
                            <Label>Upload Final Signed Document</Label>
                            <Input
                              type="file"
                              onChange={(e) => setCeoFile(e.target.files?.[0] || null)}
                              className="mt-1"
                              accept=".pdf,.doc,.docx"
                            />
                          </div>
                          <div>
                            <Label>Comments</Label>
                            <Textarea
                              value={ceoComments}
                              onChange={(e) => setCeoComments(e.target.value)}
                              placeholder="Add any final comments..."
                              rows={3}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-3">
                            <Button variant="outline" onClick={() => handleCEOApproval('decline')} className="border-red-300 text-red-600 hover:bg-red-50">
                              <XCircle className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                            <Button onClick={() => handleCEOApproval('approve')} className="bg-green-600 hover:bg-green-700" disabled={!ceoFile}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Display CEO Approval Result */}
                  {selectedRequest.ceoDocument && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700">CEO Approval Result</h4>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-green-800 font-medium mb-2">✓ Approved by CEO</p>
                        <a href={selectedRequest.ceoDocument.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {selectedRequest.ceoDocument.documentName}
                        </a>
                        {selectedRequest.ceoDocument.comments && (
                          <p className="text-sm text-gray-600 mt-2">Comments: {selectedRequest.ceoDocument.comments}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Approved by: {selectedRequest.ceoDocument.approvedBy} on {new Date(selectedRequest.ceoDocument.approvedAt || '').toLocaleDateString()}</p>
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

export default ReviewRecommendation;