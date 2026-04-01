import React, { useState } from 'react';
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
import { Eye, FileText, CheckCircle, User, UserCheck, Clock, XCircle, Calendar ,Users,ClipboardList} from 'lucide-react';
import type { LearnerEnrolment, LearnerEnrolmentStatus } from '@/types';

// Add safe date formatting helper
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

const Allocations = () => {
  const { currentUser, enrolments, updateEnrolment } = useApp();
  const [selectedEnrolment, setSelectedEnrolment] = useState<LearnerEnrolment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [allocatedTo, setAllocatedTo] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');

  const viewEnrolment = (enrolment: LearnerEnrolment) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
    setAllocatedTo('');
    setAllocationNotes('');
  };

 const handleAllocate = () => {
  if (!selectedEnrolment || !allocatedTo) return;
  
  console.log('Allocating to QA Manager:', allocatedTo);
  console.log('Selected enrolment before update:', selectedEnrolment);
  
  updateEnrolment(selectedEnrolment.id, {
    allocation: {
      allocatedTo: allocatedTo,
      allocatedAt: new Date().toISOString(),
      allocationNotes: allocationNotes,
    },
    // IMPORTANT: This MUST be 'Allocated to QA' not 'Allocated'
    status: 'Allocated to QA' as LearnerEnrolmentStatus
  });
  
  console.log('Updated to status: Allocated to QA');
  setIsViewModalOpen(false);
};

 const getStatusBadge = (status: LearnerEnrolmentStatus) => {
  const statusConfig: Record<LearnerEnrolmentStatus, { color: string; icon: React.ReactNode; label: string }> = {
    'Draft': { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Draft' },
    'Submitted': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Submitted' },
    'Gate Evaluation Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Gate Evaluation Pending' },
    'Gate Evaluation In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Gate Evaluation In Progress' },
    'Gate Evaluation Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Gate Evaluation Completed' },
    'Pending Indicator Champion Review': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Review' },
    'Under Indicator Champion Review': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Review' },
    'Approved': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Approved - Ready for Allocation' },
    'Allocated to QA': { color: 'bg-purple-100 text-purple-800', icon: <UserCheck className="h-3 w-3 mr-1" />, label: 'Allocated to QA' },
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
  const config = statusConfig[status] || statusConfig['Approved'];
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

  // Filter approved enrolments ready for allocation
  const approvedEnrolments = enrolments.filter(e => 
    e.status === 'Approved'
  );

  const canAllocate = () => {
    return currentUser.role === 'Indicator Champion' && 
           selectedEnrolment?.status === 'Approved';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Allocations</h3>
      <p className="text-gray-600">Allocate approved enrolments to QA Managers</p>
      
      {approvedEnrolments.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Approved Enrolments</h4>
            <p className="text-sm text-gray-500">Ready for allocation to QA Managers</p>
          </div>
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
              {approvedEnrolments.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{`${enrolment.learnerDetails.firstName} ${enrolment.learnerDetails.lastName}`}</TableCell>
                  <TableCell>{enrolment.qualification.name}</TableCell>
                  <TableCell>{safeFormatDate(enrolment.submittedAt)}</TableCell>
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
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No approved enrolments ready for allocation.
        </div>
      )}

      {/* Allocation Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Allocate Enrolment</DialogTitle>
          </DialogHeader>
          
          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Learner Enrolment Details</TabsTrigger>
                <TabsTrigger value="gateEvaluation">Gate Evaluation Check</TabsTrigger>
                <TabsTrigger value="review">Review Results</TabsTrigger>
                <TabsTrigger value="allocation">Allocation</TabsTrigger>
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
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Qualification Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Qualification Name</Label><p className="font-medium">{selectedEnrolment.qualification.name}</p></div>
                    <div><Label className="text-sm text-gray-500">Code</Label><p className="font-medium">{selectedEnrolment.qualification.code}</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Enrolment Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Start Date</Label><p className="font-medium">{safeFormatDate(selectedEnrolment.enrolmentDetails.startDate)}</p></div>
                    <div><Label className="text-sm text-gray-500">End Date</Label><p className="font-medium">{safeFormatDate(selectedEnrolment.enrolmentDetails.endDate)}</p></div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Tab 2: Gate Evaluation Check */}
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
                          View Draft Learner Enrolment Report
                        </a>
                      )}
                      <p className="text-xs text-gray-500 mt-2">Generated: {safeFormatDateTime(selectedEnrolment.gateEvaluation.generatedAt)}</p>
                    </div>
                    
                    {selectedEnrolment.gateEvaluation.checklistResults && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Gate Evaluation Checklist Results</h4>
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
              </TabsContent>
              
              {/* Tab 3: Review Results */}
              <TabsContent value="review" className="space-y-6 py-4">
                {selectedEnrolment.indicatorChampionReview && (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium">✓ Enrolment Approved</p>
                      <p className="text-sm text-gray-600">Reviewed by: {selectedEnrolment.indicatorChampionReview.reviewedBy}</p>
                      <p className="text-xs text-gray-500">Reviewed on: {safeFormatDateTime(selectedEnrolment.indicatorChampionReview.reviewedAt)}</p>
                      {selectedEnrolment.indicatorChampionReview.confirmationLetterUrl && (
                        <a href={selectedEnrolment.indicatorChampionReview.confirmationLetterUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                          <FileText className="h-4 w-4" />
                          View Confirmation Letter
                        </a>
                      )}
                    </div>
                    
                    {selectedEnrolment.indicatorChampionReview.checklist && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Review Checklist</h4>
                        {selectedEnrolment.indicatorChampionReview.checklist.map((item) => (
                          <div key={item.criteriaId} className="flex items-center gap-2 text-sm">
                            {item.isMet ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                            <span>{item.criteriaName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedEnrolment.indicatorChampionReview.comments && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium">Comments</p>
                        <p className="text-sm text-gray-600">{selectedEnrolment.indicatorChampionReview.comments}</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 4: Allocation */}
              <TabsContent value="allocation" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Allocate to QA Manager</h3>
                  
                  {canAllocate() && (
                    <div className="space-y-4">
                      <div>
                        <Label>Select QA Manager *</Label>
                        <select 
                          className="w-full p-2 border rounded-md mt-1"
                          value={allocatedTo}
                          onChange={(e) => setAllocatedTo(e.target.value)}
                        >
                          <option value="">Select QA Manager</option>
                          <option value="Michael Manager">Michael Manager</option>
                          <option value="Sarah Manager">Sarah Manager</option>
                          <option value="David Manager">David Manager</option>
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
                      <Button onClick={handleAllocate} disabled={!allocatedTo} className="bg-green-600 hover:bg-green-700">
                        <User className="h-4 w-4 mr-2" />
                        Allocate to QA Manager
                      </Button>
                    </div>
                  )}
                  
                  {selectedEnrolment.allocation && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-purple-800 font-medium">✓ Enrolment Allocated</p>
                      <p className="text-sm text-gray-600">Allocated to: {selectedEnrolment.allocation.allocatedTo}</p>
                      <p className="text-xs text-gray-500">Allocated on: {safeFormatDateTime(selectedEnrolment.allocation.allocatedAt)}</p>
                      {selectedEnrolment.allocation.allocationNotes && (
                        <p className="text-sm text-gray-600 mt-2">Notes: {selectedEnrolment.allocation.allocationNotes}</p>
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

export default Allocations;