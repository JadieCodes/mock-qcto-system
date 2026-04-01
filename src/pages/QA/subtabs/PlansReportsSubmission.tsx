import React, { useState, useEffect } from 'react';
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
import { Eye, FileText, Upload, Send, Clock, CheckCircle, User,Calendar,Users,ClipboardList } from 'lucide-react';
import type { LearnerEnrolment, LearnerEnrolmentStatus } from '@/types';

const PlansReportsSubmission = () => {
  const { currentUser, enrolments, updateEnrolment } = useApp();
  const [selectedEnrolment, setSelectedEnrolment] = useState<LearnerEnrolment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportNotes, setReportNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter enrolments allocated to current Quality Partner
  const allocatedEnrolments = enrolments.filter(e => 
    e.qpAllocation?.allocatedTo === currentUser.name && e.status === 'Allocated to QP'
  );

  useEffect(() => {
    console.log('Current User:', currentUser);
    console.log('Allocated to QP enrolments:', allocatedEnrolments);
  }, [currentUser, allocatedEnrolments]);

  const viewEnrolment = (enrolment: LearnerEnrolment) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
    setReportFile(null);
    setReportNotes('');
  };

  const handleSubmitPlansReports = () => {
    if (!selectedEnrolment || !reportFile) return;
    
    setIsSubmitting(true);
    
    updateEnrolment(selectedEnrolment.id, {
      plansReports: {
        documentUrl: URL.createObjectURL(reportFile),
        documentName: reportFile.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.name,
        submittedAt: new Date().toISOString(),
        notes: reportNotes,
      },
      status: 'Plans & Reports Submitted' as LearnerEnrolmentStatus
    });
    
    setIsSubmitting(false);
    setIsViewModalOpen(false);
    setReportFile(null);
    setReportNotes('');
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

const safeFormatDate = (dateString: string | undefined | null) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    return '-';
  }
};
  const canSubmitPlans = () => {
    return currentUser.role === 'Quality Partner' && 
           selectedEnrolment?.status === 'Allocated to QP';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Plans & Reports Submission</h3>
      <p className="text-gray-600">Submit consolidated plans and reports based on learner enrolments allocated to you</p>
      
      {allocatedEnrolments.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Enrolments Ready for Plans Submission</h4>
            <p className="text-sm text-gray-500">Submit consolidated plans and reports for each allocation</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrolment ID</TableHead>
                <TableHead>Learner Name</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Quarter</TableHead>
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
                  <TableCell>{enrolment.qpAllocation?.quarterlyPeriod || '-'}</TableCell>
                  <TableCell>{enrolment.qpAllocation?.allocatedAt ? new Date(enrolment.qpAllocation.allocatedAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Submit Plans
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No enrolments allocated to you. Please check back later.
        </div>
      )}

      {/* Submit Plans Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Plans & Reports</DialogTitle>
          </DialogHeader>
          
          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Enrolment Details</TabsTrigger>
                <TabsTrigger value="gateEvaluation">Gate Evaluation</TabsTrigger>
                <TabsTrigger value="submission">Plans Submission</TabsTrigger>
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
                  <h3 className="text-lg font-semibold text-gray-900">Qualification Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Qualification Name</Label><p className="font-medium">{selectedEnrolment.qualification.name}</p></div>
                    <div><Label className="text-sm text-gray-500">Code</Label><p className="font-medium">{selectedEnrolment.qualification.code}</p></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Allocation Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Quarter</Label><p className="font-medium">{selectedEnrolment.qpAllocation?.quarterlyPeriod || '-'}</p></div>
                    <div><Label className="text-sm text-gray-500">Allocated By</Label><p className="font-medium">QA Manager</p></div>
                    <div><Label className="text-sm text-gray-500">Allocation Notes</Label><p className="font-medium col-span-2">{selectedEnrolment.qpAllocation?.allocationNotes || '-'}</p></div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Tab 2: Gate Evaluation */}
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
              
              {/* Tab 3: Plans Submission */}
              <TabsContent value="submission" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Submit Consolidated Plans & Reports</h3>
                  
                  {canSubmitPlans() && (
                    <div className="space-y-4">
                      <div>
                        <Label>Upload Consolidated Plan/Report *</Label>
                        <div className="flex items-center gap-4 mt-1">
                          <Input
                            type="file"
                            onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                            accept=".pdf,.doc,.docx"
                            className="flex-1"
                          />
                          <Button variant="outline" type="button" disabled={!reportFile}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Upload consolidated plan including: Training plan, Assessment schedule, Learner support plan, and Quality assurance report</p>
                      </div>
                      
                      <div>
                        <Label>Additional Notes</Label>
                        <Textarea
                          value={reportNotes}
                          onChange={(e) => setReportNotes(e.target.value)}
                          placeholder="Add any additional information about your submission..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleSubmitPlansReports}
                        disabled={!reportFile || isSubmitting}
                        className="bg-green-600 hover:bg-green-700 w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Plans & Reports
                      </Button>
                    </div>
                  )}
                  
                  {selectedEnrolment.plansReports && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-blue-800 font-medium">✓ Plans & Reports Submitted</p>
                      <a href={selectedEnrolment.plansReports.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                        <FileText className="h-4 w-4" />
                        {selectedEnrolment.plansReports.documentName}
                      </a>
                      <p className="text-xs text-gray-500 mt-2">Submitted on: {new Date(selectedEnrolment.plansReports.submittedAt || '').toLocaleString()}</p>
                      {selectedEnrolment.plansReports.notes && (
                        <p className="text-sm text-gray-600 mt-2">Notes: {selectedEnrolment.plansReports.notes}</p>
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

export default PlansReportsSubmission;