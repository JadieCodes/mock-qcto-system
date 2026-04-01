// screens/subtabs/ResearchWorkspace.tsx
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
import type { ResearchRequest, ResearchReport, ResearchEvaluation, ResearchReviewOutcome, ResearchInternalStatus } from '@/types';

const ResearchWorkspace = () => {
  const { researchApprovedRequests, setResearchApprovedRequests, currentUser, approvedRequests, setApprovedRequests } = useApp();
  const [selectedRequest, setSelectedRequest] = useState<ResearchRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('request');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportNotes, setReportNotes] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  
  // Evaluation state
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [evaluationComments, setEvaluationComments] = useState('');

  const evaluationChecklist = [
    { id: 'methodology', label: 'Research Methodology', description: 'Is the research methodology appropriate and well-documented?' },
    { id: 'findings', label: 'Research Findings', description: 'Are the findings clearly presented and supported by data?' },
    { id: 'analysis', label: 'Data Analysis', description: 'Is the data analysis thorough and accurate?' },
    { id: 'conclusions', label: 'Conclusions', description: 'Are the conclusions logical and supported by findings?' },
    { id: 'recommendations', label: 'Recommendations', description: 'Are the recommendations practical and actionable?' },
    { id: 'quality', label: 'Overall Quality', description: 'Is the overall quality of the research report satisfactory?' },
  ];

  // Filter requests ready for research
  const researchRequests = researchApprovedRequests.filter(req => 
    req.appointmentStatus === 'Approved – SLA Signed' && 
    (req.internalStatus === 'Pending Research' || 
     req.internalStatus === 'Research In Progress' || 
     req.internalStatus === 'Pending Review' || 
     req.internalStatus === 'Under Review')
  );

  const viewRequest = (request: ResearchRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
    setActiveTab('request');
    setReportFile(null);
    setReportNotes('');
    setChecklistState({});
    setEvaluationComments('');
  };

  const getInternalStatusBadge = (status?: ResearchInternalStatus) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      'Pending Research': { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Research' },
      'Research In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Research In Progress' },
      'Pending Review': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Review' },
      'Under Review': { color: 'bg-orange-100 text-orange-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Review' },
      'Report Recommended': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Report Recommended' },
    };
    const config = status ? statusConfig[status] : statusConfig['Pending Research'];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (request: ResearchRequest) => {
    if (request.researchReport && request.internalStatus === 'Pending Review') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending Review
        </span>
      );
    }
    if (request.internalStatus === 'Research In Progress') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="h-3 w-3 mr-1" />
          Research In Progress
        </span>
      );
    }
    if (request.internalStatus === 'Under Review') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3 mr-1" />
          Under Review
        </span>
      );
    }
    if (request.internalStatus === 'Report Recommended') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Report Recommended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <Clock className="h-3 w-3 mr-1" />
        Pending Research
      </span>
    );
  };

  const handleStartResearch = () => {
    if (!selectedRequest) return;
    
    const updatedResearchApproved = researchApprovedRequests.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, internalStatus: 'Research In Progress' as any }
        : req
    );
    setResearchApprovedRequests(updatedResearchApproved);
    setSelectedRequest({ ...selectedRequest, internalStatus: 'Research In Progress' as any });
  };

  const handleSubmitReport = () => {
    if (!selectedRequest || !reportFile) return;
    
    setIsSubmittingReport(true);
    
    const researchReport: ResearchReport = {
      id: `report-${Date.now()}`,
      requestId: selectedRequest.id,
      documentUrl: URL.createObjectURL(reportFile),
      documentName: reportFile.name,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.name,
      reportNotes: reportNotes,
    };
    
    const updatedResearchApproved = researchApprovedRequests.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            researchReport,
            internalStatus: 'Pending Review' as any
          }
        : req
    );
    setResearchApprovedRequests(updatedResearchApproved);
    
    setSelectedRequest({ 
      ...selectedRequest, 
      researchReport,
      internalStatus: 'Pending Review' as any
    });
    
    setReportFile(null);
    setReportNotes('');
    setIsSubmittingReport(false);
    setIsViewModalOpen(false);
  };

  const handleStartReview = () => {
    if (!selectedRequest) return;
    
    const updatedResearchApproved = researchApprovedRequests.map(req => 
      req.id === selectedRequest.id 
        ? { ...req, internalStatus: 'Under Review' as any }
        : req
    );
    setResearchApprovedRequests(updatedResearchApproved);
    setSelectedRequest({ ...selectedRequest, internalStatus: 'Under Review' as any });
  };

  const handleEvaluationSubmit = (recommendation: 'recommend' | 'not_recommend') => {
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
    
    const existingEvaluations = selectedRequest.researchEvaluations || [];
    
    const updatedResearchApproved = researchApprovedRequests.map(req => 
      req.id === selectedRequest.id 
        ? { 
            ...req, 
            researchEvaluations: [...existingEvaluations, evaluation],
            internalStatus: 'Report Recommended' as any,
            reviewOutcome: 'Report Recommended' as any
          }
        : req
    );
    setResearchApprovedRequests(updatedResearchApproved);
    
    setSelectedRequest({ 
      ...selectedRequest, 
      researchEvaluations: [...existingEvaluations, evaluation],
      internalStatus: 'Report Recommended' as any,
      reviewOutcome: 'Report Recommended' as any
    });
    setChecklistState({});
    setEvaluationComments('');
    setIsViewModalOpen(false);
  };

  const canStartResearch = () => {
    const request = selectedRequest;
    return currentUser.role === 'Research Service Provider' && 
           request && 
           !request.researchReport &&
           request.internalStatus === 'Pending Research';
  };

  const canSubmitReport = () => {
    const request = selectedRequest;
    return currentUser.role === 'Research Service Provider' && 
           request && 
           request.internalStatus === 'Research In Progress' &&
           !request.researchReport;
  };

  const canStartReview = () => {
    const request = selectedRequest;
    return currentUser.role === 'Research Deputy Director' && 
           request && 
           request.researchReport &&
           request.internalStatus === 'Pending Review';
  };

  const canEvaluate = () => {
    const request = selectedRequest;
    return currentUser.role === 'Research Deputy Director' && 
           request && 
           request.internalStatus === 'Under Review' &&
           !request.researchEvaluations?.some(e => e.reviewerRole === 'Research Deputy Director');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Research Workspace</h3>
      <p className="text-gray-600">Conduct research and compile research reports</p>
      
      {researchRequests.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Research Requests</h4>
            <p className="text-sm text-gray-500">Conduct research and submit reports</p>
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
              {researchRequests.map((request) => (
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
          No research requests available. Approved SLA requests will appear here.
        </div>
      )}

      {/* Research Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Research Workspace</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="flex w-full flex-wrap gap-1">
                <TabsTrigger value="request" className="flex-shrink-0">Research Request</TabsTrigger>
                <TabsTrigger value="agenda" className="flex-shrink-0">Agenda & Submission</TabsTrigger>
                <TabsTrigger value="tor" className="flex-shrink-0">TOR Development</TabsTrigger>
                <TabsTrigger value="sla" className="flex-shrink-0">SLA Preparation</TabsTrigger>
                <TabsTrigger value="review" className="flex-shrink-0">Legal Review</TabsTrigger>
                <TabsTrigger value="research" className="flex-shrink-0">Research Workspace</TabsTrigger>
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
                        <p className="text-xs text-gray-500 mt-2">Reviewed by: {selectedRequest.legalDocument.reviewedBy} on {new Date(selectedRequest.legalDocument.reviewedAt || '').toLocaleDateString()}</p>
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
                        <p className="text-xs text-gray-500 mt-2">Approved by: {selectedRequest.ceoDocument.approvedBy} on {new Date(selectedRequest.ceoDocument.approvedAt || '').toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Tab 6: Research Workspace */}
              <TabsContent value="research" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Research Workspace</h3>
                  
                  {!selectedRequest.researchReport && selectedRequest.internalStatus === 'Pending Research' && (
                    <div className="space-y-4">
                      <Button onClick={handleStartResearch} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Research
                      </Button>
                    </div>
                  )}
                  
                  {canSubmitReport() && (
                    <div className="space-y-4">
                      <div>
                        <Label>Upload Research Report</Label>
                        <Input
                          type="file"
                          onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                          className="mt-1"
                          accept=".pdf,.doc,.docx"
                        />
                      </div>
                      <div>
                        <Label>Report Notes</Label>
                        <Textarea
                          value={reportNotes}
                          onChange={(e) => setReportNotes(e.target.value)}
                          placeholder="Add any notes about the research..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <Button onClick={handleSubmitReport} disabled={!reportFile} className="bg-green-600 hover:bg-green-700">
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Report for Review
                      </Button>
                    </div>
                  )}
                  
                  {selectedRequest.researchReport && selectedRequest.internalStatus === 'Pending Review' && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-yellow-800 font-medium">Report Submitted - Pending Review</p>
                      <a href={selectedRequest.researchReport.documentUrl} target="_blank" className="text-blue-600 hover:underline">View Report</a>
                      {selectedRequest.researchReport.reportNotes && (
                        <p className="text-sm text-gray-600 mt-2">Notes: {selectedRequest.researchReport.reportNotes}</p>
                      )}
                    </div>
                  )}
                  
                  {canStartReview() && (
                    <div className="space-y-4">
                      <Button onClick={handleStartReview} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Review
                      </Button>
                    </div>
                  )}
                  
                  {canEvaluate() && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Evaluation Checklist</h4>
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
                        <Button variant="outline" onClick={() => handleEvaluationSubmit('not_recommend')} className="border-red-300 text-red-600 hover:bg-red-50">
                          <XCircle className="h-4 w-4 mr-2" />
                          Not Recommend
                        </Button>
                        <Button onClick={() => handleEvaluationSubmit('recommend')} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Recommend Report
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {selectedRequest.internalStatus === 'Report Recommended' && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium">✓ Report Recommended</p>
                      <p className="text-sm text-gray-600">Ready for submission approval</p>
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

export default ResearchWorkspace;