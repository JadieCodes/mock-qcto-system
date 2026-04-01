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
import { Eye, FileText, Camera, Upload, CheckCircle, XCircle, Clock, User, Send,Calendar,Users,ClipboardList } from 'lucide-react';
import type { LearnerEnrolment, LearnerEnrolmentStatus } from '@/types';

const ExternalMonitoringSkillsProgrammes = () => {
  const { currentUser, enrolments, updateEnrolment } = useApp();
  const [selectedEnrolment, setSelectedEnrolment] = useState<LearnerEnrolment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Evidence submission state
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceNotes, setEvidenceNotes] = useState('');

  // Filter enrolments where monitoring plan has been submitted
  const pendingEvidenceEnrolments = enrolments.filter(e => 
    e.status === 'Monitoring Plan Submitted' && e.monitoringPlan
  );

  useEffect(() => {
    console.log('Pending evidence enrolments:', pendingEvidenceEnrolments);
  }, [pendingEvidenceEnrolments]);

  const viewEnrolment = (enrolment: LearnerEnrolment) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
    setEvidenceFile(null);
    setEvidenceNotes('');
  };

  const handleSubmitEvidence = () => {
    if (!selectedEnrolment || !evidenceFile) return;
    
    setIsSubmitting(true);
    
    updateEnrolment(selectedEnrolment.id, {
      sdpEvidence: {
        documentUrl: URL.createObjectURL(evidenceFile),
        documentName: evidenceFile.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.name,
        notes: evidenceNotes,
      },
      status: 'SDP Evidence Submitted' as LearnerEnrolmentStatus
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
  const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3 mr-1" />, label: status };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

  const canSubmitEvidence = () => {
    return currentUser.role === 'SDP' && 
           selectedEnrolment?.status === 'Monitoring Plan Submitted';
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

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Monitoring Skills Programmes</h3>
      <p className="text-gray-600">Submit evidence for monitoring plans received from QA Managers</p>
      
      {pendingEvidenceEnrolments.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Pending Evidence Submission</h4>
            <p className="text-sm text-gray-500">Monitoring plans received - submit your evidence</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrolment ID</TableHead>
                <TableHead>Learner Name</TableHead>
                <TableHead>Skills Programme</TableHead>
                <TableHead>Plan Received Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingEvidenceEnrolments.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{`${enrolment.learnerDetails.firstName} ${enrolment.learnerDetails.lastName}`}</TableCell>
                  <TableCell>{enrolment.qualification.name}</TableCell>
                  <TableCell>{safeFormatDate(enrolment.monitoringPlan?.uploadedAt)}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Submit Evidence
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No pending evidence submissions. Monitoring plans will appear here once received from QA Managers.
        </div>
      )}

      {/* Submit Evidence Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Monitoring Evidence</DialogTitle>
          </DialogHeader>
          
          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Enrolment Details</TabsTrigger>
                <TabsTrigger value="monitoringPlan">Monitoring Plan</TabsTrigger>
                <TabsTrigger value="evidence">Submit Evidence</TabsTrigger>
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
              </TabsContent>
              
              {/* Tab 2: Monitoring Plan */}
              <TabsContent value="monitoringPlan" className="space-y-6 py-4">
                {selectedEnrolment.monitoringPlan && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800">Monitoring Plan</h4>
                      <a href={selectedEnrolment.monitoringPlan.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                        <FileText className="h-4 w-4" />
                        {selectedEnrolment.monitoringPlan.documentName}
                      </a>
                      {selectedEnrolment.monitoringPlan.notes && (
                        <p className="text-sm text-gray-600 mt-2">Notes: {selectedEnrolment.monitoringPlan.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">Received on: {safeFormatDateTime(selectedEnrolment.monitoringPlan.uploadedAt)}</p>
                      <p className="text-xs text-gray-500">From: {selectedEnrolment.monitoringPlan.uploadedBy}</p>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-yellow-800 font-medium">Instructions</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
                        <li>Please review the monitoring plan carefully</li>
                        <li>Prepare the required evidence as outlined in the plan</li>
                        <li>Upload all supporting documents in the Evidence tab</li>
                        <li>Submit your evidence by the deadline specified</li>
                      </ul>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 3: Submit Evidence */}
              <TabsContent value="evidence" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Submit Monitoring Evidence</h3>
                  
                  {canSubmitEvidence() && (
                    <div className="space-y-4">
                      <div>
                        <Label>Upload Evidence *</Label>
                        <div className="flex items-center gap-4 mt-1">
                          <Input
                            type="file"
                            onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                            accept=".pdf,.doc,.docx,.xlsx,.jpg,.png"
                            className="flex-1"
                          />
                          <Button variant="outline" disabled={!evidenceFile}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Upload supporting evidence including progress reports, attendance records, assessment results, etc.</p>
                      </div>
                      
                      <div>
                        <Label>Additional Notes</Label>
                        <Textarea
                          value={evidenceNotes}
                          onChange={(e) => setEvidenceNotes(e.target.value)}
                          placeholder="Add any additional information about your evidence submission..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleSubmitEvidence}
                        disabled={!evidenceFile || isSubmitting}
                        className="bg-green-600 hover:bg-green-700 w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Evidence
                      </Button>
                    </div>
                  )}
                  
                  {selectedEnrolment.sdpEvidence && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium">✓ Evidence Submitted</p>
                      <a href={selectedEnrolment.sdpEvidence.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                        <FileText className="h-4 w-4" />
                        {selectedEnrolment.sdpEvidence.documentName}
                      </a>
                      {selectedEnrolment.sdpEvidence.notes && (
                        <p className="text-sm text-gray-600 mt-2">Notes: {selectedEnrolment.sdpEvidence.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">Submitted on: {safeFormatDateTime(selectedEnrolment.sdpEvidence.uploadedAt)}</p>
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

export default ExternalMonitoringSkillsProgrammes;