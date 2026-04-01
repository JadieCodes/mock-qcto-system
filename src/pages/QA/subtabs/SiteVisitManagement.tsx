import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { Eye, FileText, Camera, Upload, CheckCircle, XCircle, Clock, User, Send,Calendar,Users,ClipboardList } from 'lucide-react';
import type { LearnerEnrolment, LearnerEnrolmentStatus, LearnerSiteVisitReport } from '@/types';

// Site Visit Checklist Interface (matching LearnerSiteVisitReport)
interface ChecklistItem {
  id: string;
  criteria: string;
  description: string;
  isMet: boolean;
  comments: string;
  evidenceIds: string[];
}

// Evidence Interface (matching LearnerSiteVisitReport)
interface Evidence {
  id: string;
  type: 'photo' | 'document';
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  description: string;
}

const SiteVisitManagement = () => {
  const { currentUser, enrolments, updateEnrolment } = useApp();
  const [selectedEnrolment, setSelectedEnrolment] = useState<LearnerEnrolment | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Site Visit Evaluation Tool State
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', criteria: 'Infrastructure & Facilities', description: 'Training facilities meet requirements (classrooms, equipment, safety)', isMet: false, comments: '', evidenceIds: [] },
    { id: '2', criteria: 'Trainer Qualifications', description: 'Trainers possess required qualifications and experience', isMet: false, comments: '', evidenceIds: [] },
    { id: '3', criteria: 'Learning Materials', description: 'Learning materials are available and up to date', isMet: false, comments: '', evidenceIds: [] },
    { id: '4', criteria: 'Assessment Methods', description: 'Assessment methods are appropriate and valid', isMet: false, comments: '', evidenceIds: [] },
    { id: '5', criteria: 'Learner Support', description: 'Adequate learner support services are in place', isMet: false, comments: '', evidenceIds: [] },
    { id: '6', criteria: 'Record Keeping', description: 'Proper record keeping systems are maintained', isMet: false, comments: '', evidenceIds: [] },
    { id: '7', criteria: 'Quality Management', description: 'Quality management systems are implemented', isMet: false, comments: '', evidenceIds: [] },
    { id: '8', criteria: 'Health & Safety', description: 'Health and safety measures are in place', isMet: false, comments: '', evidenceIds: [] },
  ]);
  
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [summary, setSummary] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [overallCompliance, setOverallCompliance] = useState<'compliant' | 'partially_compliant' | 'non_compliant'>('compliant');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [nextSteps, setNextSteps] = useState('');
  
  // Upload states
  const [uploading, setUploading] = useState(false);
  const [currentEvidenceDescription, setCurrentEvidenceDescription] = useState('');
  const [currentEvidenceType, setCurrentEvidenceType] = useState<'photo' | 'document'>('photo');
  
  // Filter enrolments ready for site visit (Plans Consolidated)
  const pendingSiteVisits = enrolments.filter(e => 
    e.status === 'Plans Consolidated'
  );

  const viewEnrolment = (enrolment: LearnerEnrolment) => {
    setSelectedEnrolment(enrolment);
    setIsViewModalOpen(true);
    setActiveTab('details');
    
    // Reset site visit tool if not completed
    if (!enrolment.siteVisit?.report) {
      resetSiteVisitTool();
    } else {
      // Load existing report if any
      loadExistingReport(enrolment.siteVisit.report);
    }
  };

  const resetSiteVisitTool = () => {
    setChecklist(checklist.map(item => ({ ...item, isMet: false, comments: '', evidenceIds: [] })));
    setEvidence([]);
    setSummary('');
    setRecommendations('');
    setOverallCompliance('compliant');
    setRiskLevel('low');
    setNextSteps('');
    setCurrentEvidenceDescription('');
  };

  const loadExistingReport = (report: LearnerSiteVisitReport) => {
    // Convert the report's checklist to our ChecklistItem format
    const loadedChecklist = report.checklist.map(item => ({
      ...item,
      description: item.description || '' // Ensure description exists
    }));
    setChecklist(loadedChecklist);
    setEvidence(report.evidence);
    setSummary(report.summary);
    setRecommendations(report.recommendations);
    setOverallCompliance(report.overallCompliance);
    setRiskLevel(report.riskLevel);
    setNextSteps(report.nextSteps);
  };

  const handleChecklistChange = (itemId: string, isMet: boolean) => {
    setChecklist(prev => prev.map(item =>
      item.id === itemId ? { ...item, isMet } : item
    ));
  };

  const handleCommentChange = (itemId: string, comments: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === itemId ? { ...item, comments } : item
    ));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const newEvidence: Evidence = {
        id: `ev-${Date.now()}-${Math.random()}`,
        type: currentEvidenceType,
        fileName: file.name,
        fileUrl: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        description: currentEvidenceDescription || `${currentEvidenceType === 'photo' ? 'Photo' : 'Document'} evidence`,
      };
      setEvidence(prev => [...prev, newEvidence]);
    }
    
    setUploading(false);
    setCurrentEvidenceDescription('');
  };

  const generateReport = (): LearnerSiteVisitReport => {
    const metCount = checklist.filter(item => item.isMet).length;
    const totalCount = checklist.length;
    const compliancePercentage = (metCount / totalCount) * 100;
    
    let determinedCompliance: 'compliant' | 'partially_compliant' | 'non_compliant' = overallCompliance;
    let determinedRisk: 'low' | 'medium' | 'high' = riskLevel;
    
    // Auto-calculate based on checklist if not manually set
    if (compliancePercentage >= 80) {
      determinedCompliance = 'compliant';
      determinedRisk = 'low';
    } else if (compliancePercentage >= 60) {
      determinedCompliance = 'partially_compliant';
      determinedRisk = 'medium';
    } else {
      determinedCompliance = 'non_compliant';
      determinedRisk = 'high';
    }
    
    return {
      id: `report-${Date.now()}`,
      conductedBy: currentUser.name,
      conductedAt: new Date().toISOString(),
      checklist,
      evidence,
      summary,
      recommendations,
      overallCompliance: determinedCompliance,
      riskLevel: determinedRisk,
      nextSteps,
    };
  };

  const handleSubmitReport = () => {
    if (!selectedEnrolment) return;
    
    setIsSubmitting(true);
    
    const report = generateReport();
    
    // Generate a JSON report (simulated)
    const reportBlob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const reportUrl = URL.createObjectURL(reportBlob);
    
    updateEnrolment(selectedEnrolment.id, {
      siteVisit: {
        ...selectedEnrolment.siteVisit,
        status: 'completed',
        report: report,
        reportUrl: reportUrl,
        completedAt: new Date().toISOString(),
        notes: summary.substring(0, 200), // Store first 200 chars as notes
      },
      status: 'Site Visit Completed' as LearnerEnrolmentStatus
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
  const config = statusConfig[status] || statusConfig['Plans Consolidated'];
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

  const calculateComplianceScore = () => {
    const metCount = checklist.filter(item => item.isMet).length;
    const totalCount = checklist.length;
    return Math.round((metCount / totalCount) * 100);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">Site Visit Management</h3>
      <p className="text-gray-600">Conduct site visits using the Site Visit Evaluation Tool</p>
      
      {pendingSiteVisits.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mt-4">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-gray-900">Pending Site Visits</h4>
            <p className="text-sm text-gray-500">Enrolments ready for site visit evaluation</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrolment ID</TableHead>
                <TableHead>Learner Name</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Training Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSiteVisits.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">{enrolment.enrolmentId}</TableCell>
                  <TableCell>{`${enrolment.learnerDetails.firstName} ${enrolment.learnerDetails.lastName}`}</TableCell>
                  <TableCell>{enrolment.qualification.name}</TableCell>
                  <TableCell>{enrolment.enrolmentDetails.learningProgramme}</TableCell>
                  <TableCell>{getStatusBadge(enrolment.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => viewEnrolment(enrolment)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Conduct Site Visit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-4 text-center text-gray-500">
          No pending site visits. All enrolments are up to date.
        </div>
      )}

      {/* Site Visit Evaluation Tool Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Site Visit Evaluation Tool</DialogTitle>
          </DialogHeader>
          
          {selectedEnrolment && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Enrolment Details</TabsTrigger>
                <TabsTrigger value="checklist">Checklist & Evidence</TabsTrigger>
                <TabsTrigger value="reporting">Reporting</TabsTrigger>
                <TabsTrigger value="summary">Summary & Submit</TabsTrigger>
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
                  <h3 className="text-lg font-semibold text-gray-900">Training Details</h3>
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div><Label className="text-sm text-gray-500">Qualification</Label><p className="font-medium">{selectedEnrolment.qualification.name}</p></div>
                    <div><Label className="text-sm text-gray-500">NQF Level</Label><p className="font-medium">{selectedEnrolment.qualification.nqfLevel}</p></div>
                    <div><Label className="text-sm text-gray-500">Learning Programme</Label><p className="font-medium">{selectedEnrolment.enrolmentDetails.learningProgramme}</p></div>
                    <div><Label className="text-sm text-gray-500">Delivery Mode</Label><p className="font-medium">{selectedEnrolment.enrolmentDetails.deliveryMode}</p></div>
                    <div><Label className="text-sm text-gray-500">Start Date</Label><p className="font-medium">{safeFormatDate(selectedEnrolment.enrolmentDetails.startDate)}</p></div>
                    <div><Label className="text-sm text-gray-500">End Date</Label><p className="font-medium">{safeFormatDate(selectedEnrolment.enrolmentDetails.endDate)}</p></div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Tab 2: Checklist & Evidence */}
              <TabsContent value="checklist" className="space-y-6 py-4">
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Site Visit Evaluation Checklist</h3>
                    <p className="text-sm text-gray-600">Complete all checklist items and upload supporting evidence</p>
                  </div>
                  
                  {checklist.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <Checkbox
                          id={item.id}
                          checked={item.isMet}
                          onCheckedChange={(checked) => handleChecklistChange(item.id, checked === true)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor={item.id} className="font-semibold text-gray-900">
                            {item.criteria}
                          </Label>
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        </div>
                      </div>
                      
                      <div className="ml-6 space-y-3">
                        <Textarea
                          placeholder="Add comments/observations..."
                          value={item.comments}
                          onChange={(e) => handleCommentChange(item.id, e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                        
                        {item.evidenceIds.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.evidenceIds.map(evId => {
                              const ev = evidence.find(e => e.id === evId);
                              return ev ? (
                                <div key={ev.id} className="flex items-center gap-2 bg-gray-50 p-1 rounded">
                                  {ev.type === 'photo' ? <Camera className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                  <a href={ev.fileUrl} target="_blank" className="text-xs text-blue-600 hover:underline">
                                    {ev.fileName}
                                  </a>
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Evidence Upload Section */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Upload Evidence</h4>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button
                          variant={currentEvidenceType === 'photo' ? 'default' : 'outline'}
                          onClick={() => setCurrentEvidenceType('photo')}
                          className="flex-1"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Photos
                        </Button>
                        <Button
                          variant={currentEvidenceType === 'document' ? 'default' : 'outline'}
                          onClick={() => setCurrentEvidenceType('document')}
                          className="flex-1"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Documents
                        </Button>
                      </div>
                      
                      <Input
                        placeholder="Description of evidence..."
                        value={currentEvidenceDescription}
                        onChange={(e) => setCurrentEvidenceDescription(e.target.value)}
                      />
                      
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept={currentEvidenceType === 'photo' ? 'image/*' : '.pdf,.doc,.docx'}
                          onChange={handleFileUpload}
                          multiple
                          className="flex-1"
                        />
                        <Button variant="outline" disabled={uploading}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                      
                      {evidence.length > 0 && (
                        <div className="mt-3">
                          <Label>Uploaded Evidence:</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {evidence.map(ev => (
                              <div key={ev.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                                {ev.type === 'photo' ? <Camera className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                <a href={ev.fileUrl} target="_blank" className="text-sm text-blue-600 hover:underline flex-1">
                                  {ev.fileName}
                                </a>
                                <span className="text-xs text-gray-500">{ev.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Tab 3: Reporting */}
              <TabsContent value="reporting" className="space-y-6 py-4">
                <div className="space-y-6">
                  <div>
                    <Label>Overall Summary of Findings *</Label>
                    <Textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Provide a comprehensive summary of the site visit findings..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label>Recommendations *</Label>
                    <Textarea
                      value={recommendations}
                      onChange={(e) => setRecommendations(e.target.value)}
                      placeholder="Provide recommendations based on findings..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Overall Compliance</Label>
                      <select
                        value={overallCompliance}
                        onChange={(e) => setOverallCompliance(e.target.value as any)}
                        className="w-full p-2 border rounded-md mt-1"
                      >
                        <option value="compliant">Compliant</option>
                        <option value="partially_compliant">Partially Compliant</option>
                        <option value="non_compliant">Non-Compliant</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label>Risk Level</Label>
                      <select
                        value={riskLevel}
                        onChange={(e) => setRiskLevel(e.target.value as any)}
                        className="w-full p-2 border rounded-md mt-1"
                      >
                        <option value="low">Low Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="high">High Risk</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Next Steps / Action Plan</Label>
                    <Textarea
                      value={nextSteps}
                      onChange={(e) => setNextSteps(e.target.value)}
                      placeholder="Outline the next steps and action plan..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Tab 4: Summary & Submit */}
              <TabsContent value="summary" className="space-y-6 py-4">
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Site Visit Report Summary</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{calculateComplianceScore()}%</div>
                      <div className="text-sm text-gray-600">Compliance Score</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center">
                      <div className={`text-2xl font-bold ${
                        overallCompliance === 'compliant' ? 'text-green-600' :
                        overallCompliance === 'partially_compliant' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {overallCompliance === 'compliant' ? '✓ Compliant' :
                         overallCompliance === 'partially_compliant' ? '⚠ Partially Compliant' : '✗ Non-Compliant'}
                      </div>
                      <div className="text-sm text-gray-600">Overall Status</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="font-semibold">Checklist Summary:</Label>
                      <div className="mt-1">
                        {checklist.filter(item => item.isMet).length} of {checklist.length} criteria met
                      </div>
                    </div>
                    
                    <div>
                      <Label className="font-semibold">Evidence Uploaded:</Label>
                      <div className="mt-1">{evidence.length} items uploaded</div>
                    </div>
                    
                    <div>
                      <Label className="font-semibold">Risk Level:</Label>
                      <div className={`mt-1 font-medium ${
                        riskLevel === 'low' ? 'text-green-600' :
                        riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {riskLevel === 'low' ? 'Low Risk' : riskLevel === 'medium' ? 'Medium Risk' : 'High Risk'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitReport}
                    disabled={isSubmitting || !summary || !recommendations}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Site Visit Report
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SiteVisitManagement;