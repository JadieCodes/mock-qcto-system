import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Eye, FileText, CheckCircle, Clock, Play, XCircle, Send ,UserCheck,User,Calendar} from 'lucide-react';
import type { LearnerEnrolment, LearnerEnrolmentStatus } from '@/types';

const evaluationChecklist = [
  { id: 'document_completeness', label: 'Document Completeness', description: 'Are all required documents submitted and valid?' },
  { id: 'learner_eligibility', label: 'Learner Eligibility', description: 'Does the learner meet all eligibility requirements?' },
  { id: 'qualification_validity', label: 'Qualification Validity', description: 'Is the qualification valid and accredited?' },
  { id: 'enrolment_dates', label: 'Enrolment Dates', description: 'Are the enrolment dates within the academic calendar?' },
  { id: 'data_accuracy', label: 'Data Accuracy', description: 'Is all learner data accurate and complete?' },
  { id: 'gate_evaluation', label: 'Gate Evaluation Results', description: 'Did the gate evaluation pass successfully?' },
];

const EnrolmentIntakeQueue = () => {
  const { currentUser, enrolments, updateEnrolment } = useApp();
  const [selectedEnrolment, setSelectedEnrolment] = useState<LearnerEnrolment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});
  const [reviewComments, setReviewComments] = useState('');

  // Filter enrolments pending indicator champion review
  const pendingReviewEnrolments = enrolments.filter(e => 
    e.status === 'Gate Evaluation Completed'
  );

  const viewEnrolment = (enrolment: LearnerEnrolment) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
    setChecklistState({});
    setReviewComments('');
  };

  const handleStartReview = () => {
    if (!selectedEnrolment) return;
    
    updateEnrolment(selectedEnrolment.id, {
      status: 'Under Indicator Champion Review' as LearnerEnrolmentStatus
    });
    setSelectedEnrolment({ ...selectedEnrolment, status: 'Under Indicator Champion Review' });
  };

  const handleApprove = () => {
    if (!selectedEnrolment) return;
    
    // Generate confirmation letter URL (simulated)
    const confirmationLetterUrl = URL.createObjectURL(new Blob(['Confirmation Letter for ' + selectedEnrolment.learnerDetails.firstName + ' ' + selectedEnrolment.learnerDetails.lastName], { type: 'application/pdf' }));
    
    updateEnrolment(selectedEnrolment.id, {
      indicatorChampionReview: {
        reviewedBy: currentUser.name,
        reviewedAt: new Date().toISOString(),
        checklist: evaluationChecklist.map(item => ({
          criteriaId: item.id,
          criteriaName: item.label,
          isMet: checklistState[item.id] || false,
          comments: reviewComments,
        })),
        decision: 'approved' as const,
        comments: reviewComments,
        confirmationLetterUrl: confirmationLetterUrl,
        sentAt: new Date().toISOString(),
      },
      status: 'Approved' as LearnerEnrolmentStatus
    });
    setSelectedEnrolment({ 
      ...selectedEnrolment, 
      indicatorChampionReview: {
        reviewedBy: currentUser.name,
        reviewedAt: new Date().toISOString(),
        checklist: evaluationChecklist.map(item => ({
          criteriaId: item.id,
          criteriaName: item.label,
          isMet: checklistState[item.id] || false,
          comments: reviewComments,
        })),
        decision: 'approved',
        comments: reviewComments,
        confirmationLetterUrl: confirmationLetterUrl,
        sentAt: new Date().toISOString(),
      },
      status: 'Approved'
    });
    setIsViewModalOpen(false);
  };

 // Update the getStatusBadge function
