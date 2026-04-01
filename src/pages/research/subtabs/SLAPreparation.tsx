// screens/subtabs/SLAPreparation.tsx
import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { Eye, FileText, Upload, CheckCircle, Clock } from 'lucide-react';
import type { ResearchRequest, SLADocument } from '@/types';

const SLAPreparation = () => {
  const { approvedRequests, setApprovedRequests, currentUser } = useApp();
  const [selectedRequest, setSelectedRequest] = useState<ResearchRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('request');
  const [slaFile, setSlaFile] = useState<File | null>(null);
  const [signedBy, setSignedBy] = useState('');
  const [isSubmittingSLA, setIsSubmittingSLA] = useState(false);
  

  // Filter requests that are ready for SLA preparation (TOR completed)
  const slaReadyRequests = approvedRequests.filter(req => req.torDocument && !req.slaDocument);

  const viewRequest = (request: ResearchRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
    setActiveTab('request');
    setSlaFile(null);
    setSignedBy('');
  };

  const getSLAStatusBadge = (request: ResearchRequest) => {
    if (request.slaDocument) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          SLA Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="h-3 w-3 mr-1" />
        SLA In Preparation
      </span>
    );
  };

// In SLAPreparation.tsx, update the handleSubmitSLA function:

const handleSubmitSLA = () => {
  if (!selectedRequest || !slaFile) return;
  
  setIsSubmittingSLA(true);
  
  const slaDocument: SLADocument = {
    id: `sla-${Date.now()}`,
    requestId: selectedRequest.id,
    documentUrl: URL.createObjectURL(slaFile),
    documentName: slaFile.name,
    uploadedAt: new Date().toISOString(),
    uploadedBy: currentUser.name,
    signedBy: signedBy,
    signedAt: new Date().toISOString(),
  };
  
  const updatedApproved = approvedRequests.map(req => 
    req.id === selectedRequest.id 
      ? { 
          ...req, 
          slaDocument,
          internalStatus: 'Pending Legal Review' as any,  // ← Change this
          appointmentStatus: req.appointmentStatus
        }
      : req
  );
  setApprovedRequests(updatedApproved);
  
  setSelectedRequest({ 
    ...selectedRequest, 
    slaDocument,
    internalStatus: 'Pending Legal Review' as any,
    appointmentStatus: selectedRequest.appointmentStatus
  });
  
  setSlaFile(null);
  setIsSubmittingSLA(false);
  setIsViewModalOpen(false);
};

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Service Level Agreement Preparation</h3>
      <p className="text-gray-600">Sign SLA with service provider for approved research requests</p>
      
      {/* SLA Requests Table */}
      {slaReadyRequests.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Requests Ready for SLA Preparation</h4>
            <p className="text-sm text-gray-500">Sign SLA with service provider and submit for approval</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Business Unit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slaReadyRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.requestId}</TableCell>
                  <TableCell>{request.title}</TableCell>
                  <TableCell>{getSLAStatusBadge(request)}</TableCell>
                  <TableCell>{request.requesterDetails.name}</TableCell>
                  <TableCell>{request.requesterDetails.businessUnit}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewRequest(request)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Manage SLA
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No requests ready for SLA preparation. Complete TOR development first.
        </div>
      )}

      {/* SLA Preparation Modal with 4 Tabs */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Research Request Details - SLA Preparation</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="request">Research Request</TabsTrigger>
                <TabsTrigger value="agenda">Agenda & Submission</TabsTrigger>
                <TabsTrigger value="tor">TOR Development</TabsTrigger>
                <TabsTrigger value="sla">SLA Preparation</TabsTrigger>
              </TabsList>
              
              {/* Tab 1: Research Request Details */}
              <TabsContent value="request" className="space-y-6 py-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">A. Basic Request Info</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Request ID</Label><p className="font-medium">{selectedRequest.requestId}</p></div>
                    <div><Label className="text-sm text-gray-500">Title</Label><p className="font-medium">{selectedRequest.title}</p></div>
                    <div><Label className="text-sm text-gray-500">Date Submitted</Label><p className="font-medium">{new Date(selectedRequest.dateSubmitted).toLocaleString()}</p></div>
                    <div><Label className="text-sm text-gray-500">Review Outcome</Label><p className="font-medium text-green-600">{selectedRequest.reviewOutcome}</p></div>
                  </div>
                </div>

                {/* Requester Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">B. Requester Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Name</Label><p className="font-medium">{selectedRequest.requesterDetails.name}</p></div>
                    <div><Label className="text-sm text-gray-500">Role</Label><p className="font-medium">{selectedRequest.requesterDetails.role}</p></div>
                    <div><Label className="text-sm text-gray-500">Business Unit</Label><p className="font-medium">{selectedRequest.requesterDetails.businessUnit}</p></div>
                    <div><Label className="text-sm text-gray-500">Email</Label><p className="font-medium">{selectedRequest.requesterDetails.email}</p></div>
                  </div>
                </div>

                {/* Research Purpose */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">C. Research Purpose / Motivation</h3>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Problem Statement</Label><p className="mt-1">{selectedRequest.researchPurpose.problemStatement}</p></div>
                    <div><Label className="text-sm text-gray-500">Reason for Research</Label><p className="mt-1">{selectedRequest.researchPurpose.reasonForResearch}</p></div>
                    <div><Label className="text-sm text-gray-500">Trigger</Label><p className="mt-1">{selectedRequest.researchPurpose.trigger}</p></div>
                    <div><Label className="text-sm text-gray-500">Expected Impact</Label><p className="mt-1">{selectedRequest.researchPurpose.expectedImpact}</p></div>
                  </div>
                </div>

                {/* Attachments */}
                {selectedRequest.attachments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">J. Attachments</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      {selectedRequest.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {attachment.name}
                          </a>
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
                          ) : (
                            <p className="text-gray-500 mt-1">No agenda document uploaded</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm text-gray-500">Submission Document</Label>
                          {selectedRequest.agenda.submissionDocument ? (
                            <a href={selectedRequest.agenda.submissionDocument.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2 mt-1">
                              <FileText className="h-4 w-4" />
                              {selectedRequest.agenda.submissionDocument.name}
                            </a>
                          ) : (
                            <p className="text-gray-500 mt-1">No submission document uploaded</p>
                          )}
                        </div>
                      </div>
                      <div><Label className="text-sm text-gray-500">Submitted By</Label><p className="mt-1">{selectedRequest.agenda.submittedBy || 'Unknown'}</p></div>
                      <div><Label className="text-sm text-gray-500">Submitted At</Label><p className="mt-1">{selectedRequest.agenda.submittedAt ? new Date(selectedRequest.agenda.submittedAt).toLocaleString() : 'Not submitted'}</p></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No agenda has been created for this request.
                  </div>
                )}

                {/* Evaluations */}
                {selectedRequest.evaluations && selectedRequest.evaluations.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900">Evaluations</h3>
                    {selectedRequest.evaluations.map((evalItem, idx) => (
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
                      <a href={selectedRequest.torDocument.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {selectedRequest.torDocument.documentName}
                      </a>
                      <p className="text-sm text-gray-600 mt-2">
                        Uploaded by: {selectedRequest.torDocument.uploadedBy} on {new Date(selectedRequest.torDocument.uploadedAt).toLocaleDateString()}
                      </p>
                      {selectedRequest.torDocument.workshopConducted && (
                        <>
                          <p className="text-sm text-gray-600 mt-2">
                            Workshop conducted on: {new Date(selectedRequest.torDocument.workshopDate || '').toLocaleDateString()}
                          </p>
                          {selectedRequest.torDocument.workshopNotes && (
                            <p className="text-sm text-gray-600 mt-1">
                              Workshop Notes: {selectedRequest.torDocument.workshopNotes}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    TOR document not yet uploaded.
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 4: SLA Preparation */}
              <TabsContent value="sla" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">SLA Preparation</h3>
                  
                  {!selectedRequest.slaDocument && (
                    <div className="space-y-4">
                      <div>
                        <Label>Upload Signed SLA Document</Label>
                        <Input
                          type="file"
                          onChange={(e) => setSlaFile(e.target.files?.[0] || null)}
                          className="mt-1"
                          accept=".pdf,.doc,.docx"
                        />
                      </div>
                      
                      <div>
                        <Label>Signed By</Label>
                        <Input
                          value={signedBy}
                          onChange={(e) => setSignedBy(e.target.value)}
                          placeholder="Name of signatory"
                          className="mt-1"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleSubmitSLA}
                        disabled={!slaFile || !signedBy}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Submit SLA
                      </Button>
                    </div>
                  )}
                  
                  {selectedRequest.slaDocument && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium mb-2">✓ SLA Completed</p>
                      <a href={selectedRequest.slaDocument.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {selectedRequest.slaDocument.documentName}
                      </a>
                      <p className="text-sm text-gray-600 mt-2">
                        Signed by: {selectedRequest.slaDocument.signedBy} on {new Date(selectedRequest.slaDocument.signedAt || '').toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Uploaded by: {selectedRequest.slaDocument.uploadedBy} on {new Date(selectedRequest.slaDocument.uploadedAt).toLocaleDateString()}
                      </p>
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

export default SLAPreparation;