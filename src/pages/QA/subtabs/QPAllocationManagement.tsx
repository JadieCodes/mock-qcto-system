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
import { Eye, FileText, CheckCircle, User, Clock, XCircle, Send, Calendar,Users,ClipboardList } from 'lucide-react';
import type { LearnerEnrolment, LearnerEnrolmentStatus } from '@/types';

// Safe date formatting helpers
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

const QPAllocationManagement = () => {
  const { currentUser, enrolments, updateEnrolment } = useApp();
  const [selectedEnrolment, setSelectedEnrolment] = useState<LearnerEnrolment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [allocatedTo, setAllocatedTo] = useState('');
  const [quarterlyPeriod, setQuarterlyPeriod] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');

  // Debug logging
  useEffect(() => {
    console.log('=== QPAllocationManagement Debug ===');
    console.log('Current User:', currentUser);
    console.log('Current User Name:', currentUser.name);
    console.log('Current User Role:', currentUser.role);
    
    // Log all enrolments with allocation
    const allocatedEnrolments = enrolments.filter(e => e.allocation);
    console.log('All enrolments with allocation:', allocatedEnrolments.map(e => ({
      id: e.id,
      enrolmentId: e.enrolmentId,
      learner: `${e.learnerDetails.firstName} ${e.learnerDetails.lastName}`,
      allocatedTo: e.allocation?.allocatedTo,
      status: e.status,
      match: e.allocation?.allocatedTo === currentUser.name
    })));
    
    // Log enrolments that should be visible
    const visibleEnrolments = enrolments.filter(e => 
      e.allocation?.allocatedTo === currentUser.name && e.status === 'Allocated to QA'
    );
    console.log('Visible enrolments (should appear in table):', visibleEnrolments.length);
    console.log('===================================');
  }, [enrolments, currentUser]);

  const viewEnrolment = (enrolment: LearnerEnrolment) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
    setAllocatedTo('');
    setQuarterlyPeriod('');
    setAllocationNotes('');
  };

  const handleAllocateToQP = () => {
    if (!selectedEnrolment || !allocatedTo) return;
    
    updateEnrolment(selectedEnrolment.id, {
      qpAllocation: {
        allocatedTo: allocatedTo,
        allocatedAt: new Date().toISOString(),
        allocationNotes: allocationNotes,
        quarterlyPeriod: quarterlyPeriod,
      },
      status: 'Allocated to QP' as LearnerEnrolmentStatus
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
  const config = statusConfig[status] || statusConfig['Plans & Reports Submitted'];
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

  // Filter enrolments where:
  // 1. The allocation.allocatedTo matches the current user's name
  // 2. The status is 'Allocated to QA'
  const allocatedEnrolments = enrolments.filter(e => {
    const isAllocatedToMe = e.allocation?.allocatedTo === currentUser.name;
    const isStatusCorrect = e.status === 'Allocated to QA';
    const shouldShow = isAllocatedToMe && isStatusCorrect;
    
    if (e.allocation?.allocatedTo) {
      console.log(`Enrolment ${e.enrolmentId}: allocatedTo="${e.allocation.allocatedTo}" vs currentUser="${currentUser.name}" -> match=${isAllocatedToMe}, status=${e.status}, show=${shouldShow}`);
    }
    
    return shouldShow;
  });

  const canAllocateToQP = () => {
    return currentUser.role === 'QA Managers' && 
           selectedEnrolment?.status === 'Allocated to QA';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">QP Allocation Management</h3>
          <p className="text-gray-600">Allocate learner enrolments to Quality Partners on a quarterly basis</p>
        </div>
        <div className="bg-blue-50 p-2 rounded text-sm">
          <span className="font-medium">Logged in as:</span> {currentUser.name} ({currentUser.role})
        </div>
      </div>
      
      {allocatedEnrolments.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Enrolments Ready for QP Allocation</h4>
            <p className="text-sm text-gray-500">Share allocations to Quality Partners on a quarterly basis</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrolment ID</TableHead>
                <TableHead>Learner Name</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Allocation Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocatedEnrolments.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{`${enrolment.learnerDetails.firstName} ${enrolment.learnerDetails.lastName}`}</TableCell>
                  <TableCell>{enrolment.qualification.name}</TableCell>
                  <TableCell>{safeFormatDate(enrolment.allocation?.allocatedAt)}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Allocate to QP
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No enrolments ready for QP allocation. Make sure you are logged in as a QA Manager and that enrolments have been allocated to you.
        </div>
      )}

      {/* Allocation Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Allocate to Quality Partner</DialogTitle>
          </DialogHeader>
          
          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Learner Enrolment Details</TabsTrigger>
                <TabsTrigger value="gateEvaluation">Gate Evaluation Check</TabsTrigger>
                <TabsTrigger value="review">Review Results</TabsTrigger>
                <TabsTrigger value="allocation">Allocate to QP</TabsTrigger>
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
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium">✓ Gate Evaluation Passed</p>
                      {selectedEnrolment.gateEvaluation.reportUrl && (
                        <a href={selectedEnrolment.gateEvaluation.reportUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                          <FileText className="h-4 w-4" />
                          View Draft Learner Enrolment Report
                        </a>
                      )}
                    </div>
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
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 4: Allocate to QP */}
              <TabsContent value="allocation" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Allocate to Quality Partner</h3>
                  
                  {canAllocateToQP() && (
                    <div className="space-y-4">
                      <div>
                        <Label>Select Quality Partner *</Label>
                        <select 
                          className="w-full p-2 border rounded-md mt-1"
                          value={allocatedTo}
                          onChange={(e) => setAllocatedTo(e.target.value)}
                        >
                          <option value="">Select Quality Partner</option>
                          <option value="Quentin Quality">Quentin Quality</option>
                          <option value="Sipho SETA">Sipho SETA</option>
                        </select>
                      </div>
                      <div>
                        <Label>Quarterly Period *</Label>
                        <select 
                          className="w-full p-2 border rounded-md mt-1"
                          value={quarterlyPeriod}
                          onChange={(e) => setQuarterlyPeriod(e.target.value)}
                        >
                          <option value="">Select Quarter</option>
                          <option value="Q1 2024">Q1 2024 (Jan - Mar)</option>
                          <option value="Q2 2024">Q2 2024 (Apr - Jun)</option>
                          <option value="Q3 2024">Q3 2024 (Jul - Sep)</option>
                          <option value="Q4 2024">Q4 2024 (Oct - Dec)</option>
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
                      <Button onClick={handleAllocateToQP} disabled={!allocatedTo || !quarterlyPeriod} className="bg-green-600 hover:bg-green-700">
                        <Send className="h-4 w-4 mr-2" />
                        Allocate to Quality Partner
                      </Button>
                    </div>
                  )}
                  
                  {selectedEnrolment.qpAllocation && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-purple-800 font-medium">✓ Allocated to Quality Partner</p>
                      <p className="text-sm text-gray-600">Quality Partner: {selectedEnrolment.qpAllocation.allocatedTo}</p>
                      <p className="text-sm text-gray-600">Quarter: {selectedEnrolment.qpAllocation.quarterlyPeriod}</p>
                      <p className="text-xs text-gray-500">Allocated on: {safeFormatDateTime(selectedEnrolment.qpAllocation.allocatedAt)}</p>
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

export default QPAllocationManagement;