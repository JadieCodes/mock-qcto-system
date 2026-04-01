import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { Eye, FileText, CheckCircle, XCircle, Clock, User, Send ,Users,ClipboardList,Calendar} from 'lucide-react';
import type { LearnerEnrolment, LearnerEnrolmentStatus } from '@/types';

// Validation Checklist Interface
interface ValidationItem {
  id: string;
  criteria: string;
  isValid: boolean;
  comments: string;
}

const SkillsProgrammeIntake = () => {
  const { currentUser, enrolments, updateEnrolment } = useApp();
  const [selectedEnrolment, setSelectedEnrolment] = useState<LearnerEnrolment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [validationChecklist, setValidationChecklist] = useState<ValidationItem[]>([
    { id: '1', criteria: 'Type of spreadsheet', isValid: false, comments: '' },
    { id: '2', criteria: 'Spreadsheet completion', isValid: false, comments: '' },
    { id: '3', criteria: 'One skills programme per sheet', isValid: false, comments: '' },
    { id: '4', criteria: 'Completed from A - AK', isValid: false, comments: '' },
    { id: '5', criteria: 'Accuracy of learner data', isValid: false, comments: '' },
    { id: '6', criteria: 'Signoff page completed', isValid: false, comments: '' },
    { id: '7', criteria: 'Verify number of learners captured vs. ID copies', isValid: false, comments: '' },
  ]);
  const [validationNotes, setValidationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter enrolments ready for QA SP validation
  const pendingValidation = enrolments.filter(e => 
    e.status === 'SDP Gate Check Completed'
  );

  useEffect(() => {
    console.log('Pending validation enrolments:', pendingValidation);
  }, [pendingValidation]);

  const viewEnrolment = (enrolment: LearnerEnrolment) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
    setValidationChecklist(validationChecklist.map(item => ({ ...item, isValid: false, comments: '' })));
    setValidationNotes('');
  };

  const handleValidate = (isValid: boolean) => {
    if (!selectedEnrolment) return;
    
    setIsSubmitting(true);
    
    const metCount = validationChecklist.filter(item => item.isValid).length;
    const totalCount = validationChecklist.length;
    const allValid = metCount === totalCount;
    
    // Generate validation report
    const reportData = {
      enrolmentId: selectedEnrolment.enrolmentId,
      validationDate: new Date().toISOString(),
      checklist: validationChecklist,
      validatedBy: currentUser.name,
      isValid: allValid && isValid,
      notes: validationNotes,
    };
    
    const reportBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const reportUrl = URL.createObjectURL(reportBlob);
    
    updateEnrolment(selectedEnrolment.id, {
      indicatorChampionReview: {
        reviewedBy: currentUser.name,
        reviewedAt: new Date().toISOString(),
        checklist: validationChecklist.map(item => ({
          criteriaId: item.id,
          criteriaName: item.criteria,
          isMet: item.isValid,
          comments: item.comments,
        })),
        decision: allValid && isValid ? 'approved' : 'rejected',
        comments: validationNotes,
        confirmationLetterUrl: reportUrl,
        sentAt: new Date().toISOString(),
      },
      status: allValid && isValid ? 'QA SP Validated' as LearnerEnrolmentStatus : 'Rejected' as LearnerEnrolmentStatus
    });
    
    setIsSubmitting(false);
    setIsViewModalOpen(false);
  };

  const handleSubmitToAllocation = () => {
    if (!selectedEnrolment) return;
    
    updateEnrolment(selectedEnrolment.id, {
      status: 'Ready for Allocation' as LearnerEnrolmentStatus
    });
    
    setIsViewModalOpen(false);
  };

 const getStatusBadge = (status: LearnerEnrolmentStatus) => {
  const statusConfig: Record<LearnerEnrolmentStatus, { color: string; icon: React.ReactNode; label: string }> = {
    'Draft': { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Draft' },
    'Submitted': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Submitted' },
    'Gate Evaluation Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Gate Evaluation Pending' },
    'Gate Evaluation In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Gate Evaluation In Progress' },
    'Gate Evaluation Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Gate Completed' },
    'SDP Gate Check Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'SDP Gate Check Pending' },
    'SDP Gate Check Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Gate Check Completed' },
    'Pending QA SP Validation': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending QA SP Validation' },
    'Under QA SP Validation': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under QA SP Validation' },
    'QA SP Validated': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'QA SP Validated' },
    'Ready for Allocation': { color: 'bg-purple-100 text-purple-800', icon: <User className="h-3 w-3 mr-1" />, label: 'Ready for Allocation' },
    'Pending Indicator Champion Review': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Review' },
    'Under Indicator Champion Review': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Review' },
    'Approved': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Approved' },
    'Allocated to QA': { color: 'bg-purple-100 text-purple-800', icon: <User className="h-3 w-3 mr-1" />, label: 'Allocated to QA' },
    'Pending QP Allocation': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending QP Allocation' },
    'Allocated to QP': { color: 'bg-blue-100 text-blue-800', icon: <User className="h-3 w-3 mr-1" />, label: 'Allocated to QP' },
    'Plans & Reports Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Plans Pending' },
    'Plans & Reports Submitted': { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Plans Submitted' },
    'Plans Consolidated': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Plans Consolidated' },
    'Site Visit Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Site Visit Pending' },
    'Site Visit Scheduled': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Site Visit Scheduled' },
    'Site Visit Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Site Visit Completed' },
    // Add these to the statusConfig object in each component:
