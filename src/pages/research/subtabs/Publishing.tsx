// screens/subtabs/Publishing.tsx
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
import type { ResearchRequest, PublishingDocument } from '@/types';

const Publishing = () => {
  const { researchApprovedRequests, setResearchApprovedRequests, currentUser, approvedRequests, setApprovedRequests } = useApp();
  const [selectedRequest, setSelectedRequest] = useState<ResearchRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('request');
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [externalFile, setExternalFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Filter requests ready for publishing
  const publishingReadyRequests = researchApprovedRequests.filter(req => 
    (req.internalStatus === 'Approved' || req.internalStatus === 'Ready for Publishing') && 
    !req.publishingDoc
  );

  const viewRequest = (request: ResearchRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
    setActiveTab('request');
    setInternalFile(null);
    setExternalFile(null);
  };

  const getInternalStatusBadge = (status?: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      'Approved': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Approved' },
      'Ready for Publishing': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Ready for Publishing' },
      'Published': { color: 'bg-green-600 text-white', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Published' },
    };
    const config = status ? statusConfig[status] : statusConfig['Approved'];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (request: ResearchRequest) => {
    if (request.publishingDoc) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Published
        </span>
      );
    }
    if (request.internalStatus === 'Ready for Publishing') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="h-3 w-3 mr-1" />
          Ready for Publishing
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved
      </span>
    );
  };

  const handleStartPublishing = () => {
    if (!selectedRequest) return;
    
    const updatedResearchApproved = researchApprovedRequests.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, internalStatus: 'Ready for Publishing' as any }
        : req
    );
    setResearchApprovedRequests(updatedResearchApproved);
    setSelectedRequest({ ...selectedRequest, internalStatus: 'Ready for Publishing' as any });
  };

  const handlePublish = () => {
    if (!selectedRequest) return;
    
    setIsPublishing(true);
    
    const publishingDoc: PublishingDocument = {
      id: `publish-${Date.now()}`,
      requestId: selectedRequest.id,
      internalUrl: internalFile ? URL.createObjectURL(internalFile) : '',
      externalUrl: externalFile ? URL.createObjectURL(externalFile) : '',
      documentName: selectedRequest.title,
      publishedAt: new Date().toISOString(),
      publishedBy: currentUser.name,
    };
    
    const updatedResearchApproved = researchApprovedRequests.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            publishingDoc,
            internalStatus: 'Published' as any
          }
        : req
    );
    setResearchApprovedRequests(updatedResearchApproved);
    
    // Also update approved requests
    const updatedApproved = approvedRequests.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            publishingDoc,
            internalStatus: 'Published' as any
          }
        : req
    );
    setApprovedRequests(updatedApproved);
    
    setSelectedRequest({ 
      ...selectedRequest, 
      publishingDoc,
      internalStatus: 'Published' as any
    });
    
    setInternalFile(null);
    setExternalFile(null);
    setIsPublishing(false);
    setIsViewModalOpen(false);
  };

  const canStartPublishing = () => {
    const request = selectedRequest;
    return currentUser.role === 'Research Deputy Director' && 
           request && 
           request.internalStatus === 'Approved' &&
           !request.publishingDoc;
  };

  const canPublish = () => {
    const request = selectedRequest;
    return currentUser.role === 'Research Deputy Director' && 
           request && 
           request.internalStatus === 'Ready for Publishing' &&
           !request.publishingDoc;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Publishing</h3>
      <p className="text-gray-600">Publish research internally and externally</p>
      
      {publishingReadyRequests.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Ready for Publishing</h4>
            <p className="text-sm text-gray-500">Publish approved research</p>
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
              {publishingReadyRequests.map((request) => (
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
          No research ready for publishing. Approved submissions will appear here.
        </div>
      )}

      {/* Publishing Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Publishing</DialogTitle>
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
                <TabsTrigger value="submission" className="flex-shrink-0">Submission & Approval</TabsTrigger>
                <TabsTrigger value="publishing" className="flex-shrink-0 bg-primary/10">Publishing</TabsTrigger>
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
              <TabsContent value="submission" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Submission & Approval</h3>
                  
                  {/* Display Submission Document */}
                  {selectedRequest.submissionDoc && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Submission Document</h4>
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
                  
                  {/* Display Director's Evaluation */}
                  {selectedRequest.submissionEvaluations && selectedRequest.submissionEvaluations.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg">
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
                  
                  {/* Display CEO's Evaluation */}
                  {selectedRequest.finalEvaluations && selectedRequest.finalEvaluations.length > 0 && (
                    <div className="bg-purple-50 p-4 rounded-lg">
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
                </div>
              </TabsContent>
              
              {/* Tab 8: Publishing */}
              <TabsContent value="publishing" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Publishing</h3>
                  
                  {!selectedRequest.publishingDoc && selectedRequest.internalStatus === 'Approved' && (
                    <div className="space-y-4">
                      <Button onClick={handleStartPublishing} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Publishing
                      </Button>
                    </div>
                  )}
                  
                  {canPublish() && (
                    <div className="space-y-4">
                      <div>
                        <Label>Upload Internal Publishing Document</Label>
                        <Input
                          type="file"
                          onChange={(e) => setInternalFile(e.target.files?.[0] || null)}
                          className="mt-1"
                          accept=".pdf,.doc,.docx"
                        />
                      </div>
                      <div>
                        <Label>Upload External Publishing Document</Label>
                        <Input
                          type="file"
                          onChange={(e) => setExternalFile(e.target.files?.[0] || null)}
                          className="mt-1"
                          accept=".pdf,.doc,.docx"
                        />
                      </div>
                      <Button onClick={handlePublish} disabled={!internalFile || !externalFile} className="bg-green-600 hover:bg-green-700">
                        <Upload className="h-4 w-4 mr-2" />
                        Publish Research
                      </Button>
                    </div>
                  )}
                  
                  {selectedRequest.publishingDoc && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium mb-2">✓ Research Published</p>
                      <p className="text-sm text-gray-600">Published by: {selectedRequest.publishingDoc.publishedBy}</p>
                      <p className="text-sm text-gray-600">Published on: {new Date(selectedRequest.publishingDoc.publishedAt).toLocaleString()}</p>
                      <div className="mt-2 space-y-1">
                        {selectedRequest.publishingDoc.internalUrl && (
                          <a href={selectedRequest.publishingDoc.internalUrl} target="_blank" className="text-blue-600 hover:underline block">View Internal Publication</a>
                        )}
                        {selectedRequest.publishingDoc.externalUrl && (
                          <a href={selectedRequest.publishingDoc.externalUrl} target="_blank" className="text-blue-600 hover:underline block">View External Publication</a>
                        )}
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

export default Publishing;