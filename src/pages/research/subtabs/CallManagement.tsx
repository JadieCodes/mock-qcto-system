// screens/subtabs/CallManagement.tsx
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Eye, Upload, FileText, Edit } from 'lucide-react';
import type { BulletinCall, BulletinAttachment, AppRole } from '@/types';

const CallManagement = () => {
 const { bulletinCalls, setBulletinCalls, bulletinSubmissions, currentUser } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<BulletinCall | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCall, setEditingCall] = useState<BulletinCall | null>(null);
  

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    objectives: '',
    scope: '',
    targetAudience: '',
    submissionDeadline: '',
    eligibilityCriteria: '',
    evaluationCriteria: '',
    expectedOutcomes: '',
    budget: '',
    contactPerson: '',
    contactEmail: '',
    targetApplicantRole: '' as AppRole,
  });

  const applicantRoles: AppRole[] = ['Applicant', 'External Applicant'];

const activeCalls = bulletinCalls.filter(call => {
  // Check if this call has ANY submission (regardless of status)
  const hasAnySubmission = bulletinSubmissions.some(
    sub => sub.callId === call.id
  );
  // Only show calls that don't have any submissions at all
  return !hasAnySubmission;
});

  const generateCallNumber = () => {
    return `CALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      objectives: '',
      scope: '',
      targetAudience: '',
      submissionDeadline: '',
      eligibilityCriteria: '',
      evaluationCriteria: '',
      expectedOutcomes: '',
      budget: '',
      contactPerson: '',
      contactEmail: '',
      targetApplicantRole: '' as AppRole,
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

  const handleEditCall = (call: BulletinCall) => {
    setEditingCall(call);
    // Populate form with existing data
    setFormData({
      title: call.title,
      description: call.description,
      objectives: call.objectives,
      scope: call.scope,
      targetAudience: call.targetAudience,
      submissionDeadline: call.submissionDeadline,
      eligibilityCriteria: call.eligibilityCriteria,
      evaluationCriteria: call.evaluationCriteria,
      expectedOutcomes: call.expectedOutcomes,
      budget: call.budget,
      contactPerson: call.contactPerson,
      contactEmail: call.contactEmail,
      targetApplicantRole: call.targetApplicantRole,
    });
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleUpdateDraft = () => {
    if (!editingCall) return;
    
    const updatedCall: BulletinCall = {
      ...editingCall,
      title: formData.title,
      description: formData.description,
      objectives: formData.objectives,
      scope: formData.scope,
      targetAudience: formData.targetAudience,
      submissionDeadline: formData.submissionDeadline,
      eligibilityCriteria: formData.eligibilityCriteria,
      evaluationCriteria: formData.evaluationCriteria,
      expectedOutcomes: formData.expectedOutcomes,
      budget: formData.budget,
      contactPerson: formData.contactPerson,
      contactEmail: formData.contactEmail,
      attachments: attachments.length > 0 ? attachments.map(file => ({
        id: Math.random().toString(),
        name: file.name,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      })) : editingCall.attachments,
      targetApplicantRole: formData.targetApplicantRole,
    };

    const updatedCalls = bulletinCalls.map(call => 
      call.id === editingCall.id ? updatedCall : call
    );
    setBulletinCalls(updatedCalls);
    resetForm();
    setIsEditMode(false);
    setEditingCall(null);
    setIsFormOpen(false);
  };

  const handleSubmitFromEdit = () => {
    if (!editingCall) return;
    
    const updatedCall: BulletinCall = {
      ...editingCall,
      title: formData.title,
      description: formData.description,
      objectives: formData.objectives,
      scope: formData.scope,
      targetAudience: formData.targetAudience,
      submissionDeadline: formData.submissionDeadline,
      eligibilityCriteria: formData.eligibilityCriteria,
      evaluationCriteria: formData.evaluationCriteria,
      expectedOutcomes: formData.expectedOutcomes,
      budget: formData.budget,
      contactPerson: formData.contactPerson,
      contactEmail: formData.contactEmail,
      attachments: attachments.length > 0 ? attachments.map(file => ({
        id: Math.random().toString(),
        name: file.name,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      })) : editingCall.attachments,
      status: 'Call Pending' as const,
      targetApplicantRole: formData.targetApplicantRole,
    };

    const updatedCalls = bulletinCalls.map(call => 
      call.id === editingCall.id ? updatedCall : call
    );
    setBulletinCalls(updatedCalls);
    resetForm();
    setIsEditMode(false);
    setEditingCall(null);
    setIsFormOpen(false);
  };

  const handleSaveDraft = () => {
    const newCall: BulletinCall = {
      id: Date.now().toString(),
      title: formData.title,
      callNumber: generateCallNumber(),
      description: formData.description,
      objectives: formData.objectives,
      scope: formData.scope,
      targetAudience: formData.targetAudience,
      submissionDeadline: formData.submissionDeadline,
      eligibilityCriteria: formData.eligibilityCriteria,
      evaluationCriteria: formData.evaluationCriteria,
      expectedOutcomes: formData.expectedOutcomes,
      budget: formData.budget,
      contactPerson: formData.contactPerson,
      contactEmail: formData.contactEmail,
      attachments: attachments.map(file => ({
        id: Math.random().toString(),
        name: file.name,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      })),
      status: 'Call Draft',
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      targetApplicantRole: formData.targetApplicantRole,
    };

    setBulletinCalls(prev => [newCall, ...prev]);
    resetForm();
    setIsFormOpen(false);
  };

  const handleSubmit = () => {
    const newCall: BulletinCall = {
      id: Date.now().toString(),
      title: formData.title,
      callNumber: generateCallNumber(),
      description: formData.description,
      objectives: formData.objectives,
      scope: formData.scope,
      targetAudience: formData.targetAudience,
      submissionDeadline: formData.submissionDeadline,
      eligibilityCriteria: formData.eligibilityCriteria,
      evaluationCriteria: formData.evaluationCriteria,
      expectedOutcomes: formData.expectedOutcomes,
      budget: formData.budget,
      contactPerson: formData.contactPerson,
      contactEmail: formData.contactEmail,
      attachments: attachments.map(file => ({
        id: Math.random().toString(),
        name: file.name,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      })),
      status: 'Call Pending',
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      targetApplicantRole: formData.targetApplicantRole,
    };

    setBulletinCalls(prev => [newCall, ...prev]);
    resetForm();
    setIsFormOpen(false);
  };

  const viewCall = (call: BulletinCall) => {
    setSelectedCall(call);
    setIsViewModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      'Call Draft': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'Call Pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending call' },
      'Call Open': { color: 'bg-green-100 text-green-800', label: 'Open call' },
      'Call Closed': { color: 'bg-red-100 text-red-800', label: 'Closed' },
    };
    const config = statusConfig[status] || statusConfig['Call Draft'];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Call Management</h3>
          <p className="text-gray-600">Create and manage calls for submissions</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setIsEditMode(false);
            setEditingCall(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Call for Submission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Call for Submission' : 'Create Call for Submission'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Call Title *</Label>
                    <Input name="title" value={formData.title} onChange={handleInputChange} placeholder="Enter call title" required />
                  </div>
                  <div>
                    <Label>Target Applicant Role *</Label>
                    <Select value={formData.targetApplicantRole} onValueChange={(value) => setFormData(prev => ({ ...prev, targetApplicantRole: value as AppRole }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select applicant role" />
                      </SelectTrigger>
                      <SelectContent>
                        {applicantRoles.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe the call for submission" rows={3} required />
                </div>
              </div>

              {/* Call Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Call Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Objectives</Label>
                    <Textarea name="objectives" value={formData.objectives} onChange={handleInputChange} placeholder="What are the objectives of this call?" rows={2} />
                  </div>
                  <div>
                    <Label>Scope</Label>
                    <Textarea name="scope" value={formData.scope} onChange={handleInputChange} placeholder="What is the scope of work?" rows={2} />
                  </div>
                </div>
                <div>
                  <Label>Target Audience</Label>
                  <Input name="targetAudience" value={formData.targetAudience} onChange={handleInputChange} placeholder="Who is this call intended for?" />
                </div>
                <div>
                  <Label>Submission Deadline *</Label>
                  <Input type="datetime-local" name="submissionDeadline" value={formData.submissionDeadline} onChange={handleInputChange} required />
                </div>
              </div>

              {/* Criteria */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Criteria</h3>
                <div>
                  <Label>Eligibility Criteria</Label>
                  <Textarea name="eligibilityCriteria" value={formData.eligibilityCriteria} onChange={handleInputChange} placeholder="Who is eligible to apply?" rows={2} />
                </div>
                <div>
                  <Label>Evaluation Criteria</Label>
                  <Textarea name="evaluationCriteria" value={formData.evaluationCriteria} onChange={handleInputChange} placeholder="How will submissions be evaluated?" rows={2} />
                </div>
                <div>
                  <Label>Expected Outcomes</Label>
                  <Textarea name="expectedOutcomes" value={formData.expectedOutcomes} onChange={handleInputChange} placeholder="What outcomes are expected?" rows={2} />
                </div>
                <div>
                  <Label>Budget / Funding</Label>
                  <Input name="budget" value={formData.budget} onChange={handleInputChange} placeholder="Available budget (if any)" />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Person</Label>
                    <Input name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} placeholder="Name of contact person" />
                  </div>
                  <div>
                    <Label>Contact Email</Label>
                    <Input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleInputChange} placeholder="Contact email address" />
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
                <div className="flex items-center gap-4">
                  <Input type="file" multiple onChange={handleFileUpload} className="flex-1" />
                  <Button variant="outline" type="button"><Upload className="h-4 w-4 mr-2" />Upload</Button>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files:</Label>
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <FileText className="h-4 w-4" />
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show existing attachments in edit mode */}
                {isEditMode && editingCall && editingCall.attachments.length > 0 && attachments.length === 0 && (
                  <div className="space-y-2">
                    <Label>Existing Attachments:</Label>
                    {editingCall.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <FileText className="h-4 w-4" />
                        <a href={attachment.url} target="_blank" className="text-blue-600 hover:underline">
                          {attachment.name}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setIsFormOpen(false);
                  setIsEditMode(false);
                  setEditingCall(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                {isEditMode ? (
                  <>
                    <Button variant="secondary" onClick={handleUpdateDraft}>
                      Save Changes
                    </Button>
                    <Button onClick={handleSubmitFromEdit} className="bg-green-600 hover:bg-green-700">
                      Submit Call
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" onClick={handleSaveDraft}>
                      Save as Draft
                    </Button>
                    <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                      Submit Call
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calls Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Call Number</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Target Audience</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeCalls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                  No active calls available.
                </TableCell>
              </TableRow>
            ) : (
              activeCalls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell className="font-medium">{call.callNumber}</TableCell>
                  <TableCell>{call.title}</TableCell>
                  <TableCell>{call.targetAudience}</TableCell>
                  <TableCell>{new Date(call.submissionDeadline).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(call.status)}</TableCell>
                  <TableCell>{call.createdBy}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => viewCall(call)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      {call.status === 'Call Draft' && (
                        <Button variant="ghost" size="sm" onClick={() => handleEditCall(call)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Call Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Call for Submission Details</DialogTitle>
          </DialogHeader>
          {selectedCall && (
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><Label className="text-sm text-gray-500">Call Number</Label><p className="font-medium">{selectedCall.callNumber}</p></div>
                  <div><Label className="text-sm text-gray-500">Title</Label><p className="font-medium">{selectedCall.title}</p></div>
                  <div><Label className="text-sm text-gray-500">Target Audience</Label><p className="font-medium">{selectedCall.targetAudience}</p></div>
                  <div><Label className="text-sm text-gray-500">Target Role</Label><p className="font-medium">{selectedCall.targetApplicantRole}</p></div>
                  <div><Label className="text-sm text-gray-500">Deadline</Label><p className="font-medium">{new Date(selectedCall.submissionDeadline).toLocaleString()}</p></div>
                  <div><Label className="text-sm text-gray-500">Status</Label><p className="font-medium">{selectedCall.status}</p></div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                <div className="bg-gray-50 p-4 rounded-lg"><p>{selectedCall.description}</p></div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Objectives & Scope</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><Label className="text-sm text-gray-500">Objectives</Label><p className="mt-1">{selectedCall.objectives}</p></div>
                  <div><Label className="text-sm text-gray-500">Scope</Label><p className="mt-1">{selectedCall.scope}</p></div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Criteria</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><Label className="text-sm text-gray-500">Eligibility</Label><p className="mt-1">{selectedCall.eligibilityCriteria}</p></div>
                  <div><Label className="text-sm text-gray-500">Evaluation</Label><p className="mt-1">{selectedCall.evaluationCriteria}</p></div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div><Label className="text-sm text-gray-500">Contact Person</Label><p className="mt-1">{selectedCall.contactPerson}</p></div>
                  <div><Label className="text-sm text-gray-500">Contact Email</Label><p className="mt-1">{selectedCall.contactEmail}</p></div>
                </div>
              </div>

              {selectedCall.attachments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                    {selectedCall.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <a href={attachment.url} target="_blank" className="text-blue-600 hover:underline">{attachment.name}</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CallManagement;