'Pending Quarterly Allocation': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Quarterly Allocation' },
'Quarterly Allocation In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Allocation In Progress' },
'Allocation Populated': { color: 'bg-blue-100 text-blue-800', icon: <Users className="h-3 w-3 mr-1" />, label: 'Allocation Populated' },
'Allocated for Monitoring': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Allocated for Monitoring' },
'Monitoring Plan Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Monitoring Plan Pending' },
'Monitoring Plan Submitted': { color: 'bg-blue-100 text-blue-800', icon: <ClipboardList className="h-3 w-3 mr-1" />, label: 'Monitoring Plan Submitted' },
'SDP Evidence Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'SDP Evidence Pending' },
'SDP Evidence Submitted': { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'SDP Evidence Submitted' },
'Monitoring Report Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Monitoring Report Pending' },
'Monitoring Report Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Monitoring Report Completed' },
'Quarterly Report Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Quarterly Report Pending' },
'Quarterly Report Submitted': { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Quarterly Report Submitted' },
'Pending Verification': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Verification' },
'Under Verification': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Verification' },
'Verified': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Verified' },
'Pending Monthly Update': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Monthly Update' },
'Monthly Update In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Monthly Update In Progress' },
'Monthly Update Submitted': { color: 'bg-blue-100 text-blue-800', icon: <Calendar className="h-3 w-3 mr-1" />, label: 'Monthly Update Submitted' },
'Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Completed' },
  };
  const config = statusConfig[status] || statusConfig['SDP Gate Check Completed'];
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

  const canValidate = () => {
    return currentUser.role === 'QA SP Team' && 
           selectedEnrolment?.status === 'SDP Gate Check Completed';
  };

  const canSubmitToAllocation = () => {
    return currentUser.role === 'QA SP Team' && 
           selectedEnrolment?.status === 'QA SP Validated';
  };

  const safeFormatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Skills Programme Intake</h3>
      <p className="text-gray-600">Validate learner enrolment reports and data from SDPs</p>
      
      {pendingValidation.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Pending Validation</h4>
            <p className="text-sm text-gray-500">Learner enrolments ready for QA SP Team validation</p>
          </div>
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
              {pendingValidation.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{`${enrolment.learnerDetails.firstName} ${enrolment.learnerDetails.lastName}`}</TableCell>
                  <TableCell>{enrolment.qualification.name}</TableCell>
                  <TableCell>{safeFormatDate(enrolment.submittedAt)}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Validate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No pending enrolments for validation.
        </div>
      )}

      {/* Validation Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Learner Enrolment Validation</DialogTitle>
          </DialogHeader>
          
          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Enrolment Details</TabsTrigger>
                <TabsTrigger value="gateEvaluation">Gate Evaluation Results</TabsTrigger>
                <TabsTrigger value="validation">Validation</TabsTrigger>
              </TabsList>
              
              {/* Tab 1: Enrolment Details */}
              <TabsContent value="details" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Learner Information</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Name</Label><p className="font-medium">{`${selectedEnrolment.learnerDetails.firstName} ${selectedEnrolment.learnerDetails.lastName}`}</p></div>
                    <div><Label className="text-sm text-gray-500">ID Number</Label><p className="font-medium">{selectedEnrolment.learnerDetails.idNumber}</p></div>
                    <div><Label className="text-sm text-gray-500">Email</Label><p className="font-medium">{selectedEnrolment.learnerDetails.email}</p></div>
                    <div><Label className="text-sm text-gray-500">Phone</Label><p className="font-medium">{selectedEnrolment.learnerDetails.phone}</p></div>
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
              
              {/* Tab 2: Gate Evaluation Results */}
              <TabsContent value="gateEvaluation" className="space-y-6 py-4">
                {selectedEnrolment.gateEvaluation && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${selectedEnrolment.gateEvaluation.status === 'passed' ? 'bg-green-50' : 'bg-red-50'}`}>
                      <p className={`font-medium ${selectedEnrolment.gateEvaluation.status === 'passed' ? 'text-green-800' : 'text-red-800'}`}>
                        {selectedEnrolment.gateEvaluation.status === 'passed' ? '✓ Gate Evaluation Passed' : '✗ Gate Evaluation Failed'}
                      </p>
                      {selectedEnrolment.gateEvaluation.reportUrl && (
                        <a href={selectedEnrolment.gateEvaluation.reportUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                          <FileText className="h-4 w-4" />
                          View Gate Evaluation Report
                        </a>
                      )}
                      <p className="text-xs text-gray-500 mt-2">Evaluated on: {safeFormatDate(selectedEnrolment.gateEvaluation.generatedAt)}</p>
                    </div>
                    
                    {selectedEnrolment.gateEvaluation.checklistResults && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Gate Evaluation Checklist Results</h4>
                        {selectedEnrolment.gateEvaluation.checklistResults.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            {item.isMet ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                            <span>{item.criteria}</span>
                            {item.comments && <span className="text-gray-500 text-xs ml-2">({item.comments})</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 3: Validation */}
              <TabsContent value="validation" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Learner Enrolment Data Validation</h3>
                  <p className="text-sm text-gray-600">
                    Validate the learner enrolment data against the required criteria.
                  </p>
                  
                  {canValidate() && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {validationChecklist.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className="flex gap-2">
                              <Button
                                variant={item.isValid === true ? 'default' : 'outline'}
                                onClick={() => setValidationChecklist(prev => prev.map(i => 
                                  i.id === item.id ? { ...i, isValid: true } : i
                                ))}
                                className={`h-8 px-3 ${item.isValid === true ? 'bg-green-600' : ''}`}
                              >
                                Yes
                              </Button>
                              <Button
                                variant={item.isValid === false ? 'default' : 'outline'}
                                onClick={() => setValidationChecklist(prev => prev.map(i => 
                                  i.id === item.id ? { ...i, isValid: false } : i
                                ))}
                                className={`h-8 px-3 ${item.isValid === false ? 'bg-red-600' : ''}`}
                              >
                                No
                              </Button>
                            </div>
                            <div className="flex-1">
                              <Label className="font-medium">{item.criteria}</Label>
                              <Textarea
                                placeholder="Add comments..."
                                value={item.comments}
                                onChange={(e) => setValidationChecklist(prev => prev.map(i => 
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
                        <Label>Validation Notes</Label>
                        <Textarea
                          value={validationNotes}
                          onChange={(e) => setValidationNotes(e.target.value)}
                          placeholder="Add overall validation notes..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex gap-4">
                        <Button 
                          onClick={() => handleValidate(false)}
                          disabled={isSubmitting}
                          className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button 
                          onClick={() => handleValidate(true)}
                          disabled={isSubmitting}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {canSubmitToAllocation() && (
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-green-800 font-medium">✓ Enrolment Validated</p>
                        <p className="text-sm text-gray-600 mt-2">This enrolment is ready for allocation to the Quality Assurance team.</p>
                      </div>
                      <Button 
                        onClick={handleSubmitToAllocation}
                        className="bg-purple-600 hover:bg-purple-700 w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit to Allocation
                      </Button>
                    </div>
                  )}
                  
                  {selectedEnrolment.indicatorChampionReview?.decision === 'approved' && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-800 font-medium">✓ Enrolment Validated by QA SP Team</p>
                      <p className="text-sm text-gray-600">Validated by: {selectedEnrolment.indicatorChampionReview.reviewedBy}</p>
                      <p className="text-xs text-gray-500">Validated on: {safeFormatDate(selectedEnrolment.indicatorChampionReview.reviewedAt)}</p>
                      {selectedEnrolment.indicatorChampionReview.confirmationLetterUrl && (
                        <a href={selectedEnrolment.indicatorChampionReview.confirmationLetterUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                          <FileText className="h-4 w-4" />
                          View Validation Report
                        </a>
                      )}
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

export default SkillsProgrammeIntake;