// screens/ResearchRequestsPortal.tsx
import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Eye, Upload, FileText, Edit } from 'lucide-react';
import type { ResearchRequest } from '@/types';
// Types
interface Attachment {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}



const STORAGE_KEY = 'research_requests';

const ResearchRequestsPortal = () => {
 
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ResearchRequest | null>(null);
  
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ResearchRequest | null>(null);
  const { currentUser, requests, setRequests } = useApp();
  

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    problemStatement: '',
    reasonForResearch: '',
    trigger: '',
    expectedImpact: '',
  });

 


  const generateRequestId = () => {
    return `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      problemStatement: '',
      reasonForResearch: '',
      trigger: '',
      expectedImpact: '',
    });
    setAttachments([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSaveDraft = () => {
  const newRequest: ResearchRequest = {
    id: Date.now().toString(),
    title: formData.title,
    requestId: generateRequestId(),
    dateSubmitted: new Date().toISOString(),
    status: 'Draft',
    requesterDetails: {
  name: currentUser.name,
  role: currentUser.role,
  businessUnit: currentUser.businessUnit,
  email: currentUser.email,
},
    researchPurpose: {
      problemStatement: formData.problemStatement,
      reasonForResearch: formData.reasonForResearch,
      trigger: formData.trigger,
      expectedImpact: formData.expectedImpact,
    },
    attachments: [],
  };

  setRequests(prev => [newRequest, ...prev]);

  resetForm();
  setIsFormOpen(false);
};

 const handleSubmit = () => {
  const newRequest: ResearchRequest = {
    id: Date.now().toString(),
    title: formData.title,
    requestId: generateRequestId(),
    dateSubmitted: new Date().toISOString(),
    status: 'Submitted',
    requesterDetails: {
  name: currentUser.name,
  role: currentUser.role,
  businessUnit: currentUser.businessUnit,
  email: currentUser.email,
},
    researchPurpose: {
      problemStatement: formData.problemStatement,
      reasonForResearch: formData.reasonForResearch,
      trigger: formData.trigger,
      expectedImpact: formData.expectedImpact,
    },
    attachments: attachments.map(file => ({
      id: Math.random().toString(),
      name: file.name,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
    })),
  };

  setRequests(prev => [newRequest, ...prev]);

  resetForm();
  setIsFormOpen(false);
};

  const handleEditRequest = (request: ResearchRequest) => {
    setEditingRequest(request);
    setFormData({
      title: request.title,
      problemStatement: request.researchPurpose.problemStatement,
      reasonForResearch: request.researchPurpose.reasonForResearch,
      trigger: request.researchPurpose.trigger,
      expectedImpact: request.researchPurpose.expectedImpact,
    });
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleUpdateDraft = () => {
    if (editingRequest) {
      const updatedRequest: ResearchRequest = {
        ...editingRequest,
        title: formData.title,
        researchPurpose: {
          problemStatement: formData.problemStatement,
          reasonForResearch: formData.reasonForResearch,
          trigger: formData.trigger,
          expectedImpact: formData.expectedImpact,
        },
        attachments: attachments.length > 0 ? attachments.map(file => ({
          id: Math.random().toString(),
          name: file.name,
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString(),
        })) : editingRequest.attachments,
      };

      setRequests(prev => prev.map(req => req.id === editingRequest.id ? updatedRequest : req));
      resetForm();
      setIsEditMode(false);
      setEditingRequest(null);
      setIsFormOpen(false);
    }
  };

  const handleSubmitFromEdit = () => {
    if (editingRequest) {
      const updatedRequest: ResearchRequest = {
        ...editingRequest,
        title: formData.title,
        researchPurpose: {
          problemStatement: formData.problemStatement,
          reasonForResearch: formData.reasonForResearch,
          trigger: formData.trigger,
          expectedImpact: formData.expectedImpact,
        },
        attachments: attachments.length > 0 ? attachments.map(file => ({
          id: Math.random().toString(),
          name: file.name,
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString(),
        })) : editingRequest.attachments,
        status: 'Submitted',
      };

      setRequests(prev => prev.map(req => req.id === editingRequest.id ? updatedRequest : req));
      resetForm();
      setIsEditMode(false);
      setEditingRequest(null);
      setIsFormOpen(false);
    }
  };

  const handleSubmitFromView = () => {
    if (selectedRequest) {
      setRequests(prev => prev.map(req => 
        req.id === selectedRequest.id ? { ...req, status: 'Submitted' } : req
      ));
      setSelectedRequest({ ...selectedRequest, status: 'Submitted' });
    }
  };

  const viewRequest = (request: ResearchRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Research Requests Portal</h2>
          <p className="text-gray-600 mt-1">Create and manage your research requests</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setIsEditMode(false);
            setEditingRequest(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Research Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Research Request' : 'Create New Research Request'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Requester Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">B. Requester Details</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><Label className="text-sm text-gray-500">Name</Label><p className="font-medium">{currentUser.name}</p></div>
                  <div><Label className="text-sm text-gray-500">Role</Label><p className="font-medium">{currentUser.role}</p></div>
                  <div><Label className="text-sm text-gray-500">Business Unit</Label><p className="font-medium">{currentUser.businessUnit}</p></div>
                  <div><Label className="text-sm text-gray-500">Email</Label><p className="font-medium">{currentUser.email}</p></div>
                </div>
              </div>

              {/* Research Purpose */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">C. Research Purpose / Motivation</h3>
                <div className="space-y-4">
                  <div><Label htmlFor="title">Request Title</Label><Input id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="Enter a title for your research request" required /></div>
                  <div><Label htmlFor="problemStatement">Problem Statement</Label><Textarea id="problemStatement" name="problemStatement" value={formData.problemStatement} onChange={handleInputChange} placeholder="Describe the problem or gap that needs to be addressed" rows={3} /></div>
                  <div><Label htmlFor="reasonForResearch">Reason for Research</Label><Textarea id="reasonForResearch" name="reasonForResearch" value={formData.reasonForResearch} onChange={handleInputChange} placeholder="Explain why this research is necessary" rows={3} /></div>
                  <div><Label htmlFor="trigger">What triggered it?</Label><Textarea id="trigger" name="trigger" value={formData.trigger} onChange={handleInputChange} placeholder="e.g., industry need, policy change, internal discussion" rows={2} /></div>
                  <div><Label htmlFor="expectedImpact">Expected Impact</Label><Textarea id="expectedImpact" name="expectedImpact" value={formData.expectedImpact} onChange={handleInputChange} placeholder="What impact do you expect this research to have?" rows={3} /></div>
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">J. Attachments</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input type="file" multiple onChange={handleFileUpload} className="flex-1" />
                    <Button variant="outline" type="button"><Upload className="h-4 w-4 mr-2" />Upload</Button>
                  </div>
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Files:</Label>
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <FileText className="h-4 w-4" /><span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline" onClick={() => { setIsFormOpen(false); setIsEditMode(false); setEditingRequest(null); resetForm(); }}>Cancel</Button>
                {isEditMode ? (
                  <>
                    <Button variant="secondary" onClick={handleUpdateDraft}>Save Changes</Button>
                    <Button onClick={handleSubmitFromEdit} className="bg-green-600 hover:bg-green-700">Submit</Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" onClick={handleSaveDraft}>Save as Draft</Button>
                    <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">Submit Request</Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request ID</TableHead><TableHead>Title</TableHead><TableHead>Date Submitted</TableHead><TableHead>Status</TableHead><TableHead>Requester</TableHead><TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">No research requests yet. Click "New Research Request" to create one.</TableCell></TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.requestId}</TableCell>
                  <TableCell>{request.title}</TableCell>
                  <TableCell>{new Date(request.dateSubmitted).toLocaleDateString()}</TableCell>
                  <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${request.status === 'Submitted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{request.status}</span></TableCell>
                  <TableCell>{request.requesterDetails.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => viewRequest(request)}><Eye className="h-4 w-4 mr-2" />View</Button>
                      {request.status === 'Draft' && (<Button variant="ghost" size="sm" onClick={() => handleEditRequest(request)}><Edit className="h-4 w-4 mr-2" />Edit</Button>)}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Request Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Research Request Details</DialogTitle></DialogHeader>
          {selectedRequest && (
            <div className="space-y-6 py-4">
              <div className="space-y-4"><h3 className="text-lg font-semibold text-gray-900">A. Basic Request Info</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><Label className="text-sm text-gray-500">Request ID</Label><p className="font-medium">{selectedRequest.requestId}</p></div>
                  <div><Label className="text-sm text-gray-500">Title</Label><p className="font-medium">{selectedRequest.title}</p></div>
                  <div><Label className="text-sm text-gray-500">Date Submitted</Label><p className="font-medium">{new Date(selectedRequest.dateSubmitted).toLocaleString()}</p></div>
                  <div><Label className="text-sm text-gray-500">Status</Label><p className="font-medium">{selectedRequest.status}</p></div>
                </div>
              </div>
              <div className="space-y-4"><h3 className="text-lg font-semibold text-gray-900">B. Requester Details</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><Label className="text-sm text-gray-500">Name</Label><p className="font-medium">{selectedRequest.requesterDetails.name}</p></div>
                  <div><Label className="text-sm text-gray-500">Role</Label><p className="font-medium">{selectedRequest.requesterDetails.role}</p></div>
                  <div><Label className="text-sm text-gray-500">Business Unit</Label><p className="font-medium">{selectedRequest.requesterDetails.businessUnit}</p></div>
                  <div><Label className="text-sm text-gray-500">Email</Label><p className="font-medium">{selectedRequest.requesterDetails.email}</p></div>
                </div>
              </div>
              <div className="space-y-4"><h3 className="text-lg font-semibold text-gray-900">C. Research Purpose / Motivation</h3>
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                  <div><Label className="text-sm text-gray-500">Problem Statement</Label><p className="mt-1">{selectedRequest.researchPurpose.problemStatement}</p></div>
                  <div><Label className="text-sm text-gray-500">Reason for Research</Label><p className="mt-1">{selectedRequest.researchPurpose.reasonForResearch}</p></div>
                  <div><Label className="text-sm text-gray-500">Trigger</Label><p className="mt-1">{selectedRequest.researchPurpose.trigger}</p></div>
                  <div><Label className="text-sm text-gray-500">Expected Impact</Label><p className="mt-1">{selectedRequest.researchPurpose.expectedImpact}</p></div>
                </div>
              </div>
              {selectedRequest.attachments.length > 0 && (
                <div className="space-y-4"><h3 className="text-lg font-semibold text-gray-900">J. Attachments</h3>
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
              {selectedRequest.status === 'Draft' && (
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => { setIsViewModalOpen(false); handleEditRequest(selectedRequest); }}><Edit className="h-4 w-4 mr-2" />Edit Draft</Button>
                  <Button onClick={handleSubmitFromView} className="bg-green-600 hover:bg-green-700">Submit Request</Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResearchRequestsPortal;