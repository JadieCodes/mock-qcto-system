// screens/ExternalResearchApplicationsPortal.tsx
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Eye, Upload, FileText, Edit, Send } from 'lucide-react';
import type { ExternalApplication, ExternalApplicationStatus } from '@/types';

const ExternalResearchApplicationsPortal = () => {
  const { currentUser, externalApplications, setExternalApplications } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ExternalApplication | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingApplication, setEditingApplication] = useState<ExternalApplication | null>(null);
  const [activeTab, setActiveTab] = useState('application');

  // Form completion state
  const [completedFormFile, setCompletedFormFile] = useState<File | null>(null);
  const [additionalFormNotes, setAdditionalFormNotes] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problemStatement: '',
    researchQuestion: '',
    expectedOutcomes: '',
    methodology: '',
  });

  const generateApplicationId = () => {
    return `EXT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      problemStatement: '',
      researchQuestion: '',
      expectedOutcomes: '',
      methodology: '',
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
    const newApplication: ExternalApplication = {
      id: Date.now().toString(),
      applicationId: generateApplicationId(),
      title: formData.title,
      description: formData.description,
      applicantDetails: {
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        businessUnit: currentUser.businessUnit,
      },
      researchPurpose: {
        problemStatement: formData.problemStatement,
        researchQuestion: formData.researchQuestion,
        expectedOutcomes: formData.expectedOutcomes,
        methodology: formData.methodology,
      },
      attachments: attachments.map(file => ({
        id: Math.random().toString(),
        name: file.name,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      })),
      status: 'Draft' as ExternalApplicationStatus,
      submittedAt: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setExternalApplications(prev => [newApplication, ...prev]);
    resetForm();
    setIsFormOpen(false);
  };

  const handleSubmit = () => {
    const newApplication: ExternalApplication = {
      id: Date.now().toString(),
      applicationId: generateApplicationId(),
      title: formData.title,
      description: formData.description,
      applicantDetails: {
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        businessUnit: currentUser.businessUnit,
      },
      researchPurpose: {
        problemStatement: formData.problemStatement,
        researchQuestion: formData.researchQuestion,
        expectedOutcomes: formData.expectedOutcomes,
        methodology: formData.methodology,
      },
      attachments: attachments.map(file => ({
        id: Math.random().toString(),
        name: file.name,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      })),
      status: 'Submitted' as ExternalApplicationStatus,
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setExternalApplications(prev => [newApplication, ...prev]);
    resetForm();
    setIsFormOpen(false);
  };

  const handleEditApplication = (application: ExternalApplication) => {
    setEditingApplication(application);
    setFormData({
      title: application.title,
      description: application.description,
      problemStatement: application.researchPurpose.problemStatement,
      researchQuestion: application.researchPurpose.researchQuestion,
      expectedOutcomes: application.researchPurpose.expectedOutcomes,
      methodology: application.researchPurpose.methodology,
    });
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleUpdateDraft = () => {
    if (editingApplication) {
      const updatedApplication: ExternalApplication = {
        ...editingApplication,
        title: formData.title,
        description: formData.description,
        researchPurpose: {
          problemStatement: formData.problemStatement,
          researchQuestion: formData.researchQuestion,
          expectedOutcomes: formData.expectedOutcomes,
          methodology: formData.methodology,
        },
        attachments: attachments.length > 0 ? attachments.map(file => ({
          id: Math.random().toString(),
          name: file.name,
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString(),
        })) : editingApplication.attachments,
        updatedAt: new Date().toISOString(),
      };

      setExternalApplications(prev => prev.map(app => 
        app.id === editingApplication.id ? updatedApplication : app
      ));
      resetForm();
      setIsEditMode(false);
      setEditingApplication(null);
      setIsFormOpen(false);
    }
  };

  const handleSubmitFromEdit = () => {
    if (editingApplication) {
      const updatedApplication: ExternalApplication = {
        ...editingApplication,
        title: formData.title,
        description: formData.description,
        researchPurpose: {
          problemStatement: formData.problemStatement,
          researchQuestion: formData.researchQuestion,
          expectedOutcomes: formData.expectedOutcomes,
          methodology: formData.methodology,
        },
        attachments: attachments.length > 0 ? attachments.map(file => ({
          id: Math.random().toString(),
          name: file.name,
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString(),
        })) : editingApplication.attachments,
        status: 'Submitted' as ExternalApplicationStatus,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setExternalApplications(prev => prev.map(app => 
        app.id === editingApplication.id ? updatedApplication : app
      ));
      resetForm();
      setIsEditMode(false);
      setEditingApplication(null);
      setIsFormOpen(false);
    }
  };

  const handleSubmitFromView = () => {
    if (selectedApplication && selectedApplication.status === 'Draft') {
      setExternalApplications(prev => prev.map(app => 
        app.id === selectedApplication.id
          ? { ...app, status: 'Submitted' as ExternalApplicationStatus, submittedAt: new Date().toISOString() }
          : app
      ));
      setSelectedApplication({ ...selectedApplication, status: 'Submitted' as ExternalApplicationStatus });
    }
  };

 const handleCompleteAndSubmitForm = () => {
  if (!selectedApplication || !completedFormFile) return;
  
  setIsSubmittingForm(true);
  
  // Update the application with the completed form
  const updatedApplications = externalApplications.map(app => 
    app.id === selectedApplication.id
      ? { 
          ...app, 
          completedForm: {
            documentUrl: URL.createObjectURL(completedFormFile),
            uploadedAt: new Date().toISOString(),
          },
          additionalNotes: additionalFormNotes,
          status: 'Under DD Review' as ExternalApplicationStatus
        }
      : app
  );
  
  setExternalApplications(updatedApplications);
  setSelectedApplication({ 
    ...selectedApplication, 
    completedForm: {
      documentUrl: URL.createObjectURL(completedFormFile),
      uploadedAt: new Date().toISOString(),
    },
    additionalNotes: additionalFormNotes,
    status: 'Under DD Review' as ExternalApplicationStatus
  });
  
  setCompletedFormFile(null);
  setAdditionalFormNotes('');
  setIsSubmittingForm(false);
  setIsViewModalOpen(false);
};

  const viewApplication = (application: ExternalApplication) => {
    setSelectedApplication(application);
    setIsViewModalOpen(true);
    setActiveTab('application');
    setCompletedFormFile(null);
    setAdditionalFormNotes('');
  };

  const getStatusBadge = (status: ExternalApplicationStatus) => {
    const statusConfig: Record<ExternalApplicationStatus, { color: string; label: string }> = {
      'Draft': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'Submitted': { color: 'bg-yellow-100 text-yellow-800', label: 'Submitted' },
      'Pending Directors Review': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Director Review' },
      'Under Directors Review': { color: 'bg-blue-100 text-blue-800', label: 'Under Director Review' },
      'Link Generation Pending': { color: 'bg-purple-100 text-purple-800', label: 'Link Generation Pending' },
      'Link Generation In Progress': { color: 'bg-blue-100 text-blue-800', label: 'Link Generation In Progress' },
      'Application Link Sent': { color: 'bg-green-100 text-green-800', label: 'Link Sent' },
      'Under DD Review': { color: 'bg-orange-100 text-orange-800', label: 'Under DD Review' },
      'Pending Review Director': { color: 'bg-purple-100 text-purple-800', label: 'Pending Director' },
      'Under Review Director': { color: 'bg-orange-100 text-orange-800', label: 'Under Director Review' },
      'Pending CEO Approval': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending CEO' },
      'Under CEO Approval': { color: 'bg-orange-100 text-orange-800', label: 'Under CEO Approval' },
      'Approved': { color: 'bg-green-600 text-white', label: 'Approved' },
    };
    const config = statusConfig[status] || statusConfig['Draft'];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const canCompleteForm = () => {
    return selectedApplication?.status === 'Application Link Sent' && !selectedApplication?.completedForm;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">External Research Applications</h2>
          <p className="text-gray-600 mt-1">Create and manage your research applications</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setIsEditMode(false);
            setEditingApplication(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Application' : 'Create New Application'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <div>
                  <Label>Application Title *</Label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter application title"
                    required
                  />
                </div>
                <div>
                  <Label>Description *</Label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your research application"
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Research Purpose */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Research Purpose</h3>
                <div>
                  <Label>Problem Statement</Label>
                  <Textarea
                    name="problemStatement"
                    value={formData.problemStatement}
                    onChange={handleInputChange}
                    placeholder="What problem does this research address?"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Research Question</Label>
                  <Textarea
                    name="researchQuestion"
                    value={formData.researchQuestion}
                    onChange={handleInputChange}
                    placeholder="What is the main research question?"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Expected Outcomes</Label>
                  <Textarea
                    name="expectedOutcomes"
                    value={formData.expectedOutcomes}
                    onChange={handleInputChange}
                    placeholder="What outcomes do you expect?"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Methodology</Label>
                  <Textarea
                    name="methodology"
                    value={formData.methodology}
                    onChange={handleInputChange}
                    placeholder="Describe your research methodology"
                    rows={3}
                  />
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  <Button variant="outline" type="button">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
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
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline" onClick={() => {
                  setIsFormOpen(false);
                  setIsEditMode(false);
                  setEditingApplication(null);
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
                      Submit
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" onClick={handleSaveDraft}>
                      Save as Draft
                    </Button>
                    <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                      Submit Application
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Date Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {externalApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No applications yet. Click "New Application" to create one.
                </TableCell>
              </TableRow>
            ) : (
              externalApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.applicationId}</TableCell>
                  <TableCell>{app.title}</TableCell>
                  <TableCell>{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => viewApplication(app)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      {app.status === 'Draft' && (
                        <Button variant="ghost" size="sm" onClick={() => handleEditApplication(app)}>
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

      {/* View Application Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="application">Application Details</TabsTrigger>
                <TabsTrigger value="link">Link Generation</TabsTrigger>
              </TabsList>
              
              {/* Tab 1: Application Details */}
              <TabsContent value="application" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Application ID</Label><p className="font-medium">{selectedApplication.applicationId}</p></div>
                    <div><Label className="text-sm text-gray-500">Title</Label><p className="font-medium">{selectedApplication.title}</p></div>
                    <div><Label className="text-sm text-gray-500">Status</Label><p className="font-medium">{selectedApplication.status}</p></div>
                    <div><Label className="text-sm text-gray-500">Submitted Date</Label><p className="font-medium">{selectedApplication.submittedAt ? new Date(selectedApplication.submittedAt).toLocaleString() : 'Not submitted'}</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Description</h3>
                  <div className="bg-gray-50 p-4 rounded-lg"><p>{selectedApplication.description}</p></div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Research Purpose</h3>
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Problem Statement</Label><p className="mt-1">{selectedApplication.researchPurpose.problemStatement}</p></div>
                    <div><Label className="text-sm text-gray-500">Research Question</Label><p className="mt-1">{selectedApplication.researchPurpose.researchQuestion}</p></div>
                    <div><Label className="text-sm text-gray-500">Expected Outcomes</Label><p className="mt-1">{selectedApplication.researchPurpose.expectedOutcomes}</p></div>
                    <div><Label className="text-sm text-gray-500">Methodology</Label><p className="mt-1">{selectedApplication.researchPurpose.methodology}</p></div>
                  </div>
                </div>

                {selectedApplication.attachments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      {selectedApplication.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <a href={attachment.url} target="_blank" className="text-blue-600 hover:underline">{attachment.name}</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApplication.status === 'Draft' && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleSubmitFromView} className="bg-green-600 hover:bg-green-700">
                      Submit Application
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 2: Link Generation */}
              <TabsContent value="link" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Application Form Link</h3>
                  
                  {selectedApplication.linkGenerated && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-800 font-medium">✓ Application Link Generated</p>
                      <a href={selectedApplication.linkGenerated.url} target="_blank" className="text-blue-600 hover:underline block mt-2">
                        {selectedApplication.linkGenerated.url}
                      </a>
                      <p className="text-xs text-gray-500 mt-2">
                        Generated: {new Date(selectedApplication.linkGenerated.generatedAt).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Expires: {new Date(selectedApplication.linkGenerated.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  {selectedApplication.completedForm && (
                    <div className="bg-green-50 p-4 rounded-lg mt-4">
                      <p className="text-green-800 font-medium">✓ Completed Form Submitted</p>
                      <a href={selectedApplication.completedForm.documentUrl} target="_blank" className="text-blue-600 hover:underline block mt-2">
                        View Submitted Form
                      </a>
                      <p className="text-xs text-gray-500 mt-2">
                        Submitted: {new Date(selectedApplication.completedForm.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  {canCompleteForm() && (
                    <div className="space-y-4 mt-4">
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-yellow-800 font-medium">Application Link Received</p>
                        <p className="text-sm text-gray-600">Please complete the application form below.</p>
                      </div>
                      
                      <div>
                        <Label>Upload Completed Application Form *</Label>
                        <Input
                          type="file"
                          onChange={(e) => setCompletedFormFile(e.target.files?.[0] || null)}
                          className="mt-1"
                          accept=".pdf,.doc,.docx"
                        />
                      </div>
                      
                      <div>
                        <Label>Additional Notes</Label>
                        <Textarea
                          value={additionalFormNotes}
                          onChange={(e) => setAdditionalFormNotes(e.target.value)}
                          placeholder="Any additional information about your submission..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleCompleteAndSubmitForm}
                        disabled={!completedFormFile}
                        className="bg-green-600 hover:bg-green-700 w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Completed Form
                      </Button>
                    </div>
                  )}
                  
                  {!selectedApplication.linkGenerated && selectedApplication.status !== 'Application Link Sent' && selectedApplication.status !== 'Under DD Review' && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-yellow-800 font-medium">Awaiting Link Generation</p>
                      <p className="text-sm text-gray-600">The application is being processed. You will receive a link to complete the application form once the Deputy Director generates it.</p>
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

export default ExternalResearchApplicationsPortal;