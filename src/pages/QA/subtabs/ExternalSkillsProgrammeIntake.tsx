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
import { Plus, Eye, Upload, FileText, Play, CheckCircle, XCircle } from 'lucide-react';
import type { LearnerEnrolment, LearnerEnrolmentStatus } from '@/types';

// Gate Evaluation Checklist Interface
interface GateChecklistItem {
  id: string;
  criteria: string;
  isMet: boolean;
  comments: string;
}

const ExternalSkillsProgrammeIntake = () => {
  const { currentUser, addEnrolment, updateEnrolment, enrolments } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEnrolment, setSelectedEnrolment] = useState<LearnerEnrolment | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState('details');

  // Gate evaluation state
  const [gateChecklist, setGateChecklist] = useState<GateChecklistItem[]>([
    { id: '1', criteria: 'Type of spreadsheet', isMet: false, comments: '' },
    { id: '2', criteria: 'Spreadsheet completion', isMet: false, comments: '' },
    { id: '3', criteria: 'One skills programme per sheet', isMet: false, comments: '' },
    { id: '4', criteria: 'Completed from A - AK', isMet: false, comments: '' },
    { id: '5', criteria: 'Accuracy of learner data', isMet: false, comments: '' },
    { id: '6', criteria: 'Signoff page completed', isMet: false, comments: '' },
    { id: '7', criteria: 'Verify number of learners captured vs. ID copies', isMet: false, comments: '' },
  ]);
  const [gateEvaluationNotes, setGateEvaluationNotes] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
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

  const handleGateEvaluation = () => {
    if (!selectedEnrolment) return;
    
    setIsEvaluating(true);
    
    const metCount = gateChecklist.filter(item => item.isMet).length;
    const totalCount = gateChecklist.length;
    const passed = metCount === totalCount;
    
    // Generate gate evaluation report
    const reportData = {
      enrolmentId: selectedEnrolment.enrolmentId,
      evaluationDate: new Date().toISOString(),
      checklist: gateChecklist,
      passed,
      notes: gateEvaluationNotes,
      complianceScore: (metCount / totalCount) * 100,
    };
    
    const reportBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const reportUrl = URL.createObjectURL(reportBlob);
    
    updateEnrolment(selectedEnrolment.id, {
      gateEvaluation: {
        status: passed ? 'passed' : 'failed',
        reportUrl: reportUrl,
        generatedAt: new Date().toISOString(),
        checklistResults: gateChecklist.map(item => ({
          criteria: item.criteria,
          isMet: item.isMet,
          comments: item.comments,
        })),
      },
      status: passed ? 'SDP Gate Check Completed' as LearnerEnrolmentStatus : 'Gate Evaluation Failed' as LearnerEnrolmentStatus
    });
    
    setIsEvaluating(false);
    setIsViewModalOpen(false);
  };

  const viewEnrolment = (enrolment: LearnerEnrolment) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
    // Reset gate checklist
    setGateChecklist(gateChecklist.map(item => ({ ...item, isMet: false, comments: '' })));
    setGateEvaluationNotes('');
  };

 const getStatusBadge = (status: LearnerEnrolmentStatus) => {
  const statusConfig: Record<LearnerEnrolmentStatus, { color: string; label: string }> = {
    'Draft': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
    'Submitted': { color: 'bg-yellow-100 text-yellow-800', label: 'Submitted' },
    'Gate Evaluation Pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Gate Evaluation Pending' },
    'Gate Evaluation In Progress': { color: 'bg-blue-100 text-blue-800', label: 'Gate Evaluation In Progress' },
    'Gate Evaluation Completed': { color: 'bg-green-100 text-green-800', label: 'Gate Evaluation Completed' },
    'SDP Gate Check Pending': { color: 'bg-yellow-100 text-yellow-800', label: 'SDP Gate Check Pending' },
    'SDP Gate Check Completed': { color: 'bg-green-100 text-green-800', label: 'Gate Check Completed' },
    'Pending QA SP Validation': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending QA SP Validation' },
    'Under QA SP Validation': { color: 'bg-blue-100 text-blue-800', label: 'Under QA SP Validation' },
    'QA SP Validated': { color: 'bg-green-100 text-green-800', label: 'QA SP Validated' },
    'Ready for Allocation': { color: 'bg-purple-100 text-purple-800', label: 'Ready for Allocation' },
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
// Add these to the statusConfig object
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
  const config = statusConfig[status] || statusConfig['Submitted'];
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

  const canRunGateEvaluation = () => {
    return selectedEnrolment?.status === 'Submitted' && currentUser.role === 'SDP';
  };

  const safeFormatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return '-';
    }
  };

  // Filter enrolments submitted by SDP
  const sdpEnrolments = enrolments.filter(e => e.submittedBy === currentUser.name && e.status !== 'Draft');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Skills Programme Intake</h2>
          <p className="text-gray-600 mt-1">Submit learner enrolments within 5 working days from training start date</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Learner Enrolment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submit Learner Enrolment</DialogTitle>
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
                <h3 className="text-lg font-semibold text-gray-900">Skills Programme Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Skills Programme Name *</Label><Input name="qualificationName" value={formData.qualificationName} onChange={handleInputChange} required /></div>
                  <div><Label>Programme Code</Label><Input name="qualificationCode" value={formData.qualificationCode} onChange={handleInputChange} /></div>
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
              <TableHead>Skills Programme</TableHead>
              <TableHead>Submitted Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sdpEnrolments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  No enrolments yet. Click "New Learner Enrolment" to create one.
                </TableCell>
              </TableRow>
            ) : (
              sdpEnrolments.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{`${enrolment.learnerDetails.firstName} ${enrolment.learnerDetails.lastName}`}</TableCell>
                  <TableCell>{enrolment.qualification.name}</TableCell>
                  <TableCell>{safeFormatDate(enrolment.submittedAt)}</TableCell>
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

      {/* View Enrolment Modal with SDP Gate Check Tab */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Learner Enrolment Details</DialogTitle>
          </DialogHeader>
          
          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Learner Enrolment Details</TabsTrigger>
                <TabsTrigger value="gateCheck">SDP Gate Check</TabsTrigger>
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
                    <div><Label className="text-sm text-gray-500">Date of Birth</Label><p className="font-medium">{safeFormatDate(selectedEnrolment.learnerDetails.dateOfBirth)}</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Skills Programme Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Programme Name</Label><p className="font-medium">{selectedEnrolment.qualification.name}</p></div>
                    <div><Label className="text-sm text-gray-500">Code</Label><p className="font-medium">{selectedEnrolment.qualification.code}</p></div>
                    <div><Label className="text-sm text-gray-500">NQF Level</Label><p className="font-medium">{selectedEnrolment.qualification.nqfLevel}</p></div>
                    <div><Label className="text-sm text-gray-500">Credits</Label><p className="font-medium">{selectedEnrolment.qualification.credits}</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Enrolment Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Start Date</Label><p className="font-medium">{safeFormatDate(selectedEnrolment.enrolmentDetails.startDate)}</p></div>
                    <div><Label className="text-sm text-gray-500">End Date</Label><p className="font-medium">{safeFormatDate(selectedEnrolment.enrolmentDetails.endDate)}</p></div>
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
              
              {/* Tab 2: SDP Gate Check */}
              <TabsContent value="gateCheck" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Learner Enrolment Gate Evaluation</h3>
                  <p className="text-sm text-gray-600">
                    The Learner Enrolment Gate Evaluation check will verify the learner data against the load specification guidelines 
                    and provide a draft Learner Enrolment report. This must be completed within 5 working days from the training start date.
                  </p>
                  
                  {selectedEnrolment.gateEvaluation ? (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium">✓ Gate Evaluation Completed</p>
                      {selectedEnrolment.gateEvaluation.reportUrl && (
                        <a href={selectedEnrolment.gateEvaluation.reportUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                          <FileText className="h-4 w-4" />
                          View Gate Evaluation Report
                        </a>
                      )}
                      <p className="text-xs text-gray-500 mt-2">Evaluated on: {safeFormatDate(selectedEnrolment.gateEvaluation.generatedAt)}</p>
                    </div>
                  ) : canRunGateEvaluation() ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-blue-800 font-medium">Gate Evaluation Checklist</p>
                        <p className="text-sm text-gray-600 mt-1">Verify the following learner data against the load specification guidelines:</p>
                      </div>
                      
                      <div className="space-y-3">
                        {gateChecklist.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <input
                              type="checkbox"
                              checked={item.isMet}
                              onChange={(e) => setGateChecklist(prev => prev.map(i => 
                                i.id === item.id ? { ...i, isMet: e.target.checked } : i
                              ))}
                              className="mt-1 h-4 w-4 rounded border-gray-300"
                            />
                            <div className="flex-1">
                              <Label className="font-medium">{item.criteria}</Label>
                              <Textarea
                                placeholder="Add comments..."
                                value={item.comments}
                                onChange={(e) => setGateChecklist(prev => prev.map(i => 
                                  i.id === item.id ? { ...i, comments: e.target.value } : i
                                ))}
                                rows={1}
                                className="mt-1 text-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div>
                        <Label>Overall Evaluation Notes</Label>
                        <Textarea
                          value={gateEvaluationNotes}
                          onChange={(e) => setGateEvaluationNotes(e.target.value)}
                          placeholder="Add any additional notes about the gate evaluation..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleGateEvaluation}
                        disabled={isEvaluating}
                        className="bg-blue-600 hover:bg-blue-700 w-full"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Run Gate Evaluation Check
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-yellow-800 font-medium">Gate Evaluation Status: {selectedEnrolment.status}</p>
                      <p className="text-sm text-gray-600 mt-1">This enrolment has been sent to the Quality Domain Dashboard for review.</p>
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

export default ExternalSkillsProgrammeIntake;