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
import { Eye, FileText, CheckCircle, Clock, User, Calendar, Send, Users,ClipboardList } from 'lucide-react';
import type { LearnerEnrolment, LearnerEnrolmentStatus } from '@/types';

const ReviewedSkillsProgrammes = () => {
  const { currentUser, enrolments, updateEnrolment } = useApp();
  const [selectedEnrolment, setSelectedEnrolment] = useState<LearnerEnrolment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Quarterly allocation state
  const [quarter, setQuarter] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');
  const [populatedData, setPopulatedData] = useState('');

  // Filter enrolments that are validated and ready for allocation
  const reviewedEnrolments = enrolments.filter(e => 
    e.status === 'QA SP Validated' || e.status === 'Ready for Allocation'
  );

  // For QA SP Team - enrolments pending population
  const pendingPopulation = enrolments.filter(e => 
    e.status === 'Pending Quarterly Allocation'
  );

  // For Indicator Champion - enrolments ready for confirmation
  const pendingConfirmation = enrolments.filter(e => 
    e.status === 'Allocation Populated'
  );

  useEffect(() => {
    console.log('Reviewed enrolments:', reviewedEnrolments);
    console.log('Pending population:', pendingPopulation);
    console.log('Pending confirmation:', pendingConfirmation);
  }, [reviewedEnrolments, pendingPopulation, pendingConfirmation]);

  const viewEnrolment = (enrolment: LearnerEnrolment) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
    setQuarter('');
    setAllocationNotes('');
    setPopulatedData('');
  };

  // Indicator Champion: Submit Quarterly Allocation
  const handleSubmitQuarterlyAllocation = () => {
    if (!selectedEnrolment || !quarter) return;
    
    setIsSubmitting(true);
    
    updateEnrolment(selectedEnrolment.id, {
      quarterlyAllocation: {
        quarter: quarter,
        allocatedBy: currentUser.name,
        allocatedAt: new Date().toISOString(),
        status: 'pending',
        notes: allocationNotes,
      },
      status: 'Pending Quarterly Allocation' as LearnerEnrolmentStatus
    });
    
    setIsSubmitting(false);
    setIsViewModalOpen(false);
  };

  // QA SP Team: Populate the allocations
  const handlePopulateAllocations = () => {
    if (!selectedEnrolment || !populatedData) return;
    
    setIsSubmitting(true);
    
    updateEnrolment(selectedEnrolment.id, {
      quarterlyAllocation: {
        ...selectedEnrolment.quarterlyAllocation,
        quarter: selectedEnrolment.quarterlyAllocation?.quarter || '',
        populatedBy: currentUser.name,
        populatedAt: new Date().toISOString(),
        populatedData: populatedData,
        status: 'populated',
      },
      status: 'Allocation Populated' as LearnerEnrolmentStatus
    });
    
    setIsSubmitting(false);
    setIsViewModalOpen(false);
  };

  // Indicator Champion: Confirm and allocate to QA Managers
  const handleConfirmAndAllocate = () => {
    if (!selectedEnrolment) return;
    
    setIsSubmitting(true);
    
    updateEnrolment(selectedEnrolment.id, {
      quarterlyAllocation: {
        ...selectedEnrolment.quarterlyAllocation,
        quarter: selectedEnrolment.quarterlyAllocation?.quarter || '',
        confirmedBy: currentUser.name,
        confirmedAt: new Date().toISOString(),
        status: 'confirmed',
      },
      status: 'Allocated for Monitoring' as LearnerEnrolmentStatus
    });
    
    setIsSubmitting(false);
    setIsViewModalOpen(false);
  };

  const getStatusBadge = (status: LearnerEnrolmentStatus) => {
    const statusConfig: Record<LearnerEnrolmentStatus, { color: string; icon: React.ReactNode; label: string }> = {
      'Draft': { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Draft' },
      'Submitted': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Submitted' },
      'Gate Evaluation Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Gate Evaluation Pending' },
      'Gate Evaluation In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Gate Evaluation In Progress' },
      'Gate Evaluation Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Gate Completed' },
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
      'Site Visit Scheduled': { color: 'bg-blue-100 text-blue-800', icon: <Calendar className="h-3 w-3 mr-1" />, label: 'Site Visit Scheduled' },
      'Site Visit Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Site Visit Completed' },
      'SDP Gate Check Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'SDP Gate Check Pending' },
      'SDP Gate Check Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Gate Check Completed' },
      'Pending QA SP Validation': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending QA SP Validation' },
      'Under QA SP Validation': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under QA SP Validation' },
      'QA SP Validated': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'QA SP Validated' },
      'Ready for Allocation': { color: 'bg-purple-100 text-purple-800', icon: <User className="h-3 w-3 mr-1" />, label: 'Ready for Allocation' },
      // Quarterly allocation statuses
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
// Add these to the statusConfig object
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
    const config = statusConfig[status] || statusConfig['QA SP Validated'];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const safeFormatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return '-';
    }
  };

  const safeFormatDateTime = (dateString: string | undefined | null) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return '-';
    }
  };

  const canSubmitQuarterlyAllocation = () => {
    return currentUser.role === 'Indicator Champion' && 
           selectedEnrolment?.status === 'QA SP Validated';
  };

  const canPopulateAllocations = () => {
    return currentUser.role === 'QA SP Team' && 
           selectedEnrolment?.status === 'Pending Quarterly Allocation';
  };

  const canConfirmAndAllocate = () => {
    return currentUser.role === 'Indicator Champion' && 
           selectedEnrolment?.status === 'Allocation Populated';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Reviewed Skills Programmes</h3>
      <p className="text-gray-600">Skills programmes that have been validated and are ready for quarterly allocation</p>
      
      {/* Validated Enrolments Table - For Indicator Champion to start allocation */}
      {reviewedEnrolments.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Validated Enrolments</h4>
            <p className="text-sm text-gray-500">Enrolments ready for quarterly allocation (Indicator Champion)</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrolment ID</TableHead>
                <TableHead>Learner Name</TableHead>
                <TableHead>Skills Programme</TableHead>
                <TableHead>Validation Date</TableHead>
                <TableHead>Validated By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewedEnrolments.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{`${enrolment.learnerDetails.firstName} ${enrolment.learnerDetails.lastName}`}</TableCell>
                  <TableCell>{enrolment.qualification.name}</TableCell>
                  <TableCell>{safeFormatDate(enrolment.indicatorChampionReview?.reviewedAt)}</TableCell>
                  <TableCell>{enrolment.indicatorChampionReview?.reviewedBy || '-'}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Allocate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pending Population Table - For QA SP Team */}
      {pendingPopulation.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Pending Population</h4>
            <p className="text-sm text-gray-500">Enrolments ready for QA SP Team to populate allocations</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrolment ID</TableHead>
                <TableHead>Learner Name</TableHead>
                <TableHead>Skills Programme</TableHead>
                <TableHead>Quarter</TableHead>
                <TableHead>Allocated By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPopulation.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{`${enrolment.learnerDetails.firstName} ${enrolment.learnerDetails.lastName}`}</TableCell>
                  <TableCell>{enrolment.qualification.name}</TableCell>
                  <TableCell>{enrolment.quarterlyAllocation?.quarter || '-'}</TableCell>
                  <TableCell>{enrolment.quarterlyAllocation?.allocatedBy || '-'}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Populate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pending Confirmation Table - For Indicator Champion to finalize */}
      {pendingConfirmation.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Pending Confirmation</h4>
            <p className="text-sm text-gray-500">Enrolments ready for Indicator Champion to confirm and allocate to QA Managers</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrolment ID</TableHead>
                <TableHead>Learner Name</TableHead>
                <TableHead>Skills Programme</TableHead>
                <TableHead>Quarter</TableHead>
                <TableHead>Populated By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingConfirmation.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{`${enrolment.learnerDetails.firstName} ${enrolment.learnerDetails.lastName}`}</TableCell>
                  <TableCell>{enrolment.qualification.name}</TableCell>
                  <TableCell>{enrolment.quarterlyAllocation?.quarter || '-'}</TableCell>
                  <TableCell>{enrolment.quarterlyAllocation?.populatedBy || '-'}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {reviewedEnrolments.length === 0 && pendingPopulation.length === 0 && pendingConfirmation.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No reviewed skills programmes yet. Enrolments will appear here once validated by QA SP Team.
        </div>
      )}

      {/* View Enrolment Modal with Quarterly Allocation Tab */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Skills Programme Details</DialogTitle>
          </DialogHeader>
          
          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Enrolment Details</TabsTrigger>
                <TabsTrigger value="gateEvaluation">Gate Evaluation Results</TabsTrigger>
                <TabsTrigger value="validation">Validation Results</TabsTrigger>
                <TabsTrigger value="allocation">Quarterly Allocation</TabsTrigger>
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
                      <p className="text-xs text-gray-500 mt-2">Evaluated on: {safeFormatDateTime(selectedEnrolment.gateEvaluation.generatedAt)}</p>
                    </div>
                    
                    {selectedEnrolment.gateEvaluation.checklistResults && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Gate Evaluation Checklist Results</h4>
                        {selectedEnrolment.gateEvaluation.checklistResults.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            {item.isMet ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-red-500" />}
                            <span>{item.criteria}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 3: Validation Results */}
              <TabsContent value="validation" className="space-y-6 py-4">
                {selectedEnrolment.indicatorChampionReview && (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium">✓ Enrolment Validated</p>
                      <p className="text-sm text-gray-600">Validated by: {selectedEnrolment.indicatorChampionReview.reviewedBy}</p>
                      <p className="text-xs text-gray-500">Validated on: {safeFormatDateTime(selectedEnrolment.indicatorChampionReview.reviewedAt)}</p>
                      {selectedEnrolment.indicatorChampionReview.confirmationLetterUrl && (
                        <a href={selectedEnrolment.indicatorChampionReview.confirmationLetterUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                          <FileText className="h-4 w-4" />
                          View Validation Report
                        </a>
                      )}
                    </div>
                    
                    {selectedEnrolment.indicatorChampionReview.checklist && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Validation Checklist Results</h4>
                        {selectedEnrolment.indicatorChampionReview.checklist.map((item) => (
                          <div key={item.criteriaId} className="flex items-start gap-2 text-sm p-2 border-b">
                            <div className="flex-shrink-0 mt-0.5">
                              {item.isMet ? <CheckCircle className="h-4 w-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-red-500" />}
                            </div>
                            <div className="flex-1">
                              <span className="font-medium">{item.criteriaName}</span>
                              {item.comments && (
                                <p className="text-gray-500 text-xs mt-1">{item.comments}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedEnrolment.indicatorChampionReview.comments && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium">Validation Notes</p>
                        <p className="text-sm text-gray-600 mt-1">{selectedEnrolment.indicatorChampionReview.comments}</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 4: Quarterly Allocation */}
              <TabsContent value="allocation" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Quarterly Allocation</h3>
                  <p className="text-sm text-gray-600">Submit quarterly allocations for monitoring</p>
                  
                  {canSubmitQuarterlyAllocation() && (
                    <div className="space-y-4">
                      <div>
                        <Label>Select Quarter *</Label>
                        <select 
                          className="w-full p-2 border rounded-md mt-1"
                          value={quarter}
                          onChange={(e) => setQuarter(e.target.value)}
                        >
                          <option value="">Select Quarter</option>
                          <option value="Q1 2024">Q1 2024 (Jan - Mar)</option>
                          <option value="Q2 2024">Q2 2024 (Apr - Jun)</option>
                          <option value="Q3 2024">Q3 2024 (Jul - Sep)</option>
                          <option value="Q4 2024">Q4 2024 (Oct - Dec)</option>
                          <option value="Q1 2025">Q1 2025 (Jan - Mar)</option>
                        </select>
                      </div>
                      <div>
                        <Label>Allocation Notes</Label>
                        <Textarea
                          value={allocationNotes}
                          onChange={(e) => setAllocationNotes(e.target.value)}
                          placeholder="Add notes about this allocation..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <Button 
                        onClick={handleSubmitQuarterlyAllocation}
                        disabled={!quarter || isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Quarterly Allocation
                      </Button>
                    </div>
                  )}
                  
                  {canPopulateAllocations() && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-blue-800 font-medium">Quarter: {selectedEnrolment.quarterlyAllocation?.quarter}</p>
                        <p className="text-sm text-gray-600">Allocated by: {selectedEnrolment.quarterlyAllocation?.allocatedBy}</p>
                        <p className="text-xs text-gray-500">Allocated on: {safeFormatDateTime(selectedEnrolment.quarterlyAllocation?.allocatedAt)}</p>
                      </div>
                      <div>
                        <Label>Populate Allocation Data *</Label>
                        <Textarea
                          value={populatedData}
                          onChange={(e) => setPopulatedData(e.target.value)}
                          placeholder="Enter the allocation data (e.g., QA Manager assignments, monitoring targets, etc.)..."
                          rows={4}
                          className="mt-1"
                        />
                      </div>
                      <Button 
                        onClick={handlePopulateAllocations}
                        disabled={!populatedData || isSubmitting}
                        className="bg-green-600 hover:bg-green-700 w-full"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Populate Allocations
                      </Button>
                    </div>
                  )}
                  
                  {canConfirmAndAllocate() && (
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-green-800 font-medium">Quarter: {selectedEnrolment.quarterlyAllocation?.quarter}</p>
                        <p className="text-sm text-gray-600">Allocated by: {selectedEnrolment.quarterlyAllocation?.allocatedBy}</p>
                        <p className="text-sm text-gray-600">Populated by: {selectedEnrolment.quarterlyAllocation?.populatedBy}</p>
                        <p className="text-xs text-gray-500">Populated on: {safeFormatDateTime(selectedEnrolment.quarterlyAllocation?.populatedAt)}</p>
                        {selectedEnrolment.quarterlyAllocation?.populatedData && (
                          <div className="mt-3">
                            <p className="font-medium">Populated Data:</p>
                            <p className="text-sm text-gray-600 mt-1">{selectedEnrolment.quarterlyAllocation.populatedData}</p>
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={handleConfirmAndAllocate}
                        disabled={isSubmitting}
                        className="bg-purple-600 hover:bg-purple-700 w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Confirm & Allocate to QA Managers
                      </Button>
                    </div>
                  )}
                  
                  {selectedEnrolment.quarterlyAllocation?.status === 'confirmed' && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-purple-800 font-medium">✓ Allocation Completed</p>
                      <p className="text-sm text-gray-600">Quarter: {selectedEnrolment.quarterlyAllocation?.quarter}</p>
                      <p className="text-sm text-gray-600">Allocated by: {selectedEnrolment.quarterlyAllocation?.allocatedBy}</p>
                      <p className="text-sm text-gray-600">Populated by: {selectedEnrolment.quarterlyAllocation?.populatedBy}</p>
                      <p className="text-sm text-gray-600">Confirmed by: {selectedEnrolment.quarterlyAllocation?.confirmedBy}</p>
                      <p className="text-xs text-gray-500">Confirmed on: {safeFormatDateTime(selectedEnrolment.quarterlyAllocation?.confirmedAt)}</p>
                      {selectedEnrolment.quarterlyAllocation?.populatedData && (
                        <div className="mt-3">
                          <p className="font-medium">Allocation Data:</p>
                          <p className="text-sm text-gray-600 mt-1">{selectedEnrolment.quarterlyAllocation.populatedData}</p>
                        </div>
                      )}
                      <p className="text-sm text-gray-600 mt-2">Status: Allocated for Monitoring</p>
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

export default ReviewedSkillsProgrammes;