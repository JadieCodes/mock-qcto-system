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
import { Eye, FileText, CheckCircle, Clock, User, Calendar, Upload, Send, ClipboardList,Users } from 'lucide-react';
import type { LearnerEnrolment, LearnerEnrolmentStatus, MonitoringEvaluationItem } from '@/types';

const MonitoringSkillsProgrammes = () => {
  const { currentUser, enrolments, updateEnrolment } = useApp();
  const [selectedEnrolment, setSelectedEnrolment] = useState<LearnerEnrolment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Monitoring Plan state
  const [monitoringPlanFile, setMonitoringPlanFile] = useState<File | null>(null);
  const [monitoringPlanNotes, setMonitoringPlanNotes] = useState('');
  
  // Monitoring Evaluation state
  const [evaluationChecklist, setEvaluationChecklist] = useState<MonitoringEvaluationItem[]>([
    { id: '1', criteria: 'Training Delivery Quality', rating: 3, comments: '' },
    { id: '2', criteria: 'Learner Attendance', rating: 3, comments: '' },
    { id: '3', criteria: 'Assessment Compliance', rating: 3, comments: '' },
    { id: '4', criteria: 'Documentation & Record Keeping', rating: 3, comments: '' },
    { id: '5', criteria: 'Learner Support Services', rating: 3, comments: '' },
    { id: '6', criteria: 'Facilities & Resources', rating: 3, comments: '' },
    { id: '7', criteria: 'Health & Safety Compliance', rating: 3, comments: '' },
    { id: '8', criteria: 'Overall Programme Effectiveness', rating: 3, comments: '' },
  ]);
  const [evaluationSummary, setEvaluationSummary] = useState('');
  const [evaluationRecommendations, setEvaluationRecommendations] = useState('');
  const [overallRating, setOverallRating] = useState<'excellent' | 'good' | 'satisfactory' | 'needs_improvement'>('satisfactory');
  const [evaluationNotes, setEvaluationNotes] = useState('');
  const [monitoringReportFile, setMonitoringReportFile] = useState<File | null>(null);

  // Filter enrolments that have been allocated for monitoring
 const monitoringEnrolments = enrolments.filter(e => 
  e.status === 'Allocated for Monitoring' || 
  e.status === 'Monitoring Plan Submitted' || 
  e.status === 'SDP Evidence Submitted' ||
  e.status === 'Monitoring Report Pending' ||
  e.status === 'Monitoring Report Completed'
);

  useEffect(() => {
    console.log('Monitoring enrolments:', monitoringEnrolments);
  }, [monitoringEnrolments]);

  const viewEnrolment = (enrolment: LearnerEnrolment) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
    setMonitoringPlanFile(null);
    setMonitoringPlanNotes('');
    
    // Load existing evaluation if available
    if (enrolment.monitoringReport?.evaluationChecklist) {
      setEvaluationChecklist(enrolment.monitoringReport.evaluationChecklist);
      setEvaluationSummary(enrolment.monitoringReport.summary || '');
      setEvaluationRecommendations(enrolment.monitoringReport.recommendations || '');
      setOverallRating(enrolment.monitoringReport.overallRating || 'satisfactory');
      setEvaluationNotes(enrolment.monitoringReport.notes || '');
    } else {
      resetEvaluation();
    }
  };

  const resetEvaluation = () => {
    setEvaluationChecklist(evaluationChecklist.map(item => ({ ...item, rating: 3, comments: '' })));
    setEvaluationSummary('');
    setEvaluationRecommendations('');
    setOverallRating('satisfactory');
    setEvaluationNotes('');
    setMonitoringReportFile(null);
  };

  const handleSubmitMonitoringPlan = () => {
    if (!selectedEnrolment || !monitoringPlanFile) return;
    
    setIsSubmitting(true);
    
    updateEnrolment(selectedEnrolment.id, {
      monitoringPlan: {
        documentUrl: URL.createObjectURL(monitoringPlanFile),
        documentName: monitoringPlanFile.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.name,
        notes: monitoringPlanNotes,
      },
      status: 'Monitoring Plan Submitted' as LearnerEnrolmentStatus
    });
    
    setIsSubmitting(false);
    setIsViewModalOpen(false);
  };

  const handleSubmitEvaluationReport = () => {
    if (!selectedEnrolment) return;
    
    setIsSubmitting(true);
    
    const reportData = {
      evaluationChecklist,
      summary: evaluationSummary,
      recommendations: evaluationRecommendations,
      overallRating,
      notes: evaluationNotes,
      evaluatedBy: currentUser.name,
      evaluatedAt: new Date().toISOString(),
    };
    
    const reportBlob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const reportUrl = URL.createObjectURL(reportBlob);
    
    updateEnrolment(selectedEnrolment.id, {
      monitoringReport: {
        documentUrl: reportUrl,
        documentName: `Monitoring_Report_${selectedEnrolment.enrolmentId}.json`,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser.name,
        evaluationChecklist,
        summary: evaluationSummary,
        recommendations: evaluationRecommendations,
        overallRating,
        submittedAt: new Date().toISOString(),
        notes: evaluationNotes,
      },
      status: 'Monitoring Report Completed' as LearnerEnrolmentStatus
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

  const canSubmitMonitoringPlan = () => {
    return currentUser.role === 'QA Managers' && 
           selectedEnrolment?.status === 'Allocated for Monitoring';
  };

  const canSubmitEvaluationReport = () => {
    return currentUser.role === 'QA Managers' && 
           selectedEnrolment?.status === 'SDP Evidence Submitted';
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

  const calculateAverageRating = () => {
    const sum = evaluationChecklist.reduce((acc, item) => acc + item.rating, 0);
    return (sum / evaluationChecklist.length).toFixed(1);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Monitoring Skills Programmes</h3>
      <p className="text-gray-600">Monitor skills programmes and evaluate SDP evidence</p>
      
      {monitoringEnrolments.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Active Monitoring Cases</h4>
            <p className="text-sm text-gray-500">Enrolments requiring monitoring action</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrolment ID</TableHead>
                <TableHead>Learner Name</TableHead>
                <TableHead>Skills Programme</TableHead>
                <TableHead>Quarter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitoringEnrolments.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{`${enrolment.learnerDetails.firstName} ${enrolment.learnerDetails.lastName}`}</TableCell>
                  <TableCell>{enrolment.qualification.name}</TableCell>
                  <TableCell>{enrolment.quarterlyAllocation?.quarter || '-'}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No active monitoring cases. Enrolments will appear here once allocated.
        </div>
      )}

      {/* View Enrolment Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Monitoring Skills Programme</DialogTitle>
          </DialogHeader>
          
          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="details">Enrolment Details</TabsTrigger>
                <TabsTrigger value="gateEvaluation">Gate Evaluation</TabsTrigger>
                <TabsTrigger value="validation">Validation</TabsTrigger>
                <TabsTrigger value="allocation">Allocation</TabsTrigger>
                <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
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
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 4: Allocation Details */}
              <TabsContent value="allocation" className="space-y-6 py-4">
                {selectedEnrolment.quarterlyAllocation && (
                  <div className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-purple-800 font-medium">✓ Allocation Completed</p>
                      <p className="text-sm text-gray-600">Quarter: {selectedEnrolment.quarterlyAllocation.quarter}</p>
                      <p className="text-sm text-gray-600">Allocated by: {selectedEnrolment.quarterlyAllocation.allocatedBy}</p>
                      <p className="text-sm text-gray-600">Confirmed by: {selectedEnrolment.quarterlyAllocation.confirmedBy}</p>
                      <p className="text-xs text-gray-500">Confirmed on: {safeFormatDateTime(selectedEnrolment.quarterlyAllocation.confirmedAt)}</p>
                      {selectedEnrolment.quarterlyAllocation.populatedData && (
                        <div className="mt-3">
                          <p className="font-medium">Allocation Data:</p>
                          <p className="text-sm text-gray-600 mt-1">{selectedEnrolment.quarterlyAllocation.populatedData}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Tab 5: Monitoring */}
              <TabsContent value="monitoring" className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Monitoring & Evaluation</h3>
                  
                  {/* Step 1: Submit Monitoring Plan */}
                  {canSubmitMonitoringPlan() && (
                    <div className="space-y-4 border rounded-lg p-4">
                      <h4 className="font-medium text-gray-800">Step 1: Submit Monitoring Plan</h4>
                      <div>
                        <Label>Upload Monitoring Plan *</Label>
                        <div className="flex items-center gap-4 mt-1">
                          <Input
                            type="file"
                            onChange={(e) => setMonitoringPlanFile(e.target.files?.[0] || null)}
                            accept=".pdf,.doc,.docx"
                            className="flex-1"
                          />
                          <Button variant="outline" disabled={!monitoringPlanFile}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Additional Notes</Label>
                        <Textarea
                          value={monitoringPlanNotes}
                          onChange={(e) => setMonitoringPlanNotes(e.target.value)}
                          placeholder="Add notes about the monitoring plan..."
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                      <Button 
                        onClick={handleSubmitMonitoringPlan}
                        disabled={!monitoringPlanFile || isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Monitoring Plan
                      </Button>
                    </div>
                  )}
                  
                  {/* Step 2: View SDP Evidence */}
                  {selectedEnrolment.sdpEvidence && (
                    <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium text-gray-800">SDP Evidence Submitted</h4>
                      <a href={selectedEnrolment.sdpEvidence.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {selectedEnrolment.sdpEvidence.documentName}
                      </a>
                      {selectedEnrolment.sdpEvidence.notes && (
                        <p className="text-sm text-gray-600">Notes: {selectedEnrolment.sdpEvidence.notes}</p>
                      )}
                      <p className="text-xs text-gray-500">Submitted on: {safeFormatDateTime(selectedEnrolment.sdpEvidence.uploadedAt)}</p>
                    </div>
                  )}
                  
                  {/* Step 3: Evaluation Checklist */}
                  {(selectedEnrolment.status === 'SDP Evidence Submitted' || selectedEnrolment.monitoringReport) && (
                    <div className="space-y-4 border rounded-lg p-4">
                      <h4 className="font-medium text-gray-800">Monitoring Evaluation Checklist</h4>
                      <p className="text-sm text-gray-600">Rate each criteria from 1 (Poor) to 5 (Excellent)</p>
                      
                      <div className="space-y-4">
                        {evaluationChecklist.map((item) => (
                          <div key={item.id} className="border rounded-lg p-3">
                            <Label className="font-medium">{item.criteria}</Label>
                            <div className="flex gap-2 mt-2">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <Button
                                  key={rating}
                                  variant={item.rating === rating ? 'default' : 'outline'}
                                  onClick={() => setEvaluationChecklist(prev => prev.map(i =>
                                    i.id === item.id ? { ...i, rating: rating as 1 | 2 | 3 | 4 | 5 } : i
                                  ))}
                                  className={`h-8 w-8 p-0 ${item.rating === rating ? 'bg-blue-600' : ''}`}
                                  disabled={selectedEnrolment.monitoringReport !== undefined}
                                >
                                  {rating}
                                </Button>
                              ))}
                            </div>
                            <Textarea
                              placeholder="Comments..."
                              value={item.comments}
                              onChange={(e) => setEvaluationChecklist(prev => prev.map(i =>
                                i.id === item.id ? { ...i, comments: e.target.value } : i
                              ))}
                              rows={2}
                              className="mt-2 text-sm"
                              disabled={selectedEnrolment.monitoringReport !== undefined}
                            />
                          </div>
                        ))}
                      </div>
                      
                      <div>
                        <Label>Overall Summary</Label>
                        <Textarea
                          value={evaluationSummary}
                          onChange={(e) => setEvaluationSummary(e.target.value)}
                          placeholder="Provide an overall summary of the monitoring findings..."
                          rows={3}
                          className="mt-1"
                          disabled={selectedEnrolment.monitoringReport !== undefined}
                        />
                      </div>
                      
                      <div>
                        <Label>Recommendations</Label>
                        <Textarea
                          value={evaluationRecommendations}
                          onChange={(e) => setEvaluationRecommendations(e.target.value)}
                          placeholder="Provide recommendations for improvement..."
                          rows={3}
                          className="mt-1"
                          disabled={selectedEnrolment.monitoringReport !== undefined}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Overall Rating</Label>
                          <select
                            value={overallRating}
                            onChange={(e) => setOverallRating(e.target.value as any)}
                            className="w-full p-2 border rounded-md mt-1"
                            disabled={selectedEnrolment.monitoringReport !== undefined}
                          >
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="satisfactory">Satisfactory</option>
                            <option value="needs_improvement">Needs Improvement</option>
                          </select>
                        </div>
                        <div>
                          <Label>Average Score</Label>
                          <div className="text-2xl font-bold text-blue-600 mt-1">{calculateAverageRating()}/5</div>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Evaluation Notes</Label>
                        <Textarea
                          value={evaluationNotes}
                          onChange={(e) => setEvaluationNotes(e.target.value)}
                          placeholder="Additional notes for the SDP..."
                          rows={2}
                          className="mt-1"
                          disabled={selectedEnrolment.monitoringReport !== undefined}
                        />
                      </div>
                      
                      {canSubmitEvaluationReport() && (
                        <Button 
                          onClick={handleSubmitEvaluationReport}
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700 w-full"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Submit Monitoring Report
                        </Button>
                      )}
                      
                      {selectedEnrolment.monitoringReport && (
                        <div className="bg-purple-50 p-4 rounded-lg mt-4">
                          <p className="text-purple-800 font-medium">✓ Monitoring Report Completed</p>
                          <p className="text-sm text-gray-600">Overall Rating: {selectedEnrolment.monitoringReport.overallRating}</p>
                          <p className="text-sm text-gray-600">Average Score: {calculateAverageRating()}/5</p>
                          {selectedEnrolment.monitoringReport.documentUrl && (
                            <a href={selectedEnrolment.monitoringReport.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2 mt-2">
                              <FileText className="h-4 w-4" />
                              View Monitoring Report
                            </a>
                          )}
                          <p className="text-xs text-gray-500 mt-2">Submitted on: {safeFormatDateTime(selectedEnrolment.monitoringReport.submittedAt)}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Display existing monitoring plan */}
                  {selectedEnrolment.monitoringPlan && (
                    <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
                      <h4 className="font-medium text-gray-800">Monitoring Plan</h4>
                      <a href={selectedEnrolment.monitoringPlan.documentUrl} target="_blank" className="text-blue-600 hover:underline flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {selectedEnrolment.monitoringPlan.documentName}
                      </a>
                      {selectedEnrolment.monitoringPlan.notes && (
                        <p className="text-sm text-gray-600">Notes: {selectedEnrolment.monitoringPlan.notes}</p>
                      )}
                      <p className="text-xs text-gray-500">Submitted on: {safeFormatDateTime(selectedEnrolment.monitoringPlan.uploadedAt)}</p>
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

export default MonitoringSkillsProgrammes;