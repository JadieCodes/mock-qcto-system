// screens/ExternalLearnerEnrolment.tsx
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
import { Plus, Eye, Upload, FileText, Edit, Play, CheckCircle, XCircle,Users,Clock } from 'lucide-react';
import type { LearnerEnrolment, LearnerEnrolmentStatus } from '@/types';

const ExternalLearnerEnrolment = () => {
  const { currentUser, addEnrolment, updateEnrolment, enrolments } = useApp(); // Remove setEnrolments from local
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEnrolment, setSelectedEnrolment] = useState<LearnerEnrolment | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEnrolment, setEditingEnrolment] = useState<LearnerEnrolment | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    idNumber: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    qualificationName: '',
    qualificationCode: '',
    nqfLevel: '',
    credits: '',
    startDate: '',
    endDate: '',
    learningProgramme: '',
    deliveryMode: '',
  });

  const generateEnrolmentId = () => {
    return `ENR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      idNumber: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      qualificationName: '',
      qualificationCode: '',
      nqfLevel: '',
      credits: '',
      startDate: '',
      endDate: '',
      learningProgramme: '',
      deliveryMode: '',
    });
    setDocuments([]);
  };

 const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSaveDraft = () => {
    addEnrolment({
      learnerDetails: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        idNumber: formData.idNumber,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
      },
      qualification: {
        name: formData.qualificationName,
        code: formData.qualificationCode,
        nqfLevel: formData.nqfLevel,
        credits: parseInt(formData.credits) || 0,
      },
      enrolmentDetails: {
        startDate: formData.startDate,
        endDate: formData.endDate,
        learningProgramme: formData.learningProgramme,
        deliveryMode: formData.deliveryMode,
      },
      supportingDocuments: documents.map(file => ({
        id: Math.random().toString(),
        name: file.name,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      })),
      status: 'Draft' as LearnerEnrolmentStatus,
      submittedBy: currentUser.name,
      submittedAt: '',
    });
    resetForm();
    setIsFormOpen(false);
  };

  const handleSubmit = () => {
    addEnrolment({
      learnerDetails: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        idNumber: formData.idNumber,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
      },
      qualification: {
        name: formData.qualificationName,
        code: formData.qualificationCode,
        nqfLevel: formData.nqfLevel,
        credits: parseInt(formData.credits) || 0,
      },
      enrolmentDetails: {
        startDate: formData.startDate,
        endDate: formData.endDate,
        learningProgramme: formData.learningProgramme,
        deliveryMode: formData.deliveryMode,
      },
      supportingDocuments: documents.map(file => ({
        id: Math.random().toString(),
        name: file.name,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      })),
      status: 'Submitted' as LearnerEnrolmentStatus,
      submittedBy: currentUser.name,
      submittedAt: new Date().toISOString(),
    });
    resetForm();
    setIsFormOpen(false);
  };

  const handleStartGateEvaluation = () => {
    if (!selectedEnrolment) return;
    
    updateEnrolment(selectedEnrolment.id, {
      gateEvaluation: {
        status: 'passed',
        reportUrl: URL.createObjectURL(new Blob(['Draft Learner Enrolment Report'], { type: 'application/pdf' })),
        generatedAt: new Date().toISOString(),
        checklistResults: [
          { criteria: 'ID Document Valid', isMet: true },
          { criteria: 'Qualification Valid', isMet: true },
          { criteria: 'Learner Age', isMet: true },
          { criteria: 'Pre-requisites Met', isMet: true },
        ]
      },
      status: 'Gate Evaluation Completed' as LearnerEnrolmentStatus
    });
  };

  const viewEnrolment = (enrolment: LearnerEnrolment) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
  };

 // Update the getStatusBadge function to include ALL statuses
const getStatusBadge = (status: LearnerEnrolmentStatus) => {
  const statusConfig: Record<LearnerEnrolmentStatus, { color: string; label: string }> = {
    'Draft': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
    'Submitted': { color: 'bg-yellow-100 text-yellow-800', label: 'Submitted' },
    'Gate Evaluation Pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Gate Evaluation Pending' },
    'Gate Evaluation In Progress': { color: 'bg-blue-100 text-blue-800', label: 'Gate Evaluation In Progress' },
    'Gate Evaluation Completed': { color: 'bg-green-100 text-green-800', label: 'Gate Evaluation Completed' },
    'Pending Indicator Champion Review': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
    'Under Indicator Champion Review': { color: 'bg-blue-100 text-blue-800', label: 'Under Review' },
    'Approved': { color: 'bg-green-100 text-green-800', label: 'Approved' },
    'Allocated to QA': { color: 'bg-purple-100 text-purple-800', label: 'Allocated to QA' },
    'Pending QP Allocation': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending QP Allocation' },
    'Allocated to QP': { color: 'bg-blue-100 text-blue-800', label: 'Allocated to QP' },
    'Plans & Reports Pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Plans Pending' },
    'Plans & Reports Submitted': { color: 'bg-blue-100 text-blue-800', label: 'Plans Submitted' },
    'Plans Consolidated': { color: 'bg-green-100 text-green-800', label: 'Plans Consolidated' },
    'Site Visit Pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Site Visit Pending' },
    'Site Visit Scheduled': { color: 'bg-blue-100 text-blue-800', label: 'Site Visit Scheduled' },
    'Site Visit Completed': { color: 'bg-green-100 text-green-800', label: 'Site Visit Completed' },
    'SDP Gate Check Pending': { color: 'bg-yellow-100 text-yellow-800', label: 'SDP Gate Check Pending' },
    'SDP Gate Check Completed': { color: 'bg-green-100 text-green-800', label: 'Gate Check Completed' },
    'Pending QA SP Validation': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending QA SP Validation' },
    'Under QA SP Validation': { color: 'bg-blue-100 text-blue-800', label: 'Under QA SP Validation' },
    'QA SP Validated': { color: 'bg-green-100 text-green-800', label: 'QA SP Validated' },
    'Ready for Allocation': { color: 'bg-purple-100 text-purple-800', label: 'Ready for Allocation' },
    // Quarterly allocation statuses - without icons since this component doesn't use them
    'Pending Quarterly Allocation': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Quarterly Allocation' },
    'Quarterly Allocation In Progress': { color: 'bg-blue-100 text-blue-800', label: 'Allocation In Progress' },
    'Allocation Populated': { color: 'bg-blue-100 text-blue-800', label: 'Allocation Populated' },
    'Allocated for Monitoring': { color: 'bg-green-100 text-green-800', label: 'Allocated for Monitoring' },
    'Monitoring Plan Pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Monitoring Plan Pending' },
'Monitoring Plan Submitted': { color: 'bg-blue-100 text-blue-800', label: 'Monitoring Plan Submitted' },
'SDP Evidence Pending': { color: 'bg-yellow-100 text-yellow-800', label: 'SDP Evidence Pending' },
'SDP Evidence Submitted': { color: 'bg-blue-100 text-blue-800', label: 'SDP Evidence Submitted' },
'Monitoring Report Pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Monitoring Report Pending' },
'Monitoring Report Completed': { color: 'bg-green-100 text-green-800', label: 'Monitoring Report Completed' },
'Quarterly Report Pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Quarterly Report Pending' },
'Quarterly Report Submitted': { color: 'bg-blue-100 text-blue-800', label: 'Quarterly Report Submitted' },
'Pending Verification': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Verification' },
'Under Verification': { color: 'bg-blue-100 text-blue-800', label: 'Under Verification' },
'Verified': { color: 'bg-green-100 text-green-800', label: 'Verified' },
'Pending Monthly Update': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Monthly Update' },
'Monthly Update In Progress': { color: 'bg-blue-100 text-blue-800', label: 'Monthly Update In Progress' },
'Monthly Update Submitted': { color: 'bg-blue-100 text-blue-800', label: 'Monthly Update Submitted' },
'Completed': { color: 'bg-green-100 text-green-800', label: 'Completed' },
  };
  const config = statusConfig[status] || statusConfig['Draft'];
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Learner Enrolment</h2>
          <p className="text-gray-600 mt-1">Submit learner enrolment applications</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setIsEditMode(false);
            setEditingEnrolment(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Learner Enrolment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Learner Enrolment</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Learner Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Learner Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>First Name *</Label><Input name="firstName" value={formData.firstName} onChange={handleInputChange} required /></div>
                  <div><Label>Last Name *</Label><Input name="lastName" value={formData.lastName} onChange={handleInputChange} required /></div>
                  <div><Label>ID Number *</Label><Input name="idNumber" value={formData.idNumber} onChange={handleInputChange} required /></div>
                  <div><Label>Email *</Label><Input type="email" name="email" value={formData.email} onChange={handleInputChange} required /></div>
                  <div><Label>Phone *</Label><Input name="phone" value={formData.phone} onChange={handleInputChange} required /></div>
                  <div><Label>Date of Birth *</Label><Input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} required /></div>
                </div>
              </div>

              {/* Qualification Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Qualification Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Qualification Name *</Label><Input name="qualificationName" value={formData.qualificationName} onChange={handleInputChange} required /></div>
                  <div><Label>Qualification Code</Label><Input name="qualificationCode" value={formData.qualificationCode} onChange={handleInputChange} /></div>
                  <div><Label>NQF Level</Label><Input name="nqfLevel" value={formData.nqfLevel} onChange={handleInputChange} /></div>
                  <div><Label>Credits</Label><Input type="number" name="credits" value={formData.credits} onChange={handleInputChange} /></div>
                </div>
              </div>

              {/* Enrolment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Enrolment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Start Date *</Label><Input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} required /></div>
                  <div><Label>End Date *</Label><Input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required /></div>
                  <div><Label>Learning Programme</Label><Input name="learningProgramme" value={formData.learningProgramme} onChange={handleInputChange} /></div>
                  <div><Label>Delivery Mode</Label>
                    <select name="deliveryMode" value={formData.deliveryMode} onChange={handleInputChange} className="w-full p-2 border rounded-md">
                      <option value="">Select delivery mode</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Online">Online</option>
                      <option value="Blended">Blended</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Supporting Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Supporting Documents</h3>
                <div className="flex items-center gap-4">
                  <Input type="file" multiple onChange={handleFileUpload} className="flex-1" />
                  <Button variant="outline" type="button"><Upload className="h-4 w-4 mr-2" />Upload</Button>
                </div>
                {documents.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files:</Label>
                    {documents.map((file, index) => (
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
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button variant="secondary" onClick={handleSaveDraft}>Save as Draft</Button>
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">Submit Enrolment</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enrolments Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Enrolment ID</TableHead>
              <TableHead>Learner Name</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>Submitted Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrolments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No enrolments yet. Click "Create Learner Enrolment" to create one.
                </TableCell>
              </TableRow>
            ) : (
              enrolments.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{`${enrolment.learnerDetails.firstName} ${enrolment.learnerDetails.lastName}`}</TableCell>
                  <TableCell>{enrolment.qualification.name}</TableCell>
                  <TableCell>{enrolment.submittedAt ? new Date(enrolment.submittedAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Enrolment Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Learner Enrolment Details</DialogTitle>
          </DialogHeader>
          
          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Learner Enrolment Details</TabsTrigger>
                <TabsTrigger value="gateEvaluation">Gate Evaluation Check</TabsTrigger>
              </TabsList>
              
              {/* Tab 1: Learner Enrolment Details */}
              <TabsContent value="details" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Learner Information</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Name</Label><p className="font-medium">{`${selectedEnrolment.learnerDetails.firstName} ${selectedEnrolment.learnerDetails.lastName}`}</p></div>
                    <div><Label className="text-sm text-gray-500">ID Number</Label><p className="font-medium">{selectedEnrolment.learnerDetails.idNumber}</p></div>
                    <div><Label className="text-sm text-gray-500">Email</Label><p className="font-medium">{selectedEnrolment.learnerDetails.email}</p></div>
                    <div><Label className="text-sm text-gray-500">Phone</Label><p className="font-medium">{selectedEnrolment.learnerDetails.phone}</p></div>
                    <div><Label className="text-sm text-gray-500">Date of Birth</Label><p className="font-medium">{new Date(selectedEnrolment.learnerDetails.dateOfBirth).toLocaleDateString()}</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Qualification Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Qualification Name</Label><p className="font-medium">{selectedEnrolment.qualification.name}</p></div>
                    <div><Label className="text-sm text-gray-500">Code</Label><p className="font-medium">{selectedEnrolment.qualification.code}</p></div>
                    <div><Label className="text-sm text-gray-500">NQF Level</Label><p className="font-medium">{selectedEnrolment.qualification.nqfLevel}</p></div>
                    <div><Label className="text-sm text-gray-500">Credits</Label><p className="font-medium">{selectedEnrolment.qualification.credits}</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Enrolment Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Start Date</Label><p className="font-medium">{new Date(selectedEnrolment.enrolmentDetails.startDate).toLocaleDateString()}</p></div>
                    <div><Label className="text-sm text-gray-500">End Date</Label><p className="font-medium">{new Date(selectedEnrolment.enrolmentDetails.endDate).toLocaleDateString()}</p></div>
                    <div><Label className="text-sm text-gray-500">Learning Programme</Label><p className="font-medium">{selectedEnrolment.enrolmentDetails.learningProgramme}</p></div>
                    <div><Label className="text-sm text-gray-500">Delivery Mode</Label><p className="font-medium">{selectedEnrolment.enrolmentDetails.deliveryMode}</p></div>
                  </div>
                </div>

                {selectedEnrolment.supportingDocuments.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Supporting Documents</h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                      {selectedEnrolment.supportingDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <a href={doc.url} target="_blank" className="text-blue-600 hover:underline">{doc.name}</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 2: Gate Evaluation Check */}
              <TabsContent value="gateEvaluation" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Gate Evaluation Check</h3>
                  
                  {!selectedEnrolment.gateEvaluation && selectedEnrolment.status === 'Submitted' && (
                    <div className="space-y-4">
                      <Button onClick={handleStartGateEvaluation} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Gate Evaluation Check
                      </Button>
                      <p className="text-sm text-gray-500">This will check learner data against load specification guidelines and generate a draft Learner Enrolment report.</p>
                    </div>
                  )}
                  
                  {selectedEnrolment.gateEvaluation && (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg ${selectedEnrolment.gateEvaluation.status === 'passed' ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`font-medium ${selectedEnrolment.gateEvaluation.status === 'passed' ? 'text-green-800' : 'text-red-800'}`}>
                          {selectedEnrolment.gateEvaluation.status === 'passed' ? '✓ Gate Evaluation Passed' : '✗ Gate Evaluation Failed'}
                        </p>
                        {selectedEnrolment.gateEvaluation.reportUrl && (
                          <a href={selectedEnrolment.gateEvaluation.reportUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                            <FileText className="h-4 w-4" />
                            View Draft Learner Enrolment Report
                          </a>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Generated: {new Date(selectedEnrolment.gateEvaluation.generatedAt || '').toLocaleString()}</p>
                      </div>
                      
                      {selectedEnrolment.gateEvaluation.checklistResults && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Checklist Results</h4>
                          {selectedEnrolment.gateEvaluation.checklistResults.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              {item.isMet ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                              <span>{item.criteria}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedEnrolment.status === 'Pending Indicator Champion Review' && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-yellow-800 font-medium">✓ Gate Evaluation Completed</p>
                      <p className="text-sm text-gray-600">This enrolment has been sent to the Indicator Champion for review.</p>
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

export default ExternalLearnerEnrolment;