const getStatusBadge = (status: LearnerEnrolmentStatus) => {
  const statusConfig: Record<LearnerEnrolmentStatus, { color: string; icon: React.ReactNode; label: string }> = {
    'Draft': { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Draft' },
    'Submitted': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Submitted' },
    'Gate Evaluation Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Gate Evaluation Pending' },
    'Gate Evaluation In Progress': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Gate Evaluation In Progress' },
    'Gate Evaluation Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Gate Evaluation Completed' },
    'Pending Indicator Champion Review': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending Review' },
    'Under Indicator Champion Review': { color: 'bg-blue-100 text-blue-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Under Review' },
    'Approved': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Approved' },
    'Allocated to QA': { color: 'bg-purple-100 text-purple-800', icon: <UserCheck className="h-3 w-3 mr-1" />, label: 'Allocated to QA' },
    'Pending QP Allocation': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Pending QP Allocation' },
    'Allocated to QP': { color: 'bg-blue-100 text-blue-800', icon: <User className="h-3 w-3 mr-1" />, label: 'Allocated to QP' },
    'Plans & Reports Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Plans Pending' },
    'Plans & Reports Submitted': { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Plans Submitted' },
    'Plans Consolidated': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Plans Consolidated' },
    'Site Visit Pending': { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-3 w-3 mr-1" />, label: 'Site Visit Pending' },
    'Site Visit Scheduled': { color: 'bg-blue-100 text-blue-800', icon: <Calendar className="h-3 w-3 mr-1" />, label: 'Site Visit Scheduled' },
    'Site Visit Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Site Visit Completed' },
  };
  const config = statusConfig[status] || statusConfig['Gate Evaluation Completed'];
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

  const canStartReview = () => {
    return currentUser.role === 'Indicator Champion' && 
           selectedEnrolment?.status === 'Gate Evaluation Completed';
  };

  const canApprove = () => {
    return currentUser.role === 'Indicator Champion' && 
           selectedEnrolment?.status === 'Under Indicator Champion Review';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Enrolment Intake Queue</h3>
      <p className="text-gray-600">Review and approve learner enrolments</p>
      
      {pendingReviewEnrolments.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Pending Enrolment Reviews</h4>
            <p className="text-sm text-gray-500">Enrolments ready for indicator champion review</p>
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
              {pendingReviewEnrolments.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{`${enrolment.learnerDetails.firstName} ${enrolment.learnerDetails.lastName}`}</TableCell>
                  <TableCell>{enrolment.qualification.name}</TableCell>
                  <TableCell>{enrolment.submittedAt ? new Date(enrolment.submittedAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No pending enrolments for review.
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enrolment Review</DialogTitle>
          </DialogHeader>
          
          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Learner Enrolment Details</TabsTrigger>
                <TabsTrigger value="gateEvaluation">Gate Evaluation Check</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
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
              
              {/* Tab 3: Review */}
              <TabsContent value="review" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Manual Review</h3>
                  
                  {canStartReview() && (
                    <div className="space-y-4">
                      <Button onClick={handleStartReview} className="bg-blue-600 hover:bg-blue-700">
                        <Play className="h-4 w-4 mr-2" />
                        Start Review
                      </Button>
                    </div>
                  )}
                  
                  {canApprove() && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Evaluation Checklist</h4>
                      <div className="space-y-3">
                        {evaluationChecklist.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              id={item.id}
                              checked={checklistState[item.id] || false}
                              onCheckedChange={(checked) => setChecklistState(prev => ({ ...prev, [item.id]: checked === true }))}
                            />
                            <div className="flex-1">
                              <Label htmlFor={item.id} className="font-medium cursor-pointer">{item.label}</Label>
                              <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label>Comments</Label>
                        <Textarea
                          value={reviewComments}
                          onChange={(e) => setReviewComments(e.target.value)}
                          placeholder="Add your review comments..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                        <Send className="h-4 w-4 mr-2" />
                        Approve & Send Confirmation Letter
                      </Button>
                    </div>
                  )}
                  
                  {selectedEnrolment.indicatorChampionReview?.decision === 'approved' && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium">✓ Enrolment Approved</p>
                      <p className="text-sm text-gray-600 mt-2">Confirmation letter sent to SDP Portfolio.</p>
                      <a href={selectedEnrolment.indicatorChampionReview.confirmationLetterUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                        <FileText className="h-4 w-4" />
                        View Confirmation Letter
                      </a>
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

export default EnrolmentIntakeQueue;